/**
 * Point Manager - Handles all CRUD operations for map points using Ditto SDK
 * Provides the core data layer functionality for the mobile map application
 */

import { MapPoint, NewMapPoint, GeoBounds, ErrorType } from '../types/MapPoint';
import { DittoManager } from './DittoManager';
import { DittoErrorHandler } from '../utils/ErrorHandler';

export class PointManager extends DittoManager {
  constructor() {
    super('map_points');
  }

  /**
   * Create a new map point
   */
  async createPoint(pointData: NewMapPoint): Promise<MapPoint> {
    this.checkInitialization();
    
    // Validate input data
    DittoErrorHandler.validateMapPoint(pointData);
    
    const now = this.getCurrentTimestamp();
    
    const newPoint: MapPoint = {
      _id: this.generateId(),
      latitude: pointData.latitude,
      longitude: pointData.longitude,
      title: DittoErrorHandler.sanitizeString(pointData.title),
      description: pointData.description ? DittoErrorHandler.sanitizeString(pointData.description) : undefined,
      category: pointData.category ? DittoErrorHandler.sanitizeString(pointData.category) : undefined,
      color: pointData.color || '#FF0000',
      icon: pointData.icon || 'default-pin',
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };

    try {
      await this.executeQuery(
        `INSERT INTO ${this.collectionName} DOCUMENTS (:point)`,
        { point: newPoint }
      );

      console.log(`📍 Created point: ${newPoint.title} (${newPoint._id})`);
      return newPoint;
    } catch (error) {
      console.error('Failed to create point:', error);
      throw error;
    }
  }

