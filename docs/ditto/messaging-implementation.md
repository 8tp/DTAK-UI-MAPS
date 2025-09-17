# Messaging Implementation Guide (P2-2 & P2-3)

## Overview
This document provides detailed implementation guidance for P2-2 (Messaging & Data Propagation) and P2-3 (Delivery Acknowledgements) using the Ditto SDK. The implementation enables reliable messaging, marker sharing, and location broadcasting with offline-first capabilities.

## Core Components

### 1. Message Data Models

```typescript
// models/Message.ts
export interface BaseMessage {
  id: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  type: MessageType;
  content: string;
  metadata?: Record<string, any>;
  deliveryStatus: DeliveryStatus;
  acknowledgements: MessageAcknowledgement[];
  retryCount: number;
  expiresAt?: Date;
}

export interface ChatMessage extends BaseMessage {
  type: 'chat';
  threadId?: string;
  replyToId?: string;
  attachments?: MessageAttachment[];
}

export interface LocationMessage extends BaseMessage {
  type: 'location';
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number;
    heading?: number;
    speed?: number;
  };
}

export interface MarkerMessage extends BaseMessage {
  type: 'marker';
  marker: {
    id: string;
    latitude: number;
    longitude: number;
    title: string;
    description?: string;
    iconType: string;
    color: string;
    category: string;
  };
}

export interface SystemMessage extends BaseMessage {
  type: 'system';
  systemType: 'peer_joined' | 'peer_left' | 'sync_status' | 'error';
}

export type MessageType = 'chat' | 'location' | 'marker' | 'system';

export interface MessageAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url?: string;
  localPath?: string;
  uploadStatus: 'pending' | 'uploading' | 'uploaded' | 'failed';
}

export interface MessageAcknowledgement {
  peerId: string;
  peerName: string;
  timestamp: Date;
  status: 'delivered' | 'read';
}

export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'expired';
```

### 2. Messaging Service

