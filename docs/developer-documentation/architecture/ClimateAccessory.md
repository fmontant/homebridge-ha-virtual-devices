# ClimateAccessory

`ClimateAccessory` is the HomeKit-facing wrapper used to configure and update the thermostat tile for a published climate device.

In V2, it accepts the source-neutral `PublishedClimateDevice` model, while still supporting the optional Home Assistant entity identifiers used by the legacy HA event path.

---

# Purpose

`ClimateAccessory` is responsible for:

- configuring HomeKit accessory information;
- exposing the device through a Thermostat service;
- integrating temperature, humidity, and battery characteristics into the same tile;
- applying initial runtime values;
- updating measurements in real time;
- representing device availability and communication failure;
- supporting both direct device updates and Home Assistant entity-based updates;
- removing obsolete standalone sensor services from earlier implementations.

It does not perform discovery, catalog synchronization, Matter commissioning, or Home Assistant registry processing.

---

# Runtime Device Type

The internal runtime type is:

```ts
type ClimateAccessoryDevice =
  PublishedClimateDevice &
  Partial<
    Pick<
      ClimateDevice,
      | 'temperatureEntity'
      | 'humidityEntity'
      | 'batteryEntity'
    >
  >;
```

This means every accessory receives the common V2 publication model:

```ts
PublishedClimateDevice
```

while Home Assistant entity IDs remain optional extensions.

This structure allows one accessory implementation to support:

- Home Assistant devices with entity IDs;
- Matter devices without Home Assistant entity IDs.

---

# Construction

The constructor receives:

```text
HAVirtualDevicesPlatform
PlatformAccessory
```

The runtime device is read from:

```ts
accessory.context.device
```

The accessory then determines whether humidity and battery should be exposed.

Both options are enabled unless explicitly configured as `false`:

```ts
includeHumidity =
  platform.config.includeHumidity !== false

includeBattery =
  platform.config.includeBattery !== false
```

The constructor then performs this sequence:

```text
configure accessory information
        │
        ▼
remove legacy TemperatureSensor
        │
        ▼
remove legacy HumiditySensor
        │
        ▼
remove legacy Battery service
        │
        ▼
configure Thermostat service
        │
        ▼
mark Thermostat as primary
        │
        ▼
apply initial values
```

---

# Accessory Information

`configureAccessoryInformation()` populates HomeKit `AccessoryInformation`.

The values are taken from the runtime device when available.

## Manufacturer

```ts
device.manufacturer ??
'HA Virtual Devices'
```

## Model

```ts
device.model ??
'Home Assistant Climate Sensor'
```

## Serial number

Priority is:

```text
serialNumber
uniqueId
id
```

## Software version

```ts
device.softwareVersion ??
'Non renseignée'
```

## Hardware version

```ts
device.hardwareVersion ??
'Non renseignée'
```

These values are written to:

```text
Manufacturer
Model
SerialNumber
FirmwareRevision
HardwareRevision
```

---

# Thermostat Service

The main HomeKit service is:

```ts
Service.Thermostat
```

If an existing Thermostat service is found, it is reused.

Otherwise a new one is created with subtype:

```text
thermostat
```

The service is configured with:

```text
Name                     device.name
ConfiguredName           device.name
CurrentHeatingCoolingState  OFF
TargetHeatingCoolingState   OFF
TargetTemperature           20
TemperatureDisplayUnits     CELSIUS
StatusActive                true
StatusFault                 NO_FAULT
```

The Thermostat service is then marked as the primary service.

This is intentionally a display-oriented thermostat tile, not an active heating controller.

---

# Temperature

Temperature is always handled by the Thermostat service through:

```ts
CurrentTemperature
```

`updateTemperature()` ignores non-finite values.

Valid values are clamped to:

```text
-270 °C to 100 °C
```

The normalized value is then written to HomeKit.

The update is logged with the `[HOMEKIT]` prefix.

---

# Humidity

Humidity is integrated directly into the Thermostat service.

It is exposed only when:

```text
includeHumidity = true
and
device.supportsHumidity = true
```

