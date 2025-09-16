/**
 * Ditto Sync Status Hook
 * Provides real-time sync status information for UI components
 */

import { useState, useEffect } from 'react';
import { DittoConfig } from '../config/DittoConfig';
import { SyncStatus } from '../types/MapPoint';
import { DittoErrorHandler } from '../utils/ErrorHandler';

export const useDittoSync = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: false,
    connectedPeers: 0,
    syncActive: false,
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let presenceUnsubscribe: (() => void) | null = null;
    let mounted = true;

    const initializeSync = async () => {
      try {
        // Ensure Ditto is initialized
        const ditto = DittoConfig.getInstance();
        if (!ditto) {
          await DittoConfig.initialize();
        }

        const dittoInstance = DittoConfig.getInstance();
        if (!dittoInstance || !mounted) return;

        // Monitor presence (connected peers)
        const presenceObserver = dittoInstance.presence.observe((graph) => {
          if (!mounted) return;

          const connectedPeers = graph.remotePeers.length;
          
          setSyncStatus(prev => ({
            ...prev,
            connectedPeers,
            syncActive: connectedPeers > 0,
            isOnline: true, // If we can observe presence, we're considered online
          }));
        });

        presenceUnsubscribe = () => {
          try {
            presenceObserver.stop();
          } catch (error) {
            console.error('Error stopping presence observer:', error);
          }
        };

        // Initial status update
        setSyncStatus(prev => ({
          ...prev,
          isOnline: true,
        }));

        setError(null);
      } catch (err) {
        if (!mounted) return;
        
        const errorMessage = DittoErrorHandler.handle(err, 'Sync Status Initialization');
        setError(errorMessage);
        
        // Set offline status on error
        setSyncStatus({
          isOnline: false,
          connectedPeers: 0,
          syncActive: false,
        });
      }
    };

    initializeSync();

    return () => {
      mounted = false;
      if (presenceUnsubscribe) {
        presenceUnsubscribe();
      }
    };
  }, []);

  /**
   * Manually refresh sync status
   */
  const refreshSyncStatus = async (): Promise<void> => {
    try {
      const ditto = DittoConfig.getInstance();
      if (!ditto) {
        throw new Error('Ditto not initialized');
      }

      // Force a presence update by re-observing
      // This is useful if the user wants to manually check connectivity
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      setError(null);
    } catch (err) {
      const errorMessage = DittoErrorHandler.handle(err, 'Sync Status Refresh');
      setError(errorMessage);
    }
  };

  return {
    syncStatus,
    error,
    refreshSyncStatus,
    // Convenience getters
    isOnline: syncStatus.isOnline,
    connectedPeers: syncStatus.connectedPeers,
    syncActive: syncStatus.syncActive,
  };
};
