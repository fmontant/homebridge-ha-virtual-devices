export interface SensorDevice {
  id: string;
  name: string;

  temperatureEntity: string;
  humidityEntity?: string;
  batteryEntity?: string;

  temperature?: number;
  humidity?: number;
  batteryLevel?: number;
}