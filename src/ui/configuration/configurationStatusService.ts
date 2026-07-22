import {
  HomeAssistantClient,
} from '../../homeassistant/client.js';

import type {
  HomeAssistantConfig,
} from '../../homeassistant/config.js';

import type {
  ConfigurationStatus,
} from './configurationStatus.js';

interface ConfigurationStatusPayload {
  haUrl?: unknown;
  token?: unknown;
}

export class ConfigurationStatusService {
  public async getStatus(
    payload: unknown,
  ): Promise<ConfigurationStatus> {
    const configuration =
      this.parseConfiguration(
        payload,
      );

    if (!configuration) {
      return {
        configured: false,
        connected: false,
        state: 'unconfigured',
        message:
          'Adresse ou jeton manquant',
      };
    }

    const client =
      new HomeAssistantClient(
        configuration,
        console,
      );

    const status =
      await client
        .getConnectionStatus();

    if (status.connected) {
      return {
        configured: true,
        connected: true,
        state: 'connected',
        message:
          status.message,
      };
    }

    if (
      status.message.includes(
        'HTTP 401',
      ) ||
      status.message.includes(
        'HTTP 403',
      )
    ) {
      return {
        configured: true,
        connected: false,
        state: 'unauthorized',
        message:
          'Jeton Home Assistant invalide',
      };
    }

    return {
      configured: true,
      connected: false,
      state: 'unreachable',
      message:
        this.normalizeFailureMessage(
          status.message,
        ),
    };
  }

  private parseConfiguration(
    payload: unknown,
  ): HomeAssistantConfig | null {
    if (
      typeof payload !==
        'object' ||
      payload === null
    ) {
      return null;
    }

    const request =
      payload as
        ConfigurationStatusPayload;

    const haUrl =
      this.normalizeText(
        request.haUrl,
      );

    const token =
      this.normalizeText(
        request.token,
      );

    if (
      !haUrl ||
      !token
    ) {
      return null;
    }

    return {
      haUrl,
      token,
    } as HomeAssistantConfig;
  }

  private normalizeText(
    value: unknown,
  ): string {
    return typeof value ===
      'string'
      ? value.trim()
      : '';
  }

  private normalizeFailureMessage(
    message: string,
  ): string {
    if (
      message ===
        'Délai de connexion dépassé'
    ) {
      return message;
    }

    if (
      message.includes(
        'fetch failed',
      )
    ) {
      return 'Home Assistant inaccessible';
    }

    return message;
  }
}
