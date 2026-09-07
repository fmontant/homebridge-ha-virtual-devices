# Platform

The `Platform` class (`src/platform.ts`) is the Homebridge entry point and runtime coordinator of **Homebridge HA Virtual Devices**.

In V2, the Platform no longer assumes that Home Assistant is the only data source. It coordinates two independently selectable providers:

- Home Assistant;
- Matter.

Both providers ultimately feed the shared catalog and HomeKit publication layers.

---

# Purpose

The Platform coordinates the lifecycle of the plugin.

Its main responsibilities include:

- reading the Homebridge configuration;
- initializing shared managers and stores;
- restoring cached Homebridge accessories;
- loading the persistent device catalog;
- selecting which data providers must run;
- starting the Matter provider when enabled;
- starting the Home Assistant integration when enabled and configured;
- coordinating catalog and HomeKit synchronization;
- processing Matter commissioning requests;
- monitoring the plugin lifecycle.

The Platform acts as the application orchestrator. Source-specific acquisition and device mapping are delegated to specialized components.

---

# Source Selection

V2 supports three valid configurations:

- Home Assistant only;
- Matter only;
- Home Assistant and Matter together.

The Platform applies backward-compatible defaults:

```ts
const homeAssistantEnabled =
  this.config.homeAssistantEnabled !== false;

const matterEnabled =
  this.config.matterEnabled === true;
```

Therefore, a configuration created before these options existed behaves as follows:

- Home Assistant is enabled;
- Matter is disabled.

This preserves the behavior of existing installations when upgrading from V1.

---

# Responsibilities

The Platform is responsible for:

- registering Homebridge lifecycle callbacks;
- coordinating shared managers;
- loading the device catalog;
- starting the catalog watcher;
- deciding which providers are active;
- validating the Home Assistant connection parameters before starting that provider;
- creating the Matter provider on demand;
- coordinating Matter commissioning requests;
- handling startup errors without unnecessarily disabling independent providers.

The Platform does **not** implement the detailed protocol logic for Home Assistant or Matter.

That work is delegated to source-specific components.

---

# Lifecycle

The runtime lifecycle follows the Homebridge dynamic platform model.

```text
Homebridge
    │
    ▼
Platform created
    │
    ▼
Configuration and shared components initialized
    │
    ▼
Cached accessories restored
    │
    ▼
didFinishLaunching()
    │
    ▼
Persistent catalog loaded
    │
    ▼
Catalog watcher started
    │
    ├──────────────────────────────┐
    │                              │
    ▼                              ▼
Matter enabled?             Home Assistant enabled?
    │                              │
    ▼                              ▼
MatterProvider              HA configuration checked
    │                              │
    ▼                              ▼
Matter runtime              Home Assistant runtime
    │                              │
    └──────────────┬───────────────┘
                   ▼
            Shared catalog
                   │
                   ▼
          HomeKit publication
                   │
                   ▼
          Runtime event updates
```

The two source paths are independent. Failure or deactivation of one source does not inherently require the other source to stop.

---

# Persistent Catalog Startup

During `didFinishLaunching()`, the Platform first loads the device catalog.

If catalog loading succeeds, it starts the catalog watcher.

This ordering is important because both provider paths rely on the shared catalog infrastructure.

If catalog loading fails, startup cannot safely continue and the Platform returns after logging the error.

---

# Matter Provider Lifecycle

Matter support is optional and is loaded only when required.

The Platform uses a lazy dynamic import:

```ts
const { MatterProvider } =
  await import(../Matter/provider.js');
```

`getMatterProvider()` creates the provider once and then reuses the same instance.

The provider receives shared components including:

- `AccessoryManager`;
- `CatalogManager`;
- `RegistryManager`;
- the Homebridge logger;
- Matter storage paths.

When Matter is enabled, `didFinishLaunching()` obtains the provider and calls `start()`.

A Matter startup failure is logged, but the Platform can still continue toward the Home Assistant path when Home Assistant is enabled.

---

# Home Assistant Lifecycle

Home Assistant remains an independent provider path.

The Platform first evaluates:

```ts
this.config.homeAssistantEnabled !== false
```

If Home Assistant is disabled, the Platform logs that state and does not start the Home Assistant connection, discovery, or WebSocket processing.

When Home Assistant is enabled, both `haUrl` and `token` must contain usable values.

If either is missing, the Platform logs a warning and does not start the Home Assistant provider.

When the configuration is valid, the existing Home Assistant components handle connection, discovery, device construction, synchronization, and runtime events.

---

# Matter Commissioning

The Platform also participates in the Matter commissioning workflow used by the plugin UI.

Commissioning requests are exchanged through the Matter commissioning store.

When a request is detected, the Platform:

1. loads the pending commissioning request;
2. obtains the `MatterProvider`;
3. calls `matterProvider.commission()` with the Matter pairing code;
4. stores a success or failure response for the UI.

On success, the response can include the commissioned device identifier and name.

The detailed Matter commissioning protocol remains the responsibility of `MatterProvider` and the Matter controller layer.

---

# Dependencies

The Platform coordinates several shared and source-specific components.

Conceptually:

