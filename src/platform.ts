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

import { ThermostatAccessory } from './accessories/thermostatAccessory.js';
import { ClimateDeviceBuilder } from './builders/climateDeviceBuilder.js';
import { AccessoryFactory } from './factories/accessoryFactory.js';
import { HomeAssistantClient } from './homeassistant/client.js';
import { HomeAssistantWebSocketClient } from './homeassistant/websocketClient.js';
import type { ClimateDevice } from './models/climateDevice.js';
import type { DeviceRegistryEntry } from './models/deviceRegistryEntry.js';
import type { EntityRegistryEntry } from './models/entityRegistryEntry.js';
import type { SensorDevice } from './models/sensorDevice.js';
import {
  PLATFORM_NAME,
  PLUGIN_NAME,
} from './settings.js';

interface HomeAssistantState {
  entity_id: string;
  state: string;
}

export class HAVirtualDevicesPlatform
implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;

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

  private readonly thermostatAccessories:
    Map<string, ThermostatAccessory> =
      new Map();

  private readonly initialStates:
    Map<string, string> =
      new Map();

  private readonly activeAccessoryUUIDs:
    Set<string> =
      new Set();

  private deviceRegistry:
    DeviceRegistryEntry[] = [];

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

    const eveHomeKitTypes =
      new EveHomeKitTypes(this.api);

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

    const homeAssistantStates =
      states as HomeAssistantState[];

    for (
      const state of
      homeAssistantStates
    ) {
      this.initialStates.set(
        state.entity_id,
        state.state,
      );
    }

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
        this.handleHomeAssistantEvent(
          event,
        );
      });

    this.homeAssistantWebSocketClient
      .onDeviceRegistry(devices => {
        this.deviceRegistry =
          devices;

        this.homeAssistantWebSocketClient
          .getEntityRegistry();
      });

    this.homeAssistantWebSocketClient
      .onEntityRegistry(entries => {
        this.handleEntityRegistry(
          entries,
        );
      });
  }

  private handleEntityRegistry(
    entries: EntityRegistryEntry[],
  ): void {
    if (
      this.deviceRegistry.length === 0
    ) {
      return;
    }

    const climateDevices =
      new ClimateDeviceBuilder().build(
        entries,
        this.deviceRegistry,
      );

    this.log.info(
      `${climateDevices.length} capteurs climatiques construits`,
    );

    for (
      const climateDevice of
      climateDevices
    ) {
      const sensorDevice =
        this.prepareSensorDevice(
          climateDevice,
        );

      this.registerThermostatAccessory(
        sensorDevice,
      );
    }

    this.removeObsoleteAccessories();
  }

  private prepareSensorDevice(
    device: ClimateDevice,
  ): SensorDevice {
    return {
      id: device.id,

      name:
        this.normalizeDeviceName(
          device.name,
        ),

      temperatureEntity:
        device.temperatureEntity,

      humidityEntity:
        device.humidityEntity,

      batteryEntity:
        device.batteryEntity,

      temperature:
        this.readNumericState(
          device.temperatureEntity,
        ),

      humidity:
        device.humidityEntity
          ? this.readNumericState(
            device.humidityEntity,
          )
          : undefined,

      batteryLevel:
        device.batteryEntity
          ? this.readNumericState(
            device.batteryEntity,
          )
          : undefined,
    };
  }

  private normalizeDeviceName(
    name: string,
  ): string {
    const normalizedName =
      name
        .replace(
          /^(température|temperature)\s+/i,
          '',
        )
        .replace(
          /\s+(température|temperature)$/i,
          '',
        )
        .trim();

    if (
      normalizedName.length === 0
    ) {
      return name;
    }

    return (
      normalizedName
        .charAt(0)
        .toUpperCase() +
      normalizedName.slice(1)
    );
  }

  private readNumericState(
    entityId: string,
  ): number | undefined {
    const rawValue =
      this.initialStates.get(
        entityId,
      );

    if (
      rawValue === undefined
    ) {
      return undefined;
    }

    const value =
      Number(rawValue);

    return Number.isFinite(value)
      ? value
      : undefined;
  }

  private registerThermostatAccessory(
    device: SensorDevice,
  ): void {
    const uuid =
      this.api.hap.uuid.generate(
        `sensor-v2:${device.id}`,
      );

    this.activeAccessoryUUIDs.add(
      uuid,
    );

    const existingAccessory =
      this.accessories.get(
        uuid,
      );

    let accessory:
      PlatformAccessory;

    if (existingAccessory) {
      this.log.info(
        `Restauration de la tuile : ${device.name}`,
      );

      accessory =
        existingAccessory;

      accessory.context.device =
        device;

      this.api
        .updatePlatformAccessories([
          accessory,
        ]);
    } else {
      this.log.info(
        `Création de la tuile : ${device.name}`,
      );

      accessory =
        new this.api.platformAccessory(
          device.name,
          uuid,
        );

      accessory.context.device =
        device;

      this.api
        .registerPlatformAccessories(
          PLUGIN_NAME,
          PLATFORM_NAME,
          [accessory],
        );

      this.accessories.set(
        accessory.UUID,
        accessory,
      );
    }

    const thermostatAccessory =
      this.accessoryFactory
        .createThermostat(
          device,
          accessory,
        );

    this.thermostatAccessories.set(
      device.temperatureEntity,
      thermostatAccessory,
    );

    if (device.humidityEntity) {
      this.thermostatAccessories.set(
        device.humidityEntity,
        thermostatAccessory,
      );
    }

    if (device.batteryEntity) {
      this.thermostatAccessories.set(
        device.batteryEntity,
        thermostatAccessory,
      );
    }
  }

  private removeObsoleteAccessories():
  void {
    for (
      const [
        uuid,
        accessory,
      ] of this.accessories
    ) {
      if (
        this.activeAccessoryUUIDs.has(
          uuid,
        )
      ) {
        continue;
      }

      const device =
        accessory.context
          .device as
          Partial<SensorDevice> |
          undefined;

      if (
        !device?.temperatureEntity
      ) {
        continue;
      }

      this.log.info(
        `Suppression de l’accessoire obsolète : ${accessory.displayName}`,
      );

      this.api
        .unregisterPlatformAccessories(
          PLUGIN_NAME,
          PLATFORM_NAME,
          [accessory],
        );

      this.accessories.delete(
        uuid,
      );
    }
  }

  private handleHomeAssistantEvent(
    event: unknown,
  ): void {
    const message =
      event as {
        event?: {
          data?: {
            entity_id?: string;
            new_state?: {
              state?: string;
            } | null;
          };
        };
      };

    const entityId =
      message.event?.data
        ?.entity_id;

    const rawState =
      message.event?.data
        ?.new_state?.state;

    if (
      !entityId ||
      rawState === undefined
    ) {
      return;
    }

    const value =
      Number(rawState);

    if (
      !Number.isFinite(value)
    ) {
      return;
    }

    const thermostatAccessory =
      this.thermostatAccessories.get(
        entityId,
      );

    if (!thermostatAccessory) {
      return;
    }

    thermostatAccessory.updateEntity(
      entityId,
      value,
    );

    this.log.debug(
      'Mise à jour temps réel : ' +
      `${entityId} = ${value}`,
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