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
  // Queue of peer observer callbacks registered before Ditto is ready
  private pendingPeerObservers: ((peers: any[]) => void)[] = [];

  // Internal helper to attach a peer observer to the underlying Ditto instance.
  // This abstracts the differences in Ditto SDKs (`observePeers` vs `presence.observe`).
  private _attachPeerObserver(cb: (peers: any[]) => void) {
    if (!this.ditto) throw new Error('Ditto not initialized');
    const d: any = this.ditto;
    try { console.log('[DittoService] _attachPeerObserver: checking Ditto peer observation APIs'); } catch {}
    // Prefer direct observePeers when available (legacy), else use presence.observe
    if (typeof d.observePeers === 'function') {
      try { console.log('[DittoService] _attachPeerObserver: using observePeers()'); } catch {}
      d.observePeers(cb);
      return;
    }
    if (d.presence && typeof d.presence.observe === 'function') {
      try { console.log('[DittoService] _attachPeerObserver: using presence.observe()'); } catch {}
      d.presence.observe(cb);
      return;
    }
    // As last resort, try presenceManager if exposed
    if (typeof d.observeTransportConditions === 'function') {
      try { console.log('[DittoService] _attachPeerObserver: using observeTransportConditions() as fallback'); } catch {}
      // Not strictly peer observation, but keep API tolerant.
      d.observeTransportConditions(cb);
      return;
    }
    throw new Error('Ditto peer observation API not found on Ditto instance');
  }

  private constructor() {
    this.initializeListeners();
  }

  // Environment helper
  private isReactNative(): boolean {
    try {
      // If Platform is available, we are in RN bundle
      if (Platform && (Platform.OS === 'ios' || Platform.OS === 'android')) return true;
      // Fallback to navigator.product
      return typeof navigator !== 'undefined' && (navigator as any).product === 'ReactNative';
    } catch {
      return false;
    }
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
      // If a playgroundToken is provided, enable Ditto Cloud sync so simulators
      // and other remote peers can discover each other via the cloud. For
      // production flows with authentication, leave cloud sync configurable
      // (defaults to false unless explicitly enabled via config).
      const identity = config.playgroundToken
        ? {
            type: 'onlinePlayground' as const,
            appID: config.appId,
            token: config.playgroundToken,
            enableDittoCloudSync: true,
          }
        : {
            type: 'onlineWithAuthentication' as const,
            appID: config.appId,
            // keep cloud sync off by default for authenticated production
            // flows unless caller explicitly requests it via config
            enableDittoCloudSync: !!(config as any).enableDittoCloudSync || false,
            authHandler: {
              authenticationRequired: (authenticator: any) => {
                console.log('Authentication required for production mode');
              },
              authenticationExpiringSoon: (authenticator: any) => {
                console.log('Authentication expiring soon');
              }
            }
          };

      // Log a safe identity summary (avoid printing secrets like tokens)
      try {
        const idSummary: any = {
          type: (identity as any).type,
          appID: (identity as any).appID,
          enableDittoCloudSync: !!(identity as any).enableDittoCloudSync,
        };
        console.log('[DittoService] identity summary:', idSummary);
      } catch {}

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
  console.log('[DittoService] initializing Ditto with appId=', this.config?.appId, ' playgroundToken=', !!this.config?.playgroundToken);

      // Prefer Ditto constructor in React Native; Ditto.open() is not supported in RN
      const isReactNative = this.isReactNative();
      // Prefer the async factory when available only for non-RN environments
      try {
        if (!isReactNative && typeof (Ditto as any).open === 'function') {
          console.log('Using Ditto.open() with persistenceDirectory');
          this.ditto = await (Ditto as any).open({ persistenceDirectory });
        } else {
          console.log('Using Ditto constructor for this environment');
          // In RN, the supported API is the constructor with identity only
          try {
            this.ditto = new (Ditto as any)(identity);
          } catch (ctorErr) {
            console.warn('Ditto constructor failed, retrying with identity only:', ctorErr);
            this.ditto = new (Ditto as any)(identity);
          }
        }
      } catch (openErr) {
        console.warn('Primary Ditto init path failed, falling back to constructor:', openErr);
        try {
          this.ditto = new (Ditto as any)(identity);
        } catch (ctorErr) {
          console.error('All Ditto initialization attempts failed:', ctorErr);
          throw ctorErr;
        }
      }

      // If Ditto is created, verify the persistence directory actually used (non-RN only)
      if (!isReactNative) {
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
                try { this.ditto = null; } catch {}
              }
            }
          }
        } catch (chkErr) {
          console.warn('Could not verify Ditto persistence directory:', chkErr);
        }
      }

      // If the Ditto object exists but is closed (for example: we closed it
      // and failed to reopen above), try to open a fresh instance or abort
      // initialization. This prevents calling `setTransportConfig()` on a
      // closed Ditto object which throws.
      try {
        if (!this.ditto) {
          console.warn('Ditto instance missing after verification. Attempting fallback initialization.');
          if (!isReactNative && typeof (Ditto as any).open === 'function') {
            // Non-RN: try open() fallbacks
            try {
              console.log('Fallback: trying Ditto.open() with default config');
              this.ditto = await (Ditto as any).open();
              console.log('Fallback: Ditto.open() succeeded');
            } catch (openDefaultErr) {
              console.warn('Fallback Ditto.open() failed:', openDefaultErr);
            }
            if (!this.ditto) {
              try {
                console.log('Fallback: trying Ditto.open() with explicit persistenceDirectory as last resort');
                this.ditto = await (Ditto as any).open({ persistenceDirectory });
                console.log('Fallback: Ditto.open(persistenceDirectory) succeeded');
              } catch (lastResortErr) {
                console.warn('Last-resort Ditto.open(persistenceDirectory) failed:', lastResortErr);
              }
            }
          }
          // RN or final fallback: constructor with identity
          if (!this.ditto) {
            try {
              console.log('Fallback: trying `new Ditto(identity)`');
              this.ditto = new (Ditto as any)(identity);
              console.log('Fallback: new Ditto(identity) succeeded');
            } catch (ctorFallbackErr) {
              console.warn('Fallback new Ditto(identity) failed:', ctorFallbackErr);
            }
          }

          if (!this.ditto) {
            throw new Error('Ditto instance missing after verification and fallback attempts');
          }
        }

        if ((this.ditto as any).isClosed) {
          console.warn('Ditto instance is closed after verify/reopen. Attempting to open a new instance.');
          if (!isReactNative && typeof (Ditto as any).open === 'function') {
            this.ditto = await (Ditto as any).open({ persistenceDirectory });
          } else {
            this.ditto = new (Ditto as any)(identity);
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
        try {
          await this.ditto.startSync();
          console.log('[DittoService] startSync() succeeded');
        } catch (startErr) {
          console.error('[DittoService] startSync() failed:', startErr);
          // Emit error but allow caller to handle; rethrow so init fails visibly
          throw startErr;
        }
      } else {
        throw new Error('Ditto instance not available after construction');
      }

        this.isInitialized = true;
        this.emit('initialized');
        console.log('Ditto initialized successfully');

        // Attach any peer observers that were registered prior to initialization
        try {
          if (this.pendingPeerObservers.length && this.ditto) {
            const pending = this.pendingPeerObservers.splice(0);
            for (const cb of pending) {
              try {
                // Attach using internal helper which expects ditto to be available
                this._attachPeerObserver(cb);
              } catch (attachErr) {
                console.warn('Failed to attach pending peer observer:', attachErr);
              }
            }
          }
        } catch (flushErr) {
          console.warn('Failed flushing pending peer observers after initialization:', flushErr);
        }
      } catch (error) {
        const dittoError = error instanceof Error ? error : new Error('Failed to initialize Ditto');
        console.error('Failed to initialize Ditto:', dittoError);
        // Clear any queued peer observers to avoid leaking callbacks when
        // initialization fails. Callers should retry initialization and re-register
        // observers as needed.
        try { this.pendingPeerObservers.splice(0); } catch {}
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
      // Detect RN to avoid TransportConfig constructor and rely on shape object
      const isReactNative = this.isReactNative();
      let tc: any = null;

      if (!isReactNative && typeof (TransportConfig as any) === 'function') {
        tc = new (TransportConfig as any)();
        // set fields explicitly
        tc.peerToPeer.bluetoothLE.isEnabled = !!this.config.enableBluetooth;
        tc.peerToPeer.lan.isEnabled = !!this.config.enableWiFi;
        if (Platform.OS === 'ios') {
          tc.peerToPeer.awdl.isEnabled = !!this.config.enableAWDL;
        }
        if (this.config.websocketURL) {
          tc.connect.websocketURLs = [this.config.websocketURL];
        }
      } else {
        // RN-safe POJO config
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

      try {
        this.ditto.setTransportConfig(tc as TransportConfig);
        try { console.log('Ditto transport configuration set (TransportConfig):', tc); } catch {}
        // Log websocketURLs if present in a safe way
        try {
          const ws = (tc && tc.connect && tc.connect.websocketURLs) || (tc && tc.connect && tc.connect.websocketURLs) || [];
          try { console.log('[DittoService] transport websocketURLs length =', Array.isArray(ws) ? ws.length : 'unknown'); } catch {}
        } catch {}
      } catch (innerErr) {
        // In RN, setTransportConfig may be strict about instance types. Do not crash app.
        console.warn('setTransportConfig failed; continuing with defaults. Error:', innerErr);
      }
    } catch (err) {
      console.error('Failed to prepare Ditto transport config:', err);
      // Do not rethrow in RN to avoid crashing initialization
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
    // If Ditto isn't ready yet, queue the callback and attach it after
    // initialization completes. This is preferred for UI code that calls
    // observePeers synchronously in an effect immediately after calling
    // initialize(). If initialization already failed, this will throw.
    if (!this.ditto) {
      if (this.initializingPromise) {
        // Queue and return; the flush on successful init will attach it.
        this.pendingPeerObservers.push(callback);
        return;
      }
      throw new Error('Ditto not initialized');
    }

    // Attach immediately when Ditto is available.
    this._attachPeerObserver(callback);
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
  const isRN = this.isReactNative();
  if (isRN) {
    const dittoAny: any = this.ditto as any;
    const storeAny: any = dittoAny?.store;
    if (!storeAny || typeof storeAny.execute !== 'function') {
      throw new Error('Ditto.store.execute() unavailable in RN');
    }
    try {
      // Remove any existing row with same user-defined id
      await storeAny.execute(`DELETE FROM ${collectionName} WHERE id = :id`, { id });
    } catch {
      // ignore
    }
    await storeAny.execute(`INSERT INTO ${collectionName} VALUES (:doc)`, { doc: document });
    return;
  }
  const collection: any = await this.createCollection(collectionName);
  await collection.upsert(document, id);
  }

  async findDocument(collectionName: string, id: string): Promise<any> {
    const isRN = this.isReactNative();
    if (isRN) {
      const dittoAny: any = this.ditto as any;
      const storeAny: any = dittoAny?.store;
      if (!storeAny || typeof storeAny.execute !== 'function') {
        throw new Error('Ditto.store.execute() unavailable in RN');
      }
      const result = await storeAny.execute(`SELECT * FROM ${collectionName} WHERE id = :id LIMIT 1`, { id });
      const items = Array.isArray(result?.items) ? result.items : [];
      const first = items[0];
      const value = first && typeof first === 'object' && 'value' in first ? (first as any).value : first;
      return value ?? null;
    }
    const collection = await this.createCollection(collectionName);
    const doc = await collection.findByID(id).exec();
    return doc?.value || null;
  }

  async findAllDocuments(collectionName: string): Promise<any[]> {
    const isRN = this.isReactNative();
    if (isRN) {
      const dittoAny: any = this.ditto as any;
      const storeAny: any = dittoAny?.store;
      if (!storeAny || typeof storeAny.execute !== 'function') {
        throw new Error('Ditto.store.execute() unavailable in RN');
      }
      const res = await storeAny.execute(`SELECT * FROM ${collectionName}`);
      const arr = Array.isArray(res?.items) ? res.items : [];
      return arr.map((d: any) => (d && typeof d === 'object' && 'value' in d ? d.value : d));
    }
    const collection = await this.createCollection(collectionName);
    const docs = await collection.findAll().exec();
    return docs.map(doc => doc.value);
  }

  async subscribeToCollection(
    collectionName: string, 
    callback: (docs: any[], event: any) => void
  ): Promise<any> {
  const isReactNative = this.isReactNative();
  try { console.log(`[DittoService] subscribeToCollection(${collectionName}) isRN=${isReactNative}`); } catch {}
  if (isReactNative) {
    // React Native: prefer DQL observers
    const query = `SELECT * FROM ${collectionName}`;
    const dittoAny: any = this.ditto as any;
    const storeAny: any = dittoAny?.store;
    const regFn = storeAny?.registerObserver || dittoAny?.registerObserver;
    if (typeof regFn === 'function') {
      const handler = (payload: any) => {
        try {
          const arr = Array.isArray(payload) ? payload : (Array.isArray(payload?.items) ? payload.items : []);
          const normalized = arr.map((d: any) => (d && typeof d === 'object' && 'value' in d ? d.value : d));
          callback(normalized, undefined);
        } catch (err) {
          console.error('Observer callback error:', err);
        }
      };
      try {
        try { console.log('[DittoService] RN subscribeToCollection: using registerObserver'); } catch {}
        const ret = regFn.call(storeAny ?? dittoAny, query, handler);
        if (typeof ret === 'function') {
          return { cancel: ret, on: () => {} };
        }
        const cancel = () => {
          try {
            if (ret?.cancel) ret.cancel();
            else if (ret?.stop) ret.stop();
            else if (ret?.close) ret.close();
          } catch (e) {
            console.warn('Failed to cancel Ditto observer:', e);
          }
        };
        return { cancel, on: () => {} };
      } catch (e1) {
        // Try (query, options, callback) signature
        try {
          try { console.log('[DittoService] RN subscribeToCollection: using registerObserver(query, {}, handler)'); } catch {}
          const ret = regFn.call(storeAny ?? dittoAny, query, {}, handler);
          if (typeof ret === 'function') {
            return { cancel: ret, on: () => {} };
          }
          const cancel = () => {
            try {
              if (ret?.cancel) ret.cancel();
              else if (ret?.stop) ret.stop();
              else if (ret?.close) ret.close();
            } catch (e) {
              console.warn('Failed to cancel Ditto observer:', e);
            }
          };
          return { cancel, on: () => {} };
        } catch (e2) {
          console.error('registerObserver failed with both signatures:', e1, e2);
          // Fall through to polling strategies below (avoid legacy subscribe in RN)
        }
      }
    }
    // RN fallback: polling with DQL execute()
    try {
      const exec = storeAny?.execute || dittoAny?.execute || (dittoAny?.store && dittoAny.store.execute);
      try { console.log('[DittoService] RN subscribeToCollection: execute() available =', typeof exec === 'function'); } catch {}
      if (typeof exec === 'function') {
        const intervalMs = 2000;
        let cancelled = false;
        const poll = async () => {
          if (cancelled) return;
          try {
            const res = await exec.call(storeAny ?? dittoAny, query);
            const arr = Array.isArray(res) ? res : (Array.isArray(res?.items) ? res.items : []);
            const normalized = arr.map((d: any) => (d && typeof d === 'object' && 'value' in d ? d.value : d));
            callback(normalized, undefined);
          } catch (e) {
            console.warn('Ditto execute() polling error:', e);
          } finally {
            if (!cancelled) setTimeout(poll, intervalMs);
          }
        };
        // kick off
        setTimeout(poll, 0);
        return { cancel: () => { cancelled = true; }, on: () => {} };
      }
    } catch (pollErr) {
      console.warn('registerObserver unavailable and execute() polling failed:', pollErr);
    }
    // As a last resort on RN, return a no-op subscription to avoid using legacy Collection APIs
    console.warn('[DittoService] RN subscribeToCollection: registerObserver and execute() unavailable; returning no-op subscription');
    return { cancel: () => {}, on: () => {} };
  }

  // Non-RN (Node/web) or older SDKs: fallback to legacy subscribe API
  const collection: any = await this.createCollection(collectionName);
  const subscription: any = (collection.findAll() as any).subscribe();
  subscription.on('update', (docs: any[], event: any) => {
    const normalized = Array.isArray(docs) ? docs.map((d: any) => (d && typeof d === 'object' && 'value' in d ? d.value : d)) : [];
    callback(normalized, event);
  });
  return subscription;
  }

  async removeDocument(collectionName: string, id: string): Promise<void> {
    const isRN = this.isReactNative();
    if (isRN) {
      const dittoAny: any = this.ditto as any;
      const storeAny: any = dittoAny?.store;
      if (!storeAny || typeof storeAny.execute !== 'function') {
        throw new Error('Ditto.store.execute() unavailable in RN');
      }
      await storeAny.execute(`DELETE FROM ${collectionName} WHERE id = :id`, { id });
      return;
    }
    const collection = await this.createCollection(collectionName);
    await collection.findByID(id).remove();
  }
}
