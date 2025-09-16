# React Native Mobile Map Application - Ditto SDK Implementation

## Overview

This documentation provides comprehensive guidelines for implementing offline storage and synchronization capabilities for a **React Native mobile map application** using the **Ditto SDK**. Ditto is a distributed database designed for offline-first applications with automatic peer-to-peer and cloud synchronization, making it perfect for collaborative map applications with point data management (CRUD operations).

## Why Ditto SDK?

### Key Advantages for Map Applications
- **Zero Sync Configuration**: Automatic synchronization without manual queue management
- **Real-time Collaboration**: Multiple users can add/edit points simultaneously with live updates
- **Peer-to-Peer Sync**: Devices can sync directly without internet connectivity
- **Offline-First by Design**: All operations work seamlessly without network connectivity
- **Built-in Conflict Resolution**: CRDT-based automatic conflict handling
- **Cross-Platform**: Single codebase works on iOS, Android, and Web
- **Expo Integration**: Official Expo plugin for seamless React Native setup

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Ditto SDK Setup](#ditto-sdk-setup)
3. [Data Layer with Ditto](#data-layer-with-ditto)
4. [Real-time Synchronization](#real-time-synchronization)
5. [CRUD Operations](#crud-operations)
6. [Implementation Guidelines](#implementation-guidelines)
7. [Testing Strategy](#testing-strategy)
8. [Best Practices](#best-practices)

## Architecture Overview

### Ditto-Based Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Layer      │    │  Data Layer     │    │   Ditto SDK     │
│                 │    │                 │    │                 │
│ - Map View      │◄──►│ - Point Manager │◄──►│ - Local Store   │
│ - Point UI      │    │ - Data Hooks    │    │ - Live Queries  │
│ - Controls      │    │ - State Manager │    │ - Auto Sync     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  React Hooks    │    │ Ditto Transport │
                       │                 │    │                 │
                       │ - useMapPoints  │    │ - P2P Sync      │
                       │ - useDittoSync  │    │ - Cloud Sync    │
                       │ - Live Updates  │    │ - CRDT Merge    │
                       └─────────────────┘    └─────────────────┘
```

### Core Components

1. **Ditto SDK**: Handles all storage, sync, and conflict resolution automatically
2. **Point Manager**: Provides CRUD operations using Ditto Query Language (DQL)
3. **Data Hooks**: React hooks that provide real-time data updates to UI components
4. **Live Queries**: Automatic UI updates when data changes locally or remotely

## Data Layer Requirements

### Ditto Document Model

```javascript
// MapPoint document structure in Ditto
const mapPoint = {
  _id: "point_1642123456789_abc123",     // Ditto document ID
  latitude: 40.7128,                     // Geographic latitude
  longitude: -74.0060,                   // Geographic longitude
  title: "Central Park",                 // Point title/name
  description: "Beautiful park in NYC",  // Optional description
  category: "park",                      // Point category/type
  color: "#4CAF50",                      // Display color (hex)
  icon: "park-icon",                     // Icon identifier
  createdAt: "2024-01-14T10:30:00.000Z", // ISO timestamp
  updatedAt: "2024-01-14T10:30:00.000Z", // ISO timestamp
  isDeleted: false                       // Soft delete flag
};

// Geographic bounds for queries
const geoBounds = {
  northEast: { latitude: 40.7829, longitude: -73.9441 },
  southWest: { latitude: 40.7489, longitude: -74.0441 }
};
```

**Note**: Ditto handles sync status and versioning automatically through its CRDT system - no manual sync management required.

## Ditto SDK Setup

### Installation and Configuration

```bash
# Install Ditto SDK
yarn add @dittolive/ditto

# For Expo projects, add to app.json
{
  "expo": {
    "plugins": ["@dittolive/ditto"]
  }
}
```

### Authentication Setup

```javascript
import { Ditto } from '@dittolive/ditto';

// Development setup
const identity = {
  type: 'onlinePlayground',
  appID: 'your-app-id',
  token: 'your-token'
};

const ditto = new Ditto(identity);

// Enable peer-to-peer sync
ditto.updateTransportConfig((config) => {
  config.setAvailablePeerToPeerEnabled(true);
});

await ditto.startSync();
```

## Data Layer with Ditto

### Ditto Advantages

1. **Automatic Persistence**: Data survives app restarts and device reboots automatically
2. **High Performance**: Optimized for mobile with efficient queries and caching
3. **Built-in Reliability**: ACID compliance and data integrity guarantees
4. **Infinite Scalability**: Handles thousands of points with automatic optimization

### Required Dependencies

#### Ditto SDK Dependencies
```json
{
  "dependencies": {
    "@dittolive/ditto": "^4.7.0",
    "react-native-permissions": "^4.1.5"
  }
}
```

#### Package Purposes
- **@dittolive/ditto**: Distributed database with automatic offline storage and sync
- **react-native-permissions**: Handle iOS/Android permissions for local networking

#### Installation Commands
```bash
# Install Ditto SDK
yarn add @dittolive/ditto react-native-permissions

# For Expo projects - no additional setup needed
# For React Native CLI projects
cd ios && pod install
```

#### Platform Setup Notes
- **iOS**: Automatic permission handling via Ditto SDK
- **Android**: Automatic permission handling via Ditto SDK
- **Expo**: Use official `@dittolive/ditto` plugin in app.json

## Real-time Synchronization

### Automatic Sync with Ditto

Ditto provides automatic synchronization without any configuration:

```javascript
// Start sync - happens automatically after initialization
await ditto.startSync();

// Live queries automatically update when data changes
const liveQuery = ditto.store.collection('mapPoints')
  .find('isDeleted == false')
  .observeLocal((docs, event) => {
    // UI automatically updates when data changes
    setMapPoints(docs);
  });

// Cleanup
return () => liveQuery.stop();
```

### Sync Features

1. **Automatic Cloud Sync**: Data syncs to cloud when online
2. **Peer-to-Peer Sync**: Devices sync directly without internet
3. **Real-time Updates**: UI updates instantly when data changes
4. **Conflict Resolution**: CRDT-based automatic merge resolution
5. **Offline Queue**: Changes queue automatically when offline

## CRUD Operations

### Point Manager with Ditto

```javascript
class DittoPointManager {
  constructor(ditto) {
    this.ditto = ditto;
    this.collection = ditto.store.collection('mapPoints');
  }

  // Create a new map point
  async createPoint(pointData) {
    const point = {
      _id: `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...pointData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false
    };
    
    await this.collection.upsert(point);
    return point;
  }

  // Read points with geographic filtering
  async getPointsInBounds(bounds) {
    const query = `latitude >= ${bounds.southWest.latitude} AND 
                   latitude <= ${bounds.northEast.latitude} AND 
                   longitude >= ${bounds.southWest.longitude} AND 
                   longitude <= ${bounds.northEast.longitude} AND 
                   isDeleted == false`;
    
    return await this.collection.find(query).exec();
  }

  // Update existing point
  async updatePoint(id, updates) {
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await this.collection.findByID(id).update((mutableDoc) => {
      Object.keys(updateData).forEach(key => {
        mutableDoc[key].set(updateData[key]);
      });
    });
  }

  // Soft delete point
  async deletePoint(id) {
    await this.collection.findByID(id).update((mutableDoc) => {
      mutableDoc.isDeleted.set(true);
      mutableDoc.updatedAt.set(new Date().toISOString());
    });
  }

  // Live query for real-time updates
  observePoints(bounds, callback) {
    const query = `latitude >= ${bounds.southWest.latitude} AND 
                   latitude <= ${bounds.northEast.latitude} AND 
                   longitude >= ${bounds.southWest.longitude} AND 
                   longitude <= ${bounds.northEast.longitude} AND 
                   isDeleted == false`;
    
    return this.collection.find(query).observeLocal(callback);
  }
}
```

### React Hook Integration

```javascript
// Custom hook for map points with Ditto
import { useState, useEffect } from 'react';

export const useMapPoints = (bounds, ditto) => {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!bounds || !ditto) return;

    const pointManager = new DittoPointManager(ditto);
    
    // Set up live query
    const liveQuery = pointManager.observePoints(bounds, (docs, event) => {
      setPoints(docs);
      setLoading(false);
    });

    // Cleanup
    return () => liveQuery.stop();
  }, [bounds, ditto]);

  const addPoint = async (pointData) => {
    try {
      const pointManager = new DittoPointManager(ditto);
      await pointManager.createPoint(pointData);
    } catch (err) {
      setError(err.message);
    }
  };

  const updatePoint = async (id, updates) => {
    try {
      const pointManager = new DittoPointManager(ditto);
      await pointManager.updatePoint(id, updates);
    } catch (err) {
      setError(err.message);
    }
  };

  const deletePoint = async (id) => {
    try {
      const pointManager = new DittoPointManager(ditto);
      await pointManager.deletePoint(id);
    } catch (err) {
      setError(err.message);
    }
  };

  return {
    points,
    loading,
    error,
    addPoint,
    updatePoint,
    deletePoint
  };
```

## Implementation Guidelines

### Environment Variables

```bash
# .env file
DITTO_APP_ID=your_app_id_here
DITTO_TOKEN=your_token_here
DITTO_ENVIRONMENT=production
```

### Best Practices

1. **Data Validation**: Always validate geographic coordinates and required fields
2. **Error Handling**: Implement comprehensive error handling with user-friendly messages
3. **Performance**: Use geographic bounds to limit query scope
4. **Security**: Never expose Ditto credentials in client code
5. **Testing**: Test offline scenarios and sync edge cases

## Testing Strategy

### Unit Testing

```javascript
// Example test for DittoPointManager
import { DittoPointManager } from './DittoPointManager';

describe('DittoPointManager', () => {
  let pointManager;
  let mockDitto;

  beforeEach(() => {
    mockDitto = {
      store: {
        collection: jest.fn(() => ({
          upsert: jest.fn(),
          find: jest.fn(() => ({
            exec: jest.fn(),
            observeLocal: jest.fn()
          })),
          findByID: jest.fn(() => ({
            update: jest.fn()
          }))
        }))
      }
    };
    pointManager = new DittoPointManager(mockDitto);
  });

  test('should create a point with valid data', async () => {
    const pointData = {
      latitude: 40.7128,
      longitude: -74.0060,
      title: 'Test Point'
    };

    const result = await pointManager.createPoint(pointData);
    
    expect(result).toHaveProperty('_id');
    expect(result.latitude).toBe(40.7128);
    expect(result.longitude).toBe(-74.0060);
    expect(result.title).toBe('Test Point');
  });
});
```

### Integration Testing

Test offline scenarios, sync behavior, and real-time updates:

```javascript
// Test offline functionality
test('should work offline', async () => {
  // Simulate offline mode
  await ditto.stopSync();
  
  // Create points offline
  const point = await pointManager.createPoint(testPointData);
  expect(point).toBeDefined();
  
  // Verify data persists
  const points = await pointManager.getPointsInBounds(testBounds);
  expect(points).toContain(point);
});
```

## Best Practices

### Performance Optimization

1. **Query Optimization**: Use geographic bounds to limit data scope
2. **Batch Operations**: Group multiple operations when possible
3. **Memory Management**: Clean up live query subscriptions
4. **Lazy Loading**: Load data as needed based on map viewport

### Security Considerations

1. **Environment Variables**: Store Ditto credentials securely
2. **Data Validation**: Validate all input data before storage
3. **Access Control**: Implement proper user permissions
4. **Sanitization**: Clean user inputs to prevent injection attacks

### Error Handling

```javascript
// Comprehensive error handling example
class DittoErrorHandler {
  static handleError(error, operation) {
    console.error(`Ditto ${operation} error:`, error);
    
    if (error.code === 'NETWORK_ERROR') {
      return 'Network connection lost. Changes will sync when online.';
    } else if (error.code === 'VALIDATION_ERROR') {
      return 'Invalid data provided. Please check your input.';
    } else if (error.code === 'PERMISSION_ERROR') {
      return 'Permission denied. Please check your credentials.';
    } else {
      return 'An unexpected error occurred. Please try again.';
    }
  }
}
```

## Next Steps

1. **Setup Ditto Account**: Create account at [ditto.live](https://ditto.live)
2. **Install Dependencies**: Add Ditto SDK to your React Native project
3. **Configure Authentication**: Set up app credentials and environment variables
4. **Implement Point Manager**: Create the DittoPointManager class
5. **Add React Hooks**: Implement useMapPoints hook for UI integration
6. **Test Offline Functionality**: Verify offline storage and sync behavior
7. **Deploy and Monitor**: Deploy app and monitor sync performance

For detailed implementation examples, see:
- [DITTO_IMPLEMENTATION.md](./DITTO_IMPLEMENTATION.md) - Complete implementation guide
- [DITTO_AI_AGENT_INSTRUCTIONS.md](./DITTO_AI_AGENT_INSTRUCTIONS.md) - AI agent specific instructions
- [TEAM_INTEGRATION_GUIDE.md](./TEAM_INTEGRATION_GUIDE.md) - Team collaboration guidelines
- [EXAMPLE_IMPLEMENTATIONS.md](./EXAMPLE_IMPLEMENTATIONS.md) - Working code examples

### Conflict Resolution Strategy

```typescript
interface ConflictResolution {
  strategy: 'last-write-wins' | 'manual' | 'merge';
  resolver?: (local: MapPoint, remote: MapPoint) => MapPoint;
}

// Last Write Wins (Recommended for simplicity)
function resolveConflict(local: MapPoint, remote: MapPoint): MapPoint {
  return local.updatedAt > remote.updatedAt ? local : remote;
}

// Manual Resolution (For critical data)
function manualResolve(local: MapPoint, remote: MapPoint): Promise<MapPoint> {
  return showConflictDialog(local, remote);
}
```

## CRUD Operations

### Create Point

```typescript
async function createPoint(pointData: NewPointData): Promise<MapPoint> {
  const point: MapPoint = {
    id: generateUUID(),
    ...pointData,
    createdAt: new Date(),
    updatedAt: new Date(),
    syncStatus: SyncStatus.PENDING_SYNC,
    isDeleted: false,
    version: 1
  };
  
  // Save to local storage immediately
  await localDB.save(point);
  
  // Queue for sync
  await syncQueue.add('create', point);
  
  return point;
}
```

### Read Points

```typescript
async function getPointsInBounds(bounds: GeoBounds): Promise<MapPoint[]> {
  // Always read from local storage first
  const points = await localDB.getByBounds(bounds);
  
  // Filter out deleted points
  return points.filter(point => !point.isDeleted);
}

async function getPointById(id: string): Promise<MapPoint | null> {
  const point = await localDB.getById(id);
  return point && !point.isDeleted ? point : null;
}
```

### Update Point

```typescript
async function updatePoint(id: string, updates: Partial<MapPoint>): Promise<MapPoint> {
  const existingPoint = await localDB.getById(id);
  if (!existingPoint || existingPoint.isDeleted) {
    throw new Error('Point not found');
  }
  
  const updatedPoint: MapPoint = {
    ...existingPoint,
    ...updates,
    updatedAt: new Date(),
    syncStatus: SyncStatus.PENDING_SYNC,
    version: existingPoint.version + 1
  };
  
  await localDB.update(id, updatedPoint);
  await syncQueue.add('update', updatedPoint);
  
  return updatedPoint;
}
```

### Delete Point

```typescript
async function deletePoint(id: string): Promise<boolean> {
  const point = await localDB.getById(id);
  if (!point) {
    return false;
  }
  
  // Soft delete
  const deletedPoint: MapPoint = {
    ...point,
    isDeleted: true,
    updatedAt: new Date(),
    syncStatus: SyncStatus.PENDING_SYNC,
    version: point.version + 1
  };
  
  await localDB.update(id, deletedPoint);
  await syncQueue.add('delete', deletedPoint);
  
  return true;
}
```

## Implementation Guidelines

### 1. Database Initialization

```typescript
class DatabaseManager {
  private db: Database;
  
  async initialize(): Promise<void> {
    this.db = await openDatabase('map_points.db');
    await this.createTables();
    await this.runMigrations();
  }
  
  private async createTables(): Promise<void> {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS map_points (
        id TEXT PRIMARY KEY,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        color TEXT,
        icon TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        is_deleted INTEGER NOT NULL DEFAULT 0,
        version INTEGER NOT NULL DEFAULT 1
      )
    `);
  }
}
```

### 2. Sync Manager Implementation

```typescript
class SyncManager {
  private syncQueue: SyncOperation[] = [];
  private isOnline: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  
  async startSync(): Promise<void> {
    this.isOnline = await this.checkNetworkStatus();
    this.syncInterval = setInterval(() => this.processSyncQueue(), 30000);
  }
  
  async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return;
    }
    
    const operation = this.syncQueue.shift();
    if (operation) {
      try {
        await this.executeSync(operation);
      } catch (error) {
        await this.handleSyncError(operation, error);
      }
    }
  }
  
  private async executeSync(operation: SyncOperation): Promise<void> {
    switch (operation.type) {
      case 'create':
        await this.apiClient.createPoint(operation.point);
        break;
      case 'update':
        await this.apiClient.updatePoint(operation.point);
        break;
      case 'delete':
        await this.apiClient.deletePoint(operation.point.id);
        break;
    }
    
    // Mark as synced
    await this.localDB.updateSyncStatus(operation.point.id, SyncStatus.SYNCED);
  }
}
```

### 3. Error Handling and Retry Logic

```typescript
interface RetryConfig {
  maxRetries: number;
  backoffMultiplier: number;
  initialDelay: number;
}

class RetryManager {
  private config: RetryConfig = {
    maxRetries: 3,
    backoffMultiplier: 2,
    initialDelay: 1000
  };
  
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    retryCount: number = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retryCount >= this.config.maxRetries) {
        throw error;
      }
      
      const delay = this.config.initialDelay * 
        Math.pow(this.config.backoffMultiplier, retryCount);
      
      await this.sleep(delay);
      return this.executeWithRetry(operation, retryCount + 1);
    }
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('PointManager', () => {
  let pointManager: PointManager;
  let mockDB: jest.Mocked<PointDataAccess>;
  
  beforeEach(() => {
    mockDB = createMockDB();
    pointManager = new PointManager(mockDB);
  });
  
  test('should create point with correct properties', async () => {
    const pointData = {
      latitude: 40.7128,
      longitude: -74.0060,
      title: 'Test Point'
    };
    
    const point = await pointManager.createPoint(pointData);
    
    expect(point.id).toBeDefined();
    expect(point.latitude).toBe(40.7128);
    expect(point.syncStatus).toBe(SyncStatus.PENDING_SYNC);
  });
  
  test('should persist point after app restart', async () => {
    const point = await pointManager.createPoint({
      latitude: 40.7128,
      longitude: -74.0060,
      title: 'Persistent Point'
    });
    
    // Simulate app restart
    const newPointManager = new PointManager(mockDB);
    const retrievedPoint = await newPointManager.getPoint(point.id);
    
    expect(retrievedPoint).toEqual(point);
  });
});
```

### Integration Tests

```typescript
describe('Offline Storage Integration', () => {
  test('should maintain data consistency across operations', async () => {
    // Create multiple points
    const points = await Promise.all([
      createPoint({ lat: 1, lng: 1, title: 'Point 1' }),
      createPoint({ lat: 2, lng: 2, title: 'Point 2' }),
      createPoint({ lat: 3, lng: 3, title: 'Point 3' })
    ]);
    
    // Update one point
    await updatePoint(points[1].id, { title: 'Updated Point 2' });
    
    // Delete one point
    await deletePoint(points[2].id);
    
    // Verify final state
    const allPoints = await getAllPoints();
    expect(allPoints).toHaveLength(2);
    expect(allPoints.find(p => p.id === points[1].id)?.title).toBe('Updated Point 2');
    expect(allPoints.find(p => p.id === points[2].id)).toBeUndefined();
  });
});
```

## Best Practices

### 1. Data Validation

```typescript
function validatePoint(point: Partial<MapPoint>): ValidationResult {
  const errors: string[] = [];
  
  if (!point.latitude || point.latitude < -90 || point.latitude > 90) {
    errors.push('Invalid latitude');
  }
  
  if (!point.longitude || point.longitude < -180 || point.longitude > 180) {
    errors.push('Invalid longitude');
  }
  
  if (!point.title || point.title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

### 2. Performance Optimization

```typescript
// Use database indexes for common queries
const COMMON_QUERIES = {
  byBounds: 'SELECT * FROM map_points WHERE latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?',
  byCategory: 'SELECT * FROM map_points WHERE category = ? AND is_deleted = 0',
  pendingSync: 'SELECT * FROM map_points WHERE sync_status = "pending"'
};

// Implement pagination for large datasets
async function getPointsPaginated(offset: number, limit: number): Promise<MapPoint[]> {
  return await db.query(
    'SELECT * FROM map_points WHERE is_deleted = 0 ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [limit, offset]
  );
}
```

### 3. Memory Management

```typescript
class PointCache {
  private cache = new Map<string, MapPoint>();
  private maxSize = 1000;
  
  set(id: string, point: MapPoint): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(id, point);
  }
  
  get(id: string): MapPoint | undefined {
    return this.cache.get(id);
  }
  
  clear(): void {
    this.cache.clear();
  }
}
```

### 4. Security Considerations

```typescript
// Encrypt sensitive data before storage
class SecureStorage {
  private encryptionKey: string;
  
  async store(key: string, data: any): Promise<void> {
    const encrypted = await this.encrypt(JSON.stringify(data));
    await this.localStorage.setItem(key, encrypted);
  }
  
  async retrieve(key: string): Promise<any> {
    const encrypted = await this.localStorage.getItem(key);
    if (!encrypted) return null;
    
    const decrypted = await this.decrypt(encrypted);
    return JSON.parse(decrypted);
  }
  
  private async encrypt(data: string): Promise<string> {
    // Implementation depends on platform
    return encryptWithAES(data, this.encryptionKey);
  }
}
```

## Conclusion

This documentation provides a comprehensive foundation for implementing offline storage and sync capabilities in a mobile map application. The architecture ensures data persistence, handles offline scenarios gracefully, and provides a smooth user experience.

Key implementation points:
- Use SQLite or similar for reliable local storage
- Implement offline-first CRUD operations
- Design robust sync mechanisms with conflict resolution
- Include comprehensive error handling and retry logic
- Follow testing best practices for reliability

The system guarantees that dropped points persist across app sessions and provides seamless synchronization when network connectivity is restored.
