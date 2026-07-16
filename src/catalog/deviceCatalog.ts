import {
  CatalogDeviceState,
  type CatalogDevice,
} from './catalogDevice.js';
import { DeviceCatalogStore } from './deviceCatalogStore.js';
import { CatalogSynchronizationResult } from './catalogSynchronizationResult.js';

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

    for (const device of discoveredDevices) {

      discoveredIds.add(
        device.id,
      );

      const existing =
        this.devices.get(
          device.id,
        );

      if (!existing) {

        this.devices.set(
          device.id,
          device,
        );

        result.added.push(
          device,
        );

        continue;
      }

      existing.name =
        device.name;

      existing.metadata =
        device.metadata;

      existing.capabilities =
        device.capabilities;

      existing.state =
        device.state;

      existing.timestamps.lastSeen =
        now;

      existing.timestamps.lastUpdated =
        now;

      existing.timestamps.missingSince =
        undefined;

      result.updated.push(
        existing,
      );
    }

    for (
      const device
      of this.devices.values()
    ) {

      if (
        discoveredIds.has(
          device.id,
        )
      ) {
        continue;
      }

      if (
        device.state ===
        CatalogDeviceState.Missing
      ) {
        continue;
      }

      device.state =
        CatalogDeviceState.Missing;

      device.timestamps.missingSince ??=
        now;

      device.timestamps.lastUpdated =
        now;

      result.missing.push(
        device,
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
}