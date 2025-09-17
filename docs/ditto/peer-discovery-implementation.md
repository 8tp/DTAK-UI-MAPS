# Peer Discovery Implementation Guide (P2-1)

## Overview
This document provides detailed implementation guidance for P2-1: Peer Discovery using the Ditto SDK in the dTAK React Native application. The implementation enables automatic discovery and connection to nearby peers in a mesh network for tactical communication scenarios.

## Core Components

### 1. Ditto Service Setup

```typescript
// services/DittoService.ts
import { Ditto, DittoIdentity, TransportConfig } from '@dittolive/ditto';
import { Platform } from 'react-native';

export class DittoService {
  private static instance: DittoService;
  private ditto: Ditto | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): DittoService {
    if (!DittoService.instance) {
      DittoService.instance = new DittoService();
    }
    return DittoService.instance;
  }

  async initialize(appId: string, playgroundToken?: string): Promise<void> {
    try {
      // Create identity - use playground for development, production for release
      const identity = playgroundToken 
        ? DittoIdentity.onlinePlayground(appId, playgroundToken)
        : DittoIdentity.production(appId);

      // Initialize Ditto instance
      this.ditto = new Ditto(identity);

      // Configure transports for peer discovery
      await this.configureTransports();

      // Start sync engine
      await this.ditto.startSync();

      this.isInitialized = true;
      console.log('Ditto initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Ditto:', error);
      throw error;
    }
  }

  private async configureTransports(): Promise<void> {
    if (!this.ditto) return;

    const transportConfig: TransportConfig = {
      // Enable peer-to-peer discovery
      peerToPeer: {
        bluetoothLE: {
          enabled: true,
        },
        lan: {
          enabled: true,
        },
        awdl: Platform.OS === 'ios' ? { enabled: true } : undefined,
      },
      // Enable cloud sync when available
      connect: {
        websocketURL: process.env.DITTO_WEBSOCKET_URL,
      },
    };

    this.ditto.setTransportConfig(transportConfig);
  }

  getDitto(): Ditto | null {
    return this.ditto;
  }

  isReady(): boolean {
    return this.isInitialized && this.ditto !== null;
  }

  async shutdown(): Promise<void> {
    if (this.ditto) {
      await this.ditto.stopSync();
      this.ditto = null;
      this.isInitialized = false;
    }
  }
}
```

### 2. Peer Discovery Service

