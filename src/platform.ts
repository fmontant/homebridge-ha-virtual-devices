import {
  mkdirSync,
  watch,
  type FSWatcher,
} from 'node:fs';
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

import type { MatterProvider } from './matter/provider.js';

import { EveHomeKitTypes } from 'homebridge-lib/EveHomeKitTypes';

import { DeviceCatalog } from './catalog/deviceCatalog.js';
import { DeviceCatalogStore } from './catalog/deviceCatalogStore.js';
import { PluginStateStore } from './catalog/pluginStateStore.js';
import { MatterCommissioningStore } from './matter/commissioningStore.js';
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

  private readonly matterCommissioningStore:
    MatterCommissioningStore;

  private readonly deviceCatalog:
    DeviceCatalog;

  private readonly catalogManager:
    CatalogManager;

  private readonly registryManager:
    RegistryManager;

  private matterProvider?:
    MatterProvider;

  private catalogWatcher?:
    FSWatcher;

  private catalogReloadTimer?:
    NodeJS.Timeout;

  private matterCommissioningInProgress =
    false;

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

    this.matterCommissioningStore =
      new MatterCommissioningStore(
        join(
          this.api.user.storagePath(),
          'ha-virtual-devices',
          'matter-commissioning-request.json',
        ),
        join(
          this.api.user.storagePath(),
          'ha-virtual-devices',
          'matter-commissioning-response.json',
        ),
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

  private async getMatterProvider():
    Promise<MatterProvider> {
    if (this.matterProvider) {
      return this.matterProvider;
    }

    const { MatterProvider } =
      await import('./matter/provider.js');

    this.matterProvider =
      new MatterProvider(
        this.accessoryManager,
        this.catalogManager,
        this.registryManager,
        this.log,
        join(
          this.api.user.storagePath(),
          'ha-virtual-devices',
          'matter',
        ),
        join(
          this.api.user.storagePath(),
          'ha-virtual-devices',
          'matter-device-names.json',
        ),
      );

    return this.matterProvider;
  }

  private async didFinishLaunching():
    Promise<void> {
    this.log.info(
      'HA Virtual Devices démarré',
    );

    const haUrl =
      typeof this.config.haUrl ===
        'string'
        ? this.config.haUrl.trim()
        : '';

    const token =
      typeof this.config.token ===
        'string'
        ? this.config.token.trim()
        : '';

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

    try {
      const matterProvider =
        await this.getMatterProvider();

      await matterProvider.start();
      this.log.info(
        'Provider Matter démarré',
      );
    } catch (error) {
      this.log.error(
        'Impossible de démarrer le provider Matter :',
        error instanceof Error
          ? error.message
          : String(error),
      );
    }

    if (!haUrl || !token) {
      this.log.warn(
        'Configuration Home Assistant incomplète. ' +
        'Le provider Home Assistant ne sera pas démarré.',
      );

      return;
    }

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

    try {
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
    } catch (error) {
      this.log.error(
        'Impossible de charger les états Home Assistant :',
        error instanceof Error
          ? error.message
          : String(error),
      );
    }
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
    const catalogDirectoryPath =
      join(
        this.api.user.storagePath(),
        'ha-virtual-devices',
      );

    mkdirSync(
      catalogDirectoryPath,
      {
        recursive: true,
      },
    );

    this.catalogWatcher?.close();

    this.catalogWatcher =
      watch(
        catalogDirectoryPath,
        (
          _eventType,
          filename,
        ) => {
          if (
            filename ===
            'matter-commissioning-request.json'
          ) {
            void this
              .processMatterCommissioningRequest()
              .catch(error => {
                this.log.error(
                  'Erreur pendant le commissioning Matter :',
                  error instanceof Error
                    ? error.message
                    : String(error),
                );
              });

            return;
          }

          if (
            filename &&
            filename !==
            'device-catalog.json'
          ) {
            return;
          }

          if (
            this.catalogReloadTimer
          ) {
            clearTimeout(
              this.catalogReloadTimer,
            );
          }

          this.catalogReloadTimer =
            setTimeout(
              () => {
                this.catalogReloadTimer =
                  undefined;

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
              },
              250,
            );
        },
      );

    this.catalogWatcher.on(
      'error',
      error => {
        this.log.error(
          'Erreur pendant la surveillance du catalogue :',
          error.message,
        );
      },
    );

    this.api.on(
      'shutdown',
      () => {
        if (
          this.catalogReloadTimer
        ) {
          clearTimeout(
            this.catalogReloadTimer,
          );

          this.catalogReloadTimer =
            undefined;
        }

        this.homeAssistantWebSocketClient
          .close();

        void this.matterProvider
          ?.stop()
          .catch(error => {
            this.log.error(
              'Erreur pendant l’arrêt du provider Matter :',
              error instanceof Error
                ? error.message
                : String(error),
            );
          });

        this.catalogWatcher?.close();
        this.catalogWatcher =
          undefined;
      },
    );
  }

  private async processMatterCommissioningRequest():
    Promise<void> {
    if (
      this.matterCommissioningInProgress
    ) {
      return;
    }

    this.matterCommissioningInProgress =
      true;

    try {
      const request =
        await this.matterCommissioningStore
          .loadRequest();

      if (!request) {
        return;
      }

      try {
        const matterProvider =
          await this.getMatterProvider();

        const descriptor =
          await matterProvider.commission(
            request.pairingCode,
          );

        await this.matterCommissioningStore
          .saveResponse({
            id: request.id,
            success: true,
            completedAt:
              new Date().toISOString(),
            deviceId:
              descriptor.id,
            deviceName:
              descriptor.name,
          });
      } catch (error) {
        await this.matterCommissioningStore
          .saveResponse({
            id: request.id,
            success: false,
            completedAt:
              new Date().toISOString(),
            error:
              error instanceof Error
                ? error.message
                : String(error),
          });
      } finally {
        await this.matterCommissioningStore
          .deleteRequest();
      }
    } finally {
      this.matterCommissioningInProgress =
        false;
    }
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
