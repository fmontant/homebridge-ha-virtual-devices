export type ConfigurationConnectionState =
  | 'connected'
  | 'unconfigured'
  | 'unauthorized'
  | 'unreachable';

export interface ConfigurationStatus {
  configured: boolean;
  connected: boolean;
  state: ConfigurationConnectionState;
  message: string;
}
