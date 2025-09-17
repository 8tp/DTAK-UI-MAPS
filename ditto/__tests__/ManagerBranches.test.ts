/**
 * Extra branch coverage for DittoManager/PointManager
 */

import { PointManager } from '../src/managers/PointManager';
import { DittoConfig } from '../src/config/DittoConfig';
import { ErrorType } from '../src/types/MapPoint';

// Mock Ditto instance
const mockDitto: any = {
  store: {
    execute: jest.fn(),
    registerObserver: jest.fn(),
  },
  sync: {
    registerSubscription: jest.fn().mockResolvedValue(undefined),
  },
};

jest.mock('../src/config/DittoConfig');

describe('Manager branches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-expect-error jest mock
    (DittoConfig.getInstanceOrThrow as jest.Mock).mockReturnValue(mockDitto);
    // @ts-expect-error jest mock
    (DittoConfig.getInstance as jest.Mock).mockReturnValue(mockDitto);
  });

  test('executeQuery error mapping via createPoint (permission)', async () => {
    const pm = new PointManager();
    await pm.initialize();
    mockDitto.store.execute.mockRejectedValueOnce(new Error('Permission denied'));
    await expect(pm.createPoint({ latitude: 0, longitude: 0, title: 't' })).rejects.toMatchObject({ type: ErrorType.PERMISSION_ERROR });
  });

  test('deletePoint returns false on underlying error', async () => {
    const pm = new PointManager();
    await pm.initialize();
    mockDitto.store.execute.mockRejectedValueOnce(new Error('network down'));
    const ok = await pm.deletePoint('id');
    expect(ok).toBe(false);
  });

  test('getPointCount returns value and returns 0 on error', async () => {
    const pm = new PointManager();
    await pm.initialize();
    mockDitto.store.execute.mockResolvedValueOnce({ items: [{ value: { count: 7 } }] });
    expect(await pm.getPointCount()).toBe(7);
    mockDitto.store.execute.mockRejectedValueOnce(new Error('any'));
    expect(await pm.getPointCount()).toBe(0);
  });

  test('registerObserver throws -> returns no-op unsubscribe', () => {
    const pm = new PointManager();
    // simulate throw inside registerObserver
    mockDitto.store.registerObserver.mockImplementationOnce(() => { throw new Error('observer fail'); });
    const unsubscribe = (pm as any).registerObserver('SELECT 1', () => {});
    expect(typeof unsubscribe).toBe('function');
    expect(() => unsubscribe()).not.toThrow();
  });
});


