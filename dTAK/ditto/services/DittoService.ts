import { Ditto, TransportConfig } from '@dittolive/ditto';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as FileSystem from 'expo-file-system';
import { DittoConfig, DittoServiceEvents, DittoEventEmitter } from '../types/DittoTypes';

export class DittoService implements DittoEventEmitter<DittoServiceEvents> {
  private static instance: DittoService;
  private ditto: Ditto | null = null;
  private isInitialized = false;
  private initializingPromise: Promise<void> | null = null;
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
    // Prevent concurrent initializations which can cause multiple Ditto instances
    if (this.isInitialized) return;
    if (this.initializingPromise) {
      // Another initialization is in progress; wait for it to complete
      return this.initializingPromise;
    }

    this.initializingPromise = (async () => {
      try {
        this.config = config;
      
      // Create identity - use playground for development, onlineWithAuthentication for production
      const identity = config.playgroundToken 
        ? {
            type: 'onlinePlayground' as const,
            appID: config.appId,
            token: config.playgroundToken,
            enableDittoCloudSync: false
          }
        : {
            type: 'onlineWithAuthentication' as const,
            appID: config.appId,
            enableDittoCloudSync: false,
            authHandler: {
              authenticationRequired: (authenticator: any) => {
                console.log('Authentication required for production mode');
              },
              authenticationExpiringSoon: (authenticator: any) => {
                console.log('Authentication expiring soon');
              }
            }
          };

      // Initialize Ditto instance
      // Note: creating multiple Ditto instances with the same working directory
      // can cause "File already locked" errors in simulator/dev. Prefer to
      // pass a per-device working directory when available in the SDK.
      // Compute persistence directory. Prefer an absolute path under
      // FileSystem.documentDirectory when available to avoid using the
      // shared simulator default location.
  // Prefer an explicit workingDir from config, otherwise build a deterministic
  // path containing the appId and device name to avoid collisions across
  // different builds or simulator instances.
  const appIdSegment = this.config.workingDir ? undefined : (this.config.appId || 'app');
  let persistenceDirectory = this.config.workingDir || `ditto-${Device.deviceName || Platform.OS}`;

      try {
        const paths: any = (FileSystem as any).Paths;
        const docDirUri: string | undefined = paths?.document?.uri;
        if (docDirUri) {
          // Use a per-app / per-device subfolder inside the app document directory
          const deviceId = Device.deviceName || Platform.OS;
          const dirUri = appIdSegment ? `${docDirUri}ditto/${appIdSegment}/${deviceId}` : `${docDirUri}ditto/${deviceId}`;
          try {
            const DirectoryClass: any = (FileSystem as any).Directory;
            // Create directory (idempotent by nature of the create call catching errors)
            const dirObj = new DirectoryClass(dirUri);
            dirObj.create({ intermediates: true });
          } catch {
            // ignore directory creation failures; we'll fall back to relative path
          }
          persistenceDirectory = dirUri;
        }
      } catch (fsErr) {
        console.warn('expo-file-system not available or failed to create directory, falling back to relative persistence directory:', fsErr);
      }

      // Normalize persistenceDirectory (strip file:// scheme if present)
      try {
        if (typeof persistenceDirectory === 'string' && persistenceDirectory.startsWith('file://')) {
          persistenceDirectory = persistenceDirectory.replace(/^file:\/\//, '');
        }
      } catch {
        // ignore
      }

      console.log('Ditto persistenceDirectory chosen:', persistenceDirectory);

      // Prefer the async factory when available: Ditto.open({ persistenceDirectory })
      try {
        if (typeof (Ditto as any).open === 'function') {
          console.log('Using Ditto.open() with persistenceDirectory');
          this.ditto = await (Ditto as any).open({ persistenceDirectory });
        } else {
          console.log('Ditto.open() not available, trying constructor(identity, persistenceDirectory)');
          // Fallback to constructor that accepts (identity?, persistenceDirectory?)
          try {
            this.ditto = new (Ditto as any)(identity, persistenceDirectory);
          } catch (ctorErr) {
            console.warn('Ditto constructor with persistenceDirectory failed, falling back to no-arg constructor:', ctorErr);
            this.ditto = new Ditto(identity);
          }
        }
      } catch (openErr) {
        console.warn('Ditto.open failed, falling back to constructor:', openErr);
        try {
          this.ditto = new Ditto(identity);
        } catch (ctorErr) {
          console.error('All Ditto initialization attempts failed:', ctorErr);
          throw ctorErr;
        }
      }

      // If Ditto is created, verify the persistence directory actually used.
      try {
        if (this.ditto && typeof (this.ditto as any).absolutePersistenceDirectory === 'string') {
          const actual = (this.ditto as any).absolutePersistenceDirectory as string;
          console.log('Ditto actual absolutePersistenceDirectory:', actual);

          // If the actual path does not include our intended persistenceDirectory,
          // attempt to close and reopen with the explicit absolute path.
          if (persistenceDirectory && !actual.includes(persistenceDirectory)) {
            console.warn('Actual persistence directory differs from requested. Attempting to reopen with explicit directory');
            try {
              if (typeof (this.ditto as any).close === 'function') {
                await (this.ditto as any).close();
              } else if (typeof this.ditto.stopSync === 'function') {
                await this.ditto.stopSync();
              }

              // Try to open with persistenceDirectory explicitly
              if (typeof (Ditto as any).open === 'function') {
                this.ditto = await (Ditto as any).open({ persistenceDirectory });
              } else {
                this.ditto = new (Ditto as any)(identity, persistenceDirectory);
              }

              console.log('Reopened Ditto, actual absolutePersistenceDirectory:', (this.ditto as any).absolutePersistenceDirectory);
            } catch (reopenErr) {
              console.error('Failed to reopen Ditto with explicit persistenceDirectory:', reopenErr);
              // If we failed to reopen, ensure we don't continue using a closed Ditto instance.
              // Clear the reference so subsequent code doesn't call APIs on a closed object.
              try {
                this.ditto = null;
              } catch {}
            }
          }
        }
      } catch (chkErr) {
        console.warn('Could not verify Ditto persistence directory:', chkErr);
      }

      // If the Ditto object exists but is closed (for example: we closed it
      // and failed to reopen above), try to open a fresh instance or abort
      // initialization. This prevents calling `setTransportConfig()` on a
      // closed Ditto object which throws.
      try {
        if (!this.ditto) {
          console.warn('Ditto instance missing after persistence-directory verification. Attempting fallback opens.');

          // First try: call Ditto.open() with no arguments (uses default config)
          try {
            if (typeof (Ditto as any).open === 'function') {
              console.log('Fallback: trying Ditto.open() with default config');
              this.ditto = await (Ditto as any).open();
              console.log('Fallback: Ditto.open() succeeded');
            }
          } catch (openDefaultErr) {
            console.warn('Fallback Ditto.open() failed:', openDefaultErr);
          }

          // Second try: try constructor with identity (no persistenceDirectory)
          if (!this.ditto) {
            try {
              console.log('Fallback: trying `new Ditto(identity)`');
              this.ditto = new (Ditto as any)(identity);
              console.log('Fallback: new Ditto(identity) succeeded');
            } catch (ctorFallbackErr) {
              console.warn('Fallback new Ditto(identity) failed:', ctorFallbackErr);
            }
          }

          // Third try: try opening with explicit persistenceDirectory one more time
          if (!this.ditto) {
            try {
              console.log('Fallback: trying Ditto.open() with explicit persistenceDirectory as last resort');
              if (typeof (Ditto as any).open === 'function') {
                this.ditto = await (Ditto as any).open({ persistenceDirectory });
                console.log('Fallback: Ditto.open(persistenceDirectory) succeeded');
              }
            } catch (lastResortErr) {
              console.warn('Last-resort Ditto.open(persistenceDirectory) failed:', lastResortErr);
            }
          }

          if (!this.ditto) {
            throw new Error('Ditto instance missing after persistence-directory verification and fallback attempts');
          }
        }

        if ((this.ditto as any).isClosed) {
          console.warn('Ditto instance is closed after verify/reopen. Attempting to open a new instance.');
          if (typeof (Ditto as any).open === 'function') {
            this.ditto = await (Ditto as any).open({ persistenceDirectory });
          } else {
            this.ditto = new (Ditto as any)(identity, persistenceDirectory);
          }
          console.log('Successfully opened new Ditto instance after closed state.');
        }
      } catch (openAfterCloseErr) {
        console.error('Failed to ensure a usable Ditto instance after reopen attempt:', openAfterCloseErr);
        // Propagate so initialization fails cleanly and we don't call setTransportConfig
        throw openAfterCloseErr;
      }

      // Configure transports for peer discovery
      await this.configureTransports();

      // Start sync engine
      if (this.ditto) {
        await this.ditto.startSync();
      } else {
        throw new Error('Ditto instance not available after construction');
      }

        this.isInitialized = true;
        this.emit('initialized');
        console.log('Ditto initialized successfully');
      } catch (error) {
        const dittoError = error instanceof Error ? error : new Error('Failed to initialize Ditto');
        console.error('Failed to initialize Ditto:', dittoError);
        this.emit('error', dittoError);
        throw dittoError;
      } finally {
        // clear initializing promise on success or failure
        this.initializingPromise = null;
      }
    })();

    return this.initializingPromise;
  }

