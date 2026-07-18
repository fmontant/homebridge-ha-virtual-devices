export type DeviceState =
  | 'enabled'
  | 'disabled'
  | 'hidden'
  | 'missing'
  | 'error';

export type DeviceCapability =
  | 'temperature'
  | 'humidity'
  | 'battery'
  | 'pressure'
  | 'illuminance'
  | 'airQuality'
  | 'co2'
  | 'voc';

export interface DeviceMetadata {
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  softwareVersion?: string;
  hardwareVersion?: string;
}

export interface DeviceTimestamps {
  discoveredAt?: string;
  lastSeen?: string;
  lastUpdated?: string;
  missingSince?: string;
}

export interface CatalogDevice {
  id: string;
  name: string;
  source: string;
  sourceId?: string;
  state: DeviceState;
  room: string;
  favorite: boolean;
  enabled?: boolean;
  hidden?: boolean;
  capabilities: DeviceCapability[];
  metadata?: DeviceMetadata;
  timestamps?: DeviceTimestamps;
}