import type {
  CatalogDeviceUpdateRequest,
  CatalogDeviceUpdateResponse,
  CatalogResponse,
} from './catalogApiTypes.js';

export class CatalogApiClient {
  private readonly baseUrl: string;

  public constructor(
    baseUrl = '',
  ) {
    this.baseUrl = baseUrl;
  }

  public async getCatalog():
    Promise<CatalogResponse> {
    return this.request<CatalogResponse>(
      '/catalog',
      { method: 'GET' },
    );
  }

  public async updateDevicePreferences(
    deviceId: string,
    request: CatalogDeviceUpdateRequest,
  ): Promise<CatalogDeviceUpdateResponse> {
    return this.request<CatalogDeviceUpdateResponse>(
      `/catalog/${encodeURIComponent(deviceId)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      },
    );
  }

  private async request<T>(
    path: string,
    init: RequestInit,
  ): Promise<T> {
    const response = await fetch(
      `${this.baseUrl}${path}`,
      init,
    );

    if (!response.ok) {
      throw new Error(`Erreur API ${response.status}`);
    }

    return response.json() as Promise<T>;
  }
}

export const catalogApiClient =
  new CatalogApiClient();
