import { Ditto } from '@dittolive/ditto';

class DittoService {
  constructor() {
    this.ditto = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Initialize Ditto with offline license (for development)
      this.ditto = new Ditto({
        type: 'offlinePlayground',
        appID: 'dtak-mobile-app',
        persistenceDirectory: 'dtak-data'
      });

      await this.ditto.startSync();
      this.isInitialized = true;
      
      console.log('Ditto initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Ditto:', error);
      // Fallback to local storage only
      this.isInitialized = false;
      return false;
    }
  }

  async saveMapPoint(point) {
    if (!this.isInitialized) {
      throw new Error('Ditto not initialized');
    }

    try {
      const collection = this.ditto.store.collection('mapPoints');
      await collection.upsert(point);
      return point;
    } catch (error) {
      console.error('Error saving point to Ditto:', error);
      throw error;
    }
  }

  async getMapPoints() {
    if (!this.isInitialized) {
      return [];
    }

    try {
      const collection = this.ditto.store.collection('mapPoints');
      const documents = await collection.findAll().exec();
      return documents.map(doc => doc.value);
    } catch (error) {
      console.error('Error getting points from Ditto:', error);
      return [];
    }
  }

  async updateMapPoint(pointId, updatedData) {
    if (!this.isInitialized) {
      throw new Error('Ditto not initialized');
    }

    try {
      const collection = this.ditto.store.collection('mapPoints');
      await collection.findByID(pointId).update(updatedData);
      return updatedData;
    } catch (error) {
      console.error('Error updating point in Ditto:', error);
      throw error;
    }
  }

  async deleteMapPoint(pointId) {
    if (!this.isInitialized) {
      throw new Error('Ditto not initialized');
    }

    try {
      const collection = this.ditto.store.collection('mapPoints');
      await collection.findByID(pointId).remove();
      return true;
    } catch (error) {
      console.error('Error deleting point from Ditto:', error);
      throw error;
    }
  }

  // Subscribe to real-time changes
  subscribeToMapPoints(callback) {
    if (!this.isInitialized) {
      return null;
    }

    try {
      const collection = this.ditto.store.collection('mapPoints');
      return collection.findAll().subscribe((docs, event) => {
        const points = docs.map(doc => doc.value);
        callback(points, event);
      });
    } catch (error) {
      console.error('Error subscribing to map points:', error);
      return null;
    }
  }

  async getSyncStatus() {
    if (!this.isInitialized) {
      return {
        isOnline: false,
        lastSync: null,
        pendingChanges: 0
      };
    }

    try {
      // This would return actual sync status in a real implementation
      return {
        isOnline: true,
        lastSync: new Date().toISOString(),
        pendingChanges: 0
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        isOnline: false,
        lastSync: null,
        pendingChanges: 0
      };
    }
  }

  async stop() {
    if (this.ditto) {
      try {
        await this.ditto.stopSync();
        this.isInitialized = false;
      } catch (error) {
        console.error('Error stopping Ditto:', error);
      }
    }
  }
}

// Export singleton instance
export default new DittoService();
