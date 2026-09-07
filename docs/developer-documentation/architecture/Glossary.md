# Glossary

This glossary defines the terminology used throughout the Homebridge HA Virtual Devices V2 project.

It provides a common vocabulary for developers, contributors, and maintainers across the Home Assistant, Matter, catalog, Homebridge, and Apple Home layers.

---

# A

## Accessory

A Homebridge platform accessory exposed to Apple Home.

Within this project, a publishable climate device is represented in HomeKit through a `ClimateAccessory` wrapper associated with a Homebridge `PlatformAccessory`.

---

## AccessoryManager

Component responsible for creating, restoring, updating, and removing Homebridge climate accessories.

In V2, it accepts the source-neutral `PublishedClimateDevice` model for publication while retaining Home Assistant-specific entity-index and missing-device paths where required.

Matter real-time updates can be routed directly by plugin device ID.

---

## Available

Runtime availability flag indicating whether a published device is currently considered reachable.

At HomeKit level, availability is represented through `StatusActive` and `StatusFault`.

For Home Assistant entity-based availability, the affected characteristic can additionally receive `SERVICE_COMMUNICATION_FAILURE`.

---

# B

## Battery Level

Battery percentage exposed by a compatible climate device.

In the current HomeKit representation, battery information is integrated directly into the Thermostat service using:

- `BatteryLevel`;
- `StatusLowBattery`;
- `ChargingState`.

Battery values are normalized to `0–100%`.

A value at or below 20% is reported as low battery.

---

# C

## Catalog

The persistent, source-aware collection of known devices.

The catalog stores:

- provider identity;
- device identity;
- capabilities;
- metadata;
- preferences;
- timestamps;
- availability;
- lifecycle state.

Home Assistant and Matter devices use the same catalog infrastructure.

---

## Catalog API

Internal UI-facing API implemented by `CatalogApi`.

It exposes mapped and sorted catalog devices to the Homebridge plugin UI and delegates supported preference changes to `CatalogManager`.

The V2 API model includes `source` and `sourceId`.

---

## CatalogDevice

Persistent representation of a known device in the shared catalog.

A `CatalogDevice` contains technical discovery data as well as persistent user preferences and lifecycle timestamps.

It is distinct from provider runtime models.

---

## CatalogManager

Operational facade around `DeviceCatalog`.

It coordinates catalog loading, source-aware synchronization, preference changes, availability updates, and access to persistent catalog devices.

Home Assistant synchronization is mapped through `synchronizeClimateDevices()`, while generic provider synchronization can specify a source explicitly.

---

## ClimateAccessory

HomeKit-facing wrapper responsible for configuring and updating the Thermostat tile.

It consumes a `PublishedClimateDevice` plus optional Home Assistant entity identifiers.

Temperature, optional humidity, battery information, and availability are exposed through the same Thermostat service.

---

## ClimateDevice

Home Assistant runtime climate model.

`ClimateDevice` extends the source-neutral `PublishedClimateDevice` contract and adds Home Assistant-specific information such as:

- `temperatureEntity`;
- `humidityEntity`;
- `batteryEntity`.

It should not be used as the generic V2 provider model.

---

## ClimateDeviceBuilder

Home Assistant-specific builder that transforms discovered Home Assistant information into `ClimateDevice` instances.

It belongs to the Home Assistant runtime path rather than the generic publication contract.

---

## ClimateDeviceManager

Component used by the Home Assistant discovery pipeline to prepare and manage `ClimateDevice` instances before catalog synchronization and publication.

---

## Commissioning

Matter process used to add a device to the plugin's Matter fabric.

In the V2 user flow, Apple Home places an existing Matter accessory into pairing mode and generates a new Matter sharing code.

The plugin uses that code to commission the device through the Matter provider.

Commissioning is distinct from normal discovery of already commissioned Matter peers.

---

# D

## Device Catalog

See **Catalog**.

The persistent catalog survives Homebridge restarts and is shared by the enabled providers.

---

## Device ID

Plugin-level identifier used to associate runtime devices, catalog entries, and Homebridge accessories.

`AccessoryManager` also uses the device ID to derive a deterministic Homebridge UUID:

```text
sensor-v2:<deviceId>
```

Matter measurement updates are routed through this device-level identity rather than Home Assistant entity IDs.

---

## DeviceCatalog

In-memory catalog implementation backed by `DeviceCatalogStore`.

It performs source-aware synchronization, maintains preferences and lifecycle state, and implements the publication rule through `shouldPublish()`.

---

## DeviceCatalogStore

Persistence component responsible for reading and writing the catalog JSON file.

