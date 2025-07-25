// hooks/useAuth.ts
import { useState, useCallback } from 'react';

export type AuthStatus = 'none' | 'authenticating' | 'authenticated' | 'error' | 'failed';

export interface RHCredentials {
  username: string;
  password: string;
}

export const useAuth = () => {
  // State extracted from App.tsx
  const [rhAuthStatus, setRHAuthStatus] = useState<AuthStatus>('none');
  const [rhUsername, setRHUsername] = useState<string>('');
  const [rhCredentials, setRHCredentials] = useState<RHCredentials>({
    username: '',
    password: ''
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // API call function (will be replaced with shared service later)
  const apiCall = async (url: string, options?: RequestInit): Promise<any> => {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error(`API call failed for ${url}:`, error);
      throw error;
    }
  };

  const checkRHAuthStatus = useCallback(async () => {
    try {
      const response = await apiCall('/api/auth/redhat-status');
      if (response.authenticated) {
        setRHAuthStatus('authenticated');
        setRHUsername(response.username);
      } else {
        setRHAuthStatus('none');
        setRHUsername('');
      }
      return response;
    } catch (err: any) {
      console.error('Failed to check RH auth status:', err);
      setRHAuthStatus('none');
      throw err;
    }
  }, []);

  const loginToRH = useCallback(async (credentials: RHCredentials) => {
    setIsLoggingIn(true);
    setRHAuthStatus('authenticating');
    
    try {
      const response = await apiCall('/api/auth/redhat-login', {
        method: 'POST',
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password
        })
      });

      if (response.success) {
        setRHAuthStatus('authenticated');
        setRHUsername(credentials.username);
        setRHCredentials({ username: '', password: '' }); // Clear credentials
        return { success: true, message: 'Successfully authenticated with Red Hat registry!' };
      } else {
        setRHAuthStatus('failed');
        throw new Error(response.message || 'Authentication failed');
      }
    } catch (err: any) {
      console.error('RH login failed:', err);
      setRHAuthStatus('failed');
      throw new Error(`Failed to authenticate: ${err.message}`);
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const logoutFromRH = useCallback(async () => {
    try {
      await apiCall('/api/auth/redhat-logout', {
        method: 'POST'
      });
      setRHAuthStatus('none');
      setRHUsername('');
      setRHCredentials({ username: '', password: '' });
      return { success: true, message: 'Logged out from Red Hat registry' };
    } catch (err: any) {
      console.error('Logout failed:', err);
      // Even if logout fails on server, clear local state
      setRHAuthStatus('none');
      setRHUsername('');
      setRHCredentials({ username: '', password: '' });
      throw new Error(`Logout failed: ${err.message}`);
    }
  }, []);

  const updateCredentials = useCallback((field: keyof RHCredentials, value: string) => {
    setRHCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const clearCredentials = useCallback(() => {
    setRHCredentials({ username: '', password: '' });
  }, []);

  const isAuthRequired = useCallback((environments: string[]) => {
    return environments.some(env => 
      env.includes('rhel') || env.includes('devtools') || env.includes('supported')
    );
  }, []);

  const getAuthStatusMessage = useCallback(() => {
    switch (rhAuthStatus) {
      case 'none':
        return 'Not authenticated with Red Hat registry';
      case 'authenticating':
        return 'Authenticating...';
      case 'authenticated':
        return `Authenticated as ${rhUsername}`;
      case 'error':
      case 'failed':
        return 'Authentication error - please try again';
      default:
        return 'Unknown authentication status';
    }
  }, [rhAuthStatus, rhUsername]);

  const getAuthStatusColor = useCallback(() => {
    switch (rhAuthStatus) {
      case 'none':
        return 'warning';
      case 'authenticating':
        return 'info';
      case 'authenticated':
        return 'success';
      case 'error':
      case 'failed':
        return 'danger';
      default:
        return 'secondary';
    }
  }, [rhAuthStatus]);

  return {
    // State
    rhAuthStatus,
    rhUsername,
    rhCredentials,
    isLoggingIn,
    
    // Functions
    checkRHAuthStatus,
    loginToRH,
    logoutFromRH,
    updateCredentials,
    clearCredentials,
    
    // Helper functions
    isAuthRequired,
    getAuthStatusMessage,
    getAuthStatusColor,
    
    // State setters (for advanced use cases)
    setRHAuthStatus,
    setRHUsername
  };
};
