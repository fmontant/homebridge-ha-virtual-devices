# DeviceCatalog

The `DeviceCatalog` class is the in-memory and persistent catalog model used by **Homebridge HA Virtual Devices**.

In V2, it is shared by both Home Assistant and Matter.

Its most important responsibility is to synchronize discovered devices while keeping source-specific absence handling isolated: a synchronization from one source must not mark devices from another source as missing.

---

# Purpose

`DeviceCatalog` stores catalog devices in memory and delegates persistence to `DeviceCatalogStore`.

It owns the core catalog rules for:

- loading and saving devices;
- synchronizing discovered devices;
- adding new devices;
- updating existing devices;
- marking missing devices;
- preserving user preferences;
- evaluating publication eligibility;
- updating preferences and runtime catalog state;
- exposing direct catalog access.

`CatalogManager` coordinates when these operations happen. `DeviceCatalog` implements the actual catalog behavior.

---

# Internal Storage

Devices are held in:

```ts
private readonly devices =
  new Map<string, CatalogDevice>();
```

The map key is the catalog device identifier.

---

# Persistence

The class receives one persistence dependency:

```ts
constructor(
  private readonly store:
    DeviceCatalogStore,
) { }
```

## Loading

```ts
public async load():
  Promise<void>
```

The load sequence is:

1. clear the current in-memory map;
2. load persisted devices from `DeviceCatalogStore`;
3. reinsert every device into the map.

Conceptually:

```text
DeviceCatalogStore
      │
      ▼
   load()
      │
      ▼
CatalogDevice[]
      │
      ▼
DeviceCatalog Map
```

## Saving

```ts
public async save():
  Promise<void>
```

delegates persistence to:

```ts
this.store.save(
  this.getAll(),
);
```

---

# Source-Aware Synchronization

The V2 synchronization entry point is:

```ts
public synchronize(
  discoveredDevices:
    DiscoveredCatalogDevice[],
  source: string,
): CatalogSynchronizationResult
```

The method:

1. creates a synchronization result;
2. creates a timestamp;
3. records discovered identifiers;
4. processes discovered devices;
5. marks missing devices for the current source only;
6. returns the result.

```text
DiscoveredCatalogDevice[]
          │
          ▼
DeviceCatalog.synchronize(source)
          │
      ┌───┴───────────────┐
      ▼                   ▼
process discovered   mark missing
      │                   │
      └─────────┬─────────┘
                ▼
CatalogSynchronizationResult
```

---

# Processing Discovered Devices

For each discovered device, `processDiscoveredDevices()` first records its identifier in the current discovery set.

It then checks whether the device already exists.

## New Device

If no existing device is found:

```ts
const catalogDevice =
  this.createCatalogDevice(
    discoveredDevice,
    now,
  );
```

The new device is inserted into the map and added to:

```ts
result.added
```

## Existing Device

For an existing device, the catalog evaluates:

```ts
const hasChanged =
  this.hasDeviceChanged(
    existingDevice,
    discoveredDevice,
  );
```

and:

```ts
const wasMissing =
  existingDevice.state ===
  CatalogDeviceState.Missing;
```

`lastSeen` is refreshed immediately.

If nothing changed and the device was not missing, no further update is required.

Otherwise, `updateCatalogDevice()` refreshes the technical discovery data and the device is added to:

```ts
result.updated
```

---

# Source-Specific Missing Detection

`markMissingDevices()` is a critical V2 rule.

Before marking any device as missing, it checks:

```ts
if (
  existingDevice.source !== source
) {
  continue;
}
```

Therefore:

```text
Home Assistant synchronization
        │
        └── may mark only Home Assistant devices missing

Matter synchronization
        │
        └── may mark only Matter devices missing
```

A Matter synchronization cannot mark a Home Assistant catalog entry missing, and a Home Assistant synchronization cannot mark a Matter entry missing.

The method also skips:

- identifiers seen in the current discovery;
- devices already in `Missing` state.

