import type { API } from 'homebridge';

import { HAVirtualDevicesPlatform } from './platform.js';
import { PLATFORM_NAME } from './settings.js';

/**
 * Enregistre la plateforme auprès de Homebridge.
 */
export default (api: API) => {
  api.registerPlatform(PLATFORM_NAME, HAVirtualDevicesPlatform);
};