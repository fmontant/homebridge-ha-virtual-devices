import type { Logging } from 'homebridge';

import type {
  CatalogDevice,
} from '../catalog/catalogDevice.js';
import type {
  CatalogSynchronizationResult,
} from '../catalog/catalogSynchronizationResult.js';
import type {
  DeviceCatalog,
} from '../catalog/deviceCatalog.js';
import {
  ClimateDeviceCatalogMapper,
} from '../mappers/climateDeviceCatalogMapper.js';
import type {
  ClimateDevice,
} from '../models/climateDevice.js';

export class CatalogManager {
  private catalogLoaded =
    false;

  private readonly climateDeviceCatalogMapper =
    new ClimateDeviceCatalogMapper();

  constructor(
    private readonly deviceCatalog:
      DeviceCatalog,
    private readonly log:
      Logging,
  ) {}

  public async synchronizeClimateDevices(
    climateDevices:
      ClimateDevice[],
  ): Promise<CatalogSynchronizationResult> {
    await this.load();

    const discoveredCatalogDevices =
      this.climateDeviceCatalogMapper
        .toDiscoveredCatalogDevices(
          climateDevices,
        );

    const synchronizationResult =
      this.deviceCatalog.synchronize(
        discoveredCatalogDevices,
      );

    await this.deviceCatalog.save();

    return synchronizationResult;
  }

  public async load():
    Promise<void> {
    if (this.catalogLoaded) {
      return;
    }

    await this.deviceCatalog.load();

    this.catalogLoaded =
      true;

    this.log.info(
      `${this.deviceCatalog.getAll().length} appareils chargés depuis le catalogue`,
    );
  }

  public async save():
    Promise<void> {
    await this.load();

    await this.deviceCatalog.save();
  }

  public async getAll():
    Promise<CatalogDevice[]> {
    await this.load();

    return this.deviceCatalog
      .getAll();
  }

  public async get(
    id: string,
  ): Promise<CatalogDevice | undefined> {
    await this.load();

    return this.deviceCatalog
      .get(
        id,
      );
  }

  public async has(
    id: string,
  ): Promise<boolean> {
    await this.load();

    return this.deviceCatalog
      .has(
        id,
      );
  }

  public async isEnabled(
    id: string,
  ): Promise<boolean> {
    await this.load();

    return this.deviceCatalog
      .isEnabled(
        id,
      );
  }

  public async isHidden(
    id: string,
  ): Promise<boolean> {
    await this.load();

    return this.deviceCatalog
      .isHidden(
        id,
      );
  }

  public async isFavorite(
    id: string,
  ): Promise<boolean> {
    await this.load();

    return this.deviceCatalog
      .isFavorite(
        id,
      );
  }

  public async shouldPublish(
    id: string,
  ): Promise<boolean> {
    await this.load();

    return this.deviceCatalog
      .shouldPublish(
        id,
      );
  }

  public async setEnabled(
    id: string,
    enabled: boolean,
  ): Promise<boolean> {
    await this.load();

    return this.deviceCatalog
      .setEnabled(
        id,
        enabled,
      );
  }

  public async setHidden(
    id: string,
    hidden: boolean,
  ): Promise<boolean> {
    await this.load();

    return this.deviceCatalog
      .setHidden(
        id,
        hidden,
      );
  }

  public async setFavorite(
    id: string,
    favorite: boolean,
  ): Promise<boolean> {
    await this.load();

    return this.deviceCatalog
      .setFavorite(
        id,
        favorite,
      );
  }

  public async setRoom(
    id: string,
    room?: string,
  ): Promise<boolean> {
    await this.load();

    return this.deviceCatalog
      .setRoom(
        id,
        room,
      );
  }

  public getCatalog():
    DeviceCatalog {
    return this.deviceCatalog;
  }
}