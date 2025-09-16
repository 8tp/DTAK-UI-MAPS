# React Native Mobile Map Application - Ditto SDK Implementation

## Overview

This documentation provides comprehensive guidelines for implementing offline storage and synchronization capabilities for a **React Native mobile map application** using the **Ditto SDK**. Ditto is a distributed database designed for offline-first applications with automatic peer-to-peer and cloud synchronization.

## Why Ditto for Map Applications?

### Key Advantages
- **Offline-First**: Works seamlessly without network connectivity
- **Automatic Sync**: Handles synchronization automatically when connectivity is available
- **Peer-to-Peer**: Devices can sync directly with each other without internet
- **Real-time Updates**: Live queries provide instant UI updates
- **Conflict Resolution**: Built-in CRDT (Conflict-free Replicated Data Types) handling
- **Cross-Platform**: Works on iOS, Android, Web, and more
- **SQL-like Queries**: Familiar DQL (Ditto Query Language) syntax

## Table of Contents

1. [Project Setup](#project-setup)
2. [Ditto Configuration](#ditto-configuration)
3. [Data Model](#data-model)
4. [CRUD Operations](#crud-operations)
5. [Real-time Subscriptions](#real-time-subscriptions)
6. [Sync Management](#sync-management)
7. [React Native Integration](#react-native-integration)
8. [Testing Strategy](#testing-strategy)
9. [Best Practices](#best-practices)

## Project Setup

### Dependencies

```json
{
  "dependencies": {
    "@dittolive/ditto": "^4.7.0",
    "react-native-maps": "^1.8.0",
    "@react-native-netinfo/netinfo": "^11.3.1",
    "react-native-permissions": "^4.1.5"
  },
  "devDependencies": {
    "@types/react-native": "^0.72.0"
  }
}
```

### Installation

```bash
# Install Ditto SDK
yarn add @dittolive/ditto

# Install supporting packages
yarn add react-native-maps @react-native-netinfo/netinfo react-native-permissions

# iOS setup
cd ios && pod install && cd ..
```

### Expo Configuration

For Expo projects, add the Ditto plugin to your `app.json`:

```json
{
  "expo": {
    "plugins": ["@dittolive/ditto"],
    "ios": {
      "infoPlist": {
        "NSLocalNetworkUsageDescription": "This app uses the local network to sync data with nearby devices.",
        "NSBonjourServices": ["_ditto._tcp"]
      }
    },
    "android": {
      "permissions": [
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.INTERNET",
        "android.permission.ACCESS_WIFI_STATE",
        "android.permission.CHANGE_WIFI_MULTICAST_STATE"
      ]
    }
  }
}
```

## Ditto Configuration

### Authentication Setup

```typescript
// config/DittoConfig.ts
import { Ditto, Identity } from '@dittolive/ditto';

export class DittoConfig {
  private static instance: Ditto | null = null;

  static async initialize(): Promise<Ditto> {
    if (this.instance) {
      return this.instance;
    }

    try {
      // For development - use onlinePlayground
      const identity: Identity = {
        type: 'onlinePlayground',
        appID: 'your-app-id-here', // Get from Ditto portal
        token: 'your-token-here',   // Get from Ditto portal
      };

      // For production - use onlineWithAuthentication
      // const identity: Identity = {
      //   type: 'onlineWithAuthentication',
      //   appID: 'your-app-id',
      //   customAuthenticator: async (authenticator) => {
      //     // Implement your authentication logic
      //     const token = await getAuthToken();
      //     authenticator.loginWithToken(token, 'your-provider');
      //   }
      // };

      this.instance = new Ditto(identity);

      // Configure transports for peer-to-peer sync
      this.instance.updateTransportConfig((config) => {
        config.setAvailablePeerToPeerEnabled(true);
      });

      // Start sync
      await this.instance.startSync();

      console.log('Ditto initialized successfully');
      return this.instance;
    } catch (error) {
      console.error('Failed to initialize Ditto:', error);
      throw error;
    }
  }

  static getInstance(): Ditto | null {
    return this.instance;
  }
}
```

## Data Model

### Map Point Schema

```typescript
// types/MapPoint.ts
export interface MapPoint {
  _id: string;           // Ditto document ID
  latitude: number;      // Geographic latitude
  longitude: number;     // Geographic longitude
  title: string;         // Point title/name
  description?: string;  // Optional description
  category?: string;     // Point category/type
  color?: string;        // Display color
  icon?: string;         // Icon identifier
  createdAt: string;     // ISO timestamp
  updatedAt: string;     // ISO timestamp
  userId?: string;       // Creator user ID
  isDeleted: boolean;    // Soft delete flag
}

export interface NewMapPoint {
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  category?: string;
  color?: string;
  icon?: string;
}

export interface GeoBounds {
  northEast: { latitude: number; longitude: number };
  southWest: { latitude: number; longitude: number };
}
```

### Collection Setup

```typescript
// managers/DittoManager.ts
import { Ditto } from '@dittolive/ditto';
import { DittoConfig } from '../config/DittoConfig';

export class DittoManager {
  private ditto: Ditto;
  private readonly COLLECTION_NAME = 'map_points';

  constructor() {
    const dittoInstance = DittoConfig.getInstance();
    if (!dittoInstance) {
      throw new Error('Ditto not initialized. Call DittoConfig.initialize() first.');
    }
    this.ditto = dittoInstance;
  }

  async initialize(): Promise<void> {
    // Register subscription for all map points
    await this.ditto.sync.registerSubscription(
      `SELECT * FROM ${this.COLLECTION_NAME} WHERE isDeleted != true`
    );

    console.log('DittoManager initialized with subscriptions');
  }
}
```

## CRUD Operations

### Point Manager with Ditto

```typescript
// managers/PointManager.ts
import { Ditto } from '@dittolive/ditto';
import { MapPoint, NewMapPoint, GeoBounds } from '../types/MapPoint';
import { DittoManager } from './DittoManager';

export class PointManager extends DittoManager {
  async createPoint(pointData: NewMapPoint): Promise<MapPoint> {
    const now = new Date().toISOString();
    
    const newPoint: MapPoint = {
      _id: this.generateId(),
      ...pointData,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };

    try {
      await this.ditto.store.execute(
        `INSERT INTO ${this.COLLECTION_NAME} DOCUMENTS (:point)`,
        { point: newPoint }
      );

      console.log('Created point:', newPoint._id);
      return newPoint;
    } catch (error) {
      console.error('Failed to create point:', error);
      throw error;
    }
  }

  async getPoint(id: string): Promise<MapPoint | null> {
    try {
      const result = await this.ditto.store.execute(
        `SELECT * FROM ${this.COLLECTION_NAME} WHERE _id = :id AND isDeleted != true`,
        { id }
      );

      if (result.items.length === 0) {
        return null;
      }

      return result.items[0].value as MapPoint;
    } catch (error) {
      console.error('Failed to get point:', error);
      throw error;
    }
  }

  async updatePoint(id: string, updates: Partial<MapPoint>): Promise<MapPoint> {
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    try {
      await this.ditto.store.execute(
        `UPDATE ${this.COLLECTION_NAME} SET ${Object.keys(updatedData)
          .map(key => `${key} = :${key}`)
          .join(', ')} WHERE _id = :id`,
        { ...updatedData, id }
      );

      const updatedPoint = await this.getPoint(id);
      if (!updatedPoint) {
        throw new Error('Point not found after update');
      }

      console.log('Updated point:', id);
      return updatedPoint;
    } catch (error) {
      console.error('Failed to update point:', error);
      throw error;
    }
  }

  async deletePoint(id: string): Promise<boolean> {
    try {
      await this.ditto.store.execute(
        `UPDATE ${this.COLLECTION_NAME} SET isDeleted = true, updatedAt = :updatedAt WHERE _id = :id`,
        { id, updatedAt: new Date().toISOString() }
      );

      console.log('Deleted point:', id);
      return true;
    } catch (error) {
      console.error('Failed to delete point:', error);
      return false;
    }
  }

  async getAllPoints(): Promise<MapPoint[]> {
    try {
      const result = await this.ditto.store.execute(
        `SELECT * FROM ${this.COLLECTION_NAME} WHERE isDeleted != true ORDER BY createdAt DESC`
      );

      return result.items.map(item => item.value as MapPoint);
    } catch (error) {
      console.error('Failed to get all points:', error);
      throw error;
    }
  }

  async getPointsInBounds(bounds: GeoBounds): Promise<MapPoint[]> {
    try {
      const result = await this.ditto.store.execute(
        `SELECT * FROM ${this.COLLECTION_NAME} 
         WHERE isDeleted != true 
         AND latitude BETWEEN :minLat AND :maxLat 
         AND longitude BETWEEN :minLng AND :maxLng 
         ORDER BY createdAt DESC`,
        {
          minLat: bounds.southWest.latitude,
          maxLat: bounds.northEast.latitude,
          minLng: bounds.southWest.longitude,
          maxLng: bounds.northEast.longitude,
        }
      );

      return result.items.map(item => item.value as MapPoint);
    } catch (error) {
      console.error('Failed to get points in bounds:', error);
      throw error;
    }
  }

  async getPointsByCategory(category: string): Promise<MapPoint[]> {
    try {
      const result = await this.ditto.store.execute(
        `SELECT * FROM ${this.COLLECTION_NAME} 
         WHERE isDeleted != true AND category = :category 
         ORDER BY createdAt DESC`,
        { category }
      );

      return result.items.map(item => item.value as MapPoint);
    } catch (error) {
      console.error('Failed to get points by category:', error);
      throw error;
    }
  }

  private generateId(): string {
    return `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

## Real-time Subscriptions

### Live Query Observer

```typescript
// hooks/useMapPoints.ts
import { useState, useEffect, useCallback } from 'react';
import { MapPoint, GeoBounds } from '../types/MapPoint';
import { PointManager } from '../managers/PointManager';
import { DittoConfig } from '../config/DittoConfig';

export const useMapPoints = (bounds?: GeoBounds) => {
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pointManager, setPointManager] = useState<PointManager | null>(null);

  useEffect(() => {
    initializeManager();
  }, []);

  const initializeManager = async () => {
    try {
      await DittoConfig.initialize();
      const manager = new PointManager();
      await manager.initialize();
      setPointManager(manager);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize');
    }
  };

  useEffect(() => {
    if (!pointManager) return;

    let unsubscribe: (() => void) | null = null;

    const setupLiveQuery = async () => {
      try {
        setLoading(true);
        
        const ditto = DittoConfig.getInstance();
        if (!ditto) throw new Error('Ditto not available');

        // Build query based on bounds
        let query = `SELECT * FROM map_points WHERE isDeleted != true`;
        let args: Record<string, any> = {};

        if (bounds) {
          query += ` AND latitude BETWEEN :minLat AND :maxLat AND longitude BETWEEN :minLng AND :maxLng`;
          args = {
            minLat: bounds.southWest.latitude,
            maxLat: bounds.northEast.latitude,
            minLng: bounds.southWest.longitude,
            maxLng: bounds.northEast.longitude,
          };
        }

        query += ` ORDER BY createdAt DESC`;

        // Register live query observer
        unsubscribe = ditto.store.registerObserver(query, args, (result) => {
          const mapPoints = result.items.map(item => item.value as MapPoint);
          setPoints(mapPoints);
          setLoading(false);
          setError(null);
        });

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to setup live query');
        setLoading(false);
      }
    };

    setupLiveQuery();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [pointManager, bounds]);

  const createPoint = useCallback(async (pointData: NewMapPoint) => {
    if (!pointManager) throw new Error('PointManager not initialized');
    return await pointManager.createPoint(pointData);
  }, [pointManager]);

  const updatePoint = useCallback(async (id: string, updates: Partial<MapPoint>) => {
    if (!pointManager) throw new Error('PointManager not initialized');
    return await pointManager.updatePoint(id, updates);
  }, [pointManager]);

  const deletePoint = useCallback(async (id: string) => {
    if (!pointManager) throw new Error('PointManager not initialized');
    return await pointManager.deletePoint(id);
  }, [pointManager]);

  return {
    points,
    loading,
    error,
    createPoint,
    updatePoint,
    deletePoint,
    pointManager,
  };
};
```

## Sync Management

### Presence and Sync Status

```typescript
// hooks/useDittoSync.ts
import { useState, useEffect } from 'react';
import { DittoConfig } from '../config/DittoConfig';

interface SyncStatus {
  isOnline: boolean;
  connectedPeers: number;
  syncActive: boolean;
}

export const useDittoSync = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: false,
    connectedPeers: 0,
    syncActive: false,
  });

  useEffect(() => {
    const ditto = DittoConfig.getInstance();
    if (!ditto) return;

    // Monitor presence (connected peers)
    const presenceUnsubscribe = ditto.presence.observe((graph) => {
      setSyncStatus(prev => ({
        ...prev,
        connectedPeers: graph.remotePeers.length,
        syncActive: graph.remotePeers.length > 0,
      }));
    });

    // Monitor network connectivity
    const checkNetworkStatus = async () => {
      // You can integrate with NetInfo here if needed
      // For now, we'll assume online if we have the ditto instance
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
    };

    checkNetworkStatus();

    return () => {
      if (presenceUnsubscribe) {
        presenceUnsubscribe();
      }
    };
  }, []);

  return syncStatus;
};
```

## React Native Integration

### Map Screen Component

```typescript
// components/MapScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Region, LatLng } from 'react-native-maps';
import { useMapPoints } from '../hooks/useMapPoints';
import { useDittoSync } from '../hooks/useDittoSync';
import { NewMapPoint } from '../types/MapPoint';

export const MapScreen: React.FC = () => {
  const [region, setRegion] = useState<Region>({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const { points, loading, error, createPoint, deletePoint } = useMapPoints();
  const syncStatus = useDittoSync();

  const handleMapPress = useCallback(async (event: { nativeEvent: { coordinate: LatLng } }) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    try {
      const newPointData: NewMapPoint = {
        latitude,
        longitude,
        title: `Point ${points.length + 1}`,
        description: 'Added from map',
        category: 'user-created',
        color: '#FF0000',
      };

      await createPoint(newPointData);
    } catch (error) {
      console.error('Failed to create point:', error);
      Alert.alert('Error', 'Failed to create point');
    }
  }, [points.length, createPoint]);

  const handleMarkerPress = useCallback((pointId: string, title: string) => {
    Alert.alert(
      title,
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePoint(pointId);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete point');
            }
          },
        },
      ]
    );
  }, [deletePoint]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Sync Status Indicator */}
      <View style={styles.syncStatus}>
        <View style={[
          styles.syncIndicator,
          { backgroundColor: syncStatus.syncActive ? '#4CAF50' : '#FF9800' }
        ]} />
        <Text style={styles.syncText}>
          {syncStatus.connectedPeers} peers • {syncStatus.isOnline ? 'Online' : 'Offline'}
        </Text>
      </View>

      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {points.map((point) => (
          <Marker
            key={point._id}
            coordinate={{
              latitude: point.latitude,
              longitude: point.longitude,
            }}
            title={point.title}
            description={point.description}
            pinColor={point.color || '#FF0000'}
            onPress={() => handleMarkerPress(point._id, point.title)}
          />
        ))}
      </MapView>

      <View style={styles.pointsCounter}>
        <Text style={styles.counterText}>{points.length} points</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    margin: 20,
  },
  map: {
    flex: 1,
  },
  syncStatus: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 5,
  },
  syncIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  syncText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  pointsCounter: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 8,
  },
  counterText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
```

## Testing Strategy

### Unit Tests

```typescript
// __tests__/PointManager.test.ts
import { PointManager } from '../src/managers/PointManager';
import { DittoConfig } from '../src/config/DittoConfig';

// Mock Ditto SDK
jest.mock('@dittolive/ditto', () => ({
  Ditto: jest.fn().mockImplementation(() => ({
    store: {
      execute: jest.fn(),
      registerObserver: jest.fn(),
    },
    sync: {
      registerSubscription: jest.fn(),
    },
    updateTransportConfig: jest.fn(),
    startSync: jest.fn(),
  })),
}));

describe('PointManager', () => {
  let pointManager: PointManager;

  beforeEach(async () => {
    await DittoConfig.initialize();
    pointManager = new PointManager();
    await pointManager.initialize();
  });

  test('should create point successfully', async () => {
    const mockExecute = jest.fn().mockResolvedValue({ items: [] });
    const ditto = DittoConfig.getInstance();
    ditto!.store.execute = mockExecute;

    const pointData = {
      latitude: 40.7128,
      longitude: -74.0060,
      title: 'Test Point',
    };

    const result = await pointManager.createPoint(pointData);

    expect(result.title).toBe('Test Point');
    expect(result.latitude).toBe(40.7128);
    expect(result.isDeleted).toBe(false);
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO map_points'),
      expect.objectContaining({ point: expect.any(Object) })
    );
  });
});
```

## Best Practices

### 1. Error Handling

```typescript
// utils/ErrorHandler.ts
export class DittoErrorHandler {
  static handle(error: any, context: string): void {
    console.error(`[${context}] Ditto error:`, error);
    
    // Log to crash reporting service
    // crashlytics().recordError(error);
    
    // Show user-friendly message
    if (error.message?.includes('network')) {
      // Handle network errors
      console.log('Network error - operating in offline mode');
    } else if (error.message?.includes('permission')) {
      // Handle permission errors
      console.log('Permission error - check app permissions');
    }
  }
}
```

### 2. Performance Optimization

```typescript
// Use efficient queries with proper indexing
const efficientQuery = `
  SELECT * FROM map_points 
  WHERE isDeleted != true 
  AND latitude BETWEEN :minLat AND :maxLat 
  AND longitude BETWEEN :minLng AND :maxLng 
  ORDER BY createdAt DESC 
  LIMIT 100
`;

// Batch operations when possible
const batchCreate = async (points: NewMapPoint[]) => {
  const documents = points.map(point => ({
    _id: generateId(),
    ...point,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: false,
  }));

  await ditto.store.execute(
    `INSERT INTO map_points DOCUMENTS ${documents.map((_, i) => `(:doc${i})`).join(', ')}`,
    documents.reduce((acc, doc, i) => ({ ...acc, [`doc${i}`]: doc }), {})
  );
};
```

### 3. Security Considerations

```typescript
// Validate input data
const validateMapPoint = (data: NewMapPoint): void => {
  if (data.latitude < -90 || data.latitude > 90) {
    throw new Error('Invalid latitude');
  }
  if (data.longitude < -180 || data.longitude > 180) {
    throw new Error('Invalid longitude');
  }
  if (!data.title || data.title.trim().length === 0) {
    throw new Error('Title is required');
  }
};

// Sanitize user input
const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};
```

## Conclusion

Ditto provides an excellent foundation for building offline-first mobile map applications. Key benefits include:

- **Zero Configuration Sync**: Automatic synchronization without manual queue management
- **Real-time Updates**: Live queries provide instant UI updates
- **Peer-to-Peer Capability**: Devices can sync directly without internet
- **Built-in Conflict Resolution**: CRDT-based conflict handling
- **Cross-Platform Support**: Works seamlessly across all platforms

The implementation ensures that map points persist across app sessions and sync automatically when connectivity is available, providing a seamless user experience in both online and offline scenarios.
