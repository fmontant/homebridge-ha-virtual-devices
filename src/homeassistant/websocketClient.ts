import type { Logging } from 'homebridge';

import type { HomeAssistantConfig } from './config.js';
import type { DeviceRegistryEntry } from '../models/deviceRegistryEntry.js';
import type { EntityRegistryEntry } from '../models/entityRegistryEntry.js';

interface HomeAssistantError {
  code?: string;
  message?: string;
}

interface WebSocketMessage {
  id?: number;
  type?: string;
  success?: boolean;
  message?: string;
  result?: unknown;
  error?: HomeAssistantError;
  event?: {
    event_type?: string;
    data?: {
      entity_id?: string;
      old_state?: {
        state?: string;
      } | null;
      new_state?: {
        state?: string;
        attributes?: Record<string, unknown>;
      } | null;
    };
  };
}

interface EntityRegistryResponse {
  ei: string;
  di?: string;
  en?: string;
  tk?: string;
}

interface DeviceRegistryResponse {
  id: string;
  name: string;
  name_by_user?: string;
}

type PendingRequest =
  | 'subscribe_state_events'
  | 'subscribe_entity_registry_events'
  | 'subscribe_device_registry_events'
  | 'device_registry'
  | 'entity_registry';

export class HomeAssistantWebSocketClient {
  private socket?: WebSocket;

  private nextMessageId = 1;

  private readonly pendingRequests =
    new Map<number, PendingRequest>();

  private registryRefreshTimer?:
    ReturnType<typeof setTimeout>;

  private eventCallback?: (
    event: unknown,
  ) => void;

  private entityRegistryCallback?: (
    entries: EntityRegistryEntry[],
  ) => void;

  private deviceRegistryCallback?: (
    entries: DeviceRegistryEntry[],
  ) => void;

  constructor(
    private readonly config: HomeAssistantConfig,
    private readonly log: Logging,
  ) {}

  public onEvent(
    callback: (event: unknown) => void,
  ): void {
    this.eventCallback = callback;
  }

  public onEntityRegistry(
    callback: (
      entries: EntityRegistryEntry[],
    ) => void,
  ): void {
    this.entityRegistryCallback = callback;
  }

  public onDeviceRegistry(
    callback: (
      entries: DeviceRegistryEntry[],
    ) => void,
  ): void {
    this.deviceRegistryCallback = callback;
  }

  public getEntityRegistry(): void {
    this.sendCommand(
      'entity_registry',
      {
        type: 'config/entity_registry/list_for_display',
      },
    );

    this.log.info(
      'Demande du registre des entités Home Assistant',
    );
  }

  public getDeviceRegistry(): void {
    this.sendCommand(
      'device_registry',
      {
        type: 'config/device_registry/list',
      },
    );

    this.log.info(
      'Demande du registre des appareils Home Assistant',
    );
  }

  public connect(): void {
    const websocketUrl = this.config.haUrl
      .replace(/^http:/, 'ws:')
      .replace(/^https:/, 'wss:')
      .replace(/\/+$/, '');

    const endpoint =
      `${websocketUrl}/api/websocket`;

    this.log.info(
      `Ouverture de la connexion WebSocket vers ${endpoint}`,
    );

    this.socket = new WebSocket(endpoint);

    this.socket.addEventListener(
      'open',
      () => {
        this.log.info(
          'Connexion WebSocket ouverte',
        );
      },
    );

    this.socket.addEventListener(
      'message',
      event => {
        this.handleMessage(event);
      },
    );

    this.socket.addEventListener(
      'error',
      () => {
        this.log.error(
          'Erreur de connexion WebSocket',
        );
      },
    );

    this.socket.addEventListener(
      'close',
      () => {
        this.log.warn(
          'Connexion WebSocket fermée',
        );

        this.pendingRequests.clear();
        this.clearRegistryRefreshTimer();
      },
    );
  }

