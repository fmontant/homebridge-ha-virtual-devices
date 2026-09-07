# Matter Architecture

This directory documents the Matter-specific runtime currently being developed for **Homebridge HA Virtual Devices V2**.

Matter is one of the plugin's two device providers. It can operate independently from Home Assistant or alongside it. Matter-specific components remain isolated at the edge of the architecture and feed the same shared catalog and HomeKit publication layers used by the rest of the plugin.

The Matter architecture described here belongs to the V2 development work. It does not imply that V2 has been published as a stable npm release.

---

# Architecture Overview

The Matter path is organized around `MatterProvider`, which coordinates specialized components rather than implementing Matter protocol details itself.

```text
                        MatterProvider
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
 MatterController   MatterDeviceDiscovery   Commissioning
          │                   │
          │                   ▼
          │          MatterDeviceDescriptor
          │                   │
          │          ┌────────┴────────┐
          │          ▼                 ▼
          │   CatalogMapper       DeviceMapper
          │          │                 │
          │          ▼                 ▼
          │   shared catalog   PublishedClimateDevice
          │                              │
          │                              ▼
          │                       AccessoryManager
          │                              │
          │                              ▼
          │                       ClimateAccessory
          │                              │
          │                              ▼
          │                         Apple Home
          │
          └────► MatterSubscriptionManager
                         │
                         ▼
                    live updates
```

The provider coordinates the flow. Specialized components keep controller lifecycle, discovery, mapping, subscriptions, commissioning, and persistence concerns separated.

---

# Components

## [MatterProvider](MatterProvider.md)

Central Matter orchestrator.

It coordinates:

- controller startup;
- discovery;
- source-aware catalog synchronization;
- custom-name restoration;
- initial state reads;
- `PublishedClimateDevice` creation;
- initial HomeKit updates;
- live subscriptions;
- commissioning;
- shutdown.

`MatterProvider` orchestrates commissioning. The Matter operation itself is delegated to `MatterController`.

Start here for the complete Matter runtime flow.

---

## [MatterController](MatterController.md)

Low-level Matter controller lifecycle wrapper.

It owns:

- the Matter `Environment`;
- the persistent Matter storage path;
- the `ServerNode`;
- controller startup and shutdown;
- peer commissioning from a pairing code.

---

## [MatterDeviceDiscovery](MatterDeviceDiscovery.md)

Discovers the structure and metadata of commissioned Matter peers.

It determines:

- plugin device identity;
- Matter node and peer identity;
- temperature endpoint;
- humidity endpoint;
- battery/power-source endpoint;
- Basic Information metadata;
- discovered device name.

Its output is `MatterDeviceDescriptor`.

---

## [MatterDeviceMapper](MatterDeviceMapper.md)

Reads the initial Matter sensor state and converts Matter devices into the common runtime publication model.

It handles:

- temperature reads and `/ 100` normalization;
- humidity reads and `/ 100` normalization;
- battery reads and `/ 2` normalization;
- `MatterDeviceState`;
- mapping to `PublishedClimateDevice`.

The normalization is performed before the data reaches the common HomeKit publication layers.

---

## [MatterSubscriptionManager](MatterSubscriptionManager.md)

Handles live Matter measurement changes after initial synchronization.

It observes:

- temperature changes;
- humidity changes;
- battery-percentage changes.

Normalized updates are emitted as:

```text
deviceId + value
```

and forwarded by `MatterProvider` to `AccessoryManager`.

---

## [MatterDeviceCatalogMapper](MatterDeviceCatalogMapper.md)

Maps Matter discovery descriptors into the generic catalog discovery model.

It converts:

```text
MatterDeviceDescriptor
        │
        ▼
DiscoveredCatalogDevice
```

and explicitly assigns:

```text
source   = matter
sourceId = Matter nodeId
```

---

## [MatterDeviceNameStore](MatterDeviceNameStore.md)

Dedicated persistence for Matter custom names.

It stores:

```text
Matter uniqueId → HomeKit-facing custom name
```

This allows custom names to be restored when a Matter device is reintroduced into the shared catalog.

---

## [MatterCommissioningStore](MatterCommissioningStore.md)

