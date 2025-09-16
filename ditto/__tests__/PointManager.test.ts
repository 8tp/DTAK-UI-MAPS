/**
 * Unit tests for PointManager
 * Tests CRUD operations and error handling
 */

import { PointManager } from '../src/managers/PointManager';
import { DittoConfig } from '../src/config/DittoConfig';
import { NewMapPoint } from '../src/types/MapPoint';

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
    presence: {
      observe: jest.fn(),
    },
    updateTransportConfig: jest.fn(),
    startSync: jest.fn(),
  })),
}));

// Mock DittoConfig
jest.mock('../src/config/DittoConfig');

// Don't mock the ErrorHandler - we want validation to work
// jest.mock('../src/utils/ErrorHandler');

describe('PointManager', () => {
  let pointManager: PointManager;
  let mockDitto: any;

  beforeEach(async () => {
    // Setup mock Ditto instance
    mockDitto = {
      store: {
        execute: jest.fn(),
        registerObserver: jest.fn(),
      },
      sync: {
        registerSubscription: jest.fn(),
      },
    };

    // Mock DittoConfig methods
    (DittoConfig.getInstanceOrThrow as jest.Mock).mockReturnValue(mockDitto);
    (DittoConfig.getInstance as jest.Mock).mockReturnValue(mockDitto);

    pointManager = new PointManager();
    await pointManager.initialize();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPoint', () => {
    test('should create point successfully with valid data', async () => {
      const pointData: NewMapPoint = {
        latitude: 40.7128,
        longitude: -74.0060,
        title: 'Test Point',
        description: 'Test description',
        category: 'test',
        color: '#FF0000',
      };

      mockDitto.store.execute.mockResolvedValue({ items: [] });

      const result = await pointManager.createPoint(pointData);

      expect(result.title).toBe('Test Point');
      expect(result.latitude).toBe(40.7128);
      expect(result.longitude).toBe(-74.0060);
      expect(result.isDeleted).toBe(false);
      expect(result._id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();

      expect(mockDitto.store.execute).toHaveBeenCalledWith(
        'INSERT INTO map_points DOCUMENTS (:point)',
        expect.objectContaining({
          point: expect.objectContaining({
            title: 'Test Point',
            latitude: 40.7128,
            longitude: -74.0060,
          })
        })
      );
    });

    // Validation tests are covered in validation.test.ts
    // The PointManager integration tests focus on successful operations
  });

  describe('getPoint', () => {
    test('should return point when found', async () => {
      const mockPoint = {
        _id: 'test-id',
        title: 'Test Point',
        latitude: 40.7128,
        longitude: -74.0060,
        isDeleted: false,
      };

      mockDitto.store.execute.mockResolvedValue({
        items: [{ value: mockPoint }]
      });

      const result = await pointManager.getPoint('test-id');

      expect(result).toEqual(mockPoint);
      expect(mockDitto.store.execute).toHaveBeenCalledWith(
        'SELECT * FROM map_points WHERE _id = :id AND isDeleted != true',
        { id: 'test-id' }
      );
    });

    test('should return null when point not found', async () => {
      mockDitto.store.execute.mockResolvedValue({ items: [] });

      const result = await pointManager.getPoint('non-existent-id');

      expect(result).toBeNull();
    });

    test('should return null for empty ID', async () => {
      const result = await pointManager.getPoint('');

      expect(result).toBeNull();
      expect(mockDitto.store.execute).not.toHaveBeenCalled();
    });
  });

  describe('updatePoint', () => {
    test('should update point successfully', async () => {
      const updatedPoint = {
        _id: 'test-id',
        title: 'Updated Title',
        latitude: 40.7128,
        longitude: -74.0060,
        isDeleted: false,
      };

      mockDitto.store.execute
        .mockResolvedValueOnce({ items: [] }) // Update query
        .mockResolvedValueOnce({ items: [{ value: updatedPoint }] }); // Get updated point

      const result = await pointManager.updatePoint('test-id', { title: 'Updated Title' });

      expect(result).toEqual(updatedPoint);
      expect(mockDitto.store.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE map_points SET'),
        expect.objectContaining({
          title: 'Updated Title',
          id: 'test-id'
        })
      );
    });

    // ID validation test is covered in validation.test.ts
  });

  describe('deletePoint', () => {
    test('should soft delete point successfully', async () => {
      mockDitto.store.execute.mockResolvedValue({ items: [] });

      const result = await pointManager.deletePoint('test-id');

      expect(result).toBe(true);
      expect(mockDitto.store.execute).toHaveBeenCalledWith(
        'UPDATE map_points SET isDeleted = true, updatedAt = :updatedAt WHERE _id = :id',
        expect.objectContaining({
          id: 'test-id',
          updatedAt: expect.any(String)
        })
      );
    });

    test('should return false for empty ID', async () => {
      const result = await pointManager.deletePoint('');

      expect(result).toBe(false);
      expect(mockDitto.store.execute).not.toHaveBeenCalled();
    });
  });

  describe('getPointsInBounds', () => {
    test('should return points within bounds', async () => {
      const mockPoints = [
        { _id: '1', title: 'Point 1', latitude: 40.7128, longitude: -74.0060 },
        { _id: '2', title: 'Point 2', latitude: 40.7500, longitude: -73.9800 },
      ];

      mockDitto.store.execute.mockResolvedValue({
        items: mockPoints.map(point => ({ value: point }))
      });

      const bounds = {
        northEast: { latitude: 40.8, longitude: -73.9 },
        southWest: { latitude: 40.7, longitude: -74.1 }
      };

      const result = await pointManager.getPointsInBounds(bounds);

      expect(result).toEqual(mockPoints);
      expect(mockDitto.store.execute).toHaveBeenCalledWith(
        expect.stringContaining('latitude BETWEEN :minLat AND :maxLat'),
        {
          minLat: 40.7,
          maxLat: 40.8,
          minLng: -74.1,
          maxLng: -73.9
        }
      );
    });
  });

  describe('searchPoints', () => {
    test('should return points matching search term', async () => {
      const mockPoints = [
        { _id: '1', title: 'Central Park', description: 'Famous park' },
      ];

      mockDitto.store.execute.mockResolvedValue({
        items: mockPoints.map(point => ({ value: point }))
      });

      const result = await pointManager.searchPoints('park');

      expect(result).toEqual(mockPoints);
      expect(mockDitto.store.execute).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(title) LIKE :searchTerm'),
        { searchTerm: '%park%' }
      );
    });

    test('should return empty array for empty search term', async () => {
      const result = await pointManager.searchPoints('');

      expect(result).toEqual([]);
      expect(mockDitto.store.execute).not.toHaveBeenCalled();
    });
  });

  describe('observePointsInBounds', () => {
    test('should register observer for bounded points', () => {
      const mockCallback = jest.fn();
      const mockObserver = { cancel: jest.fn() };
      
      mockDitto.store.registerObserver.mockReturnValue(mockObserver);

      const bounds = {
        northEast: { latitude: 40.8, longitude: -73.9 },
        southWest: { latitude: 40.7, longitude: -74.1 }
      };

      const unsubscribe = pointManager.observePointsInBounds(bounds, mockCallback);

      expect(mockDitto.store.registerObserver).toHaveBeenCalledWith(
        expect.stringContaining('latitude BETWEEN :minLat AND :maxLat'),
        expect.any(Function),
        {
          minLat: 40.7,
          maxLat: 40.8,
          minLng: -74.1,
          maxLng: -73.9
        }
      );

      expect(typeof unsubscribe).toBe('function');
      
      // Test that calling unsubscribe calls the observer's cancel method
      unsubscribe();
      expect(mockObserver.cancel).toHaveBeenCalled();
    });
  });
});
