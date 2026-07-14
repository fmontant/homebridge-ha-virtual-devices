import type { Logging } from 'homebridge';

import { ClimateDeviceBuilder } from '../builders/climateDeviceBuilder.js';
import type { ClimateDevice } from '../models/climateDevice.js';
import type { DeviceRegistryEntry } from '../models/deviceRegistryEntry.js';
import type { EntityRegistryEntry } from '../models/entityRegistryEntry.js';

export class DiscoveryManager {
  private readonly climateDeviceBuilder:
    ClimateDeviceBuilder;

  constructor(
    private readonly log: Logging,
  ) {
    this.climateDeviceBuilder =
      new ClimateDeviceBuilder();
  }

  public discoverClimateDevices(
    entities: EntityRegistryEntry[],
    devices: DeviceRegistryEntry[],
  ): ClimateDevice[] {
    if (devices.length === 0) {
      this.log.warn(
        'Découverte impossible : registre des appareils vide',
      );

      return [];
    }

    if (entities.length === 0) {
      this.log.warn(
        'Découverte impossible : registre des entités vide',
      );

      return [];
    }

    const climateDevices =
      this.climateDeviceBuilder.build(
        entities,
        devices,
      );

    this.log.info(
      `${climateDevices.length} capteurs climatiques construits`,
    );

    return climateDevices;
  }
}