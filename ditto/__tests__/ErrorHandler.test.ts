/**
 * Tests for DittoErrorHandler branches
 */

import { DittoErrorHandler } from '../src/utils/ErrorHandler';
import { ErrorType } from '../src/types/MapPoint';

describe('DittoErrorHandler', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined as any);
  });

  afterEach(() => {
    (console.error as any).mockRestore?.();
  });

  test('handle maps by explicit error type', () => {
    expect(DittoErrorHandler.handle({ type: ErrorType.NETWORK_ERROR }, 'ctx')).toMatch(/Network/);
    expect(DittoErrorHandler.handle({ type: ErrorType.PERMISSION_ERROR }, 'ctx')).toMatch(/Permission/);
    expect(DittoErrorHandler.handle({ type: ErrorType.NOT_FOUND_ERROR }, 'ctx')).toMatch(/not found/i);
    expect(DittoErrorHandler.handle({ type: ErrorType.SYNC_ERROR }, 'ctx')).toMatch(/Synchronization/);
    expect(DittoErrorHandler.handle({ type: ErrorType.INITIALIZATION_ERROR }, 'ctx')).toMatch(/initialization/);
    expect(DittoErrorHandler.handle({ type: ErrorType.VALIDATION_ERROR }, 'ctx')).toMatch(/Invalid data/);
  });

  test('handle maps by message content when no type', () => {
    expect(DittoErrorHandler.handle(new Error('network timeout'), 'ctx')).toMatch(/Network/);
    expect(DittoErrorHandler.handle(new Error('permission denied'), 'ctx')).toMatch(/Permission/);
    expect(DittoErrorHandler.handle(new Error('validation failed'), 'ctx')).toMatch(/Invalid data/);
    expect(DittoErrorHandler.handle(new Error('Not Found'), 'ctx')).toMatch(/not found/i);
    expect(DittoErrorHandler.handle(new Error('weird unknown'), 'ctx')).toMatch(/unexpected error/i);
  });

  test('createError builds StorageError shape', () => {
    const err = DittoErrorHandler.createError(ErrorType.NETWORK_ERROR, 'm', new Error('o'));
    expect(err.name).toBe('StorageError');
    expect(err.type).toBe(ErrorType.NETWORK_ERROR);
    expect(err.message).toBe('m');
    expect(err.originalError).toBeInstanceOf(Error);
  });

  test('validateMapPoint checks ranges and title', () => {
    expect(() => DittoErrorHandler.validateMapPoint(null as any)).toThrow('Point data is required');
    expect(() => DittoErrorHandler.validateMapPoint({ latitude: 100, longitude: 0, title: 't' })).toThrow('Invalid latitude');
    expect(() => DittoErrorHandler.validateMapPoint({ latitude: 0, longitude: 200, title: 't' })).toThrow('Invalid longitude');
    expect(() => DittoErrorHandler.validateMapPoint({ latitude: 0, longitude: 0, title: '' })).toThrow('Title is required');
    expect(() => DittoErrorHandler.validateMapPoint({ latitude: 0, longitude: 0, title: 't', color: '#GGGGGG' })).toThrow('Color must be a valid hex');
    // Valid minimal
    expect(() => DittoErrorHandler.validateMapPoint({ latitude: 0, longitude: 0, title: 'ok' })).not.toThrow();
  });

  test('sanitizeString trims, strips tags, and limits length', () => {
    const input = '  <b>Hello></b> '.padEnd(600, 'x');
    const out = DittoErrorHandler.sanitizeString(input);
    // angle brackets are stripped; remaining string starts with 'bHello/b'
    expect(out.startsWith('bHello/b')).toBe(true);
    expect(out.length).toBeLessThanOrEqual(500);
  });

  test('offline and recoverable detection', () => {
    const offlineByMsg = new Error('Network unreachable');
    const offlineByType = { type: ErrorType.NETWORK_ERROR } as any;
    expect(DittoErrorHandler.isOfflineError(offlineByMsg)).toBe(true);
    expect(DittoErrorHandler.isOfflineError(offlineByType)).toBe(true);

    expect(DittoErrorHandler.isRecoverableError({ type: ErrorType.SYNC_ERROR } as any)).toBe(true);
    expect(DittoErrorHandler.isRecoverableError(offlineByMsg)).toBe(true);
  });
});


