import { DittoConfig } from '../types/DittoTypes';
import { Platform } from 'react-native';

// Development configuration
const DEVELOPMENT_CONFIG: DittoConfig = {
  appId: process.env.EXPO_PUBLIC_DITTO_APP_ID || 'dtak-mesh-network',
  playgroundToken: process.env.EXPO_PUBLIC_DITTO_PLAYGROUND_TOKEN || undefined,
  enableBluetooth: true,
  enableWiFi: true,
  enableAWDL: Platform.OS === 'ios',
  websocketURL: process.env.EXPO_PUBLIC_DITTO_WEBSOCKET_URL || undefined,
};

// Production configuration
const PRODUCTION_CONFIG: DittoConfig = {
  appId: process.env.EXPO_PUBLIC_DITTO_PROD_APP_ID || process.env.EXPO_PUBLIC_DITTO_APP_ID || 'dtak-mesh-network-prod',
  playgroundToken: undefined, // No playground token in production
  enableBluetooth: true,
  enableWiFi: true,
  enableAWDL: Platform.OS === 'ios',
  websocketURL: process.env.EXPO_PUBLIC_DITTO_WEBSOCKET_URL,
};

// Export configuration based on environment
export const getDittoConfig = (): DittoConfig => {
  const isDevelopment = __DEV__;
  return isDevelopment ? DEVELOPMENT_CONFIG : PRODUCTION_CONFIG;
};

export default getDittoConfig;
