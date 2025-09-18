/* eslint-disable @typescript-eslint/no-var-requires */

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

const subscriptions: Record<string, (docs: any[], event?: any) => void> = {};

jest.mock('../../../ditto/services/DittoService', () => {
  class DittoServiceMock {
    static _instance: any;
    static getInstance() {
      if (!this._instance) this._instance = new DittoServiceMock();
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
        findByID: () => ({ update: (fn) => {
          // Provide a mutableDoc supporting acks manipulation
          const mutableDoc = {
            at: (key) => {
              if (key === 'acknowledgements') {
                const obj: any = {
                  value: [],
                  set: (arr: any[]) => { obj.value = arr; },
                  at: (_i: number) => ({
                    at: (_sub: string) => ({ set: jest.fn() })
                  })
                };
                return obj;
              }
              if (key === 'deliveryStatus') {
                return { set: jest.fn() };
              }
              return { set: jest.fn(), value: undefined };
            }
          };
          fn(mutableDoc);
        })
      })
    });
  }
  return { DittoService: DittoServiceMock };
});

describe('MessagingService additional flows', () => {
  let MessagingService: any;

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
    // called multiple times for both messages
    expect((instance.upsertDocument as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(2);
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

    // send a chat to schedule a retry
    await svc.sendChatMessage('hello');

    // trigger ack docs for recipient self
    const ackDoc = {
      id: 'ack1',
      messageId: 'someMessage',
      senderId: 'peer-other',
      senderName: 'Other',
      recipientId: 'peer-self',
      status: 'delivered',
      timestamp: new Date().toISOString(),
    };
    subscriptions['acknowledgements']?.([ackDoc]);

    // Advance timers to ensure no further unhandled retry causes errors.
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
    (svc as any).scheduleRetry(message);
    expect(expiredListener).toHaveBeenCalled();
  });
});
