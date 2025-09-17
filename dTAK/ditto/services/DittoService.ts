import { Ditto, DittoIdentity, TransportConfig } from '@dittolive/ditto';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { DittoConfig, DittoServiceEvents, DittoEventEmitter } from '../types/DittoTypes';

export class DittoService implements DittoEventEmitter<DittoServiceEvents> {
  private static instance: DittoService;
  private ditto: Ditto | null = null;
  private isInitialized = false;
  private listeners: Map<keyof DittoServiceEvents, Set<Function>> = new Map();
  private config: DittoConfig | null = null;

  private constructor() {
    this.initializeListeners();
  }

  static getInstance(): DittoService {
    if (!DittoService.instance) {
      DittoService.instance = new DittoService();
    }
    return DittoService.instance;
  }

  async initialize(config: DittoConfig): Promise<void> {
    try {
      this.config = config;
      
      // Create identity - use playground for development, production for release
      const identity = config.playgroundToken 
        ? DittoIdentity.onlinePlayground(config.appId, config.playgroundToken)
        : DittoIdentity.production(config.appId);

      // Initialize Ditto instance
      this.ditto = new Ditto(identity);

      // Configure transports for peer discovery
      await this.configureTransports();

      // Start sync engine
      await this.ditto.startSync();

      this.isInitialized = true;
      this.emit('initialized');
      
      console.log('Ditto initialized successfully');
    } catch (error) {
      const dittoError = error instanceof Error ? error : new Error('Failed to initialize Ditto');
      console.error('Failed to initialize Ditto:', dittoError);
      this.emit('error', dittoError);
      throw dittoError;
    }
  }

  private async configureTransports(): Promise<void> {
    if (!this.ditto || !this.config) return;

    const transportConfig: TransportConfig = {
      // Enable peer-to-peer discovery
      peerToPeer: {
        bluetoothLE: {
          enabled: this.config.enableBluetooth,
        },
        lan: {
          enabled: this.config.enableWiFi,
        },
        awdl: Platform.OS === 'ios' && this.config.enableAWDL ? { enabled: true } : undefined,
      },
      // Enable cloud sync when available
      connect: this.config.websocketURL ? {
        websocketURL: this.config.websocketURL,
      } : undefined,
    };

    this.ditto.setTransportConfig(transportConfig);
    console.log('Ditto transport configuration set:', transportConfig);
  }

  getDitto(): Ditto | null {
    return this.ditto;
  }

  getConfig(): DittoConfig | null {
    return this.config;
  }

  isReady(): boolean {
    return this.isInitialized && this.ditto !== null;
  }

  async getDeviceInfo(): Promise<{
    deviceName: string;
    deviceType: string;
    deviceId: string;
  }> {
    const deviceName = Device.deviceName || `${Platform.OS}_device`;
    const deviceType = Platform.OS;
    const deviceId = this.ditto?.siteID.toString() || 'unknown';

    return {
      deviceName,
      deviceType,
      deviceId,
    };
  }

  async observePeers(callback: (peers: any[]) => void): Promise<void> {
    if (!this.ditto) {
      throw new Error('Ditto not initialized');
    }

    this.ditto.observePeersV2(callback);
  }

  async getStore() {
    if (!this.ditto) {
      throw new Error('Ditto not initialized');
    }
    return this.ditto.store;
  }

  async shutdown(): Promise<void> {
    try {
      if (this.ditto) {
        await this.ditto.stopSync();
        this.ditto = null;
        this.isInitialized = false;
      }
      
      this.emit('shutdown');
      this.removeAllListeners();
      
      console.log('Ditto service shutdown complete');
    } catch (error) {
      const shutdownError = error instanceof Error ? error : new Error('Failed to shutdown Ditto');
      console.error('Error during Ditto shutdown:', shutdownError);
      this.emit('error', shutdownError);
    }
  }

  // Event emitter implementation
  private initializeListeners(): void {
    this.listeners.set('initialized', new Set());
    this.listeners.set('error', new Set());
    this.listeners.set('shutdown', new Set());
  }

  on<K extends keyof DittoServiceEvents>(event: K, listener: DittoServiceEvents[K]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.add(listener as Function);
    }
  }

  off<K extends keyof DittoServiceEvents>(event: K, listener: DittoServiceEvents[K]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener as Function);
    }
  }

  emit<K extends keyof DittoServiceEvents>(
    event: K, 
    ...args: Parameters<DittoServiceEvents[K] extends (...args: any[]) => any ? DittoServiceEvents[K] : never>
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

  // Utility methods for common operations
  async createCollection(name: string) {
    const store = await this.getStore();
    return store.collection(name);
  }

  async upsertDocument(collectionName: string, document: any, id: string): Promise<void> {
    const collection = await this.createCollection(collectionName);
    await collection.upsert(document, id);
  }

  async findDocument(collectionName: string, id: string): Promise<any> {
    const collection = await this.createCollection(collectionName);
    const doc = await collection.findByID(id).exec();
    return doc?.value || null;
  }

  async findAllDocuments(collectionName: string): Promise<any[]> {
    const collection = await this.createCollection(collectionName);
    const docs = await collection.findAll().exec();
    return docs.map(doc => doc.value);
  }

  async subscribeToCollection(
    collectionName: string, 
    callback: (docs: any[], event: any) => void
  ): Promise<any> {
    const collection = await this.createCollection(collectionName);
    const subscription = collection.findAll().subscribe();
    
    subscription.on('update', callback);
    return subscription;
  }

  async removeDocument(collectionName: string, id: string): Promise<void> {
    const collection = await this.createCollection(collectionName);
    await collection.findByID(id).remove();
  }
}
