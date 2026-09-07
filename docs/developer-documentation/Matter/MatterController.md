# MatterController

`MatterController` is the low-level lifecycle boundary for the Matter controller used by Homebridge HA Virtual Devices V2.

It initializes the Matter runtime, configures persistent Matter storage, creates and starts the controller `ServerNode`, exposes the running node to higher-level Matter components, commissions peers from pairing codes, and closes the controller during shutdown.

It does not implement device discovery, state mapping, catalog synchronization, subscriptions, or HomeKit publication.

The Matter architecture described here belongs to the V2 development work. It does not describe the stable 1.3.7 release.

---

# Purpose

`MatterController` is responsible for:

- initializing the Matter Node.js runtime;
- creating the Matter `Environment`;
- configuring the Matter storage path;
- creating and starting the controller `ServerNode`;
- commissioning a Matter peer from a pairing code;
- exposing the active controller node;
- closing the controller cleanly;
- preventing duplicate controller startup.

It is intentionally limited to the Matter controller lifecycle and commissioning primitive.

---

# Matter Runtime Initialization

The module imports the Node.js integration:

```ts
import '@matter/nodejs';
```

It also uses:

```text
Environment
```

from `@matter/general`, and:

```text
ClientNode
ServerNode
```

from `@matter/node`.

The Node.js integration is initialized at module load time.

---

# Internal State

The controller keeps the active Matter node in:

```ts
private node?: ServerNode;
```

An undefined value means that the controller is not currently started.

---

# Storage Path

The constructor receives:

```ts
storagePath: string
```

The path is injected into the Matter environment through:

```ts
environment.vars.set(
  'storage.path',
  this.storagePath,
);
```

The Matter stack therefore maintains its persistent controller state in the storage location selected by the plugin.

This storage is separate from:

- the shared device catalog;
- the Matter device-name store;
- the commissioning request and response files.

---

# Starting the Controller

`start()` is idempotent.

If a controller node already exists, the method returns without creating another node.

Otherwise it:

1. creates a Matter `Environment`;
2. configures `storage.path`;
3. creates the `ServerNode`;
4. starts the node;
5. stores the successfully started node in the controller state.

The controller node is created with the project identity:

```ts
id: 'homebridge-ha-virtual-devices'
```

The environment uses the same project identity.

---

# Startup Flow

```text
MatterController.start()
        │
        ├── node already exists ──► return
        │
        ▼
create Environment
        │
        ▼
set storage.path
        │
        ▼
ServerNode.create()
        │
        ▼
node.start()
        │
        ▼
store node
```

The node is assigned to the controller only after successful startup.

---

# Controller Identity

The Matter controller uses:

```text
homebridge-ha-virtual-devices
```

as its project identity.

This identity is used when creating the Matter environment and the controller `ServerNode`.

---

# Commissioning

`commission(pairingCode)` first obtains the active controller through:

```ts
this.getNode()
```

It then delegates the commissioning operation to the Matter peer manager:

```ts
node.peers.commission({
  pairingCode,
})
```

The method returns:

```ts
Promise<ClientNode>
```

`MatterController` does not perform any catalog or HomeKit operation after commissioning.

The higher-level `MatterProvider` is responsible for running a complete synchronization after commissioning succeeds.

---

# Pairing Code

The controller receives:

```ts
pairingCode: string
```

and passes it to the Matter library as the commissioning input.

The controller does not own:

- UI input;
- commissioning request persistence;
- commissioning response persistence;
- post-commissioning discovery;
- catalog synchronization;
- HomeKit publication.

Those responsibilities belong to the surrounding Matter and platform layers.

---

# Accessing the Running Node

`getNode()` returns the active:

```ts
ServerNode
```

If the controller has not been started, it throws:

```text
Matter controller is not started.
```

This makes the running-state requirement explicit for discovery and commissioning callers.

---

# Stopping the Controller

`stop()` is safe to call when the controller is already stopped.

If no active node exists, it returns immediately.

Otherwise it:

