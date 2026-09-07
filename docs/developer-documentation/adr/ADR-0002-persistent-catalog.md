# ADR-0002: Use a Persistent, Source-Aware Device Catalog

- **Status:** Accepted
- **Scope:** Device lifecycle, preferences, and persistence
- **Applies to:** Home Assistant and Matter providers
- **Architecture:** V2

---

# Context

Homebridge HA Virtual Devices discovers devices dynamically from external providers.

In V1, Home Assistant was the only source. V2 adds Matter while preserving the same user-facing concepts:

- enabled / disabled publication;
- favorites;
- hidden state;
- archived state;
- custom HomeKit name;
- internal room;
- discovery timestamps;
- availability;
- missing-device tracking.

Those values must survive Homebridge restarts and rediscovery.

A purely runtime device list would lose user choices whenever the plugin restarts. It would also make it difficult to distinguish:

```text
new device
existing device
temporarily missing device
archived device
```

V2 additionally needs discovery to be source-aware so that synchronizing Matter does not mark Home Assistant devices as missing, and vice versa.

---

# Decision

The plugin maintains a persistent shared `DeviceCatalog`.

The catalog is:

```text
persistent
source-aware
provider-neutral
```

and is backed by `DeviceCatalogStore`.

Both Home Assistant and Matter synchronize discovered devices into the same catalog.

---

# Catalog Responsibilities

`DeviceCatalog` stores, for each known device:

- plugin device identity;
- provider source;
- provider-specific source ID;
- discovered name;
- lifecycle state;
- capabilities;
- metadata;
- user preferences;
- timestamps;
- availability.

The catalog is the persistent authority for publication preferences and device lifecycle state.

---

# Persistent Preferences

The catalog preserves user-controlled preferences such as:

```text
enabled
hidden
archived
favorite
homeKitName
room
```

These values are intentionally kept separate from provider rediscovery data.

When an existing device is rediscovered, technical information can be refreshed without resetting the user's publication preferences.

---

# Source-Aware Synchronization

The catalog synchronization API receives an explicit source.

Conceptually:

```text
synchronize(
  discoveredDevices,
  source,
)
```

The source can currently be:

```text
home-assistant
matter
```

During missing-device detection, only catalog entries belonging to the current synchronization source are considered.

Therefore:

```text
Matter synchronization
    │
    └── can mark missing only Matter devices

Home Assistant synchronization
    │
    └── can mark missing only Home Assistant devices
```

This prevents one provider from invalidating devices owned by another provider.

---

# Shared Catalog

V2 deliberately does **not** maintain one catalog per provider.

Instead:

```text
Home Assistant ─┐
                ├──► shared DeviceCatalog
Matter ─────────┘
```

Provider-specific information is normalized before entering the catalog.

For Matter, this occurs through `MatterDeviceCatalogMapper`.

For Home Assistant, equivalent mapping occurs before catalog synchronization.

---

# Lifecycle Timestamps

The catalog persists lifecycle timestamps including:

```text
discoveredAt
lastSeen
lastUpdated
missingSince
firstViewedAt
```

These timestamps allow the plugin to distinguish first discovery, recent observation, updates, missing state, and first UI inspection.

When a device becomes missing, `missingSince` is set if it is not already present.

When the device is rediscovered, the missing timestamp is cleared.

---

# Missing Devices

A device that is no longer discovered is not immediately deleted from the catalog.

Instead, it can move into a missing lifecycle state.

This preserves:

- user preferences;
- historical identity;
- the ability to recover when the provider sees the device again.

The missing transition is source-scoped.

---

# Publication Rule

The catalog publication rule is intentionally simple:

```text
enabled && !archived
```

A device can therefore remain in the catalog without being published to HomeKit.

Other preferences such as:

```text
favorite
hidden
```

do not determine whether the HomeKit accessory should exist.

---

# Persistence

`DeviceCatalogStore` loads and saves the catalog as JSON.

At startup:

```text
DeviceCatalog.load()
        │
        ▼
DeviceCatalogStore.load()
```

On save:

```text
DeviceCatalog.save()
        │
        ▼
DeviceCatalogStore.save()
```

---

# Serialized Writes

`DeviceCatalogStore` uses an internal save queue:

```ts
saveQueue
```

Save operations are chained rather than written concurrently.

This prevents overlapping asynchronous writes from racing against one another.

