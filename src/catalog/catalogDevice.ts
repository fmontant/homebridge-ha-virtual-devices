export enum CatalogDeviceState {
  Archived = 'archived',
  Enabled = 'enabled',
  Disabled = 'disabled',
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
  archived: boolean;

  /**
   * Transition.
   * Sera supprimé lorsque toute la chaîne
   * utilisera homeKitName.
   */
  room?: string;

  /**
   * Nom personnalisé de la tuile HomeKit.
   * Si absent, le plugin utilise le nom
   * découvert dans Home Assistant.
   */
  homeKitName?: string;
}

export interface DeviceTimestamps {
  discoveredAt: string;
  firstViewedAt?: string;
  lastSeen: string;
  lastUpdated: string;
  missingSince?: string;
}

export interface DiscoveredCatalogDevice {
  id: string;
  source: string;
  sourceId: string;
  name: string;
  state: CatalogDeviceState;
  capabilities: DeviceCapability[];
  metadata: DeviceMetadata;
}

export interface CatalogDevice
  extends DiscoveredCatalogDevice {
  preferences: DevicePreferences;
  timestamps: DeviceTimestamps;

  available: boolean;
  lastCommunication?: string;
}