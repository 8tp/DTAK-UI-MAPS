import { DittoService } from './DittoService';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { 
  Peer, 
  PeerPresence, 
  PeerDiscoveryEvents, 
  DittoEventEmitter 
} from '../types/DittoTypes';

export class PeerDiscoveryService implements DittoEventEmitter<PeerDiscoveryEvents> {
  private dittoService: DittoService;
  private peers: Map<string, Peer> = new Map();
  private presenceCollection = 'peer_presence';
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private localPeerId: string;
  private localPeerName: string;
  private listeners: Map<keyof PeerDiscoveryEvents, Set<Function>> = new Map();
  private presenceSubscription: any = null;

  constructor() {
    this.dittoService = DittoService.getInstance();
    this.localPeerId = this.generatePeerId();
    this.localPeerName = '';
    this.initializeListeners();
  }

  async startDiscovery(): Promise<void> {
    if (!this.dittoService.isReady()) {
      throw new Error('Ditto service not initialized');
    }

    // Get device info
    const deviceInfo = await this.dittoService.getDeviceInfo();
    this.localPeerName = deviceInfo.deviceName;

    // Subscribe to peer presence updates
    await this.subscribeToPresence();

    // Start broadcasting own presence
    await this.startPresenceBroadcast();

    // Monitor peer connections
    this.monitorPeerConnections();

    // Start heartbeat to maintain presence
    this.startHeartbeat();

    console.log('Peer discovery started for peer:', this.localPeerId);
  }

  private async subscribeToPresence(): Promise<void> {
    try {
      this.presenceSubscription = await this.dittoService.subscribeToCollection(
        this.presenceCollection,
        (docs, event) => {
          docs.forEach(doc => {
            const presence = doc as PeerPresence;
            if (presence.peerId !== this.localPeerId) {
              this.handlePeerPresenceUpdate(presence);
            }
          });
        }
      );
    } catch (error) {
      console.error('Failed to subscribe to presence:', error);
      throw error;
    }
  }

  private async startPresenceBroadcast(): Promise<void> {
    const presence: PeerPresence = {
      peerId: this.localPeerId,
      displayName: this.localPeerName,
      deviceType: Platform.OS,
      capabilities: this.getDeviceCapabilities(),
      status: 'available',
      lastUpdate: new Date(),
    };

    try {
      await this.dittoService.upsertDocument(
        this.presenceCollection,
        this.serializePresence(presence),
        this.localPeerId
      );
    } catch (error) {
      console.error('Failed to broadcast presence:', error);
      throw error;
    }
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
    this.dittoService.observePeers((peers) => {
      const activePeerIds = new Set<string>();

      peers.forEach(remotePeer => {
        const peerId = remotePeer.deviceName || remotePeer.address || 'unknown';
        activePeerIds.add(peerId);
        
        const existingPeer = this.peers.get(peerId);
        if (existingPeer && !existingPeer.isConnected) {
          existingPeer.isConnected = true;
          existingPeer.connectionType = this.mapTransportType(
            remotePeer.connections?.[0]?.connectionType || 'unknown'
          );
          this.emit('peerConnected', existingPeer);
        }
      });

      // Check for disconnected peers
      this.checkForDisconnectedPeers(activePeerIds);
    }).catch(error => {
      console.error('Failed to observe peers:', error);
    });
  }

  private checkForDisconnectedPeers(activePeerIds: Set<string>): void {
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
    try {
      const existing = await this.dittoService.findDocument(this.presenceCollection, this.localPeerId);
      if (!existing) return;
      const updated = { ...existing, lastUpdate: new Date().toISOString() };
      await this.dittoService.upsertDocument(this.presenceCollection, updated, this.localPeerId);
    } catch (error) {
      console.error('Failed to update presence:', error);
    }
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
    // This is simplified - in practice, you'd check the actual transport
    return 'wifi';
  }

  private mapTransportType(connectionType: string): 'bluetooth' | 'wifi' | 'cloud' {
    switch (connectionType.toLowerCase()) {
      case 'bluetooth':
      case 'bluetoothle':
        return 'bluetooth';
      case 'accesspoint':
      case 'p2pwifi':
      case 'lan':
        return 'wifi';
      case 'websocket':
      case 'connect':
        return 'cloud';
      default:
        return 'wifi';
    }
  }

  private serializePresence(presence: PeerPresence): any {
    return {
      ...presence,
      lastUpdate: presence.lastUpdate.toISOString(),
      location: presence.location ? {
        ...presence.location,
        timestamp: presence.location.timestamp.toISOString(),
      } : undefined,
    };
  }

  private deserializePresence(data: any): PeerPresence {
    return {
      ...data,
      lastUpdate: new Date(data.lastUpdate),
      location: data.location ? {
        ...data.location,
        timestamp: new Date(data.location.timestamp),
      } : undefined,
    };
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

  getLocalPeerId(): string {
    return this.localPeerId;
  }

  getLocalPeerName(): string {
    return this.localPeerName;
  }

  async updateLocation(location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  }): Promise<void> {
    try {
      const existing = await this.dittoService.findDocument(this.presenceCollection, this.localPeerId);
      if (!existing) return;
      const updated = {
        ...existing,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: new Date().toISOString(),
        },
      };
      await this.dittoService.upsertDocument(this.presenceCollection, updated, this.localPeerId);
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  }

  async updateStatus(status: 'available' | 'busy' | 'away'): Promise<void> {
    try {
      const existing = await this.dittoService.findDocument(this.presenceCollection, this.localPeerId);
      if (!existing) return;
      const updated = { ...existing, status, lastUpdate: new Date().toISOString() };
      await this.dittoService.upsertDocument(this.presenceCollection, updated, this.localPeerId);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  }

  async stopDiscovery(): Promise<void> {
    try {
      // Stop heartbeat
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }

      // Unsubscribe from presence updates
      if (this.presenceSubscription) {
        this.presenceSubscription.cancel?.();
        this.presenceSubscription = null;
      }

      // Remove own presence
      await this.dittoService.removeDocument(this.presenceCollection, this.localPeerId);

      // Clear peers and listeners
      this.peers.clear();
      this.removeAllListeners();
      
      console.log('Peer discovery stopped');
    } catch (error) {
      console.error('Error stopping peer discovery:', error);
    }
  }

  // Event emitter implementation
  private initializeListeners(): void {
    this.listeners.set('peerDiscovered', new Set());
    this.listeners.set('peerUpdated', new Set());
    this.listeners.set('peerConnected', new Set());
    this.listeners.set('peerDisconnected', new Set());
    this.listeners.set('peerRemoved', new Set());
  }

  on<K extends keyof PeerDiscoveryEvents>(event: K, listener: PeerDiscoveryEvents[K]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.add(listener as Function);
    }
  }

  off<K extends keyof PeerDiscoveryEvents>(event: K, listener: PeerDiscoveryEvents[K]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener as Function);
    }
  }

  emit<K extends keyof PeerDiscoveryEvents>(
    event: K, 
    ...args: Parameters<PeerDiscoveryEvents[K] extends (...args: any[]) => any ? PeerDiscoveryEvents[K] : never>
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
