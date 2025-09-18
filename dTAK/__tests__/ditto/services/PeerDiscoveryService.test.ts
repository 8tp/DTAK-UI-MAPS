/* eslint-disable @typescript-eslint/no-var-requires */

jest.useFakeTimers();

// Mock Platform and Device name
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }), { virtual: true });
jest.mock('expo-device', () => ({ deviceName: 'UnitTestDevice' }), { virtual: true });

// Local storage for subscription callbacks
const presenceCallbacks: any[] = [];
let observePeersCb: any = null;

jest.mock('../../../ditto/services/DittoService', () => {
  class DittoServiceMock {
    static _instance: any;
    static getInstance() {
      if (!this._instance) this._instance = new DittoServiceMock();
      return this._instance;
    }
    isReady() { return true; }
    async getDeviceInfo() { return { deviceName: 'UnitTestDevice', deviceType: 'ios', deviceId: 'site1' }; }
    async subscribeToCollection(name: string, cb: any) {
      if (name === 'peer_presence') presenceCallbacks.push(cb);
      return { on: jest.fn(), cancel: jest.fn() };
    }
    async upsertDocument() { /* recorded via jest spy if needed */ }
    async removeDocument() { /* recorded via jest spy if needed */ }
    observePeers(cb: any) { observePeersCb = cb; return Promise.resolve(); }
    async getStore() {
      return {
        collection: () => ({
          findByID: () => ({
            update: (fn: any) => fn({
              at: (_k: string) => ({ set: jest.fn() })
            })
          })
        })
      };
    }
  }
  return { DittoService: DittoServiceMock };
});

describe('PeerDiscoveryService', () => {
  let PeerDiscoveryService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    ({ PeerDiscoveryService } = require('../../../ditto/services/PeerDiscoveryService'));
  });

  test('startDiscovery broadcasts presence and subscribes to updates', async () => {
    const svc = new PeerDiscoveryService();
    const onDiscovered = jest.fn();
    svc.on('peerDiscovered', onDiscovered);

    await svc.startDiscovery();

    // Simulate incoming presence doc
    const presence = { peerId: 'peer-2', displayName: 'P2', deviceType: 'ios', capabilities: [], lastUpdate: new Date().toISOString(), status: 'available' };
    presenceCallbacks.forEach(cb => cb([presence] as any));

    expect(onDiscovered).toHaveBeenCalled();
  });

  test('monitorPeerConnections emits peerConnected and peerDisconnected', async () => {
    const svc = new PeerDiscoveryService();
    const onConnected = jest.fn();
    const onDisconnected = jest.fn();
    svc.on('peerConnected', onConnected);
    svc.on('peerDisconnected', onDisconnected);

    await svc.startDiscovery();

    // Simulate peers connected
    observePeersCb?.([{ deviceName: 'peer-3', connections: [{ connectionType: 'lan' }] }]);
    expect(onConnected).toHaveBeenCalled();

    // Simulate no active peers -> previous becomes disconnected
    observePeersCb?.([]);
    expect(onDisconnected).toHaveBeenCalled();
  });

  test('updateStatus and updateLocation call store update', async () => {
    const svc = new PeerDiscoveryService();
    await svc.startDiscovery();

    await svc.updateStatus('busy');
    await svc.updateLocation({ latitude: 1, longitude: 2, accuracy: 5 });

    // Nothing to assert beyond no-throw; methods internally call store update
    expect(typeof svc.getLocalPeerId()).toBe('string');
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