Writes use a temporary file followed by an atomic rename.

Malformed top-level data is rejected as an empty catalog when it is not an array, while structurally invalid entries are filtered during loading.

---

## Discovery

Process of identifying compatible runtime devices from an enabled provider.

In V2, discovery is provider-specific.

Home Assistant discovery builds `ClimateDevice` objects from HA registries and entities.

Matter discovery enumerates commissioned Matter peers and maps them into the shared catalog/publication pipeline.

---

# E

## Entity

A Home Assistant object identified by an entity ID.

Entity IDs are specific to the Home Assistant provider.

Compatible temperature, humidity, and battery entities can be associated with a `ClimateDevice`.

Matter devices do not require Home Assistant entity IDs.

---

## Entity ID

Home Assistant identifier such as a temperature, humidity, or battery entity ID.

`AccessoryEntityIndex` uses these identifiers to route Home Assistant real-time updates to the correct `ClimateAccessory`.

---

## EventManager

Home Assistant-specific event processing component.

It receives relevant HA runtime events and propagates measurement or availability changes through the entity-based update path.

Matter subscriptions use their own provider path and do not depend on `EventManager`.

---

# H

## Home Assistant

Optional V2 data provider supported by the plugin.

When enabled, the plugin connects to Home Assistant, discovers compatible entities, creates `ClimateDevice` runtime objects, synchronizes them with the shared catalog, and receives real-time updates through WebSocket events.

V2 can also operate without Home Assistant when Matter is enabled.

---

## Homebridge

Bridge framework used by the plugin to publish virtual climate accessories to Apple Home.

The plugin registers and restores Homebridge platform accessories through `AccessoryManager`.

---

## HomeKit

Apple smart-home accessory framework used by Homebridge.

The plugin presents climate information primarily through the HomeKit Thermostat service.

---

## HomeKit Name

Persistent catalog preference used to override the name published to HomeKit.

When present and non-empty, `AccessoryManager` uses the trimmed custom name.

Otherwise the catalog device name is passed through `DisplayNameFormatter`.

---

# L

## Last Communication

UI-facing timestamp representing the most recent known communication with a device.

`CatalogApiMapper` uses:

```text
device.lastCommunication
```

when available and falls back to:

```text
device.timestamps.lastSeen
```

The concept is provider-neutral at catalog/API level.

---

# M

## Matter

Optional V2 provider allowing compatible Matter climate sensors to be used directly by the plugin without requiring Home Assistant.

Matter devices are commissioned, discovered, mapped to the shared catalog, read initially, and updated through Matter subscriptions.

Matter and Home Assistant can be enabled independently or together.

---

## Matter Controller

`MatterController` owns the plugin's Matter controller node lifecycle.

It creates, starts, closes, and exposes the Matter node used by discovery and commissioning operations.

---

## Matter Device

A compatible device discovered through the Matter provider.

The Matter layer represents discovered devices using `MatterDeviceDescriptor` and runtime measurements using `MatterDeviceState` before mapping them into shared plugin models.

---

## Matter Provider

`MatterProvider` orchestrates the Matter runtime path.

Its responsibilities include:

- starting the Matter controller;
- discovering commissioned peers;
- synchronizing Matter devices into the shared catalog;
- reading initial device state;
- publishing runtime devices;
- registering Matter subscriptions;
- handling commissioning;
- preserving stored custom names across rediscovery.

---

## Matter Subscription

Real-time Matter update mechanism used by `MatterSubscriptionManager`.

Temperature, humidity, and battery changes can be forwarded to `AccessoryManager` by plugin device ID.

This path does not require Home Assistant entity IDs.

---

## Missing

Catalog state assigned when a previously known device is no longer discovered by the provider currently being synchronized.

Missing detection is source-aware: synchronizing one source does not mark devices from another source as missing.

The current HomeKit mechanism that preserves an already-published missing accessory as unavailable is specifically implemented for the Home Assistant `ClimateDevice` path.

---

## Multi-Admin

Matter capability allowing the same physical Matter accessory to participate in more than one Matter fabric.

The V2 commissioning workflow uses a new Matter sharing code generated from Apple Home pairing mode so an accessory already present in Apple Home can also be commissioned by the plugin.

---

# P

## Platform

`HAVirtualDevicesPlatform`, the Homebridge platform plugin entry point.

It coordinates startup and configuration, loads the persistent catalog, starts enabled providers, manages Home Assistant connectivity, lazily loads the Matter provider, and connects the major plugin subsystems.

---

## Preferences

Persistent user-defined settings associated with a catalog device.

Current catalog preferences include fields such as:

