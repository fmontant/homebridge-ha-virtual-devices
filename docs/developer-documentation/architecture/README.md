# Architecture

This section documents the internal architecture of **Homebridge HA Virtual Devices V2**.

The main architectural change in V2 is the addition of **Matter as a second independent data source** while preserving the existing Home Assistant integration.

The plugin therefore separates:

- source-specific acquisition;
- source-aware catalog synchronization;
- source-neutral HomeKit publication.

---

## Architectural Principles

The implementation follows several principles:

- each component should have a focused responsibility;
- source-specific code should remain isolated from HomeKit accessory code;
- persistent user preferences must survive rediscovery and restarts;
- the catalog is shared by all supported sources;
- HomeKit publication uses a common device contract;
- source selection is handled at runtime by the `Platform`.

---

## Runtime Overview

```text
                                  Platform
                                     │
                  ┌──────────────────┴──────────────────┐
                  │                                     │
                  ▼                                     ▼
        Home Assistant integration                 MatterProvider
                  │                                     │
       ┌──────────┴──────────┐              ┌───────────┼────────────┐
       │                     │              │           │            │
       ▼                     ▼              ▼           ▼            ▼
DiscoveryManager        EventManager   Controller   Discovery   Subscriptions
       │                     │              │           │            │
       └──────────┬──────────┘              └──────┬────┴────────────┘
                  ▼                                ▼
       ClimateDeviceBuilder                 MatterDeviceMapper
                  │                                │
                  ▼                                ▼
          ClimateDevice                  PublishedClimateDevice
                  │                                │
                  └──────────────┬─────────────────┘
                                 ▼
                       Source-aware catalog
                                 │
                                 ▼
                         RegistryManager
                                 │
                                 ▼
                         AccessoryManager
                                 │
                                 ▼
                         ClimateAccessory
                                 │
                                 ▼
                            Apple Home
```

This diagram is intentionally conceptual. Some source-specific operations update the catalog and accessories at different points, but both source paths converge on the same persistent catalog and HomeKit publication layers.

---

## Source Coordination

### Platform

`src/platform.ts` is the runtime coordinator.

During `didFinishLaunching()` it:

1. loads the persistent device catalog;
2. starts the catalog watcher;
3. starts the Matter path when `matterEnabled === true`;
4. skips Home Assistant when `homeAssistantEnabled === false`;
5. validates Home Assistant URL and token before starting the Home Assistant path.

Backward-compatible defaults are applied in code:

```ts
const homeAssistantEnabled =
  this.config.homeAssistantEnabled !== false;

const matterEnabled =
  this.config.matterEnabled === true;
```

This means an older configuration with neither property set continues to use Home Assistant and does not start Matter.

Matter support is loaded lazily through a dynamic import.

---

## Home Assistant Path

The Home Assistant implementation is distributed across:

- `src/homeassistant/`
- `src/managers/discoveryManager.ts`
- `src/managers/eventManager.ts`
- `src/builders/climateDeviceBuilder.ts`
- `src/managers/ClimateDeviceManager.ts`

The existing `ClimateDevice` model remains the Home Assistant runtime model.

`ClimateDevice` extends the common `PublishedClimateDevice` contract so that it can be consumed by the source-neutral publication pipeline.

---

## Matter Path

Matter-specific code lives in `src/matter/`.

### MatterProvider

`MatterProvider` orchestrates the Matter path.

Its verified responsibilities include:

- starting the Matter controller;
- discovering commissioned Matter peers;
- converting discovery results into catalog devices;
- synchronizing those devices into the common catalog using source `matter`;
- restoring previously stored custom HomeKit names;
- reading the initial device state;
- mapping Matter state to `PublishedClimateDevice`;
- updating temperature, humidity, and battery values through `AccessoryManager`;
- registering subscriptions for later Matter value changes;
- remembering published devices through `RegistryManager`.

### MatterController

Creates and owns the Matter controller node used by discovery and commissioning.

### MatterDeviceDiscovery

Discovers Matter devices reachable through the controller node.

### MatterDeviceMapper

Reads Matter state and converts Matter descriptors and values into the common publication model.

### MatterDeviceCatalogMapper

Converts Matter discovery descriptors into catalog-compatible discovered devices.

### MatterSubscriptionManager