The characteristic used is:

```ts
CurrentRelativeHumidity
```

If humidity is not enabled or supported, the characteristic is removed from the Thermostat service if already present.

`updateHumidity()` ignores non-finite values and clamps valid values to:

```text
0% to 100%
```

---

# Battery

Battery information is also integrated into the Thermostat service rather than exposed through a separate Battery service.

It is enabled only when:

```text
includeBattery = true
and
device.supportsBattery = true
```

The following characteristics are added:

```text
BatteryLevel
StatusLowBattery
ChargingState
```

If battery support is disabled or unavailable, these characteristics are removed from the service.

---

# Battery Updates

`updateBattery()` ignores non-finite values.

Battery level is:

1. clamped to `0–100`;
2. rounded to an integer.

Low-battery state is calculated using:

```text
battery <= 20%
```

Values at or below 20% map to:

```ts
BATTERY_LEVEL_LOW
```

Higher values map to:

```ts
BATTERY_LEVEL_NORMAL
```

The charging state is always:

```ts
NOT_CHARGEABLE
```

---

# Home Assistant Entity Updates

`updateEntity()` is the Home Assistant-specific real-time path.

It compares the incoming `entityId` against the optional runtime fields:

```text
temperatureEntity
humidityEntity
batteryEntity
```

and delegates to the corresponding update method.

Humidity and battery entity updates are also gated by the global `includeHumidity` and `includeBattery` options.

Matter does not require this path because it updates by device ID through `AccessoryManager`.

---

# Device-Level Availability

`updateDeviceAvailability()` is source-neutral.

It updates:

```text
StatusActive
StatusFault
```

When available:

```text
StatusActive = true
StatusFault  = NO_FAULT
```

When unavailable:

```text
StatusActive = false
StatusFault  = GENERAL_FAULT
```

This method can be used for devices that do not expose Home Assistant entity identifiers.

---

# Entity-Level Availability

`updateAvailability()` is the Home Assistant-oriented availability path.

It first calls:

```ts
updateDeviceAvailability(
  available,
)
```

so the thermostat-level fault state is always updated.

If the device becomes available, no further action is required.

If it becomes unavailable, the method creates a:

```ts
HapStatusError(
  SERVICE_COMMUNICATION_FAILURE
)
```

and applies it to the characteristic corresponding to the unavailable Home Assistant entity.

Possible targets are:

```text
CurrentTemperature
CurrentRelativeHumidity
BatteryLevel
```

This lets HomeKit represent the affected characteristic as a communication failure.

---

# Initial Values

`applyInitialValues()` applies whatever runtime values are already available when the accessory wrapper is constructed.

## Temperature

If:

```ts
typeof device.temperature ===
'number'
```

the value is passed to:

```ts
updateTemperature()
```

## Humidity

If humidity is enabled and a numeric value exists, it is passed to:

```ts
updateHumidity()
```

## Battery

If battery is enabled and a numeric value exists, it is passed to:

```ts
updateBattery()
```

---

# Initial Availability

Availability initialization depends on whether the runtime device contains a Home Assistant temperature entity.

## Home Assistant device

If:

```ts
device.temperatureEntity
```

exists, the accessory calls:

```ts
updateAvailability(
  device.temperatureEntity,
  device.available,
)
```

This enables entity-level communication-failure behavior.

## Source-neutral device

If no temperature entity exists, the accessory calls:

```ts
updateDeviceAvailability(
  device.available,
)
```

This is the path used by source-neutral devices such as Matter devices.

---

# Legacy Service Cleanup

Before configuring the Thermostat service, the constructor removes older standalone services if they are present.

These are:

```text
TemperatureSensor
HumiditySensor
Battery
```

The removal methods are:

```ts
removeTemperatureSensorService()
removeSeparateHumidityService()
removeSeparateBatteryService()
```

This ensures the accessory uses the current single-tile V2 presentation.

---

# Single-Tile HomeKit Presentation

The current design intentionally exposes measurements through one Thermostat tile.

Conceptually:

