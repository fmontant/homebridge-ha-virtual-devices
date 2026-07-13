import type { Logging } from 'homebridge';

import type { AccessoryManager } from './accessoryManager.js';
import type { DiscoveryManager } from './discoveryManager.js';
import type { ClimateDeviceManager } from './ClimateDeviceManager.js';
import type { DeviceRegistryEntry } from '../models/deviceRegistryEntry.js';
import type { EntityRegistryEntry } from '../models/entityRegistryEntry.js';

export class RegistryManager {
  private deviceRegistry:
    DeviceRegistryEntry[] = [];

  constructor(
    private readonly discoveryManager:
      DiscoveryManager,
    private readonly climateDeviceManager:
      ClimateDeviceManager,
    private readonly accessoryManager:
      AccessoryManager,
    private readonly log: Logging,
  ) {}

  public handleDeviceRegistry(
    devices: DeviceRegistryEntry[],
  ): void {
    this.deviceRegistry =
      devices;

    this.log.info(
      `${devices.length} appareils enregistrés dans le gestionnaire de registres`,
    );
  }

  public handleEntityRegistry(
    entries: EntityRegistryEntry[],
  ): void {
    if (
      this.deviceRegistry.length === 0
    ) {
      this.log.warn(
        'Registre des entités ignoré : registre des appareils vide',
      );

      return;
    }

    this.accessoryManager
      .clearDiscoveryState();

    const climateDevices =
      this.discoveryManager
        .discoverClimateDevices(
          entries,
          this.deviceRegistry,
        );

    for (
      const climateDevice of
      climateDevices
    ) {
      const preparedClimateDevice =
  this.climateDeviceManager
    .prepareClimateDevice(
      climateDevice,
    );

      this.accessoryManager
  .registerClimateAccessory(
    preparedClimateDevice,
  );
    }

    this.accessoryManager
      .removeObsoleteAccessories();

    this.log.info(
      `${climateDevices.length} accessoires climatiques traités`,
    );
  }
}