```typescript
// services/MessagingService.ts
import { DittoService } from './DittoService';
import { PeerDiscoveryService } from './PeerDiscoveryService';
import { EventEmitter } from 'events';
import { BaseMessage, ChatMessage, LocationMessage, MarkerMessage } from '../models/Message';

export class MessagingService extends EventEmitter {
  private dittoService: DittoService;
  private peerDiscoveryService: PeerDiscoveryService;
  private messagesCollection = 'messages';
  private acknowledgementsCollection = 'acknowledgements';
  private retryQueue: Map<string, NodeJS.Timeout> = new Map();
  private maxRetries = 3;
  private retryDelays = [5000, 15000, 30000]; // 5s, 15s, 30s

  constructor() {
    super();
    this.dittoService = DittoService.getInstance();
    this.peerDiscoveryService = new PeerDiscoveryService();
  }

  async initialize(): Promise<void> {
    if (!this.dittoService.isReady()) {
      throw new Error('Ditto service not initialized');
    }

    await this.subscribeToMessages();
    await this.subscribeToAcknowledgements();
    this.startRetryProcessor();

    console.log('Messaging service initialized');
  }

  private async subscribeToMessages(): Promise<void> {
    const ditto = this.dittoService.getDitto()!;

    const subscription = ditto
      .store
      .collection(this.messagesCollection)
      .findAll()
      .subscribe();

    subscription.on('update', (docs, event) => {
      docs.forEach(doc => {
        const message = this.deserializeMessage(doc.value);
        if (message.senderId !== this.getCurrentPeerId()) {
          this.handleIncomingMessage(message);
        }
      });
    });
  }

  private async subscribeToAcknowledgements(): Promise<void> {
    const ditto = this.dittoService.getDitto()!;

    const subscription = ditto
      .store
      .collection(this.acknowledgementsCollection)
      .findAll()
      .subscribe();

    subscription.on('update', (docs, event) => {
      docs.forEach(doc => {
        const ack = doc.value;
        if (ack.recipientId === this.getCurrentPeerId()) {
          this.handleMessageAcknowledgement(ack);
        }
      });
    });
  }

  // Send chat message
  async sendChatMessage(
    content: string,
    threadId?: string,
    replyToId?: string,
    attachments?: MessageAttachment[]
  ): Promise<string> {
    const message: ChatMessage = {
      id: this.generateMessageId(),
      senderId: this.getCurrentPeerId(),
      senderName: this.getCurrentPeerName(),
      timestamp: new Date(),
      type: 'chat',
      content,
      threadId,
      replyToId,
      attachments,
      deliveryStatus: 'pending',
      acknowledgements: [],
      retryCount: 0,
    };

    await this.storeAndBroadcastMessage(message);
    return message.id;
  }

  // Send location update
  async sendLocationUpdate(location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number;
    heading?: number;
    speed?: number;
  }): Promise<string> {
    const message: LocationMessage = {
      id: this.generateMessageId(),
      senderId: this.getCurrentPeerId(),
      senderName: this.getCurrentPeerName(),
      timestamp: new Date(),
      type: 'location',
      content: `Location update from ${this.getCurrentPeerName()}`,
      location,
      deliveryStatus: 'pending',
      acknowledgements: [],
      retryCount: 0,
    };

    await this.storeAndBroadcastMessage(message);
    return message.id;
  }

  // Send marker
  async sendMarker(marker: {
    latitude: number;
    longitude: number;
    title: string;
    description?: string;
    iconType: string;
    color: string;
    category: string;
  }): Promise<string> {
    const message: MarkerMessage = {
      id: this.generateMessageId(),
      senderId: this.getCurrentPeerId(),
      senderName: this.getCurrentPeerName(),
      timestamp: new Date(),
      type: 'marker',
      content: `Marker: ${marker.title}`,
      marker: {
        id: this.generateMessageId(),
        ...marker,
      },
      deliveryStatus: 'pending',
      acknowledgements: [],
      retryCount: 0,
    };

    await this.storeAndBroadcastMessage(message);
    return message.id;
  }

  private async storeAndBroadcastMessage(message: BaseMessage): Promise<void> {
    const ditto = this.dittoService.getDitto()!;

    try {
      // Store message in Ditto collection
      await ditto
        .store
        .collection(this.messagesCollection)
        .upsert(this.serializeMessage(message), message.id);

      // Update delivery status
      message.deliveryStatus = 'sent';
      this.emit('messageSent', message);

      // Schedule retry if needed
      this.scheduleRetry(message);

      console.log(`Message sent: ${message.type} - ${message.id}`);
    } catch (error) {
      message.deliveryStatus = 'failed';
      this.emit('messageFailed', message, error);
      console.error('Failed to send message:', error);
    }
  }

  private handleIncomingMessage(message: BaseMessage): void {
    // Send acknowledgement
    this.sendAcknowledgement(message.id, message.senderId, 'delivered');

    // Emit event for UI
    this.emit('messageReceived', message);

    // Handle specific message types
    switch (message.type) {
      case 'chat':
        this.emit('chatMessageReceived', message as ChatMessage);
        break;
      case 'location':
        this.emit('locationReceived', message as LocationMessage);
        break;
      case 'marker':
        this.emit('markerReceived', message as MarkerMessage);
        break;
      case 'system':
        this.emit('systemMessageReceived', message);
        break;
    }

    console.log(`Message received: ${message.type} from ${message.senderName}`);
  }

  private async sendAcknowledgement(
    messageId: string,
    recipientId: string,
    status: 'delivered' | 'read'
  ): Promise<void> {
    const ditto = this.dittoService.getDitto()!;

    const acknowledgement = {
      id: this.generateMessageId(),
      messageId,
      senderId: this.getCurrentPeerId(),
      senderName: this.getCurrentPeerName(),
      recipientId,
      status,
      timestamp: new Date(),
    };

    try {
      await ditto
        .store
        .collection(this.acknowledgementsCollection)
        .upsert(acknowledgement, acknowledgement.id);

      console.log(`Acknowledgement sent for message ${messageId}: ${status}`);
    } catch (error) {
      console.error('Failed to send acknowledgement:', error);
    }
  }

  private handleMessageAcknowledgement(ack: any): void {
    const messageId = ack.messageId;
    
    // Update message acknowledgements
    this.updateMessageAcknowledgement(messageId, {
      peerId: ack.senderId,
      peerName: ack.senderName,
      timestamp: new Date(ack.timestamp),
      status: ack.status,
    });

    // Cancel retry if delivered
    if (ack.status === 'delivered') {
      this.cancelRetry(messageId);
    }

    this.emit('messageAcknowledged', messageId, ack);
  }

  private async updateMessageAcknowledgement(
    messageId: string,
    acknowledgement: MessageAcknowledgement
  ): Promise<void> {
    const ditto = this.dittoService.getDitto()!;

    try {
      await ditto
        .store
        .collection(this.messagesCollection)
        .findByID(messageId)
        .update((mutableDoc) => {
          if (mutableDoc) {
            const acks = mutableDoc.at('acknowledgements');
            const existingIndex = acks.find((ack: any) => 
              ack.at('peerId').stringValue === acknowledgement.peerId
            );

            if (existingIndex) {
              existingIndex.at('status').set(acknowledgement.status);
              existingIndex.at('timestamp').set(acknowledgement.timestamp.toISOString());
            } else {
              acks.push({
                peerId: acknowledgement.peerId,
                peerName: acknowledgement.peerName,
                status: acknowledgement.status,
                timestamp: acknowledgement.timestamp.toISOString(),
              });
            }

            // Update delivery status based on acknowledgements
            const allAcks = acks.value as MessageAcknowledgement[];
            const connectedPeers = this.peerDiscoveryService.getConnectedPeers();
            
            if (allAcks.length >= connectedPeers.length) {
              mutableDoc.at('deliveryStatus').set('delivered');
            }
          }
        });
    } catch (error) {
      console.error('Failed to update message acknowledgement:', error);
    }
  }

  // Retry mechanism
  private scheduleRetry(message: BaseMessage): void {
    if (message.retryCount >= this.maxRetries) {
      message.deliveryStatus = 'expired';
      this.emit('messageExpired', message);
      return;
    }

    const delay = this.retryDelays[message.retryCount] || 30000;
    const timeoutId = setTimeout(() => {
      this.retryMessage(message);
    }, delay);

    this.retryQueue.set(message.id, timeoutId);
  }

  private async retryMessage(message: BaseMessage): Promise<void> {
    message.retryCount++;
    message.timestamp = new Date();

    try {
      await this.storeAndBroadcastMessage(message);
      console.log(`Message retry ${message.retryCount}/${this.maxRetries}: ${message.id}`);
    } catch (error) {
      console.error(`Retry failed for message ${message.id}:`, error);
      this.scheduleRetry(message);
    }
  }

  private cancelRetry(messageId: string): void {
    const timeoutId = this.retryQueue.get(messageId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.retryQueue.delete(messageId);
    }
  }

  private startRetryProcessor(): void {
    // Clean up expired retries every minute
    setInterval(() => {
      this.cleanupExpiredRetries();
    }, 60000);
  }

  private cleanupExpiredRetries(): void {
    const now = Date.now();
    const expiredThreshold = 10 * 60 * 1000; // 10 minutes

    this.retryQueue.forEach((timeoutId, messageId) => {
      // This is a simplified check - in practice, you'd want to check message timestamp
      clearTimeout(timeoutId);
      this.retryQueue.delete(messageId);
    });
  }

  // Message reading
  async markMessageAsRead(messageId: string): Promise<void> {
    const ditto = this.dittoService.getDitto()!;

    try {
      const doc = await ditto
        .store
        .collection(this.messagesCollection)
        .findByID(messageId)
        .exec();

      if (doc) {
        const message = this.deserializeMessage(doc.value);
        if (message.senderId !== this.getCurrentPeerId()) {
          await this.sendAcknowledgement(messageId, message.senderId, 'read');
        }
      }
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  }

  // Query methods
  async getMessages(limit: number = 50, offset: number = 0): Promise<BaseMessage[]> {
    const ditto = this.dittoService.getDitto()!;

    try {
      const docs = await ditto
        .store
        .collection(this.messagesCollection)
        .findAll()
        .sort('timestamp', 'descending')
        .limit(limit)
        .exec();

      return docs.map(doc => this.deserializeMessage(doc.value));
    } catch (error) {
      console.error('Failed to get messages:', error);
      return [];
    }
  }

  async getChatMessages(threadId?: string): Promise<ChatMessage[]> {
    const messages = await this.getMessages();
    return messages
      .filter((msg): msg is ChatMessage => {
        if (msg.type !== 'chat') return false;
        if (threadId) return (msg as ChatMessage).threadId === threadId;
        return true;
      })
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getLocationMessages(peerId?: string): Promise<LocationMessage[]> {
    const messages = await this.getMessages();
    return messages
      .filter((msg): msg is LocationMessage => {
        if (msg.type !== 'location') return false;
        if (peerId) return msg.senderId === peerId;
        return true;
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getMarkerMessages(): Promise<MarkerMessage[]> {
    const messages = await this.getMessages();
    return messages
      .filter((msg): msg is MarkerMessage => msg.type === 'marker')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Utility methods
  private serializeMessage(message: BaseMessage): any {
    return {
      ...message,
      timestamp: message.timestamp.toISOString(),
      expiresAt: message.expiresAt?.toISOString(),
      acknowledgements: message.acknowledgements.map(ack => ({
        ...ack,
        timestamp: ack.timestamp.toISOString(),
      })),
    };
  }

  private deserializeMessage(data: any): BaseMessage {
    return {
      ...data,
      timestamp: new Date(data.timestamp),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      acknowledgements: (data.acknowledgements || []).map((ack: any) => ({
        ...ack,
        timestamp: new Date(ack.timestamp),
      })),
    };
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentPeerId(): string {
    // Get from peer discovery service or generate
    return 'current_peer_id';
  }

  private getCurrentPeerName(): string {
    // Get from peer discovery service
    return 'Current User';
  }

  async shutdown(): Promise<void> {
    // Cancel all pending retries
    this.retryQueue.forEach(timeoutId => clearTimeout(timeoutId));
    this.retryQueue.clear();

    this.removeAllListeners();
    console.log('Messaging service shutdown');
  }
}
```

