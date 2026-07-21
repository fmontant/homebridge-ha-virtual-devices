# Platform

The `Platform` class is the entry point of the Homebridge HA Virtual Devices plugin.

It is instantiated by Homebridge during startup and is responsible for initializing every subsystem required by the plugin.

No accessory can exist without the Platform.

---

# Purpose

The Platform coordinates the complete lifecycle of the plugin.

Its responsibilities include:

- loading the configuration;
- initializing internal managers;
- establishing the connection with Home Assistant;
- restoring cached accessories;
- starting the discovery process;
- synchronizing the persistent catalog;
- publishing HomeKit accessories.

The Platform acts as the orchestrator of the application.

---

# Responsibilities

The Platform is responsible for:

- validating the Homebridge configuration;
- initializing the logging system;
- creating service managers;
- registering Homebridge callbacks;
- restoring cached accessories;
- starting discovery;
- coordinating synchronization;
- monitoring the plugin lifecycle.

The Platform does **not** implement business logic.

Business logic is delegated to specialized managers.

---

# Lifecycle

The lifecycle follows the Homebridge platform model.

```text
Homebridge

      │

      ▼

Platform created

      │

      ▼

Configuration loaded

      │

      ▼

Managers initialized

      │

      ▼

Cached accessories restored

      │

      ▼

Discovery started

      │

      ▼

Catalog synchronized

      │

      ▼

Accessories published

      │

      ▼

Runtime event processing
```

---

# Dependencies

The Platform depends on several internal components.

Typical dependencies include:

- ConfigManager
- Discovery
- EventManager
- ClimateDeviceManager
- CatalogManager
- RegistryManager
- AccessoryManager

These dependencies are initialized during startup.

---

# Internal Workflow

The Platform coordinates the following sequence.

1. Read Homebridge configuration.
2. Validate plugin options.
3. Initialize managers.
4. Restore cached accessories.
5. Connect to Home Assistant.
6. Discover compatible entities.
7. Build internal device models.
8. Synchronize the persistent catalog.
9. Publish accessories.
10. Listen for future events.

---

# Public Interface

The Platform primarily exposes lifecycle methods required by Homebridge.

Typical responsibilities include:

- initialization;
- accessory configuration;
- shutdown handling.

The exact implementation follows the Homebridge Dynamic Platform API.

---

# Error Handling

The Platform centralizes startup error management.

Examples include:

- invalid configuration;
- unavailable Home Assistant instance;
- persistent storage errors;
- initialization failures.

Whenever possible, initialization continues for independent components so that a single failure does not prevent the plugin from operating.

---

# Logging

The Platform coordinates logging during startup.

Typical messages include:

- plugin initialization;
- configuration summary;
- discovery progress;
- accessory restoration;
- synchronization results;
- runtime warnings;
- critical errors.

Consistent logging simplifies troubleshooting.

---

# Collaboration with Other Components

The Platform delegates work to specialized managers.

```text
Platform

│

├── ConfigManager

├── Discovery

├── EventManager

├── ClimateDeviceManager

├── CatalogManager

├── RegistryManager

└── AccessoryManager
```

This separation of responsibilities keeps the architecture modular and maintainable.

---

# Design Principles

The Platform follows several architectural principles.

## Single Responsibility

The Platform coordinates the application but does not contain business logic.

---

## Dependency Coordination

Managers are initialized in a controlled order to guarantee a consistent startup sequence.

---

## Extensibility

New managers can be introduced without significantly modifying the Platform, provided they follow the existing initialization pattern.

---

## Maintainability

Centralizing initialization reduces coupling between components and simplifies future evolution.

---

# Related Components

- Discovery
- EventManager
- ClimateDeviceManager
- CatalogManager
- RegistryManager
- AccessoryManager

These components collectively implement the operational behavior of the plugin.

---

# Related Documentation

- Discovery.md
- EventManager.md
- ClimateDeviceManager.md
- CatalogManager.md
- RegistryManager.md
- AccessoryManager.md

The Platform should be considered the architectural root of the plugin and serves as the starting point for understanding the entire application lifecycle.
