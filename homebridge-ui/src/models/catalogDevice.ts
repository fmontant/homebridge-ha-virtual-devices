export type DeviceState =
  | 'enabled'
  | 'disabled'
  | 'hidden'
  | 'missing';

export interface CatalogDevice {
  id: string;
  name: string;
  source: string;
  room: string;
  state: DeviceState;
  favorite: boolean;
  capabilities: string[];
  available: boolean;
  lastCommunication?: string;
}