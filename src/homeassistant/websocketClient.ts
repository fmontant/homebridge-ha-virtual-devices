import type { Logging } from 'homebridge';

import type { HomeAssistantConfig } from './config.js';

export class HomeAssistantWebSocketClient {
  constructor(
    private readonly config: HomeAssistantConfig,
    private readonly log: Logging,
  ) {}

  public connect(): void {
  this.log.info(
    `Préparation de la connexion WebSocket vers ${this.config.haUrl}`,
  );
}
}