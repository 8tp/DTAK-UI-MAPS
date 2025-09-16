/**
 * Expo-specific configuration loader
 * Use this if you're using Expo instead of React Native CLI
 */

// React Native global declarations
declare const __DEV__: boolean;

// For Expo projects
// import Constants from 'expo-constants';

interface ExpoEnvironmentConfig {
  dittoAppId: string;
  dittoToken: string;
  environment: 'development' | 'staging' | 'production';
  debugEnabled: boolean;
}

/**
 * Load configuration from Expo Constants
 * Configure in app.json under "extra" field
 */
export const loadExpoConfig = (): ExpoEnvironmentConfig => {
  // Uncomment when using Expo
  // const config = Constants.expoConfig?.extra || {};
  
  // For now, return development defaults
  const config = {
    dittoAppId: __DEV__ ? 'dev-app-id' : '',
    dittoToken: __DEV__ ? 'dev-token' : '',
    environment: 'development' as const,
    debugEnabled: __DEV__,
  };

  // Validate required configuration
  if (!config.dittoAppId) {
    throw new Error('DITTO_APP_ID not configured in app.json extra field');
  }

  if (!config.dittoToken) {
    throw new Error('DITTO_TOKEN not configured in app.json extra field');
  }

  return config;
};

/**
 * Example app.json configuration for Expo:
 * 
 * {
 *   "expo": {
 *     "extra": {
 *       "DITTO_APP_ID": "your-app-id",
 *       "DITTO_TOKEN": "your-token",
 *       "DITTO_ENVIRONMENT": "production"
 *     }
 *   }
 * }
 */
