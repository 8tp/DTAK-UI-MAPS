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

// Basic runtime validation and environment-aware logging for Ditto config
const validateConfig = (config: DittoConfig, isDevelopment: boolean): void => {
  if (!config.appId) {
    console.warn('[DittoConfig] Missing appId. Using fallback. This may affect identity and sync grouping.');
  }

  if (!isDevelopment && config.playgroundToken) {
    console.warn('[DittoConfig] playgroundToken should not be set in production. Ignoring any provided value.');
  }

  if (!config.websocketURL) {
    console.log('[DittoConfig] WebSocket URL not set; cloud connect is disabled. Running P2P transports only.');
  }
};

// Export configuration based on environment
export const getDittoConfig = (): DittoConfig => {
  const isDevelopment = __DEV__;
  const config = isDevelopment ? DEVELOPMENT_CONFIG : PRODUCTION_CONFIG;
  validateConfig(config, isDevelopment);
  return config;
};

export default getDittoConfig;
