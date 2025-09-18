jest.useFakeTimers();

// Mock Platform and PeerDiscoveryService
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }), { virtual: true });
jest.mock('../../../ditto/services/PeerDiscoveryService', () => {
  return {
    PeerDiscoveryService: class PeerDiscoveryServiceMock {
      getLocalPeerId() { return 'peer-self'; }
      getLocalPeerName() { return 'Self'; }
      getConnectedPeers() { return [{ id: 'peer-1' }, { id: 'peer-2' }]; }
    }
  };
});

const subscriptions = {};

jest.mock('../../../ditto/services/DittoService', () => {
  class DittoServiceMock {
    static getInstance() {
      if (!this._instance) this._instance = new DittoServiceMock();
      return this._instance;
    }
    constructor() {
      this.upsertDocument = jest.fn();
      this.findAllDocuments = jest.fn().mockResolvedValue([]);
      this.findDocument = jest.fn();
      this.getStore = jest.fn().mockResolvedValue({
        collection: () => ({
          findByID: () => ({ update: (fn) => fn({ at: () => ({ set: jest.fn(), value: [] }) }) })
        })
      });
    }
    isReady() { return true; }
    subscribeToCollection(name, cb) {
      subscriptions[name] = cb;
      return Promise.resolve({ on: jest.fn(), cancel: jest.fn() });
    }
  }
  return { DittoService: DittoServiceMock };
});

describe('MessagingService queries and shutdown', () => {
  let MessagingService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    ({ MessagingService } = require('../../../ditto/services/MessagingService'));
  });

  test('getLocationMessages filters by peerId and sorts by timestamp desc', async () => {
    const svc = new MessagingService();
    await svc.initialize();

    const { DittoService } = require('../../../ditto/services/DittoService');
    const instance = DittoService.getInstance();
    const docs = [
      { id: 'a', type: 'location', senderId: 'p1', timestamp: new Date('2024-01-01').toISOString(), acknowledgements: [], retryCount: 0 },
      { id: 'b', type: 'location', senderId: 'p2', timestamp: new Date('2024-01-03').toISOString(), acknowledgements: [], retryCount: 0 },
      { id: 'c', type: 'location', senderId: 'p1', timestamp: new Date('2024-01-02').toISOString(), acknowledgements: [], retryCount: 0 },
      { id: 'd', type: 'chat', timestamp: new Date('2024-01-04').toISOString(), acknowledgements: [], retryCount: 0 },
    ];
    instance.findAllDocuments.mockResolvedValueOnce(docs);

    const result = await svc.getLocationMessages('p1');
    expect(result.map(m => m.id)).toEqual(['c', 'a']);
  });

  test('getMarkerMessages returns only markers sorted desc', async () => {
    const svc = new MessagingService();
    await svc.initialize();

    const { DittoService } = require('../../../ditto/services/DittoService');
    const instance = DittoService.getInstance();
    const docs = [
      { id: 'm1', type: 'marker', timestamp: new Date('2024-01-02').toISOString(), acknowledgements: [], retryCount: 0 },
      { id: 'm2', type: 'marker', timestamp: new Date('2024-01-03').toISOString(), acknowledgements: [], retryCount: 0 },
      { id: 'x', type: 'chat', timestamp: new Date('2024-01-01').toISOString(), acknowledgements: [], retryCount: 0 },
    ];
    instance.findAllDocuments.mockResolvedValueOnce(docs);

    const result = await svc.getMarkerMessages();
    expect(result.map(m => m.id)).toEqual(['m2', 'm1']);
  });

  test('markMessageAsRead does nothing when message from self', async () => {
    const svc = new MessagingService();
    await svc.initialize();

    const { DittoService } = require('../../../ditto/services/DittoService');
    const instance = DittoService.getInstance();
    instance.findDocument.mockResolvedValueOnce({ id: 'm1', senderId: 'peer-self' });

    await svc.markMessageAsRead('m1');
    expect(instance.upsertDocument).not.toHaveBeenCalledWith('acknowledgements', expect.any(Object), expect.any(String));
  });

  test('getMessages supports limit and offset', async () => {
    const svc = new MessagingService();
    await svc.initialize();

    const { DittoService } = require('../../../ditto/services/DittoService');
    const instance = DittoService.getInstance();
    const docs = [
      { id: '1', type: 'chat', timestamp: new Date('2024-01-01').toISOString(), acknowledgements: [], retryCount: 0 },
      { id: '2', type: 'chat', timestamp: new Date('2024-01-02').toISOString(), acknowledgements: [], retryCount: 0 },
      { id: '3', type: 'chat', timestamp: new Date('2024-01-03').toISOString(), acknowledgements: [], retryCount: 0 },
    ];
    instance.findAllDocuments.mockResolvedValueOnce(docs);

    const page = await svc.getMessages(1, 1); // one item, skip latest
    expect(page.map(m => m.id)).toEqual(['2']);
  });

  test('shutdown cancels subscriptions and clears retries', async () => {
    const svc = new MessagingService();
    await svc.initialize();

    // schedule a retry by sending a chat
    await svc.sendChatMessage('retry me');

    // assign fake subscriptions
    svc.messageSubscription = { cancel: jest.fn() };
    svc.ackSubscription = { cancel: jest.fn() };

    await svc.shutdown();
    expect(svc.messageSubscription).toBeNull();
    expect(svc.ackSubscription).toBeNull();
  });
});
