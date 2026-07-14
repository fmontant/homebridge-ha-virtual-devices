import type { Logging } from 'homebridge';

import type { AccessoryManager } from './accessoryManager.js';
import type { DiscoveryManager } from './discoveryManager.js';
import type { ClimateDeviceManager } from './ClimateDeviceManager.js';
import type { DeviceRegistryEntry } from '../models/deviceRegistryEntry.js';
import type { EntityRegistryEntry } from '../models/entityRegistryEntry.js';

export class RegistryManager {
  private deviceRegistry:
    DeviceRegistryEntry[] = [];

  private readonly ignoredDevices:
    Set<string>;

  constructor(
    private readonly discoveryManager:
      DiscoveryManager,
    private readonly climateDeviceManager:
      ClimateDeviceManager,
    private readonly accessoryManager:
      AccessoryManager,
    private readonly log: Logging,
    ignoredDevices: string[],
  ) {
    this.ignoredDevices =
      new Set(
        ignoredDevices
          .map(value =>
            value
              .trim()
              .toLowerCase(),
          )
          .filter(value =>
            value.length > 0,
          ),
      );
  }

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

    let ignoredDeviceCount = 0;
    let registeredDeviceCount = 0;

    for (
      const climateDevice of
      climateDevices
    ) {
      const preparedClimateDevice =
        this.climateDeviceManager
          .prepareClimateDevice(
            climateDevice,
          );

      if (
        this.isIgnoredDevice(
          preparedClimateDevice.id,
          preparedClimateDevice.name,
        )
      ) {
        ignoredDeviceCount += 1;

        this.log.info(
          `Appareil ignoré : ${preparedClimateDevice.name}`,
        );

        continue;
      }

      this.accessoryManager
        .registerClimateAccessory(
          preparedClimateDevice,
        );

      registeredDeviceCount += 1;
    }

    this.accessoryManager
      .removeObsoleteAccessories();

    this.log.info(
      `${registeredDeviceCount} accessoires climatiques traités`,
    );

    if (
      ignoredDeviceCount > 0
    ) {
      this.log.info(
        `${ignoredDeviceCount} appareils ignorés par la configuration`,
      );
    }
  }

  private isIgnoredDevice(
    deviceId: string,
    deviceName: string,
  ): boolean {
    const normalizedId =
      deviceId
        .trim()
        .toLowerCase();

    const normalizedName =
      deviceName
        .trim()
        .toLowerCase();

    return (
      this.ignoredDevices.has(
        normalizedId,
      ) ||
      this.ignoredDevices.has(
        normalizedName,
      )
    );
  }
}