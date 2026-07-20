export type DeviceState =
  | 'enabled'
  | 'disabled'
  | 'missing'
  | 'error'
  | 'archived';

export interface CatalogDevice {
  id: string;
  name: string;
  source: string;
  room: string;
  state: DeviceState;
  favorite: boolean;
  enabled: boolean;
  archived: boolean;
  capabilities: string[];
  available: boolean;
  lastCommunication?: string;
}