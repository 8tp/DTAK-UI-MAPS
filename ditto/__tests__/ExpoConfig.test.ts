/**
 * Tests for Expo config loader
 */

import { loadExpoConfig } from '../src/config/ExpoConfig';

describe('ExpoConfig', () => {
  const originalDev = (global as any).__DEV__;

  beforeEach(() => {
    (global as any).__DEV__ = true;
  });

  afterEach(() => {
    (global as any).__DEV__ = originalDev;
  });

  test('returns dev defaults when __DEV__', () => {
    const cfg = loadExpoConfig();
    expect(cfg.dittoAppId).toBe('dev-app-id');
    expect(cfg.dittoToken).toBe('dev-token');
    expect(cfg.environment).toBe('development');
  });

  test('throws when required values missing (non-dev)', () => {
    (global as any).__DEV__ = false;
    expect(() => loadExpoConfig()).toThrow('DITTO_APP_ID not configured');
  });
});


