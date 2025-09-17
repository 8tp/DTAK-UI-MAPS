/**
 * SecureStorage production-like branches
 */

import { getSecureCredentials, setSecureCredentials, clearSecureCredentials } from '../src/config/SecureStorage';

describe('SecureStorage prod branches', () => {
  const originalDev = (global as any).__DEV__;

  beforeEach(() => {
    (global as any).__DEV__ = false;
  });

  afterEach(() => {
    (global as any).__DEV__ = originalDev;
  });

  test('getSecureCredentials returns null and warns when not implemented', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined as any);
    const res = await getSecureCredentials();
    expect(res).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  test('set/clear warn and return false on errors', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined as any);
    expect(await setSecureCredentials({ dittoAppId: 'id', dittoToken: 'tok' })).toBe(false);
    expect(await clearSecureCredentials()).toBe(false);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
