import type { Device } from './device.js';

export interface ClimateDevice
extends Device {
  temperatureEntity: string;
  humidityEntity?: string;
  batteryEntity?: string;

  temperature?: number;
  humidity?: number;
  batteryLevel?: number;
  available: boolean;

  manufacturer?: string;
  model?: string;
  softwareVersion?: string;
  hardwareVersion?: string;
  serialNumber?: string;
}