File-based exchange layer for commissioning requests and responses.

It persists:

```text
commissioning request
commissioning response
```

in separate JSON files so the UI-facing workflow and the Homebridge platform runtime can exchange commissioning work.

The store itself does not perform commissioning.

---

## [MatterTypes](MatterTypes.md)

Documents the two Matter internal data contracts:

```text
MatterDeviceDescriptor
MatterDeviceState
```

The descriptor represents identity, metadata, and endpoint topology.

The state represents current normalized measurements and availability.

---

# Matter Startup Flow

When Matter is enabled, the platform obtains the Matter provider and starts it.

```text
Platform
   │
   ▼
MatterProvider.start()
   │
   ▼
MatterController.start()
   │
   ▼
MatterProvider.synchronize()
```

The first synchronization then discovers and publishes the currently commissioned peers.

---

# Synchronization Flow

The full synchronization path is:

```text
MatterController.getNode()
        │
        ▼
MatterDeviceDiscovery
        │
        ▼
MatterDeviceDescriptor[]
        │
        ├──────────────► MatterDeviceCatalogMapper
        │                         │
        │                         ▼
        │                  CatalogManager
        │                         │
        │                         ▼
        │                  shared DeviceCatalog
        │
        ▼
peer lookup + peer.start()
        │
        ▼
MatterDeviceMapper.readState()
        │
        ▼
MatterDeviceState
        │
        ▼
MatterDeviceMapper.toPublishedClimateDevice()
        │
        ▼
PublishedClimateDevice
        │
        ├──────────────► RegistryManager
        │
        └──────────────► AccessoryManager
                                  │
                                  ▼
                           ClimateAccessory
```

The catalog mapping and runtime publication mapping are separate operations. The same discovered descriptor can therefore feed both paths without exposing Matter-specific structures to the shared publication layer.

---

# Initial State and Live State

The Matter runtime deliberately separates initial reads from later updates.

## Initial state

```text
MatterDeviceMapper
        │
        ▼
MatterDeviceState
        │
        ▼
PublishedClimateDevice
        │
        ▼
AccessoryManager
```

## Live state

```text
MatterSubscriptionManager
        │
        ▼
callback(deviceId, value)
        │
        ▼
MatterProvider
        │
        ▼
AccessoryManager
```

Both paths use the same Matter unit normalization.

The important architectural property is that both paths converge on the same `AccessoryManager` and use the plugin device identity.

---

# Shared Catalog Integration

Matter does not maintain a separate device catalog.

`MatterDeviceCatalogMapper` converts Matter descriptors into generic discovery objects, then `MatterProvider` calls:

```ts
catalogManager
  .synchronizeDiscoveredDevices(
    discoveredCatalogDevices,
    'matter',
  )
```

The synchronization source is explicitly:

```text
matter
```

This allows the shared catalog to manage Matter and Home Assistant devices while keeping synchronization scoped to the provider source.

Matter-specific endpoint IDs and Matter behavior classes do not enter the generic catalog model.

---

# Shared Publication Contract

Matter-specific runtime data is converted to:

```ts
PublishedClimateDevice
```

before entering the common publication architecture.

This means the HomeKit-facing layers do not need to understand:

- Matter peer IDs;
- Matter node IDs;
- Matter endpoint IDs;
- Matter behavior/client classes.

They consume the same source-neutral climate-device contract.

---

# HomeKit Publication

Matter reuses the common publication stack:

```text
PublishedClimateDevice
        │
        ▼
Catalog publication preferences
        │
        ▼
AccessoryManager
        │
        ▼
ClimateAccessory
        │
        ▼
Homebridge / Apple Home
```

`AccessoryManager` can receive Matter measurements directly by plugin device ID through:

```text
updateTemperature()
updateHumidity()
updateBattery()
```

No Home Assistant entity ID is required.

---

# Commissioning Flow

Commissioning is initiated with a Matter sharing/pairing code.

At the provider level:

```text
MatterProvider.commission(pairingCode)
        │
        ▼
MatterController.commission()
        │
        ▼
new ClientNode
        │
        ▼
full Matter synchronization
        │
        ▼
find matching descriptor by peerId
        │
        ▼
return MatterDeviceDescriptor
```

