/**
 * Final PointManager branches for line coverage
 */

import { PointManager } from '../src/managers/PointManager';
import { DittoConfig } from '../src/config/DittoConfig';

jest.mock('../src/config/DittoConfig');

describe('PointManager coverage 3', () => {
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

  test('getPointsInBounds error path triggers catch', async () => {
    const pm = new PointManager();
    await pm.initialize();
    mockDitto.store.execute.mockRejectedValueOnce(new Error('bounds fail'));
    await expect(pm.getPointsInBounds({
      northEast: { latitude: 1, longitude: 1 },
      southWest: { latitude: 0, longitude: 0 },
    } as any)).rejects.toBeTruthy();
  });

  test('getPointsByCategory error path triggers catch', async () => {
    const pm = new PointManager();
    await pm.initialize();
    mockDitto.store.execute.mockRejectedValueOnce(new Error('category fail'));
    await expect(pm.getPointsByCategory('x')).rejects.toBeTruthy();
  });

  test('observeAllPoints returns unsubscribe and maps values via callback', () => {
    const pm = new PointManager();
    const cancel = jest.fn();
    mockDitto.store.registerObserver.mockImplementation((_q: string, cb: Function) => {
      cb({ items: [{ value: { _id: 'a' } }] });
      return { cancel };
    });

    const collected: any[] = [];
    const unsubscribe = pm.observeAllPoints((pts) => {
      collected.push(pts);
    });

    expect(collected[0][0]._id).toBe('a');
    unsubscribe();
    expect(cancel).toHaveBeenCalled();
  });
});


