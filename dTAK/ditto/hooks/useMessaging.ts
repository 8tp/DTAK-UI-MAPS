import { useState, useEffect, useCallback, useMemo } from 'react';
import { MessagingService } from '../services/MessagingService';
import { BaseMessage, ChatMessage, MessageAttachment } from '../types/DittoTypes';

export const useMessaging = () => {
  const [messages, setMessages] = useState<BaseMessage[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messagingService] = useState(() => new MessagingService());

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
  }, [messagingService, loadMessages]);

  const sendChatMessage = useCallback(async (
    content: string,
    threadId?: string,
    replyToId?: string,
    attachments?: MessageAttachment[]
  ) => {
    try {
      const messageId = await messagingService.sendChatMessage(content, threadId, replyToId, attachments);
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

  const selfPeerId = messagingService.getSelfPeerId?.();

  const pendingMessages = useMemo(
    () => messages.filter(m => m.deliveryStatus === 'pending'),
    [messages]
  );

  const failedMessages = useMemo(
    () => messages.filter(m => m.deliveryStatus === 'failed'),
    [messages]
  );

  const unreadMessages = useMemo(
    () => messages.filter(m => 
      (!!selfPeerId ? m.senderId !== selfPeerId : true) &&
      !m.acknowledgements.some(ack => !!selfPeerId && ack.peerId === selfPeerId && ack.status === 'read')
    ),
    [messages, selfPeerId]
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