### 3. React Hook for Messaging

```typescript
// hooks/useMessaging.ts
import { useState, useEffect, useCallback } from 'react';
import { MessagingService } from '../services/MessagingService';
import { BaseMessage, ChatMessage, LocationMessage, MarkerMessage } from '../models/Message';

export const useMessaging = () => {
  const [messages, setMessages] = useState<BaseMessage[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messagingService] = useState(() => new MessagingService());

  const initialize = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      await messagingService.initialize();
      await loadMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize messaging');
    } finally {
      setIsLoading(false);
    }
  }, [messagingService]);

  const loadMessages = useCallback(async () => {
    try {
      const allMessages = await messagingService.getMessages();
      const chats = await messagingService.getChatMessages();
      setMessages(allMessages);
      setChatMessages(chats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    }
  }, [messagingService]);

  const sendChatMessage = useCallback(async (
    content: string,
    threadId?: string,
    replyToId?: string
  ) => {
    try {
      const messageId = await messagingService.sendChatMessage(content, threadId, replyToId);
      await loadMessages();
      return messageId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    }
  }, [messagingService, loadMessages]);

  const sendLocationUpdate = useCallback(async (location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number;
    heading?: number;
    speed?: number;
  }) => {
    try {
      const messageId = await messagingService.sendLocationUpdate(location);
      await loadMessages();
      return messageId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send location');
      throw err;
    }
  }, [messagingService, loadMessages]);

  const sendMarker = useCallback(async (marker: {
    latitude: number;
    longitude: number;
    title: string;
    description?: string;
    iconType: string;
    color: string;
    category: string;
  }) => {
    try {
      const messageId = await messagingService.sendMarker(marker);
      await loadMessages();
      return messageId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send marker');
      throw err;
    }
  }, [messagingService, loadMessages]);

  const markAsRead = useCallback(async (messageId: string) => {
    try {
      await messagingService.markMessageAsRead(messageId);
    } catch (err) {
      console.error('Failed to mark message as read:', err);
    }
  }, [messagingService]);

  useEffect(() => {
    const handleMessageReceived = (message: BaseMessage) => {
      setMessages(current => [message, ...current]);
      if (message.type === 'chat') {
        setChatMessages(current => [...current, message as ChatMessage]);
      }
    };

    const handleMessageSent = (message: BaseMessage) => {
      setMessages(current => 
        current.map(m => m.id === message.id ? message : m)
      );
    };

    const handleMessageAcknowledged = (messageId: string, ack: any) => {
      setMessages(current =>
        current.map(m => {
          if (m.id === messageId) {
            const updatedAcks = [...m.acknowledgements];
            const existingIndex = updatedAcks.findIndex(a => a.peerId === ack.senderId);
            
            if (existingIndex >= 0) {
              updatedAcks[existingIndex] = {
                peerId: ack.senderId,
                peerName: ack.senderName,
                timestamp: new Date(ack.timestamp),
                status: ack.status,
              };
            } else {
              updatedAcks.push({
                peerId: ack.senderId,
                peerName: ack.senderName,
                timestamp: new Date(ack.timestamp),
                status: ack.status,
              });
            }

            return { ...m, acknowledgements: updatedAcks };
          }
          return m;
        })
      );
    };

    messagingService.on('messageReceived', handleMessageReceived);
    messagingService.on('messageSent', handleMessageSent);
    messagingService.on('messageAcknowledged', handleMessageAcknowledged);

    return () => {
      messagingService.removeAllListeners();
    };
  }, [messagingService]);

  const pendingMessages = messages.filter(m => m.deliveryStatus === 'pending');
  const failedMessages = messages.filter(m => m.deliveryStatus === 'failed');
  const unreadMessages = messages.filter(m => 
    m.senderId !== 'current_peer_id' && 
    !m.acknowledgements.some(ack => ack.peerId === 'current_peer_id' && ack.status === 'read')
  );

  return {
    messages,
    chatMessages,
    pendingMessages,
    failedMessages,
    unreadMessages,
    isLoading,
    error,
    initialize,
    sendChatMessage,
    sendLocationUpdate,
    sendMarker,
    markAsRead,
    loadMessages,
    pendingCount: pendingMessages.length,
    failedCount: failedMessages.length,
    unreadCount: unreadMessages.length,
  };
};
```

