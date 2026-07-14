import type { ClimateDevice } from '../models/climateDevice.js';
import type { DeviceRegistryEntry } from '../models/deviceRegistryEntry.js';
import type { EntityRegistryEntry } from '../models/entityRegistryEntry.js';

type ClimateDeviceDraft =
  Partial<ClimateDevice> & {
    id: string;
    name: string;
  };

export class ClimateDeviceBuilder {
  public build(
    entities: EntityRegistryEntry[],
    devices: DeviceRegistryEntry[],
  ): ClimateDevice[] {
    const climateDevices =
      new Map<string, ClimateDeviceDraft>();

    const deviceMap =
      new Map<string, DeviceRegistryEntry>(
        devices.map(device => [
          device.id,
          device,
        ]),
      );

    for (const entity of entities) {
      if (!entity.deviceId) {
        continue;
      }

      const deviceInfo =
        deviceMap.get(entity.deviceId);

      const climateDevice:
        ClimateDeviceDraft =
        climateDevices.get(
          entity.deviceId,
        ) ?? {
          id: entity.deviceId,
          name:
            deviceInfo?.nameByUser ??
            deviceInfo?.name ??
            entity.entityId,
          manufacturer:
            deviceInfo?.manufacturer,
          model:
            deviceInfo?.model,
          softwareVersion:
            deviceInfo?.softwareVersion,
          hardwareVersion:
            deviceInfo?.hardwareVersion,
          serialNumber:
            deviceInfo?.serialNumber,
        };

      if (
        /_temperature(_\d+)?$/.test(
          entity.entityId,
        )
      ) {
        climateDevice.temperatureEntity =
          entity.entityId;
      }

      if (
        /_(humidite|humidity)(_\d+)?$/.test(
          entity.entityId,
        )
      ) {
        climateDevice.humidityEntity =
          entity.entityId;
      }

      if (
        /_(batterie|battery)(_\d+)?$/.test(
          entity.entityId,
        ) &&
        entity.translationKey !==
          'battery_voltage' &&
        entity.translationKey !==
          'battery_replacement_description'
      ) {
        climateDevice.batteryEntity =
          entity.entityId;
      }

      climateDevices.set(
        entity.deviceId,
        climateDevice,
      );
    }

    return Array.from(
      climateDevices.values(),
    ).filter(
      (
        device,
      ): device is ClimateDevice =>
        typeof device.temperatureEntity ===
        'string',
    );
  }
}