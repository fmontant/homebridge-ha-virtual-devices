# RegistryManager

`RegistryManager` coordinates Home Assistant registry synchronization with the shared catalog and HomeKit publication pipeline.

In V2, it also acts as a bridge between source-specific runtime discovery and the source-neutral publication model by storing `PublishedClimateDevice` instances from both Home Assistant and Matter.

---

# Purpose

`RegistryManager` is responsible for:

- receiving Home Assistant device and entity registries;
- serializing Home Assistant entity-registry synchronizations;
- discovering and preparing Home Assistant climate devices;
- filtering configured ignored Home Assistant devices;
- synchronizing Home Assistant devices into the shared catalog;
- restoring or incrementally updating HomeKit accessories after Home Assistant synchronization;
- remembering source-neutral published climate devices;
- detecting catalog preference changes that require accessory updates;
- removing accessories whose catalog entries disappear.

It does not perform Matter discovery itself. Matter devices are supplied to it through the source-neutral `PublishedClimateDevice` contract.

---

# Internal State

The manager keeps several pieces of runtime state:

```ts
private deviceRegistry:
  DeviceRegistryEntry[] = [];
```

stores the latest Home Assistant device registry.

```ts
private readonly ignoredDevices:
  Set<string>;
```

stores normalized Home Assistant device identifiers and names that must be ignored.

```ts
private initialSynchronizationCompleted =
  false;
```

tracks whether the first Home Assistant publication pass has completed.

```ts
private synchronizationQueue:
  Promise<void> =
    Promise.resolve();
```

serializes Home Assistant entity-registry synchronizations.

```ts
private readonly lastClimateDevices =
  new Map<string, PublishedClimateDevice>();
```

stores the most recent source-neutral runtime representation of devices known to the publication layer.

```ts
private catalogPublicationState =
  new Map<string, string>();
```

stores a compact snapshot of publication-relevant catalog fields.

---

# Construction

The constructor receives:

```text
DiscoveryManager
ClimateDeviceManager
AccessoryManager
CatalogManager
Logging
ignoredDevices[]
```

The `ignoredDevices` configuration is normalized when the manager is created.

Every value is:

1. trimmed;
2. converted to lowercase;
3. discarded if empty;
4. stored in a `Set`.

This makes later comparisons simple and case-insensitive.

---

# Home Assistant Device Registry

`handleDeviceRegistry()` stores a copy of the latest Home Assistant device registry:

```ts
this.deviceRegistry =
  [...devices];
```

It then logs the number of registered devices.

This registry is later required by Home Assistant climate discovery.

---

# Home Assistant Entity Registry

`handleEntityRegistry()` does not synchronize immediately in parallel.

Instead, it chains work onto:

```ts
synchronizationQueue
```

Conceptually:

```text
entity registry update A ─► synchronize A
                                  │
entity registry update B ─────────┘─► synchronize B
                                         │
entity registry update C ────────────────┘─► synchronize C
```

A failed synchronization is propagated to its caller, while the internal queue is recovered with:

```ts
.catch(() => undefined)
```

so that later registry updates are still able to run.

---

# Home Assistant Synchronization Flow

The private method:

```ts
synchronizeEntityRegistry()
```

contains the main Home Assistant registry workflow.

If the Home Assistant device registry is empty, the entity registry is ignored and a warning is logged.

Otherwise the flow is:

```text
EntityRegistryEntry[]
        │
        ▼
DiscoveryManager
        │
        ▼
ClimateDevice[]
        │
        ▼
prepareClimateDevices()
        │
        ▼
prepared Home Assistant ClimateDevice[]
        │
        ▼
replace HA entries in lastClimateDevices
        │
        ▼
CatalogManager.synchronizeClimateDevices()
        │
        ▼
shared DeviceCatalog
        │
        ├── first synchronization
        │      └── restoreClimateAccessories()
        │
        └── later synchronization
               └── applyClimateSynchronization()
```

The resulting catalog publication state is then rebuilt.

---

# Preparing Home Assistant Climate Devices

`prepareClimateDevices()` processes only Home Assistant `ClimateDevice` objects.

Each discovered device is passed through:

```ts
this.climateDeviceManager
  .prepareClimateDevice(...)
```

This enriches the Home Assistant model with current state and display information before publication.

The prepared device is then checked against `ignoredDevices`.

Ignored devices are skipped and logged.

