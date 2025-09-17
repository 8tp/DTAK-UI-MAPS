import { useState, useEffect, useCallback } from 'react';
import { DittoService } from '../services/DittoService';
import { DittoConfig } from '../types/DittoTypes';

export const useDitto = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dittoService] = useState(() => DittoService.getInstance());

  const initialize = useCallback(async (config: DittoConfig) => {
    if (isInitialized || isInitializing) return;

    try {
      setError(null);
      setIsInitializing(true);
      await dittoService.initialize(config);
      setIsInitialized(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Ditto';
      setError(errorMessage);
      console.error('Ditto initialization failed:', err);
    } finally {
      setIsInitializing(false);
    }
  }, [dittoService, isInitialized, isInitializing]);

  const shutdown = useCallback(async () => {
    try {
      await dittoService.shutdown();
      setIsInitialized(false);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to shutdown Ditto';
      setError(errorMessage);
    }
  }, [dittoService]);

  useEffect(() => {
    const handleInitialized = () => {
      setIsInitialized(true);
      setIsInitializing(false);
    };

    const handleError = (error: Error) => {
      setError(error.message);
      setIsInitializing(false);
    };

    const handleShutdown = () => {
      setIsInitialized(false);
      setError(null);
    };

    dittoService.on('initialized', handleInitialized);
    dittoService.on('error', handleError);
    dittoService.on('shutdown', handleShutdown);

    return () => {
      dittoService.off('initialized', handleInitialized);
      dittoService.off('error', handleError);
      dittoService.off('shutdown', handleShutdown);
    };
  }, [dittoService]);

  return {
    isInitialized,
    isInitializing,
    error,
    initialize,
    shutdown,
    dittoService,
  };
};
