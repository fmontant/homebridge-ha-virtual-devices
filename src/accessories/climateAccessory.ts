import type {
    PlatformAccessory,
    Service,
} from 'homebridge';

import type { ClimateDevice } from '../models/climateDevice.js';
import type { HAVirtualDevicesPlatform } from '../platform.js';

export class ClimateAccessory {
    private readonly device: ClimateDevice;

    private readonly thermostatService: Service;

    private readonly includeHumidity: boolean;
    private readonly includeBattery: boolean;

    constructor(
        private readonly platform:
            HAVirtualDevicesPlatform,
        private readonly accessory:
            PlatformAccessory,
    ) {
        this.device =
            accessory.context.device as ClimateDevice;

        this.includeHumidity =
            this.platform.config
                .includeHumidity !== false;

        this.includeBattery =
            this.platform.config
                .includeBattery !== false;

        this.platform.log.info(
            `Configuration de la tuile HomeKit : ${this.device.name}`,
        );

        this.configureAccessoryInformation();
        this.removeTemperatureSensorService();
        this.removeSeparateHumidityService();
        this.removeSeparateBatteryService();

        this.thermostatService =
            this.configureThermostatService();

        this.thermostatService
            .setPrimaryService();

        this.applyInitialValues();
    }

    public updateEntity(
        entityId: string,
        value: number,
    ): void {
        if (
            entityId ===
            this.device.temperatureEntity
        ) {
            this.updateTemperature(value);
            return;
        }

        if (
            this.includeHumidity &&
            entityId ===
            this.device.humidityEntity
        ) {
            this.updateHumidity(value);
            return;
        }

        if (
            this.includeBattery &&
            entityId ===
            this.device.batteryEntity
        ) {
            this.updateBattery(value);
        }
    }

    public updateTemperature(
        temperature: number,
    ): void {
        if (!Number.isFinite(temperature)) {
            return;
        }

        const normalizedTemperature =
            Math.min(
                100,
                Math.max(
                    -270,
                    temperature,
                ),
            );

        this.thermostatService
            .updateCharacteristic(
                this.platform.Characteristic
                    .CurrentTemperature,
                normalizedTemperature,
            );

        this.platform.log.debug(
            `${this.device.name} : ` +
            `${normalizedTemperature} °C`,
        );
    }

    public updateHumidity(
        humidity: number,
    ): void {
        if (
            !this.includeHumidity ||
            !this.device.humidityEntity ||
            !Number.isFinite(humidity)
        ) {
            return;
        }

        const normalizedHumidity =
            Math.min(
                100,
                Math.max(
                    0,
                    humidity,
                ),
            );

        this.thermostatService
            .updateCharacteristic(
                this.platform.Characteristic
                    .CurrentRelativeHumidity,
                normalizedHumidity,
            );

        this.platform.log.debug(
            `${this.device.name} : ` +
            `${normalizedHumidity} %`,
        );
    }

    public updateBattery(
        batteryLevel: number,
    ): void {
        if (
            !this.includeBattery ||
            !this.device.batteryEntity ||
            !Number.isFinite(batteryLevel)
        ) {
            return;
        }

        const normalizedBattery =
            Math.round(
                Math.min(
                    100,
                    Math.max(
                        0,
                        batteryLevel,
                    ),
                ),
            );

        const lowBatteryStatus =
            normalizedBattery <= 20
                ? this.platform.Characteristic
                    .StatusLowBattery
                    .BATTERY_LEVEL_LOW
                : this.platform.Characteristic
                    .StatusLowBattery
                    .BATTERY_LEVEL_NORMAL;

        this.thermostatService
            .updateCharacteristic(
                this.platform.Characteristic
                    .BatteryLevel,
                normalizedBattery,
            )
            .updateCharacteristic(
                this.platform.Characteristic
                    .StatusLowBattery,
                lowBatteryStatus,
            )
            .updateCharacteristic(
                this.platform.Characteristic
                    .ChargingState,
                this.platform.Characteristic
                    .ChargingState
                    .NOT_CHARGEABLE,
            );

        this.platform.log.debug(
            `${this.device.name} : ` +
            `batterie intégrée ${normalizedBattery} %`,
        );
    }

    private configureAccessoryInformation():
        void {
        const manufacturer =
            this.device.manufacturer ??
            'HA Virtual Devices';

        const model =
            this.device.model ??
            'Home Assistant Climate Sensor';

        const serialNumber =
            this.device.serialNumber ??
            this.device.id;

        const softwareVersion =
            this.device.softwareVersion ??
            'Non renseignée';

        const hardwareVersion =
            this.device.hardwareVersion ??
            'Non renseignée';

        this.accessory
            .getService(
                this.platform.Service
                    .AccessoryInformation,
            )!
            .setCharacteristic(
                this.platform.Characteristic
                    .Manufacturer,
                manufacturer,
            )
            .setCharacteristic(
                this.platform.Characteristic
                    .Model,
                model,
            )
            .setCharacteristic(
                this.platform.Characteristic
                    .SerialNumber,
                serialNumber,
            )
            .setCharacteristic(
                this.platform.Characteristic
                    .FirmwareRevision,
                softwareVersion,
            )
            .setCharacteristic(
                this.platform.Characteristic
                    .HardwareRevision,
                hardwareVersion,
            );

        this.platform.log.info(
            `${this.device.name} : ` +
            `${manufacturer}, ${model}, ` +
            `logiciel ${softwareVersion}, ` +
            `matériel ${hardwareVersion}`,
        );
    }

