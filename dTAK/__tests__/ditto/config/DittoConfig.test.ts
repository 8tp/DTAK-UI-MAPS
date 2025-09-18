/* eslint-disable @typescript-eslint/no-var-requires */

describe('DittoConfig', () => {
  const originalEnv = process.env;
  const originalDev = (global as any).__DEV__;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    (global as any).__DEV__ = true;
  });

  afterEach(() => {
    process.env = originalEnv;
    (global as any).__DEV__ = originalDev;
  });

  test('returns development config on iOS with AWDL enabled and uses playground token when provided', () => {
    process.env.EXPO_PUBLIC_DITTO_APP_ID = 'dev-app-id';
    process.env.EXPO_PUBLIC_DITTO_PLAYGROUND_TOKEN = 'play-token';
    process.env.EXPO_PUBLIC_DITTO_WEBSOCKET_URL = '';

    jest.doMock('react-native', () => ({ Platform: { OS: 'ios' } }), { virtual: true });

    (global as any).__DEV__ = true;

    jest.isolateModules(() => {
      const { getDittoConfig } = require('../../../ditto/config/DittoConfig');
      const cfg = getDittoConfig();

      expect(cfg.appId).toBe('dev-app-id');
      expect(cfg.playgroundToken).toBe('play-token');
      expect(cfg.enableAWDL).toBe(true);
      expect(cfg.enableBluetooth).toBe(true);
      expect(cfg.enableWiFi).toBe(true);
    });
  });

  test('returns production config on Android with AWDL disabled and no playground token', () => {
    process.env.EXPO_PUBLIC_DITTO_PROD_APP_ID = 'prod-app-id';
    delete process.env.EXPO_PUBLIC_DITTO_PLAYGROUND_TOKEN;

    jest.doMock('react-native', () => ({ Platform: { OS: 'android' } }), { virtual: true });

    (global as any).__DEV__ = false;

    jest.isolateModules(() => {
      const { getDittoConfig } = require('../../../ditto/config/DittoConfig');
      const cfg = getDittoConfig();

      expect(cfg.appId).toBe('prod-app-id');
      expect(cfg.playgroundToken).toBeUndefined();
      expect(cfg.enableAWDL).toBe(false);
    });
  });
});