  /**
   * Get a single point by ID
   */
  async getPoint(id: string): Promise<MapPoint | null> {
    this.checkInitialization();
    
    if (!id) {
      return null;
    }

    try {
      const result = await this.executeQuery(
        `SELECT * FROM ${this.collectionName} WHERE _id = :id AND isDeleted != true`,
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

  /**
   * Update an existing point
   */
  async updatePoint(id: string, updates: Partial<MapPoint>): Promise<MapPoint> {
    this.checkInitialization();
    
    if (!id) {
      throw DittoErrorHandler.createError(
        ErrorType.VALIDATION_ERROR,
        'Point ID is required'
      );
    }

    // Validate updates if they contain coordinate or title changes
    if (updates.latitude !== undefined || updates.longitude !== undefined || updates.title !== undefined) {
      const tempPoint = {
        latitude: updates.latitude ?? 0,
        longitude: updates.longitude ?? 0,
        title: updates.title ?? 'temp'
      };
      DittoErrorHandler.validateMapPoint(tempPoint);
    }

    // Sanitize string fields
    const sanitizedUpdates: Partial<MapPoint> = {
      ...updates,
      updatedAt: this.getCurrentTimestamp()
    };

    if (updates.title) {
      sanitizedUpdates.title = DittoErrorHandler.sanitizeString(updates.title);
    }
    if (updates.description) {
      sanitizedUpdates.description = DittoErrorHandler.sanitizeString(updates.description);
    }
    if (updates.category) {
      sanitizedUpdates.category = DittoErrorHandler.sanitizeString(updates.category);
    }

    try {
      // Build dynamic update query
      const updateFields = Object.keys(sanitizedUpdates)
        .filter(key => key !== '_id') // Don't update ID
        .map(key => `${key} = :${key}`)
        .join(', ');

      await this.executeQuery(
        `UPDATE ${this.collectionName} SET ${updateFields} WHERE _id = :id`,
        { ...sanitizedUpdates, id }
      );

      // Return updated point
      const updatedPoint = await this.getPoint(id);
      if (!updatedPoint) {
        throw DittoErrorHandler.createError(
          'NOT_FOUND_ERROR' as any,
          'Point not found after update'
        );
      }

      console.log(`📝 Updated point: ${updatedPoint.title} (${id})`);
      return updatedPoint;
    } catch (error) {
      console.error('Failed to update point:', error);
      throw error;
    }
  }

  /**
   * Soft delete a point (mark as deleted)
   */
  async deletePoint(id: string): Promise<boolean> {
    this.checkInitialization();
    
    if (!id) {
      return false;
    }

    try {
      await this.executeQuery(
        `UPDATE ${this.collectionName} SET isDeleted = true, updatedAt = :updatedAt WHERE _id = :id`,
        { id, updatedAt: this.getCurrentTimestamp() }
      );

      console.log(`🗑️ Deleted point: ${id}`);
      return true;
    } catch (error) {
      console.error('Failed to delete point:', error);
      return false;
    }
  }

  /**
   * Get all active points (not deleted)
   */
  async getAllPoints(): Promise<MapPoint[]> {
    this.checkInitialization();

    try {
      const result = await this.executeQuery(
        `SELECT * FROM ${this.collectionName} WHERE isDeleted != true ORDER BY createdAt DESC`
      );

      return result.items.map((item: any) => item.value as MapPoint);
    } catch (error) {
      console.error('Failed to get all points:', error);
      throw error;
    }
  }

  /**
   * Get points within geographic bounds (for map viewport)
   */
  async getPointsInBounds(bounds: GeoBounds): Promise<MapPoint[]> {
    this.checkInitialization();

    try {
      const result = await this.executeQuery(
        `SELECT * FROM ${this.collectionName} 
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

      return result.items.map((item: any) => item.value as MapPoint);
    } catch (error) {
      console.error('Failed to get points in bounds:', error);
      throw error;
    }
  }

  /**
   * Get points by category
   */
  async getPointsByCategory(category: string): Promise<MapPoint[]> {
    this.checkInitialization();

    if (!category) {
      return [];
    }

    try {
      const result = await this.executeQuery(
        `SELECT * FROM ${this.collectionName} 
         WHERE isDeleted != true AND category = :category 
         ORDER BY createdAt DESC`,
        { category }
      );

      return result.items.map((item: any) => item.value as MapPoint);
    } catch (error) {
      console.error('Failed to get points by category:', error);
      throw error;
    }
  }

  /**
   * Search points by title or description
   */
  async searchPoints(searchTerm: string): Promise<MapPoint[]> {
    this.checkInitialization();

    if (!searchTerm || searchTerm.trim().length === 0) {
      return [];
    }

    const sanitizedTerm = DittoErrorHandler.sanitizeString(searchTerm.toLowerCase());

    try {
      const result = await this.executeQuery(
        `SELECT * FROM ${this.collectionName} 
         WHERE isDeleted != true 
         AND (LOWER(title) LIKE :searchTerm OR LOWER(description) LIKE :searchTerm)
         ORDER BY createdAt DESC`,
        { searchTerm: `%${sanitizedTerm}%` }
      );

      return result.items.map((item: any) => item.value as MapPoint);
    } catch (error) {
      console.error('Failed to search points:', error);
      throw error;
    }
  }

  /**
   * Get count of active points
   */
  async getPointCount(): Promise<number> {
    this.checkInitialization();

    try {
      const result = await this.executeQuery(
        `SELECT COUNT(*) as count FROM ${this.collectionName} WHERE isDeleted != true`
      );

      return result.items[0]?.value?.count || 0;
    } catch (error) {
      console.error('Failed to get point count:', error);
      return 0;
    }
  }

  /**
   * Register observer for real-time updates within bounds
   */
  observePointsInBounds(bounds: GeoBounds, callback: (points: MapPoint[]) => void): () => void {
    this.checkInitialization();

    const query = `SELECT * FROM ${this.collectionName} 
                   WHERE isDeleted != true 
                   AND latitude BETWEEN :minLat AND :maxLat 
                   AND longitude BETWEEN :minLng AND :maxLng 
                   ORDER BY createdAt DESC`;

    const args = {
      minLat: bounds.southWest.latitude,
      maxLat: bounds.northEast.latitude,
      minLng: bounds.southWest.longitude,
      maxLng: bounds.northEast.longitude,
    };

    return this.registerObserver(query, (result) => {
      const points = result.items.map((item: any) => item.value as MapPoint);
      callback(points);
    }, args);
  }

  /**
   * Register observer for all points (no bounds filtering)
   */
  observeAllPoints(callback: (points: MapPoint[]) => void): () => void {
    this.checkInitialization();

    const query = `SELECT * FROM ${this.collectionName} WHERE isDeleted != true ORDER BY createdAt DESC`;

    return this.registerObserver(query, (result) => {
      const points = result.items.map((item: any) => item.value as MapPoint);
      callback(points);
    });
  }
}
