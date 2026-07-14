import type { Logging } from 'homebridge';

import type { ClimateDevice } from '../models/climateDevice.js';

export interface HomeAssistantState {
  entity_id: string;
  state: string;
}

export class ClimateDeviceManager {
  private readonly initialStates:
    Map<string, string> =
      new Map();

  constructor(
    private readonly log: Logging,
  ) { }

  public loadInitialStates(
    states: HomeAssistantState[],
  ): void {
    this.initialStates.clear();

    for (const state of states) {
      this.initialStates.set(
        state.entity_id,
        state.state,
      );
    }

    this.log.info(
      `${states.length} états initiaux chargés`,
    );
  }

  public prepareClimateDevice(
    device: ClimateDevice,
  ): ClimateDevice {
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

  private normalizeDeviceName(
    name: string,
  ): string {
    const normalizedName =
      name
        .replace(/_/g, ' ')
        .replace(
          /^(température|temperature)\s+/i,
          '',
        )
        .replace(
          /\s+(température|temperature)$/i,
          '',
        )
        .trim();

    if (normalizedName.length === 0) {
      return name;
    }

    return (
      normalizedName.charAt(0).toUpperCase() +
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
}