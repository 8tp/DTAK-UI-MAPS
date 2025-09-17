/**
 * Cover DittoConfig authHandler logging branches in production identity
 */

import { DittoConfig } from '../src/config/DittoConfig';

const startSync = jest.fn().mockResolvedValue(undefined);
const updateTransportConfig = jest.fn();

jest.mock('@dittolive/ditto', () => ({
  Ditto: jest.fn().mockImplementation((identity: any) => {
    // Invoke authHandler branches manually to cover logs
    if (identity.type === 'onlineWithAuthentication') {
      const spyLog = jest.spyOn(console, 'log').mockImplementation(() => undefined as any);
      const spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined as any);
      const spyErr = jest.spyOn(console, 'error').mockImplementation(() => undefined as any);
      // simulate authenticationRequired success then failure
      const authenticator = { login: jest.fn().mockResolvedValue({ clientInfo: 'ok' }) } as any;
      identity.authHandler.authenticationRequired(authenticator).then(() => {
        authenticator.login.mockRejectedValueOnce(new Error('bad'));
        identity.authHandler.authenticationRequired(authenticator);
        identity.authHandler.authenticationExpiringSoon({} as any, 30);
        spyLog.mockRestore();
        spyWarn.mockRestore();
        spyErr.mockRestore();
      });
    }
    return { startSync, updateTransportConfig } as any;
  }),
}));

jest.mock('../src/config/EnvironmentConfig', () => ({
  getSecureConfig: jest.fn().mockResolvedValue({
    dittoAppId: 'prod-app-12345678',
    dittoToken: 'tok',
    environment: 'production',
    debugEnabled: false,
  }),
}));

describe('DittoConfig authHandler branches', () => {
  beforeEach(() => {
    // reset internals
    // @ts-expect-error private
    (DittoConfig as any).instance = null;
    // @ts-expect-error private
    (DittoConfig as any).isInitializing = false;
  });

  test('initialize in production triggers authHandler branches', async () => {
    await DittoConfig.initialize();
    expect(startSync).toHaveBeenCalled();
  });
});
