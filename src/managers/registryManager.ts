import type { Logging } from 'homebridge';

import type {
  CatalogDevice,
} from '../catalog/catalogDevice.js';

import type {
  ClimateDevice,
} from '../models/climateDevice.js';

import type {
  DeviceRegistryEntry,
} from '../models/deviceRegistryEntry.js';

import type {
  EntityRegistryEntry,
} from '../models/entityRegistryEntry.js';

import type {
  AccessoryManager,
} from './accessoryManager.js';

import type {
  CatalogManager,
} from './catalogManager.js';

import type {
  ClimateDeviceManager,
} from './ClimateDeviceManager.js';

import type {
  DiscoveryManager,
} from './discoveryManager.js';

export class RegistryManager {
  private deviceRegistry:
    DeviceRegistryEntry[] = [];

  private readonly ignoredDevices:
    Set<string>;

  private initialSynchronizationCompleted =
    false;

  private synchronizationQueue:
    Promise<void> =
      Promise.resolve();

  private readonly lastClimateDevices =
    new Map<string, ClimateDevice>();

  private catalogPublicationState =
    new Map<string, string>();

  constructor(
    private readonly discoveryManager:
      DiscoveryManager,
    private readonly climateDeviceManager:
      ClimateDeviceManager,
    private readonly accessoryManager:
      AccessoryManager,
    private readonly catalogManager:
      CatalogManager,
    private readonly log:
      Logging,
    ignoredDevices:
      string[],
  ) {
    this.ignoredDevices =
      new Set(
        ignoredDevices
          .map(value =>
            value
              .trim()
              .toLowerCase(),
          )
          .filter(value =>
            value.length > 0,
          ),
      );
  }

  public handleDeviceRegistry(
    devices: DeviceRegistryEntry[],
  ): void {
    this.deviceRegistry =
      [...devices];

    this.log.info(
      `${devices.length} appareils enregistrés dans le gestionnaire de registres`,
    );
  }

  public async handleEntityRegistry(
    entries: EntityRegistryEntry[],
  ): Promise<void> {
    const synchronization =
      this.synchronizationQueue
        .then(() =>
          this.synchronizeEntityRegistry(
            entries,
          ),
        );

    this.synchronizationQueue =
      synchronization
        .catch(() => undefined);

    await synchronization;
  }

  public async refreshFromCatalog():
    Promise<void> {
    if (
      this.lastClimateDevices.size === 0
    ) {
      this.log.warn(
        'Impossible de rafraîchir les accessoires : aucun appareil climatique mémorisé',
      );

      return;
    }

    const previousPublicationState =
      new Map(
        this.catalogPublicationState,
      );

    await this.catalogManager
      .reload();

    const deviceCatalog =
      this.catalogManager
        .getCatalog();

    const catalogDevices =
      deviceCatalog.getAll();

    const currentPublicationState =
      this.createCatalogPublicationState(
        catalogDevices,
      );

    let updatedAccessoryCount = 0;

    for (
      const catalogDevice
      of catalogDevices
    ) {
      const previousState =
        previousPublicationState.get(
          catalogDevice.id,
        );

      const currentState =
        currentPublicationState.get(
          catalogDevice.id,
        );

      if (
        previousState ===
        currentState
      ) {
        continue;
      }

      const climateDevice =
        this.lastClimateDevices.get(
          catalogDevice.id,
        );

      if (!climateDevice) {
        this.log.warn(
          `Impossible d’appliquer les préférences : appareil climatique introuvable pour ${catalogDevice.name}`,
        );

        continue;
      }

      this.accessoryManager
        .applyCatalogDevice(
          climateDevice,
          catalogDevice,
          deviceCatalog,
        );

      updatedAccessoryCount += 1;
    }

    for (
      const deviceId
      of previousPublicationState.keys()
    ) {
      if (
        currentPublicationState.has(
          deviceId,
        )
      ) {
        continue;
      }

      if (
        this.accessoryManager
          .removeClimateAccessory(
            deviceId,
          )
      ) {
        updatedAccessoryCount += 1;
      }
    }

    this.catalogPublicationState =
      currentPublicationState;

    if (
      updatedAccessoryCount === 0
    ) {
      this.log.debug(
        'Aucune préférence de publication modifiée',
      );

      return;
    }

    this.log.info(
      `${updatedAccessoryCount} accessoire(s) mis à jour depuis le catalogue`,
    );
  }

