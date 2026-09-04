import {
  CatalogDeviceState,
  DeviceCapability,
  type DiscoveredCatalogDevice,
} from '../catalog/catalogDevice.js';

import type {
  MatterDeviceDescriptor,
} from './types.js';

export class MatterDeviceCatalogMapper {
  public toDiscoveredCatalogDevice(
    descriptor: MatterDeviceDescriptor,
  ): DiscoveredCatalogDevice {
    const capabilities:
      DeviceCapability[] = [];

    if (
      descriptor.temperatureEndpointId !==
      undefined
    ) {
      capabilities.push(
        DeviceCapability.Temperature,
      );
    }

    if (
      descriptor.humidityEndpointId !==
      undefined
    ) {
      capabilities.push(
        DeviceCapability.Humidity,
      );
    }

    if (
      descriptor.batteryEndpointId !==
      undefined
    ) {
      capabilities.push(
        DeviceCapability.Battery,
      );
    }

    return {
      id: descriptor.id,
      source: 'matter',
      sourceId: descriptor.nodeId,
      name: descriptor.name,
      state: CatalogDeviceState.Enabled,
      capabilities,
      metadata: {
        manufacturer:
          descriptor.vendorName,
        model:
          descriptor.productName,
        serialNumber:
          descriptor.serialNumber,
      },
    };
  }

  public toDiscoveredCatalogDevices(
    descriptors: MatterDeviceDescriptor[],
  ): DiscoveredCatalogDevice[] {
    return descriptors.map(
      descriptor =>
        this.toDiscoveredCatalogDevice(
          descriptor,
        ),
    );
  }
}