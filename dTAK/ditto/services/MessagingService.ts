import { DittoService } from './DittoService';
import { PeerDiscoveryService } from './PeerDiscoveryService';
import { 
  BaseMessage, 
  ChatMessage, 
  LocationMessage, 
  MarkerMessage, 
  SystemMessage,
  MessageAttachment,
  MessageAcknowledgement,
  MessagingEvents,
  DittoEventEmitter 
} from '../types/DittoTypes';

export class MessagingService implements DittoEventEmitter<MessagingEvents> {
  private dittoService: DittoService;
  private peerDiscoveryService: PeerDiscoveryService;
  private messagesCollection = 'messages';
  private acknowledgementsCollection = 'acknowledgements';
  // Use ReturnType<typeof setTimeout> to be compatible across Node and browser/react-native
  private retryQueue: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private maxRetries = 3;
  private retryDelays = [5000, 15000, 30000]; // 5s, 15s, 30s
  private listeners: Map<keyof MessagingEvents, Set<Function>> = new Map();
  private messageSubscription: any = null;
  private ackSubscription: any = null;

  constructor() {
    this.dittoService = DittoService.getInstance();
    this.peerDiscoveryService = new PeerDiscoveryService();
    this.initializeListeners();
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
    try {
      this.messageSubscription = await this.dittoService.subscribeToCollection(
        this.messagesCollection,
        (docs, event) => {
          docs.forEach(doc => {
            try {
              const message = this.deserializeMessage(doc);
              if (message.senderId !== this.getCurrentPeerId()) {
                this.handleIncomingMessage(message);
              }
            } catch (err) {
              console.error('MessagingService: error deserializing incoming message doc', { err, doc });
            }
          });
        }
      );
    } catch (error) {
      console.error('Failed to subscribe to messages:', error);
      throw error;
    }
  }

