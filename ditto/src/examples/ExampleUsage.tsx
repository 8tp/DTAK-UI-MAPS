/**
 * Example usage of the Ditto offline storage hooks
 * This shows frontend team members how to integrate with the storage layer
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useMapPoints, useDittoSync } from '../index';
import type { NewMapPoint, GeoBounds } from '../index';

// Example map component showing integration
export const ExampleMapComponent: React.FC = () => {
  // Example bounds for New York City area
  const [bounds] = useState<GeoBounds>({
    northEast: { latitude: 40.7829, longitude: -73.9441 },
    southWest: { latitude: 40.7489, longitude: -74.0441 }
  });

  // Use the storage layer hooks
  const {
    points,
    loading,
    error,
    createPoint,
    updatePoint,
    deletePoint,
    syncStatus,
    clearError
  } = useMapPoints(bounds);

  const { isOnline, connectedPeers } = useDittoSync();

  // Example: Create a new point
  const handleCreatePoint = useCallback(async () => {
    try {
      const newPointData: NewMapPoint = {
        latitude: 40.7128,
        longitude: -74.0060,
        title: `Point ${points.length + 1}`,
        description: 'Created from example component',
        category: 'example',
        color: '#4CAF50'
      };

      await createPoint(newPointData);
      Alert.alert('Success', 'Point created successfully!');
    } catch (err) {
      Alert.alert('Error', 'Failed to create point');
    }
  }, [createPoint, points.length]);

  // Example: Update first point
  const handleUpdateFirstPoint = useCallback(async () => {
    if (points.length === 0) {
      Alert.alert('No Points', 'Create a point first');
      return;
    }

    try {
      const firstPoint = points[0];
      await updatePoint(firstPoint._id, {
        title: `Updated: ${firstPoint.title}`,
        description: 'Updated from example component'
      });
      Alert.alert('Success', 'Point updated successfully!');
    } catch (err) {
      Alert.alert('Error', 'Failed to update point');
    }
  }, [updatePoint, points]);

  // Example: Delete first point
  const handleDeleteFirstPoint = useCallback(async () => {
    if (points.length === 0) {
      Alert.alert('No Points', 'No points to delete');
      return;
    }

    try {
      const firstPoint = points[0];
      const success = await deletePoint(firstPoint._id);
      if (success) {
        Alert.alert('Success', 'Point deleted successfully!');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to delete point');
    }
  }, [deletePoint, points]);

  // Show loading state
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading map points...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sync Status Indicator */}
      <View style={styles.syncStatus}>
        <View style={[
          styles.syncIndicator,
          { backgroundColor: isOnline ? '#4CAF50' : '#FF9800' }
        ]} />
        <Text style={styles.syncText}>
          {connectedPeers} peers • {isOnline ? 'Online' : 'Offline'}
        </Text>
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError} style={styles.clearErrorButton}>
            <Text style={styles.clearErrorText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Points Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          {points.length} points loaded
        </Text>
        <Text style={styles.syncStatusText}>
          Sync: {syncStatus.syncActive ? 'Active' : 'Inactive'}
        </Text>
      </View>

      {/* Points List */}
      <View style={styles.pointsList}>
        {points.map((point) => (
          <View key={point._id} style={styles.pointItem}>
            <Text style={styles.pointTitle}>{point.title}</Text>
            <Text style={styles.pointCoords}>
              {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
            </Text>
            {point.description && (
              <Text style={styles.pointDescription}>{point.description}</Text>
            )}
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleCreatePoint}
        >
          <Text style={styles.buttonText}>Create Point</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#FF9800' }]} 
          onPress={handleUpdateFirstPoint}
          disabled={points.length === 0}
        >
          <Text style={styles.buttonText}>Update First</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#F44336' }]} 
          onPress={handleDeleteFirstPoint}
          disabled={points.length === 0}
        >
          <Text style={styles.buttonText}>Delete First</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
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
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    flex: 1,
  },
  clearErrorButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#d32f2f',
    borderRadius: 4,
  },
  clearErrorText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  syncStatusText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  pointsList: {
    flex: 1,
    marginBottom: 16,
  },
  pointItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  pointTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  pointCoords: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  pointDescription: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
