import {
  CatalogDeviceState,
  DeviceCapability,
  type DiscoveredCatalogDevice,
} from '../catalog/catalogDevice.js';
import type { ClimateDevice } from '../models/climateDevice.js';

export class ClimateDeviceCatalogMapper {
  public toDiscoveredCatalogDevice(
    climateDevice: ClimateDevice,
  ): DiscoveredCatalogDevice {
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
      capabilities:
        this.getCapabilities(
          climateDevice,
        ),
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
    };
  }

  public toDiscoveredCatalogDevices(
    climateDevices: ClimateDevice[],
  ): DiscoveredCatalogDevice[] {
    return climateDevices.map(
      climateDevice =>
        this.toDiscoveredCatalogDevice(
          climateDevice,
        ),
    );
  }

  private getCapabilities(
    climateDevice: ClimateDevice,
  ): DeviceCapability[] {
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

    return capabilities;
  }
}