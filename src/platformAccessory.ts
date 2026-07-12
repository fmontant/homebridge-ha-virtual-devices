import type { PlatformAccessory, Service } from 'homebridge';

import type { TemperatureSensor } from './models/temperatureSensor.js';
import type { HAVirtualDevicesPlatform } from './platform.js';

export class HAVirtualDeviceAccessory {
  private readonly service: Service;
  private readonly sensor: TemperatureSensor;

  constructor(
    
    private readonly platform: HAVirtualDevicesPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    this.sensor = accessory.context.device as TemperatureSensor;
    this.platform.log.info(
  `Création de l'accessoire HomeKit : ${this.sensor.name}`,
);

    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(
        this.platform.Characteristic.Manufacturer,
        'HA Virtual Devices',
      )
      .setCharacteristic(
        this.platform.Characteristic.Model,
        'Home Assistant Temperature Sensor',
      )
      .setCharacteristic(
        this.platform.Characteristic.SerialNumber,
        this.sensor.entityId,
      );
const previousTemperatureService =
  this.accessory.getService(this.platform.Service.TemperatureSensor);

if (previousTemperatureService) {
  this.accessory.removeService(previousTemperatureService);
}
    this.service =
      this.accessory.getService(this.platform.Service.Thermostat) ||
      this.accessory.addService(
        this.platform.Service.Thermostat,
        this.sensor.name,
      );

    this.service
  .setCharacteristic(
    this.platform.Characteristic.CurrentHeatingCoolingState,
    this.platform.Characteristic.CurrentHeatingCoolingState.OFF,
  )
  .setCharacteristic(
    this.platform.Characteristic.TargetHeatingCoolingState,
    this.platform.Characteristic.TargetHeatingCoolingState.OFF,
  )
  .setCharacteristic(
    this.platform.Characteristic.TargetTemperature,
    20,
  )
  .setCharacteristic(
    this.platform.Characteristic.TemperatureDisplayUnits,
    this.platform.Characteristic.TemperatureDisplayUnits.CELSIUS,
  );

    this.updateTemperature(this.sensor.temperature);
  }

  public updateTemperature(temperature: number): void {
    this.service.updateCharacteristic(
      this.platform.Characteristic.CurrentTemperature,
      temperature,
    );

    this.platform.log.debug(
      `${this.sensor.name} mis à jour : ${temperature} ${this.sensor.unit}`,
    );
  }
}