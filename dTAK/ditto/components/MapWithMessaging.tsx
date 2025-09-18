import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { Camera, MapView, RasterLayer, RasterSource, PointAnnotation } from '@maplibre/maplibre-react-native';
import { useMessaging } from '../hooks/useMessaging';
import { usePeerDiscovery } from '../hooks/usePeerDiscovery';
import { MarkerMessage, LocationMessage } from '../types/DittoTypes';
import { PeerStatus } from './PeerStatus';

interface MapWithMessagingProps {
  style?: any;
  initialCenter?: [number, number];
  initialZoom?: number;
  showPeerPanel?: boolean;
}

export const MapWithMessaging: React.FC<MapWithMessagingProps> = ({
  style,
  initialCenter = [-95.7129, 37.0902],
  initialZoom = 5,
  showPeerPanel = true,
}) => {
  const { 
    messages, 
    sendMarker, 
    sendLocationUpdate, 
    initialize: initializeMessaging 
  } = useMessaging();
  
  const { 
    peers, 
    connectedPeerCount, 
    updateLocation,
    startDiscovery,
    stopDiscovery
  } = usePeerDiscovery();

  const [showPeers, setShowPeers] = useState(false);

  useEffect(() => {
    // Initialize messaging first (requires Ditto ready), then start discovery
    // We chain these to reduce race conditions on Ditto initialization.
    initializeMessaging()
      .then(() => startDiscovery())
      .catch((err) => {
        console.warn('MapWithMessaging: initialization failed or Ditto not ready yet for discovery:', err);
      });
    return () => {
      stopDiscovery();
    };
  }, [initializeMessaging, startDiscovery, stopDiscovery]);

  // Filter messages for map display
  const markerMessages = messages.filter(
    (msg): msg is MarkerMessage => msg.type === 'marker'
  );

  const locationMessages = messages.filter(
    (msg): msg is LocationMessage => msg.type === 'location'
  );

  // Get latest location for each peer
  const peerLocations = React.useMemo(() => {
    const locationMap = new Map<string, LocationMessage>();
    
    locationMessages.forEach(msg => {
      const existing = locationMap.get(msg.senderId);
      if (!existing || msg.timestamp > existing.timestamp) {
        locationMap.set(msg.senderId, msg);
      }
    });
    
    return Array.from(locationMap.values());
  }, [locationMessages]);

  const handleMapPress = async (event: any) => {
    const { geometry } = event;
    if (!geometry?.coordinates) return;

    const [longitude, latitude] = geometry.coordinates;

    Alert.alert(
      'Add Marker',
      'What would you like to add at this location?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Location Pin',
          onPress: () => handleAddMarker(latitude, longitude, 'Location Pin', 'pin'),
        },
        {
          text: 'Waypoint',
          onPress: () => handleAddMarker(latitude, longitude, 'Waypoint', 'waypoint'),
        },
        {
          text: 'Alert',
          onPress: () => handleAddMarker(latitude, longitude, 'Alert', 'alert'),
        },
      ]
    );
  };

  const handleAddMarker = async (
    latitude: number, 
    longitude: number, 
    title: string, 
    type: string
  ) => {
    try {
      await sendMarker({
        latitude,
        longitude,
        title,
        description: `Added by user at ${new Date().toLocaleTimeString()}`,
        iconType: type,
        color: getMarkerColor(type),
        category: 'user_created',
      });

      // Also update our location
      await updateLocation({ latitude, longitude, accuracy: 10 });
      await sendLocationUpdate({ 
        latitude, 
        longitude, 
        accuracy: 10,
        timestamp: new Date() 
      } as any);
    } catch (error) {
      Alert.alert('Error', 'Failed to add marker');
      console.error('Failed to add marker:', error);
    }
  };

  const getMarkerColor = (type: string): string => {
    switch (type) {
      case 'pin': return '#007AFF';
      case 'waypoint': return '#34C759';
      case 'alert': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getMarkerIcon = (iconType: string): string => {
    switch (iconType) {
      case 'pin': return '📍';
      case 'waypoint': return '🎯';
      case 'alert': return '⚠️';
      default: return '📌';
    }
  };

  const getPeerIcon = (deviceType: string): string => {
    switch (deviceType.toLowerCase()) {
      case 'ios': return '📱';
      case 'android': return '🤖';
      default: return '💻';
    }
  };

  return (
    <View style={[styles.container, style]}>
      <MapView 
        style={styles.map} 
        onPress={handleMapPress}
        compassEnabled={true}
        logoEnabled={false}
      >
        <Camera 
          zoomLevel={initialZoom} 
          centerCoordinate={initialCenter} 
        />
        
        {/* Satellite layer */}
        <RasterSource
          id="satelliteSource"
          tileUrlTemplates={[
            "https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}.jpg?api_key=c177fb0b-10fa-4ba1-87ba-3a8446a7887d",
          ]}
          tileSize={256}
        >
          <RasterLayer
            id="satelliteLayer"
            sourceID="satelliteSource"
            style={{ rasterOpacity: 1 }}
          />
        </RasterSource>

        {/* Render markers from messages */}
        {markerMessages.map((message) => (
          <PointAnnotation
            key={message.id}
            id={message.id}
            coordinate={[message.marker.longitude, message.marker.latitude]}
            title={message.marker.title}
            snippet={`${message.senderName} • ${message.timestamp.toLocaleTimeString()}`}
          >
            <View style={[styles.markerContainer, { backgroundColor: message.marker.color }]}>
              <Text style={styles.markerIcon}>
                {getMarkerIcon(message.marker.iconType)}
              </Text>
            </View>
          </PointAnnotation>
        ))}

        {/* Render peer locations */}
        {peerLocations.map((locationMsg) => {
          const peer = peers.find(p => p.id === locationMsg.senderId);
          if (!peer) return null;

          return (
            <PointAnnotation
              key={`peer-${locationMsg.senderId}`}
              id={`peer-${locationMsg.senderId}`}
              coordinate={[locationMsg.location.longitude, locationMsg.location.latitude]}
              title={peer.displayName}
              snippet={`Last seen: ${locationMsg.timestamp.toLocaleTimeString()}`}
            >
              <View style={[
                styles.peerMarker, 
                { backgroundColor: peer.isConnected ? '#34C759' : '#8E8E93' }
              ]}>
                <Text style={styles.peerIcon}>
                  {getPeerIcon(peer.deviceType)}
                </Text>
              </View>
            </PointAnnotation>
          );
        })}
      </MapView>

      {/* Peer status overlay */}
      {showPeerPanel && (
        <View style={styles.peerPanel}>
          <TouchableOpacity 
            style={styles.peerToggle}
            onPress={() => setShowPeers(!showPeers)}
          >
            <Text style={styles.peerToggleText}>
              📡 {connectedPeerCount} peers {showPeers ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>
          
          {showPeers && (
            <View style={styles.peerList}>
              <PeerStatus 
                showHeader={false}
                maxHeight={200}
              />
            </View>
          )}
        </View>
      )}

      {/* Map controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => Alert.alert('Info', 'Tap on the map to add markers. Markers are shared with all connected peers in real-time.')}
        >
          <Text style={styles.controlIcon}>ℹ️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerIcon: {
    fontSize: 16,
  },
  peerMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  peerIcon: {
    fontSize: 14,
  },
  peerPanel: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  peerToggle: {
    padding: 12,
    alignItems: 'center',
  },
  peerToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  peerList: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  mapControls: {
    position: 'absolute',
    bottom: 50,
    right: 16,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 12,
  },
  controlIcon: {
    fontSize: 20,
  },
});