  private async synchronizeEntityRegistry(
    entries: EntityRegistryEntry[],
  ): Promise<void> {
    if (
      this.deviceRegistry.length === 0
    ) {
      this.log.warn(
        'Registre des entités ignoré : registre des appareils vide',
      );

      return;
    }

    const discoveredClimateDevices =
      this.discoveryManager
        .discoverClimateDevices(
          entries,
          this.deviceRegistry,
        );

    const climateDevices =
      this.prepareClimateDevices(
        discoveredClimateDevices,
      );

    this.lastClimateDevices.clear();

    for (
      const climateDevice
      of climateDevices
    ) {
      this.lastClimateDevices.set(
        climateDevice.id,
        climateDevice,
      );
    }

    this.log.info(
      `${climateDevices.length} appareils climatiques préparés pour la synchronisation`,
    );

    const synchronizationResult =
      await this.catalogManager
        .synchronizeClimateDevices(
          climateDevices,
        );

    const deviceCatalog =
      this.catalogManager
        .getCatalog();

    if (
      !this.initialSynchronizationCompleted
    ) {
      this.accessoryManager
        .restoreClimateAccessories(
          climateDevices,
          deviceCatalog,
        );

      this.initialSynchronizationCompleted =
        true;
    } else {
      this.accessoryManager
        .applyClimateSynchronization(
          climateDevices,
          synchronizationResult,
          deviceCatalog,
        );
    }

    this.catalogPublicationState =
      this.createCatalogPublicationState(
        deviceCatalog.getAll(),
      );

    this.log.info(
      synchronizationResult.summary(),
    );
  }

  private createCatalogPublicationState(
    catalogDevices: CatalogDevice[],
  ): Map<string, string> {
    return new Map(
      catalogDevices.map(
        catalogDevice => [
          catalogDevice.id,
          JSON.stringify({
            name:
              catalogDevice.name,
            enabled:
              catalogDevice.preferences
                .enabled,
            archived:
              catalogDevice.preferences
                .archived,
          }),
        ],
      ),
    );
  }

  private prepareClimateDevices(
    climateDevices: ClimateDevice[],
  ): ClimateDevice[] {
    const preparedDevices:
      ClimateDevice[] = [];

    let ignoredDeviceCount = 0;

    for (
      const climateDevice
      of climateDevices
    ) {
      const preparedClimateDevice =
        this.climateDeviceManager
          .prepareClimateDevice(
            climateDevice,
          );

      if (
        this.isIgnoredDevice(
          preparedClimateDevice.id,
          preparedClimateDevice.name,
        )
      ) {
        ignoredDeviceCount += 1;

        this.log.info(
          `Appareil ignoré : ${preparedClimateDevice.name}`,
        );

        continue;
      }

      preparedDevices.push(
        preparedClimateDevice,
      );
    }

    if (
      ignoredDeviceCount > 0
    ) {
      this.log.info(
        `${ignoredDeviceCount} appareils ignorés par la configuration`,
      );
    }

    return preparedDevices;
  }

  private isIgnoredDevice(
    deviceId: string,
    deviceName: string,
  ): boolean {
    const normalizedId =
      deviceId
        .trim()
        .toLowerCase();

    const normalizedName =
      deviceName
        .trim()
        .toLowerCase();

    return (
      this.ignoredDevices.has(
        normalizedId,
      ) ||
      this.ignoredDevices.has(
        normalizedName,
      )
    );
  }
}
