import type { PlatformAccessory } from 'homebridge';

import { ThermostatAccessory } from '../accessories/thermostatAccessory.js';
import type { SensorDevice } from '../models/sensorDevice.js';
import type { HAVirtualDevicesPlatform } from '../platform.js';

export class AccessoryFactory {
  constructor(
    private readonly platform:
      HAVirtualDevicesPlatform,
  ) {}

  public createThermostat(
    device: SensorDevice,
    accessory: PlatformAccessory,
  ): ThermostatAccessory {
    accessory.context.device = device;

    return new ThermostatAccessory(
      this.platform,
      accessory,
    );
  }
}