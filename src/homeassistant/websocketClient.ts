import type { Logging } from 'homebridge';

import type { HomeAssistantConfig } from './config.js';

export class HomeAssistantWebSocketClient {
    private socket?: WebSocket;
    private eventCallback?: (event: unknown) => void;
  constructor(
    private readonly config: HomeAssistantConfig,
    private readonly log: Logging,
  ) {}
public onEvent(
  callback: (event: unknown) => void,
): void {
  this.eventCallback = callback;
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
        type?: string;
        message?: string;
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