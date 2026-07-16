import type {
  API,
  Logging,
  PlatformAccessory,
} from 'homebridge';

import type { ClimateAccessory } from '../accessories/climateAccessory.js';
import type { CatalogSynchronizationResult } from '../catalog/catalogSynchronizationResult.js';
import type { DeviceCatalog } from '../catalog/deviceCatalog.js';
import type { AccessoryFactory } from '../factories/accessoryFactory.js';
import type { ClimateDevice } from '../models/climateDevice.js';
import {
  PLATFORM_NAME,
  PLUGIN_NAME,
} from '../settings.js';

export class AccessoryManager {
  private readonly activeAccessoryUUIDs =
    new Set<string>();

  private readonly climateAccessories =
    new Map<string, ClimateAccessory>();

  private readonly entityIdsByAccessoryUUID =
    new Map<string, Set<string>>();

  constructor(
    private readonly api: API,
    private readonly log: Logging,
    private readonly accessoryFactory: AccessoryFactory,
    private readonly accessories:
      Map<string, PlatformAccessory>,
  ) {}

  public restoreClimateAccessories(
    climateDevices: ClimateDevice[],
    deviceCatalog: DeviceCatalog,
  ): void {
    this.clearDiscoveryState();

    let publishedDeviceCount = 0;
    let unpublishedDeviceCount = 0;

    for (
      const climateDevice
      of climateDevices
    ) {
      if (
        !deviceCatalog.shouldPublish(
          climateDevice.id,
        )
      ) {
        this.removeClimateAccessory(
          climateDevice.id,
        );

        unpublishedDeviceCount += 1;

        this.log.info(
          `Appareil non publié selon les préférences : ${climateDevice.name}`,
        );

        continue;
      }

      this.registerClimateAccessory(
        climateDevice,
      );

      publishedDeviceCount += 1;
    }

    this.removeObsoleteAccessories();

    this.log.info(
      `${publishedDeviceCount} accessoires climatiques restaurés`,
    );

    if (
      unpublishedDeviceCount > 0
    ) {
      this.log.info(
        `${unpublishedDeviceCount} appareils non publiés selon les préférences`,
      );
    }
  }

  public applyClimateSynchronization(
    climateDevices: ClimateDevice[],
    synchronizationResult:
      CatalogSynchronizationResult,
    deviceCatalog: DeviceCatalog,
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

    const devicesToProcess = [
      ...synchronizationResult.added,
      ...synchronizationResult.updated,
    ];

    for (
      const catalogDevice
      of devicesToProcess
    ) {
      const climateDevice =
        climateDevicesById.get(
          catalogDevice.id,
        );

      if (!climateDevice) {
        continue;
      }

      if (
        !deviceCatalog.shouldPublish(
          catalogDevice.id,
        )
      ) {
        this.removeClimateAccessory(
          catalogDevice.id,
        );

        this.log.info(
          `Appareil non publié selon les préférences : ${catalogDevice.name}`,
        );

        continue;
      }

      this.registerClimateAccessory(
        climateDevice,
      );
    }

    for (
      const missingDevice
      of synchronizationResult.missing
    ) {
      this.removeClimateAccessory(
        missingDevice.id,
      );
    }
  }

  public registerClimateAccessory(
    device: ClimateDevice,
  ): void {
    const uuid =
      this.getClimateAccessoryUUID(
        device.id,
      );

    this.activeAccessoryUUIDs.add(
      uuid,
    );

    this.removeEntityMappings(
      uuid,
    );

    let accessory =
      this.accessories.get(
        uuid,
      );

    if (accessory) {
      this.log.info(
        `Restauration de la tuile : ${device.name}`,
      );

      accessory.displayName =
        device.name;

      accessory.context.device =
        device;

      accessory
        .getService(
          this.api.hap.Service
            .AccessoryInformation,
        )
        ?.setCharacteristic(
          this.api.hap.Characteristic.Name,
          device.name,
        );

      this.api.updatePlatformAccessories([
        accessory,
      ]);
    } else {
      this.log.info(
        `Création de la tuile : ${device.name}`,
      );

      accessory =
        new this.api.platformAccessory(
          device.name,
          uuid,
        );

      accessory.context.device =
        device;

      this.api.registerPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        [accessory],
      );

      this.accessories.set(
        accessory.UUID,
        accessory,
      );
    }

