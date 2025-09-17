/**
 * Tests for environment configuration loaders
 */

import { loadEnvironmentConfig, getSecureConfig } from '../src/config/EnvironmentConfig';

describe('EnvironmentConfig', () => {
  const originalDev = (global as any).__DEV__;
  const originalConfig = (global as any).Config;

  beforeEach(() => {
    jest.resetModules();
    (global as any).__DEV__ = true;
    (global as any).Config = {};
    jest.clearAllMocks();
  });

  afterEach(() => {
    (global as any).__DEV__ = originalDev;
    (global as any).Config = originalConfig;
  });

  test('loadEnvironmentConfig validates required vars', () => {
    (global as any).Config = { DITTO_APP_ID: 'id', DITTO_TOKEN: 'tok', DITTO_ENVIRONMENT: 'development', DITTO_DEBUG: 'true' };
    const cfg = loadEnvironmentConfig();
    expect(cfg.dittoAppId).toBe('id');
    expect(cfg.dittoToken).toBe('tok');
    expect(cfg.environment).toBe('development');
    expect(cfg.debugEnabled).toBe(true);
  });

  test('loadEnvironmentConfig throws when required missing', () => {
    (global as any).__DEV__ = false;
    (global as any).Config = { DITTO_APP_ID: '', DITTO_TOKEN: '', DITTO_ENVIRONMENT: 'development' };
    expect(() => loadEnvironmentConfig()).toThrow('DITTO_APP_ID environment variable is required');
  });

  test('getSecureConfig falls back to dev defaults when secure credentials absent in dev', async () => {
    (global as any).Config = { DITTO_APP_ID: '', DITTO_TOKEN: '' };
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    // Mock SecureStorage to return null
    jest.mock('../src/config/SecureStorage', () => ({
      getSecureCredentials: jest.fn().mockResolvedValue(null),
    }), { virtual: true });

    const cfg = await getSecureConfig();
    expect(cfg.dittoAppId).toBe('dev-app-id');
    expect(cfg.environment).toBe('development');
  });

  test('getSecureConfig uses secure storage credentials (production-like)', async () => {
    (global as any).Config = { DITTO_APP_ID: '', DITTO_TOKEN: '' };
    // Simulate production path by making __DEV__ false when SecureStorage runs
    (global as any).__DEV__ = false;
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.mock('../src/config/SecureStorage', () => ({
      getSecureCredentials: jest.fn().mockResolvedValue({ dittoAppId: 'secure-id', dittoToken: 'secure-token' }),
    }), { virtual: true });

    const cfg = await getSecureConfig();
    expect(cfg.dittoAppId).toBe('secure-id');
    expect(cfg.environment).toBe('production');
  });
});


