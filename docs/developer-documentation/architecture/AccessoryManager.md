# AccessoryManager

`AccessoryManager` is the HomeKit publication layer for climate devices.

In V2, its public publication methods operate on the source-neutral `PublishedClimateDevice` contract, allowing both Home Assistant and Matter devices to be exposed through the same HomeKit accessory pipeline.

At the same time, some legacy lifecycle behaviors remain Home Assistant-specific, especially entity-based indexing and the handling of catalog devices marked `Missing`.

---

# Purpose

`AccessoryManager` is responsible for:

- restoring climate accessories from the shared catalog;
- applying catalog preferences to existing devices;
- applying incremental catalog synchronization results;
- creating or restoring Homebridge platform accessories;
- creating `ClimateAccessory` wrappers;
- indexing Home Assistant entities;
- removing unpublished or deleted accessories;
- updating temperature, humidity, battery, entity values, and availability;
- removing obsolete Home Assistant accessories;
- maintaining source-specific discovery state;
- keeping missing Home Assistant accessories visible but unavailable.

It is the main boundary between the shared runtime/catalog model and Homebridge platform accessories.

---

# Source-Neutral Publication Contract

The V2 publication-facing methods use:

```ts
PublishedClimateDevice
```

rather than only `ClimateDevice`.

Examples include:

```ts
restoreClimateAccessories(
  climateDevices: PublishedClimateDevice[],
  deviceCatalog: DeviceCatalog,
)

applyCatalogDevice(
  climateDevice: PublishedClimateDevice,
  catalogDevice: CatalogDevice,
  deviceCatalog: DeviceCatalog,
)

applyClimateSynchronization(
  climateDevices: PublishedClimateDevice[],
  ...
)

registerClimateAccessory(
  device: PublishedClimateDevice,
)
```

This allows Home Assistant and Matter devices to share the same HomeKit publication path.

---

# Internal Runtime State

The manager maintains several runtime indexes.

## Active accessory UUIDs

```ts
activeAccessoryUUIDs
```

tracks accessories considered active during discovery and restoration.

## Entity index

```ts
entityIndex
```

maps Home Assistant entity IDs to their corresponding device and `ClimateAccessory`.

This index is used only by entity-based update paths.

## Climate accessories by device ID

```ts
climateAccessoriesByDeviceId
```

provides direct lookup by plugin device ID.

This is the important V2 path for Matter updates.

---

# Restoring Climate Accessories

`restoreClimateAccessories()` rebuilds the publication state from runtime devices and the persistent catalog.

It begins by clearing discovery state for:

```ts
'home-assistant'
```

It then processes every runtime climate device.

For each device:

1. look up the corresponding catalog entry;
2. skip and warn if the catalog entry is missing;
3. evaluate `DeviceCatalog.shouldPublish()`;
4. remove the accessory if publication is disabled;
5. otherwise create the publication-facing device;
6. register or restore the HomeKit accessory.

After processing runtime devices, it scans the whole catalog for devices whose state is:

```ts
CatalogDeviceState.Missing
```

and which remain publishable.

Those accessories are kept and marked unavailable through `markClimateAccessoryMissing()`.

Finally:

```ts
removeObsoleteAccessories()
```

removes stale non-Matter accessories that were not restored as active.

---

# Applying One Catalog Device

`applyCatalogDevice()` applies catalog preferences to one runtime device.

If:

```ts
deviceCatalog.shouldPublish(
  catalogDevice.id,
)
```

returns `false`, the corresponding accessory is removed.

Otherwise the manager builds the publication-facing device and passes it to:

```ts
registerClimateAccessory()
```

This method is used by `RegistryManager.refreshFromCatalog()` when publication-relevant preferences change.

---

# Applying Incremental Synchronization

`applyClimateSynchronization()` processes a `CatalogSynchronizationResult`.

It first indexes the runtime devices by ID.

It then combines:

```text
added
updated
```

into a single set of catalog devices to process.

For each:

- find the matching runtime device;
- skip and warn if no runtime device exists;
- remove the accessory if the catalog says not to publish;
- otherwise create and register the publication-facing device.

Devices in:

```text
missing
```

are handled separately.

If no longer publishable, their accessory is removed.

If still publishable, `markClimateAccessoryMissing()` attempts to keep the accessory visible but unavailable.

---

# Creating the Published Device

Before registering an accessory, `createPublishedClimateDevice()` merges runtime data with catalog-controlled publication data.

It preserves the runtime device:

```ts
...climateDevice
```

but overwrites:

```ts
source:
  catalogDevice.source
```

and computes the published name from:

```ts
catalogDevice.preferences.homeKitName?.trim()
```

when present.

Otherwise it falls back to:

```ts
DisplayNameFormatter.format(
  catalogDevice.name,
)
```

This makes the persistent catalog the authority for the source field and HomeKit-facing custom name.

---

# HomeKit Accessory UUID

The UUID is deterministic and derived from the plugin device ID:

```ts
this.api.hap.uuid.generate(
  `sensor-v2:${deviceId}`,
);
```

Therefore the same device ID resolves to the same Homebridge accessory UUID across restarts.

---

