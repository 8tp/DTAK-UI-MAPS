/**
 * Simple validation test to debug the issue
 */

import { DittoErrorHandler } from '../src/utils/ErrorHandler';

describe('Validation Debug', () => {
  test('should throw error for invalid latitude', () => {
    expect(() => {
      DittoErrorHandler.validateMapPoint({ latitude: 91, longitude: 0, title: 'test' });
    }).toThrow('Invalid latitude. Must be a number between -90 and 90');
  });

  test('should throw error for invalid longitude', () => {
    expect(() => {
      DittoErrorHandler.validateMapPoint({ latitude: 0, longitude: 181, title: 'test' });
    }).toThrow('Invalid longitude. Must be a number between -180 and 180');
  });

  test('should throw error for empty title', () => {
    expect(() => {
      DittoErrorHandler.validateMapPoint({ latitude: 0, longitude: 0, title: '' });
    }).toThrow('Title is required and must be a non-empty string');
  });
});
