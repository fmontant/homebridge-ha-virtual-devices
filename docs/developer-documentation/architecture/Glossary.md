# Glossary

This glossary defines the terminology used throughout the Homebridge HA Virtual Devices project.

It provides a common vocabulary for developers, contributors and maintainers.

---

# A

## Accessory

A Homebridge accessory exposed to Apple Home.

Within this project, each published virtual sensor is represented by a `ClimateAccessory`.

---

## AccessoryManager

Component responsible for creating, restoring, updating and removing Homebridge accessories.

It acts as the bridge between the internal registry and the Homebridge platform.

---

## Available

State indicating that the corresponding Home Assistant entity is currently reachable and reporting valid values.

When an entity becomes unavailable, HomeKit characteristics are updated accordingly.

---

# B

## Battery Level

Battery percentage reported by the Home Assistant entity.

When enabled, this value is exposed as a HomeKit Battery Service attached to the accessory.

---

# C

## Catalog

Persistent collection of every discovered virtual device.

The catalog stores both runtime information and user preferences.

---

## Catalog API

Internal API used by the Homebridge UI to query and update the device catalog.

---

## CatalogDevice

Persistent representation of a discovered device.

Unlike `ClimateDevice`, it also contains user preferences and historical metadata.

---

## CatalogManager

Central component responsible for synchronizing the persistent catalog with discovered devices.

---

## ClimateAccessory

Homebridge accessory representing a virtual climate sensor.

It exposes temperature, humidity and battery information using HomeKit services.

---

## ClimateDevice

Internal runtime representation of a Home Assistant entity.

It is created during discovery before being synchronized with the persistent catalog.

---

## ClimateDeviceBuilder

Component responsible for transforming raw Home Assistant entities into `ClimateDevice` instances.

---

## ClimateDeviceManager

Coordinates the collection of discovered devices before synchronization with the catalog.

---

# D

## Device Catalog

Persistent storage containing all known devices.

The catalog survives Homebridge restarts.

---

## DeviceCatalogStore

Component responsible for reading and writing the persistent catalog.

The current implementation uses a JSON file stored on disk.

---

## Discovery

Process responsible for identifying compatible Home Assistant entities.

Discovery occurs during startup and whenever Home Assistant reports changes.

---

# E

## Entity

A Home Assistant object identified by an entity ID.

Only compatible entities are converted into virtual devices.

---

## EventManager

Processes Home Assistant events and propagates meaningful changes throughout the plugin.

---

# H

## Home Assistant

External home automation platform providing the source data used by the plugin.

---

## Homebridge

Bridge exposing non-HomeKit devices to Apple Home.

This plugin extends Homebridge by publishing virtual climate accessories.

---

## HomeKit

Apple framework used to control and monitor smart home accessories.

---

# L

## Last Communication

Timestamp indicating the most recent successful communication with the corresponding Home Assistant entity.

This value is displayed in the Homebridge UI and helps diagnose connectivity issues.

---

# M

## Missing

State assigned to a device that previously existed but is no longer discovered.

Missing devices remain in the catalog until explicitly removed.

---

# P

## Platform

The Homebridge platform plugin entry point.

It initializes every subsystem required by the plugin.

---

## Preferences

User-defined settings associated with a device.

Examples include:

- room assignment;
- favorite status;
- enabled state;
- hidden state.

Preferences are stored in the persistent catalog.

---

# R

## Registry

Internal collection describing which devices should currently be published.

---

## RegistryManager

Determines which accessories must be created, updated, restored or removed.

---

# S

## Synchronization

Process ensuring consistency between:

- Home Assistant;
- the persistent catalog;
- Homebridge;
- Apple Home.

---

# T

## Thermostat Service

HomeKit service used to expose temperature and humidity.

Although the devices are sensors, the Thermostat service offers the best user experience by grouping related information into a single tile.

---

# U

## UI

The Homebridge web interface used to configure and monitor the plugin.

---

# V

## Virtual Device

A software-generated HomeKit accessory that represents a Home Assistant entity.

No physical HomeKit device exists; the accessory is created dynamically by the plugin.

---

# W

## WebSocket

Communication channel used to receive real-time updates from Home Assistant.

---

# Related Documentation

- Platform.md
- Discovery.md
- ClimateDevice.md
- CatalogManager.md
- RegistryManager.md
- ClimateAccessory.md

This glossary should be updated whenever new concepts or architectural terms are introduced into the project.