- enabled state;
- favorite state;
- hidden state;
- archived state;
- internal room;
- HomeKit-facing custom name.

Not every preference is necessarily editable through every API endpoint.

---

## Provider

A source-specific runtime integration that supplies devices to the shared catalog and HomeKit publication pipeline.

V2 currently supports two provider paths:

```text
Home Assistant
Matter
```

Provider selection is independent.

Valid configurations are:

```text
Home Assistant only
Matter only
Home Assistant + Matter
```

The plugin configuration UI prevents both providers from being disabled simultaneously.

---

## Publishable

Derived condition indicating whether a catalog device should be published to HomeKit.

The current rule is:

```text
enabled && !archived
```

`hidden` and `favorite` do not affect publication eligibility.

---

## PublishedClimateDevice

Source-neutral runtime contract used by the V2 HomeKit publication layer.

It contains common fields such as:

- identity;
- source;
- temperature;
- humidity;
- battery level;
- availability;
- capabilities;
- manufacturer/model information;
- serial and version metadata.

`ClimateDevice` extends this contract for Home Assistant.

Matter runtime data is also mapped into this contract before publication.

---

# R

## Registry

A collection of runtime information used to determine what should be published.

In the Home Assistant path, device and entity registries participate in discovery.

The term should not be confused with the persistent device catalog.

---

## RegistryManager

Coordinator between Home Assistant registry discovery, the shared catalog, runtime publication memory, and `AccessoryManager`.

Its publication memory uses `PublishedClimateDevice`, allowing Matter runtime devices to coexist with Home Assistant runtime devices.

The Home Assistant registry synchronization flow itself remains HA-specific.

---

# S

## Source

Identifier describing which provider owns a catalog device.

Current values used by the V2 synchronization paths include:

```text
home-assistant
matter
```

Source identity is used to isolate synchronization and missing-device handling between providers.

---

## Source ID

Provider-specific identifier stored alongside the plugin catalog ID.

It preserves the identity supplied by the originating provider while allowing the shared catalog to use a common device model.

---

## Source-Aware Synchronization

Synchronization behavior in which catalog changes are scoped to a specific provider source.

For example, when Home Assistant is synchronized, only Home Assistant catalog entries are eligible to be marked missing.

Matter entries are not marked missing by an HA synchronization pass, and vice versa.

---

## Synchronization

Process used to reconcile discovered provider devices with the persistent catalog and HomeKit publication state.

In V2, synchronization is no longer defined only as:

```text
Home Assistant → catalog → Homebridge
```

The architecture supports parallel provider paths:

```text
Home Assistant ─┐
                ├──► shared catalog ─► publication ─► Homebridge ─► Apple Home
Matter ─────────┘
```

Each provider retains its own discovery/runtime mechanisms while sharing the catalog and publication layers.

---

# T

## Thermostat Service

Primary HomeKit service used to present a climate sensor as a single Apple Home tile.

The service exposes:

- current temperature;
- optional relative humidity;
- optional battery information;
- active/fault state.

Heating and cooling states are configured as `OFF`, and the target temperature is fixed for presentation purposes.

The service is used as a display-oriented climate tile rather than as an active HVAC controller.

---

# U

## UI

Homebridge plugin web interface used to configure providers and manage discovered catalog devices.

In V2, the UI supports independent Home Assistant and Matter source selection and consumes source-aware catalog data.

---

# V

## Virtual Device

Software-generated Homebridge/HomeKit representation of a compatible source device.

In V2, the source may be Home Assistant or Matter.

The virtual accessory is created by the plugin and does not imply that the original physical device is itself a native Homebridge accessory.

---

# W

## WebSocket

Persistent communication channel used by the Home Assistant provider for real-time state and registry updates.

It is not the Matter real-time update mechanism; Matter uses subscriptions through the Matter provider.

---

# Related Documentation

- [Architecture overview](README.md)
- [Platform](Platform.md)
- [Discovery](Discovery.md)
- [ClimateDevice](ClimateDevice.md)
- [ClimateDeviceBuilder](ClimateDeviceBuilder.md)
- [ClimateDeviceManager](ClimateDeviceManager.md)
- [CatalogManager](CatalogManager.md)
- [DeviceCatalog](DeviceCatalog.md)
- [DeviceCatalogStore](DeviceCatalogStore.md)
- [RegistryManager](RegistryManager.md)
- [AccessoryManager](AccessoryManager.md)
- [ClimateAccessory](ClimateAccessory.md)
- [CatalogApi](CatalogApi.md)

This glossary should be updated whenever a provider, shared model, catalog concept, or architectural responsibility changes.
