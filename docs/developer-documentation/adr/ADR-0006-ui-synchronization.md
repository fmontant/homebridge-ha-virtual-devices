# ADR-0006: Synchronize UI Catalog Changes through Persistent File Observation

- **Status:** Accepted
- **Scope:** UI-to-runtime synchronization
- **Applies to:** Shared V2 catalog and Matter commissioning handoff
- **Architecture:** V2

---

# Context

Homebridge HA Virtual Devices has two execution environments that must cooperate:

- the Homebridge platform runtime;
- the custom plugin UI.

The UI can modify persistent catalog preferences such as:

```text
enabled
hidden
favorite
room
```

Those changes must eventually affect the running HomeKit publication state.

The platform runtime cannot safely assume that an in-memory catalog object has already been updated when the UI writes persistent state.

V2 also introduces Matter commissioning through the UI, which requires a request to cross the same UI/runtime boundary.

The architecture therefore needs a simple, robust handoff mechanism between:

```text
custom UI
```

and:

```text
Homebridge platform runtime
```

without tightly coupling the two processes through direct in-memory calls.

---

# Decision

The plugin uses persistent files in the plugin storage directory as the synchronization boundary between UI-side changes and the running platform.

For catalog changes:

```text
device-catalog.json
```

is observed by the platform using filesystem watching.

For Matter commissioning:

```text
matter-commissioning-request.json
```

is also observed by the same runtime watcher.

The platform reacts to those file changes and invokes the appropriate runtime operation.

---

# Storage Directory

The platform watches:

```text
<homebridge storage path>/ha-virtual-devices
```

The directory is created if necessary before the watcher starts.

Conceptually:

```text
Homebridge storage
      │
      └── ha-virtual-devices/
            ├── device-catalog.json
            └── matter-commissioning-request.json
```

Additional plugin state files can coexist in the same directory.

---

# Catalog Change Flow

When the UI updates catalog preferences, the persistent catalog file changes.

The platform watcher receives the filesystem event and reacts only when the affected file is:

```text
device-catalog.json
```

or when the event does not provide a filename.

Other unrelated filenames are ignored.

Conceptually:

```text
Custom UI
    │
    ▼
CatalogApi
    │
    ▼
CatalogManager
    │
    ▼
DeviceCatalogStore
    │
    ▼
device-catalog.json
    │
    ▼
fs.watch(...)
    │
    ▼
RegistryManager.refreshFromCatalog()
    │
    ▼
AccessoryManager
    │
    ▼
HomeKit publication
```

---

# Debounced Runtime Refresh

Filesystem implementations can emit more than one event for one logical file update.

The platform therefore does not call `refreshFromCatalog()` immediately on every event.

Instead, it uses a short debounce timer.

The current delay is:

```text
250 ms
```

If another relevant event arrives before the timer fires, the previous timer is cleared and restarted.

Conceptually:

```text
catalog event
    │
    ▼
clear previous timer
    │
    ▼
start 250 ms timer
    │
    ▼
refreshFromCatalog()
```

This reduces duplicate catalog reloads caused by clustered filesystem notifications.

---

# Runtime Refresh

After the debounce interval, the platform invokes:

```ts
this.registryManager.refreshFromCatalog()
```

The registry manager then:

- reloads the persistent catalog;
- compares current publication state with the previous snapshot;
- finds the corresponding remembered runtime device;
- applies catalog-driven publication changes through `AccessoryManager`.

This keeps the filesystem watcher itself simple.

It detects change; it does not implement publication logic.

---

# Matter Commissioning Handoff

The same directory watcher also detects:

```text
matter-commissioning-request.json
```

When that file changes, the platform invokes:

```ts
processMatterCommissioningRequest()
```

and returns from the watcher callback without treating the event as a catalog reload.

Conceptually:

```text
Matter UI panel
    │
    ▼
commissioning request file
    │
    ▼
platform file watcher
    │
    ▼
processMatterCommissioningRequest()
    │
    ▼
MatterProvider.commission(...)
```

