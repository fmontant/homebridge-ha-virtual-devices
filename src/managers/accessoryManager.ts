import type {
  API,
  Logging,
  PlatformAccessory,
} from 'homebridge';

import type { ClimateAccessory } from '../accessories/climateAccessory.js';
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

  constructor(
    private readonly api: API,
    private readonly log: Logging,
    private readonly accessoryFactory: AccessoryFactory,
    private readonly accessories: Map<string, PlatformAccessory>,
  ) {}

  public registerClimateAccessory(
    device: ClimateDevice,
  ): void {
    const uuid = this.api.hap.uuid.generate(
      `sensor-v2:${device.id}`,
    );

    this.activeAccessoryUUIDs.add(uuid);

    let accessory = this.accessories.get(uuid);

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
      (entityId): entityId is string =>
        Boolean(entityId),
    );

    for (const entityId of entityIds) {
      this.registerEntity(
        entityId,
        climateAccessory,
      );
    }
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

      this.api
        .unregisterPlatformAccessories(
          PLUGIN_NAME,
          PLATFORM_NAME,
          [accessory],
        );

      this.accessories.delete(uuid);
    }
  }

  public clearDiscoveryState(): void {
    this.activeAccessoryUUIDs.clear();
    this.climateAccessories.clear();
  }

  private registerEntity(
    entityId: string,
    accessory: ClimateAccessory,
  ): void {
    this.climateAccessories.set(
      entityId,
      accessory,
    );
  }
}