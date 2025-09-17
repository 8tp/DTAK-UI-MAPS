import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { usePeerDiscovery } from '../hooks/usePeerDiscovery';
import { Peer } from '../types/DittoTypes';

interface PeerItemProps {
  peer: Peer;
  onPeerPress?: (peer: Peer) => void;
}

const PeerItem: React.FC<PeerItemProps> = ({ peer, onPeerPress }) => {
  const getConnectionIcon = () => {
    if (!peer.isConnected) return '🔴';
    switch (peer.connectionType) {
      case 'bluetooth': return '🔵';
      case 'wifi': return '🟢';
      case 'cloud': return '🟡';
      default: return '⚪';
    }
  };

  const getDeviceIcon = () => {
    switch (peer.deviceType.toLowerCase()) {
      case 'ios': return '📱';
      case 'android': return '🤖';
      default: return '💻';
    }
  };

  return (
    <TouchableOpacity 
      style={styles.peerItem} 
      onPress={() => onPeerPress?.(peer)}
      activeOpacity={0.7}
    >
      <Text style={styles.connectionIcon}>{getConnectionIcon()}</Text>
      <Text style={styles.deviceIcon}>{getDeviceIcon()}</Text>
      <View style={styles.peerInfo}>
        <Text style={styles.peerName}>{peer.displayName}</Text>
        <Text style={styles.peerDetails}>
          {peer.deviceType} • {peer.connectionType}
        </Text>
        <Text style={styles.lastSeen}>
          Last seen: {peer.lastSeen.toLocaleTimeString()}
        </Text>
        {peer.capabilities.length > 0 && (
          <Text style={styles.capabilities}>
            Capabilities: {peer.capabilities.join(', ')}
          </Text>
        )}
      </View>
      {peer.signalStrength && (
        <View style={styles.signalStrength}>
          <Text style={styles.signalText}>{peer.signalStrength}%</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

interface PeerStatusProps {
  onPeerPress?: (peer: Peer) => void;
  showHeader?: boolean;
  maxHeight?: number;
}

export const PeerStatus: React.FC<PeerStatusProps> = ({ 
  onPeerPress, 
  showHeader = true,
  maxHeight 
}) => {
  const { 
    peers, 
    connectedPeerCount, 
    isDiscovering, 
    error,
    startDiscovery,
    stopDiscovery 
  } = usePeerDiscovery();

  React.useEffect(() => {
    startDiscovery();
    return () => {
      stopDiscovery();
    };
  }, [startDiscovery, stopDiscovery]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={startDiscovery}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, maxHeight ? { maxHeight } : null]}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.title}>Mesh Network</Text>
          <View style={styles.statusRow}>
            <Text style={styles.status}>
              {isDiscovering ? '🔍 Discovering' : '⏸️ Stopped'}
            </Text>
            <Text style={styles.peerCount}>
              {connectedPeerCount} connected • {peers.length} total
            </Text>
          </View>
        </View>
      )}
      
      <FlatList
        data={peers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PeerItem peer={item} onPeerPress={onPeerPress} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📡</Text>
            <Text style={styles.emptyText}>
              {isDiscovering ? 'Searching for peers...' : 'No peers found'}
            </Text>
            <Text style={styles.emptySubtext}>
              Make sure other devices are nearby and have the app open
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  status: {
    fontSize: 14,
    color: '#666',
  },
  peerCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  peerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  connectionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  deviceIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  peerInfo: {
    flex: 1,
  },
  peerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  peerDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  lastSeen: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  capabilities: {
    fontSize: 11,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  signalStrength: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  signalText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  error: {
    color: '#FF3B30',
    textAlign: 'center',
    margin: 16,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
