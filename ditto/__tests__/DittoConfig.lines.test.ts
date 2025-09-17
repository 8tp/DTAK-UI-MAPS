/**
 * DittoConfig: cover initialization wait-loop branch and log lines
 */

import { DittoConfig } from '../src/config/DittoConfig';

jest.mock('@dittolive/ditto', () => ({
  Ditto: jest.fn().mockImplementation(() => ({
    startSync: jest.fn().mockResolvedValue(undefined),
    updateTransportConfig: jest.fn(),
  })),
}));

jest.mock('../src/config/EnvironmentConfig', () => ({
  getSecureConfig: jest.fn().mockResolvedValue({ dittoAppId: 'appId123456', dittoToken: 'tok', environment: 'development', debugEnabled: true }),
}));

describe('DittoConfig init wait-loop', () => {
  beforeEach(() => {
    // reset internals
    // @ts-expect-error private
    (DittoConfig as any).instance = null;
    // @ts-expect-error private
    (DittoConfig as any).isInitializing = false;
  });

  test('second initialize waits on isInitializing and returns instance', async () => {
    // Simulate first call in progress by setting isInitializing then clearing after a tick
    // @ts-expect-error private
    (DittoConfig as any).isInitializing = true;
    setTimeout(() => {
      // @ts-expect-error private
      (DittoConfig as any).instance = { dummy: true };
      // @ts-expect-error private
      (DittoConfig as any).isInitializing = false;
    }, 10);

    const inst = await DittoConfig.initialize();
    expect(inst).toEqual({ dummy: true });
  });
});
