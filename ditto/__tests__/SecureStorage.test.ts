/**
 * Tests for SecureStorage stubs
 */

import { getSecureCredentials, setSecureCredentials, clearSecureCredentials } from '../src/config/SecureStorage';

describe('SecureStorage', () => {
  const originalDev = (global as any).__DEV__;

  beforeEach(() => {
    (global as any).__DEV__ = true;
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    (global as any).__DEV__ = originalDev;
    (console.warn as any).mockRestore?.();
    (console.error as any).mockRestore?.();
  });

  test('getSecureCredentials returns null in dev', async () => {
    const res = await getSecureCredentials();
    expect(res).toBeNull();
  });

  test('setSecureCredentials returns false (not implemented)', async () => {
    const ok = await setSecureCredentials({ dittoAppId: 'a', dittoToken: 'b' });
    expect(ok).toBe(false);
  });

  test('clearSecureCredentials returns false (not implemented)', async () => {
    const ok = await clearSecureCredentials();
    expect(ok).toBe(false);
  });
});