When a device becomes missing:

```ts
existingDevice.state =
  CatalogDeviceState.Missing;
```

The catalog sets:

```ts
missingSince
```

if it was not already set, updates `lastUpdated`, and records the device in:

```ts
result.missing
```

---

# Creating a Catalog Device

`createCatalogDevice()` copies the discovered technical data:

```text
id
source
sourceId
name
state
capabilities
metadata
```

A new device receives default preferences:

```ts
preferences: {
  enabled: true,
  favorite: false,
  hidden: false,
  archived: false,
}
```

It also receives initial timestamps:

```text
discoveredAt = now
lastSeen     = now
lastUpdated  = now
```

and:

```ts
available: true
```

---

# Updating an Existing Device

`updateCatalogDevice()` refreshes discovery-controlled fields:

```text
source
sourceId
name
state
capabilities
metadata
lastSeen
lastUpdated
```

It also clears:

```ts
missingSince
```

when the device is rediscovered.

Importantly, it does **not** replace the `preferences` object.

This preserves user-controlled catalog preferences across rediscovery.

---

# Preference Preservation

Because discovery updates do not overwrite `preferences`, values such as:

- enabled;
- favorite;
- hidden;
- archived;
- custom HomeKit name;
- room;

can survive technical rediscovery.

This separation is intentional:

```text
Provider discovery data
        │
        ▼
technical catalog fields

User configuration
        │
        ▼
preferences
```

The two lifecycles are kept separate.

---

# Publication Rule

The exact publication rule is implemented by:

```ts
public shouldPublish(
  id: string,
): boolean
```

A device is publishable only when:

```ts
device.preferences.enabled &&
!device.preferences.archived
```

Therefore:

```text
enabled = true
archived = false
        │
        ▼
   publishable
```

`hidden` and `favorite` do **not** participate in `shouldPublish()`.

If the device does not exist, `shouldPublish()` returns `false`.

---

# Preference Queries

The catalog exposes:

```ts
isEnabled(id)
isHidden(id)
isArchived(id)
isFavorite(id)
```

If the device is unknown, each method returns `false`.

---

# Preference Updates

The catalog exposes:

```ts
setEnabled(id, enabled)
setHidden(id, hidden)
setArchived(id, archived)
setFavorite(id, favorite)
setHomeKitName(id, homeKitName?)
setRoom(id, room?)
```

Most preference changes use the private helper:

```ts
updatePreference()
```

If the device does not exist, the operation returns `false`.

If the requested value is already set, the operation returns `true` without saving.

When a preference actually changes:

1. the preference is updated;
2. `lastUpdated` is refreshed;
3. the catalog is saved;
4. `true` is returned.

---

# HomeKit Name Normalization

`setHomeKitName()` trims the incoming value.

An empty or whitespace-only value becomes:

```ts
undefined
```

Therefore clearing the custom name does not persist an empty string.

---

# Room Normalization

`setRoom()` follows the same rule.

The value is trimmed, and an empty or whitespace-only room becomes:

```ts
undefined
```

The room stored here is plugin catalog metadata.

It does not itself move an accessory between rooms in Apple Home.

---

# First Viewed Timestamp

`setFirstViewedAt()` records the first time a device is viewed.

If the device does not exist:

```ts
false
```

is returned.

If `firstViewedAt` already exists, the method returns `true` without changing it.

Otherwise the current timestamp is stored and the catalog is saved.

---

# Availability

`setAvailability()` updates the catalog-level:

```ts
available
```

flag.

If the requested value is already current, it returns `true` without saving.

When availability changes:

- `available` is updated;
- `lastUpdated` is refreshed;
- the catalog is saved.

---

# Direct Map Operations

The class also exposes low-level methods:

```ts
set(device)
remove(id)
clear()
```

These mutate the in-memory map directly.

They do not automatically imply persistence unless the caller subsequently invokes `save()` or uses a higher-level method that saves.

---

