import type { ClientNode } from '@matter/node';
import {
  PowerSourceClient,
  RelativeHumidityMeasurementClient,
  TemperatureMeasurementClient,
} from '@matter/node/behaviors';

import type {
  PublishedClimateDevice,
} from '../models/publishedClimateDevice.js';

import type {
  MatterDeviceDescriptor,
  MatterDeviceState,
} from './types.js';

export class MatterDeviceMapper {
  public readState(
    peer: ClientNode,
    descriptor: MatterDeviceDescriptor,
  ): MatterDeviceState {
    let temperature: number | undefined;
    let humidity: number | undefined;
    let batteryLevel: number | undefined;

    for (const endpoint of peer.endpoints) {
      if (
        endpoint.number ===
                descriptor.temperatureEndpointId
      ) {
        const state =
                    endpoint.maybeStateOf(
                      TemperatureMeasurementClient,
                    );

        if (
          typeof state?.measuredValue ===
                    'number'
        ) {
          temperature =
                        state.measuredValue / 100;
        }
      }

      if (
        endpoint.number ===
                descriptor.humidityEndpointId
      ) {
        const state =
                    endpoint.maybeStateOf(
                      RelativeHumidityMeasurementClient,
                    );

        if (
          typeof state?.measuredValue ===
                    'number'
        ) {
          humidity =
                        state.measuredValue / 100;
        }
      }

      if (
        endpoint.number ===
                descriptor.batteryEndpointId
      ) {
        const state =
                    endpoint.maybeStateOf(
                      PowerSourceClient,
                    );

        if (
          typeof state?.batPercentRemaining ===
                    'number'
        ) {
          batteryLevel =
                        state.batPercentRemaining / 2;
        }
      }
    }

    return {
      temperature,
      humidity,
      batteryLevel,
      available: true,
    };
  }

  public toPublishedClimateDevice(
    descriptor: MatterDeviceDescriptor,
    state: MatterDeviceState,
  ): PublishedClimateDevice {
    return {
      id: descriptor.id,
      name: descriptor.name,
      temperature: state.temperature,
      humidity: state.humidity,
      batteryLevel: state.batteryLevel,
      available: state.available,
      supportsHumidity:
                descriptor.humidityEndpointId !==
                undefined,
      supportsBattery:
                descriptor.batteryEndpointId !==
                undefined,
      manufacturer:
                descriptor.vendorName,
      model:
                descriptor.productName,
      serialNumber:
                descriptor.serialNumber,
    };
  }

}