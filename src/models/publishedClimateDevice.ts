import type { Device } from './device.js';

export interface PublishedClimateDevice
extends Device {
  source?: string;
  temperature?: number;
  humidity?: number;
  batteryLevel?: number;
  available: boolean;
  supportsHumidity?: boolean;
  supportsBattery?: boolean;
  manufacturer?: string;
  model?: string;
  softwareVersion?: string;
  hardwareVersion?: string;
  serialNumber?: string;
}