  private handleMessage(
    event: MessageEvent,
  ): void {
    try {
      const message = JSON.parse(
        String(event.data),
      ) as WebSocketMessage;

      if (
        message.type ===
        'auth_required'
      ) {
        this.authenticate();
        return;
      }

      if (
        message.type ===
        'auth_ok'
      ) {
        this.handleAuthenticationSuccess();
        return;
      }

      if (
        message.type ===
        'auth_invalid'
      ) {
        this.log.error(
          'Authentification WebSocket refusée : ' +
          `${message.message ?? 'jeton invalide'}`,
        );

        return;
      }

      if (
        message.type ===
        'event'
      ) {
        this.handleEventMessage(
          message,
        );

        return;
      }

      if (
        message.type !== 'result' ||
        message.id === undefined
      ) {
        return;
      }

      this.handleResultMessage(
        message,
      );
    } catch (error) {
      this.log.error(
        'Message WebSocket illisible : ' +
        `${
          error instanceof Error
            ? error.message
            : String(error)
        }`,
      );
    }
  }

  private handleEventMessage(
    message: WebSocketMessage,
  ): void {
    const eventType =
      message.event?.event_type;

    if (
      eventType ===
        'entity_registry_updated' ||
      eventType ===
        'device_registry_updated'
    ) {
      this.scheduleRegistryRefresh(
        eventType,
      );

      return;
    }

    if (
      eventType ===
      'state_changed'
    ) {
      this.eventCallback?.(
        message,
      );
    }
  }

  private handleResultMessage(
    message: WebSocketMessage,
  ): void {
    if (
      message.id === undefined
    ) {
      return;
    }

    const requestType =
      this.pendingRequests.get(
        message.id,
      );

    if (!requestType) {
      return;
    }

    if (
      !this.isSubscriptionRequest(
        requestType,
      )
    ) {
      this.pendingRequests.delete(
        message.id,
      );
    }

    if (!message.success) {
      this.logRequestError(
        requestType,
        message,
      );

      return;
    }

    if (
      requestType ===
      'device_registry'
    ) {
      this.handleDeviceRegistryResponse(
        message.result,
      );

      return;
    }

    if (
      requestType ===
      'entity_registry'
    ) {
      this.handleEntityRegistryResponse(
        message.result,
      );

      return;
    }

    this.logSubscriptionSuccess(
      requestType,
    );
  }

  private authenticate(): void {
    if (!this.socket) {
      return;
    }

    this.socket.send(
      JSON.stringify({
        type: 'auth',
        access_token:
          this.config.token,
      }),
    );
  }

  private handleAuthenticationSuccess():
  void {
    this.log.info(
      'Authentification WebSocket réussie',
    );

    this.sendCommand(
      'subscribe_state_events',
      {
        type: 'subscribe_events',
        event_type: 'state_changed',
      },
    );

    this.sendCommand(
      'subscribe_entity_registry_events',
      {
        type: 'subscribe_events',
        event_type:
          'entity_registry_updated',
      },
    );

    this.sendCommand(
      'subscribe_device_registry_events',
      {
        type: 'subscribe_events',
        event_type:
          'device_registry_updated',
      },
    );

    this.getDeviceRegistry();
  }

  private sendCommand(
    requestType: PendingRequest,
    command: Record<string, unknown>,
  ): void {
    if (
      !this.socket ||
      this.socket.readyState !==
        WebSocket.OPEN
    ) {
      this.log.warn(
        'Impossible d’envoyer une commande : WebSocket indisponible',
      );

      return;
    }

    const id =
      this.nextMessageId;

    this.nextMessageId += 1;

    this.pendingRequests.set(
      id,
      requestType,
    );

    this.socket.send(
      JSON.stringify({
        id,
        ...command,
      }),
    );
  }

  private scheduleRegistryRefresh(
    eventType: string,
  ): void {
    this.clearRegistryRefreshTimer();

    this.log.info(
      `Modification détectée dans Home Assistant : ${eventType}`,
    );

    this.registryRefreshTimer =
      setTimeout(
        () => {
          this.registryRefreshTimer =
            undefined;

          this.log.info(
            'Actualisation immédiate des registres Home Assistant',
          );

          this.getDeviceRegistry();
        },
        500,
      );
  }

