import type {
  IHomebridgePluginUi,
} from '@homebridge/plugin-ui-utils';

declare global {
  interface Window {
    homebridge: IHomebridgePluginUi;
  }
}

export interface SystemInformation {
  pluginVersion: string;
  homebridgeVersion: string;
  homebridgeUiVersion: string;
  nodeVersion: string;
  platform: string;
}

export class SystemInformationApi {
  public async getInformation():
    Promise<SystemInformation> {
    return await window.homebridge.request(
      '/system/information',
    ) as SystemInformation;
  }
}

export const systemInformationApi =
  new SystemInformationApi();
  