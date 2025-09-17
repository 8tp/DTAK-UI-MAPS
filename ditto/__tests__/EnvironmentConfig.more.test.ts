/**
 * Extra coverage for EnvironmentConfig edge paths
 */

import { loadEnvironmentConfig, getSecureConfig } from '../src/config/EnvironmentConfig';

describe('EnvironmentConfig more', () => {
  const originalDev = (global as any).__DEV__;
  const originalConfig = (global as any).Config;

  beforeEach(() => {
    (global as any).Config = {};
    (global as any).__DEV__ = false;
  });

  afterEach(() => {
    (global as any).__DEV__ = originalDev;
    (global as any).Config = originalConfig;
  });

  test('loadEnvironmentConfig throws missing token when appId present', () => {
    (global as any).Config = { DITTO_APP_ID: 'id', DITTO_TOKEN: '', DITTO_ENVIRONMENT: 'production' };
    expect(() => loadEnvironmentConfig()).toThrow('DITTO_TOKEN environment variable is required');
  });

  test('getSecureConfig throws when no env and no secure credentials in prod', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined as any);
    jest.mock('../src/config/SecureStorage', () => ({ getSecureCredentials: jest.fn().mockResolvedValue(null) }), { virtual: true });
    await expect(getSecureConfig()).rejects.toThrow('No secure credentials found');
  });
});