# Registering or Restoring an Accessory

`registerClimateAccessory()` first calculates the deterministic UUID and marks it active.

It removes any previous entity-index entry for that UUID before rebuilding indexes.

## Existing accessory

If the platform accessory already exists:

- it is treated as a restoration;
- `displayName` is updated;
- `accessory.context.device` is replaced with the current runtime device;
- the HomeKit `AccessoryInformation.Name` characteristic is updated;
- Homebridge is notified through `updatePlatformAccessories()`.

## New accessory

If no accessory exists:

- a new `platformAccessory` is created;
- the runtime device is stored in `accessory.context.device`;
- the accessory is registered with Homebridge;
- it is added to the internal accessory map.

In both cases, the manager then creates a fresh:

```ts
ClimateAccessory
```

through `AccessoryFactory`.

The wrapper is stored by device ID.

---

# Home Assistant Entity Indexing

After registration, the manager calls:

```ts
getClimateEntityIds()
```

The method first checks:

```ts
'temperatureEntity' in device
```

If that property does not exist, it returns an empty array.

This is how the publication layer distinguishes Home Assistant runtime devices from source-neutral Matter devices for entity indexing.

For a `ClimateDevice`, it collects:

```text
temperatureEntity
humidityEntity
batteryEntity
```

and filters out absent or empty values.

Each valid entity is registered in `AccessoryEntityIndex`.

Matter devices therefore do not use this entity-index path.

---

# Removing an Accessory

`removeClimateAccessory()` derives the deterministic UUID from the device ID.

It always clears runtime state first:

- removes the UUID from `activeAccessoryUUIDs`;
- removes entity-index mappings;
- removes the `ClimateAccessory` wrapper from the device-ID map.

If no Homebridge accessory exists, the method returns:

```ts
false
```

Otherwise it:

- logs the removal;
- unregisters the platform accessory;
- removes it from the internal accessory map;
- returns `true`.

---

# Direct Device Updates

V2 adds direct device-ID update paths:

```ts
updateTemperature(
  deviceId,
  value,
)

updateHumidity(
  deviceId,
  value,
)

updateBattery(
  deviceId,
  value,
)
```

Each method looks up the `ClimateAccessory` through:

```ts
climateAccessoriesByDeviceId
```

If found, it delegates the value update to the wrapper and returns `true`.

If no wrapper exists, it returns `false`.

These methods are suitable for Matter subscriptions because Matter updates are keyed by plugin device ID rather than Home Assistant entity ID.

---

# Home Assistant Entity Updates

`updateEntity()` remains entity-based.

It resolves the wrapper through:

```ts
entityIndex.getAccessory(
  entityId,
)
```

and delegates to:

```ts
accessory.updateEntity(
  entityId,
  value,
)
```

This is the Home Assistant real-time update path.

---

# Availability Updates

`updateAvailability()` also starts from a Home Assistant entity ID.

It resolves both:

```text
ClimateAccessory
deviceId
```

through `AccessoryEntityIndex`.

If either lookup fails, it returns `false`.

Otherwise it:

1. updates availability on the `ClimateAccessory`;
2. asynchronously asks `CatalogManager` to persist the device availability.

The catalog persistence call is intentionally non-blocking:

```ts
void this.catalogManager
  .setAvailability(...)
```

Persistence errors are logged but do not cancel the already-applied accessory update.

---

# Removing Obsolete Accessories

`removeObsoleteAccessories()` scans the current Homebridge accessory map.

A crucial V2 guard is:

```ts
if (
  device?.source === 'matter'
) {
  continue;
}
```

Matter accessories are therefore excluded from this obsolete-accessory cleanup.

For non-Matter accessories, any UUID not present in `activeAccessoryUUIDs` is considered obsolete.

Such accessories are:

- collected for Homebridge unregistration;
- removed from the internal accessory map;
- removed from the entity index.

If at least one obsolete accessory exists, they are unregistered in one Homebridge call.

---

# Clearing Discovery State

`clearDiscoveryState(source)` removes runtime discovery state for one source.

For active UUIDs, it inspects:

```ts
accessory.context.device.source
```

and preserves entries whose explicit source differs from the requested source.

It applies the same source check when deleting entries from:

```ts
climateAccessoriesByDeviceId
```

This allows a Home Assistant refresh to clear Home Assistant publication state without deleting Matter wrappers.

The method also calls:

```ts
entityIndex.clear()
```

globally.

This remains appropriate because `AccessoryEntityIndex` is used by the Home Assistant entity-based update path, while Matter uses direct device-ID updates.

---

# Missing Accessory Handling

`markClimateAccessoryMissing()` keeps an already-published accessory visible while making its entities unavailable.

This path is currently **Home Assistant-specific**.

The method reads:

```ts
accessory.context.device
```

as a `ClimateDevice` and requires:

```ts
typeof device.temperatureEntity ===
'string'
```

If the context does not satisfy this Home Assistant shape, the method logs a warning and returns `false`.

When valid, it:

