/**
 * Main export file for the Ditto offline storage module
 * Provides clean interfaces for team integration
 */

// Core hooks for frontend integration
export { useMapPoints } from './hooks/useMapPoints';
export { useDittoSync } from './hooks/useDittoSync';

// Type definitions
export type {
  MapPoint,
  NewMapPoint,
  GeoBounds,
  SyncStatus,
  MapPointsHookReturn,
  StorageError
} from './types/MapPoint';

export { ErrorType } from './types/MapPoint';

// Configuration (for app initialization)
export { DittoConfig } from './config/DittoConfig';

// Managers (for advanced usage)
export { PointManager } from './managers/PointManager';
export { DittoManager } from './managers/DittoManager';

// Utilities
export { DittoErrorHandler } from './utils/ErrorHandler';

// Re-export commonly used types for convenience
export type { Identity } from '@dittolive/ditto';
