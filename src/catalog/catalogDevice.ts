export enum CatalogDeviceState {
  Enabled = 'enabled',
  Disabled = 'disabled',
  Hidden = 'hidden',
  Missing = 'missing',
  Error = 'error',
}

export enum DeviceCapability {
  Temperature = 'temperature',
  Humidity = 'humidity',
  Battery = 'battery',
  Pressure = 'pressure',
  Illuminance = 'illuminance',
  AirQuality = 'airQuality',
  CO2 = 'co2',
  VOC = 'voc',
}

export interface DeviceMetadata {
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  softwareVersion?: string;
  hardwareVersion?: string;
}

export interface DevicePreferences {
  enabled: boolean;
  favorite: boolean;
  hidden: boolean;
  room?: string;
}

export interface DeviceTimestamps {
  discoveredAt: string;
  lastSeen: string;
  lastUpdated: string;
  missingSince?: string;
}

export interface CatalogDevice {
  id: string;
  source: string;
  sourceId: string;
  name: string;
  state: CatalogDeviceState;
  capabilities: DeviceCapability[];
  metadata: DeviceMetadata;
  preferences: DevicePreferences;
  timestamps: DeviceTimestamps;
}