- marks the UUID active;
- clears old entity-index mappings for the accessory;
- recreates the `ClimateAccessory`;
- stores it by device ID;
- re-registers its Home Assistant entity IDs;
- marks every indexed entity unavailable;
- asynchronously persists `available: false` through `CatalogManager`;
- keeps the HomeKit tile registered.

This behavior preserves a missing Home Assistant device as an unavailable tile rather than deleting it immediately.

It should not be documented as a generic Matter/HA missing-device mechanism.

---

# Synchronization Logging

`logClimateSynchronizationSummary()` reports non-zero counts for:

```text
published devices
unpublished devices
missing devices kept
```

It does not alter synchronization state.

---

# V2 Runtime Paths

The two main update paths are intentionally different.

## Home Assistant

```text
Home Assistant state event
        │
        ▼
entityId
        │
        ▼
AccessoryEntityIndex
        │
        ▼
ClimateAccessory
```

## Matter

```text
Matter subscription
        │
        ▼
deviceId
        │
        ▼
climateAccessoriesByDeviceId
        │
        ▼
ClimateAccessory
```

Both ultimately update the same HomeKit-facing wrapper.

---

# Relationship with DeviceCatalog

`AccessoryManager` consults:

```ts
DeviceCatalog.shouldPublish()
```

before publishing or retaining accessories.

It does not decide publication policy itself.

It also uses catalog data to derive the HomeKit-facing name and source.

---

# Relationship with CatalogManager

`CatalogManager` is used to persist availability changes.

The accessory layer applies runtime availability first, then delegates persistent catalog state to `CatalogManager`.

---

# Relationship with RegistryManager

`RegistryManager` decides when to call:

```text
restoreClimateAccessories()
applyClimateSynchronization()
applyCatalogDevice()
removeClimateAccessory()
```

`AccessoryManager` performs the actual Homebridge/HomeKit changes.

---

# Relationship with AccessoryFactory

`AccessoryFactory` creates a `ClimateAccessory` wrapper from:

```text
PublishedClimateDevice
PlatformAccessory
```

`AccessoryManager` owns when those wrappers must be created or recreated.

---

# Responsibilities

`AccessoryManager` is responsible for:

- translating publishable runtime devices into Homebridge accessories;
- restoring existing platform accessories;
- registering new platform accessories;
- updating HomeKit-facing names;
- storing current runtime device context;
- creating `ClimateAccessory` wrappers;
- indexing Home Assistant entities;
- maintaining direct device-ID lookup for source-neutral updates;
- applying catalog publication decisions;
- removing unpublished accessories;
- updating measurements;
- propagating availability;
- protecting Matter accessories from HA-oriented obsolete cleanup;
- preserving missing Home Assistant accessories as unavailable.

It is **not** responsible for:

- discovering devices;
- parsing Home Assistant registries;
- Matter commissioning;
- deciding catalog persistence format;
- implementing `shouldPublish()` policy;
- rendering the UI.

---

# Design Principles

## Shared Publication, Source-Specific Runtime Paths

Home Assistant and Matter both use `PublishedClimateDevice` for publication.

Their real-time update paths remain different where their source models differ.

---

## Stable Homebridge Identity

Accessory UUIDs are derived deterministically from:

```text
sensor-v2:<deviceId>
```

---

## Catalog-Controlled Publication

The catalog determines whether a device should exist in HomeKit and which custom name should be used.

---

## Matter Protection During HA Cleanup

Matter accessories are explicitly skipped by `removeObsoleteAccessories()`.

Source-specific discovery clearing also preserves devices from other sources.

---

## Explicit HA-Specific Missing Logic

The current missing-accessory preservation mechanism depends on `ClimateDevice.temperatureEntity`.

It remains an HA-specific path and should stay documented as such unless the implementation changes.

---

# Extending AccessoryManager

Changes belong here when they concern:

- Homebridge accessory registration or removal;
- publication reconciliation;
- HomeKit-facing naming;
- runtime accessory indexing;
- source-specific cleanup boundaries;
- direct measurement updates;
- missing-accessory representation.

When adding a new source-neutral measurement, review:

- `PublishedClimateDevice`;
- `ClimateAccessory`;
- direct device-ID update methods.

When changing Home Assistant entity behavior, review:

- `AccessoryEntityIndex`;
- `getClimateEntityIds()`;
- `updateEntity()`;
- `updateAvailability()`;
- `markClimateAccessoryMissing()`.

When modifying source coexistence rules, review carefully:

- `clearDiscoveryState()`;
- `removeObsoleteAccessories()`.

---

# Related Components

- `ClimateAccessory`
- `AccessoryFactory`
- `AccessoryEntityIndex`
- `RegistryManager`
- `CatalogManager`
- `DeviceCatalog`
- `PublishedClimateDevice`
- `ClimateDevice`

---

# Related Documentation

- [Architecture overview](README.md)
- [RegistryManager](RegistryManager.md)
- [CatalogManager](CatalogManager.md)
- [ClimateAccessory](ClimateAccessory.md)
- [ClimateDevice](ClimateDevice.md)

`AccessoryManager` is the shared V2 HomeKit publication coordinator: it exposes both Home Assistant and Matter runtime devices through one accessory pipeline while retaining source-specific handling where the underlying provider models genuinely differ.
