// Ambient module shims for Expo packages to satisfy TypeScript in strict mode
// These are intentionally permissive and can be replaced by official types if needed.

declare module 'expo-device' {
  export const deviceName: string | null;
  export const osName: string | null;
  export const osVersion: string | null;
  export const modelName: string | null;
  export const manufacturer: string | null;
}

declare module 'expo-file-system' {
  export const documentDirectory: string | null;
  export const cacheDirectory: string | null;
  export function readAsStringAsync(uri: string): Promise<string>;
  export function writeAsStringAsync(uri: string, data: string): Promise<void>;
  export function getInfoAsync(uri: string): Promise<any>;
  export function makeDirectoryAsync(uri: string, options?: any): Promise<void>;
  export const StorageAccessFramework: any;
  // Fallback escape hatch for usages not covered above
  const _FileSystem: any;
  export { _FileSystem as default };
}
