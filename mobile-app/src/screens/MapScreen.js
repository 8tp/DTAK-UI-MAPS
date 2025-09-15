import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import * as Location from 'expo-location';

const MapScreen = ({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [mapPoints, setMapPoints] = useState([]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  const addMapPoint = () => {
    if (location) {
      const newPoint = {
        id: Date.now().toString(),
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        title: `Point ${mapPoints.length + 1}`,
        description: 'New map point',
        timestamp: new Date().toISOString(),
      };
      setMapPoints([...mapPoints, newPoint]);
      Alert.alert('Success', 'Map point added successfully!');
    } else {
      Alert.alert('Error', 'Location not available');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <Text style={styles.mapPlaceholder}>
          Interactive Map View
          {location && (
            <Text style={styles.locationText}>
              {'\n'}Current Location: {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
            </Text>
          )}
        </Text>
        
        {mapPoints.map((point) => (
          <TouchableOpacity
            key={point.id}
            style={styles.mapPoint}
            onPress={() => navigation.navigate('PointDetail', { point })}
          >
            <Text style={styles.pointText}>{point.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.controls}>
        <TouchableOpacity style={styles.addButton} onPress={addMapPoint}>
          <Text style={styles.buttonText}>Drop Point</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.listButton} 
          onPress={() => navigation.navigate('PointList', { points: mapPoints })}
        >
          <Text style={styles.buttonText}>View Points ({mapPoints.length})</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#e8f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    borderRadius: 8,
    position: 'relative',
  },
  mapPlaceholder: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
  },
  mapPoint: {
    position: 'absolute',
    backgroundColor: '#ff6b6b',
    padding: 8,
    borderRadius: 20,
    top: Math.random() * 200 + 100,
    left: Math.random() * 200 + 50,
  },
  pointText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'white',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    flex: 0.4,
  },
  listButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    flex: 0.4,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default MapScreen;
