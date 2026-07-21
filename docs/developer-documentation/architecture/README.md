# Architecture

This section documents the internal architecture of **Homebridge HA Virtual Devices**.

Each document focuses on a specific component of the plugin and explains its responsibilities, interactions, and role within the overall system.

## Components

| Component | Description |
|-----------|-------------|
| [Platform](Platform.md) | Homebridge platform entry point |
| [Discovery](Discovery.md) | Home Assistant entity discovery |
| [EventManager](EventManager.md) | Home Assistant event subscription and dispatch |
| [ClimateDevice](ClimateDevice.md) | Device model |
| [ClimateDeviceBuilder](ClimateDeviceBuilder.md) | Builds ClimateDevice instances |
| [ClimateDeviceManager](ClimateDeviceManager.md) | Device lifecycle management |
| [CatalogManager](CatalogManager.md) | Persistent catalog management |
| [DeviceCatalog](DeviceCatalog.md) | Catalog model |
| [DeviceCatalogStore](DeviceCatalogStore.md) | Catalog persistence |
| [RegistryManager](RegistryManager.md) | HomeKit accessory registry |
| [AccessoryManager](AccessoryManager.md) | Accessory lifecycle |
| [ClimateAccessory](ClimateAccessory.md) | HomeKit thermostat implementation |
| [CatalogApi](CatalogApi.md) | UI API |
| [Glossary](Glossary.md) | Terms and definitions |

## Reading Order

For newcomers, the recommended reading order is:

1. Platform
2. Discovery
3. EventManager
4. ClimateDevice
5. ClimateDeviceManager
6. CatalogManager
7. RegistryManager
8. AccessoryManager
9. ClimateAccessory
10. CatalogApi

