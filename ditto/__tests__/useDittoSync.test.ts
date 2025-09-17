/**
 * Tests for useDittoSync hook
 */

import React from 'react';
import { act } from 'react-test-renderer';
import { useDittoSync } from '../src/hooks/useDittoSync';
import { DittoConfig } from '../src/config/DittoConfig';

// Minimal hook renderer without react-dom
const renderHook = <T,>(hook: () => T) => {
  const result: { current: T | null } = { current: null };
  const TestComponent: React.FC = () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    result.current = hook();
    return null;
  };
  return {
    result,
    render: (renderer: any) => renderer.create(React.createElement(TestComponent)),
  };
};

jest.mock('../src/config/DittoConfig');

describe('useDittoSync', () => {
  const mockPresence = { observe: jest.fn() };
  const mockDitto = { presence: mockPresence } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-expect-error jest mock
    (DittoConfig.getInstance as jest.Mock).mockReturnValue(mockDitto);
    // @ts-expect-error jest mock
    (DittoConfig.initialize as jest.Mock).mockResolvedValue(undefined);
  });

  test('initializes presence observer and sets online status', async () => {
    const renderer = require('react-test-renderer');

    // presence.observe should call back with a graph
    const stop = jest.fn();
    mockPresence.observe.mockImplementation((cb: (g: any) => void) => {
      // simulate async callback
      setTimeout(() => cb({ remotePeers: [{ id: 1 }] }), 0);
      return { stop };
    });

    const { result, render } = renderHook(() => useDittoSync());

    await act(async () => {
      render(renderer);
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(DittoConfig.getInstance).toHaveBeenCalled();
    expect(mockPresence.observe).toHaveBeenCalled();
    expect(result.current?.isOnline).toBe(true);
    expect(result.current?.connectedPeers).toBe(1);
    expect(result.current?.syncActive).toBe(true);
  });

  test('refreshSyncStatus sets online true when ditto is available', async () => {
    const renderer = require('react-test-renderer');
    mockPresence.observe.mockReturnValue({ stop: jest.fn() });

    const { result, render } = renderHook(() => useDittoSync());

    await act(async () => {
      render(renderer);
      await Promise.resolve();
    });

    await act(async () => {
      await result.current!.refreshSyncStatus();
    });

    expect(result.current?.isOnline).toBe(true);
  });

  test('handles initialization error and sets offline status', async () => {
    const renderer = require('react-test-renderer');
    // make getInstance return undefined initially and initialize reject
    // @ts-expect-error jest mock
    (DittoConfig.getInstance as jest.Mock).mockReturnValueOnce(undefined);
    // @ts-expect-error jest mock
    (DittoConfig.initialize as jest.Mock).mockRejectedValueOnce(new Error('fail'));

    const { result, render } = renderHook(() => useDittoSync());

    await act(async () => {
      render(renderer);
      await Promise.resolve();
    });

    expect(result.current?.isOnline).toBe(false);
    expect(result.current?.connectedPeers).toBe(0);
    expect(result.current?.syncActive).toBe(false);
    expect(result.current?.error).toBeTruthy();
  });

  test('cleans up presence observer on unmount', async () => {
    const renderer = require('react-test-renderer');
    const stop = jest.fn();
    mockPresence.observe.mockReturnValue({ stop });

    const { render } = renderHook(() => useDittoSync());
    let root: any;
    await act(async () => {
      root = render(renderer);
      await Promise.resolve();
    });

    await act(async () => {
      root.unmount();
    });

    expect(stop).toHaveBeenCalled();
  });
});


