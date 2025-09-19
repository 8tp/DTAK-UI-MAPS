/**
 * TAK Server Client
 * 
 * Handles communication with the Mock TAK Server for authentication,
 * user management, chat, and CoT (Cursor on Target) messages.
 */

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  username: string;
  callsign: string;
  role: string;
  team: string;
}

export interface ConnectedUser {
  uid: string;
  username: string;
  callsign: string;
  team: string;
  role: string;
  deviceId: string;
  lastSeen: string;
  isCurrentUser: boolean;
}

export interface ChatMessage {
  id: number;
  username: string;
  message: string;
  timestamp: string;
  deviceId: string;
}

export interface CoTMessage {
  uid: string;
  type: string;
  lat: number;
  lon: number;
  callsign: string;
  remarks?: string;
  timestamp: string;
}

export interface TakServerConfig {
  baseUrl: string;
}

class TakServerClient {
  private config: TakServerConfig;
  private token: string | null = null;

  constructor(config: TakServerConfig) {
    this.config = config;
  }

  /**
   * Update server configuration
   */
  updateConfig(config: TakServerConfig) {
    this.config = config;
  }

  /**
   * Get headers for authenticated requests
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Device-ID': `dTAK-UI-MAPS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Store authentication token
   */
  private async storeToken(token: string): Promise<void> {
    this.token = token;
    // In a real app, you'd store this securely
    console.log('TAK Server token stored');
  }

  /**
   * Clear authentication token
   */
  async clearToken(): Promise<void> {
    this.token = null;
    console.log('TAK Server token cleared');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.token !== null;
  }

  /**
   * Authenticate with TAK server using OAuth
   */
  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const primaryUrl = `${this.config.baseUrl}/oauth/token`;
      const response = await fetch(primaryUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          username,
          password,
          grant_type: 'password'
        })
      });

      if (!response.ok) {
        console.warn('Primary login endpoint failed', { url: primaryUrl, status: response.status });
        // If 404, try alternate Marti OAuth endpoint
        if (response.status === 404) {
          const fallbackUrl = `${this.config.baseUrl}/Marti/oauth/token`;
          const fbRes = await fetch(fallbackUrl, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ username, password })
          });

          if (!fbRes.ok) {
            const fbErr = await fbRes.json().catch(() => ({} as any));
            throw new Error(fbErr.error_description || `Login failed (fallback): ${fbRes.status}`);
          }

          const fbAuth = await fbRes.json();
          // Normalize fallback response to AuthResponse shape
          const normalized: AuthResponse = {
            access_token: fbAuth.access_token,
            token_type: fbAuth.token_type || 'Bearer',
            expires_in: fbAuth.expires_in || 3600,
            scope: fbAuth.scope || 'read write',
            username,
            callsign: fbAuth.callsign || username,
            role: fbAuth.role || 'Team Member',
            team: fbAuth.team || 'Blue',
          };
          await this.storeToken(normalized.access_token);
          console.log('TAK Server login successful (fallback):', { username: normalized.username, callsign: normalized.callsign });
          return normalized;
        }

        // Non-404 errors from primary endpoint
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error_description || `Login failed: ${response.status}`);
      }

      const authData: AuthResponse = await response.json();
      await this.storeToken(authData.access_token);
      
      console.log('TAK Server login successful:', {
        username: authData.username,
        callsign: authData.callsign,
        role: authData.role,
        team: authData.team
      });

      return authData;
    } catch (error) {
      console.error('TAK Server login error:', error);
      throw error;
    }
  }

  /**
   * Get connected users
   */
  async getConnectedUsers(): Promise<ConnectedUser[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/Marti/api/contacts/all`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get connected users: ${response.status}`);
      }

      const data = await response.json();
      return data.data || data || [];
    } catch (error) {
      console.error('Failed to get connected users:', error);
      return [];
    }
  }

  /**
   * Send chat message
   */
  async sendChatMessage(message: string): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/Marti/api/chat/send`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        throw new Error(`Failed to send chat message: ${response.status}`);
      }

      console.log('Chat message sent successfully');
    } catch (error) {
      console.error('Failed to send chat message:', error);
      throw error;
    }
  }

  /**
   * Get chat messages
   */
  async getChatMessages(): Promise<ChatMessage[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/Marti/api/chat/messages`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get chat messages: ${response.status}`);
      }

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Failed to get chat messages:', error);
      return [];
    }
  }

  /**
   * Send CoT message
   */
  async sendCoTMessage(cotMessage: Omit<CoTMessage, 'timestamp'> & { timestamp?: string }): Promise<void> {
    try {
      const message = {
        ...cotMessage,
        timestamp: cotMessage.timestamp || new Date().toISOString()
      };

      const response = await fetch(`${this.config.baseUrl}/Marti/api/cot`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        throw new Error(`Failed to send CoT message: ${response.status}`);
      }

      console.log('CoT message sent successfully');
    } catch (error) {
      console.error('Failed to send CoT message:', error);
      throw error;
    }
  }

  /**
   * Get CoT messages
   */
  async getCoTMessages(): Promise<CoTMessage[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/Marti/api/cot/all`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get CoT messages: ${response.status}`);
      }

      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Failed to get CoT messages:', error);
      return [];
    }
  }
}

export default TakServerClient;
