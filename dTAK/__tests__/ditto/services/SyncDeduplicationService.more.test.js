jest.useFakeTimers();

// Mock DittoService with controllable methods (created inside factory)
jest.mock('../../../ditto/services/DittoService', () => {
  class DittoServiceMock {
    static getInstance() {
      if (!this._instance) this._instance = new DittoServiceMock();
      return this._instance;
    }
    constructor() {
      this.findDocument = jest.fn();
      this.upsertDocument = jest.fn();
      this.getStore = jest.fn();
      this.findAllDocuments = jest.fn();
    }
  }
  return { DittoService: DittoServiceMock };
});

describe('SyncDeduplicationService - extended coverage', () => {
  let service;
  let DittoService;
  let instance;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    ({ DittoService } = require('../../../ditto/services/DittoService'));
    ({ SyncDeduplicationService: ServiceCtor } = require('../../../ditto/services/SyncDeduplicationService'));
    service = new ServiceCtor();
    instance = DittoService.getInstance();
  });

  test('processIncomingData accepts new data and creates record', async () => {
    instance.findDocument.mockResolvedValueOnce(null);

    // stub getStore not used in this branch but keep safe
    instance.getStore.mockResolvedValue({ collection: () => ({ findByID: () => ({ update: (fn) => fn({ at: () => ({ set: jest.fn(), value: [] }) }) }) }) });

    const data = { content: 'Hi', type: 'chat', senderId: 'p1', timestamp: new Date() };
    const source = { provider: 'peer', id: 'p1', timestamp: new Date() };

    const onCreated = jest.fn();
    service.on('recordCreated', onCreated);

    const result = await service.processIncomingData(data, 'message', source);

    expect(result.action).toBe('accept');
    expect(instance.upsertDocument).toHaveBeenCalledWith('sync_records', expect.any(Object), expect.stringMatching(/^message_/));
    expect(onCreated).toHaveBeenCalled();
  });

  test('processIncomingData rejects duplicate and updates sources', async () => {
    // Force deterministic ID to hook our mock
    jest.spyOn(service, 'generateDeterministicId').mockReturnValue('id_dup');

    // Build existing record doc (as stored)
    const existingDoc = {
      id: 'id_dup',
      dataType: 'message',
      sourceId: 'p1',
      hash: 'h_old',
      timestamp: new Date().toISOString(),
      syncStatus: 'pending',
      sources: [{ id: 'p1', provider: 'peer', timestamp: new Date('2024-01-01').toISOString() }],
    };
    instance.findDocument.mockResolvedValueOnce(existingDoc);

    // Make new hash same as existing to trigger duplicate path
    jest.spyOn(service, 'generateHash').mockReturnValue('h_old');

    let setSpy;
    instance.getStore.mockResolvedValue({
      collection: () => ({
        findByID: () => ({ update: (fn) => {
          const sourcesPath = { value: [], set: (arr) => setSpy(arr) };
          const mutable = { at: (key) => key === 'sources' ? sourcesPath : { set: jest.fn(), value: undefined } };
          setSpy = jest.fn();
          fn(mutable);
        }})
      })
    });

    const data = { content: 'Hi', type: 'chat', senderId: 'p1', timestamp: new Date() };
    const source = { provider: 'peer', id: 'p1', timestamp: new Date('2024-01-02') };

    const result = await service.processIncomingData(data, 'message', source);

    expect(result.action).toBe('reject');
    expect(setSpy).toHaveBeenCalled();
  });

  test('processIncomingData conflict triggers conflict record and resolves LWW', async () => {
    jest.spyOn(service, 'generateDeterministicId').mockReturnValue('id_conf');

    const existingDoc = {
      id: 'id_conf',
      dataType: 'message',
      sourceId: 'p1',
      hash: 'h_old',
      timestamp: new Date().toISOString(),
      syncStatus: 'pending',
      sources: [{ id: 'p1', provider: 'peer', timestamp: new Date('2024-01-01').toISOString() }],
    };
    instance.findDocument.mockResolvedValueOnce(existingDoc);

    // New hash different -> conflict path
    jest.spyOn(service, 'generateHash').mockReturnValueOnce('h_new');

    // getStore used by updateSyncRecord
    instance.getStore.mockResolvedValue({
      collection: () => ({
        findByID: () => ({ update: (fn) => fn({ at: () => ({ set: jest.fn(), value: [] }) }) })
      })
    });

    const onResolved = jest.fn();
    const onConflict = jest.fn();
    service.on('conflictResolved', onResolved);
    service.on('conflictDetected', onConflict);

    const data = { content: 'Changed', type: 'chat', senderId: 'p1', timestamp: new Date('2024-01-02') };
    const source = { provider: 'peer', id: 'p1', timestamp: new Date('2024-01-03') };

    const result = await service.processIncomingData(data, 'message', source);

    expect(result.action).toBe('conflict');
    // conflict upsert to conflicts collection and a subsequent upsert to sync_records during update
    expect(instance.upsertDocument).toHaveBeenCalledWith('sync_conflicts', expect.any(Object), expect.stringMatching(/^conflict_/));
    expect(instance.upsertDocument).toHaveBeenCalledWith('sync_records', expect.any(Object), 'id_conf');
    expect(onConflict).toHaveBeenCalled();
    expect(onResolved).toHaveBeenCalled();
  });

  test('processConflicts resolves pending conflicts by id', async () => {
    // Access private via bracket notation
    const spy = jest.spyOn(service, 'resolveConflictById');
    instance.findAllDocuments.mockResolvedValueOnce([{ id: 'c1', status: 'pending' }, { id: 'c2', status: 'done' }]);

    await service['processConflicts']();
    expect(spy).toHaveBeenCalledWith('c1');
  });
});
