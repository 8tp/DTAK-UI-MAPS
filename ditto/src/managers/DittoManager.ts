/**
 * Base Ditto Manager class
 * Provides common functionality for all Ditto-based data managers
 */

import { Ditto } from '@dittolive/ditto';
import { DittoConfig } from '../config/DittoConfig';
import { DittoErrorHandler } from '../utils/ErrorHandler';
import { StorageError, ErrorType } from '../types/MapPoint';

export abstract class DittoManager {
  protected ditto: Ditto;
  protected readonly collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
    this.ditto = DittoConfig.getInstanceOrThrow();
  }

  /**
   * Initialize the manager and set up subscriptions
   * Should be called after construction
   */
  async initialize(): Promise<void> {
    try {
      // Register subscription for the collection to enable sync
      await this.ditto.sync.registerSubscription(
        `SELECT * FROM ${this.collectionName} WHERE isDeleted != true`
      );

      console.log(`📡 ${this.collectionName} subscription registered for sync`);
    } catch (error) {
      const message = `Failed to initialize ${this.collectionName} manager`;
      console.error(message, error);
      
      throw DittoErrorHandler.createError(
        ErrorType.INITIALIZATION_ERROR,
        message,
        error
      );
    }
  }

  /**
   * Execute a DQL query with error handling
   */
  protected async executeQuery(query: string, args: Record<string, any> = {}): Promise<any> {
    try {
      return await this.ditto.store.execute(query, args);
    } catch (error) {
      const context = `DQL Query: ${query}`;
      const message = DittoErrorHandler.handle(error, context);
      
      throw DittoErrorHandler.createError(
        this.getErrorTypeFromDittoError(error),
        message,
        error
      );
    }
  }

  /**
   * Register a live query observer with error handling
   */
  protected registerObserver(
    query: string, 
    callback: (result: any) => void,
    args?: Record<string, any>
  ): () => void {
    try {
      const observer = this.ditto.store.registerObserver(query, (result) => {
        try {
          callback(result);
        } catch (error) {
          console.error('Error in observer callback:', error);
        }
      }, args);
      
      // Return a function that cancels the observer
      return () => {
        try {
          observer.cancel();
        } catch (error) {
          console.error('Error canceling observer:', error);
        }
      };
    } catch (error) {
      const context = `Observer Registration: ${query}`;
      DittoErrorHandler.handle(error, context);
      
      // Return no-op unsubscribe function if registration fails
      return () => {};
    }
  }

  /**
   * Generate a unique ID for new documents
   */
  protected generateId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${this.collectionName}_${timestamp}_${random}`;
  }

  /**
   * Get current ISO timestamp
   */
  protected getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Map Ditto SDK errors to our error types
   */
  private getErrorTypeFromDittoError(error: any): ErrorType {
    const errorMessage = error.message?.toLowerCase() || '';
    
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      return ErrorType.NETWORK_ERROR;
    }
    
    if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
      return ErrorType.PERMISSION_ERROR;
    }
    
    if (errorMessage.includes('not found')) {
      return ErrorType.NOT_FOUND_ERROR;
    }
    
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      return ErrorType.VALIDATION_ERROR;
    }
    
    return ErrorType.SYNC_ERROR;
  }

  /**
   * Check if the manager is ready to use
   */
  protected checkInitialization(): void {
    if (!this.ditto) {
      throw DittoErrorHandler.createError(
        ErrorType.INITIALIZATION_ERROR,
        'Manager not properly initialized'
      );
    }
  }
}
