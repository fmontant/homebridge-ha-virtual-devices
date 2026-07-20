import { watch } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import {
  HomebridgePluginUiServer,
} from '@homebridge/plugin-ui-utils';

import {
  DeviceCatalogStore,
} from '../catalog/deviceCatalogStore.js';

import type {
  CatalogApiDevice,
} from './catalogApi.js';

import {
  CatalogApiMapper,
} from './catalogApiMapper.js';

import {
  CatalogEventPublisher,
} from './catalogEventPublisher.js';

import {
  CatalogSorter,
} from './catalogSorter.js';

interface FavoriteRequestPayload {
  id: string;
  favorite: boolean;
}

interface FavoriteResponsePayload {
  device: CatalogApiDevice;
}

interface DeviceRequestPayload {
  id: string;
}

interface PreferencesUpdatePayload {
  enabled?: boolean;
  favorite?: boolean;
  archived?: boolean;
  room?: string;
}

interface PreferencesRequestPayload {
  id: string;
  preferences: PreferencesUpdatePayload;
}

export class HAVirtualDevicesUiServer
  extends HomebridgePluginUiServer {

  private readonly catalogEvents:
    CatalogEventPublisher;

  private readonly catalogApiMapper =
    new CatalogApiMapper();

  private readonly catalogSorter =
    new CatalogSorter();

  private catalogDirectoryPath?:
    string;

  private catalogStore?:
    DeviceCatalogStore;

  private catalogWatcher?:
    ReturnType<typeof watch>;

  private publicationTimer?:
    NodeJS.Timeout;

  constructor() {
    super();

    this.catalogEvents =
      new CatalogEventPublisher(
        (event, data) => {
          this.pushEvent(
            event,
            data,
          );
        },
      );

    this.onRequest(
      '/catalog/devices',
      async () => ({
        devices:
          await this.loadCatalog(),
        updatedAt:
          new Date().toISOString(),
      }),
    );

    this.onRequest(
      '/catalog/device',
      async payload =>
        this.getDevice(
          payload,
        ),
    );

    this.onRequest(
      '/catalog/device/favorite',
      async payload =>
        this.setDeviceFavorite(
          payload,
        ),
    );

    this.onRequest(
      '/catalog/preferences',
      async payload =>
        this.updatePreferences(
          payload,
        ),
    );

    void this.initialize();
  }

  private async initialize():
    Promise<void> {
    try {
      const homebridgeStoragePath =
        this.homebridgeStoragePath;

      if (
        !homebridgeStoragePath
      ) {
        throw new Error(
          'Chemin de stockage Homebridge indisponible',
        );
      }

      this.catalogDirectoryPath =
        join(
          homebridgeStoragePath,
          'ha-virtual-devices',
        );

      const catalogFilePath =
        join(
          this.catalogDirectoryPath,
          'device-catalog.json',
        );

      this.catalogStore =
        new DeviceCatalogStore(
          catalogFilePath,
        );

      await mkdir(
        this.catalogDirectoryPath,
        {
          recursive: true,
        },
      );

      this.startCatalogWatcher();

      this.ready();

      await this.publishCatalog();
    } catch (error) {
      console.error(
        'Impossible d’initialiser la surveillance du catalogue :',
        error instanceof Error
          ? error.message
          : String(error),
      );

      this.ready();
    }
  }

  private startCatalogWatcher():
    void {
    if (
      !this.catalogDirectoryPath
    ) {
      return;
    }

    this.catalogWatcher =
      watch(
        this.catalogDirectoryPath,
        () => {
          this.scheduleCatalogPublication();
        },
      );

    this.catalogWatcher.on(
      'error',
      error => {
        console.error(
          'Erreur pendant la surveillance du catalogue :',
          error.message,
        );
      },
    );
  }

  private scheduleCatalogPublication():
    void {
    if (
      this.publicationTimer
    ) {
      clearTimeout(
        this.publicationTimer,
      );
    }

    this.publicationTimer =
      setTimeout(
        () => {
          this.publicationTimer =
            undefined;

          void this.publishCatalog();
        },
        250,
      );
  }

  private async loadCatalog():
    Promise<CatalogApiDevice[]> {
    if (
      !this.catalogStore
    ) {
      throw new Error(
        'Catalogue non initialisé',
      );
    }

    const devices =
      await this.catalogStore
        .load();

    const apiDevices =
      devices.map(
        device =>
          this.catalogApiMapper
            .toApiDevice(
              device,
            ),
      );

    return this.catalogSorter
      .sort(
        apiDevices,
      );
  }

  private async getDevice(
    payload: unknown,
  ): Promise<FavoriteResponsePayload> {
    if (
      !this.catalogStore
    ) {
      throw new Error(
        'Catalogue non initialisé',
      );
    }

    const request =
      this.parseDeviceRequest(
        payload,
      );

    const devices =
      await this.catalogStore
        .load();

    const device =
      devices.find(
        value =>
          value.id ===
          request.id,
      );

    if (!device) {
      throw new Error(
        `Appareil introuvable : ${request.id}`,
      );
    }

    return {
      device:
        this.catalogApiMapper
          .toApiDevice(
            device,
          ),
    };
  }

  private async setDeviceFavorite(
    payload: unknown,
  ): Promise<FavoriteResponsePayload> {
    if (
      !this.catalogStore
    ) {
      throw new Error(
        'Catalogue non initialisé',
      );
    }

    const request =
      this.parseFavoriteRequest(
        payload,
      );

    const devices =
      await this.catalogStore
        .load();

    const device =
      devices.find(
        value =>
          value.id ===
          request.id,
      );

    if (!device) {
      throw new Error(
        `Appareil introuvable : ${request.id}`,
      );
    }

    device.preferences.favorite =
      request.favorite;

    await this.catalogStore
      .save(
        devices,
      );

    await this.publishCatalog();

    return {
      device:
        this.catalogApiMapper
          .toApiDevice(
            device,
          ),
    };
  }

  private async updatePreferences(
    payload: unknown,
  ): Promise<FavoriteResponsePayload> {
    if (
      !this.catalogStore
    ) {
      throw new Error(
        'Catalogue non initialisé',
      );
    }

    const request =
      this.parsePreferencesRequest(
        payload,
      );

    const devices =
      await this.catalogStore
        .load();

    const device =
      devices.find(
        value =>
          value.id ===
          request.id,
      );

    if (!device) {
      throw new Error(
        `Appareil introuvable : ${request.id}`,
      );
    }

    if (
      request.preferences.enabled !==
        undefined
    ) {
      device.preferences.enabled =
        request.preferences.enabled;
    }

    if (
      request.preferences.favorite !==
        undefined
    ) {
      device.preferences.favorite =
        request.preferences.favorite;
    }

    if (
      request.preferences.archived !==
        undefined
    ) {
      device.preferences.archived =
        request.preferences.archived;
    }

    if (
      request.preferences.room !==
        undefined
    ) {
      device.preferences.room =
        request.preferences.room;
    }

    await this.catalogStore
      .save(
        devices,
      );

    await this.publishCatalog();

    return {
      device:
        this.catalogApiMapper
          .toApiDevice(
            device,
          ),
    };
  }

  private parseDeviceRequest(
    payload: unknown,
  ): DeviceRequestPayload {
    if (
      typeof payload !==
        'object' ||
      payload === null
    ) {
      throw new Error(
        'Requête invalide',
      );
    }

    const request =
      payload as Partial<
        DeviceRequestPayload
      >;

    if (
      typeof request.id !==
        'string'
    ) {
      throw new Error(
        'Identifiant invalide',
      );
    }

    return {
      id:
        request.id,
    };
  }

  private parsePreferencesRequest(
    payload: unknown,
  ): PreferencesRequestPayload {
    if (
      typeof payload !==
        'object' ||
      payload === null
    ) {
      throw new Error(
        'Requête invalide',
      );
    }

    const request =
      payload as Partial<
        PreferencesRequestPayload
      >;

    if (
      typeof request.id !==
        'string'
    ) {
      throw new Error(
        'Identifiant invalide',
      );
    }

    if (
      typeof request.preferences !==
        'object' ||
      request.preferences === null
    ) {
      throw new Error(
        'Préférences invalides',
      );
    }

    const preferences =
      request.preferences as
        PreferencesUpdatePayload;

    if (
      preferences.enabled !==
        undefined &&
      typeof preferences.enabled !==
        'boolean'
    ) {
      throw new Error(
        'Valeur enabled invalide',
      );
    }

    if (
      preferences.favorite !==
        undefined &&
      typeof preferences.favorite !==
        'boolean'
    ) {
      throw new Error(
        'Valeur favorite invalide',
      );
    }

    if (
      preferences.archived !==
        undefined &&
      typeof preferences.archived !==
        'boolean'
    ) {
      throw new Error(
        'Valeur archived invalide',
      );
    }

    if (
      preferences.room !==
        undefined &&
      typeof preferences.room !==
        'string'
    ) {
      throw new Error(
        'Valeur room invalide',
      );
    }

    return {
      id:
        request.id,
      preferences: {
        enabled:
          preferences.enabled,
        favorite:
          preferences.favorite,
        archived:
          preferences.archived,
        room:
          preferences.room,
      },
    };
  }

  private parseFavoriteRequest(
    payload: unknown,
  ): FavoriteRequestPayload {
    if (
      typeof payload !==
        'object' ||
      payload === null
    ) {
      throw new Error(
        'Requête invalide',
      );
    }

    const request =
      payload as Partial<
        FavoriteRequestPayload
      >;

    if (
      typeof request.id !==
        'string'
    ) {
      throw new Error(
        'Identifiant invalide',
      );
    }

    if (
      typeof request.favorite !==
        'boolean'
    ) {
      throw new Error(
        'Valeur favorite invalide',
      );
    }

    return {
      id:
        request.id,
      favorite:
        request.favorite,
    };
  }

  private async publishCatalog():
    Promise<void> {
    console.log(
      '[UI] publishCatalog déclenché',
    );

    if (
      !this.catalogStore
    ) {
      return;
    }

    try {
      const devices =
        await this.loadCatalog();

      this.catalogEvents
        .publish(
          devices,
        );
    } catch (error) {
      console.error(
        'Impossible de publier la mise à jour du catalogue :',
        error instanceof Error
          ? error.message
          : String(error),
      );
    }
  }
}

new HAVirtualDevicesUiServer();