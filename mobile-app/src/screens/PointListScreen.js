import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

const PointListScreen = ({ route, navigation }) => {
  const { points = [] } = route.params || {};

  const renderPoint = ({ item }) => (
    <TouchableOpacity
      style={styles.pointItem}
      onPress={() => navigation.navigate('PointDetail', { point: item })}
    >
      <View style={styles.pointHeader}>
        <Text style={styles.pointTitle}>{item.title}</Text>
        <Text style={styles.pointTime}>
          {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </View>
      <Text style={styles.pointDescription}>{item.description}</Text>
      <Text style={styles.pointCoords}>
        {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Map Points ({points.length})</Text>
      </View>
      
      {points.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No points created yet</Text>
          <Text style={styles.emptySubtext}>Go back to the map and drop some points!</Text>
        </View>
      ) : (
        <FlatList
          data={points}
          renderItem={renderPoint}
          keyExtractor={(item) => item.id}
          style={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  list: {
    flex: 1,
  },
  pointItem: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pointHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pointTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  pointTime: {
    fontSize: 12,
    color: '#666',
  },
  pointDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  pointCoords: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default PointListScreen;
