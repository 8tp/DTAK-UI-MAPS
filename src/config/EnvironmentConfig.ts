/**
 * Environment Configuration
 * Handles secure loading of environment variables and credentials
 */

// React Native global declarations
declare const __DEV__: boolean;

interface EnvironmentConfig {
  dittoAppId: string;
  dittoToken: string;
  environment: 'development' | 'staging' | 'production';
  debugEnabled: boolean;
}

/**
 * Load configuration from environment variables
 * Throws error if required variables are missing
 */
export const loadEnvironmentConfig = (): EnvironmentConfig => {
  // For React Native CLI projects with react-native-config
  // @ts-ignore - Config is injected by react-native-config
  const Config = global.Config || {};
  
  const config = {
    dittoAppId: Config.DITTO_APP_ID || (__DEV__ ? 'dev-app-id' : ''),
    dittoToken: Config.DITTO_TOKEN || (__DEV__ ? 'dev-token' : ''),
    environment: (Config.DITTO_ENVIRONMENT as any) || 'development',
    debugEnabled: Config.DITTO_DEBUG === 'true' || __DEV__,
  };

  // Validate required configuration
  if (!config.dittoAppId || config.dittoAppId === 'your-app-id-here') {
    throw new Error('DITTO_APP_ID environment variable is required');
  }

  if (!config.dittoToken || config.dittoToken === 'your-token-here') {
    throw new Error('DITTO_TOKEN environment variable is required');
  }

  return config;
};

/**
 * Get configuration with fallbacks for different environments
 */
export const getSecureConfig = async (): Promise<EnvironmentConfig> => {
  try {
    // Try to load from environment first
    return loadEnvironmentConfig();
  } catch (error) {
    console.warn('Environment config failed, trying secure storage:', error);
    
    // Fallback to secure storage (see implementation below)
    return await loadFromSecureStorage();
  }
};

/**
 * Load credentials from secure storage (production approach)
 */
const loadFromSecureStorage = async (): Promise<EnvironmentConfig> => {
  const { getSecureCredentials } = await import('./SecureStorage');
  
  const credentials = await getSecureCredentials();
  
  if (!credentials) {
    if (__DEV__) {
      return {
        dittoAppId: 'dev-app-id',
        dittoToken: 'dev-token',
        environment: 'development',
        debugEnabled: true,
      };
    }
    throw new Error('No secure credentials found. Please configure Ditto credentials.');
  }
  
  return {
    dittoAppId: credentials.dittoAppId,
    dittoToken: credentials.dittoToken,
    environment: 'production',
    debugEnabled: false,
  };
};
