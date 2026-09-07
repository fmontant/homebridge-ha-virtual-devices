# ClimateDeviceBuilder

The `ClimateDeviceBuilder` class converts Home Assistant registry data into normalized `ClimateDevice` runtime objects.

It belongs exclusively to the Home Assistant provider path.

Its implementation is intentionally small: it exposes a single public method, `build()`.

---

# Purpose

`ClimateDeviceBuilder` receives:

- Home Assistant entity registry entries;
- Home Assistant device registry entries.

It groups compatible entities by Home Assistant `deviceId`, enriches them with device metadata, detects supported climate capabilities, and returns only devices that expose a temperature entity.

The builder does not publish HomeKit accessories and does not persist the catalog.

---

# Public Interface

The class exposes one method:

```ts
public build(
  entities: EntityRegistryEntry[],
  devices: DeviceRegistryEntry[],
): ClimateDevice[]
```

The output is an array of normalized `ClimateDevice` objects.

---

# Input Data

The builder consumes two Home Assistant registry models.

## EntityRegistryEntry

Entity entries provide:

- `deviceId`;
- `entityId`;
- `translationKey`;
- other Home Assistant entity metadata.

The builder ignores entities that do not have a `deviceId`.

## DeviceRegistryEntry

Device entries provide metadata used to enrich the resulting climate device.

The builder currently reads:

- user-defined device name;
- device name;
- manufacturer;
- model;
- software version;
- hardware version;
- serial number.

A lookup map is created from the device registry before entity processing.

---

# Grouping Strategy

Entities are grouped by Home Assistant `deviceId`.

Internally, the builder maintains:

```ts
Map<string, ClimateDeviceDraft>
```

Each group represents one candidate climate device.

A draft is initialized only once per Home Assistant device and then enriched as matching entities are encountered.

---

# Device Naming

The display name is resolved in this order:

```text
deviceInfo.nameByUser
        │
        ▼
deviceInfo.name
        │
        ▼
entity.entityId
```

This means a Home Assistant user-defined device name takes priority over the native device name.

If neither device name exists, the entity identifier is used as the fallback.

---

# Metadata Mapping

When a draft is first created, the builder copies available Home Assistant device metadata:

```text
manufacturer
model
softwareVersion
hardwareVersion
serialNumber
```

These properties are compatible with the common `PublishedClimateDevice` contract inherited by `ClimateDevice`.

---

# Capability Detection

The builder detects supported climate capabilities from entity identifiers.

## Temperature

Temperature entities are recognized with:

```regex
/_temperature(_\d+)?$/
```

When matched:

```ts
climateDevice.temperatureEntity =
  entity.entityId;
```

A temperature entity is mandatory for the device to be returned by `build()`.

---

## Humidity

Humidity entities are recognized with:

```regex
/_(humidite|humidity)(_\d+)?$/
```

When matched:

```ts
climateDevice.humidityEntity =
  entity.entityId;

climateDevice.supportsHumidity =
  true;
```

Both French and English Home Assistant naming variants are supported.

---

## Battery

Battery entities are recognized with:

```regex
/_(batterie|battery)(_\d+)?$/
```

Two Home Assistant translation keys are explicitly excluded:

```text
battery_voltage
battery_replacement_description
```

When a valid battery entity is found:

```ts
climateDevice.batteryEntity =
  entity.entityId;

climateDevice.supportsBattery =
  true;
```

This prevents voltage or battery-replacement-description entities from being treated as battery-level sensors.

---

# Filtering

After all entities have been processed, the builder returns only drafts containing a temperature entity.

Conceptually:

```text
All grouped Home Assistant devices
              │
              ▼
Has temperatureEntity?
       │              │
      yes             no
       │              │
       ▼              ▼
ClimateDevice       discarded
```

The implementation uses a TypeScript type predicate so the returned array is typed as `ClimateDevice[]`.

---

# Position in the V2 Architecture

```text
Home Assistant registries
          │
          ▼
ClimateDeviceBuilder
          │
          ▼
ClimateDevice
          │
       extends
          ▼
PublishedClimateDevice
          │
          ▼
Shared catalog / publication pipeline
```

`ClimateDeviceBuilder` is therefore source-specific.

Matter does not use this builder.

Matter devices are handled by `MatterDeviceMapper` and mapped directly to the common `PublishedClimateDevice` publication contract.

---

# Relationship with ClimateDevice

`ClimateDeviceBuilder` constructs the Home Assistant runtime model.

The builder assigns:

- identity;
- display name;
- Home Assistant entity references;
- metadata;
- capability flags.

Runtime measurements such as current temperature, humidity, and battery level are populated elsewhere in the Home Assistant processing pipeline.

---

# Relationship with PublishedClimateDevice

Because `ClimateDevice` extends `PublishedClimateDevice`, metadata assigned by the builder can flow into the shared publication layer.

The builder itself does not need to know about HomeKit.

This keeps Home Assistant entity parsing isolated from source-neutral publication code.

---

# Responsibilities

`ClimateDeviceBuilder` is responsible for:

- grouping entities by device;
- resolving device names;
- attaching Home Assistant device metadata;
- detecting temperature entities;
- detecting humidity entities;
- detecting battery entities;
- setting humidity and battery capability flags;
- excluding unsupported battery-like entities;
- returning only temperature-capable devices.

It is **not** responsible for:

- connecting to Home Assistant;
- receiving WebSocket updates;
- reading current sensor values;
- catalog persistence;
- accessory creation;
- Matter discovery;
- HomeKit characteristics.

---

# Design Principles

## Single Responsibility

The class only transforms Home Assistant registry information into `ClimateDevice` objects.

---

## Deterministic Mapping

Given the same registry inputs, the builder produces the same grouping and capability mapping.

---

## Source Isolation

Home Assistant naming conventions and registry models remain inside the Home Assistant path.

Other providers do not depend on these assumptions.

---

## Minimal Filtering

The builder requires a temperature entity because the plugin publishes climate-oriented HomeKit accessories.

Humidity and battery remain optional capabilities.

---

# Extending Capability Detection

When adding a new Home Assistant capability, changes to this builder may be appropriate when the capability is identified from registry entities.

Before modifying it, determine whether the new property is:

- specific to Home Assistant discovery; or
- part of the source-neutral `PublishedClimateDevice` contract.

A source-specific entity reference should remain on `ClimateDevice`.

A common publishable value or capability may also require a change to `PublishedClimateDevice` and the other provider mappings.

---

# Related Components

- `ClimateDevice`
- `PublishedClimateDevice`
- `ClimateDeviceManager`
- `DiscoveryManager`
- `EventManager`
- `EntityRegistryEntry`
- `DeviceRegistryEntry`

---

# Related Documentation

- [Architecture overview](README.md)
- [Platform](Platform.md)
- [ClimateDevice](ClimateDevice.md)
- [ClimateDeviceManager](ClimateDeviceManager.md)
- [Discovery](Discovery.md)
- [EventManager](EventManager.md)

`ClimateDeviceBuilder` is the boundary that translates Home Assistant registry structure into the plugin's normalized Home Assistant runtime climate model.
