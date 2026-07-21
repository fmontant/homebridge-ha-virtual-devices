# ClimateDevice

The `ClimateDevice` class represents the internal runtime model of a compatible Home Assistant entity.

It is the central business object used throughout the synchronization pipeline.

Unlike Home Assistant entities, which expose raw data, a `ClimateDevice` contains normalized information ready to be processed by the plugin.

---

# Purpose

The primary purpose of `ClimateDevice` is to provide a consistent internal representation of every supported climate sensor.

It acts as the common language shared by all managers.

The object is created during discovery and remains the reference model throughout its lifecycle.

---

# Responsibilities

A `ClimateDevice` is responsible for storing:

- device identifier;
- display name;
- Home Assistant entity identifiers;
- current temperature;
- humidity value;
- battery level;
- availability state;
- communication status;
- metadata required by the synchronization process.

It does **not** contain persistence logic or HomeKit-specific behavior.

---

# Position in the Architecture

```text
Home Assistant

      │

      ▼

Discovery

      │

      ▼

ClimateDeviceBuilder

      │

      ▼

ClimateDevice

      │

      ▼

ClimateDeviceManager

      │

      ▼

CatalogManager
```

The `ClimateDevice` is the core runtime object exchanged between managers.

---

# Lifecycle

A typical lifecycle is:

1. Home Assistant entity discovered.
2. Entity validated.
3. `ClimateDevice` created.
4. Runtime values updated.
5. Catalog synchronized.
6. HomeKit accessory updated.
7. Object refreshed whenever Home Assistant reports changes.

The object exists only while the plugin is running.

Persistent information is stored separately in the catalog.

---

# Typical Information

A `ClimateDevice` generally contains:

- unique identifier;
- entity identifiers;
- device name;
- manufacturer;
- model;
- firmware version;
- temperature;
- humidity;
- battery level;
- availability;
- supported capabilities.

The exact properties depend on the entity discovered.

---

# Relationship with CatalogDevice

Although similar, `ClimateDevice` and `CatalogDevice` have different responsibilities.

| ClimateDevice | CatalogDevice |
|---------------|---------------|
| Runtime model | Persistent model |
| Rebuilt at startup | Stored on disk |
| Represents Home Assistant | Represents plugin state |
| Temporary | Persistent |

This separation keeps runtime processing independent from persistence.

---

# Relationship with ClimateDeviceBuilder

`ClimateDevice` instances are created exclusively by the `ClimateDeviceBuilder`.

```text
Home Assistant Entity

        │

        ▼

ClimateDeviceBuilder

        │

        ▼

ClimateDevice
```

This guarantees consistent object creation.

---

# Relationship with ClimateDeviceManager

The `ClimateDeviceManager` owns the collection of runtime devices.

It is responsible for:

- adding devices;
- updating values;
- removing obsolete devices;
- forwarding changes.

The `ClimateDevice` itself contains no management logic.

---

# Availability

Each runtime device maintains an availability status.

Typical states include:

- available;
- unavailable;
- temporarily disconnected.

Availability changes are propagated through the synchronization pipeline to HomeKit.

---

# Runtime Updates

During execution, the following values may change:

- temperature;
- humidity;
- battery level;
- availability;
- communication timestamp.

The identity of the object remains stable throughout its lifetime.

---

# Error Handling

Invalid or incomplete information is handled before object creation whenever possible.

Typical situations include:

- missing identifiers;
- unsupported entity types;
- malformed attributes;
- unavailable sensors.

The object should always remain internally consistent.

---

# Design Principles

## Immutable Identity

The device identifier never changes.

Only runtime values evolve.

---

## Separation of Concerns

The object stores data.

Managers implement behavior.

---

## Reusability

The same object is shared throughout the synchronization pipeline.

---

## Independence

The object has no knowledge of:

- Homebridge;
- HomeKit;
- persistent storage;
- user interface.

This makes the business model reusable and easy to test.

---

# Related Components

`ClimateDevice` collaborates with:

- Discovery
- ClimateDeviceBuilder
- ClimateDeviceManager
- CatalogManager

Together, these components maintain the runtime representation of every compatible Home Assistant entity.

---

# Related Documentation

- Discovery.md
- ClimateDeviceBuilder.md
- ClimateDeviceManager.md
- CatalogManager.md
- DeviceCatalog.md

`ClimateDevice` is the fundamental business object of the plugin and forms the backbone of the entire synchronization process.