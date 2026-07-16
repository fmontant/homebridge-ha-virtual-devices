import {
  CatalogDeviceState,
  type CatalogDevice,
  type DeviceMetadata,
  type DiscoveredCatalogDevice,
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
    discoveredDevices:
      DiscoveredCatalogDevice[],
  ): CatalogSynchronizationResult {
    const result =
      new CatalogSynchronizationResult();

    const now =
      new Date().toISOString();

    const discoveredIds =
      new Set<string>();

    for (
      const discoveredDevice
      of discoveredDevices
    ) {
      discoveredIds.add(
        discoveredDevice.id,
      );

      const existingDevice =
        this.devices.get(
          discoveredDevice.id,
        );

      if (!existingDevice) {
        const catalogDevice =
          this.createCatalogDevice(
            discoveredDevice,
            now,
          );

        this.devices.set(
          catalogDevice.id,
          catalogDevice,
        );

        result.added.push(
          catalogDevice,
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

      if (
        !hasChanged &&
        !wasMissing
      ) {
        continue;
      }

      this.updateCatalogDevice(
        existingDevice,
        discoveredDevice,
        now,
      );

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

  public isEnabled(
    id: string,
  ): boolean {
    return (
      this.devices.get(
        id,
      )?.preferences.enabled ??
      false
    );
  }

  public isHidden(
    id: string,
  ): boolean {
    return (
      this.devices.get(
        id,
      )?.preferences.hidden ??
      false
    );
  }

  public isFavorite(
    id: string,
  ): boolean {
    return (
      this.devices.get(
        id,
      )?.preferences.favorite ??
      false
    );
  }

  public shouldPublish(
    id: string,
  ): boolean {
    const device =
      this.devices.get(
        id,
      );

    if (!device) {
      return false;
    }

    return (
      device.preferences.enabled &&
      !device.preferences.hidden &&
      device.state !==
        CatalogDeviceState.Missing
    );
  }

  public async setEnabled(
    id: string,
    enabled: boolean,
  ): Promise<boolean> {
    const device =
      this.devices.get(
        id,
      );

    if (!device) {
      return false;
    }

    if (
      device.preferences.enabled ===
      enabled
    ) {
      return true;
    }

    device.preferences.enabled =
      enabled;

    device.timestamps.lastUpdated =
      new Date().toISOString();

    await this.save();

    return true;
  }

  public async setHidden(
    id: string,
    hidden: boolean,
  ): Promise<boolean> {
    const device =
      this.devices.get(
        id,
      );

    if (!device) {
      return false;
    }

    if (
      device.preferences.hidden ===
      hidden
    ) {
      return true;
    }

    device.preferences.hidden =
      hidden;

    device.timestamps.lastUpdated =
      new Date().toISOString();

    await this.save();

    return true;
  }

  public async setFavorite(
    id: string,
    favorite: boolean,
  ): Promise<boolean> {
    const device =
      this.devices.get(
        id,
      );

    if (!device) {
      return false;
    }

    if (
      device.preferences.favorite ===
      favorite
    ) {
      return true;
    }

    device.preferences.favorite =
      favorite;

    device.timestamps.lastUpdated =
      new Date().toISOString();

    await this.save();

    return true;
  }

  public async setRoom(
    id: string,
    room?: string,
  ): Promise<boolean> {
    const device =
      this.devices.get(
        id,
      );

    if (!device) {
      return false;
    }

    const normalizedRoom =
      room?.trim();

    const nextRoom =
      normalizedRoom &&
      normalizedRoom.length > 0
        ? normalizedRoom
        : undefined;

    if (
      device.preferences.room ===
      nextRoom
    ) {
      return true;
    }

    device.preferences.room =
      nextRoom;

    device.timestamps.lastUpdated =
      new Date().toISOString();

    await this.save();

    return true;
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

  private createCatalogDevice(
    discoveredDevice:
      DiscoveredCatalogDevice,
    now: string,
  ): CatalogDevice {
    return {
      id:
        discoveredDevice.id,
      source:
        discoveredDevice.source,
      sourceId:
        discoveredDevice.sourceId,
      name:
        discoveredDevice.name,
      state:
        discoveredDevice.state,
      capabilities: [
        ...discoveredDevice.capabilities,
      ],
      metadata: {
        ...discoveredDevice.metadata,
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

  private updateCatalogDevice(
    existingDevice: CatalogDevice,
    discoveredDevice:
      DiscoveredCatalogDevice,
    now: string,
  ): void {
    existingDevice.source =
      discoveredDevice.source;

    existingDevice.sourceId =
      discoveredDevice.sourceId;

    existingDevice.name =
      discoveredDevice.name;

    existingDevice.state =
      discoveredDevice.state;

    existingDevice.capabilities = [
      ...discoveredDevice.capabilities,
    ];

    existingDevice.metadata = {
      ...discoveredDevice.metadata,
    };

    existingDevice.timestamps.lastSeen =
      now;

    existingDevice.timestamps.lastUpdated =
      now;

    existingDevice.timestamps.missingSince =
      undefined;
  }

  private hasDeviceChanged(
    existingDevice: CatalogDevice,
    discoveredDevice:
      DiscoveredCatalogDevice,
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
      DiscoveredCatalogDevice[
        'capabilities'
      ],
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