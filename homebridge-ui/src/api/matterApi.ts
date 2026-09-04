import type {
  IHomebridgePluginUi,
} from '@homebridge/plugin-ui-utils';

declare global {
  interface Window {
    homebridge: IHomebridgePluginUi;
  }
}

interface MatterCommissioningResponse {
  success: boolean;
  error?: string;
}

export class MatterApi {
  public async commission(
    pairingCode: string,
  ): Promise<MatterCommissioningResponse> {
    return window.homebridge.request(
      '/matter/commission',
      {
        pairingCode,
      },
    ) as Promise<MatterCommissioningResponse>;
  }
}

export const matterApi =
  new MatterApi();