import type { Logging } from 'homebridge';

import type { HumiditySensor } from '../models/humiditySensor.js';
import type { TemperatureSensor } from '../models/temperatureSensor.js';

import type { HomeAssistantConfig } from './config.js';

export interface HomeAssistantState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

export interface HomeAssistantConnectionStatus {
  connected: boolean;
  message: string;
}

type HomeAssistantLogger =
  Pick<Logging, 'info' | 'error'>;

export class HomeAssistantClient {
  private readonly baseUrl: string;

  constructor(
    private readonly config:
      HomeAssistantConfig,
    private readonly log:
      HomeAssistantLogger,
  ) {
    this.baseUrl =
      config.haUrl.replace(
        /\/+$/,
        '',
      );
  }

  public async testConnection():
    Promise<boolean> {
    const status =
      await this.getConnectionStatus();

    if (status.connected) {
      this.log.info(
        'Connexion à Home Assistant réussie : ' +
        status.message,
      );

      return true;
    }

    this.log.error(
      'Connexion à Home Assistant impossible : ' +
      status.message,
    );

    return false;
  }

  public async getConnectionStatus():
    Promise<HomeAssistantConnectionStatus> {
    try {
      const response =
        await this.request<{
          message: string;
        }>('/api/');

      return {
        connected: true,
        message:
          response.message ||
          'API Home Assistant disponible',
      };
    } catch (error) {
      return {
        connected: false,
        message:
          this.getErrorMessage(
            error,
          ),
      };
    }
  }

  public async getStates():
    Promise<HomeAssistantState[]> {
    return this.request<
      HomeAssistantState[]
    >('/api/states');
  }

  public async getTemperatureSensors():
    Promise<HomeAssistantState[]> {
    const states =
      await this.getStates();

    return states.filter(
      state =>
        state.entity_id
          .startsWith(
            'sensor.',
          ) &&
        (
          state.entity_id
            .toLowerCase()
            .includes(
              'temperature',
            ) ||
          state.attributes
            .device_class ===
            'temperature'
        ),
    );
  }

  public async getTemperatureSensorModels():
    Promise<TemperatureSensor[]> {
    const states =
      await this
        .getTemperatureSensors();

    return states.map(
      state => ({
        entityId:
          state.entity_id,
        name:
          typeof state.attributes
            .friendly_name ===
            'string'
            ? state.attributes
              .friendly_name
            : state.entity_id,
        temperature:
          Number(state.state),
        unit:
          typeof state.attributes
            .unit_of_measurement ===
            'string'
            ? state.attributes
              .unit_of_measurement
            : '',
      }),
    );
  }

  public async getHumiditySensorModels():
    Promise<HumiditySensor[]> {
    const states =
      await this.getStates();

    return states
      .filter(
        state =>
          state.entity_id
            .startsWith(
              'sensor.',
            ) &&
          (
            state.entity_id
              .toLowerCase()
              .includes(
                'humidity',
              ) ||
            state.attributes
              .device_class ===
              'humidity'
          ),
      )
      .map(
        state => ({
          entityId:
            state.entity_id,
          name:
            typeof state.attributes
              .friendly_name ===
              'string'
              ? state.attributes
                .friendly_name
              : state.entity_id,
          humidity:
            Number(state.state),
          unit:
            typeof state.attributes
              .unit_of_measurement ===
              'string'
              ? state.attributes
                .unit_of_measurement
              : '%',
        }),
      )
      .filter(
        sensor =>
          Number.isFinite(
            sensor.humidity,
          ),
      );
  }

  private async request<T>(
    path: string,
  ): Promise<T> {
    const response =
      await fetch(
        `${this.baseUrl}${path}`,
        {
          method: 'GET',
          headers: {
            Authorization:
              `Bearer ${this.config.token}`,
            'Content-Type':
              'application/json',
          },
          signal:
            AbortSignal.timeout(
              10000,
            ),
        },
      );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status} ` +
        response.statusText,
      );
    }

    return response.json() as
      Promise<T>;
  }

  private getErrorMessage(
    error: unknown,
  ): string {
    if (
      error instanceof Error
    ) {
      if (
        error.name ===
        'TimeoutError'
      ) {
        return 'Délai de connexion dépassé';
      }

      return error.message;
    }

    return String(error);
  }
}