  private clearRegistryRefreshTimer():
  void {
    if (
      !this.registryRefreshTimer
    ) {
      return;
    }

    clearTimeout(
      this.registryRefreshTimer,
    );

    this.registryRefreshTimer =
      undefined;
  }

  private isSubscriptionRequest(
    requestType: PendingRequest,
  ): boolean {
    return (
      requestType ===
        'subscribe_state_events' ||
      requestType ===
        'subscribe_entity_registry_events' ||
      requestType ===
        'subscribe_device_registry_events'
    );
  }

  private logSubscriptionSuccess(
    requestType: PendingRequest,
  ): void {
    const subscriptionNames:
      Partial<
        Record<
          PendingRequest,
          string
        >
      > = {
        subscribe_state_events:
          'Abonnement aux changements d’état actif',
        subscribe_entity_registry_events:
          'Abonnement aux modifications du registre des entités actif',
        subscribe_device_registry_events:
          'Abonnement aux modifications du registre des appareils actif',
      };

    const message =
      subscriptionNames[
        requestType
      ];

    if (message) {
      this.log.info(
        message,
      );
    }
  }

  private handleEntityRegistryResponse(
    result: unknown,
  ): void {
    const rawEntries =
      this.extractEntityEntries(
        result,
      );

    const entries =
      rawEntries.map(
        entity => ({
          entityId: entity.ei,
          deviceId: entity.di,
          name: entity.en,
          translationKey:
            entity.tk,
        }),
      );

    this.log.info(
      `${entries.length} entités reçues du registre Home Assistant`,
    );

    this.entityRegistryCallback?.(
      entries,
    );
  }

  private handleDeviceRegistryResponse(
    result: unknown,
  ): void {
    const rawDevices =
      this.extractDeviceEntries(
        result,
      );

    const devices =
      rawDevices.map(
        device => ({
          id: device.id,
          name: device.name,
          nameByUser:
            device.name_by_user,
        }),
      );

    this.log.info(
      `${devices.length} appareils reçus du registre Home Assistant`,
    );

    this.deviceRegistryCallback?.(
      devices,
    );
  }

  private logRequestError(
    requestType: PendingRequest,
    message: WebSocketMessage,
  ): void {
    const requestNames:
      Record<
        PendingRequest,
        string
      > = {
        subscribe_state_events:
          'abonnement aux changements d’état',
        subscribe_entity_registry_events:
          'abonnement au registre des entités',
        subscribe_device_registry_events:
          'abonnement au registre des appareils',
        device_registry:
          'registre des appareils',
        entity_registry:
          'registre des entités',
      };

    const errorCode =
      message.error?.code ??
      'code inconnu';

    const errorMessage =
      message.error?.message ??
      message.message ??
      'erreur inconnue';

    this.log.error(
      `Échec de ${requestNames[requestType]} : ` +
      `${errorCode}, ${errorMessage}`,
    );
  }

  private extractEntityEntries(
    result: unknown,
  ): EntityRegistryResponse[] {
    if (
      Array.isArray(result)
    ) {
      return result as
        EntityRegistryResponse[];
    }

    if (
      this.isObject(result) &&
      Array.isArray(
        result.entities,
      )
    ) {
      return result.entities as
        EntityRegistryResponse[];
    }

    this.log.warn(
      'Le registre des entités Home Assistant a retourné un format inattendu',
    );

    return [];
  }

  private extractDeviceEntries(
    result: unknown,
  ): DeviceRegistryResponse[] {
    if (
      Array.isArray(result)
    ) {
      return result as
        DeviceRegistryResponse[];
    }

    if (
      this.isObject(result) &&
      Array.isArray(
        result.devices,
      )
    ) {
      return result.devices as
        DeviceRegistryResponse[];
    }

    this.log.warn(
      'Le registre des appareils Home Assistant a retourné un format inattendu',
    );

    return [];
  }

  private isObject(
    value: unknown,
  ): value is Record<
    string,
    unknown
  > {
    return (
      typeof value ===
        'object' &&
      value !== null
    );
  }
}