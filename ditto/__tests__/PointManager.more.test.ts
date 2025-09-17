/**
 * Additional tests to push coverage for PointManager/DittoManager branches
 */

import { PointManager } from '../src/managers/PointManager';
import { DittoConfig } from '../src/config/DittoConfig';
import { ErrorType } from '../src/types/MapPoint';

jest.mock('../src/config/DittoConfig');

describe('PointManager additional branches', () => {
  let mockDitto: any;

  beforeEach(() => {
    mockDitto = {
      store: {
        execute: jest.fn(),
        registerObserver: jest.fn(),
      },
      sync: { registerSubscription: jest.fn().mockResolvedValue(undefined) },
    };
    // @ts-expect-error jest mock
    (DittoConfig.getInstanceOrThrow as jest.Mock).mockReturnValue(mockDitto);
    // @ts-expect-error jest mock
    (DittoConfig.getInstance as jest.Mock).mockReturnValue(mockDitto);
  });

  test('updatePoint builds dynamic fields and sanitizes string params', async () => {
    const pm = new PointManager();
    await pm.initialize();

    // First execute call: UPDATE, second: GET updated
    mockDitto.store.execute
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({ items: [{ value: { _id: 'id', title: 'T', description: 'D', category: 'C', latitude: 0, longitude: 0, isDeleted: false } }] });

    const updates = { title: '  <b>T</b>  ', description: ' <i>D</i> ', category: ' C ' } as any;
    await pm.updatePoint('id', updates);

    const call = mockDitto.store.execute.mock.calls[0];
    const params = call[1];
    expect(call[0]).toMatch(/^UPDATE map_points SET/);
    expect(params.id).toBe('id');
    expect(params.updatedAt).toBeDefined();
    // Sanitization removes angle brackets and trims; tags collapse to letters
    expect(params.title).toBe('bT/b');
    expect(params.description).toBe('iD/i');
    expect(params.category).toBe('C');
  });

  test('getPointsByCategory empty input returns [] and skips execute', async () => {
    const pm = new PointManager();
    await pm.initialize();
    const res = await pm.getPointsByCategory('');
    expect(res).toEqual([]);
    expect(mockDitto.store.execute).not.toHaveBeenCalled();
  });

  test('searchPoints error maps to validation error type', async () => {
    const pm = new PointManager();
    await pm.initialize();
    mockDitto.store.execute.mockRejectedValueOnce(new Error('validation failed'));
    await expect(pm.searchPoints('abc')).rejects.toMatchObject({ type: ErrorType.VALIDATION_ERROR });
  });

  test('observer callback errors are caught; cancel error during unsubscribe is handled', () => {
    const pm = new PointManager();
    const throwingCallback = () => { throw new Error('in callback'); };
    const cancel = jest.fn(() => { throw new Error('cancel fail'); });

    // our registerObserver should immediately call the provided function to trigger callback
    mockDitto.store.registerObserver.mockImplementation((_q: string, fn: Function) => {
      fn({ items: [] });
      return { cancel };
    });

    const unsubscribe = (pm as any).registerObserver('SELECT 1', throwingCallback);
    // should not throw when unsubscribing even if cancel fails
    expect(() => unsubscribe()).not.toThrow();
  });
});


