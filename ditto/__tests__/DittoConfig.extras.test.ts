/**
 * Extra coverage for DittoConfig small branches
 */

import { DittoConfig } from '../src/config/DittoConfig';

describe('DittoConfig extras', () => {
  test('enableDebugLogging logs message', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => undefined as any);
    DittoConfig.enableDebugLogging();
    expect(spy).toHaveBeenCalledWith('🐛 Ditto debug logging enabled');
    spy.mockRestore();
  });

  test('shutdown handles stopSync error gracefully', async () => {
    // set instance with stopSync throwing
    // @ts-expect-error private access for test
    (DittoConfig as any).instance = { stopSync: jest.fn().mockRejectedValue(new Error('stop error')) };
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined as any);
    await DittoConfig.shutdown();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
