/**
 * Map Points Hook - Main interface for frontend components
 * Provides real-time map points data with CRUD operations
 */

import { useState, useEffect, useCallback } from 'react';
import { MapPoint, NewMapPoint, GeoBounds, MapPointsHookReturn } from '../types/MapPoint';
import { PointManager } from '../managers/PointManager';
import { DittoConfig } from '../config/DittoConfig';
import { DittoErrorHandler } from '../utils/ErrorHandler';
import { useDittoSync } from './useDittoSync';

export const useMapPoints = (bounds?: GeoBounds): MapPointsHookReturn => {
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pointManager, setPointManager] = useState<PointManager | null>(null);
  
  // Get sync status from dedicated hook
  const { syncStatus } = useDittoSync();

  // Initialize point manager
  useEffect(() => {
    let mounted = true;

    const initializeManager = async () => {
      try {
        setLoading(true);
        setError(null);

        // Initialize Ditto if not already done
        await DittoConfig.initialize();
        
        if (!mounted) return;

        // Create and initialize point manager
        const manager = new PointManager();
        await manager.initialize();
        
        if (!mounted) return;

        setPointManager(manager);
        console.log('📱 MapPoints hook initialized successfully');
      } catch (err) {
        if (!mounted) return;
        
        const errorMessage = DittoErrorHandler.handle(err, 'MapPoints Hook Initialization');
        setError(errorMessage);
        setLoading(false);
      }
    };

    initializeManager();

    return () => {
      mounted = false;
    };
  }, []);

  // Set up live query observer
  useEffect(() => {
    if (!pointManager) return;

    let unsubscribe: (() => void) | null = null;
    let mounted = true;

    const setupLiveQuery = () => {
      try {
        setLoading(true);

        // Choose observer based on whether bounds are provided
        if (bounds) {
          unsubscribe = pointManager.observePointsInBounds(bounds, (updatedPoints) => {
            if (!mounted) return;
            setPoints(updatedPoints);
            setLoading(false);
            setError(null);
          });
        } else {
          unsubscribe = pointManager.observeAllPoints((updatedPoints) => {
            if (!mounted) return;
            setPoints(updatedPoints);
            setLoading(false);
            setError(null);
          });
        }

        console.log(`🔄 Live query observer set up ${bounds ? 'with bounds' : 'for all points'}`);
      } catch (err) {
        if (!mounted) return;
        
        const errorMessage = DittoErrorHandler.handle(err, 'Live Query Setup');
        setError(errorMessage);
        setLoading(false);
      }
    };

    setupLiveQuery();

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [pointManager, bounds]);

  /**
   * Create a new map point
   */
  const createPoint = useCallback(async (pointData: NewMapPoint): Promise<MapPoint> => {
    if (!pointManager) {
      throw new Error('PointManager not initialized');
    }

    try {
      const newPoint = await pointManager.createPoint(pointData);
      console.log(`✅ Point created: ${newPoint.title}`);
      return newPoint;
    } catch (err) {
      const errorMessage = DittoErrorHandler.handle(err, 'Create Point');
      setError(errorMessage);
      throw err;
    }
  }, [pointManager]);

  /**
   * Update an existing point
   */
  const updatePoint = useCallback(async (id: string, updates: Partial<MapPoint>): Promise<MapPoint> => {
    if (!pointManager) {
      throw new Error('PointManager not initialized');
    }

    try {
      const updatedPoint = await pointManager.updatePoint(id, updates);
      console.log(`✅ Point updated: ${updatedPoint.title}`);
      return updatedPoint;
    } catch (err) {
      const errorMessage = DittoErrorHandler.handle(err, 'Update Point');
      setError(errorMessage);
      throw err;
    }
  }, [pointManager]);

  /**
   * Delete a point (soft delete)
   */
  const deletePoint = useCallback(async (id: string): Promise<boolean> => {
    if (!pointManager) {
      throw new Error('PointManager not initialized');
    }

    try {
      const success = await pointManager.deletePoint(id);
      if (success) {
        console.log(`✅ Point deleted: ${id}`);
      }
      return success;
    } catch (err) {
      const errorMessage = DittoErrorHandler.handle(err, 'Delete Point');
      setError(errorMessage);
      return false;
    }
  }, [pointManager]);

  /**
   * Search points by title or description
   */
  const searchPoints = useCallback(async (searchTerm: string): Promise<MapPoint[]> => {
    if (!pointManager) {
      return [];
    }

    try {
      return await pointManager.searchPoints(searchTerm);
    } catch (err) {
      const errorMessage = DittoErrorHandler.handle(err, 'Search Points');
      setError(errorMessage);
      return [];
    }
  }, [pointManager]);

  /**
   * Get points by category
   */
  const getPointsByCategory = useCallback(async (category: string): Promise<MapPoint[]> => {
    if (!pointManager) {
      return [];
    }

    try {
      return await pointManager.getPointsByCategory(category);
    } catch (err) {
      const errorMessage = DittoErrorHandler.handle(err, 'Get Points By Category');
      setError(errorMessage);
      return [];
    }
  }, [pointManager]);

  /**
   * Clear any errors
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Core data
    points,
    loading,
    error,
    
    // CRUD operations (as per team contract)
    createPoint,
    updatePoint,
    deletePoint,
    
    // Additional utility functions
    searchPoints,
    getPointsByCategory,
    clearError,
    
    // Sync status
    syncStatus,
    
    // Convenience properties
    pointCount: points.length,
    hasPoints: points.length > 0,
    isInitialized: pointManager !== null,
  };
};
