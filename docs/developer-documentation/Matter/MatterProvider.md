# MatterProvider

`MatterProvider` is the orchestration layer for the Matter runtime in Homebridge HA Virtual Devices V2.

It coordinates the Matter controller, device discovery, shared catalog synchronization, initial state reads, HomeKit publication, live subscriptions, commissioning, and shutdown.

Matter-specific protocol operations remain delegated to specialized components.

The Matter architecture described here belongs to the V2 development branch. It is not a description of the stable 1.3.7 release.

---

# Purpose

`MatterProvider` is responsible for:

- starting the Matter controller;
- discovering commissioned Matter peers;
- mapping discovered peers into the shared catalog;
- synchronizing the catalog with source `matter`;
- restoring persistent HomeKit names for newly rediscovered Matter devices;
- reading each peer's current state;
- converting Matter state into `PublishedClimateDevice`;
- forwarding initial temperature, humidity, and battery values to `AccessoryManager`;
- rebuilding Matter subscriptions;
- remembering published Matter devices in `RegistryManager`;
- applying catalog publication preferences;
- commissioning a new Matter device from a sharing code;
- stopping subscriptions and the controller cleanly.

It is an orchestration layer. It does not implement the low-level Matter protocol operations itself.

---

# Dependencies

`MatterProvider` coordinates:

```text
MatterController
MatterDeviceDiscovery
MatterDeviceMapper
MatterDeviceCatalogMapper
MatterSubscriptionManager
MatterDeviceNameStore
AccessoryManager
CatalogManager
RegistryManager
```

The provider owns the sequence in which these components operate.

---

# Construction

The constructor receives the common runtime dependencies and storage information required by the provider.

It creates the provider-specific persistence and controller components:

```ts
new MatterController(storagePath)
```

and:

```ts
new MatterDeviceNameStore(deviceNameStorePath)
```

The remaining Matter helpers are instantiated as provider components.

---

# Startup

`start()` performs:

```ts
await this.controller.start();
await this.synchronize();
```

The startup sequence is therefore:

```text
MatterController.start()
        │
        ▼
MatterProvider.synchronize()
```

The provider starts with a complete discovery and publication pass rather than waiting for a later event.

---

# Commissioning

`commission(pairingCode)` delegates the Matter commissioning operation to `MatterController`.

Conceptually:

```ts
const clientNode =
  await this.controller.commission(pairingCode);
```

After successful commissioning, the provider immediately runs:

```ts
await this.synchronize();
```

The newly commissioned node therefore follows the same discovery, catalog, publication, and subscription path as existing Matter devices.

The resulting descriptor is identified by matching the commissioned client node with its discovered peer:

```ts
candidate.peerId === clientNode.id
```

If the node cannot be found after synchronization, the provider reports that the Matter device was added but could not be found after synchronization.

Commissioning does not create a separate publication path.

---

# Synchronization

`synchronize()` is the core Matter workflow.

The sequence is:

```text
Matter controller node
        │
        ▼
MatterDeviceDiscovery
        │
        ▼
MatterDeviceDescriptor[]
        │
        ▼
MatterDeviceCatalogMapper
        │
        ▼
shared DeviceCatalog
        │
        ▼
restore persistent names
        │
        ▼
stop previous subscriptions
        │
        ▼
start each Matter peer
        │
        ▼
MatterDeviceMapper.readState()
        │
        ▼
MatterDeviceState
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
        │
        ▼
MatterSubscriptionManager
```

The synchronization pass deliberately combines catalog synchronization, initial state publication, and subscription rebuilding.

---

# Discovery

The provider obtains the active Matter node from:

```ts
this.controller.getNode()
```

and passes it to:

```ts
this.discovery.discover(node)
```

The discovery result is:

```ts
MatterDeviceDescriptor[]
```

The descriptor contains the Matter identity, metadata, endpoint information, and capability information required by the following stages.

---

# Catalog Synchronization

Discovered Matter descriptors are converted through:

```ts
this.catalogMapper.toDiscoveredCatalogDevices(
  descriptors,
)
```

