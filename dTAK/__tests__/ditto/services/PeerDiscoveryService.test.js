jest.useFakeTimers();

// Mock Platform and Device name
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }), { virtual: true });
jest.mock('expo-device', () => ({ deviceName: 'UnitTestDevice' }), { virtual: true });

// Local storage for subscription callbacks
const presenceCallbacks = [];
let observePeersCb = null;

jest.mock('../../../ditto/services/DittoService', () => {
  class DittoServiceMock {
    static getInstance() {
      if (!this._instance) this._instance = new DittoServiceMock();
      return this._instance;
    }
    isReady() { return true; }
    async getDeviceInfo() { return { deviceName: 'UnitTestDevice', deviceType: 'ios', deviceId: 'site1' }; }
    async subscribeToCollection(name, cb) {
      if (name === 'peer_presence') presenceCallbacks.push(cb);
      return { on: jest.fn(), cancel: jest.fn() };
    }
    async upsertDocument() { /* tracked via spies if needed */ }
    async removeDocument() { /* tracked via spies if needed */ }
    observePeers(cb) { observePeersCb = cb; return Promise.resolve(); }
    async getStore() {
      return {
        collection: () => ({
          findByID: () => ({
            update: (fn) => {
              const mutableDoc = {
                at: (key) => {
                  if (key === 'lastUpdate') return { set: jest.fn() };
                  if (key === 'status') return { set: jest.fn() };
                  if (key === 'location') return { set: jest.fn() };
                  return { set: jest.fn(), value: undefined };
                }
              };
              fn(mutableDoc);
            }
          })
        })
      };
    }
  }
  return { DittoService: DittoServiceMock };
});

describe('PeerDiscoveryService (JS)', () => {
  let PeerDiscoveryService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    // Reset local callback storage between tests to avoid cross-test pollution
    presenceCallbacks.length = 0;
    observePeersCb = null;
    ({ PeerDiscoveryService } = require('../../../ditto/services/PeerDiscoveryService'));
  });

  test('startDiscovery broadcasts presence and subscribes to updates', async () => {
    const svc = new PeerDiscoveryService();
    const onDiscovered = jest.fn();
    svc.on('peerDiscovered', onDiscovered);

    await svc.startDiscovery();

    // Simulate incoming presence doc
    const presence = { peerId: 'peer-2', displayName: 'P2', deviceType: 'ios', capabilities: [], lastUpdate: new Date(), status: 'available' };
    presenceCallbacks.forEach(cb => cb([presence]));

    expect(onDiscovered).toHaveBeenCalled();
  });

  test('monitorPeerConnections emits peerConnected and peerDisconnected', async () => {
    const svc = new PeerDiscoveryService();
    const onConnected = jest.fn();
    const onDisconnected = jest.fn();
    svc.on('peerConnected', onConnected);
    svc.on('peerDisconnected', onDisconnected);

    await svc.startDiscovery();

    // Preload a peer via presence with stale lastUpdate so it starts disconnected
    const stalePresence = { peerId: 'peer-3', displayName: 'P3', deviceType: 'ios', capabilities: [], lastUpdate: new Date(Date.now() - 10 * 60 * 1000), status: 'available' };
    presenceCallbacks.forEach(cb => cb([stalePresence]));

    // Simulate peers connected
    observePeersCb && observePeersCb([{ deviceName: 'peer-3', connections: [{ connectionType: 'lan' }] }]);
    expect(onConnected).toHaveBeenCalled();

    // Simulate no active peers -> previous becomes disconnected
    observePeersCb && observePeersCb([]);
    expect(onDisconnected).toHaveBeenCalled();
  });

  test('updateStatus and updateLocation call store update without throw', async () => {
    const svc = new PeerDiscoveryService();
    await svc.startDiscovery();

    await svc.updateStatus('busy');
    await svc.updateLocation({ latitude: 1, longitude: 2, accuracy: 5 });

    expect(typeof svc.getLocalPeerId()).toBe('string');
  });

  test('heartbeat triggers updatePresence and cleanup of stale peers', async () => {
    const svc = new PeerDiscoveryService();
    const onRemoved = jest.fn();
    svc.on('peerRemoved', onRemoved);

    await svc.startDiscovery();

    // Add a stale peer then advance timer to trigger cleanup
    const stalePresence = { peerId: 'peer-old', displayName: 'Old', deviceType: 'ios', capabilities: [], lastUpdate: new Date(Date.now() - 10 * 60 * 1000), status: 'available' };
    presenceCallbacks.forEach(cb => cb([stalePresence]));

    // Advance the heartbeat interval (30s) and await async callback completion
    if (jest.advanceTimersByTimeAsync) {
      await jest.advanceTimersByTimeAsync(30000);
    } else {
      jest.advanceTimersByTime(30000);
      // flush microtasks from async interval callback
      await Promise.resolve();
    }

    expect(onRemoved).toHaveBeenCalled();
  });

  test('stopDiscovery clears peers and removes own presence', async () => {
    const dittoModule = require('../../../ditto/services/DittoService');
    const instance = dittoModule.DittoService.getInstance();
    const removeSpy = jest.spyOn(instance, 'removeDocument');

    const svc = new PeerDiscoveryService();
    await svc.startDiscovery();
    await svc.stopDiscovery();

    expect(removeSpy).toHaveBeenCalledWith('peer_presence', svc.getLocalPeerId());
    expect(svc.getPeers().length).toBe(0);
  });
});
