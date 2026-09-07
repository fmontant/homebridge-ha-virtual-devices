# Architecture Decision Records (ADR)

This directory contains the Architecture Decision Records for **Homebridge HA Virtual Devices V2**.

The ADRs document the significant architectural decisions that shape the plugin. They complement the detailed component documentation in [`../architecture/`](../architecture/README.md), the Matter-specific documentation in [`../Matter/`](../Matter/README.md), and the diagrams in [`../diagrams/`](../diagrams/README.md).

## Purpose

An ADR records a decision that affects the architecture beyond one isolated implementation detail.

Each record describes:

- the context that required a decision;
- the selected architectural approach;
- the rationale and boundaries of that approach;
- its consequences and trade-offs;
- alternatives that were considered;
- the main implementation components affected by the decision.

The ADRs describe the **current V2 architecture**. Historical V1 constraints are retained only where they explain why the V2 design evolved.

## V2 Architectural Context

V2 moves the plugin from a Home Assistant-only architecture to a multi-provider model:

```text
Home Assistant ─┐
                ├──► shared DeviceCatalog
Matter ─────────┘
```

Both providers converge on a common publication layer:

```text
provider-specific discovery
          │
          ▼
normalized runtime / catalog models
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
HomeKit Thermostat
```

The ADR set captures the decisions that make this coexistence possible while preserving the persistent catalog and the existing HomeKit presentation.

## ADR Index

| ADR | Decision | Status |
|---|---|---|
| [ADR-0001](ADR-0001-homekit-thermostat.md) | Use a HomeKit Thermostat Service for Climate Sensors | Accepted |
| [ADR-0002](ADR-0002-persistent-catalog.md) | Use a Persistent, Source-Aware Device Catalog | Accepted |
| [ADR-0003](ADR-0003-registry-manager.md) | Centralize Registry Synchronization in RegistryManager | Accepted |
| [ADR-0004](ADR-0004-device-model.md) | Introduce a Source-Neutral PublishedClimateDevice Model | Accepted |
| [ADR-0005](ADR-0005-catalog-api.md) | Expose Catalog Operations through a Dedicated Catalog API | Accepted |
| [ADR-0006](ADR-0006-ui-synchronization.md) | Synchronize UI Catalog Changes through Persistent File Observation | Accepted |

## Decision Map

The six ADRs cover complementary layers of the architecture.

### HomeKit representation

[ADR-0001](ADR-0001-homekit-thermostat.md) defines the common Apple Home representation.

```text
Published climate device
        │
        ▼
ClimateAccessory
        │
        ▼
Thermostat service
```

Temperature is the primary climate measurement, while supported humidity and battery information are integrated into the same representation.

### Persistent lifecycle

[ADR-0002](ADR-0002-persistent-catalog.md) establishes the shared persistent and source-aware device catalog.

```text
Home Assistant ─┐
                ├──► DeviceCatalog ──► DeviceCatalogStore
Matter ─────────┘
```

The catalog preserves lifecycle state and user preferences across restart and rediscovery.

### Runtime coordination

[ADR-0003](ADR-0003-registry-manager.md) defines `RegistryManager` as the synchronization and publication-refresh coordinator.

It bridges provider-derived runtime devices, persistent catalog state, and `AccessoryManager`.

### Provider-neutral device model

[ADR-0004](ADR-0004-device-model.md) introduces `PublishedClimateDevice` as the common runtime publication contract.

Home Assistant keeps its specialized `ClimateDevice`, which extends that contract with entity identifiers. Matter maps its descriptor and state model into the common interface.

### UI catalog boundary

[ADR-0005](ADR-0005-catalog-api.md) defines `CatalogApi` as the controlled interface between the custom UI and the catalog domain.

The UI does not manipulate `DeviceCatalog` or its persistence layer directly.

### UI/runtime synchronization

[ADR-0006](ADR-0006-ui-synchronization.md) defines persistent file observation as the handoff between UI-side catalog changes and the running Homebridge platform.

The same storage boundary is also used for Matter commissioning requests.

## Relationship between the Decisions

The decisions form one continuous architecture:

```text
Provider
   │
   ▼
PublishedClimateDevice / discovered catalog data
   │
   ├──────────────► DeviceCatalog
   │                    │
   │                    ▼
   │             DeviceCatalogStore
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
HomeKit Thermostat
```

The custom UI accesses persistent device state through:

```text
UI
 │
 ▼
CatalogApi
 │
 ▼
CatalogManager
 │
 ▼
DeviceCatalog
```

and saved catalog changes are reconciled by the running platform through the mechanism described in ADR-0006.

## Reading Order

For a first architectural review, read the ADRs in numerical order.

That sequence follows the evolution from the user-visible HomeKit representation to persistence, synchronization, provider abstraction, UI access, and finally UI/runtime reconciliation.

For Matter implementation details, continue with:

- [`../Matter/README.md`](../Matter/README.md)

For component-level implementation details, continue with:

- [`../architecture/README.md`](../architecture/README.md)

For visual representations, see:

- [`../diagrams/README.md`](../diagrams/README.md)

## Maintaining the ADR Set

A new ADR should be added when a change introduces or replaces a significant architectural rule.

Examples include:

- adding a new provider model;
- replacing the persistent catalog strategy;
- changing the common HomeKit publication model;
- introducing a new cross-process synchronization mechanism;
- replacing a major orchestration boundary.

Routine refactoring or implementation changes that do not alter an architectural decision do not require a new ADR.

If a decision is replaced, its existing ADR should remain as historical documentation and its status should be changed rather than silently rewriting the old decision as if it never existed.