The resulting candidates are synchronized through:

```ts
catalogManager.synchronizeDiscoveredDevices(
  discoveredCatalogDevices,
  'matter',
)
```

The explicit source is:

```text
matter
```

This source-aware synchronization is essential when Home Assistant and Matter devices coexist in the same shared catalog.

A Matter synchronization pass must not mark Home Assistant devices as missing, and a Home Assistant synchronization pass must not mark Matter devices as missing.

---

# Restoring Persistent Matter Names

After catalog synchronization, the provider processes newly added catalog devices.

For each added device, it examines:

```ts
catalogDevice.metadata.uniqueId
```

When a non-empty Matter `uniqueId` is available, the provider queries:

```ts
deviceNameStore.getName(uniqueId)
```

If a stored name exists, it restores:

```ts
catalogDevice.preferences.homeKitName =
  storedName;
```

If names were restored, the shared catalog is saved through:

```ts
catalogManager.save()
```

The Matter name store therefore preserves the user's HomeKit-facing name independently from the rediscovery lifecycle.

---

# Subscription Rebuild

Before processing the current Matter peers, the provider stops the previous subscription set:

```ts
this.subscriptions.stop();
```

The current synchronization pass then registers a new subscription set.

The resulting lifecycle is:

```text
previous subscriptions
        │
        ▼
stop()
        │
        ▼
discover current peers
        │
        ▼
subscribe()
```

This prevents subscriptions from accumulating across full synchronization passes.

---

# Peer Processing

For every discovered `MatterDeviceDescriptor`, the provider locates the corresponding peer:

```ts
node.peers.get(descriptor.peerId)
```

If the peer is not available, the provider logs a warning and skips that descriptor.

For a valid peer:

```ts
await peer.start();
```

The current state is then read through:

```ts
this.mapper.readState(
  peer,
  descriptor,
)
```

This produces:

```ts
MatterDeviceState
```

---

# Published Climate Device

The Matter descriptor and current state are converted through:

```ts
this.mapper.toPublishedClimateDevice(
  descriptor,
  state,
)
```

The result is:

```ts
PublishedClimateDevice
```

This is the boundary between the Matter-specific runtime model and the source-neutral V2 publication model.

The HomeKit publication layer therefore does not need to know about Matter endpoint IDs or Matter behavior/client classes.

---

# Initial State Publication

The initial state is forwarded directly to `AccessoryManager`.

## Temperature

When a numeric temperature is available:

```ts
accessoryManager.updateTemperature(
  descriptor.id,
  state.temperature,
)
```

## Humidity

When a numeric humidity value is available:

```ts
accessoryManager.updateHumidity(
  descriptor.id,
  state.humidity,
)
```

## Battery

When a numeric battery level is available:

```ts
accessoryManager.updateBattery(
  descriptor.id,
  state.batteryLevel,
)
```

All three updates use the plugin device ID.

They do not require Home Assistant entity IDs.

---

# Live Matter Updates

After the initial state has been read, the provider registers live subscriptions:

```ts
subscriptions.subscribe(
  peer,
  descriptor,
  callbacks,
)
```

The callbacks route values directly to `AccessoryManager`.

```text
MatterSubscriptionManager
        │
        ├── temperature
        ├── humidity
        └── battery
                │
                ▼
           MatterProvider
                │
                ▼
         AccessoryManager
```

The update methods are:

```text
updateTemperature(deviceId, value)
updateHumidity(deviceId, value)
updateBattery(deviceId, value)
```

This path does not depend on Home Assistant entities, `AccessoryEntityIndex`, or `EventManager`.

---

# Initial State and Live State

The two state paths are intentionally distinct but converge on the same HomeKit publication layer.

## Initial state

```text
Matter peer
    │
    ▼
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
Matter peer events
    │
    ▼
MatterSubscriptionManager
    │
    ▼
MatterProvider callbacks
    │
    ▼
AccessoryManager
```

Both paths use the same plugin device identity.

The initial mapper also performs the Matter-to-plugin unit normalization before the values reach the common publication layer.

---