    private configureThermostatService():
        Service {
        const service =
            this.accessory.getService(
                this.platform.Service.Thermostat,
            ) ??
            this.accessory.addService(
                this.platform.Service.Thermostat,
                this.device.name,
                'thermostat',
            );

        service
            .setCharacteristic(
                this.platform.Characteristic.Name,
                this.device.name,
            )
            .setCharacteristic(
                this.platform.Characteristic
                    .CurrentHeatingCoolingState,
                this.platform.Characteristic
                    .CurrentHeatingCoolingState.OFF,
            )
            .setCharacteristic(
                this.platform.Characteristic
                    .TargetHeatingCoolingState,
                this.platform.Characteristic
                    .TargetHeatingCoolingState.OFF,
            )
            .setCharacteristic(
                this.platform.Characteristic
                    .TargetTemperature,
                20,
            )
            .setCharacteristic(
                this.platform.Characteristic
                    .TemperatureDisplayUnits,
                this.platform.Characteristic
                    .TemperatureDisplayUnits.CELSIUS,
            );

        this.configureHumidityCharacteristic(
            service,
        );

        this.configureBatteryCharacteristics(

            service,

        );

        return service;
    }

    private configureHumidityCharacteristic(
        service: Service,
    ): void {
        const humidityCharacteristic =
            this.platform.Characteristic
                .CurrentRelativeHumidity;

        if (
            this.includeHumidity &&
            this.device.humidityEntity
        ) {
            service.addOptionalCharacteristic(
                humidityCharacteristic,
            );

            service.getCharacteristic(
                humidityCharacteristic,
            );

            this.platform.log.info(
                `Humidité intégrée au thermostat : ${this.device.name}`,
            );

            return;
        }

        if (
            service.testCharacteristic(
                humidityCharacteristic,
            )
        ) {
            service.removeCharacteristic(
                service.getCharacteristic(
                    humidityCharacteristic,
                ),
            );
        }

        this.platform.log.info(
            `Humidité désactivée : ${this.device.name}`,
        );
    }
    private configureBatteryCharacteristics(
        service: Service,
    ): void {
        const batteryLevel =
            this.platform.Characteristic
                .BatteryLevel;

        const statusLowBattery =
            this.platform.Characteristic
                .StatusLowBattery;

        const chargingState =
            this.platform.Characteristic
                .ChargingState;

        if (
            this.includeBattery &&
            this.device.batteryEntity
        ) {
            service.addOptionalCharacteristic(
                batteryLevel,
            );

            service.addOptionalCharacteristic(
                statusLowBattery,
            );

            service.addOptionalCharacteristic(
                chargingState,
            );

            service.getCharacteristic(
                batteryLevel,
            );

            service.getCharacteristic(
                statusLowBattery,
            );

            service.getCharacteristic(
                chargingState,
            );

            this.platform.log.info(
                `Caractéristiques batterie intégrées au thermostat : ${this.device.name}`,
            );

            return;
        }

        if (
            service.testCharacteristic(
                batteryLevel,
            )
        ) {
            service.removeCharacteristic(
                service.getCharacteristic(
                    batteryLevel,
                ),
            );
        }

        if (
            service.testCharacteristic(
                statusLowBattery,
            )
        ) {
            service.removeCharacteristic(
                service.getCharacteristic(
                    statusLowBattery,
                ),
            );
        }

        if (
            service.testCharacteristic(
                chargingState,
            )
        ) {
            service.removeCharacteristic(
                service.getCharacteristic(
                    chargingState,
                ),
            );
        }

        this.platform.log.info(
            `Batterie désactivée : ${this.device.name}`,
        );
    }
    private removeTemperatureSensorService():
        void {
        const temperatureService =
            this.accessory.getService(
                this.platform.Service
                    .TemperatureSensor,
            );

        if (!temperatureService) {
            return;
        }

        this.accessory.removeService(
            temperatureService,
        );

        this.platform.log.info(
            `Ancien service TemperatureSensor supprimé : ${this.device.name}`,
        );
    }

    private removeSeparateHumidityService():
        void {
        const humidityService =
            this.accessory.getService(
                this.platform.Service
                    .HumiditySensor,
            );

        if (!humidityService) {
            return;
        }

        this.accessory.removeService(
            humidityService,
        );

        this.platform.log.info(
            `Ancien service HumiditySensor supprimé : ${this.device.name}`,
        );
    }

    private removeSeparateBatteryService():
        void {
        const batteryService =
            this.accessory.getService(
                this.platform.Service.Battery,
            );

        if (!batteryService) {
            return;
        }

        this.accessory.removeService(
            batteryService,
        );

        this.platform.log.info(
            `Ancien service Battery supprimé : ${this.device.name}`,
        );
    }

    private applyInitialValues():
        void {
        if (
            typeof this.device.temperature ===
            'number'
        ) {
            this.updateTemperature(
                this.device.temperature,
            );
        }

        if (
            this.includeHumidity &&
            typeof this.device.humidity ===
            'number'
        ) {
            this.updateHumidity(
                this.device.humidity,
            );
        }

        if (
            this.includeBattery &&
            typeof this.device.batteryLevel ===
            'number'
        ) {
            this.updateBattery(
                this.device.batteryLevel,
            );
        }
    }
}