```ts
await this.node.close();
```

and then clears:

```ts
this.node = undefined;
```

A subsequent `start()` can therefore create a new controller node.

---

# Shutdown Flow

```text
MatterController.stop()
        │
        ├── no node ──► return
        │
        ▼
node.close()
        │
        ▼
node = undefined
```

---

# Relationship with MatterProvider

`MatterProvider` owns the high-level Matter lifecycle.

## Startup

```text
MatterProvider.start()
        │
        ▼
MatterController.start()
        │
        ▼
MatterProvider.synchronize()
```

## Commissioning

```text
MatterProvider.commission()
        │
        ▼
MatterController.commission()
        │
        ▼
MatterProvider.synchronize()
```

## Shutdown

```text
MatterProvider.stop()
        │
        ├── stop subscriptions
        │
        ▼
MatterController.stop()
```

`MatterController` therefore remains unaware of the shared catalog, runtime publication memory, and HomeKit accessory lifecycle.

---

# Relationship with MatterDeviceDiscovery

`MatterDeviceDiscovery` requires the running `ServerNode` to inspect commissioned Matter peers.

`MatterProvider` obtains the node through:

```ts
controller.getNode()
```

and passes it to discovery.

The discovery component does not own the controller lifecycle.

---

# Persistent Matter State

The controller configures the Matter storage location through:

```text
storage.path
```

This storage belongs to the Matter stack.

It must not be confused with the other persistence mechanisms used by the plugin:

```text
Matter controller storage
        │
        └── Matter Environment

Shared device catalog
        │
        └── generic device lifecycle and preferences

MatterDeviceNameStore
        │
        └── Matter uniqueId → HomeKit-facing name

MatterCommissioningStore
        │
        └── commissioning request / response exchange
```

Each persistence domain has a separate responsibility.

---

# Responsibilities

`MatterController` is responsible for:

- initializing the Matter Node.js integration;
- creating the Matter environment;
- configuring persistent Matter storage;
- creating the controller node;
- starting the controller;
- commissioning peers;
- exposing the running controller node;
- stopping the controller.

It is not responsible for:

- discovering compatible sensors;
- extracting measurement values;
- creating `MatterDeviceDescriptor`;
- creating `MatterDeviceState`;
- mapping devices to `PublishedClimateDevice`;
- synchronizing the shared catalog;
- storing HomeKit custom names;
- managing live subscriptions;
- creating Homebridge accessories.

---

# Design Principles

## Small Lifecycle Boundary

The class wraps the Matter controller lifecycle and commissioning primitive only.

Higher-level Matter behavior remains in `MatterProvider` and the specialized Matter components.

## Idempotent Lifecycle

Calling `start()` while the controller is already running does not create another controller node.

Calling `stop()` while the controller is already stopped does nothing.

## Explicit Running-State Requirement

`getNode()` throws when the controller has not been started rather than returning an optional node to its callers.

## Persistent Matter Environment

The Matter storage path is configured before controller-node creation so that the Matter stack can maintain its persistent state.

## Separation of Concerns

The controller does not know about:

```text
DeviceCatalog
AccessoryManager
RegistryManager
ClimateAccessory
HomeKit
Home Assistant entities
```

This keeps the low-level Matter lifecycle isolated from the common publication architecture.

---

# Related Components

- [MatterProvider](MatterProvider.md)
- [MatterDeviceDiscovery](MatterDeviceDiscovery.md)
- [MatterSubscriptionManager](MatterSubscriptionManager.md)
- [MatterCommissioningStore](MatterCommissioningStore.md)

---

# Related Documentation

- [Matter](README.md)
- [Architecture overview](../architecture/README.md)
- [Platform](../architecture/Platform.md)

---

# Source File

The implementation documented here is:

```text
src/matter/controller.ts
```

`MatterController` is the low-level Matter lifecycle boundary. It owns the persistent controller node and commissioning primitive while leaving discovery, synchronization, subscriptions, and HomeKit publication to the higher-level Matter architecture.
