# ADR-0004: Introduce a Source-Neutral PublishedClimateDevice Model

- **Status:** Accepted
- **Scope:** Runtime device model and provider abstraction
- **Applies to:** Home Assistant and Matter providers
- **Architecture:** V2

---

# Context

The first architecture of Homebridge HA Virtual Devices was centered on Home Assistant.

Its runtime climate model was therefore naturally tied to Home Assistant entity identifiers such as:

```text
temperatureEntity
humidityEntity
batteryEntity
```

That model worked while Home Assistant was the only provider.

V2 introduces Matter as a second source.

Matter devices do not have Home Assistant entity IDs. They are identified and updated through Matter peers, endpoints, clusters, and subscriptions.

The HomeKit publication layer must nevertheless remain common.

Without a source-neutral runtime model, the plugin would need either:

- separate HomeKit accessory implementations for Home Assistant and Matter; or
- provider-specific fields leaking into common publication code.

Both options would duplicate logic and weaken the V2 architecture.

---

# Decision

The plugin introduces a source-neutral interface:

```ts
PublishedClimateDevice
```

which contains only the climate and device information required by the common publication layer.

The Home Assistant-specific:

```ts
ClimateDevice
```

now extends `PublishedClimateDevice` and adds only its entity identifiers.

---

# PublishedClimateDevice

The current interface is:

```ts
export interface PublishedClimateDevice
extends Device {
  source?: string;
  temperature?: number;
  humidity?: number;
  batteryLevel?: number;
  available: boolean;
  supportsHumidity?: boolean;
  supportsBattery?: boolean;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  uniqueId?: string;
  softwareVersion?: string;
  hardwareVersion?: string;
}
```

This interface represents the runtime information needed to publish a climate device to HomeKit.

---

# Home Assistant Specialization

`ClimateDevice` extends the common model:

```ts
export interface ClimateDevice
extends PublishedClimateDevice {
  temperatureEntity: string;
  humidityEntity?: string;
  batteryEntity?: string;
}
```

The entity identifiers therefore remain available where Home Assistant-specific update routing requires them, without becoming mandatory for Matter devices.

---

# Architectural Boundary

The model creates the following separation:

```text
Provider-specific runtime model
          │
          ▼
PublishedClimateDevice
          │
          ▼
common publication layer
```

For Home Assistant:

```text
Home Assistant registries
          │
          ▼
ClimateDevice
          │
          └── extends PublishedClimateDevice
```

For Matter:

```text
Matter peer + descriptor + state
          │
          ▼
PublishedClimateDevice
```

Both can then be consumed by the same publication components.

---

# Common Publication Data

`PublishedClimateDevice` carries values that are independent from the transport protocol.

These include:

```text
temperature
humidity
batteryLevel
available
supportsHumidity
supportsBattery
```

as well as common accessory metadata:

```text
manufacturer
model
serialNumber
uniqueId
softwareVersion
hardwareVersion
```

and the optional provider source:

```text
source
```

---

# Device Identity

`PublishedClimateDevice` extends the shared base:

```ts
Device
```

so provider-neutral publication retains the common plugin device identity and name model.

Provider-specific identities remain handled before or around this boundary.

For example:

- Home Assistant can retain entity IDs in `ClimateDevice`;
- Matter retains peer, node, and endpoint information in its own descriptor types.

Those protocol details do not need to become part of the common HomeKit model.

---

# Optional Capabilities

Humidity and battery support are represented explicitly through:

```text
supportsHumidity
supportsBattery
```

The corresponding values remain optional:

```text
humidity?
batteryLevel?
```

This distinction allows the publication layer to understand both:

- whether a capability exists;
- whether a current value is available.

---

# Availability

Availability is part of the common model:

```ts
available: boolean;
```

This lets the HomeKit layer expose active/fault state without knowing how availability was determined by the provider.

For example, Home Assistant and Matter can derive availability differently while publishing through the same accessory implementation.

---

# Metadata

Accessory-information metadata is also source-neutral.

The publication layer can consume:

```text
manufacturer
model
serialNumber
uniqueId
softwareVersion
hardwareVersion
```

without importing Home Assistant or Matter types.

Fallback behavior remains the responsibility of the HomeKit accessory implementation.

---

# Source Field

The model provides:

```ts
source?: string;
```

