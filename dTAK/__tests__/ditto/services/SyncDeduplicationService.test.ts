/* eslint-disable @typescript-eslint/no-var-requires */

// Mock DittoService used internally by SyncDeduplicationService
jest.mock('../../../ditto/services/DittoService', () => {
  const findDocument = jest.fn();
  const upsertDocument = jest.fn();
  const getStore = jest.fn();

  class DittoServiceMock {
    static _instance: any;
    static getInstance() {
      if (!this._instance) {
        this._instance = { findDocument, upsertDocument, getStore };
      }
      return this._instance;
    }
  }

  return { DittoService: DittoServiceMock };
});

describe('SyncDeduplicationService', () => {
  let service: any;
  let DittoService: any;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Re-require after mocks
    ({ DittoService } = require('../../../ditto/services/DittoService'));
    const { SyncDeduplicationService } = require('../../../ditto/services/SyncDeduplicationService');
    service = new SyncDeduplicationService();
  });

  test('generateDeterministicId produces stable ID for message type', () => {
    const dataA = {
      content: 'Hello',
      type: 'chat',
      senderId: 'peer-1',
      timestamp: new Date('2024-01-01T00:00:00Z')
    };

    const dataB = { // same content, different property order
      senderId: 'peer-1',
      type: 'chat',
      timestamp: new Date('2024-01-01T00:00:00Z'),
      content: 'Hello'
    };

    const idA = service.generateDeterministicId(dataA, 'message');
    const idB = service.generateDeterministicId(dataB, 'message');

    expect(idA).toEqual(idB);
    expect(idA.startsWith('message_')).toBe(true);
  });

  test('isDuplicate returns false when no existing record', async () => {
    const mockInstance = DittoService.getInstance();
    mockInstance.findDocument.mockResolvedValueOnce(null);

    const result = await service.isDuplicate({
      content: 'Hello',
      type: 'chat',
      senderId: 'peer-1',
      timestamp: new Date()
    }, 'message');

    expect(result).toBe(false);
    expect(mockInstance.findDocument).toHaveBeenCalled();
  });

  test('isDuplicate returns true when existing record is found', async () => {
    const mockInstance = DittoService.getInstance();
    mockInstance.findDocument.mockResolvedValueOnce({ id: 'message_abc' });

    const result = await service.isDuplicate({
      content: 'Hello',
      type: 'chat',
      senderId: 'peer-1',
      timestamp: new Date()
    }, 'message');

    expect(result).toBe(true);
  });
});