```typescript
// services/PeerDiscoveryService.ts
import { DittoService } from './DittoService';
import { EventEmitter } from 'events';

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

export class PeerDiscoveryService extends EventEmitter {
  private dittoService: DittoService;
  private peers: Map<string, Peer> = new Map();
  private presenceCollection = 'peer_presence';
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private localPeerId: string;

  constructor() {
    super();
    this.dittoService = DittoService.getInstance();
    this.localPeerId = this.generatePeerId();
  }

  async startDiscovery(): Promise<void> {
    if (!this.dittoService.isReady()) {
      throw new Error('Ditto service not initialized');
    }

    const ditto = this.dittoService.getDitto()!;

    // Subscribe to peer presence updates
    await this.subscribeToPresence();

    // Start broadcasting own presence
    await this.startPresenceBroadcast();

    // Monitor peer connections
    this.monitorPeerConnections();

    // Start heartbeat to maintain presence
    this.startHeartbeat();

    console.log('Peer discovery started');
  }

  private async subscribeToPresence(): Promise<void> {
    const ditto = this.dittoService.getDitto()!;
    
    // Subscribe to all peer presence documents
    const subscription = ditto
      .store
      .collection(this.presenceCollection)
      .findAll()
      .subscribe();

    // Listen for presence updates
    subscription.on('update', (docs, event) => {
      docs.forEach(doc => {
        const presence = doc.value as PeerPresence;
        if (presence.peerId !== this.localPeerId) {
          this.handlePeerPresenceUpdate(presence);
        }
      });
    });
  }

  private async startPresenceBroadcast(): Promise<void> {
    const ditto = this.dittoService.getDitto()!;
    
    const presence: PeerPresence = {
      peerId: this.localPeerId,
      displayName: await this.getDeviceDisplayName(),
      deviceType: Platform.OS,
      capabilities: this.getDeviceCapabilities(),
      status: 'available',
      lastUpdate: new Date(),
    };

    // Upsert presence document
    await ditto
      .store
      .collection(this.presenceCollection)
      .upsert(presence, this.localPeerId);
  }

  private handlePeerPresenceUpdate(presence: PeerPresence): void {
    const existingPeer = this.peers.get(presence.peerId);
    
    const peer: Peer = {
      id: presence.peerId,
      displayName: presence.displayName,
      deviceType: presence.deviceType,
      capabilities: presence.capabilities,
      lastSeen: presence.lastUpdate,
      isConnected: this.isPeerRecentlyActive(presence.lastUpdate),
      connectionType: this.determineConnectionType(presence.peerId),
    };

    const isNewPeer = !existingPeer;
    this.peers.set(presence.peerId, peer);

    if (isNewPeer) {
      this.emit('peerDiscovered', peer);
      console.log(`New peer discovered: ${peer.displayName} (${peer.id})`);
    } else {
      this.emit('peerUpdated', peer);
    }
  }

  private monitorPeerConnections(): void {
    const ditto = this.dittoService.getDitto()!;

    // Monitor transport conditions
    ditto.observePeersV2((peers) => {
      peers.forEach(remotePeer => {
        const peerId = remotePeer.deviceName || remotePeer.address;
        const existingPeer = this.peers.get(peerId);
        
        if (existingPeer) {
          existingPeer.isConnected = true;
          existingPeer.connectionType = this.mapTransportType(remotePeer.connections[0]?.connectionType);
          this.emit('peerConnected', existingPeer);
        }
      });

      // Check for disconnected peers
      this.checkForDisconnectedPeers(peers);
    });
  }

  private checkForDisconnectedPeers(activePeers: any[]): void {
    const activePeerIds = new Set(
      activePeers.map(p => p.deviceName || p.address)
    );

    this.peers.forEach((peer, peerId) => {
      if (!activePeerIds.has(peerId) && peer.isConnected) {
        peer.isConnected = false;
        this.emit('peerDisconnected', peer);
        console.log(`Peer disconnected: ${peer.displayName} (${peer.id})`);
      }
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      await this.updatePresence();
      this.cleanupStalePresence();
    }, 30000); // Update every 30 seconds
  }

  private async updatePresence(): Promise<void> {
    const ditto = this.dittoService.getDitto()!;
    
    await ditto
      .store
      .collection(this.presenceCollection)
      .findByID(this.localPeerId)
      .update((mutableDoc) => {
        if (mutableDoc) {
          mutableDoc.at('lastUpdate').set(new Date().toISOString());
        }
      });
  }

  private cleanupStalePresence(): void {
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    const now = new Date();

    this.peers.forEach((peer, peerId) => {
      if (now.getTime() - peer.lastSeen.getTime() > staleThreshold) {
        this.peers.delete(peerId);
        this.emit('peerRemoved', peer);
        console.log(`Removed stale peer: ${peer.displayName} (${peer.id})`);
      }
    });
  }

  // Utility methods
  private generatePeerId(): string {
    return `peer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getDeviceDisplayName(): Promise<string> {
    // Implementation depends on device info library
    return `${Platform.OS}_device_${this.localPeerId.substr(-4)}`;
  }

  private getDeviceCapabilities(): string[] {
    return [
      'messaging',
      'location_sharing',
      'map_markers',
      'file_transfer',
    ];
  }

  private isPeerRecentlyActive(lastUpdate: Date): boolean {
    const threshold = 2 * 60 * 1000; // 2 minutes
    return Date.now() - lastUpdate.getTime() < threshold;
  }

  private determineConnectionType(peerId: string): 'bluetooth' | 'wifi' | 'cloud' {
    // Logic to determine connection type based on transport info
    return 'wifi'; // Simplified for example
  }

  private mapTransportType(connectionType: string): 'bluetooth' | 'wifi' | 'cloud' {
    switch (connectionType) {
      case 'Bluetooth':
        return 'bluetooth';
      case 'AccessPoint':
      case 'P2PWiFi':
        return 'wifi';
      default:
        return 'cloud';
    }
  }

  // Public API
  getPeers(): Peer[] {
    return Array.from(this.peers.values());
  }

  getConnectedPeers(): Peer[] {
    return this.getPeers().filter(peer => peer.isConnected);
  }

  getPeerById(peerId: string): Peer | undefined {
    return this.peers.get(peerId);
  }

  async stopDiscovery(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Remove own presence
    const ditto = this.dittoService.getDitto();
    if (ditto) {
      await ditto
        .store
        .collection(this.presenceCollection)
        .findByID(this.localPeerId)
        .remove();
    }

    this.peers.clear();
    this.removeAllListeners();
    console.log('Peer discovery stopped');
  }
}
```

### 3. React Hook for Peer Discovery

```typescript
// hooks/usePeerDiscovery.ts
import { useState, useEffect, useCallback } from 'react';
import { PeerDiscoveryService, Peer } from '../services/PeerDiscoveryService';