The source is optional at the interface boundary because not every intermediate object necessarily assigns it immediately.

The persistent catalog remains the authoritative source-aware lifecycle model.

During publication, catalog information can supply or reinforce the source associated with the runtime device.

---

# Matter Mapping

The Matter provider builds a `PublishedClimateDevice` from Matter descriptor and state information.

Conceptually:

```text
MatterDeviceDescriptor
        +
MatterDeviceState
        │
        ▼
MatterDeviceMapper
        │
        ▼
PublishedClimateDevice
```

Matter-specific endpoint IDs remain in `MatterDeviceDescriptor`, not in the common publication interface.

---

# Home Assistant Mapping

The Home Assistant path continues to use `ClimateDevice`.

Because `ClimateDevice` extends `PublishedClimateDevice`, existing Home Assistant behavior can remain available while the object is also accepted by source-neutral components.

Conceptually:

```text
Home Assistant entities
        │
        ▼
ClimateDevice
        │
        ▼
PublishedClimateDevice contract
```

---

# Publication Layer

The common model is consumed by components such as:

```text
RegistryManager
AccessoryManager
ClimateAccessory
```

This lets those components operate on climate data without requiring provider-specific protocol types.

Some Home Assistant-specific compatibility paths still inspect optional entity fields where required, but they are no longer the core publication contract.

---

# Consequences

## Positive

### Home Assistant and Matter share one publication model

Both providers can feed the same HomeKit accessory layer.

### Provider-specific identifiers stay isolated

Home Assistant entity IDs do not become mandatory for Matter.

Matter peer and endpoint identifiers do not leak into HomeKit publication code.

### Existing Home Assistant model remains compatible

`ClimateDevice` is preserved and extended rather than replaced by an incompatible structure.

### Publication code becomes more reusable

Accessory creation and value updates can work from common climate properties.

### Future providers have a clear integration boundary

A new provider can map its runtime state into `PublishedClimateDevice` without reproducing the full HomeKit layer.

---

## Trade-offs

### Two related runtime interfaces now exist

The codebase must distinguish:

```text
PublishedClimateDevice
ClimateDevice
```

Developers must understand that the first is source-neutral while the second remains Home Assistant-specific.

### Some compatibility code still checks Home Assistant fields

Existing Home Assistant update paths continue to use entity IDs where appropriate.

The architecture therefore contains both generic and provider-specific paths during the V2 transition.

### `source` is optional at this boundary

Consumers must not assume every intermediate `PublishedClimateDevice` already contains a source string.

Persistent source ownership remains represented by the catalog.

---

# Alternatives Considered

## Keep ClimateDevice as the universal model

Rejected because mandatory Home Assistant entity identifiers would be meaningless for Matter devices.

## Add Matter fields directly to ClimateDevice

Rejected because one interface would accumulate protocol-specific fields from multiple providers.

## Create separate HomeKit accessory models per provider

Rejected because temperature, humidity, battery, availability, and accessory metadata are fundamentally common publication concerns.

## Replace ClimateDevice entirely

Rejected because Home Assistant still requires its entity identifiers for registry and event routing.

Extending the source-neutral model preserves those requirements cleanly.

---

# Implementation

The decision is implemented primarily in:

```text
src/models/publishedClimateDevice.ts
src/models/climateDevice.ts
```

The common model is used across:

```text
src/managers/registryManager.ts
src/managers/accessoryManager.ts
src/accessories/climateAccessory.ts
```

Matter mapping is implemented in:

```text
src/matter/mapper.ts
src/matter/provider.ts
```

---

# Related Architecture

- [ClimateDevice](../architecture/ClimateDevice.md)
- [ClimateAccessory](../architecture/ClimateAccessory.md)
- [AccessoryManager](../architecture/AccessoryManager.md)
- [RegistryManager](../architecture/RegistryManager.md)
- [Matter Device Mapper](../Matter/MatterDeviceMapper.md)
- [Matter architecture](../Matter/README.md)

---

# Decision Summary

Homebridge HA Virtual Devices uses `PublishedClimateDevice` as the source-neutral runtime contract for HomeKit climate publication.

The Home Assistant-specific `ClimateDevice` extends that contract with entity identifiers, while Matter maps its own descriptor and state model directly into the common interface.

This preserves provider-specific details where they are needed while allowing Home Assistant and Matter to share the same HomeKit publication architecture.
