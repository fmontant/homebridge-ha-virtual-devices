import type { ClimateDevice } from '../models/climateDevice.js';
import type { EntityRegistryEntry } from '../models/entityRegistryEntry.js';
import type { DeviceRegistryEntry } from '../models/deviceRegistryEntry.js';

export class ClimateDeviceBuilder {

  private readonly devices = new Map<string, ClimateDevice>();

  public build(
    entities: EntityRegistryEntry[],
    devices: DeviceRegistryEntry[],
  ): ClimateDevice[] {


  this.devices.clear();

  const deviceNames = new Map(
  devices.map(device => [
    device.id,
    device.nameByUser ?? device.name,
  ]),
);

  for (const entity of entities) {

    if (!entity.deviceId) {
      continue;
    }

    if (!this.devices.has(entity.deviceId)) {
      this.devices.set(entity.deviceId, {
        id: entity.deviceId,
        name: deviceNames.get(entity.deviceId) ?? entity.entityId,
        entities: [],
      });
    }

    this.devices.get(entity.deviceId)!
      .entities.push(entity.entityId);
  }

  return Array.from(this.devices.values());
}

}