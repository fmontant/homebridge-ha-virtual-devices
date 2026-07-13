import type { BatterySensor } from './batterySensor.js';
import type { HumiditySensor } from './humiditySensor.js';
import type { TemperatureSensor } from './temperatureSensor.js';

export interface ClimateDevice {
  id: string;
  name: string;

  entities: string[];

  temperature?: TemperatureSensor;
  humidity?: HumiditySensor;
  battery?: BatterySensor;
}