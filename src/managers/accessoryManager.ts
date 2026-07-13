import type {
  API,
  Logging,
  PlatformAccessory,
} from 'homebridge';

import type { ThermostatAccessory } from '../accessories/thermostatAccessory.js';
import type { AccessoryFactory } from '../factories/accessoryFactory.js';
import type { SensorDevice } from '../models/sensorDevice.js';
import {
  PLATFORM_NAME,
  PLUGIN_NAME,
} from '../settings.js';

export class AccessoryManager {
  private readonly activeAccessoryUUIDs:
    Set<string> =
      new Set();

  private readonly thermostatAccessories:
    Map<string, ThermostatAccessory> =
      new Map();

  constructor(
    private readonly api: API,
    private readonly log: Logging,
    private readonly accessoryFactory:
      AccessoryFactory,
    private readonly accessories:
      Map<string, PlatformAccessory>,
  ) {}

  public registerThermostatAccessory(
    device: SensorDevice,
  ): void {
    const uuid =
      this.api.hap.uuid.generate(
        `sensor-v2:${device.id}`,
      );

    this.activeAccessoryUUIDs.add(
      uuid,
    );

    const existingAccessory =
      this.accessories.get(
        uuid,
      );

    let accessory:
      PlatformAccessory;

    if (existingAccessory) {
      this.log.info(
        `Restauration de la tuile : ${device.name}`,
      );

      accessory =
        existingAccessory;

      accessory.context.device =
        device;

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

    const thermostatAccessory =
      this.accessoryFactory
        .createThermostat(
          device,
          accessory,
        );

    this.registerEntity(
      device.temperatureEntity,
      thermostatAccessory,
    );

    if (device.humidityEntity) {
      this.registerEntity(
        device.humidityEntity,
        thermostatAccessory,
      );
    }

    if (device.batteryEntity) {
      this.registerEntity(
        device.batteryEntity,
        thermostatAccessory,
      );
    }
  }

  public updateEntity(
    entityId: string,
    value: number,
  ): boolean {
    const thermostatAccessory =
      this.thermostatAccessories.get(
        entityId,
      );

    if (!thermostatAccessory) {
      return false;
    }

    thermostatAccessory.updateEntity(
      entityId,
      value,
    );

    return true;
  }

  public removeObsoleteAccessories():
  void {
    for (
      const [
        uuid,
        accessory,
      ] of this.accessories
    ) {
      if (
        this.activeAccessoryUUIDs.has(
          uuid,
        )
      ) {
        continue;
      }

      const device =
        accessory.context
          .device as
          Partial<SensorDevice> |
          undefined;

      if (!device?.temperatureEntity) {
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
    }
  }

  public clearDiscoveryState(): void {
    this.activeAccessoryUUIDs.clear();
  }

  private registerEntity(
    entityId: string,
    accessory: ThermostatAccessory,
  ): void {
    this.thermostatAccessories.set(
      entityId,
      accessory,
    );
  }
}