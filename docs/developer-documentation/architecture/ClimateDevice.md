# ClimateDevice

The `ClimateDevice` interface represents the Home Assistant runtime climate model used by **Homebridge HA Virtual Devices**.

In V2, `ClimateDevice` is no longer the source-neutral model for every provider. It remains the richer runtime representation used by the Home Assistant path and extends the common `PublishedClimateDevice` publication contract.

```ts
export interface ClimateDevice
  extends PublishedClimateDevice {
  // Home Assistant-specific runtime fields
}
```

This distinction allows the existing Home Assistant implementation to remain intact while Matter can publish compatible climate devices without depending on Home Assistant-specific entities.

---

# Purpose

The primary purpose of `ClimateDevice` is to provide a normalized runtime representation of a supported Home Assistant device.

It combines:

- the common information required for publication;
- Home Assistant-specific entity relationships and runtime information.

The common publication boundary is now `PublishedClimateDevice`.

This means:

```text
Home Assistant-specific model
          │
          ▼
    ClimateDevice
          │
       extends
          ▼
PublishedClimateDevice
          │
          ▼
Source-neutral publication
```

---

# Responsibilities

A `ClimateDevice` can carry common publication information such as:

- device identifier;
- display name;
- source;
- current temperature;
- humidity;
- battery level;
- availability;
- supported humidity and battery capabilities;
- manufacturer;
- model;
- serial number;
- unique identifier;
- software version;
- hardware version.

It also contains Home Assistant-specific runtime information required by the existing Home Assistant pipeline.

It does **not** contain:

- catalog persistence logic;
- HomeKit accessory implementation;
- Matter protocol logic;
- UI behavior.

---

# Relationship with PublishedClimateDevice

`PublishedClimateDevice` is defined in:

```text
src/models/publishedClimateDevice.ts
```

It extends the base `Device` model and defines the source-neutral information consumed by the publication side of the plugin.

Its current contract is:

```ts
export interface PublishedClimateDevice extends Device {
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

`ClimateDevice` extends this interface.

This inheritance is a key V2 compatibility mechanism: the Home Assistant runtime model can continue to expose its source-specific information while remaining directly usable by components that only need the common publication contract.

---

# Position in the V2 Architecture

```text
Home Assistant
      │
      ▼
DiscoveryManager
      │
      ▼
ClimateDeviceBuilder
      │
      ▼
ClimateDevice
      │
      ├──────────────► ClimateDeviceManager
      │
      │
      │ extends
      ▼
PublishedClimateDevice
      │
      ▼
Shared catalog / publication infrastructure
      │
      ▼
RegistryManager
      │
      ▼
AccessoryManager
      │
      ▼
ClimateAccessory
      │
      ▼
Apple Home
```

Matter does **not** need to create a `ClimateDevice`.

Instead, `MatterDeviceMapper` maps Matter descriptors and state to `PublishedClimateDevice`.

---

# Home Assistant Runtime Role

`ClimateDevice` belongs to the Home Assistant path.

A simplified lifecycle is:

1. Home Assistant entities are discovered.
2. Compatible entities are identified and grouped.
3. `ClimateDeviceBuilder` constructs a normalized `ClimateDevice`.
4. `ClimateDeviceManager` manages the runtime device.
5. Catalog synchronization preserves persistent plugin state.
6. Publication components consume the common device information.
7. Home Assistant runtime events update values while the plugin is running.

The object itself is runtime state. Persistent preferences and catalog history are stored separately.

---

# Relationship with ClimateDeviceBuilder

`ClimateDeviceBuilder` constructs `ClimateDevice` instances from Home Assistant discovery information.

```text
Home Assistant data
        │
        ▼
ClimateDeviceBuilder
        │
        ▼
ClimateDevice
```

The builder is responsible for translating Home Assistant-specific data into the normalized runtime model.

This prevents Home Assistant parsing and entity-matching logic from leaking into the publication layer.

---

# Relationship with ClimateDeviceManager

`ClimateDeviceManager` manages the collection and runtime lifecycle of Home Assistant `ClimateDevice` objects.

The device model stores state; the manager implements lifecycle behavior around that state.

This separation keeps the model independent from orchestration logic.

---

# Relationship with Matter

Matter uses the same publication contract but not the same source-specific runtime model.

```text
Home Assistant                         Matter
      │                                  │
      ▼                                  ▼
ClimateDevice                    MatterDeviceMapper
      │                                  │
      └──────────────┬───────────────────┘
                     ▼
          PublishedClimateDevice
                     │
                     ▼
          Common publication path