A newly commissioned device therefore follows the normal synchronization and publication path rather than a separate publication shortcut.

---

# Commissioning Exchange

The UI/platform exchange is persisted through `MatterCommissioningStore`.

Conceptually:

```text
UI
 │
 ▼
request JSON
 │
 ▼
Platform
 │
 ▼
MatterProvider.commission()
 │
 ▼
response JSON
 │
 ▼
UI
```

The store provides persistence for the exchange. The commissioning operation itself remains in the provider and controller layers.

---

# Persistent Matter Data

Matter uses several distinct persistence domains.

```text
Matter controller storage
    │
    └── managed through Matter Environment storage.path

shared DeviceCatalog
    │
    └── generic source-aware device lifecycle and preferences

MatterDeviceNameStore
    │
    └── Matter uniqueId → custom HomeKit-facing name

MatterCommissioningStore
    │
    └── commissioning request / response exchange
```

These persistence domains have different responsibilities and should not be treated as one combined Matter database.

---

# Custom Name Restoration

When synchronization reports newly added Matter catalog devices, `MatterProvider` checks their:

```text
metadata.uniqueId
```

against `MatterDeviceNameStore`.

If a stored name exists, it restores:

```text
preferences.homeKitName
```

and saves the shared catalog.

This keeps a user's Matter device naming independent from the rediscovery lifecycle of a catalog entry.

---

# Supported Climate Data

The current Matter path recognizes three measurement categories:

```text
Temperature
Relative humidity
Battery percentage
```

Support is detected from Matter endpoint capabilities during discovery.

A device may expose only a subset of these measurements.

---

# Matter Data Contracts

The Matter subsystem uses:

```text
MatterDeviceDescriptor
```

for structural information:

- identity;
- metadata;
- endpoint topology.

It uses:

```text
MatterDeviceState
```

for current normalized values:

- temperature;
- humidity;
- battery level;
- availability.

Before publication, both are mapped into:

```text
PublishedClimateDevice
```

---

# Source Separation

The V2 architecture keeps provider-specific work near each provider.

Matter owns:

- Matter controller lifecycle;
- Matter discovery;
- Matter cluster reads;
- Matter subscriptions;
- Matter commissioning;
- Matter-specific persistence.

The common architecture owns:

- persistent catalog behavior;
- publication preferences;
- runtime publication memory;
- Homebridge accessory lifecycle;
- HomeKit characteristics.

This boundary allows Matter and Home Assistant to feed the same plugin architecture without requiring the common HomeKit layer to implement separate accessory models for each provider.

---

# Recommended Reading Order

For understanding the implementation, read:

1. [MatterProvider](MatterProvider.md)
2. [MatterController](MatterController.md)
3. [MatterDeviceDiscovery](MatterDeviceDiscovery.md)
4. [MatterTypes](MatterTypes.md)
5. [MatterDeviceCatalogMapper](MatterDeviceCatalogMapper.md)
6. [MatterDeviceMapper](MatterDeviceMapper.md)
7. [MatterSubscriptionManager](MatterSubscriptionManager.md)
8. [MatterDeviceNameStore](MatterDeviceNameStore.md)
9. [MatterCommissioningStore](MatterCommissioningStore.md)

Then continue with the shared architecture:

- [Architecture overview](../architecture/README.md)
- [Platform](../architecture/Platform.md)
- [CatalogManager](../architecture/CatalogManager.md)
- [DeviceCatalog](../architecture/DeviceCatalog.md)
- [RegistryManager](../architecture/RegistryManager.md)
- [AccessoryManager](../architecture/AccessoryManager.md)
- [ClimateAccessory](../architecture/ClimateAccessory.md)

---

# Source Files

The documentation in this directory corresponds to:

```text
src/matter/provider.ts
src/matter/controller.ts
src/matter/discovery.ts
src/matter/types.ts
src/matter/catalogMapper.ts
src/matter/mapper.ts
src/matter/subscriptionManager.ts
src/matter/deviceNameStore.ts
src/matter/commissioningStore.ts
```

Together these files form the Matter-specific provider layer currently under development for Homebridge HA Virtual Devices V2.
