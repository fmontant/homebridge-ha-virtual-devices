# Architecture Diagrams

This directory contains Mermaid source diagrams for the **Homebridge HA Virtual Devices V2** architecture.

The diagrams complement the detailed documentation in:

- [`../architecture/`](../architecture/README.md)
- [`../Matter/`](../Matter/README.md)
- [`../adr/`](../adr/README.md)

They describe the current multi-provider architecture in which **Home Assistant** and **Matter** feed a shared persistent catalog and a common HomeKit publication layer.

## Diagram Index

| Diagram | Purpose |
|---|---|
| [`architecture.mmd`](architecture.mmd) | Global V2 architecture: providers, shared catalog, runtime coordination, UI, and HomeKit publication |
| [`pipeline.mmd`](pipeline.mmd) | Home Assistant and Matter pipelines converging on the common V2 publication path |
| [`catalog-flow.mmd`](catalog-flow.mmd) | Source-aware discovery and synchronization into the shared persistent device catalog |
| [`class-diagram.mmd`](class-diagram.mmd) | Main runtime models and relationships between Matter, catalog, registry, and accessory components |
| [`homekit-publication.mmd`](homekit-publication.mmd) | Transformation of a published climate device into the HomeKit Thermostat representation |
| [`sequence-sync.mmd`](sequence-sync.mmd) | Synchronization sequence from provider discovery through catalog persistence and HomeKit reconciliation |

## Architectural Reading Order

For a first reading, the recommended order is:

1. [`architecture.mmd`](architecture.mmd)
2. [`pipeline.mmd`](pipeline.mmd)
3. [`catalog-flow.mmd`](catalog-flow.mmd)
4. [`homekit-publication.mmd`](homekit-publication.mmd)
5. [`sequence-sync.mmd`](sequence-sync.mmd)
6. [`class-diagram.mmd`](class-diagram.mmd)

## V2 Principles Shown by the Diagrams

The diagrams are built around the following architectural rules:

```text
Home Assistant ─┐
                ├──► shared DeviceCatalog
Matter ─────────┘
```

The catalog synchronization is source-aware:

```text
home-assistant
matter
```

A provider can mark missing only devices belonging to its own source.

The common publication boundary is based on:

```text
PublishedClimateDevice
```

Home Assistant retains its specialized:

```text
ClimateDevice
```

which extends the common model with Home Assistant entity identifiers.

Matter uses its own descriptor and state types before mapping into the same publication contract.

Both provider paths ultimately converge on:

```text
RegistryManager
      │
      ▼
AccessoryManager
      │
      ▼
ClimateAccessory
      │
      ▼
HomeKit Thermostat
      │
      ▼
Apple Home
```

## Mermaid Sources

The `.mmd` files contain Mermaid source code and are intentionally kept as text files in the repository.

They can be rendered by any Mermaid-compatible viewer or documentation environment.

The diagrams should be updated whenever an architectural change makes one of their flows materially inaccurate.

## Related Decisions

The architectural choices represented here are documented in the ADRs:

- [`ADR-0001`](../adr/ADR-0001-homekit-thermostat.md): HomeKit Thermostat service
- [`ADR-0002`](../adr/ADR-0002-persistent-catalog.md): persistent, source-aware device catalog
- [`ADR-0003`](../adr/ADR-0003-registry-manager.md): RegistryManager synchronization boundary
- [`ADR-0004`](../adr/ADR-0004-device-model.md): source-neutral `PublishedClimateDevice`
- [`ADR-0005`](../adr/ADR-0005-catalog-api.md): dedicated Catalog API
- [`ADR-0006`](../adr/ADR-0006-ui-synchronization.md): UI/runtime synchronization through persistent file observation
