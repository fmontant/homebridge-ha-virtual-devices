import type { ClientNode } from '@matter/node';
import {
  PowerSourceClient,
  RelativeHumidityMeasurementClient,
  TemperatureMeasurementClient,
} from '@matter/node/behaviors';
import { ObserverGroup } from '@matter/general';

import type {
  MatterDeviceDescriptor,
} from './types.js';

export interface MatterSubscriptionCallbacks {
  onTemperature?: (
    deviceId: string,
    value: number,
  ) => void;

  onHumidity?: (
    deviceId: string,
    value: number,
  ) => void;

  onBattery?: (
    deviceId: string,
    value: number,
  ) => void;
}

export class MatterSubscriptionManager {

  private readonly observers =
    new ObserverGroup();

  public subscribe(
    peer: ClientNode,
    descriptor: MatterDeviceDescriptor,
    callbacks: MatterSubscriptionCallbacks,
  ): void {

    for (const endpoint of peer.endpoints) {

      if (
        endpoint.number ===
        descriptor.temperatureEndpointId
      ) {
        this.observers.on(
          endpoint
            .eventsOf(
              TemperatureMeasurementClient,
            )
            .measuredValue$Changed,
          value => {
            if (typeof value !== 'number') {
              return;
            }

            callbacks.onTemperature?.(
              descriptor.id,
              value / 100,
            );
          },
        );
      }

      if (
        endpoint.number ===
        descriptor.humidityEndpointId
      ) {
        this.observers.on(
          endpoint
            .eventsOf(
              RelativeHumidityMeasurementClient,
            )
            .measuredValue$Changed,
          value => {
            if (typeof value !== 'number') {
              return;
            }

            callbacks.onHumidity?.(
              descriptor.id,
              value / 100,
            );
          },
        );
      }

      if (
        endpoint.number ===
        descriptor.batteryEndpointId
      ) {
        this.observers.on(
          endpoint
            .eventsOf(
              PowerSourceClient,
            )
            .batPercentRemaining$Changed,
          value => {
            if (typeof value !== 'number') {
              return;
            }

            callbacks.onBattery?.(
              descriptor.id,
              value / 2,
            );
          },
        );
      }

    }

  }

  public stop(): void {
    this.observers.close();
  }

}