import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';

// Import screens
import PersonaSelectionScreen from './src/screens/PersonaSelectionScreen';
import MapScreen from './src/screens/MapScreen';
import PointListScreen from './src/screens/PointListScreen';
import PointDetailScreen from './src/screens/PointDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main tab navigator for the core app functionality
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Map" 
        component={MapScreen}
        options={{
          tabBarLabel: 'Map',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🗺️</Text>,
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⚙️</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

// Main app navigator
export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="PersonaSelection">
        <Stack.Screen 
          name="PersonaSelection" 
          component={PersonaSelectionScreen}
          options={{ title: 'DTAK - Select Persona' }}
        />
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="PointList" 
          component={PointListScreen}
          options={{ title: 'Map Points' }}
        />
        <Stack.Screen 
          name="PointDetail" 
          component={PointDetailScreen}
          options={{ title: 'Point Details' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
