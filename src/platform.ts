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

import { AccessoryFactory } from './factories/accessoryFactory.js';
import { HomeAssistantClient } from './homeassistant/client.js';
import { HomeAssistantWebSocketClient } from './homeassistant/websocketClient.js';
import { AccessoryManager } from './managers/accessoryManager.js';
import { DiscoveryManager } from './managers/discoveryManager.js';
import { EventManager } from './managers/eventManager.js';
import { RegistryManager } from './managers/registryManager.js';
import {
  type HomeAssistantState,
  ClimateDeviceManager,
} from './managers/ClimateDeviceManager.js';

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

  private readonly registryManager:
    RegistryManager;

  private registryRefreshTimer?:
    ReturnType<typeof setInterval>;

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
      new AccessoryFactory(this);

    this.discoveryManager =
      new DiscoveryManager(
        this.log,
      );

    this.accessoryManager =
      new AccessoryManager(
        this.api,
        this.log,
        this.accessoryFactory,
        this.accessories,
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
        this.log,
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

    this.api.on(
      'shutdown',
      () => {
        this.stopRegistryRefresh();
      },
    );
  }

  private async didFinishLaunching():
  Promise<void> {
    this.log.info(
      'HA Virtual Devices démarré',
    );

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

    this.startRegistryRefresh();
  }

  private configureWebSocketListeners():
  void {
    this.homeAssistantWebSocketClient
      .onEvent(event => {
        this.eventManager
          .handleEvent(event);
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
        this.registryManager
          .handleEntityRegistry(
            entries,
          );
      });
  }

  private startRegistryRefresh(): void {
    this.stopRegistryRefresh();

    this.registryRefreshTimer =
      setInterval(
        () => {
          this.log.info(
            'Actualisation automatique des registres Home Assistant',
          );

          this.homeAssistantWebSocketClient
            .getDeviceRegistry();
        },
        5 * 60 * 1000,
      );
  }

  private stopRegistryRefresh(): void {
    if (!this.registryRefreshTimer) {
      return;
    }

    clearInterval(
      this.registryRefreshTimer,
    );

    this.registryRefreshTimer =
      undefined;
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