# Relationship with CatalogManager

`CatalogManager` is the orchestration layer.

`DeviceCatalog` is the rules layer.

```text
CatalogManager
      │
      ▼
DeviceCatalog
      │
      ├── synchronization rules
      ├── missing-device rules
      ├── preference semantics
      ├── publication rule
      └── persistence delegation
```

`CatalogManager` additionally handles:

- coordinated loading;
- synchronization timestamps;
- logging;
- provider-facing service methods.

---

# Relationship with DeviceCatalogStore

`DeviceCatalogStore` owns the physical persistence mechanism.

`DeviceCatalog` works with arrays of `CatalogDevice` and does not need to know how storage is implemented.

```text
DeviceCatalog
      │
      ▼
DeviceCatalogStore
      │
      ▼
Persistent catalog file
```

---

# Relationship with Providers

Providers do not directly control persistent user preferences.

They supply `DiscoveredCatalogDevice` data.

The catalog then merges technical discovery information with the persistent catalog model.

In V2:

```text
Home Assistant ─┐
                ├──► DiscoveredCatalogDevice[] ─► DeviceCatalog
Matter ─────────┘
```

The `source` field remains part of each catalog entry and is used to isolate missing-device detection.

---

# Responsibilities

`DeviceCatalog` is responsible for:

- maintaining the in-memory device map;
- loading persistent devices;
- saving persistent devices;
- synchronizing discoveries;
- creating catalog entries;
- updating technical discovery information;
- preserving user preferences across rediscovery;
- marking devices missing only within the synchronized source;
- restoring rediscovered devices from missing state;
- exposing preference queries;
- implementing publication eligibility;
- updating preferences;
- normalizing custom HomeKit names and rooms;
- recording first-view timestamps;
- recording availability;
- exposing low-level map mutations.

It is **not** responsible for:

- provider discovery;
- Matter commissioning;
- Home Assistant WebSocket handling;
- plugin-level synchronization timestamps;
- HomeKit accessory implementation;
- UI rendering.

---

# Design Principles

## Source Isolation

Missing-device detection is constrained by `source`.

This is the core rule that allows Home Assistant and Matter to share one catalog safely.

---

## Persistent User Intent

Provider rediscovery may update technical fields, but it does not overwrite user preferences.

---

## Explicit Publication Policy

Publication is determined only by:

```text
enabled && !archived
```

Other UI preferences remain independent.

---

## Persistence Behind an Abstraction

Physical storage is delegated to `DeviceCatalogStore`.

---

## Idempotent Preference Updates

Requesting an already-current preference succeeds without causing an unnecessary save.

---

# Extending DeviceCatalog

Changes belong here when they concern:

- synchronization matching;
- source-specific missing behavior;
- persistent catalog state;
- preference semantics;
- publication eligibility.

Provider-specific mapping should remain outside this class.

When adding a new persistent preference, review:

- `CatalogDevice`;
- catalog creation defaults;
- preference update logic;
- persistence compatibility;
- UI/API mapping.

When adding new discovery-controlled technical data, review:

- `createCatalogDevice()`;
- `updateCatalogDevice()`;
- `hasDeviceChanged()` and its comparison helpers.

---

# Related Components

- `CatalogManager`
- `DeviceCatalogStore`
- `CatalogDevice`
- `DiscoveredCatalogDevice`
- `CatalogSynchronizationResult`
- `ClimateDeviceCatalogMapper`
- Matter catalog mapper

---

# Related Documentation

- [Architecture overview](README.md)
- [Platform](Platform.md)
- [CatalogManager](CatalogManager.md)
- [DeviceCatalogStore](DeviceCatalogStore.md)
- [CatalogApi](CatalogApi.md)
- [AccessoryManager](AccessoryManager.md)

`DeviceCatalog` is the core persistent catalog model of V2. It allows multiple providers to share the same catalog while keeping synchronization source-aware and preserving user preferences independently from provider discovery data.
