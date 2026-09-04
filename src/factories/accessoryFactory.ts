import type { PlatformAccessory } from 'homebridge';

import { ClimateAccessory } from '../accessories/climateAccessory.js';
import type {
  PublishedClimateDevice,
} from '../models/publishedClimateDevice.js';
import type { HAVirtualDevicesPlatform } from '../platform.js';

export class AccessoryFactory {

  constructor(
    private readonly platform: HAVirtualDevicesPlatform,
  ) {}

  public createClimateAccessory(
    device: PublishedClimateDevice,
    accessory: PlatformAccessory,
  ): ClimateAccessory {

    accessory.context.device = device;

    return new ClimateAccessory(
      this.platform,
      accessory,
    );
  }

}