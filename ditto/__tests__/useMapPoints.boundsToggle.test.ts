/**
 * Toggle bounds to exercise useMapPoints observer setup lines
 */

import React from 'react';
import { act } from 'react-test-renderer';
import { useMapPoints } from '../src/hooks/useMapPoints';
import { DittoConfig } from '../src/config/DittoConfig';
import { PointManager } from '../src/managers/PointManager';

jest.mock('../src/config/DittoConfig');
jest.mock('../src/managers/PointManager');

const renderHook = <T,>(hook: (arg?: any) => T, arg?: any) => {
  const result: { current: T | null } = { current: null };
  const TestComponent: React.FC<{ a?: any }> = ({ a }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    result.current = hook(a);
    return null;
  };
  return {
    result,
    render: (renderer: any, a?: any) => renderer.create(React.createElement(TestComponent, { a })),
    rerender: (root: any, a?: any) => root.update(React.createElement(TestComponent, { a })),
  };
};

describe('useMapPoints bounds toggle', () => {
  let mockManager: any;

  beforeEach(() => {
    // @ts-expect-error jest mock
    (DittoConfig.initialize as jest.Mock).mockResolvedValue(undefined);
    mockManager = {
      initialize: jest.fn().mockResolvedValue(undefined),
      observeAllPoints: jest.fn().mockReturnValue(jest.fn()),
      observePointsInBounds: jest.fn().mockReturnValue(jest.fn()),
    };
    // @ts-expect-error jest mock
    (PointManager as jest.Mock).mockImplementation(() => mockManager);
  });

  test('switches from all points to bounded observer on prop change', async () => {
    const renderer = require('react-test-renderer');
    const { result, render, rerender } = renderHook((a?: any) => useMapPoints(a));

    let root: any;
    await act(async () => {
      root = render(renderer);
      await Promise.resolve();
    });
    expect(mockManager.observeAllPoints).toHaveBeenCalled();

    const bounds = { northEast: { latitude: 1, longitude: 1 }, southWest: { latitude: 0, longitude: 0 } } as any;
    await act(async () => {
      rerender(root, bounds);
      await Promise.resolve();
    });

    expect(mockManager.observePointsInBounds).toHaveBeenCalledWith(bounds, expect.any(Function));
    // loading can remain true until observer callback fires; just assert observer switched
  });
});
