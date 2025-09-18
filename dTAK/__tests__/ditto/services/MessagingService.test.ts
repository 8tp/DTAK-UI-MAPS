/* eslint-disable @typescript-eslint/no-var-requires */

jest.useFakeTimers();

// Mock react-native Platform
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }), { virtual: true });

// Mock PeerDiscoveryService to avoid nested Ditto dependency in MessagingService
jest.mock('../../../ditto/services/PeerDiscoveryService', () => {
  return {
    PeerDiscoveryService: class PeerDiscoveryServiceMock {
      getLocalPeerId() { return 'peer-self'; }
      getLocalPeerName() { return 'Self'; }
      getConnectedPeers() { return []; }
    }
  };
});

// Build DittoService mock used by MessagingService
const subscriptions: Record<string, (docs: any[], event?: any) => void> = {};

jest.mock('../../../ditto/services/DittoService', () => {
  class DittoServiceMock {
    static _instance: any;
    static getInstance() {
      if (!this._instance) {
        this._instance = new DittoServiceMock();
      }
      return this._instance;
    }
    isReady() { return true; }
    subscribeToCollection(name: string, cb: any) {
      subscriptions[name] = cb;
      return Promise.resolve({ on: jest.fn(), cancel: jest.fn() });
    }
    upsertDocument = jest.fn();
    findAllDocuments = jest.fn().mockResolvedValue([]);
    findDocument = jest.fn();
    getStore = jest.fn().mockResolvedValue({
      collection: () => ({
        findByID: () => ({ update: (fn: any) => fn(null) }),
      })
    });
  }
  return { DittoService: DittoServiceMock };
});

describe('MessagingService', () => {
  let MessagingService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    ({ MessagingService } = require('../../../ditto/services/MessagingService'));
  });

  test('initialize subscribes to messages and acknowledgements', async () => {
    const svc = new MessagingService();
    const onMessage = jest.fn();
    svc.on('messageReceived', onMessage);

    await svc.initialize();

    // Simulate an incoming message doc from subscription callback
    const msgDoc = {
      id: 'msg1',
      senderId: 'peer-other',
      senderName: 'Other',
      timestamp: new Date().toISOString(),
      type: 'chat',
      content: 'Hello',
      acknowledgements: [],
      retryCount: 0,
    };

    // Trigger messages subscription
    subscriptions['messages']?.([msgDoc] as any);

    expect(onMessage).toHaveBeenCalled();
    // Acknowledgement should be sent via upsertDocument on the DittoService instance
    const { DittoService } = require('../../../ditto/services/DittoService');
    const instance = DittoService.getInstance();
    expect(instance.upsertDocument).toHaveBeenCalledWith('acknowledgements', expect.any(Object), expect.any(String));
  });

  test('sendChatMessage stores message and emits messageSent', async () => {
    const svc = new MessagingService();
    const onSent = jest.fn();
    svc.on('messageSent', onSent);

    await svc.initialize();

    const id = await svc.sendChatMessage('Test message');
    expect(typeof id).toBe('string');

    const { DittoService } = require('../../../ditto/services/DittoService');
    const instance = DittoService.getInstance();
    expect(instance.upsertDocument).toHaveBeenCalledWith('messages', expect.objectContaining({ content: 'Test message', type: 'chat' }), expect.any(String));
    expect(onSent).toHaveBeenCalled();
  });

  test('retry scheduling triggers re-send after delay when no ack', async () => {
    const svc = new MessagingService();
    await svc.initialize();

    const { DittoService } = require('../../../ditto/services/DittoService');
    const instance = DittoService.getInstance();

    const initialCalls = (instance.upsertDocument as jest.Mock).mock.calls.length;
    await svc.sendChatMessage('Needs retry');

    // Advance timers by 5s (first retry delay) and expect another upsert call
    jest.advanceTimersByTime(5000);
    expect((instance.upsertDocument as jest.Mock).mock.calls.length).toBeGreaterThan(initialCalls);
  });

  test('markMessageAsRead sends read acknowledgement when message belongs to another sender', async () => {
    const svc = new MessagingService();
    await svc.initialize();

    const { DittoService } = require('../../../ditto/services/DittoService');
    const instance = DittoService.getInstance();
    // mock findDocument to return a message from another peer
    (instance.findDocument as jest.Mock).mockResolvedValueOnce({ id: 'm1', senderId: 'peer-other' });

    await svc.markMessageAsRead('m1');
    expect(instance.upsertDocument).toHaveBeenCalledWith('acknowledgements', expect.any(Object), expect.any(String));
  });

  test('getChatMessages returns sorted chat messages and filters by threadId', async () => {
    const svc = new MessagingService();
    await svc.initialize();

    const { DittoService } = require('../../../ditto/services/DittoService');
    const instance = DittoService.getInstance();

    const docs = [
      { id: '1', type: 'chat', content: 'b', timestamp: new Date('2024-01-02').toISOString(), threadId: 't1', acknowledgements: [], retryCount: 0, senderId: 'p', senderName: 'n', deliveryStatus: 'sent' },
      { id: '2', type: 'chat', content: 'a', timestamp: new Date('2024-01-01').toISOString(), threadId: 't1', acknowledgements: [], retryCount: 0, senderId: 'p', senderName: 'n', deliveryStatus: 'sent' },
      { id: '3', type: 'chat', content: 'z', timestamp: new Date('2024-01-03').toISOString(), threadId: 't2', acknowledgements: [], retryCount: 0, senderId: 'p', senderName: 'n', deliveryStatus: 'sent' },
    ];
    (instance.findAllDocuments as jest.Mock).mockResolvedValueOnce(docs);

    const result = await svc.getChatMessages('t1');
    expect(result.map((m: any) => m.content)).toEqual(['a', 'b']);
  });
});
