import type { Logging } from 'homebridge';

import type {
  AccessoryManager,
} from '../managers/accessoryManager.js';

import type {
  CatalogManager,
} from '../managers/catalogManager.js';

import type {
  RegistryManager,
} from '../managers/registryManager.js';

import { MatterController } from './controller.js';
import { MatterDeviceDiscovery } from './discovery.js';
import { MatterDeviceMapper } from './mapper.js';
import {
  MatterDeviceCatalogMapper,
} from './catalogMapper.js';
import {
  MatterSubscriptionManager,
} from './subscriptionManager.js';

export class MatterProvider {
  private readonly controller: MatterController;

  private readonly discovery =
    new MatterDeviceDiscovery();

  private readonly mapper =
    new MatterDeviceMapper();

  private readonly catalogMapper =
    new MatterDeviceCatalogMapper();

  private readonly subscriptions =
    new MatterSubscriptionManager();

  public constructor(
    private readonly accessoryManager:
      AccessoryManager,
    private readonly catalogManager:
      CatalogManager,

    private readonly registryManager:
      RegistryManager,

    private readonly log: Logging,
    private readonly storagePath: string,
  ) {
    this.controller =
      new MatterController(
        this.storagePath,
      );
  }

  public async start(): Promise<void> {
    await this.controller.start();
    await this.synchronize();
  }

  public async commission(
    pairingCode: string,
  ): Promise<void> {
    await this.controller.commission(
      pairingCode,
    );

    await this.synchronize();
  }

  private async synchronize(): Promise<void> {
    const node =
      this.controller.getNode();

    const descriptors =
      await this.discovery.discover(node);

    this.log.info(
      `${descriptors.length} appareil(s) Matter détecté(s)`,
    );

    const discoveredCatalogDevices =
            this.catalogMapper
              .toDiscoveredCatalogDevices(
                descriptors,
              );


    await this.catalogManager
      .synchronizeDiscoveredDevices(
        discoveredCatalogDevices,
        'matter',
      );

    const publishedDevices = [];

    for (const descriptor of descriptors) {
      const peer =
                node.peers.get(
                  descriptor.peerId,
                );

      if (!peer) {
        this.log.warn(
          `Peer Matter introuvable : ${descriptor.name}`,
        );

        continue;
      }

      await peer.start();

      const state =
                this.mapper.readState(
                  peer,
                  descriptor,
                );
      publishedDevices.push(
        this.mapper.toPublishedClimateDevice(
          descriptor,
          state,
        ),
      );
      if (
        typeof state.temperature ===
                'number'
      ) {
        this.accessoryManager
          .updateTemperature(
            descriptor.id,
            state.temperature,
          );
      }

      if (
        typeof state.humidity ===
                'number'
      ) {
        this.accessoryManager
          .updateHumidity(
            descriptor.id,
            state.humidity,
          );
      }

      if (
        typeof state.batteryLevel ===
                'number'
      ) {
        this.accessoryManager
          .updateBattery(
            descriptor.id,
            state.batteryLevel,
          );
      }

      this.subscriptions.subscribe(
        peer,
        descriptor,
        {
          onTemperature:
                        (deviceId, value) => {
                          this.accessoryManager
                            .updateTemperature(
                              deviceId,
                              value,
                            );
                        },

          onHumidity:
                        (deviceId, value) => {
                          this.accessoryManager
                            .updateHumidity(
                              deviceId,
                              value,
                            );
                        },

          onBattery:
                        (deviceId, value) => {
                          this.accessoryManager
                            .updateBattery(
                              deviceId,
                              value,
                            );
                        },
        },
      );
    }

    this.registryManager
      .rememberPublishedClimateDevices(
        publishedDevices,
      );

    const deviceCatalog =
            this.catalogManager.getCatalog();

    for (
      const publishedDevice
      of publishedDevices
    ) {
      const catalogDevice =
                deviceCatalog.get(
                  publishedDevice.id,
                );

      if (!catalogDevice) {
        continue;
      }

      this.accessoryManager
        .applyCatalogDevice(
          publishedDevice,
          catalogDevice,
          deviceCatalog,
        );
    }
  }
  public async stop(): Promise<void> {
    await this.controller.stop();
  }
}