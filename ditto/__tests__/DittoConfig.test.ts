/**
 * Tests for DittoConfig singleton initialization and lifecycle
 */

import { DittoConfig } from '../src/config/DittoConfig';

// Mock Ditto SDK constructor and instance methods
const startSync = jest.fn().mockResolvedValue(undefined);
const stopSync = jest.fn().mockResolvedValue(undefined);
const updateTransportConfig = jest.fn((fn: any) => {
  // Call with a fake config that tracks enabling
  const fakeConfig = { setAvailablePeerToPeerEnabled: jest.fn() };
  fn(fakeConfig);
});

let lastIdentity: any = null;

jest.mock('@dittolive/ditto', () => ({
  Ditto: jest.fn().mockImplementation((identity: any) => {
    lastIdentity = identity;
    return {
      startSync,
      stopSync,
      updateTransportConfig,
    } as any;
  })
}));

// Mock EnvironmentConfig
jest.mock('../src/config/EnvironmentConfig', () => ({
  getSecureConfig: jest.fn(),
}));

import { getSecureConfig } from '../src/config/EnvironmentConfig';

describe('DittoConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset internal singleton state via shutdown if needed
    // @ts-expect-error access private for test reset
    (DittoConfig as any).instance = null;
    // @ts-expect-error access private for test reset
    (DittoConfig as any).isInitializing = false;
  });

  test('initializes in development with onlinePlayground identity and starts sync', async () => {
    (getSecureConfig as jest.Mock).mockResolvedValue({
      dittoAppId: 'app',
      dittoToken: 'token',
      environment: 'development',
      debugEnabled: true,
    });

    const instance = await DittoConfig.initialize();

    expect(instance).toBeTruthy();
    expect(lastIdentity).toEqual(
      expect.objectContaining({ type: 'onlinePlayground', appID: 'app', token: 'token' })
    );
    expect(updateTransportConfig).toHaveBeenCalled();
    expect(startSync).toHaveBeenCalled();
    expect(DittoConfig.isInitialized()).toBe(true);
    expect(DittoConfig.getInstance()).toBeTruthy();
  });

  test('returns existing instance on subsequent initialize calls', async () => {
    (getSecureConfig as jest.Mock).mockResolvedValue({
      dittoAppId: 'app',
      dittoToken: 'token',
      environment: 'development',
      debugEnabled: true,
    });
    const first = await DittoConfig.initialize();
    const second = await DittoConfig.initialize();
    expect(second).toBe(first);
  });

  test('uses onlineWithAuthentication identity in production', async () => {
    (getSecureConfig as jest.Mock).mockResolvedValue({
      dittoAppId: 'prod-app',
      dittoToken: 'prod-token',
      environment: 'production',
      debugEnabled: false,
    });

    await DittoConfig.shutdown();
    const instance = await DittoConfig.initialize();
    expect(instance).toBeTruthy();
    expect(lastIdentity).toEqual(expect.objectContaining({ type: 'onlineWithAuthentication', appID: 'prod-app' }));
  });

  test('shutdown stops sync and clears instance', async () => {
    (getSecureConfig as jest.Mock).mockResolvedValue({
      dittoAppId: 'app',
      dittoToken: 'token',
      environment: 'development',
      debugEnabled: true,
    });
    await DittoConfig.initialize();
    await DittoConfig.shutdown();
    expect(stopSync).toHaveBeenCalled();
    expect(DittoConfig.getInstance()).toBeNull();
    expect(DittoConfig.isInitialized()).toBe(false);
  });

  test('getInstanceOrThrow throws when not initialized', () => {
    expect(() => DittoConfig.getInstanceOrThrow()).toThrow('Ditto SDK not initialized');
  });

  test('initialize surfaces a StorageError on failure', async () => {
    (getSecureConfig as jest.Mock).mockRejectedValue(new Error('bad config'));
    await expect(DittoConfig.initialize()).rejects.toMatchObject({
      name: 'DittoInitializationError',
    });
  });
});


