# MatterDeviceMapper

`MatterDeviceMapper` is the translation layer between Matter-specific sensor state and the source-neutral climate-device model used by the plugin.

It has two responsibilities:

1. read the current temperature, humidity, and battery values from the Matter endpoints identified during discovery;
2. convert a `MatterDeviceDescriptor` and its `MatterDeviceState` into a `PublishedClimateDevice`.

The Matter architecture described here belongs to the V2 development work. It does not describe the stable 1.3.7 release.

---

# Purpose

`MatterDeviceMapper` is responsible for:

- locating the endpoints selected by `MatterDeviceDiscovery`;
- reading supported Matter measurement state;
- converting Matter measurement units into plugin units;
- building `MatterDeviceState`;
- mapping Matter metadata and capabilities to `PublishedClimateDevice`.

It does not discover endpoints, subscribe to future updates, synchronize the catalog, or create HomeKit accessories.

---

# Reading Current State

The entry point is:

```ts
readState(
  peer: ClientNode,
  descriptor: MatterDeviceDescriptor,
): MatterDeviceState
```

It uses the endpoint IDs stored in the descriptor to locate the corresponding Matter endpoints and reads the supported measurement state from those endpoints.

The mapper does not rediscover endpoint capabilities. That responsibility belongs to `MatterDeviceDiscovery`.

---

# Temperature

For the endpoint matching:

```ts
descriptor.temperatureEndpointId
```

the mapper reads:

```ts
TemperatureMeasurementClient
```

through:

```ts
endpoint.maybeStateOf(
  TemperatureMeasurementClient,
)
```

If `measuredValue` is numeric, the value is converted with:

```ts
state.measuredValue / 100
```

The resulting plugin temperature is expressed in degrees Celsius.

---

# Relative Humidity

For the endpoint matching:

```ts
descriptor.humidityEndpointId
```

the mapper reads:

```ts
RelativeHumidityMeasurementClient
```

through:

```ts
endpoint.maybeStateOf(
  RelativeHumidityMeasurementClient,
)
```

If `measuredValue` is numeric, the value is converted with:

```ts
state.measuredValue / 100
```

The resulting humidity value is expressed as a percentage.

---

# Battery Level

For the endpoint matching:

```ts
descriptor.batteryEndpointId
```

the mapper reads:

```ts
PowerSourceClient
```

through:

```ts
endpoint.maybeStateOf(
  PowerSourceClient,
)
```

If:

```ts
state.batPercentRemaining
```

is numeric, the value is converted with:

```ts
state.batPercentRemaining / 2
```

The resulting `batteryLevel` is expressed as a percentage.

---

# Missing Measurements

Each measurement begins as:

```ts
undefined
```

If the corresponding endpoint is absent, the expected Matter state cannot be read, or its value is not numeric, that measurement remains undefined.

The mapper does not manufacture a fallback sensor value.

---

# Availability

The current implementation returns:

```ts
available: true
```

for every state successfully produced by `readState()`.

`readState()` does not currently derive availability from a separate Matter availability signal.

---

# MatterDeviceState

The result of `readState()` is:

```ts
{
  temperature,
  humidity,
  batteryLevel,
  available: true,
}
```

This separates Matter cluster access and unit conversion from the common publication model.

---

# Mapping to PublishedClimateDevice

The second public method is:

```ts
toPublishedClimateDevice(
  descriptor: MatterDeviceDescriptor,
  state: MatterDeviceState,
): PublishedClimateDevice
```

It combines:

```text
MatterDeviceDescriptor
        +
MatterDeviceState
        │
        ▼
PublishedClimateDevice
```

---

# Identity and Name

The following fields come directly from the descriptor:

```ts
id: descriptor.id
name: descriptor.name
```

The descriptor identity and discovery name were established by `MatterDeviceDiscovery`.

---

# Measurements

The current state is copied into:

```ts
temperature: state.temperature
humidity: state.humidity
batteryLevel: state.batteryLevel
available: state.available
```

---

# Capability Mapping

Humidity support is derived from the presence of a discovered humidity endpoint:

```ts
supportsHumidity:
  descriptor.humidityEndpointId !==
  undefined
```

Battery support is derived similarly:

```ts
supportsBattery:
  descriptor.batteryEndpointId !==
  undefined
```

Capability support therefore reflects discovered Matter topology rather than whether a value happened to be available during the current read.

