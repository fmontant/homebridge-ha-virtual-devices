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
  homeKitName: string;
  state: DeviceState;
  favorite: boolean;
  enabled: boolean;
  archived: boolean;
  capabilities: string[];
  available: boolean;
  lastCommunication?: string;
  firstViewedAt?: string;
}