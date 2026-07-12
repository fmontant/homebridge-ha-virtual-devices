import type { API, Characteristic, DynamicPlatformPlugin, Logging, PlatformAccessory, PlatformConfig, Service } from 'homebridge';

import { HAVirtualDeviceAccessory } from './platformAccessory.js';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';
import { HomeAssistantClient } from './homeassistant/client.js';
import { HomeAssistantWebSocketClient } from './homeassistant/websocketClient.js';

// This is only required when using Custom Services and Characteristics not support by HomeKit
import { EveHomeKitTypes } from 'homebridge-lib/EveHomeKitTypes';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class HAVirtualDevicesPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;
  private readonly homeAssistantClient: HomeAssistantClient;
  private readonly homeAssistantWebSocketClient: HomeAssistantWebSocketClient;
  

  // this is used to track restored cached accessories
  public readonly accessories: Map<string, PlatformAccessory> = new Map();
  private readonly deviceAccessories:
  Map<string, HAVirtualDeviceAccessory> = new Map();
  public readonly discoveredCacheUUIDs: string[] = [];

  // This is only required when using Custom Services and Characteristics not support by HomeKit
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public readonly CustomServices: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public readonly CustomCharacteristics: any;

  constructor(
    public readonly log: Logging,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;
    this.homeAssistantClient = new HomeAssistantClient(
  {
    haUrl: String(this.config.haUrl ?? ''),
    token: String(this.config.token ?? ''),
    debug: Boolean(this.config.debug),
  },
  this.log,
);
this.homeAssistantWebSocketClient = new HomeAssistantWebSocketClient(
  {
    haUrl: String(this.config.haUrl ?? ''),
    token: String(this.config.token ?? ''),
    debug: Boolean(this.config.debug),
  },
  this.log,
);

    // This is only required when using Custom Services and Characteristics not support by HomeKit
    this.CustomServices = new EveHomeKitTypes(this.api).Services;
    this.CustomCharacteristics = new EveHomeKitTypes(this.api).Characteristics;

    this.log.debug('Finished initializing platform:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    // this.discoverDevices();
    this.api.on('didFinishLaunching', async () => {
  this.log.info('HA Virtual Devices démarré');
  this.log.info('Test de connexion à Home Assistant...');

  const connected = await this.homeAssistantClient.testConnection();

  if (!connected) {
    this.log.error('Impossible de se connecter à Home Assistant');
    return;
  }

  this.log.info('Connexion réussie');
  

  const states = await this.homeAssistantClient.getStates();

  this.log.info(`${states.length} entités Home Assistant détectées`);

  const temperatureSensors =
    await this.homeAssistantClient.getTemperatureSensorModels();

  this.log.info(
    `${temperatureSensors.length} capteurs de température détectés`,
  );

  for (const sensor of temperatureSensors) {
  const uuid = this.api.hap.uuid.generate(sensor.entityId);
  const existingAccessory = this.accessories.get(uuid);

  if (existingAccessory) {
    this.log.info(`Restauration de l’accessoire : ${sensor.name}`);

    existingAccessory.context.device = sensor;
    this.api.updatePlatformAccessories([existingAccessory]);

   const deviceAccessory =
  new HAVirtualDeviceAccessory(this, existingAccessory);

this.deviceAccessories.set(sensor.entityId, deviceAccessory);
  } else {
    this.log.info(`Création de l’accessoire : ${sensor.name}`);

    const accessory = new this.api.platformAccessory(
      sensor.name,
      uuid,
    );

    accessory.context.device = sensor;

    const deviceAccessory =
  new HAVirtualDeviceAccessory(this, accessory);

this.deviceAccessories.set(
  sensor.entityId,
  deviceAccessory,
);

    this.api.registerPlatformAccessories(
      PLUGIN_NAME,
      PLATFORM_NAME,
      [accessory],
    );
  }
}
this.homeAssistantWebSocketClient.onEvent(event => {
  const message = event as {
    event?: {
      data?: {
        entity_id?: string;
        new_state?: {
          state?: string;
          attributes?: Record<string, unknown>;
        } | null;
      };
    };
  };

  const entityId = message.event?.data?.entity_id;
  const newState = message.event?.data?.new_state;

  if (!entityId || !newState) {
    return;
  }

  const deviceAccessory = this.deviceAccessories.get(entityId);

  if (!deviceAccessory) {
    return;
  }

  const temperature = Number(newState.state);

  if (!Number.isFinite(temperature)) {
    return;
  }

  deviceAccessory.updateTemperature(temperature);

  this.log.info(
    `Mise à jour temps réel : ${entityId} = ${temperature} °C`,
  );
});

this.homeAssistantWebSocketClient.connect();
});
}
  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to set up event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache, so we can track if it has already been registered
    this.accessories.set(accessory.UUID, accessory);
  }
 }
  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  
  
