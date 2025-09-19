/**
 * TAK Context
 * 
 * React context for managing TAK server state, authentication,
 * and real-time updates across the application.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import TakServerClient, { 
  TakServerConfig, 
  AuthResponse, 
  ConnectedUser, 
  ChatMessage, 
  CoTMessage 
} from './TakServerClient';

interface TakContextState {
  // Client and config
  client: TakServerClient | null;
  config: TakServerConfig | null;
  
  // Authentication
  isAuthenticated: boolean;
  isLoading: boolean;
  currentUser: AuthResponse | null;
  error: string | null;
  
  // Data
  connectedUsers: ConnectedUser[];
  chatMessages: ChatMessage[];
  cotMessages: CoTMessage[];
  
  // Actions
  initializeClient: (config: TakServerConfig) => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sendChatMessage: (message: string) => Promise<void>;
  sendCoTMessage: (message: Omit<CoTMessage, 'timestamp'> & { timestamp?: string }) => Promise<void>;
  refreshConnectedUsers: () => Promise<void>;
  refreshChatMessages: () => Promise<void>;
  refreshCoTMessages: () => Promise<void>;
  clearError: () => void;
}

const TakContext = createContext<TakContextState | undefined>(undefined);

interface TakProviderProps {
  children: React.ReactNode;
  defaultConfig?: TakServerConfig;
}

// Default configuration - using network IP for mock server
const DEFAULT_CONFIG: TakServerConfig = { baseUrl: 'http://192.168.13.5:8080' };

export const TakProvider: React.FC<TakProviderProps> = ({ 
  children, 
  defaultConfig = DEFAULT_CONFIG
}) => {
  const [client, setClient] = useState<TakServerClient | null>(null);
  const [config, setConfig] = useState<TakServerConfig | null>(defaultConfig);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthResponse | null>(null);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [cotMessages, setCotMessages] = useState<CoTMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize client when config changes
  const initializeClient = useCallback((newConfig: TakServerConfig) => {
    console.log('Initializing TAK client with config:', newConfig);
    setConfig(newConfig);
    const newClient = new TakServerClient(newConfig);
    setClient(newClient);
    setError(null);
  }, []);

  // Initialize with default config on mount
  useEffect(() => {
    if (defaultConfig && !client) {
      initializeClient(defaultConfig);
    }
  }, [defaultConfig, client, initializeClient]);

  // Login function
  const login = useCallback(async (username: string, password: string) => {
    if (!client) {
      throw new Error('TAK client not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const authResponse = await client.login(username, password);
      setCurrentUser(authResponse);
      setIsAuthenticated(true);
      
      // Start data refresh after successful login
      refreshConnectedUsers();
      refreshChatMessages();
      refreshCoTMessages();
      
      console.log('TAK login successful:', authResponse.username);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      setIsAuthenticated(false);
      setCurrentUser(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  // Logout function
  const logout = useCallback(async () => {
    if (!client) return;

    try {
      await client.clearToken();
      setIsAuthenticated(false);
      setCurrentUser(null);
      setConnectedUsers([]);
      setChatMessages([]);
      setCotMessages([]);
      setError(null);
      console.log('TAK logout successful');
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, [client]);

  // Refresh connected users
  const refreshConnectedUsers = useCallback(async () => {
    if (!client || !isAuthenticated) return;

    try {
      const users = await client.getConnectedUsers();
      console.log('TAK connected users fetched:', users.length);
      setConnectedUsers(users);
    } catch (err) {
      console.error('Failed to refresh connected users:', err);
    }
  }, [client, isAuthenticated]);

  // Refresh chat messages
  const refreshChatMessages = useCallback(async () => {
    if (!client || !isAuthenticated) return;

    try {
      const messages = await client.getChatMessages();
      console.log('TAK chat messages fetched:', messages.length);
      setChatMessages(messages);
    } catch (err) {
      console.error('Failed to refresh chat messages:', err);
    }
  }, [client, isAuthenticated]);

  // Refresh CoT messages
  const refreshCoTMessages = useCallback(async () => {
    if (!client || !isAuthenticated) return;

    try {
      const messages = await client.getCoTMessages();
      console.log('TAK CoT messages fetched:', messages.length);
      setCotMessages(messages);
    } catch (err) {
      console.error('Failed to refresh CoT messages:', err);
    }
  }, [client, isAuthenticated]);

  // Send chat message
  const sendChatMessage = useCallback(async (message: string) => {
    if (!client || !isAuthenticated) {
      throw new Error('Not authenticated');
    }

    try {
      await client.sendChatMessage(message);
      // Refresh messages after sending
      await refreshChatMessages();
    } catch (err) {
      console.error('Failed to send chat message:', err);
      throw err;
    }
  }, [client, isAuthenticated, refreshChatMessages]);

  // Send CoT message
  const sendCoTMessage = useCallback(async (message: Omit<CoTMessage, 'timestamp'> & { timestamp?: string }) => {
    if (!client || !isAuthenticated) {
      throw new Error('Not authenticated');
    }

    try {
      await client.sendCoTMessage(message);
      // Refresh messages after sending
      await refreshCoTMessages();
    } catch (err) {
      console.error('Failed to send CoT message:', err);
      throw err;
    }
  }, [client, isAuthenticated, refreshCoTMessages]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-refresh data every 15 seconds when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      refreshConnectedUsers();
      refreshChatMessages();
      refreshCoTMessages();
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshConnectedUsers, refreshChatMessages, refreshCoTMessages]);

  const value: TakContextState = {
    client,
    config,
    isAuthenticated,
    isLoading,
    currentUser,
    error,
    connectedUsers,
    chatMessages,
    cotMessages,
    initializeClient,
    login,
    logout,
    sendChatMessage,
    sendCoTMessage,
    refreshConnectedUsers,
    refreshChatMessages,
    refreshCoTMessages,
    clearError,
  };

  return <TakContext.Provider value={value}>{children}</TakContext.Provider>;
};

export const useTak = (): TakContextState => {
  const context = useContext(TakContext);
  if (context === undefined) {
    throw new Error('useTak must be used within a TakProvider');
  }
  return context;
};

export default TakContext;
