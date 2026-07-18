import type {
  IHomebridgePluginUi,
} from '@homebridge/plugin-ui-utils';

import type {
  CatalogDevice,
  DeviceState,
} from '../models/catalogDevice';

declare global {
  interface Window {
    homebridge: IHomebridgePluginUi;
  }
}

interface CatalogApiDevice {
  id: string;
  name: string;
  source: string;
  state: DeviceState;
  capabilities: string[];
  preferences: {
    enabled: boolean;
    hidden: boolean;
    favorite: boolean;
    room?: string;
  };
}

interface CatalogDevicesResponse {
  devices: CatalogApiDevice[];
}

interface CatalogDeviceResponse {
  device: CatalogApiDevice;
}

export interface CatalogDevicePreferencesUpdate {
  enabled?: boolean;
  hidden?: boolean;
  favorite?: boolean;
  room?: string;
}

export class CatalogApi {
  public async getDevices():
    Promise<CatalogDevice[]> {
    const response =
      await window.homebridge.request(
        '/catalog/devices',
      ) as CatalogDevicesResponse;

    return response.devices.map(
      device =>
        this.toCatalogDevice(
          device,
        ),
    );
  }

  public async getDevice(
    id: string,
  ): Promise<CatalogDevice> {
    const response =
      await window.homebridge.request(
        '/catalog/device',
        {
          id,
        },
      ) as CatalogDeviceResponse;

    return this.toCatalogDevice(
      response.device,
    );
  }

  public async setFavorite(
    id: string,
    favorite: boolean,
  ): Promise<CatalogDevice> {
    const response =
      await window.homebridge.request(
        '/catalog/device/favorite',
        {
          id,
          favorite,
        },
      ) as CatalogDeviceResponse;

    return this.toCatalogDevice(
      response.device,
    );
  }

  public async updatePreferences(
    id: string,
    preferences:
      CatalogDevicePreferencesUpdate,
  ): Promise<CatalogDevice> {
    const response =
      await window.homebridge.request(
        '/catalog/preferences',
        {
          id,
          preferences,
        },
      ) as CatalogDeviceResponse;

    return this.toCatalogDevice(
      response.device,
    );
  }

  private toCatalogDevice(
    device: CatalogApiDevice,
  ): CatalogDevice {
    return {
      id:
        device.id,
      name:
        device.name,
      source:
        device.source,
      room:
        device.preferences.room ?? '',
      state:
        device.state,
      favorite:
        device.preferences.favorite,
      capabilities: [
        ...device.capabilities,
      ],
    };
  }
}

export const catalogApi =
  new CatalogApi();
