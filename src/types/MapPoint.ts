/**
 * MapPoint data structures for the mobile map application
 * These interfaces define the contract between the storage layer and frontend components
 */

export interface MapPoint {
  _id: string;           // Ditto document ID
  latitude: number;      // Geographic latitude (-90 to 90)
  longitude: number;     // Geographic longitude (-180 to 180)
  title: string;         // Point title/name (required)
  description?: string;  // Optional description
  category?: string;     // Point category/type (e.g., 'park', 'landmark', 'restaurant')
  color?: string;        // Display color (hex format, e.g., '#4CAF50')
  icon?: string;         // Icon identifier for map display
  createdAt: string;     // ISO timestamp string
  updatedAt: string;     // ISO timestamp string
  userId?: string;       // Creator user ID (for future user attribution)
  isDeleted: boolean;    // Soft delete flag
}

export interface NewMapPoint {
  latitude: number;      // Required - Geographic latitude
  longitude: number;     // Required - Geographic longitude
  title: string;         // Required - Point title
  description?: string;  // Optional description
  category?: string;     // Optional category
  color?: string;        // Optional display color
  icon?: string;         // Optional icon identifier
}

export interface GeoBounds {
  northEast: {
    latitude: number;
    longitude: number;
  };
  southWest: {
    latitude: number;
    longitude: number;
  };
}

export interface SyncStatus {
  isOnline: boolean;
  connectedPeers: number;
  syncActive: boolean;
}

export interface MapPointsHookReturn {
  points: MapPoint[];
  loading: boolean;
  error: string | null;
  createPoint: (pointData: NewMapPoint) => Promise<MapPoint>;
  updatePoint: (id: string, updates: Partial<MapPoint>) => Promise<MapPoint>;
  deletePoint: (id: string) => Promise<boolean>;
  searchPoints: (searchTerm: string) => Promise<MapPoint[]>;
  getPointsByCategory: (category: string) => Promise<MapPoint[]>;
  clearError: () => void;
  syncStatus: SyncStatus;
  pointCount: number;
  hasPoints: boolean;
  isInitialized: boolean;
}

// Error types that the storage layer will provide to frontend
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  SYNC_ERROR = 'SYNC_ERROR',
  INITIALIZATION_ERROR = 'INITIALIZATION_ERROR'
}

export interface StorageError extends Error {
  type: ErrorType;
  message: string;
  originalError?: any;
}