A failed save is caught inside the internal queue state so a later save can still proceed, while the original failing operation remains visible to its caller.

---

# Temporary-File Replacement

The catalog is not written directly over the final file.

The store writes to a temporary path first and then calls:

```ts
rename(
  temporaryFilePath,
  this.filePath,
)
```

If writing or replacement fails, the temporary file is removed on a best-effort basis and the error is rethrown.

This reduces the risk of leaving a partially written final catalog file.

---

# Loading Behavior

The store reads JSON from disk and expects a top-level array.

If the file does not exist:

```text
ENOENT
```

the store returns an empty catalog.

Loaded entries are structurally checked and normalized before becoming active catalog devices.

Preference defaults are restored where necessary so older persisted entries can remain usable after schema evolution.

---

# Migration Defaults

When persisted preferences are incomplete, normalization supplies defaults such as:

```text
enabled  = true
favorite = false
hidden   = false
archived = false
```

Existing `room` and `homeKitName` values are preserved.

---

# Relationship with Providers

Providers are responsible for discovering and normalizing devices.

The catalog is responsible for persistent lifecycle and user preference state.

```text
Provider discovery
        │
        ▼
generic discovered devices
        │
        ▼
CatalogManager
        │
        ▼
DeviceCatalog
        │
        ▼
DeviceCatalogStore
```

This separation keeps provider-specific protocol concerns out of persistence.

---

# Relationship with CatalogManager

`CatalogManager` is the orchestration boundary around the catalog.

It coordinates loading, synchronization, saving, and source-specific discovery flows.

The persistence decision itself remains implemented by `DeviceCatalog` and `DeviceCatalogStore`.

---

# Consequences

## Positive

### User preferences survive restart

Renaming, enabled state, favorites, hidden state, archived state, and room metadata remain available after Homebridge restarts.

### Rediscovery does not erase user choices

Provider data can be refreshed while preserving catalog preferences.

### Missing devices can recover

A temporarily absent device can return without being treated as an entirely unrelated user configuration.

### Home Assistant and Matter can coexist

Source-aware missing detection prevents one provider's synchronization from invalidating the other provider's devices.

### Publication state is centralized

HomeKit publication decisions can be derived from one persistent authority rather than from transient provider state.

### Writes are serialized

The save queue avoids concurrent persistence races.

---

## Trade-offs

### Persistent state requires migration logic

The plugin must normalize older saved catalog entries when structures evolve.

### The catalog can retain stale devices

Because missing devices are preserved rather than deleted immediately, the catalog may contain devices that are no longer physically present.

That is intentional and must be handled through lifecycle state rather than automatic destructive cleanup.

### File persistence introduces failure modes

Malformed JSON, filesystem permissions, or failed writes can prevent catalog loading or saving.

These errors must remain visible rather than silently discarding user state.

---

# Alternatives Considered

## Runtime-only discovery list

Rejected because all preferences and lifecycle state would disappear after restart.

## One persistent catalog per provider

Rejected because it would duplicate lifecycle and publication logic and make the common V2 publication layer more complex.

## Delete devices immediately when absent

Rejected because temporary provider outages or sensor unavailability should not erase persistent user configuration.

## Let providers own user preferences

Rejected because Home Assistant and Matter have different protocol models and should not become the authority for HomeKit-specific publication preferences.

---

# Implementation

This decision is implemented primarily in:

```text
src/catalog/deviceCatalog.ts
src/catalog/deviceCatalogStore.ts
src/managers/catalogManager.ts
```

Provider-specific mapping feeds the same catalog, including:

```text
src/matter/catalogMapper.ts
```

---

# Related Architecture

- [DeviceCatalog](../architecture/DeviceCatalog.md)
- [DeviceCatalogStore](../architecture/DeviceCatalogStore.md)
- [CatalogManager](../architecture/CatalogManager.md)
- [Matter architecture](../Matter/README.md)
- [RegistryManager](../architecture/RegistryManager.md)

---

# Decision Summary

Homebridge HA Virtual Devices uses one persistent, source-aware `DeviceCatalog` shared by Home Assistant and Matter.

The catalog preserves user preferences and lifecycle state across restarts and rediscovery, while `DeviceCatalogStore` provides serialized JSON persistence with temporary-file replacement.

Source-aware synchronization is a core V2 rule: each provider can update or mark missing only the devices that belong to that provider.