# Runtime Publication Memory

After processing the discovered peers, the provider calls:

```ts
registryManager.rememberPublishedClimateDevices(
  publishedDevices,
)
```

The registry therefore receives the source-neutral `PublishedClimateDevice` representation.

Matter runtime devices can coexist with Home Assistant runtime devices in this publication memory.

---

# Catalog Publication State

After the Matter devices have been mapped and remembered, the provider retrieves the shared catalog:

```ts
const deviceCatalog =
  catalogManager.getCatalog();
```

For each published device it finds the corresponding catalog entry and delegates publication reconciliation to:

```ts
accessoryManager.applyCatalogDevice(
  publishedDevice,
  catalogDevice,
  deviceCatalog,
)
```

The catalog remains authoritative for publication preferences such as whether a device is enabled or hidden.

This keeps Matter publication aligned with the same catalog rules used by the rest of V2.

---

# Matter Runtime Flow

The normal Matter flow is:

```text
MatterController
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
        │                  shared DeviceCatalog
        │
        ▼
MatterDeviceMapper
        │
        ▼
PublishedClimateDevice
        │
        ├──────────────► RegistryManager
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

Live updates enter through:

```text
MatterSubscriptionManager
        │
        ▼
MatterProvider callback
        │
        ▼
AccessoryManager
```

---

# Shutdown

`stop()` performs:

```ts
this.subscriptions.stop();
await this.controller.stop();
```

Subscriptions are stopped before the Matter controller is closed.

---

# Responsibilities

`MatterProvider` is responsible for:

- orchestrating Matter startup;
- orchestrating commissioning;
- running Matter synchronization;
- coordinating discovery;
- coordinating source-aware catalog synchronization;
- restoring persistent Matter names;
- reading initial peer state;
- converting Matter state into `PublishedClimateDevice`;
- routing initial measurements;
- installing live subscriptions;
- registering runtime publication memory;
- applying catalog publication state;
- orchestrating shutdown.

It is not responsible for:

- implementing the low-level Matter controller;
- enumerating Matter peers internally;
- extracting cluster values;
- implementing subscription observation internals;
- persisting the shared catalog;
- implementing HomeKit characteristics.

---

# Design Principles

## One Normal Path After Commissioning

A commissioned Matter device enters the normal synchronization workflow immediately.

There is no separate HomeKit publication shortcut for newly commissioned devices.

## Source-Aware Catalog Integration

Matter discovery is synchronized explicitly with:

```text
matter
```

so that provider-specific synchronization does not incorrectly change the lifecycle state of devices owned by another provider.

## Shared Publication Contract

Matter runtime data becomes:

```ts
PublishedClimateDevice
```

before entering the common publication architecture.

## Device-ID Based Updates

Matter measurements are routed by plugin device ID.

No Home Assistant entity identity is required.

## Subscription Rebuild

A synchronization pass stops the previous Matter subscriptions before rebuilding the active subscription set.

## Persistent User Naming

Matter custom HomeKit-facing names are restored through a persistent Matter `uniqueId`.

---

# Related Components

- [MatterController](MatterController.md)
- [MatterDeviceDiscovery](MatterDeviceDiscovery.md)
- [MatterDeviceMapper](MatterDeviceMapper.md)
- [MatterDeviceCatalogMapper](MatterDeviceCatalogMapper.md)
- [MatterSubscriptionManager](MatterSubscriptionManager.md)
- [MatterDeviceNameStore](MatterDeviceNameStore.md)
- [MatterCommissioningStore](MatterCommissioningStore.md)
- `PublishedClimateDevice`
- `CatalogManager`
- `RegistryManager`
- `AccessoryManager`

---

# Related Documentation

- [Matter](README.md)
- [Architecture](../architecture/README.md)
- [Platform](../architecture/Platform.md)
- [CatalogManager](../architecture/CatalogManager.md)
- [RegistryManager](../architecture/RegistryManager.md)
- [AccessoryManager](../architecture/AccessoryManager.md)
- [ClimateAccessory](../architecture/ClimateAccessory.md)
