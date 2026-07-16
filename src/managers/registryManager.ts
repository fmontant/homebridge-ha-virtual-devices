import type { Logging } from 'homebridge';

import {
  CatalogDeviceState,
  DeviceCapability,
  type CatalogDevice,
} from '../catalog/catalogDevice.js';
import type { DeviceCatalog } from '../catalog/deviceCatalog.js';
import type { DeviceRegistryEntry } from '../models/deviceRegistryEntry.js';
import type { EntityRegistryEntry } from '../models/entityRegistryEntry.js';
import type { ClimateDevice } from '../models/climateDevice.js';
import type { AccessoryManager } from './accessoryManager.js';
import type { ClimateDeviceManager } from './ClimateDeviceManager.js';
import type { DiscoveryManager } from './discoveryManager.js';

export class RegistryManager {
  private deviceRegistry:
    DeviceRegistryEntry[] = [];

  private readonly ignoredDevices:
    Set<string>;

  private catalogLoaded = false;

  private initialSynchronizationCompleted =
    false;

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

    const catalogDevices =
      climateDevices.map(
        climateDevice =>
          this.createCatalogDevice(
            climateDevice,
          ),
      );

    const synchronizationResult =
      this.deviceCatalog.synchronize(
        catalogDevices,
      );

    if (
      !this.initialSynchronizationCompleted
    ) {
      this.restoreInitialAccessories(
        climateDevices,
      );

      this.initialSynchronizationCompleted =
        true;
    } else {
      this.applyIncrementalSynchronization(
        climateDevices,
        synchronizationResult.added,
        synchronizationResult.updated,
        synchronizationResult.missing,
      );
    }

    await this.deviceCatalog.save();

    this.logSynchronizationResult(
      synchronizationResult.added.length,
      synchronizationResult.updated.length,
      synchronizationResult.missing.length,
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

  private restoreInitialAccessories(
    climateDevices: ClimateDevice[],
  ): void {
    this.accessoryManager
      .clearDiscoveryState();

    for (
      const climateDevice
      of climateDevices
    ) {
      this.accessoryManager
        .registerClimateAccessory(
          climateDevice,
        );
    }

    this.accessoryManager
      .removeObsoleteAccessories();

    this.log.info(
      `${climateDevices.length} accessoires climatiques restaurés`,
    );
  }

  private applyIncrementalSynchronization(
    climateDevices: ClimateDevice[],
    addedDevices: CatalogDevice[],
    updatedDevices: CatalogDevice[],
    missingDevices: CatalogDevice[],
  ): void {
    const climateDevicesById =
      new Map<string, ClimateDevice>();

    for (
      const climateDevice
      of climateDevices
    ) {
      climateDevicesById.set(
        climateDevice.id,
        climateDevice,
      );
    }

    const devicesToRegister = [
      ...addedDevices,
      ...updatedDevices,
    ];

    for (
      const catalogDevice
      of devicesToRegister
    ) {
      const climateDevice =
        climateDevicesById.get(
          catalogDevice.id,
        );

      if (!climateDevice) {
        continue;
      }

      this.accessoryManager
        .registerClimateAccessory(
          climateDevice,
        );
    }

    for (
      const missingDevice
      of missingDevices
    ) {
      this.accessoryManager
        .removeClimateAccessory(
          missingDevice.id,
        );
    }
  }

  private createCatalogDevice(
    climateDevice: ClimateDevice,
  ): CatalogDevice {
    const now =
      new Date().toISOString();

    const capabilities:
      DeviceCapability[] = [
        DeviceCapability.Temperature,
      ];

    if (
      climateDevice.humidityEntity
    ) {
      capabilities.push(
        DeviceCapability.Humidity,
      );
    }

    if (
      climateDevice.batteryEntity
    ) {
      capabilities.push(
        DeviceCapability.Battery,
      );
    }

    return {
      id:
        climateDevice.id,
      source:
        'home-assistant',
      sourceId:
        climateDevice.id,
      name:
        climateDevice.name,
      state:
        CatalogDeviceState.Enabled,
      capabilities,
      metadata: {
        manufacturer:
          climateDevice.manufacturer,
        model:
          climateDevice.model,
        serialNumber:
          climateDevice.serialNumber,
        softwareVersion:
          climateDevice.softwareVersion,
        hardwareVersion:
          climateDevice.hardwareVersion,
      },
      preferences: {
        enabled:
          true,
        favorite:
          false,
        hidden:
          false,
      },
      timestamps: {
        discoveredAt:
          now,
        lastSeen:
          now,
        lastUpdated:
          now,
      },
    };
  }

  private logSynchronizationResult(
    addedDeviceCount: number,
    updatedDeviceCount: number,
    missingDeviceCount: number,
  ): void {
    const totalChanges =
      addedDeviceCount +
      updatedDeviceCount +
      missingDeviceCount;

    if (
      totalChanges === 0
    ) {
      this.log.info(
        'Catalogue synchronisé : aucune modification',
      );

      return;
    }

    this.log.info(
      'Catalogue synchronisé : ' +
      `${addedDeviceCount} ajout(s), ` +
      `${updatedDeviceCount} modification(s), ` +
      `${missingDeviceCount} disparition(s)`,
    );
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