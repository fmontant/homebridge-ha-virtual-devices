import { watch, type FSWatcher } from 'node:fs';
import { join } from 'node:path';

import type {
  API,
  Characteristic,
  DynamicPlatformPlugin,
  Logging,
  PlatformAccessory,
  PlatformConfig,
  Service,
} from 'homebridge';

import { EveHomeKitTypes } from 'homebridge-lib/EveHomeKitTypes';

import { DeviceCatalog } from './catalog/deviceCatalog.js';
import { DeviceCatalogStore } from './catalog/deviceCatalogStore.js';
import { PluginStateStore } from './catalog/pluginStateStore.js';
import { AccessoryFactory } from './factories/accessoryFactory.js';
import { HomeAssistantClient } from './homeassistant/client.js';
import { HomeAssistantWebSocketClient } from './homeassistant/websocketClient.js';
import { AccessoryManager } from './managers/accessoryManager.js';
import { CatalogManager } from './managers/catalogManager.js';
import {
  type HomeAssistantState,
  ClimateDeviceManager,
} from './managers/ClimateDeviceManager.js';
import { DiscoveryManager } from './managers/discoveryManager.js';
import { EventManager } from './managers/eventManager.js';
import { RegistryManager } from './managers/registryManager.js';

export class HAVirtualDevicesPlatform
implements DynamicPlatformPlugin {
  public readonly Service:
    typeof Service;

  public readonly Characteristic:
    typeof Characteristic;

  public readonly accessories:
    Map<string, PlatformAccessory> =
      new Map();

  public readonly discoveredCacheUUIDs:
    string[] = [];

  private readonly homeAssistantClient:
    HomeAssistantClient;

  private readonly homeAssistantWebSocketClient:
    HomeAssistantWebSocketClient;

  private readonly accessoryFactory:
    AccessoryFactory;

  private readonly discoveryManager:
    DiscoveryManager;

  private readonly accessoryManager:
    AccessoryManager;

  private readonly eventManager:
    EventManager;

  private readonly climateDeviceManager:
    ClimateDeviceManager;

  private readonly deviceCatalogStore:
    DeviceCatalogStore;

  private readonly pluginStateStore:
    PluginStateStore;


  private readonly deviceCatalog:
    DeviceCatalog;

  private readonly catalogManager:
    CatalogManager;

  private readonly registryManager:
    RegistryManager;

  private catalogWatcher?:
    FSWatcher;

  private catalogReloadTimer?:
    NodeJS.Timeout;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public readonly CustomServices: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public readonly CustomCharacteristics: any;

  constructor(
    public readonly log: Logging,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.Service =
      api.hap.Service;

    this.Characteristic =
      api.hap.Characteristic;

    const homeAssistantConfig = {
      haUrl: String(
        this.config.haUrl ?? '',
      ),
      token: String(
        this.config.token ?? '',
      ),
      debug: Boolean(
        this.config.debug,
      ),
    };

    const ignoredDevices =
      this.readIgnoredDevices();

    this.homeAssistantClient =
      new HomeAssistantClient(
        homeAssistantConfig,
        this.log,
      );

    this.homeAssistantWebSocketClient =
      new HomeAssistantWebSocketClient(
        homeAssistantConfig,
        this.log,
      );

    this.accessoryFactory =
      new AccessoryFactory(
        this,
      );

    this.discoveryManager =
      new DiscoveryManager(
        this.log,
      );

    const catalogFilePath =
      join(
        this.api.user.storagePath(),
        'ha-virtual-devices',
        'device-catalog.json',
      );

    const pluginStateFilePath =
      join(
        this.api.user.storagePath(),
        'ha-virtual-devices',
        'plugin-state.json',
      );

    this.deviceCatalogStore =
      new DeviceCatalogStore(
        catalogFilePath,
      );

    this.pluginStateStore =
      new PluginStateStore(
        pluginStateFilePath,
      );

    this.deviceCatalog =
      new DeviceCatalog(
        this.deviceCatalogStore,
      );

    this.catalogManager =
  new CatalogManager(
    this.deviceCatalog,
    this.pluginStateStore,
    this.log,
  );

    this.accessoryManager =
      new AccessoryManager(
        this.api,
        this.log,
        this.accessoryFactory,
        this.accessories,
        this.catalogManager,
      );

    this.eventManager =
      new EventManager(
        this.accessoryManager,
        this.log,
      );

    this.climateDeviceManager =
      new ClimateDeviceManager(
        this.log,
      );

    this.registryManager =
      new RegistryManager(
        this.discoveryManager,
        this.climateDeviceManager,
        this.accessoryManager,
        this.catalogManager,
        this.log,
        ignoredDevices,
      );

    const eveHomeKitTypes =
      new EveHomeKitTypes(
        this.api,
      );

    this.CustomServices =
      eveHomeKitTypes.Services;

    this.CustomCharacteristics =
      eveHomeKitTypes.Characteristics;

    this.configureWebSocketListeners();

    this.api.on(
      'didFinishLaunching',
      async () => {
        await this.didFinishLaunching();
      },
    );
  }

  private async didFinishLaunching():
    Promise<void> {
    this.log.info(
      'HA Virtual Devices démarré',
    );

    try {
      await this.deviceCatalog.load();

      this.log.info(
        `${this.deviceCatalog.getAll().length} appareils chargés depuis le catalogue`,
      );
    } catch (error) {
      this.log.error(
        'Impossible de charger le catalogue des appareils :',
        error instanceof Error
          ? error.message
          : String(error),
      );

      return;
    }

    this.startCatalogWatcher();

    this.log.info(
      'Test de connexion à Home Assistant...',
    );

    const connected =
      await this.homeAssistantClient
        .testConnection();

    if (!connected) {
      this.log.error(
        'Impossible de se connecter à Home Assistant',
      );

      return;
    }

    this.log.info(
      'Connexion réussie',
    );

    const states =
      await this.homeAssistantClient
        .getStates();

    this.climateDeviceManager
      .loadInitialStates(
        states as HomeAssistantState[],
      );

    this.log.info(
      `${states.length} entités Home Assistant détectées`,
    );

    this.homeAssistantWebSocketClient
      .connect();
  }

  private configureWebSocketListeners():
    void {
    this.homeAssistantWebSocketClient
      .onEvent(event => {
        this.eventManager
          .handleEvent(
            event,
          );
      });

    this.homeAssistantWebSocketClient
      .onDeviceRegistry(devices => {
        this.registryManager
          .handleDeviceRegistry(
            devices,
          );

        this.homeAssistantWebSocketClient
          .getEntityRegistry();
      });

    this.homeAssistantWebSocketClient
      .onEntityRegistry(entries => {
        const climateEntries =
          entries.filter(entry =>
            entry.deviceId &&
            (
              entry.entityId.includes(
                'temperature',
              ) ||
              entry.entityId.includes(
                'humidite',
              ) ||
              entry.entityId.includes(
                'humidity',
              ) ||
              entry.entityId.includes(
                'batterie',
              ) ||
              entry.entityId.includes(
                'battery',
              )
            ),
          );

        this.log.info(
          `${climateEntries.length} entités climatiques détectées`,
        );

        void this.registryManager
          .handleEntityRegistry(
            entries,
          )
          .catch(error => {
            this.log.error(
              'Erreur pendant la synchronisation du catalogue :',
              error instanceof Error
                ? error.message
                : String(error),
            );
          });
      });
  }


  private startCatalogWatcher():
    void {
    const catalogPath =
      join(
        this.api.user.storagePath(),
        'ha-virtual-devices',
        'device-catalog.json',
      );

    this.catalogWatcher?.close();

    this.catalogWatcher =
      watch(
        catalogPath,
        () => {
          if (
            this.catalogReloadTimer
          ) {
            clearTimeout(
              this.catalogReloadTimer,
            );
          }

          this.catalogReloadTimer =
            setTimeout(() => {
              void this.registryManager
                .refreshFromCatalog()
                .catch(error => {
                  this.log.error(
                    'Erreur lors du rechargement du catalogue :',
                    error instanceof Error
                      ? error.message
                      : String(error),
                  );
                });
            }, 250);
        },
      );

    this.api.on(
      'shutdown',
      () => {
        this.catalogWatcher?.close();
      },
    );
  }

  private readIgnoredDevices():
    string[] {
    const configuredValue =
      this.config.ignoredDevices;

    if (!Array.isArray(configuredValue)) {
      return [];
    }

    return configuredValue
      .filter(
        (
          value,
        ): value is string =>
          typeof value === 'string',
      )
      .map(value =>
        value.trim(),
      )
      .filter(value =>
        value.length > 0,
      );
  }

  configureAccessory(
    accessory: PlatformAccessory,
  ): void {
    this.log.info(
      'Chargement depuis le cache :',
      accessory.displayName,
    );

    this.accessories.set(
      accessory.UUID,
      accessory,
    );
  }
}
