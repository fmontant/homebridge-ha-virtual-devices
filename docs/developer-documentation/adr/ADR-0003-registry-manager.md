# ADR-0003: Centralize Registry Synchronization in RegistryManager

- **Status:** Accepted
- **Scope:** Registry synchronization and publication orchestration
- **Applies to:** Home Assistant and Matter providers
- **Architecture:** V2

---

# Context

Homebridge HA Virtual Devices receives runtime device information from external providers and must turn that information into stable HomeKit publication state.

The plugin currently has two provider paths:

```text
Home Assistant
Matter
```

The Home Assistant path is based on device and entity registries plus entity state updates.

The Matter path discovers peers, maps them into source-neutral climate devices, subscribes to live measurements, and then feeds the same publication layer.

The plugin therefore needs one coordination point able to:

- synchronize Home Assistant registry data;
- remember source-neutral published devices;
- rebuild HomeKit publication from the persistent catalog;
- compare current catalog publication preferences with prior publication state;
- distinguish initial synchronization from later incremental synchronization;
- serialize registry synchronization work;
- coexist with Matter devices without deleting their runtime state when Home Assistant refreshes.

Without such a boundary, registry handling, catalog refresh, and HomeKit publication would become spread across the platform, providers, and accessory layer.

---

# Decision

The plugin uses a dedicated:

```text
RegistryManager
```

as the synchronization coordinator between provider-derived runtime devices, the shared catalog, and the HomeKit publication layer.

`RegistryManager` is not the owner of protocol connectivity.

Instead, it coordinates data that has already been discovered or normalized.

---

# Core Responsibilities

`RegistryManager` currently exposes the following public operations:

```ts
handleDeviceRegistry(...)
handleEntityRegistry(...)
rememberPublishedClimateDevices(...)
refreshFromCatalog()
```

These methods cover two complementary responsibilities:

```text
Home Assistant registry synchronization
```

and:

```text
source-neutral publication memory / catalog refresh
```

---

# Home Assistant Registry Flow

Home Assistant provides a device registry and an entity registry.

`RegistryManager` stores the latest device registry through:

```ts
handleDeviceRegistry(...)
```

and processes entity registry synchronization through:

```ts
handleEntityRegistry(...)
```

The entity registry path is serialized before invoking the internal synchronization routine.

Conceptually:

```text
Home Assistant device registry
            │
            ▼
handleDeviceRegistry()
            │
            ▼
stored device registry

Home Assistant entity registry
            │
            ▼
handleEntityRegistry()
            │
            ▼
serialized synchronization
            │
            ▼
synchronizeEntityRegistry()
```

---

# Serialized Synchronization

Entity registry synchronization uses an internal promise queue.

This avoids overlapping synchronization passes when several registry updates arrive close together.

A failed synchronization does not permanently block subsequent synchronization operations.

The internal queue state is recovered so later updates can still be processed.

---

# Device Preparation

During Home Assistant synchronization, the manager coordinates:

```text
DiscoveryManager
ClimateDeviceManager
CatalogManager
AccessoryManager
```

The flow is conceptually:

```text
device registry + entity registry
            │
            ▼
DiscoveryManager
            │
            ▼
ClimateDeviceManager
            │
            ▼
prepared ClimateDevice instances
            │
            ▼
CatalogManager
            │
            ▼
shared DeviceCatalog
            │
            ▼
AccessoryManager
```

Ignored Home Assistant devices are filtered during preparation.

---

# Initial Synchronization

The manager tracks:

```ts
initialSynchronizationCompleted
```

The first successful Home Assistant synchronization is treated differently from later updates.

On the initial pass, the plugin restores HomeKit climate accessories from the discovered runtime devices and the persistent catalog.

Conceptually:

```text
first synchronization
        │
        ▼
restoreClimateAccessories(...)
        │
        ▼
initialSynchronizationCompleted = true
```

This allows the plugin to rebuild HomeKit publication after Homebridge startup using both:

- current provider data;
- persisted catalog preferences.

---

# Incremental Synchronization

After the first synchronization, later Home Assistant registry changes are applied as incremental synchronization results rather than as a full initial restore.

This allows the accessory layer to process:

```text
added
updated
missing
```

device changes through its synchronization logic.

---

# Source-Neutral Publication Memory

V2 introduces a common publication model based on `PublishedClimateDevice`.

`RegistryManager` retains the most recently known published runtime devices in:

```ts
lastClimateDevices
```

through:

```ts
rememberPublishedClimateDevices(...)
```

This memory is not limited to Home Assistant.

Matter can also provide `PublishedClimateDevice` instances and register them with the manager.

---

# Home Assistant Refresh Does Not Erase Matter Runtime Devices

When Home Assistant performs a new entity registry synchronization, the manager removes only remembered devices whose source is:

```text
home-assistant
```

before inserting the newly prepared Home Assistant devices.

Matter devices remain in `lastClimateDevices`.

Conceptually:

```text
lastClimateDevices
   │
   ├── Home Assistant devices ── replaced by HA refresh
   │
   └── Matter devices ────────── preserved
```

This is a key V2 coexistence rule.

---

# Catalog Publication State

The manager also tracks a serialized publication snapshot in:

```ts
catalogPublicationState
```

The publication state includes catalog values that can change HomeKit publication behavior, including:

```text
name
enabled
archived
homeKitName
room
favorite
```

