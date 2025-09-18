// Global Jest setup for the dTAK app
// Keep minimal to avoid pulling in RN-specific matchers unless needed.

// Some modules may expect __DEV__ to exist (mimic React Native env)
// Individual tests can override this value as needed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(global as any).__DEV__ = true;

// Reasonable default timeout for async tests
jest.setTimeout(20000);
