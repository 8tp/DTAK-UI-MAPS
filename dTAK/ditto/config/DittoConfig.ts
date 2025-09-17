import { DittoConfig } from '../types/DittoTypes';
import { Platform } from 'react-native';

// Development configuration
const DEVELOPMENT_CONFIG: DittoConfig = {
  appId: 'dtak-mesh-network',
  playgroundToken: 'your-playground-token-here', // Replace with actual token
  enableBluetooth: true,
  enableWiFi: true,
  enableAWDL: Platform.OS === 'ios',
  websocketURL: undefined, // Set for cloud sync if needed
};

// Production configuration
const PRODUCTION_CONFIG: DittoConfig = {
  appId: 'dtak-mesh-network-prod',
  playgroundToken: undefined, // No playground token in production
  enableBluetooth: true,
  enableWiFi: true,
  enableAWDL: Platform.OS === 'ios',
  websocketURL: process.env.DITTO_WEBSOCKET_URL,
};

// Export configuration based on environment
export const getDittoConfig = (): DittoConfig => {
  const isDevelopment = __DEV__;
  return isDevelopment ? DEVELOPMENT_CONFIG : PRODUCTION_CONFIG;
};

export default getDittoConfig;
