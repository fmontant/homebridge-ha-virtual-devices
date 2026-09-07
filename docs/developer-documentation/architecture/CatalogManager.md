# CatalogManager

The `CatalogManager` class is the main service layer around the persistent device catalog.

In V2, it is a shared component used by both Home Assistant and Matter. Its central role is to coordinate source-aware discovery synchronization, catalog loading and saving, plugin synchronization state, and access to device preferences and publication decisions.

It does not discover devices itself and does not implement HomeKit accessory behavior.

---

# Purpose

`CatalogManager` provides a stable API over `DeviceCatalog`.

It coordinates:

- catalog loading;
- catalog reloading;
- catalog saving;
- synchronization of discovered devices;
- source-aware synchronization;
- synchronization timestamps;
- access to stored devices;
- user preference updates;
- publication decisions;
- explicit device removal.

This keeps callers from depending directly on catalog persistence details.

---

# Dependencies

The manager receives three dependencies through its constructor:

```ts
constructor(
  private readonly deviceCatalog:
    DeviceCatalog,
  private readonly pluginStateStore:
    PluginStateStore,
  private readonly log:
    Logging,
) { }
```

It also owns one mapper:

```ts
private readonly climateDeviceCatalogMapper =
  new ClimateDeviceCatalogMapper();
```

The mapper is used by the historical Home Assistant-specific synchronization entry point.

---

# V2 Source-Aware Synchronization

The key V2 method is:

```ts
public async synchronizeDiscoveredDevices(
  discoveredDevices:
    DiscoveredCatalogDevice[],
  source: string,
): Promise<CatalogSynchronizationResult>
```

This is the shared synchronization entry point.

The method:

1. ensures that the catalog is loaded;
2. delegates synchronization to `DeviceCatalog`;
3. passes the source explicitly;
4. saves the catalog;
5. stores the synchronization timestamp;
6. logs added, updated, and missing counts;
7. returns the synchronization result.

Conceptually:

```text
Discovered devices
      │
      ├── source = home-assistant
      │
      └── source = matter
      │
      ▼
CatalogManager.synchronizeDiscoveredDevices()
      │
      ▼
DeviceCatalog.synchronize(
  discoveredDevices,
  source,
)
      │
      ▼
Persistent shared catalog
```

The explicit `source` parameter is what makes the catalog synchronization source-aware.

---

# Home Assistant Compatibility Entry Point

For Home Assistant, the manager still exposes:

```ts
public async synchronizeClimateDevices(
  climateDevices: ClimateDevice[],
): Promise<CatalogSynchronizationResult>
```

This method converts `ClimateDevice[]` into `DiscoveredCatalogDevice[]` through:

```ts
ClimateDeviceCatalogMapper
```

and then delegates to:

```ts
synchronizeDiscoveredDevices(
  discoveredCatalogDevices,
  'home-assistant',
)
```

This preserves the existing Home Assistant path while reusing the shared V2 synchronization mechanism.

---

# Matter Synchronization

Matter does not use `synchronizeClimateDevices()`.

The Matter path produces `DiscoveredCatalogDevice[]` through its own mapper and calls:

```ts
synchronizeDiscoveredDevices(
  discoveredDevices,
  'matter',
)
```

This avoids forcing Matter devices through the Home Assistant `ClimateDevice` model.

---

# Synchronization Result

The manager returns a:

```ts
CatalogSynchronizationResult
```

The current synchronization log reports:

- number of devices added;
- number of devices updated;
- number of devices missing.

The log format is:

```text
<n> appareils ajoutés,
<n> appareils mis à jour,
<n> appareils absents
```

The exact rules used to classify devices belong to `DeviceCatalog.synchronize()`.

---

# Synchronization Timestamp

After a successful synchronization and catalog save, the manager records the synchronization time through:

```ts
this.pluginStateStore
  .saveSynchronization(
    new Date(),
  );
```

This separates persistent device data from plugin-level synchronization state.

---

# Catalog Loading

The manager tracks loading state with:

```ts
private catalogLoaded = false;
```

and:

```ts
private catalogLoading:
  Promise<void> | undefined;
```

The public method:

```ts
public async load():
  Promise<void>
```

avoids redundant loads.

If the catalog is already loaded:

```ts
if (this.catalogLoaded) {
  return;
}
```

If another load is already in progress, callers wait for the same promise:

```ts
if (this.catalogLoading) {
  await this.catalogLoading;
  return;
}
```

This prevents concurrent callers from starting duplicate catalog loads.

---

# Internal Catalog Load

The actual load operation is performed by:

```ts
private async loadCatalog():
  Promise<void>
```

It delegates to:

```ts
this.deviceCatalog.load();
```

then marks the catalog as loaded:

```ts
this.catalogLoaded = true;
```

and logs the number of devices loaded.

---

# Reloading

The method:

```ts
public async reload():
  Promise<void>
```

waits for any existing load to complete, resets:

```ts
catalogLoaded = false
```

and calls `load()` again.

This provides an explicit way to refresh the in-memory catalog from persistent storage.

---

# Saving

The public method:

```ts
public async save():
  Promise<void>
```

first guarantees that the catalog has been loaded, then delegates to:

```ts
this.deviceCatalog.save();
```

The persistence implementation itself remains inside `DeviceCatalog`.

---

# Catalog Access

The manager provides read access through:

```ts
getAll()
get(id)
has(id)
```

These methods delegate directly to `DeviceCatalog`.

It also exposes:

```ts
getCatalog()
```

which returns the underlying `DeviceCatalog` instance.

---

# Device State and Preferences

The manager exposes delegated read helpers for:

```ts
isEnabled(id)
isHidden(id)
isArchived(id)
isFavorite(id)
shouldPublish(id)
```