Maintains runtime subscriptions for supported Matter measurements.

The current implementation exposes callbacks for temperature, humidity, and battery updates.

### MatterCommissioningStore

Stores the request/response exchange used by the UI commissioning workflow.

### MatterDeviceNameStore

Persists Matter device names independently so that a custom name can be restored when a Matter device is rediscovered and re-added to the catalog.

---

## Common Publication Contract

`src/models/publishedClimateDevice.ts` defines `PublishedClimateDevice`.

It extends `Device` and provides the fields required by the source-neutral publication side of the plugin:

```ts
export interface PublishedClimateDevice extends Device {
  source?: string;
  temperature?: number;
  humidity?: number;
  batteryLevel?: number;
  available: boolean;
  supportsHumidity?: boolean;
  supportsBattery?: boolean;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  uniqueId?: string;
  softwareVersion?: string;
  hardwareVersion?: string;
}
```

This interface is the key V2 boundary between source-specific acquisition and HomeKit publication.

`ClimateDevice` extends this interface.

Matter devices are converted to this interface by `MatterDeviceMapper`.

---

## Shared Catalog

Both Home Assistant and Matter synchronize discovered devices through the same catalog management layer.

Matter explicitly calls:

```text
CatalogManager.synchronizeDiscoveredDevices(..., "matter")
```

The source value allows the catalog synchronization process to retain source information while using the same persistent catalog infrastructure.

The catalog remains responsible for preserving user preferences and persistent device metadata across restarts and rediscovery.

---

## HomeKit Publication

The publication side remains independent from the acquisition source.

### RegistryManager

Coordinates the set of devices that should be represented by Homebridge accessories.

For Matter, the provider passes the mapped `PublishedClimateDevice` instances to `rememberPublishedClimateDevices()`.

### AccessoryManager

Owns the Homebridge accessory lifecycle and runtime characteristic updates.

The Matter path directly uses it for temperature, humidity, and battery updates after the initial state read and through subscription callbacks.

### ClimateAccessory

Represents a published climate device in HomeKit.

It remains source-independent: it should not need to know whether a value originated from Home Assistant or Matter.

---

## Components

| Component | Main responsibility |
| --- | --- |
| `Platform` | Runtime coordination and source selection |
| `DiscoveryManager` | Home Assistant discovery |
| `EventManager` | Home Assistant runtime events |
| `ClimateDeviceBuilder` | Build Home Assistant climate devices |
| `ClimateDeviceManager` | Manage Home Assistant runtime device state |
| `ClimateDevice` | Home Assistant runtime climate model |
| `PublishedClimateDevice` | Common publication contract |
| `MatterProvider` | Matter orchestration |
| `MatterController` | Matter controller node lifecycle |
| `MatterDeviceDiscovery` | Matter device discovery |
| `MatterDeviceMapper` | Matter state and publication mapping |
| `MatterDeviceCatalogMapper` | Matter-to-catalog mapping |
| `MatterSubscriptionManager` | Matter value subscriptions |
| `CatalogManager` | Catalog synchronization and persistence coordination |
| `DeviceCatalog` | Persistent catalog model |
| `DeviceCatalogStore` | Catalog storage |
| `RegistryManager` | Published-device registry coordination |
| `AccessoryManager` | Homebridge accessory lifecycle and updates |
| `ClimateAccessory` | HomeKit thermostat representation |
| `CatalogApi` | UI-facing catalog API |

---

## Recommended Reading Order

1. `Platform.md`
2. this architecture overview
3. `ClimateDevice.md`
4. `ClimateDeviceBuilder.md`
5. `ClimateDeviceManager.md`
6. `Discovery.md`
7. `EventManager.md`
8. `CatalogManager.md`
9. `DeviceCatalog.md`
10. `DeviceCatalogStore.md`
11. `RegistryManager.md`
12. `AccessoryManager.md`
13. `ClimateAccessory.md`
14. `CatalogApi.md`
15. `Glossary.md`

For the complete Matter architecture, see the [Matter documentation](../Matter/README.md).

---

## V2 Design Boundary

The most important V2 design boundary is:

```text
source-specific acquisition
          │
          ▼
PublishedClimateDevice
          │
          ▼
source-neutral publication
```

This allows Home Assistant and Matter to evolve independently without duplicating the HomeKit publication implementation.
