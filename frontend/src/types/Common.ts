// types/Common.ts
export type ConnectionStatus = 'connected' | 'disconnected' | 'checking';

export type AuthStatus = 'none' | 'authenticated' | 'failed';

export interface RedHatCredentials {
  username: string;
  password: string;
}

export interface AlertMessage {
  type: 'success' | 'danger' | 'warning' | 'info';
  message: string;
}