The method returns only devices that remain eligible for the Home Assistant synchronization pipeline.

---

# Ignored Device Matching

The private method:

```ts
isIgnoredDevice(
  deviceId,
  deviceName,
)
```

normalizes both values using:

```text
trim()
lowercase()
```

A device is ignored when either:

```text
normalized device ID
```

or:

```text
normalized device name
```

exists in the configured ignored-device set.

This filtering belongs to the Home Assistant preparation path.

---

# Source-Neutral Runtime Memory

V2 introduces:

```ts
Map<string, PublishedClimateDevice>
```

for `lastClimateDevices`.

The public method:

```ts
rememberPublishedClimateDevices(
  devices: PublishedClimateDevice[],
)
```

stores each device by its identifier.

This allows the publication layer to remember runtime devices regardless of whether they came from Home Assistant or Matter.

---

# Preserving Matter Devices During Home Assistant Synchronization

Before inserting a newly prepared Home Assistant set, `synchronizeEntityRegistry()` removes only remembered devices whose source is:

```ts
'home-assistant'
```

Conceptually:

```text
lastClimateDevices
├── HA device A       ┐
├── HA device B       ├── removed before HA refresh
├── Matter device C   │
└── Matter device D   ┘── preserved
```

The freshly prepared Home Assistant devices are then inserted.

Therefore, a Home Assistant registry refresh does not erase Matter runtime devices from the shared publication memory.

This is an important V2 source-isolation rule.

---

# Initial vs Incremental Home Assistant Publication

After catalog synchronization, behavior depends on:

```ts
initialSynchronizationCompleted
```

## First synchronization

The manager calls:

```ts
accessoryManager
  .restoreClimateAccessories(
    climateDevices,
    deviceCatalog,
  );
```

and marks initial synchronization as completed.

## Later synchronizations

The manager calls:

```ts
accessoryManager
  .applyClimateSynchronization(
    climateDevices,
    synchronizationResult,
    deviceCatalog,
  );
```

This separates initial accessory restoration from later incremental updates.

---

# Catalog Publication State

`createCatalogPublicationState()` builds a map keyed by catalog device ID.

For each device it serializes exactly these fields:

```text
name
enabled
archived
homeKitName
room
favorite
```

Conceptually:

```ts
Map<
  deviceId,
  JSON.stringify({
    name,
    enabled,
    archived,
    homeKitName,
    room,
    favorite,
  })
>
```

This snapshot is used to detect publication-relevant catalog changes.

Notably, the comparison does not include every catalog field.

It focuses only on the fields currently relevant to accessory publication or presentation.

---

# Refreshing from the Catalog

`refreshFromCatalog()` reapplies catalog changes to remembered runtime devices.

If no runtime devices are currently remembered, the method logs a warning and returns.

Otherwise it:

1. copies the previous publication-state map;
2. reloads the catalog;
3. rebuilds the current publication state;
4. compares previous and current state per catalog device;
5. applies only changed entries;
6. removes accessories for catalog entries that disappeared;
7. stores the new publication state.

---

# Applying Changed Catalog Preferences

For each catalog device whose publication state changed, the manager looks up the corresponding runtime device in:

```ts
lastClimateDevices
```

If found, it calls:

```ts
accessoryManager
  .applyCatalogDevice(
    climateDevice,
    catalogDevice,
    deviceCatalog,
  );
```

Because `lastClimateDevices` stores `PublishedClimateDevice`, this refresh path can work with both Home Assistant and Matter runtime devices.

If the runtime device is not found, a warning is logged and that entry is skipped.

---

# Removing Deleted Catalog Accessories

`refreshFromCatalog()` also checks device IDs that existed in the previous publication state but no longer exist in the current catalog.

For those IDs, it calls:

```ts
accessoryManager
  .removeClimateAccessory(
    deviceId,
  );
```

Successful removals are included in the update count.

---

# No-Change Behavior

If no accessory requires updating, `refreshFromCatalog()` logs:

```text
Aucune préférence de publication modifiée
```

and returns.

Otherwise it logs the number of accessories updated from the catalog.

---

# Relationship with Home Assistant

`RegistryManager` is the main coordinator of the Home Assistant registry pipeline.

It receives:

```text
Home Assistant device registry
Home Assistant entity registry
```

and combines them through:

