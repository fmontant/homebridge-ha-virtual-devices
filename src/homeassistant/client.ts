import { HomeAssistantConfig } from './config.js';

export class HomeAssistantClient {

  constructor(
    private readonly config: HomeAssistantConfig,
  ) {}

  public async testConnection(): Promise<boolean> {
    console.log(`[HA] Connecting to ${this.config.url}`);
    return true;
  }

}