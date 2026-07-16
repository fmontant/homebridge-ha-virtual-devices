import {
  CatalogDeviceState,
  type CatalogDevice,
  type DeviceMetadata,
} from './catalogDevice.js';
import { CatalogSynchronizationResult } from './catalogSynchronizationResult.js';
import { DeviceCatalogStore } from './deviceCatalogStore.js';

export class DeviceCatalog {
  private readonly devices =
    new Map<string, CatalogDevice>();

  constructor(
    private readonly store:
      DeviceCatalogStore,
  ) {}

  public async load():
    Promise<void> {
    this.clear();

    const devices =
      await this.store.load();

    for (const device of devices) {
      this.set(device);
    }
  }

  public async save():
    Promise<void> {
    await this.store.save(
      this.getAll(),
    );
  }

  public synchronize(
    discoveredDevices: CatalogDevice[],
  ): CatalogSynchronizationResult {
    const result =
      new CatalogSynchronizationResult();

    const now =
      new Date().toISOString();

    const discoveredIds =
      new Set<string>();

    for (const discoveredDevice of discoveredDevices) {
      discoveredIds.add(
        discoveredDevice.id,
      );

      const existingDevice =
        this.devices.get(
          discoveredDevice.id,
        );

      if (!existingDevice) {
        this.devices.set(
          discoveredDevice.id,
          discoveredDevice,
        );

        result.added.push(
          discoveredDevice,
        );

        continue;
      }

      const hasChanged =
        this.hasDeviceChanged(
          existingDevice,
          discoveredDevice,
        );

      const wasMissing =
        existingDevice.state ===
        CatalogDeviceState.Missing;

      existingDevice.timestamps.lastSeen =
        now;

      if (!hasChanged && !wasMissing) {
        continue;
      }

      existingDevice.source =
        discoveredDevice.source;

      existingDevice.sourceId =
        discoveredDevice.sourceId;

      existingDevice.name =
        discoveredDevice.name;

      existingDevice.state =
        discoveredDevice.state;

      existingDevice.capabilities =
        [...discoveredDevice.capabilities];

      existingDevice.metadata = {
        ...discoveredDevice.metadata,
      };

      existingDevice.timestamps.lastUpdated =
        now;

      existingDevice.timestamps.missingSince =
        undefined;

      result.updated.push(
        existingDevice,
      );
    }

    for (
      const existingDevice
      of this.devices.values()
    ) {
      if (
        discoveredIds.has(
          existingDevice.id,
        )
      ) {
        continue;
      }

      if (
        existingDevice.state ===
        CatalogDeviceState.Missing
      ) {
        continue;
      }

      existingDevice.state =
        CatalogDeviceState.Missing;

      existingDevice.timestamps.missingSince ??=
        now;

      existingDevice.timestamps.lastUpdated =
        now;

      result.missing.push(
        existingDevice,
      );
    }

    return result;
  }

  public getAll():
    CatalogDevice[] {
    return Array.from(
      this.devices.values(),
    );
  }

  public get(
    id: string,
  ): CatalogDevice | undefined {
    return this.devices.get(
      id,
    );
  }

  public has(
    id: string,
  ): boolean {
    return this.devices.has(
      id,
    );
  }

  public set(
    device: CatalogDevice,
  ): void {
    this.devices.set(
      device.id,
      device,
    );
  }

  public remove(
    id: string,
  ): void {
    this.devices.delete(
      id,
    );
  }

  public clear():
    void {
    this.devices.clear();
  }

  private hasDeviceChanged(
    existingDevice: CatalogDevice,
    discoveredDevice: CatalogDevice,
  ): boolean {
    return (
      existingDevice.source !==
        discoveredDevice.source ||
      existingDevice.sourceId !==
        discoveredDevice.sourceId ||
      existingDevice.name !==
        discoveredDevice.name ||
      existingDevice.state !==
        discoveredDevice.state ||
      !this.haveSameCapabilities(
        existingDevice.capabilities,
        discoveredDevice.capabilities,
      ) ||
      !this.haveSameMetadata(
        existingDevice.metadata,
        discoveredDevice.metadata,
      )
    );
  }

  private haveSameCapabilities(
    existingCapabilities:
      CatalogDevice['capabilities'],
    discoveredCapabilities:
      CatalogDevice['capabilities'],
  ): boolean {
    if (
      existingCapabilities.length !==
      discoveredCapabilities.length
    ) {
      return false;
    }

    const existingValues =
      [...existingCapabilities]
        .sort();

    const discoveredValues =
      [...discoveredCapabilities]
        .sort();

    return existingValues.every(
      (
        capability,
        index,
      ) =>
        capability ===
        discoveredValues[index],
    );
  }

  private haveSameMetadata(
    existingMetadata: DeviceMetadata,
    discoveredMetadata: DeviceMetadata,
  ): boolean {
    return (
      existingMetadata.manufacturer ===
        discoveredMetadata.manufacturer &&
      existingMetadata.model ===
        discoveredMetadata.model &&
      existingMetadata.serialNumber ===
        discoveredMetadata.serialNumber &&
      existingMetadata.softwareVersion ===
        discoveredMetadata.softwareVersion &&
      existingMetadata.hardwareVersion ===
        discoveredMetadata.hardwareVersion
    );
  }
}