This provides a file-based handoff between the UI-facing commissioning flow and the runtime Matter controller.

---

# Separation of Concerns

The watcher has only three responsibilities:

1. identify the relevant changed file;
2. debounce catalog reloads;
3. dispatch the corresponding runtime action.

It does not own:

- catalog persistence;
- catalog comparison;
- Matter commissioning logic;
- accessory publication.

Those responsibilities remain delegated to their dedicated components.

---

# Why File Observation

The plugin already persists catalog state to disk.

Using that persisted state as the UI/runtime handoff point provides a simple process boundary with no need for direct shared memory.

The runtime can always reload the authoritative persisted catalog after a UI change.

For commissioning, the request file similarly acts as a durable handoff artifact that the runtime can process independently of the UI component lifecycle.

---

# Consequences

## Positive

### Loose coupling between UI and runtime

The UI does not require direct access to the platform's in-memory managers.

### Persistent state is the synchronization authority

The runtime reloads what was actually saved rather than relying on transient UI state.

### Catalog updates survive process timing differences

The file remains available even if the UI and runtime execute asynchronously.

### Duplicate filesystem notifications are absorbed

The 250 ms debounce prevents unnecessary repeated reloads.

### Matter commissioning uses the same storage boundary

The V2 UI/runtime bridge does not require a separate direct transport for commissioning requests.

---

## Trade-offs

### Filesystem watching is platform-dependent

`fs.watch` behavior can vary between operating systems and filesystems.

The implementation must therefore tolerate events with missing filenames and duplicate notifications.

### Synchronization is asynchronous

A UI save is not the same operation as a completed HomeKit publication refresh.

There is a short file-observation and debounce delay.

### File-based handoff requires careful persistence behavior

Catalog writes and commissioning request writes must complete cleanly before the runtime consumes them.

### The watcher is an integration boundary

Changes to storage filenames or directory layout must be coordinated across UI and platform components.

---

# Alternatives Considered

## Direct in-memory calls from the UI

Rejected because the custom UI and Homebridge runtime do not share a reliable in-memory execution context.

## Poll the catalog periodically

Rejected because it would add unnecessary repeated filesystem work and introduce larger propagation delays.

## Let UI writes modify HomeKit state directly

Rejected because HomeKit publication belongs to the platform runtime, not the UI server.

## Create a separate transport only for Matter commissioning

Rejected for the current architecture because the file-based handoff already provides a simple runtime boundary in the plugin storage directory.

---

# Implementation

The main runtime watcher is implemented in:

```text
src/platform.ts
```

Catalog UI persistence is implemented through:

```text
src/ui/catalogApi.ts
src/managers/catalogManager.ts
src/catalog/deviceCatalog.ts
src/catalog/deviceCatalogStore.ts
```

Catalog runtime refresh is implemented in:

```text
src/managers/registryManager.ts
```

Matter commissioning persistence is implemented in:

```text
src/matter/commissioningStore.ts
```

and commissioning execution is coordinated through:

```text
src/platform.ts
src/matter/provider.ts
```

---

# Related Architecture

- [Platform](../architecture/Platform.md)
- [CatalogApi](../architecture/CatalogApi.md)
- [RegistryManager](../architecture/RegistryManager.md)
- [DeviceCatalogStore](../architecture/DeviceCatalogStore.md)
- [Matter Commissioning Store](../Matter/MatterCommissioningStore.md)
- [Matter Provider](../Matter/MatterProvider.md)

---

# Decision Summary

Homebridge HA Virtual Devices synchronizes UI-driven catalog changes with the running Homebridge platform through persistent file observation.

The platform watches the plugin storage directory, debounces changes to `device-catalog.json` for 250 ms, and delegates runtime reconciliation to `RegistryManager.refreshFromCatalog()`.

The same watcher also detects Matter commissioning request files and dispatches them to the runtime commissioning flow, keeping the UI and platform loosely coupled while using persistent storage as their shared boundary.
