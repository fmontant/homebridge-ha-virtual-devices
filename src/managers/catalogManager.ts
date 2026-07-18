import type {
  Logging,
} from 'homebridge';

import type {
  CatalogDevice,
} from '../catalog/catalogDevice.js';

import type {
  CatalogSynchronizationResult,
} from '../catalog/catalogSynchronizationResult.js';

import type {
  DeviceCatalog,
} from '../catalog/deviceCatalog.js';

import { ClimateDeviceCatalogMapper } from '../mappers/climateDeviceCatalogMapper.js';

import type {
  ClimateDevice,
} from '../models/climateDevice.js';

export class CatalogManager {
  private catalogLoaded =
    false;

  private catalogLoading:
    Promise<void> | undefined;

  private readonly climateDeviceCatalogMapper =
    new ClimateDeviceCatalogMapper();

  constructor(
    private readonly deviceCatalog:
      DeviceCatalog,
    private readonly log:
      Logging,
  ) {}

  public async synchronizeClimateDevices(
    climateDevices: ClimateDevice[],
  ): Promise<CatalogSynchronizationResult> {
    await this.load();

    const discoveredCatalogDevices =
      this.climateDeviceCatalogMapper
        .toDiscoveredCatalogDevices(
          climateDevices,
        );

    const synchronizationResult =
      this.deviceCatalog
        .synchronize(
          discoveredCatalogDevices,
        );

    await this.save();

    this.log.info(
      [
        `${synchronizationResult.added.length} appareils ajoutés`,
        `${synchronizationResult.updated.length} appareils mis à jour`,
        `${synchronizationResult.missing.length} appareils absents`,
      ].join(', '),
    );

    return synchronizationResult;
  }

  public async load():
    Promise<void> {
    if (this.catalogLoaded) {
      return;
    }

    if (this.catalogLoading) {
      await this.catalogLoading;

      return;
    }

    this.catalogLoading =
      this.loadCatalog();

    try {
      await this.catalogLoading;
    } finally {
      this.catalogLoading =
        undefined;
    }
  }

  private async loadCatalog():
    Promise<void> {
    await this.deviceCatalog
      .load();

    this.catalogLoaded =
      true;

    this.log.info(
      `${this.deviceCatalog.getAll().length} appareils chargés depuis le catalogue`,
    );
  }

  public async save():
    Promise<void> {
    await this.load();

    await this.deviceCatalog
      .save();
  }

  public getAll():
    CatalogDevice[] {
    return this.deviceCatalog
      .getAll();
  }

  public get(
    id: string,
  ): CatalogDevice | undefined {
    return this.deviceCatalog
      .get(
        id,
      );
  }

  public has(
    id: string,
  ): boolean {
    return this.deviceCatalog
      .has(
        id,
      );
  }

  public isEnabled(
    id: string,
  ): boolean {
    return this.deviceCatalog
      .isEnabled(
        id,
      );
  }

  public isHidden(
    id: string,
  ): boolean {
    return this.deviceCatalog
      .isHidden(
        id,
      );
  }

  public isFavorite(
    id: string,
  ): boolean {
    return this.deviceCatalog
      .isFavorite(
        id,
      );
  }

  public shouldPublish(
    id: string,
  ): boolean {
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
