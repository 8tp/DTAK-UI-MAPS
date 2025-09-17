// Core Ditto Types
export interface DittoConfig {
  appId: string;
  playgroundToken?: string;
  websocketURL?: string;
  enableBluetooth: boolean;
  enableWiFi: boolean;
  enableAWDL: boolean;
  // Optional explicit working directory for Ditto storage. If provided,
  // it will be passed to the Ditto SDK when available to avoid shared
  // file locks during development (simulators) or special testing harnesses.
  workingDir?: string;
}

// Peer Types
export interface Peer {
  id: string;
  displayName: string;
  deviceType: string;
  capabilities: string[];
  lastSeen: Date;
  isConnected: boolean;
  connectionType: 'bluetooth' | 'wifi' | 'cloud';
  signalStrength?: number;
}

export interface PeerPresence {
  peerId: string;
  displayName: string;
  deviceType: string;
  capabilities: string[];
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  };
  status: 'available' | 'busy' | 'away';
  lastUpdate: Date;
}

// Message Types
export type MessageType = 'chat' | 'location' | 'marker' | 'system';
export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'expired';

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

// Sync Types
export interface SyncRecord {
  id: string;
  dataType: 'message' | 'marker' | 'location' | 'mission_data';
  sourceId: string;
  hash: string;
  timestamp: Date;
  syncStatus: 'pending' | 'synced' | 'conflict' | 'failed';
  sources: SyncSource[];
  conflictResolution?: ConflictResolution;
}

export interface SyncSource {
  type: 'mesh' | 'tak_server' | 'local';
  peerId?: string;
  serverId?: string;
  timestamp: Date;
  version: number;
}

export interface ConflictResolution {
  strategy: 'last_write_wins' | 'merge' | 'manual';
  resolvedBy: string;
  resolvedAt: Date;
  originalVersions: any[];
  resolvedVersion: any;
}

// Event Types
export interface DittoServiceEvents {
  initialized: () => void;
  error: (error: Error) => void;
  shutdown: () => void;
}

export interface PeerDiscoveryEvents {
  peerDiscovered: (peer: Peer) => void;
  peerUpdated: (peer: Peer) => void;
  peerConnected: (peer: Peer) => void;
  peerDisconnected: (peer: Peer) => void;
  peerRemoved: (peer: Peer) => void;
}

export interface MessagingEvents {
  messageReceived: (message: BaseMessage) => void;
  messageSent: (message: BaseMessage) => void;
  messageFailed: (message: BaseMessage, error: Error) => void;
  messageAcknowledged: (messageId: string, ack: MessageAcknowledgement) => void;
  messageExpired: (message: BaseMessage) => void;
  chatMessageReceived: (message: ChatMessage) => void;
  locationReceived: (message: LocationMessage) => void;
  markerReceived: (message: MarkerMessage) => void;
  systemMessageReceived: (message: SystemMessage) => void;
}

export interface SyncDeduplicationEvents {
  recordCreated: (record: SyncRecord) => void;
  conflictDetected: (conflict: any) => void;
  conflictResolved: (record: SyncRecord) => void;
}

// Utility Types
export type DittoEventEmitter<T> = {
  on<K extends keyof T>(event: K, listener: T[K]): void;
  off<K extends keyof T>(event: K, listener: T[K]): void;
  emit<K extends keyof T>(event: K, ...args: Parameters<T[K] extends (...args: any[]) => any ? T[K] : never>): void;
  removeAllListeners(): void;
};
