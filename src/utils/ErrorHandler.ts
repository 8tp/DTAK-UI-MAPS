/**
 * Error handling utilities for the Ditto storage layer
 * Provides consistent error handling and user-friendly messages
 */

import { StorageError, ErrorType } from '../types/MapPoint';

export class DittoErrorHandler {
  /**
   * Handle and log Ditto-related errors
   * Returns user-friendly error message
   */
  static handle(error: any, context: string): string {
    console.error(`[${context}] Ditto error:`, error);
    
    // Log to crash reporting service in production
    // if (process.env.NODE_ENV === 'production') {
    //   crashlytics().recordError(error);
    // }
    
    // Return user-friendly message based on error type
    if (error.type) {
      return this.getMessageForErrorType(error.type);
    }
    
    // Handle common Ditto SDK errors by message content
    const errorMessage = error.message?.toLowerCase() || '';
    
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      return 'Network connection lost. Changes will sync when online.';
    }
    
    if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
      return 'Permission denied. Please check your credentials.';
    }
    
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      return 'Invalid data provided. Please check your input.';
    }
    
    if (errorMessage.includes('not found')) {
      return 'Requested item not found.';
    }
    
    // Default fallback message
    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Get user-friendly message for specific error types
   */
  private static getMessageForErrorType(errorType: ErrorType): string {
    switch (errorType) {
      case ErrorType.NETWORK_ERROR:
        return 'Network connection lost. Changes will sync when online.';
      
      case ErrorType.VALIDATION_ERROR:
        return 'Invalid data provided. Please check your input.';
      
      case ErrorType.NOT_FOUND_ERROR:
        return 'Requested item not found.';
      
      case ErrorType.PERMISSION_ERROR:
        return 'Permission denied. Please check your credentials.';
      
      case ErrorType.SYNC_ERROR:
        return 'Synchronization failed. Will retry automatically.';
      
      case ErrorType.INITIALIZATION_ERROR:
        return 'Storage system initialization failed. Please restart the app.';
      
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Create a standardized StorageError
   */
  static createError(
    type: ErrorType, 
    message: string, 
    originalError?: any
  ): StorageError {
    return {
      name: 'StorageError',
      type,
      message,
      originalError
    };
  }

  /**
   * Validate map point data and throw validation error if invalid
   */
  static validateMapPoint(data: any): void {
    if (!data) {
      throw this.createError(
        ErrorType.VALIDATION_ERROR,
        'Point data is required'
      );
    }

    if (typeof data.latitude !== 'number' || data.latitude < -90 || data.latitude > 90) {
      throw this.createError(
        ErrorType.VALIDATION_ERROR,
        'Invalid latitude. Must be a number between -90 and 90'
      );
    }

    if (typeof data.longitude !== 'number' || data.longitude < -180 || data.longitude > 180) {
      throw this.createError(
        ErrorType.VALIDATION_ERROR,
        'Invalid longitude. Must be a number between -180 and 180'
      );
    }

    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      throw this.createError(
        ErrorType.VALIDATION_ERROR,
        'Title is required and must be a non-empty string'
      );
    }

    // Validate optional fields if provided
    if (data.color && typeof data.color === 'string') {
      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexColorRegex.test(data.color)) {
        throw this.createError(
          ErrorType.VALIDATION_ERROR,
          'Color must be a valid hex color (e.g., #FF0000)'
        );
      }
    }
  }

  /**
   * Sanitize user input to prevent injection attacks
   */
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 500); // Limit length
  }

  /**
   * Check if error indicates offline mode
   */
  static isOfflineError(error: any): boolean {
    const errorMessage = error.message?.toLowerCase() || '';
    return errorMessage.includes('network') || 
           errorMessage.includes('connection') ||
           errorMessage.includes('offline') ||
           error.type === ErrorType.NETWORK_ERROR;
  }

  /**
   * Check if error is recoverable (should retry)
   */
  static isRecoverableError(error: any): boolean {
    return this.isOfflineError(error) || 
           error.type === ErrorType.SYNC_ERROR;
  }
}