```text
DiscoveryManager
ClimateDeviceManager
CatalogManager
AccessoryManager
```

The Home Assistant path remains provider-specific up to the point where devices participate in the shared publication model.

---

# Relationship with Matter

Matter does not use:

- `handleDeviceRegistry()`;
- `handleEntityRegistry()`;
- `DiscoveryManager`;
- `ClimateDeviceManager`;
- `ignoredDevices`.

Instead, the Matter provider creates source-neutral `PublishedClimateDevice` objects and passes them to:

```ts
rememberPublishedClimateDevices()
```

This allows later catalog refreshes to reapply preferences to Matter accessories through the same publication infrastructure.

---

# Relationship with CatalogManager

`RegistryManager` asks `CatalogManager` to:

- synchronize prepared Home Assistant devices;
- reload the catalog before preference refreshes;
- provide access to the current `DeviceCatalog`.

It does not implement catalog persistence itself.

---

# Relationship with AccessoryManager

`RegistryManager` delegates HomeKit-facing changes to `AccessoryManager`.

Depending on context it calls:

```text
restoreClimateAccessories()
applyClimateSynchronization()
applyCatalogDevice()
removeClimateAccessory()
```

Therefore `RegistryManager` decides **when** publication state must be reconciled, while `AccessoryManager` performs the accessory-level changes.

---

# Responsibilities

`RegistryManager` is responsible for:

- storing the current Home Assistant device registry;
- serializing Home Assistant entity-registry synchronization;
- discovering Home Assistant climate devices;
- preparing Home Assistant climate devices;
- filtering ignored Home Assistant devices;
- maintaining the latest source-neutral runtime device map;
- preserving non-HA runtime devices during HA refreshes;
- synchronizing Home Assistant devices into the catalog;
- distinguishing initial restoration from incremental synchronization;
- tracking publication-relevant catalog state;
- reapplying changed catalog preferences;
- removing accessories for deleted catalog entries.

It is **not** responsible for:

- Matter discovery;
- Matter subscriptions;
- Matter commissioning;
- persistent catalog storage;
- Home Assistant WebSocket transport;
- direct HomeKit accessory implementation;
- UI rendering.

---

# Design Principles

## Provider-Specific Discovery, Shared Publication

Home Assistant discovery remains specialized.

Publication memory uses `PublishedClimateDevice`, which is source-neutral.

---

## Source Isolation

Refreshing Home Assistant runtime devices removes only remembered Home Assistant entries.

Matter runtime devices remain intact.

---

## Serialized Registry Synchronization

Home Assistant entity-registry updates are processed sequentially.

This avoids overlapping synchronization work.

---

## Publication-State Diffing

Catalog refreshes compare a compact set of publication-relevant fields and avoid reapplying unchanged entries.

---

## Separation of Responsibilities

`RegistryManager` coordinates.

`DiscoveryManager` discovers.

`ClimateDeviceManager` prepares HA runtime data.

`CatalogManager` manages the catalog.

`AccessoryManager` applies HomeKit publication changes.

---

# Extending RegistryManager

Changes belong here when they concern:

- coordination of Home Assistant registry synchronization;
- runtime publication-device memory;
- publication-state comparison;
- catalog-to-accessory refresh coordination.

Provider-specific Matter discovery logic should remain in the Matter provider.

When changing fields that should trigger accessory reapplication after a catalog edit, review:

```ts
createCatalogPublicationState()
```

When changing Home Assistant filtering behavior, review:

```ts
prepareClimateDevices()
isIgnoredDevice()
```

When changing source coexistence behavior, review how `lastClimateDevices` is updated during provider-specific synchronization.

---

# Related Components

- `DiscoveryManager`
- `ClimateDeviceManager`
- `CatalogManager`
- `AccessoryManager`
- `PublishedClimateDevice`
- `ClimateDevice`
- `DeviceCatalog`

---

# Related Documentation

- [Architecture overview](README.md)
- [Discovery](Discovery.md)
- [ClimateDevice](ClimateDevice.md)
- [ClimateDeviceManager](ClimateDeviceManager.md)
- [CatalogManager](CatalogManager.md)
- [AccessoryManager](AccessoryManager.md)

`RegistryManager` is the coordination layer that keeps Home Assistant registry discovery, the shared V2 catalog, and source-neutral HomeKit publication synchronized without allowing a Home Assistant refresh to erase Matter runtime devices.