These methods do not implement their own policy.

They delegate the decision to `DeviceCatalog`.

In particular, the exact publication rule belongs to:

```ts
DeviceCatalog.shouldPublish(id)
```

and should be documented from that class rather than duplicated here.

---

# Preference Updates

The manager exposes asynchronous setters for:

```ts
setEnabled(id, enabled)
setHidden(id, hidden)
setArchived(id, archived)
setFavorite(id, favorite)
setRoom(id, room?)
setHomeKitName(id, homeKitName?)
setFirstViewedAt(id)
setAvailability(id, available)
```

Each method:

1. ensures that the catalog is loaded;
2. delegates the mutation to `DeviceCatalog`;
3. returns the resulting boolean.

The manager itself does not duplicate validation or mutation rules.

---

# Device Removal

`removeDevice()` is slightly more involved.

The method:

1. ensures that the catalog is loaded;
2. verifies that the device exists;
3. removes it from `DeviceCatalog`;
4. saves the catalog;
5. logs the removal;
6. returns `true`.

If the device does not exist, it returns:

```ts
false
```

The current log format is:

```text
Appareil supprimé du catalogue : <id>
```

---

# Position in the V2 Architecture

```text
Home Assistant                    Matter
      │                              │
      ▼                              ▼
ClimateDeviceCatalogMapper   Matter catalog mapper
      │                              │
      └──────────────┬───────────────┘
                     ▼
          DiscoveredCatalogDevice[]
                     │
                     ▼
              CatalogManager
                     │
                     ▼
          DeviceCatalog.synchronize()
                     │
                     ▼
          Shared persistent catalog
```

The catalog is common.

The source remains explicit during synchronization.

---

# Relationship with DeviceCatalog

`CatalogManager` is primarily an orchestration and service layer.

`DeviceCatalog` owns the underlying catalog behavior.

`CatalogManager` adds:

- load coordination;
- source-aware synchronization orchestration;
- synchronization-state persistence;
- logging;
- a stable API for callers.

The actual catalog rules remain in `DeviceCatalog`.

---

# Relationship with ClimateDeviceCatalogMapper

`ClimateDeviceCatalogMapper` belongs to the Home Assistant compatibility path.

Its role is to transform:

```text
ClimateDevice[]
```

into:

```text
DiscoveredCatalogDevice[]
```

before the shared synchronization method is called.

Matter uses its own catalog mapping code instead.

---

# Relationship with PluginStateStore

`PluginStateStore` is used here to persist the time of the latest successful synchronization.

It does not replace `DeviceCatalog` persistence.

The two stores serve different purposes:

| Component | Purpose |
| --- | --- |
| `DeviceCatalog` | Persistent device catalog |
| `PluginStateStore` | Plugin-level synchronization state |

---

# Relationship with HomeKit Publication

`CatalogManager` does not publish accessories itself.

Instead, downstream components can query catalog state and publication eligibility through methods such as:

```ts
shouldPublish(id)
```

The publication policy itself is delegated to `DeviceCatalog`.

Accessory creation and update remain the responsibility of the accessory-management layer.

---

# Responsibilities

`CatalogManager` is responsible for:

- coordinating catalog loading;
- preventing duplicate concurrent loads;
- reloading the catalog;
- saving the catalog;
- synchronizing Home Assistant discoveries;
- synchronizing generic discovered devices by source;
- passing source information to `DeviceCatalog`;
- storing the latest synchronization time;
- exposing catalog queries;
- exposing delegated preference updates;
- exposing publication decisions;
- explicitly removing devices;
- logging synchronization and removal results.

It is **not** responsible for:

- discovering Home Assistant entities;
- discovering Matter devices;
- implementing catalog matching rules;
- implementing persistence serialization;
- implementing HomeKit accessories;
- handling live sensor events.

---

# Design Principles

## Source-Aware Shared Catalog

The V2 catalog is shared, but synchronization carries an explicit source.

This allows Home Assistant and Matter to coexist without forcing them through the same acquisition model.

---

## Compatibility Without Duplication

The historical Home Assistant method remains available but delegates to the generic source-aware method.

---

## Thin Service Layer

Most catalog decisions remain in `DeviceCatalog`.

`CatalogManager` coordinates lifecycle and cross-component concerns rather than duplicating catalog logic.

---

## Controlled Loading

The `catalogLoaded` flag and `catalogLoading` promise protect the catalog from redundant concurrent load operations.

---

# Extending CatalogManager

Changes belong here when they concern:

- catalog lifecycle orchestration;
- source-aware synchronization entry points;
- cross-component state coordination;
- service-level logging.

Changes belong in `DeviceCatalog` when they concern:

- matching discovered devices;
- missing-device rules;
- preference semantics;
- publication policy;
- persistent catalog mutations.

Provider-specific discovery mapping should remain in the corresponding source-specific mapper.

---

# Related Components

- `DeviceCatalog`
- `DiscoveredCatalogDevice`
- `CatalogSynchronizationResult`
- `PluginStateStore`
- `ClimateDeviceCatalogMapper`
- `ClimateDevice`
- Matter catalog mapper
- `AccessoryManager`

---

# Related Documentation

- [Architecture overview](README.md)
- [Platform](Platform.md)
- [ClimateDevice](ClimateDevice.md)
- [DeviceCatalog](DeviceCatalog.md)
- [DeviceCatalogStore](DeviceCatalogStore.md)
- [AccessoryManager](AccessoryManager.md)

`CatalogManager` is the shared V2 catalog service: it coordinates persistent catalog lifecycle and source-aware synchronization while leaving catalog rules and persistence details to `DeviceCatalog`.