---

# Device Metadata

Matter descriptor metadata is mapped as follows:

```text
vendorName       → manufacturer
productName      → model
serialNumber     → serialNumber
uniqueId         → uniqueId
softwareVersion  → softwareVersion
hardwareVersion  → hardwareVersion
```

This allows the common HomeKit publication layer to consume Matter device information without understanding Matter Basic Information directly.

---

# Source-Neutral Boundary

`PublishedClimateDevice` is the common runtime contract used by the V2 publication architecture.

`MatterDeviceMapper` is the component that removes Matter-specific endpoint and cluster details before the device enters that common layer.

The published object does not need to expose:

- `peerId`;
- `nodeId`;
- Matter endpoint IDs;
- Matter behavior/client classes.

Those remain inside the Matter subsystem.

---

# Relationship with MatterDeviceDiscovery

`MatterDeviceDiscovery` determines:

- the plugin device identity;
- the Matter peer identity;
- supported endpoint IDs;
- Matter Basic Information metadata.

`MatterDeviceMapper` consumes those endpoint IDs and metadata.

In short:

```text
Discovery = structure and metadata
Mapper    = current values and common model
```

---

# Relationship with MatterProvider

During synchronization, `MatterProvider` calls:

```ts
mapper.readState(
  peer,
  descriptor,
)
```

and then:

```ts
mapper.toPublishedClimateDevice(
  descriptor,
  state,
)
```

The provider forwards the initial values to `AccessoryManager` and stores the resulting published device in the shared runtime publication memory.

---

# Relationship with MatterSubscriptionManager

`MatterDeviceMapper` reads the initial state during synchronization.

`MatterSubscriptionManager` handles subsequent live measurement changes.

Both use the endpoint IDs established by discovery, but they serve different moments in the lifecycle:

```text
synchronization
    │
    ▼
MatterDeviceMapper
(initial values)
    │
    ▼
MatterSubscriptionManager
(live updates)
```

The two components therefore complement one another without duplicating the same responsibility.

---

# Unit Conversions

The current implementation performs three explicit conversions:

```text
Matter temperature measuredValue / 100
Matter humidity measuredValue    / 100
Matter batPercentRemaining       / 2
```

These conversions are centralized in the Matter mapping layer before values enter the generic publication path.

---

# Responsibilities

`MatterDeviceMapper` is responsible for:

- initial Matter measurement reads;
- Matter-to-plugin unit conversion;
- creation of `MatterDeviceState`;
- creation of `PublishedClimateDevice`;
- capability mapping;
- metadata mapping.

It is not responsible for:

- peer discovery;
- endpoint capability discovery;
- controller lifecycle;
- commissioning;
- live subscriptions;
- catalog synchronization;
- HomeKit characteristic updates.

---

# Design Principles

## Keep Matter Protocol Details at the Edge

Matter behavior clients and raw measurement representations are consumed here rather than propagated into generic managers.

## Separate Topology from Values

Endpoint selection belongs to discovery. Value reading belongs to the mapper.

## Separate Initial Reads from Subscriptions

The mapper establishes initial state. Live changes are handled independently by the subscription manager.

## Publish Through a Common Contract

Matter devices are converted to `PublishedClimateDevice` before entering the shared publication architecture.

## Preserve Capability Semantics

Capability support is based on discovered endpoint topology, while the current measurement value remains independently optional.

---

# Related Components

- `MatterDeviceDiscovery`
- `MatterProvider`
- `MatterSubscriptionManager`
- `MatterDeviceDescriptor`
- `MatterDeviceState`
- `PublishedClimateDevice`

---

# Related Documentation

- [Matter](README.md)
- [MatterProvider](MatterProvider.md)
- [MatterDeviceDiscovery](MatterDeviceDiscovery.md)
- [MatterController](MatterController.md)
- [MatterSubscriptionManager](MatterSubscriptionManager.md)
- [ClimateDevice](../architecture/ClimateDevice.md)
- [AccessoryManager](../architecture/AccessoryManager.md)

---

# Source File

The implementation documented here is:

```text
src/matter/mapper.ts
```

`MatterDeviceMapper` is the Matter state translation boundary. It reads the initial sensor values, performs the Matter-to-plugin normalization, and produces the source-neutral runtime representation consumed by the common publication architecture.
