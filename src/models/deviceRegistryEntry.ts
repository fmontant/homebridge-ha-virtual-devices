export interface DeviceRegistryEntry {
  id: string;
  name: string;
  nameByUser?: string;
  manufacturer?: string;
  model?: string;
  softwareVersion?: string;
  hardwareVersion?: string;
  serialNumber?: string;
}