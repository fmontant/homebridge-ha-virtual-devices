import type {
  CatalogDevice,
} from '../models/catalogDevice.js';

export interface CatalogResponse {
  devices: CatalogDevice[];
}

export interface CatalogDevicePreferencesUpdate {
  enabled?: boolean;
  hidden?: boolean;
  favorite?: boolean;
  room?: string;
}

export interface CatalogDeviceUpdateRequest {
  preferences:
    CatalogDevicePreferencesUpdate;
}

export interface CatalogDeviceUpdateResponse {
  device: CatalogDevice;
}