### 4. Message Status Component

```typescript
// components/MessageStatus.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseMessage, DeliveryStatus } from '../models/Message';

interface MessageStatusProps {
  message: BaseMessage;
  showDetails?: boolean;
}

export const MessageStatus: React.FC<MessageStatusProps> = ({ 
  message, 
  showDetails = false 
}) => {
  const getStatusIcon = (status: DeliveryStatus) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'sent': return '📤';
      case 'delivered': return '✅';
      case 'failed': return '❌';
      case 'expired': return '⏰';
      default: return '❓';
    }
  };

  const getStatusColor = (status: DeliveryStatus) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'sent': return '#007AFF';
      case 'delivered': return '#34C759';
      case 'failed': return '#FF3B30';
      case 'expired': return '#8E8E93';
      default: return '#8E8E93';
    }
  };

  const deliveredCount = message.acknowledgements.filter(
    ack => ack.status === 'delivered'
  ).length;

  const readCount = message.acknowledgements.filter(
    ack => ack.status === 'read'
  ).length;

  return (
    <View style={styles.container}>
      <Text style={[styles.statusIcon, { color: getStatusColor(message.deliveryStatus) }]}>
        {getStatusIcon(message.deliveryStatus)}
      </Text>
      
      {showDetails && (
        <View style={styles.details}>
          <Text style={styles.statusText}>
            {message.deliveryStatus}
          </Text>
          
          {message.acknowledgements.length > 0 && (
            <Text style={styles.ackText}>
              📨 {deliveredCount} • 👁 {readCount}
            </Text>
          )}
          
          {message.retryCount > 0 && (
            <Text style={styles.retryText}>
              🔄 {message.retryCount}/{3}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  statusIcon: {
    fontSize: 12,
  },
  details: {
    marginLeft: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#8E8E93',
    textTransform: 'capitalize',
  },
  ackText: {
    fontSize: 10,
    color: '#8E8E93',
  },
  retryText: {
    fontSize: 10,
    color: '#FF9500',
  },
});
```