```text
PublishedClimateDevice
        │
        ▼
Thermostat
├── CurrentTemperature
├── CurrentRelativeHumidity   optional
├── BatteryLevel              optional
├── StatusLowBattery          optional
├── ChargingState             optional
├── StatusActive
└── StatusFault
```

Separate TemperatureSensor, HumiditySensor, and Battery services are removed when found.

---

# V2 Provider Paths

The same `ClimateAccessory` wrapper supports both provider families.

## Home Assistant

```text
HA state event
   │
   ▼
entityId
   │
   ▼
AccessoryManager.updateEntity()
   │
   ▼
ClimateAccessory.updateEntity()
```

Availability can also be applied per entity through:

```text
updateAvailability()
```

## Matter

```text
Matter subscription
   │
   ▼
deviceId
   │
   ▼
AccessoryManager.updateTemperature()
AccessoryManager.updateHumidity()
AccessoryManager.updateBattery()
   │
   ▼
ClimateAccessory direct update methods
```

Matter availability can use the device-level path without requiring HA entity IDs.

---

# Relationship with AccessoryManager

`AccessoryManager` owns the lifecycle of `ClimateAccessory` instances.

It:

- creates them through `AccessoryFactory`;
- stores them by device ID;
- routes Home Assistant entity updates;
- routes direct Matter measurement updates;
- recreates them when publication state changes.

`ClimateAccessory` itself focuses only on HomeKit service and characteristic behavior.

---

# Relationship with PublishedClimateDevice

`PublishedClimateDevice` provides the common runtime values and metadata used here:

```text
id
name
source
temperature
humidity
batteryLevel
available
supportsHumidity
supportsBattery
manufacturer
model
serialNumber
uniqueId
softwareVersion
hardwareVersion
```

Home Assistant entity identifiers are optional extensions and are not required for the general publication model.

---

# Responsibilities

`ClimateAccessory` is responsible for:

- configuring AccessoryInformation;
- configuring the primary Thermostat service;
- integrating humidity and battery into that service;
- applying initial values;
- updating temperature;
- updating humidity;
- updating battery level and low-battery state;
- updating source-neutral device availability;
- updating HA entity-specific communication failure state;
- removing obsolete standalone services.

It is **not** responsible for:

- discovery;
- catalog synchronization;
- source selection;
- Matter commissioning;
- Home Assistant registry management;
- persistent storage;
- publication eligibility.

---

# Design Principles

## Source-Neutral Core

The accessory consumes `PublishedClimateDevice`.

Home Assistant entity identifiers are optional extensions.

---

## One HomeKit Tile

Temperature, humidity, and battery information are consolidated into the Thermostat service.

---

## Capability-Driven Characteristics

Humidity and battery characteristics exist only when both:

```text
global option enabled
and
device capability supported
```

---

## Different Availability Granularity

Source-neutral devices use device-level status.

Home Assistant devices can additionally expose communication failure on the specific affected characteristic.

---

## Legacy Cleanup

Older separate services are removed automatically so the accessory converges to the current V2 structure.

---

# Extending ClimateAccessory

Changes belong here when they concern:

- HomeKit service layout;
- characteristic behavior;
- value normalization;
- availability representation;
- accessory metadata.

When adding a new source-neutral measurement, review:

- `PublishedClimateDevice`;
- Thermostat optional characteristics;
- `AccessoryManager` direct update methods;
- `applyInitialValues()`.

When changing Home Assistant entity-specific handling, review:

- `ClimateDevice`;
- `updateEntity()`;
- `updateAvailability()`.

---

# Related Components

- `AccessoryManager`
- `AccessoryFactory`
- `PublishedClimateDevice`
- `ClimateDevice`
- `HAVirtualDevicesPlatform`

---

# Related Documentation

- [Architecture overview](README.md)
- [AccessoryManager](AccessoryManager.md)
- [ClimateDevice](ClimateDevice.md)
- [Platform](Platform.md)

`ClimateAccessory` is the final HomeKit translation layer of V2: it presents source-neutral climate data through one thermostat tile while retaining optional Home Assistant entity semantics where they are needed.
