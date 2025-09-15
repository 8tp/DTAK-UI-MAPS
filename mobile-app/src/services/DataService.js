import AsyncStorage from '@react-native-async-storage/async-storage';

class DataService {
  constructor() {
    this.POINTS_KEY = 'map_points';
    this.SETTINGS_KEY = 'app_settings';
  }

  // Map Points Management
  async saveMapPoint(point) {
    try {
      const existingPoints = await this.getMapPoints();
      const updatedPoints = [...existingPoints, point];
      await AsyncStorage.setItem(this.POINTS_KEY, JSON.stringify(updatedPoints));
      return point;
    } catch (error) {
      console.error('Error saving map point:', error);
      throw error;
    }
  }

  async getMapPoints() {
    try {
      const pointsJson = await AsyncStorage.getItem(this.POINTS_KEY);
      return pointsJson ? JSON.parse(pointsJson) : [];
    } catch (error) {
      console.error('Error getting map points:', error);
      return [];
    }
  }

  async updateMapPoint(pointId, updatedPoint) {
    try {
      const points = await this.getMapPoints();
      const pointIndex = points.findIndex(p => p.id === pointId);
      
      if (pointIndex !== -1) {
        points[pointIndex] = { ...points[pointIndex], ...updatedPoint };
        await AsyncStorage.setItem(this.POINTS_KEY, JSON.stringify(points));
        return points[pointIndex];
      }
      
      throw new Error('Point not found');
    } catch (error) {
      console.error('Error updating map point:', error);
      throw error;
    }
  }

  async deleteMapPoint(pointId) {
    try {
      const points = await this.getMapPoints();
      const filteredPoints = points.filter(p => p.id !== pointId);
      await AsyncStorage.setItem(this.POINTS_KEY, JSON.stringify(filteredPoints));
      return true;
    } catch (error) {
      console.error('Error deleting map point:', error);
      throw error;
    }
  }

  // Settings Management
  async saveSettings(settings) {
    try {
      await AsyncStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
      return settings;
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  async getSettings() {
    try {
      const settingsJson = await AsyncStorage.getItem(this.SETTINGS_KEY);
      return settingsJson ? JSON.parse(settingsJson) : {};
    } catch (error) {
      console.error('Error getting settings:', error);
      return {};
    }
  }

  // Persona Management
  async savePersona(persona) {
    try {
      await AsyncStorage.setItem('selectedPersona', persona);
      return persona;
    } catch (error) {
      console.error('Error saving persona:', error);
      throw error;
    }
  }

  async getPersona() {
    try {
      return await AsyncStorage.getItem('selectedPersona');
    } catch (error) {
      console.error('Error getting persona:', error);
      return null;
    }
  }

  // Feature Toggles Management
  async saveFeatureToggles(features) {
    try {
      await AsyncStorage.setItem('featureToggles', JSON.stringify(features));
      return features;
    } catch (error) {
      console.error('Error saving feature toggles:', error);
      throw error;
    }
  }

  async getFeatureToggles() {
    try {
      const featuresJson = await AsyncStorage.getItem('featureToggles');
      return featuresJson ? JSON.parse(featuresJson) : {};
    } catch (error) {
      console.error('Error getting feature toggles:', error);
      return {};
    }
  }

  // Clear all data
  async clearAllData() {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  // Sync status (placeholder for Ditto integration)
  async getSyncStatus() {
    // This would integrate with Ditto for real sync status
    return {
      isOnline: true,
      lastSync: new Date().toISOString(),
      pendingChanges: 0
    };
  }
}

// Export singleton instance
export default new DataService();