```text
Platform
│
├── Shared infrastructure
│   ├── CatalogManager
│   ├── RegistryManager
│   └── AccessoryManager
│
├── Home Assistant path
│   ├── Home Assistant client / WebSocket
│   ├── DiscoveryManager
│   ├── EventManager
│   ├── ClimateDeviceBuilder
│   └── ClimateDeviceManager
│
└── Matter path
    └── MatterProvider
        ├── MatterController
        ├── MatterDeviceDiscovery
        ├── MatterDeviceMapper
        ├── MatterDeviceCatalogMapper
        └── MatterSubscriptionManager
```

This separation allows source-specific implementations to evolve without duplicating the shared HomeKit publication infrastructure.

---

# Internal Workflow

A simplified V2 startup sequence is:

1. Homebridge instantiates the Platform.
2. Shared managers and stores are initialized.
3. Cached Homebridge accessories are restored through the dynamic platform lifecycle.
4. Homebridge emits `didFinishLaunching`.
5. The persistent catalog is loaded.
6. The catalog watcher is started.
7. If Matter is enabled, the Matter provider is loaded and started.
8. If Home Assistant is disabled, the Home Assistant path is skipped.
9. If Home Assistant is enabled, its URL and token are validated.
10. The Home Assistant connection and discovery path starts when configuration is complete.
11. Both active sources feed the shared catalog and publication infrastructure.
12. Runtime updates continue through their respective event/subscription mechanisms.

---

# Error Handling

Startup errors are handled according to the component affected.

Examples include:

- persistent catalog loading failure;
- Matter provider startup failure;
- incomplete Home Assistant configuration;
- Home Assistant communication failure;
- Matter commissioning failure.

The Platform attempts to preserve independence between providers.

For example, a Matter startup failure is logged without automatically preventing a configured Home Assistant provider from starting.

Conversely, disabling Home Assistant does not prevent Matter-only operation.

---

# Logging

The Platform provides lifecycle-level logging.

Important messages include:

- plugin startup;
- number of devices loaded from the catalog;
- provider activation or deactivation;
- incomplete provider configuration;
- Matter provider startup failures;
- Home Assistant connection or discovery failures;
- commissioning results;
- catalog processing errors.

Protocol-specific diagnostic logging belongs in the corresponding Home Assistant or Matter components.

---

# Collaboration with the Common Device Model

V2 introduces `PublishedClimateDevice` as the source-neutral publication contract.

```text
Home Assistant
     │
     ▼
ClimateDevice
     │
     │ extends
     ▼
PublishedClimateDevice
     │
     ▼
Shared publication infrastructure
```

Matter uses a different acquisition model but maps its device state to the same `PublishedClimateDevice` contract through `MatterDeviceMapper`.

The Platform coordinates these paths but does not perform the mapping itself.

---

# Collaboration with the Catalog

The catalog is shared by both providers.

Source information is retained during synchronization so that the common catalog can distinguish the origin of discovered devices.

The Matter path explicitly synchronizes its discovered catalog devices with source `matter`.

The Home Assistant path continues to use the same catalog infrastructure for its own discovered devices.

The Platform owns the startup ordering that makes this shared catalog available before provider processing begins.

---

# Collaboration with HomeKit Publication

The Platform does not directly implement thermostat behavior.

Publication responsibilities remain delegated to:

- `RegistryManager`;
- `AccessoryManager`;
- `ClimateAccessory`.

This keeps HomeKit representation independent from Home Assistant and Matter protocol details.

---

# Design Principles

## Coordination Rather Than Protocol Logic

The Platform decides **when** subsystems start and **which** providers are active.

It should not absorb Home Assistant or Matter protocol implementation.

---

## Provider Independence

Home Assistant and Matter can be enabled independently.

A source-specific failure should be contained whenever the shared infrastructure remains usable.

---

## Shared Persistence

Both providers use the same persistent catalog infrastructure rather than maintaining separate user-facing catalogs.

---

## Source-Neutral Publication

HomeKit publication should consume common device information rather than depend directly on a source protocol.

`PublishedClimateDevice` formalizes this V2 boundary.

---

## Lazy Matter Loading

Matter-specific runtime code is imported only when Matter functionality is required.

This avoids imposing Matter provider initialization on Home Assistant-only installations.

---

## Backward Compatibility

Missing V2 source-selection flags preserve the historical Home Assistant-only behavior.

This allows existing V1 configurations to migrate without requiring an immediate configuration rewrite.

---

# Related Components

- `MatterProvider`
- `DiscoveryManager`
- `EventManager`
- `ClimateDeviceBuilder`
- `ClimateDeviceManager`
- `CatalogManager`
- `RegistryManager`
- `AccessoryManager`
- `ClimateAccessory`
- `PublishedClimateDevice`

---

# Related Documentation

- [Architecture overview](README.md)
- [Discovery](Discovery.md)
- [EventManager](EventManager.md)
- [ClimateDevice](ClimateDevice.md)
- [ClimateDeviceBuilder](ClimateDeviceBuilder.md)
- [ClimateDeviceManager](ClimateDeviceManager.md)
- [CatalogManager](CatalogManager.md)
- [RegistryManager](RegistryManager.md)
- [AccessoryManager](AccessoryManager.md)
- [ClimateAccessory](ClimateAccessory.md)
- [Glossary](Glossary.md)

The Platform remains the architectural root of the plugin, but in V2 its primary role is to coordinate multiple independent data sources around a shared catalog and a common HomeKit publication pipeline.
