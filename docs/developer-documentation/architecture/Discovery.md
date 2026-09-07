# DiscoveryManager

The `DiscoveryManager` class coordinates climate-device discovery for the Home Assistant path.

It is intentionally small. Its role is to validate that Home Assistant registry data is available, delegate object construction to `ClimateDeviceBuilder`, log the result, and return the discovered `ClimateDevice` objects.

It does not implement Matter discovery.

---

# Purpose

`DiscoveryManager` receives two Home Assistant registry collections:

- entity registry entries;
- device registry entries.

It verifies that both collections contain data before attempting discovery.

If valid data is available, it delegates the transformation to `ClimateDeviceBuilder`.

---

# Public API

The class exposes one public method:

```ts
public discoverClimateDevices(
  entities: EntityRegistryEntry[],
  devices: DeviceRegistryEntry[],
): ClimateDevice[]
```

The method returns an array of discovered Home Assistant `ClimateDevice` objects.

---

# Internal Dependency

`DiscoveryManager` owns one internal builder:

```ts
private readonly climateDeviceBuilder:
  ClimateDeviceBuilder;
```

It is created in the constructor:

```ts
this.climateDeviceBuilder =
  new ClimateDeviceBuilder();
```

This keeps the manager responsible for orchestration while the builder remains responsible for entity-to-device mapping.

---

# Discovery Flow

The discovery process is:

```text
Home Assistant device registry
Home Assistant entity registry
          │
          ▼
   DiscoveryManager
          │
          ├── validate registries
          │
          ▼
ClimateDeviceBuilder
          │
          ▼
   ClimateDevice[]
          │
          ▼
      returned
```

---

# Empty Device Registry

If the Home Assistant device registry is empty:

```ts
if (devices.length === 0)
```

the manager logs:

```text
Découverte impossible : registre des appareils vide
```

and returns:

```ts
[]
```

No call to `ClimateDeviceBuilder` is made.

---

# Empty Entity Registry

If the Home Assistant entity registry is empty:

```ts
if (entities.length === 0)
```

the manager logs:

```text
Découverte impossible : registre des entités vide
```

and returns:

```ts
[]
```

Again, discovery stops before the builder is called.

---

# Successful Discovery

When both registries contain data, the manager calls:

```ts
this.climateDeviceBuilder.build(
  entities,
  devices,
)
```

The resulting `ClimateDevice[]` is then logged:

```text
<n> capteurs climatiques construits
```

and returned unchanged.

---

# Position in the V2 Architecture

```text
Home Assistant
      │
      ▼
Device Registry + Entity Registry
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
      ▼
Home Assistant runtime pipeline
      │
      ▼
PublishedClimateDevice-compatible publication
```

`DiscoveryManager` belongs exclusively to the Home Assistant acquisition path.

---

# Relationship with ClimateDeviceBuilder

The two components have separate responsibilities.

`DiscoveryManager` handles:

- discovery preconditions;
- orchestration;
- logging.

`ClimateDeviceBuilder` handles:

- grouping entities;
- resolving device names;
- detecting temperature, humidity, and battery entities;
- constructing `ClimateDevice` objects.

The manager does not duplicate builder logic.

---

# Relationship with ClimateDevice

The objects returned by `discoverClimateDevices()` are Home Assistant `ClimateDevice` instances.

These are still source-specific runtime objects.

In V2, `ClimateDevice` extends `PublishedClimateDevice`, allowing the result to flow into the source-neutral publication architecture without making this manager generic.

---

# Relationship with Matter Discovery

Matter uses a separate discovery implementation:

```text
src/matter/discovery.ts
```

The corresponding class is:

```ts
MatterDeviceDiscovery
```

The two discovery paths must not be confused.

Conceptually:

```text
Home Assistant                 Matter
      │                           │
      ▼                           ▼
DiscoveryManager        MatterDeviceDiscovery
      │                           │
      ▼                           ▼
ClimateDevice         MatterDeviceDescriptor[]
```

Both source paths can later converge on shared catalog and publication infrastructure, but their discovery mechanisms remain independent.

---

# Responsibilities

`DiscoveryManager` is responsible for:

- receiving Home Assistant registry collections;
- checking that the device registry is not empty;
- checking that the entity registry is not empty;
- logging discovery failures caused by empty registries;
- delegating construction to `ClimateDeviceBuilder`;
- logging the number of constructed climate devices;
- returning the resulting `ClimateDevice[]`.

It is **not** responsible for:

- connecting to Home Assistant;
- fetching the registries itself;
- interpreting individual entity naming patterns;
- loading current sensor states;
- handling Home Assistant live events;
- catalog persistence;
- HomeKit accessory creation;
- Matter discovery or commissioning.

---

# Error Handling

The class handles one category of discovery failure directly: missing registry data.

Rather than throwing when one registry is empty, it logs a warning and returns an empty result.

This makes the failure explicit while keeping discovery behavior predictable.

Other transformation rules remain delegated to `ClimateDeviceBuilder`.

---

# Logging

The class uses the Homebridge `Logging` interface.

Current messages include:

```text
Découverte impossible : registre des appareils vide
```

```text
Découverte impossible : registre des entités vide
```

```text
<n> capteurs climatiques construits
```

The first two are warnings.

The successful count is logged as informational output.

---

# Design Principles

## Small Orchestrator

`DiscoveryManager` does not contain low-level mapping logic.

Its job is to coordinate discovery and enforce simple preconditions.

---

## Source Isolation

The manager remains Home Assistant-specific.

Matter discovery is implemented separately rather than forcing two different protocols through one discovery abstraction.

---

## Delegation

Entity grouping and climate capability detection belong to `ClimateDeviceBuilder`.

This prevents the discovery coordinator from becoming responsible for model construction details.

---

## Predictable Empty Results

Missing registry data produces an empty array instead of a partially constructed discovery result.

---

# Extending Discovery

When adding new Home Assistant discovery rules, first determine where the change belongs.

Use `DiscoveryManager` when the change concerns:

- discovery orchestration;
- input preconditions;
- high-level discovery flow.

Use `ClimateDeviceBuilder` when the change concerns:

- entity matching;
- capability recognition;
- grouping;
- construction of `ClimateDevice`.

Changes related to Matter discovery belong under `src/matter/`.

---

# Related Components

- `ClimateDeviceBuilder`
- `ClimateDevice`
- `PublishedClimateDevice`
- `ClimateDeviceManager`
- `EntityRegistryEntry`
- `DeviceRegistryEntry`
- `MatterDeviceDiscovery`

---

# Related Documentation

- [Architecture overview](README.md)
- [Platform](Platform.md)
- [ClimateDevice](ClimateDevice.md)
- [ClimateDeviceBuilder](ClimateDeviceBuilder.md)
- [ClimateDeviceManager](ClimateDeviceManager.md)
- [EventManager](EventManager.md)

`DiscoveryManager` is the Home Assistant discovery coordinator: it validates registry availability, delegates construction, and returns normalized climate devices for the rest of the runtime pipeline.
