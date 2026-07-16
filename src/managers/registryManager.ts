import type { Logging } from 'homebridge';

import type { DeviceCatalog } from '../catalog/deviceCatalog.js';
import { ClimateDeviceCatalogMapper } from '../mappers/climateDeviceCatalogMapper.js';
import type { ClimateDevice } from '../models/climateDevice.js';
import type { DeviceRegistryEntry } from '../models/deviceRegistryEntry.js';
import type { EntityRegistryEntry } from '../models/entityRegistryEntry.js';
import type { AccessoryManager } from './accessoryManager.js';
import type { ClimateDeviceManager } from './ClimateDeviceManager.js';
import type { DiscoveryManager } from './discoveryManager.js';

export class RegistryManager {
  private deviceRegistry:
    DeviceRegistryEntry[] = [];

  private readonly ignoredDevices:
    Set<string>;

  private catalogLoaded =
    false;

  private initialSynchronizationCompleted =
    false;

  private readonly climateDeviceCatalogMapper =
    new ClimateDeviceCatalogMapper();

  constructor(
    private readonly discoveryManager:
      DiscoveryManager,
    private readonly climateDeviceManager:
      ClimateDeviceManager,
    private readonly accessoryManager:
      AccessoryManager,
    private readonly deviceCatalog:
      DeviceCatalog,
    private readonly log:
      Logging,
    ignoredDevices:
      string[],
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

  public async handleEntityRegistry(
    entries: EntityRegistryEntry[],
  ): Promise<void> {
    if (
      this.deviceRegistry.length === 0
    ) {
      this.log.warn(
        'Registre des entités ignoré : registre des appareils vide',
      );

      return;
    }

    await this.loadCatalog();

    const discoveredClimateDevices =
      this.discoveryManager
        .discoverClimateDevices(
          entries,
          this.deviceRegistry,
        );

    const climateDevices =
      this.prepareClimateDevices(
        discoveredClimateDevices,
      );

    const discoveredCatalogDevices =
      this.climateDeviceCatalogMapper
        .toDiscoveredCatalogDevices(
          climateDevices,
        );

    const synchronizationResult =
      this.deviceCatalog.synchronize(
        discoveredCatalogDevices,
      );

    if (
      !this.initialSynchronizationCompleted
    ) {
      this.accessoryManager
        .restoreClimateAccessories(
          climateDevices,
          this.deviceCatalog,
        );

      this.initialSynchronizationCompleted =
        true;
    } else {
      this.accessoryManager
        .applyClimateSynchronization(
          climateDevices,
          synchronizationResult,
          this.deviceCatalog,
        );
    }

    await this.deviceCatalog.save();

    this.log.info(
      synchronizationResult.summary(),
    );
  }

  private async loadCatalog():
    Promise<void> {
    if (this.catalogLoaded) {
      return;
    }

    await this.deviceCatalog.load();

    this.catalogLoaded =
      true;

    this.log.info(
      `${this.deviceCatalog.getAll().length} appareils chargés depuis le catalogue`,
    );
  }

  private prepareClimateDevices(
    climateDevices: ClimateDevice[],
  ): ClimateDevice[] {
    const preparedDevices:
      ClimateDevice[] = [];

    let ignoredDeviceCount = 0;

    for (
      const climateDevice
      of climateDevices
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

      preparedDevices.push(
        preparedClimateDevice,
      );
    }

    if (
      ignoredDeviceCount > 0
    ) {
      this.log.info(
        `${ignoredDeviceCount} appareils ignorés par la configuration`,
      );
    }

    return preparedDevices;
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