  private async subscribeToAcknowledgements(): Promise<void> {
    try {
      this.ackSubscription = await this.dittoService.subscribeToCollection(
        this.acknowledgementsCollection,
        (docs, event) => {
          docs.forEach(doc => {
            try {
              const ack = doc;
              if (ack && ack.recipientId === this.getCurrentPeerId()) {
                this.handleMessageAcknowledgement(ack);
              }
            } catch (err) {
              console.error('MessagingService: error handling acknowledgement doc', { err, doc });
            }
          });
        }
      );
    } catch (error) {
      console.error('Failed to subscribe to acknowledgements:', error);
      throw error;
    }
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

  // Send system message
  async sendSystemMessage(
    systemType: 'peer_joined' | 'peer_left' | 'sync_status' | 'error',
    content: string
  ): Promise<string> {
    const message: SystemMessage = {
      id: this.generateMessageId(),
      senderId: this.getCurrentPeerId(),
      senderName: this.getCurrentPeerName(),
      timestamp: new Date(),
      type: 'system',
      content,
      systemType,
      deliveryStatus: 'pending',
      acknowledgements: [],
      retryCount: 0,
    };

    await this.storeAndBroadcastMessage(message);
    return message.id;
  }

  private async storeAndBroadcastMessage(message: BaseMessage): Promise<void> {
    try {
      // Store message in Ditto collection
      await this.dittoService.upsertDocument(
        this.messagesCollection,
        this.serializeMessage(message),
        message.id
      );

      // Update delivery status
      message.deliveryStatus = 'sent';
      this.emit('messageSent', message);

      // Schedule retry if needed
      this.scheduleRetry(message);

      console.log(`Message sent: ${message.type} - ${message.id}`);
    } catch (error) {
      message.deliveryStatus = 'failed';
      this.emit('messageFailed', message, error as Error);
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
        this.emit('systemMessageReceived', message as SystemMessage);
        break;
    }

    console.log(`Message received: ${message.type} from ${message.senderName}`);
  }

  private async sendAcknowledgement(
    messageId: string,
    recipientId: string,
    status: 'delivered' | 'read'
  ): Promise<void> {
    const acknowledgement = {
      id: this.generateMessageId(),
      messageId,
      senderId: this.getCurrentPeerId(),
      senderName: this.getCurrentPeerName(),
      recipientId,
      status,
      timestamp: new Date().toISOString(),
    };

    try {
      await this.dittoService.upsertDocument(
        this.acknowledgementsCollection,
        acknowledgement,
        acknowledgement.id
      );

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
    try {
      const store = await this.dittoService.getStore();
      const collection = store.collection(this.messagesCollection);
      
      await collection
        .findByID(messageId)
        .update((mutableDoc) => {
          if (mutableDoc) {
            const acks = mutableDoc.at('acknowledgements');
            const existingAckIndex = acks.value?.findIndex((ack: any) => 
              ack.peerId === acknowledgement.peerId
            );

            if (existingAckIndex !== undefined && existingAckIndex >= 0) {
              acks.at(existingAckIndex).at('status').set(acknowledgement.status);
              acks.at(existingAckIndex).at('timestamp').set(acknowledgement.timestamp.toISOString());
            } else {
              // Mutable document paths in Ditto don't provide a direct push on the path.
              // Read the current array, append, then set the full array back.
              const currentAcks = Array.isArray(acks.value) ? [...acks.value] : [];
              currentAcks.push({
                peerId: acknowledgement.peerId,
                peerName: acknowledgement.peerName,
                status: acknowledgement.status,
                timestamp: acknowledgement.timestamp.toISOString(),
              });
              acks.set(currentAcks);
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
    // Clean up old retry timeouts
    this.retryQueue.forEach((timeoutId, messageId) => {
      // In a real implementation, you'd check message timestamps
      // For now, we'll keep the timeouts active
    });
  }

  // Message reading
  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      const message = await this.dittoService.findDocument(this.messagesCollection, messageId);
      
      if (message && message.senderId !== this.getCurrentPeerId()) {
        await this.sendAcknowledgement(messageId, message.senderId, 'read');
      }
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  }

  // Query methods
  async getMessages(limit: number = 50, offset: number = 0): Promise<BaseMessage[]> {
    try {
      const docs = await this.dittoService.findAllDocuments(this.messagesCollection);
      return docs
        .map(doc => this.deserializeMessage(doc))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(offset, offset + limit);
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
    return this.peerDiscoveryService.getLocalPeerId();
  }

  private getCurrentPeerName(): string {
    return this.peerDiscoveryService.getLocalPeerName();
  }

  async shutdown(): Promise<void> {
    try {
      // Cancel all pending retries
      this.retryQueue.forEach(timeoutId => clearTimeout(timeoutId));
      this.retryQueue.clear();

      // Cancel subscriptions
      if (this.messageSubscription) {
        this.messageSubscription.cancel?.();
        this.messageSubscription = null;
      }

      if (this.ackSubscription) {
        this.ackSubscription.cancel?.();
        this.ackSubscription = null;
      }

      this.removeAllListeners();
      console.log('Messaging service shutdown');
    } catch (error) {
      console.error('Error shutting down messaging service:', error);
    }
  }

  // Event emitter implementation
  private initializeListeners(): void {
    this.listeners.set('messageReceived', new Set());
    this.listeners.set('messageSent', new Set());
    this.listeners.set('messageFailed', new Set());
    this.listeners.set('messageAcknowledged', new Set());
    this.listeners.set('messageExpired', new Set());
    this.listeners.set('chatMessageReceived', new Set());
    this.listeners.set('locationReceived', new Set());
    this.listeners.set('markerReceived', new Set());
    this.listeners.set('systemMessageReceived', new Set());
  }

  on<K extends keyof MessagingEvents>(event: K, listener: MessagingEvents[K]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.add(listener as Function);
    }
  }

  off<K extends keyof MessagingEvents>(event: K, listener: MessagingEvents[K]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener as Function);
    }
  }

  emit<K extends keyof MessagingEvents>(
    event: K, 
    ...args: Parameters<MessagingEvents[K] extends (...args: any[]) => any ? MessagingEvents[K] : never>
  ): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          (listener as Function)(...args);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  removeAllListeners(): void {
    this.listeners.forEach(listeners => listeners.clear());
  }
}
