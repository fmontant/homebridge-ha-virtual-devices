import type { Logging } from 'homebridge';

import type { ClimateDevice } from '../models/climateDevice.js';
import {
  DisplayNameFormatter,
} from '../utils/displayNameFormatter.js';

export interface HomeAssistantState {
  entity_id: string;
  state: string;
  attributes?: {
    friendly_name?: unknown;
  };
}

export class ClimateDeviceManager {
  private readonly initialStates:
    Map<string, string> =
      new Map();

  private readonly friendlyNames:
    Map<string, string> =
      new Map();

  constructor(
    private readonly log: Logging,
  ) { }

  public loadInitialStates(
    states: HomeAssistantState[],
  ): void {
    this.initialStates.clear();
    this.friendlyNames.clear();

    for (const state of states) {
      this.initialStates.set(
        state.entity_id,
        state.state,
      );

      const friendlyName =
        state.attributes?.friendly_name;

      if (
        typeof friendlyName === 'string' &&
        friendlyName.trim().length > 0
      ) {
        this.friendlyNames.set(
          state.entity_id,
          friendlyName.trim(),
        );
      }
    }

    this.log.info(
      `${states.length} états initiaux chargés`,
    );
  }

  public prepareClimateDevice(
    device: ClimateDevice,
  ): ClimateDevice {
    const temperatureFriendlyName =
      this.friendlyNames.get(
        device.temperatureEntity,
      );

    const resolvedName =
      temperatureFriendlyName ??
      device.name;

    return {
      id: device.id,

      name:
        DisplayNameFormatter.format(
          resolvedName,
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

      manufacturer:
        device.manufacturer,

      model:
        device.model,

      softwareVersion:
        device.softwareVersion,

      hardwareVersion:
        device.hardwareVersion,

      serialNumber:
        device.serialNumber,
    };
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
}