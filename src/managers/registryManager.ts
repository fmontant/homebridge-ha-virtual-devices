import type { Logging } from 'homebridge';

import type { AccessoryManager } from './accessoryManager.js';
import type { DiscoveryManager } from './discoveryManager.js';
import type { SensorDeviceManager } from './sensorDeviceManager.js';
import type { DeviceRegistryEntry } from '../models/deviceRegistryEntry.js';
import type { EntityRegistryEntry } from '../models/entityRegistryEntry.js';

export class RegistryManager {
  private deviceRegistry:
    DeviceRegistryEntry[] = [];

  constructor(
    private readonly discoveryManager:
      DiscoveryManager,
    private readonly sensorDeviceManager:
      SensorDeviceManager,
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
      const sensorDevice =
        this.sensorDeviceManager
          .prepareSensorDevice(
            climateDevice,
          );

      this.accessoryManager
        .registerThermostatAccessory(
          sensorDevice,
        );
    }

    this.accessoryManager
      .removeObsoleteAccessories();

    this.log.info(
      `${climateDevices.length} accessoires climatiques traités`,
    );
  }
}