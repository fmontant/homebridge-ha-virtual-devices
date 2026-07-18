import type {
  CatalogDevice,
} from '../models/catalogDevice.js';

import type {
  CatalogDeviceUpdateRequest,
} from '../api/catalogApiTypes.js';
import {
  catalogApiClient,
} from '../api/catalogApiClient.js';

class CatalogStore {
  private devices:
    CatalogDevice[] = [];

  private loading =
    false;

  private error:
    string | null = null;

  public getDevices():
    CatalogDevice[] {
    return this.devices;
  }

  public isLoading():
    boolean {
    return this.loading;
  }

  public getError():
    string | null {
    return this.error;
  }

  public async refresh():
    Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      const response =
        await catalogApiClient
          .getCatalog();

      this.devices =
        response.devices;
    } catch (error) {
      this.error =
        this.getErrorMessage(error);

      throw error;
    } finally {
      this.loading = false;
    }
  }

  public async updatePreferences(
    deviceId: string,
    request:
      CatalogDeviceUpdateRequest,
  ): Promise<void> {
    const response =
      await catalogApiClient
        .updateDevicePreferences(
          deviceId,
          request,
        );

    const index =
      this.devices.findIndex(
        device =>
          device.id === deviceId,
      );

    if (index >= 0) {
      this.devices[index] =
        response.device;

      return;
    }

    this.devices.push(
      response.device,
    );
  }

  private getErrorMessage(
    error: unknown,
  ): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error';
  }
}

export const catalogStore =
  new CatalogStore();
