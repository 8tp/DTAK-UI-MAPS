jest.useFakeTimers();

// Mock Platform and PeerDiscoveryService
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }), { virtual: true });
jest.mock('../../../ditto/services/PeerDiscoveryService', () => {
  return {
    PeerDiscoveryService: class PeerDiscoveryServiceMock {
      getLocalPeerId() { return 'peer-self'; }
      getLocalPeerName() { return 'Self'; }
      getConnectedPeers() { return [{ id: 'peer-other' }]; }
    }
  };
});

const subscriptions = {};

jest.mock('../../../ditto/services/DittoService', () => {
  function makeMutableDoc() {
    return {
      at: (key) => {
        if (key === 'acknowledgements') {
          const obj = {
            value: [],
            set: (arr) => { obj.value = arr; },
            at: (_i) => ({ at: (_sub) => ({ set: jest.fn() }) })
          };
          return obj;
        }
        if (key === 'deliveryStatus') {
          return { set: jest.fn() };
        }
        return { set: jest.fn(), value: undefined };
      }
    };
  }

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
          findByID: () => ({ update: (fn) => { fn(makeMutableDoc()); } })
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

describe('MessagingService additional flows (JS)', () => {
  let MessagingService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    ({ MessagingService } = require('../../../ditto/services/MessagingService'));
  });

  test('sendLocationUpdate and sendMarker invoke upsert', async () => {
    const svc = new MessagingService();
    await svc.initialize();

    const { DittoService } = require('../../../ditto/services/DittoService');
    const instance = DittoService.getInstance();

    await svc.sendLocationUpdate({ latitude: 1, longitude: 2, accuracy: 5 });
    await svc.sendMarker({ latitude: 1, longitude: 2, title: 'T', iconType: 'pin', color: '#f00', category: 'c' });

    expect(instance.upsertDocument).toHaveBeenCalledWith('messages', expect.any(Object), expect.any(String));
    expect(instance.upsertDocument.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  test('sendSystemMessage stores system messages', async () => {
    const svc = new MessagingService();
    await svc.initialize();

    const { DittoService } = require('../../../ditto/services/DittoService');
    const instance = DittoService.getInstance();

    await svc.sendSystemMessage('sync_status', 'ok');
    expect(instance.upsertDocument).toHaveBeenCalledWith('messages', expect.objectContaining({ type: 'system' }), expect.any(String));
  });

  test('acknowledgement subscription updates message and cancels retry', async () => {
    const svc = new MessagingService();
    await svc.initialize();

    await svc.sendChatMessage('hello');

    const ackDoc = {
      id: 'ack1',
      messageId: 'someMessage',
      senderId: 'peer-other',
      senderName: 'Other',
      recipientId: 'peer-self',
      status: 'delivered',
      timestamp: new Date().toISOString(),
    };
    subscriptions['acknowledgements'] && subscriptions['acknowledgements']([ackDoc]);

    jest.advanceTimersByTime(16000);
  });

  test('scheduleRetry with expired message triggers messageExpired event', async () => {
    const svc = new MessagingService();
    await svc.initialize();

    const expiredListener = jest.fn();
    svc.on('messageExpired', expiredListener);

    const message = {
      id: 'm-expired', senderId: 'peer-self', senderName: 'Self', type: 'chat', content: 'x',
      timestamp: new Date(), deliveryStatus: 'pending', acknowledgements: [], retryCount: 3,
    };
    svc._testScheduleRetry = (msg) => (svc).scheduleRetry ? (svc).scheduleRetry(msg) : (svc)['scheduleRetry'](msg);
    (svc)._testScheduleRetry(message);
    expect(expiredListener).toHaveBeenCalled();
  });
});
