/**
 * Ditto SDK Configuration Singleton
 * Handles Ditto initialization, authentication, and transport configuration
 */

import { Ditto, Identity } from '@dittolive/ditto';
import { StorageError, ErrorType } from '../types/MapPoint';
import { getSecureConfig } from './EnvironmentConfig';

export class DittoConfig {
  private static instance: Ditto | null = null;
  private static isInitializing = false;

  /**
   * Initialize Ditto SDK with authentication and transport configuration
   * This should be called once at app startup
   */
  static async initialize(): Promise<Ditto> {
    if (this.instance) {
      return this.instance;
    }

    if (this.isInitializing) {
      // Wait for existing initialization to complete
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (this.instance) {
        return this.instance;
      }
    }

    this.isInitializing = true;

    try {
      // Load secure configuration
      const config = await getSecureConfig();
      const { dittoAppId: appID, dittoToken: token, environment } = config;

      // Configure identity based on environment
      const identity: Identity = environment === 'production' 
        ? {
            type: 'onlineWithAuthentication',
            appID,
            authHandler: {
              authenticationRequired: async (authenticator) => {
                // In production, implement your authentication logic here
                // For now, using token-based auth as fallback
                try {
                  const loginResult = await authenticator.login(token, 'development');
                  console.log('Authentication successful:', loginResult.clientInfo);
                } catch (error) {
                  console.error('Authentication failed:', error);
                }
              },
              authenticationExpiringSoon: (authenticator, secondsRemaining) => {
                console.warn(`Authentication expiring in ${secondsRemaining} seconds`);
                // Implement token refresh logic here if needed
              }
            }
          }
        : {
            type: 'onlinePlayground',
            appID,
            token,
          };

      console.log(`🔧 Initializing Ditto SDK (${environment} mode)...`);
      
      this.instance = new Ditto(identity);

      // Configure transports for peer-to-peer sync
      this.instance.updateTransportConfig((config) => {
        // Enable peer-to-peer sync for offline collaboration
        config.setAvailablePeerToPeerEnabled(true);
        
        // Configure additional transports if needed
        // config.setAvailableWebSocketEnabled(true);
        // config.setAvailableHttpEnabled(true);
      });

      // Start synchronization
      await this.instance.startSync();

      console.log('✅ Ditto SDK initialized successfully');
      console.log(`📡 Peer-to-peer sync: enabled`);
      console.log(`🔗 App ID: ${appID.substring(0, 8)}...`);

      return this.instance;
    } catch (error) {
      console.error('❌ Failed to initialize Ditto SDK:', error);
      
      const storageError: StorageError = {
        name: 'DittoInitializationError',
        type: ErrorType.INITIALIZATION_ERROR,
        message: 'Failed to initialize Ditto SDK. Check your credentials and network connection.',
        originalError: error
      };
      
      throw storageError;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Get the current Ditto instance
   * Returns null if not initialized
   */
  static getInstance(): Ditto | null {
    return this.instance;
  }

  /**
   * Check if Ditto is initialized and ready to use
   */
  static isInitialized(): boolean {
    return this.instance !== null;
  }

  /**
   * Stop Ditto sync and cleanup resources
   * Useful for testing or app shutdown
   */
  static async shutdown(): Promise<void> {
    if (this.instance) {
      try {
        await this.instance.stopSync();
        this.instance = null;
        console.log('🛑 Ditto SDK shutdown complete');
      } catch (error) {
        console.error('⚠️ Error during Ditto shutdown:', error);
      }
    }
  }

  /**
   * Get Ditto instance or throw error if not initialized
   * Use this in managers that require Ditto to be ready
   */
  static getInstanceOrThrow(): Ditto {
    if (!this.instance) {
      const error: StorageError = {
        name: 'DittoNotInitializedError',
        type: ErrorType.INITIALIZATION_ERROR,
        message: 'Ditto SDK not initialized. Call DittoConfig.initialize() first.'
      };
      throw error;
    }
    return this.instance;
  }

  /**
   * Enable debug logging for development
   * Call this before initialize() to see detailed Ditto logs
   */
  static enableDebugLogging(): void {
    // Note: Actual logging configuration depends on Ditto SDK version
    // This is a placeholder for logging configuration
    console.log('🐛 Ditto debug logging enabled');
  }
}