```

This is one of the principal architectural changes introduced by V2.

It avoids forcing Matter data into Home Assistant-specific entity structures merely to reuse the HomeKit publication implementation.

---

# Relationship with CatalogDevice

`ClimateDevice` and `CatalogDevice` have different responsibilities.

| `ClimateDevice` | `CatalogDevice` |
| --- | --- |
| Home Assistant runtime model | Persistent catalog model |
| Built from source runtime data | Stored through catalog infrastructure |
| Contains current runtime values | Preserves plugin state and preferences |
| Exists for runtime processing | Survives plugin restarts |

V2 adds source awareness to the catalog, allowing Home Assistant and Matter discoveries to use the same persistent catalog infrastructure.

The two models should remain separate: runtime acquisition state and persistent user-facing state have different lifecycles.

---

# Typical Common Information

Through `PublishedClimateDevice`, a `ClimateDevice` may expose:

- identifier;
- name;
- source;
- temperature;
- humidity;
- battery level;
- availability;
- humidity support;
- battery support;
- manufacturer;
- model;
- serial number;
- unique identifier;
- software version;
- hardware version.

Additional fields can exist on `ClimateDevice` for Home Assistant-specific processing.

---

# Availability

Availability is part of the common `PublishedClimateDevice` contract:

```ts
available: boolean;
```

For the Home Assistant path, availability is derived and updated through the Home Assistant runtime processing.

Publication components can therefore consume availability without needing to know how Home Assistant represented the original state.

Matter also maps its state into the same common availability concept.

---

# Runtime Updates

During Home Assistant operation, values associated with a `ClimateDevice` may change, including:

- temperature;
- humidity;
- battery level;
- availability;
- source-specific runtime information.

Those changes can then be propagated to the shared HomeKit publication infrastructure.

The model should preserve stable device identity while runtime measurements evolve.

---

# Persistence

`ClimateDevice` is not the persistent storage model.

Persistent information belongs to the catalog layer.

This separation ensures that restarting the plugin or rebuilding Home Assistant runtime devices does not inherently discard user preferences stored in the catalog.

Examples of persistent concerns include:

- publication preferences;
- favorites;
- hidden state;
- custom HomeKit naming;
- discovery and communication metadata.

The exact persistent representation is handled by the catalog models and managers.

---

# Error Handling

Invalid or incomplete Home Assistant data should be rejected or normalized before a usable `ClimateDevice` enters the downstream pipeline.

Typical source-side issues can include:

- missing identifiers;
- unsupported entities;
- malformed attributes;
- unavailable measurements.

`ClimateDevice` itself should remain a coherent data model rather than becoming responsible for recovery or protocol error handling.

---

# Design Principles

## Source-Specific Runtime Model

`ClimateDevice` is allowed to contain Home Assistant-specific information because it belongs to that provider path.

The common publication layer should depend on `PublishedClimateDevice` instead.

---

## Shared Publication Contract

Inheritance from `PublishedClimateDevice` guarantees that every `ClimateDevice` exposes the information expected by source-neutral publication components.

---

## Separation of Concerns

The model stores normalized device information.

Builders, managers, catalog components, and accessories implement their respective behavior around it.

---

## Independence from HomeKit

`ClimateDevice` does not implement HomeKit services or characteristics.

HomeKit behavior belongs to `ClimateAccessory` and the accessory management layer.

---

## Independence from Persistence

`ClimateDevice` does not write the persistent catalog.

Catalog persistence remains a separate responsibility.

---

# Extending the Model

When adding a new property, first determine whether it is:

1. common to every publishable climate device; or
2. specific to the Home Assistant runtime.

A property required by multiple providers or by the source-neutral publication layer should normally be considered for `PublishedClimateDevice`.

A Home Assistant-specific property should remain on `ClimateDevice` or another Home Assistant-specific model.

This distinction prevents future providers from inheriting unnecessary Home Assistant concepts.

---

# Related Components

`ClimateDevice` primarily collaborates with:

- `ClimateDeviceBuilder`;
- `ClimateDeviceManager`;
- Home Assistant discovery and event processing;
- catalog synchronization components;
- components accepting `PublishedClimateDevice`.

Matter is related through the shared `PublishedClimateDevice` contract rather than through direct use of `ClimateDevice`.

---

# Related Documentation

- [Architecture overview](README.md)
- [Platform](Platform.md)
- [Discovery](Discovery.md)
- [ClimateDeviceBuilder](ClimateDeviceBuilder.md)
- [ClimateDeviceManager](ClimateDeviceManager.md)
- [CatalogManager](CatalogManager.md)
- [DeviceCatalog](DeviceCatalog.md)
- [RegistryManager](RegistryManager.md)

In V2, `ClimateDevice` remains the central Home Assistant runtime climate model, while `PublishedClimateDevice` is the common language of the source-neutral publication layer.
