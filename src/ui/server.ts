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
      '/catalog/device/favorite',
      async payload =>
        this.setDeviceFavorite(
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