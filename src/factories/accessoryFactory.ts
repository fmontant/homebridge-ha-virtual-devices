import type { PlatformAccessory } from 'homebridge';

import type { HAVirtualDevicesPlatform } from '../platform.js';
import type { TemperatureSensor } from '../models/temperatureSensor.js';
import { ThermostatAccessory } from '../accessories/thermostatAccessory.js';
import type { HumiditySensor } from '../models/humiditySensor.js';

export class AccessoryFactory {

  constructor(
    private readonly platform: HAVirtualDevicesPlatform,
  ) {}

  public createThermostat(
  sensor: TemperatureSensor,
  accessory: PlatformAccessory,
): ThermostatAccessory {
  accessory.context.device = sensor;

  return new ThermostatAccessory(
    this.platform,
    accessory,
  );
}

}