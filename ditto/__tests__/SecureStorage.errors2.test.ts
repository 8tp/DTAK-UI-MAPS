/**
 * Force error catch branches in SecureStorage by throwing inside console.warn
 */

import { getSecureCredentials, setSecureCredentials, clearSecureCredentials } from '../src/config/SecureStorage';

describe('SecureStorage error catches (console throw)', () => {
  const originalDev = (global as any).__DEV__;

  beforeEach(() => {
    (global as any).__DEV__ = false;
  });

  afterEach(() => {
    (global as any).__DEV__ = originalDev;
  });

  test('getSecureCredentials catch path via console.warn throw', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => { throw new Error('warn fail'); });
    const err = jest.spyOn(console, 'error').mockImplementation(() => undefined as any);
    const res = await getSecureCredentials();
    expect(res).toBeNull();
    warn.mockRestore();
    err.mockRestore();
  });

  test('setSecureCredentials catch path via console.warn throw', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => { throw new Error('warn fail'); });
    const err = jest.spyOn(console, 'error').mockImplementation(() => undefined as any);
    const ok = await setSecureCredentials({ dittoAppId: 'x', dittoToken: 'y' });
    expect(ok).toBe(false);
    warn.mockRestore();
    err.mockRestore();
  });

  test('clearSecureCredentials catch path via console.warn throw', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => { throw new Error('warn fail'); });
    const err = jest.spyOn(console, 'error').mockImplementation(() => undefined as any);
    const ok = await clearSecureCredentials();
    expect(ok).toBe(false);
    warn.mockRestore();
    err.mockRestore();
  });
});


