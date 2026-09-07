# Developer Documentation

This section documents the internal architecture, development conventions, technical decisions, and maintenance tooling of **Homebridge HA Virtual Devices**.

The V2 architecture supports two independent data sources:

- **Home Assistant**
- **Matter**

Both sources feed the same persistent device catalog and ultimately publish the same HomeKit accessory model.

The runtime remains source-aware so that the plugin can preserve the origin of discovered devices while sharing the same publication pipeline.

---

## Documentation Structure

### Architecture

The architecture documentation explains the runtime components and their relationships.

- [Architecture overview](architecture/README.md)
- [Platform](architecture/Platform.md)
- [Discovery](architecture/Discovery.md)
- [EventManager](architecture/EventManager.md)
- [ClimateDevice](architecture/ClimateDevice.md)
- [ClimateDeviceBuilder](architecture/ClimateDeviceBuilder.md)
- [ClimateDeviceManager](architecture/ClimateDeviceManager.md)
- [CatalogManager](architecture/CatalogManager.md)
- [DeviceCatalog](architecture/DeviceCatalog.md)
- [DeviceCatalogStore](architecture/DeviceCatalogStore.md)
- [RegistryManager](architecture/RegistryManager.md)
- [AccessoryManager](architecture/AccessoryManager.md)
- [ClimateAccessory](architecture/ClimateAccessory.md)
- [CatalogApi](architecture/CatalogApi.md)
- [Glossary](architecture/Glossary.md)

The Matter implementation currently lives under `src/matter/` and is coordinated by `MatterProvider`.

Detailed Matter documentation is available in the [Matter documentation](Matter/README.md).

Important Matter components include:

- `MatterController`
- `MatterDeviceDiscovery`
- `MatterDeviceMapper`
- `MatterDeviceCatalogMapper`
- `MatterSubscriptionManager`
- `MatterCommissioningStore`
- `MatterDeviceNameStore`

The source-neutral publication contract is defined by `PublishedClimateDevice`.

---

### Developer Toolkit

Operational and release tooling is documented under [toolkit/](toolkit/README.md).

Key topics include:

- local development;
- deployment to a Homebridge test instance;
- diagnostics;
- release preparation;
- publication policy;
- troubleshooting.

---

### Architecture Decision Records (ADR)

Architecture decisions are documented under [adr/](adr/README.md).

ADR files should explain durable design decisions, their context, and the consequences for future maintenance.

---

### Diagrams

Architecture diagrams are stored under [diagrams/](diagrams/README.md).

They are intended to complement the written documentation and should reflect the actual runtime architecture.

---

## V2 Runtime Model

At a high level, the plugin works as follows:

```text
                         Platform
                            │
             ┌──────────────┴──────────────┐
             │                             │
             ▼                             ▼
     Home Assistant path             MatterProvider
             │                             │
             └──────────────┬──────────────┘
                            ▼
                  Source-aware catalog
                            │
                            ▼
              PublishedClimateDevice
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

The exact processing path differs between Home Assistant and Matter, but both converge on the same catalog and HomeKit publication layers.

---

## Source Selection

V2 supports three valid runtime configurations:

- Home Assistant only;
- Matter only;
- Home Assistant and Matter together.

For backward compatibility, configurations created before the source-selection options existed behave as follows:

- Home Assistant enabled by default;
- Matter disabled by default.

The `Platform` decides which source paths are started during `didFinishLaunching()`.

Matter is loaded lazily only when required.

---

## Common Publication Model

`PublishedClimateDevice` is the common contract used by the publication side of the plugin.

It extends the base `Device` model and may contain:

- source;
- temperature;
- humidity;
- battery level;
- availability;
- humidity and battery capability flags;
- manufacturer;
- model;
- serial number;
- unique identifier;
- software version;
- hardware version.

`ClimateDevice` extends `PublishedClimateDevice`, allowing the Home Assistant runtime model to remain compatible with the common publication pipeline.

Matter devices are mapped to the same publication contract by `MatterDeviceMapper`.

---

## Audience

This documentation is intended for:

- contributors;
- maintainers;
- developers investigating the runtime;
- developers adding new device capabilities or data sources;
- developers working on catalog, HomeKit, UI, deployment, or release tooling.

User-facing instructions belong in `docs/user-documentation/`.
