import type {
  PublishedClimateDevice,
} from './publishedClimateDevice.js';

export interface ClimateDevice
extends PublishedClimateDevice {
  temperatureEntity: string;
  humidityEntity?: string;
  batteryEntity?: string;
}