import type { Logging } from 'homebridge';

import type { HomeAssistantConfig } from './config.js';

export class HomeAssistantWebSocketClient {
    private socket?: WebSocket;
  constructor(
    private readonly config: HomeAssistantConfig,
    private readonly log: Logging,
  ) {}

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
        return;
      }

      if (message.type === 'auth_invalid') {
        this.log.error(
          `Authentification WebSocket refusée : ${message.message ?? 'jeton invalide'}`,
        );
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