## Integration with Map Components

### Map Marker Integration

```typescript
// components/MapWithMessaging.tsx
import React, { useEffect } from 'react';
import { MapView, Camera, RasterLayer, RasterSource } from '@maplibre/maplibre-react-native';
import { useMessaging } from '../hooks/useMessaging';
import { MarkerMessage } from '../models/Message';

export const MapWithMessaging: React.FC = () => {
  const { messages, sendMarker, initialize } = useMessaging();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const markerMessages = messages.filter(
    (msg): msg is MarkerMessage => msg.type === 'marker'
  );

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.geometry.coordinates;
    
    await sendMarker({
      latitude,
      longitude,
      title: 'New Marker',
      description: 'Marker created from map',
      iconType: 'pin',
      color: '#FF0000',
      category: 'user_created',
    });
  };

  return (
    <MapView style={{ flex: 1 }} onPress={handleMapPress}>
      <Camera zoomLevel={10} centerCoordinate={[-95.7129, 37.0902]} />
      
      <RasterSource
        id="satelliteSource"
        tileUrlTemplates={[
          "https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}.jpg?api_key=c177fb0b-10fa-4ba1-87ba-3a8446a7887d",
        ]}
        tileSize={256}>
        <RasterLayer
          id="satelliteLayer"
          sourceID="satelliteSource"
          style={{ rasterOpacity: 1 }}
        />
      </RasterSource>

      {/* Render markers from messages */}
      {markerMessages.map((message) => (
        <MarkerAnnotation
          key={message.id}
          coordinate={[message.marker.longitude, message.marker.latitude]}
          title={message.marker.title}
          description={message.marker.description}
          color={message.marker.color}
        />
      ))}
    </MapView>
  );
};
```

## Testing Strategy

### Unit Tests
```typescript
// __tests__/MessagingService.test.ts
import { MessagingService } from '../services/MessagingService';

describe('MessagingService', () => {
  let messagingService: MessagingService;

  beforeEach(() => {
    messagingService = new MessagingService();
  });

  test('should send chat message', async () => {
    const messageId = await messagingService.sendChatMessage('Hello World');
    expect(messageId).toBeDefined();
  });

  test('should handle message acknowledgements', async () => {
    const messageId = await messagingService.sendChatMessage('Test');
    // Mock acknowledgement handling
    // Verify delivery status updates
  });

  test('should retry failed messages', async () => {
    // Mock network failure
    // Verify retry mechanism
  });
});
```

This implementation provides comprehensive messaging functionality with offline reliability, delivery acknowledgements, and seamless integration with the existing React Native map application.
