import { useState, useEffect, useCallback } from 'react';
import { PeerDiscoveryService } from '../services/PeerDiscoveryService';
import { Peer } from '../types/DittoTypes';

export const usePeerDiscovery = () => {
  const [peers, setPeers] = useState<Peer[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [peerDiscoveryService] = useState(() => new PeerDiscoveryService());

  const startDiscovery = useCallback(async () => {
    try {
      setError(null);
      setIsDiscovering(true);
      await peerDiscoveryService.startDiscovery();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start discovery');
      setIsDiscovering(false);
    }
  }, [peerDiscoveryService]);

  const stopDiscovery = useCallback(async () => {
    try {
      await peerDiscoveryService.stopDiscovery();
      setIsDiscovering(false);
      setPeers([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop discovery');
    }
  }, [peerDiscoveryService]);

  const updateLocation = useCallback(async (location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  }) => {
    try {
      await peerDiscoveryService.updateLocation(location);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update location');
    }
  }, [peerDiscoveryService]);

  const updateStatus = useCallback(async (status: 'available' | 'busy' | 'away') => {
    try {
      await peerDiscoveryService.updateStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  }, [peerDiscoveryService]);

  useEffect(() => {
    const handlePeerDiscovered = (peer: Peer) => {
      setPeers(current => [...current, peer]);
    };

    const handlePeerUpdated = (peer: Peer) => {
      setPeers(current => 
        current.map(p => p.id === peer.id ? peer : p)
      );
    };

    const handlePeerRemoved = (peer: Peer) => {
      setPeers(current => 
        current.filter(p => p.id !== peer.id)
      );
    };

    const handlePeerConnected = (peer: Peer) => {
      setPeers(current => 
        current.map(p => p.id === peer.id ? { ...p, isConnected: true } : p)
      );
    };

    const handlePeerDisconnected = (peer: Peer) => {
      setPeers(current => 
        current.map(p => p.id === peer.id ? { ...p, isConnected: false } : p)
      );
    };

    peerDiscoveryService.on('peerDiscovered', handlePeerDiscovered);
    peerDiscoveryService.on('peerUpdated', handlePeerUpdated);
    peerDiscoveryService.on('peerRemoved', handlePeerRemoved);
    peerDiscoveryService.on('peerConnected', handlePeerConnected);
    peerDiscoveryService.on('peerDisconnected', handlePeerDisconnected);

    return () => {
      peerDiscoveryService.removeAllListeners();
    };
  }, [peerDiscoveryService]);

  const connectedPeers = peers.filter(peer => peer.isConnected);
  const disconnectedPeers = peers.filter(peer => !peer.isConnected);

  return {
    peers,
    connectedPeers,
    disconnectedPeers,
    isDiscovering,
    error,
    startDiscovery,
    stopDiscovery,
    updateLocation,
    updateStatus,
    peerCount: peers.length,
    connectedPeerCount: connectedPeers.length,
    localPeerId: peerDiscoveryService.getLocalPeerId(),
    localPeerName: peerDiscoveryService.getLocalPeerName(),
  };
};
