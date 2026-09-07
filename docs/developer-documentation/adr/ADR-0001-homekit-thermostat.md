# ADR-0001: Use a HomeKit Thermostat Service for Climate Sensors

- **Status:** Accepted
- **Scope:** HomeKit publication model
- **Applies to:** Home Assistant and Matter providers
- **Architecture:** V2

---

# Context

Homebridge HA Virtual Devices publishes climate-oriented sensors into Apple Home.

The plugin can expose:

- temperature;
- relative humidity;
- battery level;
- availability and fault state.

The source of those values can be Home Assistant or Matter, but the HomeKit-facing representation must remain common and predictable.

A simple temperature sensor service would accurately describe a passive sensor, but the plugin's intended Apple Home presentation is a thermostat-style tile. The publication layer therefore needs a HomeKit service that provides the desired tile while still accepting read-only climate measurements.

The implementation must also avoid creating several separate HomeKit tiles for one physical climate sensor.

---

# Decision

Each published climate device is represented primarily by a single HomeKit:

```text
Thermostat
```

service.

The service is created or reused through:

```ts
this.accessory.getService(
  this.platform.Service.Thermostat,
) ??
this.accessory.addService(
  this.platform.Service.Thermostat,
  this.device.name,
  'thermostat',
);
```

The same `ClimateAccessory` implementation is used regardless of whether the runtime device originates from Home Assistant or Matter.

---

# Thermostat Configuration

The thermostat service is configured with the device name as both:

```text
Name
ConfiguredName
```

The climate sensor is not treated as an active heating or cooling controller.

Therefore:

```text
CurrentHeatingCoolingState = OFF
TargetHeatingCoolingState  = OFF
```

A fixed target temperature is configured as:

```text
TargetTemperature = 20
```

and temperature display units are:

```text
CELSIUS
```

The service is also initialized as:

```text
StatusActive = true
StatusFault  = NO_FAULT
```

Availability handling can subsequently update active/fault state.

---

# Temperature

Current temperature is published on the thermostat service.

The plugin does not retain a separate legacy `TemperatureSensor` service for the same climate device.

During accessory configuration, old standalone temperature services are removed.

---

# Humidity

When humidity publication is enabled and the device reports humidity support, the humidity characteristic is integrated into the same thermostat service.

The plugin therefore avoids publishing an additional standalone `HumiditySensor` tile for the same device.

Legacy separate humidity services are removed during accessory configuration.

---

# Battery

When battery publication is enabled and the device reports battery support, battery characteristics are integrated into the thermostat service.

The plugin exposes battery level and low-battery state without requiring a separate HomeKit battery service.

Legacy standalone `Battery` services are removed.

The current low-battery threshold is:

```text
20 %
```

or below.

---

# Resulting HomeKit Model

Conceptually:

```text
PlatformAccessory
       │
       ▼
Thermostat
       │
       ├── CurrentTemperature
       ├── CurrentRelativeHumidity   (when supported)
       ├── BatteryLevel              (when supported)
       ├── StatusLowBattery          (when supported)
       ├── ChargingState             (when supported)
       ├── StatusActive
       └── StatusFault
```

This produces one main HomeKit climate representation per published plugin device.

---

# Source Independence

The HomeKit service choice is independent from the provider.

The upstream runtime path can be:

```text
Home Assistant
      │
      ▼
Published climate device
```

or:

```text
Matter
  │
  ▼
PublishedClimateDevice
```

Both ultimately reach:

```text
AccessoryManager
      │
      ▼
ClimateAccessory
      │
      ▼
HomeKit Thermostat
```

The HomeKit accessory layer therefore does not need separate publication models for Home Assistant and Matter.

---

# Migration from Legacy Services

`ClimateAccessory` explicitly removes previously published standalone services:

```text
TemperatureSensor
HumiditySensor
Battery
```

before configuring the current thermostat representation.

This prevents obsolete services from remaining attached to restored Homebridge accessories after the publication model changes.

---

# Consequences

## Positive

### Consistent Apple Home presentation

All climate devices use the same primary HomeKit service.

### One main tile per climate device

Temperature, optional humidity, and optional battery information are grouped around one thermostat representation rather than several independent sensor services.

### Provider-neutral publication

The same accessory model works for both Home Assistant and Matter.

### Controlled migration

Old standalone services are actively removed from restored accessories.

### Availability integration

`StatusActive` and `StatusFault` can represent device availability directly on the primary service.

---

## Trade-offs

### The service type is semantically broader than the physical device

Many published devices are passive climate sensors rather than real thermostats.

The plugin intentionally uses the HomeKit Thermostat service for presentation and aggregation, not because the physical sensor can control heating or cooling.

### Mandatory thermostat characteristics require fixed values

HomeKit thermostat characteristics such as heating/cooling state and target temperature must exist even though the plugin does not use them as active controls.

The implementation therefore keeps heating/cooling states at `OFF` and configures a fixed target temperature of `20 °C`.

### HomeKit behavior remains constrained by Apple's service model

The plugin can control the characteristics it publishes, but the final tile presentation and some UI behavior remain determined by Apple Home.

---

# Alternatives Considered

## Standalone TemperatureSensor

Rejected as the primary representation because it would not provide the intended thermostat-style Apple Home presentation.

## Separate services for temperature, humidity, and battery

Rejected as the target V2 model because it would fragment one climate device across multiple HomeKit services and retain legacy publication behavior.

## Provider-specific HomeKit models

Rejected because source-specific publication would duplicate accessory logic and weaken the shared V2 architecture.

---

# Implementation

The decision is implemented primarily in:

```text
src/accessories/climateAccessory.ts
```

Relevant responsibilities include:

```text
configureThermostatService()
configureHumidityCharacteristic()
configureBatteryCharacteristics()
removeTemperatureSensorService()
removeHumiditySensorService()
removeSeparateBatteryService()
```

---

# Related Architecture

- [ClimateAccessory](../architecture/ClimateAccessory.md)
- [AccessoryManager](../architecture/AccessoryManager.md)
- [ClimateDevice](../architecture/ClimateDevice.md)
- [Matter architecture](../Matter/README.md)

---

# Decision Summary

Homebridge HA Virtual Devices publishes each climate device through a single HomeKit `Thermostat` service and integrates supported humidity and battery characteristics into that representation.

The thermostat is used as the common Apple Home publication model for both Home Assistant and Matter sources, while legacy standalone temperature, humidity, and battery services are removed.
