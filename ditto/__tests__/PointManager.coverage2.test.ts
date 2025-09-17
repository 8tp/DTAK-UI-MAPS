/**
 * More PointManager branches to push coverage
 */

import { PointManager } from '../src/managers/PointManager';
import { DittoConfig } from '../src/config/DittoConfig';
import { ErrorType } from '../src/types/MapPoint';

jest.mock('../src/config/DittoConfig');

describe('PointManager additional coverage 2', () => {
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

  test('getAllPoints returns items and maps values', async () => {
    const pm = new PointManager();
    await pm.initialize();
    const items = [{ value: { _id: '1' } }, { value: { _id: '2' } }];
    mockDitto.store.execute.mockResolvedValueOnce({ items });
    const res = await pm.getAllPoints();
    expect(res.map((x: any) => x._id)).toEqual(['1', '2']);
  });

  test('getAllPoints throws on execute error', async () => {
    const pm = new PointManager();
    await pm.initialize();
    mockDitto.store.execute.mockRejectedValueOnce(new Error('boom'));
    await expect(pm.getAllPoints()).rejects.toBeTruthy();
  });

  test('updatePoint validation error path', async () => {
    const pm = new PointManager();
    await pm.initialize();
    // invalid latitude triggers validation in update path
    await expect(pm.updatePoint('id', { latitude: 999 } as any)).rejects.toMatchObject({ type: ErrorType.VALIDATION_ERROR });
  });
});


