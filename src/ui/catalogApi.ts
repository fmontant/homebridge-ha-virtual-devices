import type {
  CatalogDeviceState,
  DeviceCapability,
  DeviceMetadata,
  DevicePreferences,
  DeviceTimestamps,
} from '../catalog/catalogDevice.js';

import type {
  CatalogManager,
} from '../managers/catalogManager.js';

import {
  CatalogApiMapper,
} from './catalogApiMapper.js';

export interface CatalogApiDevice {
  id: string;
  source: string;
  sourceId: string;
  name: string;
  state: CatalogDeviceState;
  capabilities: DeviceCapability[];
  metadata: DeviceMetadata;
  preferences: DevicePreferences;
  timestamps: DeviceTimestamps;
  available: boolean;
  lastCommunication?: string;
  publishable: boolean;
}

export type CatalogApiDevicePreferencesUpdate =
  Partial<DevicePreferences>;

export class CatalogApi {
  private readonly catalogApiMapper =
    new CatalogApiMapper();

  constructor(
    private readonly catalogManager:
      CatalogManager,
  ) {}

  public async getDevices():
    Promise<CatalogApiDevice[]> {
    await this.catalogManager
      .load();

    return this.catalogManager
      .getAll()
      .map(device =>
        this.catalogApiMapper
          .toApiDevice(
            device,
          ),
      );
  }

  public async getDevice(
    id: string,
  ): Promise<CatalogApiDevice | undefined> {
    await this.catalogManager
      .load();

    const device =
      this.catalogManager
        .get(
          id,
        );

    if (!device) {
      return undefined;
    }

    return this.catalogApiMapper
      .toApiDevice(
        device,
      );
  }

  public async updatePreferences(
    id: string,
    preferences:
      CatalogApiDevicePreferencesUpdate,
  ): Promise<CatalogApiDevice | undefined> {
    await this.catalogManager
      .load();

    const device =
      this.catalogManager
        .get(
          id,
        );

    if (!device) {
      return undefined;
    }

    if (
      typeof preferences.enabled ===
        'boolean'
    ) {
      await this.catalogManager
        .setEnabled(
          id,
          preferences.enabled,
        );
    }

    if (
      typeof preferences.hidden ===
        'boolean'
    ) {
      await this.catalogManager
        .setHidden(
          id,
          preferences.hidden,
        );
    }

    if (
      typeof preferences.favorite ===
        'boolean'
    ) {
      await this.catalogManager
        .setFavorite(
          id,
          preferences.favorite,
        );
    }

    if (
      Object.prototype.hasOwnProperty.call(
        preferences,
        'room',
      )
    ) {
      await this.catalogManager
        .setRoom(
          id,
          preferences.room,
        );
    }

    return this.getDevice(
      id,
    );
  }
}