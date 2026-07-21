# Architecture

This document describes the internal architecture of **Homebridge HA Virtual Devices**.

Its purpose is to explain how the different components interact, why the project has been designed this way and how new features should integrate into the existing architecture.

---

# Design principles

The architecture follows four fundamental principles.

## 1. Single Responsibility

Each class has one clearly identified responsibility.

A component should never perform work that belongs to another component.

---

## 2. Native HomeKit

The plugin always favors native HomeKit services over custom implementations.

This guarantees long-term compatibility with Apple's ecosystem.

---

## 3. Automatic discovery

Users should not have to manually declare devices whenever possible.

Discovery is entirely driven by Home Assistant.

---

## 4. Persistent state

User preferences should survive:

- Homebridge restarts
- Home Assistant restarts
- plugin upgrades
- temporary network failures

For this reason, every discovered device is stored in a persistent catalog.

---

# High-level architecture

```
                           Home Assistant
                                 │
                                 │
                      WebSocket API Events
                                 │
                                 ▼
                         Discovery Service
                                 │
                                 ▼
                      ClimateDeviceBuilder
                                 │
                                 ▼
                      ClimateDeviceManager
                                 │
                                 ▼
                         CatalogManager
                                 │
                Persistent Device Catalog
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
                          Apple HomeKit
```

Each layer performs a specific role.

No component bypasses another.

---

# Main components

## Discovery

The discovery layer communicates with Home Assistant.

Responsibilities:

- enumerate compatible entities
- listen for WebSocket events
- detect new devices
- detect removed devices
- detect state changes

The discovery layer never creates HomeKit accessories directly.

---

## ClimateDeviceBuilder

The builder converts raw Home Assistant entities into internal objects.

Responsibilities:

- group related entities
- detect capabilities
- extract metadata
- normalize values

Output:

```
ClimateDevice
```

This object becomes the internal representation used everywhere else.

---

## ClimateDeviceManager

The manager owns every discovered ClimateDevice.

Responsibilities:

- update devices
- expose devices to other services
- notify listeners
- maintain runtime consistency

It contains no HomeKit logic.

---

# CatalogManager

The Catalog Manager synchronizes runtime devices with the persistent catalog.

Responsibilities:

- load catalog
- save catalog
- synchronize discovery
- preserve preferences
- update timestamps
- update availability

It represents the bridge between runtime objects and persistent storage.

---

# Persistent catalog

The catalog is stored on disk.

Each record contains information such as:

- identifier
- display name
- room
- publication state
- favorite
- hidden flag
- availability
- first discovery
- last seen
- last communication
- missing state

Unlike runtime objects, catalog entries survive restarts.

---

# RegistryManager

The Registry Manager coordinates synchronization between:

- runtime devices
- persistent catalog
- Homebridge accessories

It is the orchestration layer of the plugin.

Responsibilities include:

- detect publication changes
- compare previous and current state
- synchronize only modified accessories
- preserve cached accessories
- notify AccessoryManager

Since version **1.0.9**, the Registry Manager no longer republishes every accessory after each catalog modification.

Only impacted accessories are synchronized.

This dramatically reduces unnecessary work.

---

# AccessoryManager

The Accessory Manager owns Homebridge accessories.

Responsibilities:

- create accessories
- restore cached accessories
- unregister accessories
- publish accessories
- update accessory information

It is the only component responsible for Homebridge accessory lifecycle management.

---

# ClimateAccessory

ClimateAccessory encapsulates every HomeKit service.

Responsibilities:

- create thermostat service
- update temperature
- update humidity
- update battery
- update availability
- expose accessory information

No discovery logic exists here.

No persistence logic exists here.

Only HomeKit behavior.

---

# Device synchronization

The synchronization workflow is intentionally linear.

```
Home Assistant Event

        │

        ▼

Discovery

        │

        ▼

ClimateDevice updated

        │

        ▼

Catalog synchronized

        │

        ▼

Registry comparison

        │

        ▼

Accessory synchronization

        │

        ▼

Apple Home updated
```

Each stage receives fully validated information from the previous one.

---

# Dynamic synchronization

Version **1.0.9** introduced dynamic synchronization.

Previous workflow:

```
Preference modified

        │

Restart Homebridge

        │

Reload every accessory

        │

Apple Home updated
```

Current workflow:

```
Preference modified

        │

Catalog updated

        │

Registry detects change

        │

AccessoryManager updates one accessory

        │

Apple Home updated
```

This considerably improves responsiveness.

---

# Runtime objects

The project distinguishes between runtime objects and persistent objects.

Runtime:

```
ClimateDevice
```

Persistent:

```
CatalogDevice
```

This separation avoids mixing temporary sensor values with long-term user preferences.

---

# Event flow

```
Home Assistant

        │

State Changed

        │

        ▼

EventManager

        │

        ▼

ClimateDeviceManager

        │

        ▼

CatalogManager

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

HomeKit
```

Events always travel in the same direction.

This makes the architecture predictable and easy to debug.

---

# Persistence

The catalog is stored as JSON.

Typical information includes:

- metadata
- preferences
- timestamps
- publication state
- availability

Runtime values remain in memory.

Only long-term information is persisted.

---

# Error handling

The plugin assumes that Home Assistant or Zigbee devices may temporarily become unavailable.

Rather than deleting accessories:

- availability is updated
- communication failures are reported when possible
- preferences are preserved
- accessories recover automatically

This philosophy avoids unnecessary HomeKit recreation.

---

# Scalability

The architecture has been designed to support additional environmental sensors with minimal changes.

Future sensor implementations should only require:

- extending ClimateDeviceBuilder
- extending ClimateAccessory
- exposing new characteristics

The synchronization pipeline remains unchanged.

---

# Development guidelines

When adding new features:

- keep responsibilities separated
- avoid bypassing CatalogManager
- avoid bypassing RegistryManager
- never duplicate synchronization logic
- prefer composition over large classes

Whenever possible:

- runtime state belongs to managers
- persistent state belongs to the catalog
- HomeKit logic belongs to ClimateAccessory

Following these principles keeps the project maintainable as it grows.