  private async configureTransports(): Promise<void> {
    if (!this.ditto || !this.config) return;
    // Construct a real TransportConfig instance from the SDK. The native
    // implementation expects an object with runtime methods like `copy()`
    // and `freeze()` (see Ditto.TransportConfig in the SDK bundle). Passing
    // a plain POJO caused `.copy` to be undefined which crashed during init.
    try {
      // Prefer the SDK's exported TransportConfig constructor if available
      let tc: any = null;

      if (typeof (TransportConfig as any) === 'function') {
        tc = new (TransportConfig as any)();
        // set fields explicitly
        tc.peerToPeer.bluetoothLE.isEnabled = !!this.config.enableBluetooth;
        tc.peerToPeer.lan.isEnabled = !!this.config.enableWiFi;
        if (Platform.OS === 'ios') {
          tc.peerToPeer.awdl.isEnabled = !!this.config.enableAWDL;
        }
        if (this.config.websocketURL) {
          // SDK uses `websocketURLs` (plural)
          tc.connect.websocketURLs = [this.config.websocketURL];
        }
      } else {
        // As a last resort build a shape that matches the serializable
        // form and let the SDK try to accept it (but avoid calling setTransportConfig
        // with completely plain objects unless necessary).
        tc = {
          peerToPeer: {
            bluetoothLE: { isEnabled: !!this.config.enableBluetooth },
            lan: { isEnabled: !!this.config.enableWiFi },
            awdl: Platform.OS === 'ios' && this.config.enableAWDL ? { isEnabled: true } : { isEnabled: false },
            wifiAware: { isEnabled: false },
          },
          connect: this.config.websocketURL ? { websocketURLs: [this.config.websocketURL], retryInterval: 5000 } : { websocketURLs: [], retryInterval: 5000 },
          listen: { tcp: { isEnabled: false, interfaceIP: '[::]', port: 4040 }, http: { isEnabled: false, interfaceIP: '[::]', port: 80, websocketSync: true } },
          global: { syncGroup: 0, routingHint: 0 },
        };
      }

      // Use Ditto API to set transport config. The SDK expects a TransportConfig
      // instance and will call `.copy()` internally, so make sure we're passing
      // an object created by the SDK when possible.
      this.ditto.setTransportConfig(tc as TransportConfig);
      console.log('Ditto transport configuration set (TransportConfig):', tc);
    } catch (err) {
      console.error('Failed to set Ditto transport config using SDK TransportConfig:', err);
      // Re-throw so callers can react (initialize() will catch and emit)
      throw err;
    }
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

    // Prefer the stable `observePeers` API when available; fall back to
    // `observePeersV2` for older/newer SDK shapes. Use any to be tolerant.
    const d: any = this.ditto;
    if (typeof d.observePeers === 'function') {
      d.observePeers(callback);
    } else if (typeof d.observePeersV2 === 'function') {
      d.observePeersV2(callback);
    } else {
      throw new Error('Ditto peer observation API not found on Ditto instance');
    }
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
        // Prefer close() which releases all resources and persistence locks.
        if (typeof (this.ditto as any).close === 'function') {
          await (this.ditto as any).close();
        } else {
          await this.ditto.stopSync();
        }
        this.ditto = null;
        this.isInitialized = false;
      }
      // If an initialization was in progress, clear it so future inits can run
      this.initializingPromise = null;

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
  const collection: any = await this.createCollection(collectionName);
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
  const collection: any = await this.createCollection(collectionName);
  const subscription: any = (collection.findAll() as any).subscribe();

  // subscription shape differs across SDK versions; treat as any at runtime
  subscription.on('update', callback);
  return subscription;
  }

  async removeDocument(collectionName: string, id: string): Promise<void> {
    const collection = await this.createCollection(collectionName);
    await collection.findByID(id).remove();
  }
}