    const climateAccessory =
      this.accessoryFactory
        .createClimateAccessory(
          device,
          accessory,
        );

    const entityIds = [
      device.temperatureEntity,
      device.humidityEntity,
      device.batteryEntity,
    ].filter(
      (
        entityId,
      ): entityId is string =>
        Boolean(entityId),
    );

    for (
      const entityId
      of entityIds
    ) {
      this.registerEntity(
        entityId,
        uuid,
        climateAccessory,
      );
    }
  }

  public removeClimateAccessory(
    deviceId: string,
  ): boolean {
    const uuid =
      this.getClimateAccessoryUUID(
        deviceId,
      );

    const accessory =
      this.accessories.get(
        uuid,
      );

    if (!accessory) {
      this.activeAccessoryUUIDs.delete(
        uuid,
      );

      this.removeEntityMappings(
        uuid,
      );

      return false;
    }

    this.log.info(
      `Suppression de la tuile : ${accessory.displayName}`,
    );

    this.api.unregisterPlatformAccessories(
      PLUGIN_NAME,
      PLATFORM_NAME,
      [accessory],
    );

    this.accessories.delete(
      uuid,
    );

    this.activeAccessoryUUIDs.delete(
      uuid,
    );

    this.removeEntityMappings(
      uuid,
    );

    return true;
  }

  public updateEntity(
    entityId: string,
    value: number,
  ): boolean {
    const accessory =
      this.climateAccessories.get(
        entityId,
      );

    if (!accessory) {
      return false;
    }

    accessory.updateEntity(
      entityId,
      value,
    );

    return true;
  }

  public removeObsoleteAccessories():
    void {
    for (
      const [uuid, accessory]
      of this.accessories
    ) {
      if (
        this.activeAccessoryUUIDs.has(
          uuid,
        )
      ) {
        continue;
      }

      this.log.info(
        `Suppression de l’accessoire obsolète : ${accessory.displayName}`,
      );

      this.api.unregisterPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        [accessory],
      );

      this.accessories.delete(
        uuid,
      );

      this.removeEntityMappings(
        uuid,
      );
    }
  }

  public clearDiscoveryState():
    void {
    this.activeAccessoryUUIDs.clear();
    this.climateAccessories.clear();
    this.entityIdsByAccessoryUUID.clear();
  }

  private getClimateAccessoryUUID(
    deviceId: string,
  ): string {
    return this.api.hap.uuid.generate(
      `sensor-v2:${deviceId}`,
    );
  }

  private registerEntity(
    entityId: string,
    accessoryUUID: string,
    accessory: ClimateAccessory,
  ): void {
    this.climateAccessories.set(
      entityId,
      accessory,
    );

    let registeredEntityIds =
      this.entityIdsByAccessoryUUID.get(
        accessoryUUID,
      );

    if (!registeredEntityIds) {
      registeredEntityIds =
        new Set<string>();

      this.entityIdsByAccessoryUUID.set(
        accessoryUUID,
        registeredEntityIds,
      );
    }

    registeredEntityIds.add(
      entityId,
    );
  }

  private removeEntityMappings(
    accessoryUUID: string,
  ): void {
    const entityIds =
      this.entityIdsByAccessoryUUID.get(
        accessoryUUID,
      );

    if (!entityIds) {
      return;
    }

    for (
      const entityId
      of entityIds
    ) {
      this.climateAccessories.delete(
        entityId,
      );
    }

    this.entityIdsByAccessoryUUID.delete(
      accessoryUUID,
    );
  }
}