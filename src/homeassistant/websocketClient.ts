import type { Logging } from 'homebridge';

import type { HomeAssistantConfig } from './config.js';
import type { EntityRegistryEntry } from '../models/entityRegistryEntry.js';
import type { DeviceRegistryEntry } from '../models/deviceRegistryEntry.js';

export class HomeAssistantWebSocketClient {
    private socket?: WebSocket;
    private eventCallback?: (event: unknown) => void;
    private entityRegistryCallback?: (
     entries: EntityRegistryEntry[]
)    => void;
    private deviceRegistryCallback?: (
     entries: DeviceRegistryEntry[],
)    => void;
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
  callback: (entries: EntityRegistryEntry[]) => void,
): void {
  this.entityRegistryCallback = callback;
}

public onDeviceRegistry(
  callback: (entries: DeviceRegistryEntry[]) => void,
): void {
  this.deviceRegistryCallback = callback;
}

public getEntityRegistry(): void {
  this.socket?.send(JSON.stringify({
    id: 2,
    type: 'config/entity_registry/list_for_display',
  }));
}

public getDeviceRegistry(): void {
  this.socket?.send(JSON.stringify({
    id: 3,
    type: 'config/device_registry/list',
  }));
}

 public connect(): void {
  const websocketUrl = this.config.haUrl
    .replace(/^http:/, 'ws:')
    .replace(/^https:/, 'wss:')
    .replace(/\/+$/, '');

  const endpoint = `${websocketUrl}/api/websocket`;

  this.log.info(`Ouverture de la connexion WebSocket vers ${endpoint}`);

  this.socket = new WebSocket(endpoint);

  this.socket.addEventListener('open', () => {
    this.log.info('Connexion WebSocket ouverte');
  });

  this.socket.addEventListener('message', event => {
    try {
      const message = JSON.parse(String(event.data)) as {
  id?: number;
  type?: string;
  success?: boolean;
  message?: string;
  result?: {
    entities?: unknown[];
    devices?: unknown[];
  };
};

      if (message.type === 'auth_required') {
        this.socket?.send(JSON.stringify({
          type: 'auth',
          access_token: this.config.token,
        }));

        return;
      }

  if (message.type === 'auth_ok') {
  this.log.info('Authentification WebSocket réussie');

  this.socket?.send(JSON.stringify({
    id: 1,
    type: 'subscribe_events',
    event_type: 'state_changed',
  }));

  this.getEntityRegistry();
  this.getDeviceRegistry();
  return;
}

if (message.id === 2) {
  this.log.info(
    `Réponse registre : ${JSON.stringify(message)}`,
  );
}

if (
  message.id === 2 &&
  message.success &&
  message.result?.entities
) {
  const entries = (message.result.entities as Array<{
  ei: string;
  di?: string;
  en?: string;
  tk?: string;
}>).map(entity => ({
  entityId: entity.ei,
  deviceId: entity.di,
  name: entity.en,
  translationKey: entity.tk,
}));

this.entityRegistryCallback?.(entries);

  return;
}

if (message.id === 3) {
  this.log.info(
    `Réponse appareils : ${JSON.stringify(message)}`,
  );
}

if (
  message.id === 3 &&
  message.success &&
  message.result?.devices
) {
  const devices = (message.result.devices as Array<{
    id: string;
    name: string;
    name_by_user?: string;
  }>).map(device => ({
    id: device.id,
    name: device.name,
    nameByUser: device.name_by_user,
  }));

  this.deviceRegistryCallback?.(devices);

  return;
}


      if (message.type === 'auth_invalid') {
        this.log.error(
          `Authentification WebSocket refusée : ${message.message ?? 'jeton invalide'}`,
        );
      }
      if (message.type === 'event') {
  const eventMessage = message as {
    type: 'event';
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
  };

  this.eventCallback?.(eventMessage);
}
    } catch (error) {
      this.log.error(
        `Message WebSocket illisible : ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  });

  this.socket.addEventListener('error', () => {
    this.log.error('Erreur de connexion WebSocket');
  });

  this.socket.addEventListener('close', () => {
    this.log.warn('Connexion WebSocket fermée');
  });
}
}