The snapshot is used to determine whether a catalog refresh requires HomeKit action.

---

# Refresh from Catalog

`refreshFromCatalog()` reloads the persistent catalog and compares its current publication state with the previous snapshot.

This supports UI-driven catalog changes without requiring provider rediscovery.

Conceptually:

```text
UI changes catalog preferences
          │
          ▼
persistent DeviceCatalog
          │
          ▼
refreshFromCatalog()
          │
          ├── reload catalog
          ├── compare publication state
          ├── find remembered runtime device
          └── apply catalog device
```

If a catalog entry requiring publication action no longer exists in the current publication state, the corresponding HomeKit accessory can be removed.

---

# Why Runtime Device Memory Is Required

The persistent catalog intentionally does not contain all live protocol state needed to recreate a fully functional runtime device.

`refreshFromCatalog()` therefore relies on `lastClimateDevices` to pair:

```text
persistent catalog preferences
```

with:

```text
last known runtime device model
```

This allows a preference change such as enabling, disabling, renaming, or archiving a device to affect HomeKit publication without repeating provider discovery.

---

# Separation from CatalogManager

`CatalogManager` owns catalog orchestration.

`RegistryManager` owns synchronization and publication coordination.

Therefore:

```text
CatalogManager
    │
    └── persistent catalog operations

RegistryManager
    │
    └── registry/runtime synchronization
        + publication refresh orchestration
```

The two managers collaborate but do not have the same responsibility.

---

# Separation from AccessoryManager

`AccessoryManager` owns actual HomeKit accessory creation, update, and removal.

`RegistryManager` decides when the accessory layer must react.

Conceptually:

```text
RegistryManager
      │
      ▼
publication decision / synchronization
      │
      ▼
AccessoryManager
      │
      ▼
HomeKit accessories
```

This keeps HomeKit implementation details out of registry processing.

---

# Separation from Providers

Providers are responsible for protocol-specific connectivity and discovery.

For example:

```text
Home Assistant
    │
    └── registries + entity states

Matter
    │
    └── peers + cluster state + subscriptions
```

`RegistryManager` operates after this provider-specific work has been normalized.

This prevents protocol concerns from leaking into the publication coordination layer.

---

# Consequences

## Positive

### Central synchronization boundary

Registry-driven state changes are coordinated in one place.

### Initial and incremental synchronization are explicit

Startup restoration and later updates can follow different, appropriate paths.

### Matter and Home Assistant can coexist

Home Assistant refreshes replace only Home Assistant runtime devices and preserve remembered Matter devices.

### UI preference changes can update HomeKit without rediscovery

`refreshFromCatalog()` combines persisted catalog state with remembered runtime devices.

### HomeKit details stay out of registry processing

Actual accessory manipulation remains delegated to `AccessoryManager`.

### Registry updates are serialized

Concurrent Home Assistant registry synchronization work does not race.

---

## Trade-offs

### Runtime memory exists in addition to persistent catalog state

The architecture intentionally keeps both:

```text
DeviceCatalog
lastClimateDevices
```

because they serve different purposes.

This increases state-management complexity.

### Catalog refresh depends on remembered runtime devices

If no runtime device has been remembered, a catalog-only refresh cannot reconstruct every publication detail.

The manager therefore warns and returns rather than inventing protocol state.

### RegistryManager has coordination responsibility across several managers

Although it avoids protocol and HomeKit implementation details, it remains a central orchestration component and must be kept focused.

---

# Alternatives Considered

## Let Platform coordinate everything directly

Rejected because provider lifecycle, registry synchronization, catalog refresh, and publication logic would accumulate in `platform.ts`.

## Let AccessoryManager consume registries directly

Rejected because the accessory layer should not understand Home Assistant registry structures or provider discovery concerns.

## Let each provider publish directly to HomeKit

Rejected because this would duplicate publication logic and weaken the common `PublishedClimateDevice` architecture.

## Use only the persistent catalog during UI refresh

Rejected because the catalog does not represent all live runtime data required by the publication layer.

---

# Implementation

This decision is implemented primarily in:

```text
src/managers/registryManager.ts
```

Collaborating components include:

```text
src/managers/discoveryManager.ts
src/managers/ClimateDeviceManager.ts
src/managers/catalogManager.ts
src/managers/accessoryManager.ts
src/models/publishedClimateDevice.ts
```

Matter integration uses:

```text
src/matter/provider.ts
```

to register source-neutral runtime devices through:

```ts
rememberPublishedClimateDevices(...)
```

---

# Related Architecture

- [RegistryManager](../architecture/RegistryManager.md)
- [CatalogManager](../architecture/CatalogManager.md)
- [AccessoryManager](../architecture/AccessoryManager.md)
- [ClimateDeviceManager](../architecture/ClimateDeviceManager.md)
- [Matter Provider](../Matter/MatterProvider.md)
- [Persistent Device Catalog](ADR-0002-persistent-catalog.md)

---

# Decision Summary

Homebridge HA Virtual Devices centralizes registry synchronization and publication refresh coordination in `RegistryManager`.

The manager serializes Home Assistant registry synchronization, distinguishes initial restoration from incremental updates, remembers source-neutral runtime devices, preserves Matter devices during Home Assistant refreshes, and combines runtime device memory with persistent catalog preferences when HomeKit publication must be refreshed.