export const usePeerDiscovery = () => {
  const [peers, setPeers] = useState<Peer[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [peerDiscoveryService] = useState(() => new PeerDiscoveryService());

  const startDiscovery = useCallback(async () => {
    try {
      setError(null);
      setIsDiscovering(true);
      await peerDiscoveryService.startDiscovery();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start discovery');
      setIsDiscovering(false);
    }
  }, [peerDiscoveryService]);

  const stopDiscovery = useCallback(async () => {
    try {
      await peerDiscoveryService.stopDiscovery();
      setIsDiscovering(false);
      setPeers([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop discovery');
    }
  }, [peerDiscoveryService]);

  useEffect(() => {
    const handlePeerDiscovered = (peer: Peer) => {
      setPeers(current => [...current, peer]);
    };

    const handlePeerUpdated = (peer: Peer) => {
      setPeers(current => 
        current.map(p => p.id === peer.id ? peer : p)
      );
    };

    const handlePeerRemoved = (peer: Peer) => {
      setPeers(current => 
        current.filter(p => p.id !== peer.id)
      );
    };

    const handlePeerConnected = (peer: Peer) => {
      setPeers(current => 
        current.map(p => p.id === peer.id ? { ...p, isConnected: true } : p)
      );
    };

    const handlePeerDisconnected = (peer: Peer) => {
      setPeers(current => 
        current.map(p => p.id === peer.id ? { ...p, isConnected: false } : p)
      );
    };

    peerDiscoveryService.on('peerDiscovered', handlePeerDiscovered);
    peerDiscoveryService.on('peerUpdated', handlePeerUpdated);
    peerDiscoveryService.on('peerRemoved', handlePeerRemoved);
    peerDiscoveryService.on('peerConnected', handlePeerConnected);
    peerDiscoveryService.on('peerDisconnected', handlePeerDisconnected);

    return () => {
      peerDiscoveryService.removeAllListeners();
    };
  }, [peerDiscoveryService]);

  const connectedPeers = peers.filter(peer => peer.isConnected);
  const disconnectedPeers = peers.filter(peer => !peer.isConnected);

  return {
    peers,
    connectedPeers,
    disconnectedPeers,
    isDiscovering,
    error,
    startDiscovery,
    stopDiscovery,
    peerCount: peers.length,
    connectedPeerCount: connectedPeers.length,
  };
};
```

### 4. Peer Status Component

```typescript
// components/PeerStatus.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { usePeerDiscovery } from '../hooks/usePeerDiscovery';
import { Peer } from '../services/PeerDiscoveryService';

interface PeerItemProps {
  peer: Peer;
}

const PeerItem: React.FC<PeerItemProps> = ({ peer }) => {
  const getConnectionIcon = () => {
    if (!peer.isConnected) return '🔴';
    switch (peer.connectionType) {
      case 'bluetooth': return '🔵';
      case 'wifi': return '🟢';
      case 'cloud': return '🟡';
      default: return '⚪';
    }
  };

  return (
    <View style={styles.peerItem}>
      <Text style={styles.connectionIcon}>{getConnectionIcon()}</Text>
      <View style={styles.peerInfo}>
        <Text style={styles.peerName}>{peer.displayName}</Text>
        <Text style={styles.peerDetails}>
          {peer.deviceType} • {peer.connectionType}
        </Text>
        <Text style={styles.lastSeen}>
          Last seen: {peer.lastSeen.toLocaleTimeString()}
        </Text>
      </View>
    </View>
  );
};

export const PeerStatus: React.FC = () => {
  const { 
    peers, 
    connectedPeerCount, 
    isDiscovering, 
    error,
    startDiscovery,
    stopDiscovery 
  } = usePeerDiscovery();

  React.useEffect(() => {
    startDiscovery();
    return () => {
      stopDiscovery();
    };
  }, [startDiscovery, stopDiscovery]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mesh Network</Text>
        <Text style={styles.status}>
          {isDiscovering ? '🔍 Discovering' : '⏸️ Stopped'} • 
          {connectedPeerCount} connected
        </Text>
      </View>
      
      <FlatList
        data={peers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PeerItem peer={item} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {isDiscovering ? 'Searching for peers...' : 'No peers found'}
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    color: '#666',
  },
  peerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  connectionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  peerInfo: {
    flex: 1,
  },
  peerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  peerDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  lastSeen: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 32,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 32,
  },
});
```

## Integration Steps

### 1. Install Dependencies
```bash
npm install @dittolive/ditto
npm install react-native-device-info  # For device information
```

### 2. Platform Configuration

#### iOS (ios/Podfile)
```ruby
pod 'DittoObjC', '~> 4.0'
```

#### Android (android/app/build.gradle)
```gradle
implementation 'live.ditto:ditto:4.+'
```

### 3. Permissions Setup

#### iOS (Info.plist)
```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>This app uses Bluetooth for peer-to-peer communication</string>
<key>NSLocalNetworkUsageDescription</key>
<string>This app uses local network for peer discovery</string>
```

#### Android (AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

### 4. Initialize in App

```typescript
// App.tsx or _layout.tsx
import { DittoService } from './ditto/services/DittoService';

export default function App() {
  useEffect(() => {
    const initializeDitto = async () => {
      try {
        const dittoService = DittoService.getInstance();
        await dittoService.initialize(
          'your-app-id',
          'your-playground-token' // Remove for production
        );
      } catch (error) {
        console.error('Failed to initialize Ditto:', error);
      }
    };

    initializeDitto();
  }, []);

  // Rest of your app
}
```

## Testing & Validation

### Unit Tests
- Test peer discovery service initialization
- Validate presence broadcasting
- Test peer connection/disconnection handling
- Verify cleanup on service shutdown

### Integration Tests
- Multi-device peer discovery
- Network transition scenarios
- Background/foreground app states
- Permission handling

### Performance Monitoring
- Monitor battery usage impact
- Track memory consumption
- Measure peer discovery latency
- Monitor network bandwidth usage

## Troubleshooting

### Common Issues
1. **Peers not discovered**: Check permissions and network configuration
2. **High battery usage**: Optimize heartbeat intervals and cleanup stale data
3. **Memory leaks**: Ensure proper cleanup of event listeners
4. **Connection drops**: Implement robust reconnection logic

This implementation provides a solid foundation for P2-1 peer discovery functionality with the Ditto SDK.
