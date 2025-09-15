import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FEATURE_TOGGLES = [
  { id: 'tactical-overlays', name: 'Tactical Overlays', description: 'Enable tactical map overlays' },
  { id: 'weather-layer', name: 'Weather Layer', description: 'Show weather information on map' },
  { id: 'traffic-data', name: 'Traffic Data', description: 'Display real-time traffic information' },
  { id: 'offline-sync', name: 'Offline Sync', description: 'Enable offline data synchronization' },
  { id: 'gps-precision', name: 'High-Precision GPS', description: 'Use enhanced GPS accuracy' },
  { id: 'night-mode', name: 'Night Mode', description: 'Dark theme for low-light conditions' },
];

const SettingsScreen = ({ navigation }) => {
  const [features, setFeatures] = useState({});
  const [selectedPersona, setSelectedPersona] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedFeatures = await AsyncStorage.getItem('featureToggles');
      const persona = await AsyncStorage.getItem('selectedPersona');
      
      if (savedFeatures) {
        setFeatures(JSON.parse(savedFeatures));
      }
      if (persona) {
        setSelectedPersona(persona);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const toggleFeature = async (featureId) => {
    const newFeatures = {
      ...features,
      [featureId]: !features[featureId]
    };
    
    try {
      await AsyncStorage.setItem('featureToggles', JSON.stringify(newFeatures));
      setFeatures(newFeatures);
    } catch (error) {
      console.error('Error saving feature toggle:', error);
      Alert.alert('Error', 'Failed to save setting');
    }
  };

  const changePersona = () => {
    navigation.navigate('PersonaSelection');
  };

  const clearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will remove all saved points and settings. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              setFeatures({});
              setSelectedPersona('');
              Alert.alert('Success', 'All data cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Persona</Text>
        <TouchableOpacity style={styles.personaButton} onPress={changePersona}>
          <Text style={styles.personaText}>
            {selectedPersona ? selectedPersona.replace('-', ' ').toUpperCase() : 'Not Selected'}
          </Text>
          <Text style={styles.changeText}>Tap to change</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Map Features & Plugins</Text>
        <Text style={styles.sectionDescription}>
          Enable or disable tactical plugins and map features
        </Text>
        
        {FEATURE_TOGGLES.map((feature) => (
          <View key={feature.id} style={styles.featureItem}>
            <View style={styles.featureInfo}>
              <Text style={styles.featureName}>{feature.name}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
            <Switch
              value={features[feature.id] || false}
              onValueChange={() => toggleFeature(feature.id)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={features[feature.id] ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        <TouchableOpacity style={styles.clearButton} onPress={clearData}>
          <Text style={styles.clearButtonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>
          DTAK Mobile Application MVP{'\n'}
          Offline-first mapping tool{'\n'}
          Built with React Native & Expo
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: 'white',
    margin: 10,
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  personaButton: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  personaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  changeText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  featureItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  featureInfo: {
    flex: 1,
    marginRight: 15,
  },
  featureName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  featureDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  clearButton: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default SettingsScreen;
