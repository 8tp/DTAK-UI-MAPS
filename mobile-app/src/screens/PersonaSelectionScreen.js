import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PERSONAS = [
  { id: 'disaster-response', name: 'Disaster Response', icon: '🚨' },
  { id: 'first-responder', name: 'First Responder', icon: '🚑' },
  { id: 'tactical-military', name: 'Tactical/Military Operator', icon: '🎖️' },
  { id: 'firefighter', name: 'Firefighter', icon: '🚒' },
  { id: 'police', name: 'Police', icon: '👮' },
  { id: 'civilian', name: 'Civilian', icon: '👤' },
  { id: 'volunteer', name: 'Volunteer', icon: '🤝' },
];

const PersonaSelectionScreen = ({ navigation }) => {
  const [selectedPersona, setSelectedPersona] = useState(null);

  useEffect(() => {
    loadSelectedPersona();
  }, []);

  const loadSelectedPersona = async () => {
    try {
      const persona = await AsyncStorage.getItem('selectedPersona');
      if (persona) {
        setSelectedPersona(persona);
      }
    } catch (error) {
      console.error('Error loading persona:', error);
    }
  };

  const selectPersona = async (personaId) => {
    try {
      await AsyncStorage.setItem('selectedPersona', personaId);
      setSelectedPersona(personaId);
      Alert.alert('Success', 'Persona selected successfully!');
    } catch (error) {
      console.error('Error saving persona:', error);
      Alert.alert('Error', 'Failed to save persona selection');
    }
  };

  const continueToApp = () => {
    if (selectedPersona) {
      navigation.navigate('MainTabs');
    } else {
      Alert.alert('Please select a persona', 'You must select a persona to continue');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Your Role</Text>
        <Text style={styles.subtitle}>Choose the persona that best describes your operational role</Text>
      </View>

      <View style={styles.personaGrid}>
        {PERSONAS.map((persona) => (
          <TouchableOpacity
            key={persona.id}
            style={[
              styles.personaCard,
              selectedPersona === persona.id && styles.selectedCard
            ]}
            onPress={() => selectPersona(persona.id)}
          >
            <Text style={styles.personaIcon}>{persona.icon}</Text>
            <Text style={styles.personaName}>{persona.name}</Text>
            {selectedPersona === persona.id && (
              <Text style={styles.selectedIndicator}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {selectedPersona && (
        <TouchableOpacity style={styles.continueButton} onPress={continueToApp}>
          <Text style={styles.continueButtonText}>Continue to App</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  personaGrid: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  personaCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    borderColor: '#4CAF50',
    borderWidth: 2,
    backgroundColor: '#f8fff8',
  },
  personaIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  personaName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PersonaSelectionScreen;
