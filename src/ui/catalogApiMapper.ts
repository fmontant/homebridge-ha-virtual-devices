import {
  CatalogDeviceState,
  type CatalogDevice,
} from '../catalog/catalogDevice.js';

import type {
  CatalogApiDevice,
} from './catalogApi.js';

export class CatalogApiMapper {
  public toApiDevice(
    device: CatalogDevice,
  ): CatalogApiDevice {
    return {
      id:
                device.id,
      source:
                device.source,
      sourceId:
                device.sourceId,
      name:
                device.name,
      state:
                device.state,
      capabilities: [
        ...device.capabilities,
      ],
      metadata: {
        ...device.metadata,
      },
      preferences: {
        ...device.preferences,
      },
      timestamps: {
        ...device.timestamps,
      },
      available:
                device.available,
      lastCommunication:
                device.lastCommunication ??
                device.timestamps.lastSeen,
      publishable:
          device.preferences.enabled &&
          !device.preferences.archived,
    };
  }
}