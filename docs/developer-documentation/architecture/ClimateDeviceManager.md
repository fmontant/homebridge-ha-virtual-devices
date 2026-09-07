# ClimateDeviceManager

The `ClimateDeviceManager` class enriches Home Assistant `ClimateDevice` objects with current runtime state before they enter the downstream synchronization and publication pipeline.

It belongs exclusively to the Home Assistant path.

Its responsibilities are deliberately narrow: cache the initial Home Assistant states, resolve friendly names, convert raw string values to numbers, and determine availability.

---

# Purpose

`ClimateDeviceManager` bridges two Home Assistant data layers:

- normalized device structure produced by `ClimateDeviceBuilder`;
- current entity states returned by Home Assistant.

It does not discover devices itself and does not manage HomeKit accessories.

Instead, it takes a partially prepared `ClimateDevice` and returns a runtime-ready `ClimateDevice` containing current measurements and availability.

---

# Public API

The class exposes two public methods:

```ts
public loadInitialStates(
  states: HomeAssistantState[],
): void
```

and:

```ts
public prepareClimateDevice(
  device: ClimateDevice,
): ClimateDevice
```

The class also contains two private helpers:

```ts
private isEntityAvailable(
  entityId: string,
): boolean
```

```ts
private readNumericState(
  entityId: string,
): number | undefined
```

---

# HomeAssistantState

The manager defines a small local interface for the Home Assistant state payload it needs:

```ts
export interface HomeAssistantState {
  entity_id: string;
  state: string;
  attributes?: {
    friendly_name?: unknown;
  };
}
```

Only three pieces of Home Assistant information are required here:

- entity identifier;
- raw state value;
- optional `friendly_name`.

This keeps the manager independent from larger Home Assistant response structures.

---

# Internal State

The manager maintains two maps.

## Initial state map

```ts
private readonly initialStates:
  Map<string, string> =
    new Map();
```

This stores:

```text
entity_id → raw state
```

It is used to read:

- temperature;
- humidity;
- battery level;
- availability.

## Friendly-name map

```ts
private readonly friendlyNames:
  Map<string, string> =
    new Map();
```

This stores:

```text
entity_id → trimmed friendly_name
```

Only non-empty string values are retained.

---

# Loading Initial States

`loadInitialStates()` completely refreshes both internal maps.

The method first clears previous data:

```ts
this.initialStates.clear();
this.friendlyNames.clear();
```

It then iterates through all received Home Assistant states.

For every entity:

```ts
this.initialStates.set(
  state.entity_id,
  state.state,
);
```

If `attributes.friendly_name` is a non-empty string, it is trimmed and cached.

Finally, the manager logs the number of loaded states:

```text
<n> états initiaux chargés
```

This means each call represents a fresh snapshot rather than an incremental merge.

---

# Preparing a ClimateDevice

`prepareClimateDevice()` takes a `ClimateDevice` already built from Home Assistant registry information and returns a new normalized object.

The method performs four main operations:

1. resolve the display name;
2. read current numeric values;
3. determine availability;
4. preserve device metadata.

---

# Display Name Resolution

The temperature entity's Home Assistant friendly name has priority over the existing device name.

The resolution order is:

```text
temperature entity friendly_name
              │
              ▼
        device.name
```

The selected name is then passed through:

```ts
DisplayNameFormatter.format(
  resolvedName,
)
```

This means the final runtime name is normalized consistently before downstream use.

---

# Temperature

Temperature is mandatory in the `ClimateDevice` structure passed to this manager because `temperatureEntity` is required.

Its current value is read with:

```ts
this.readNumericState(
  device.temperatureEntity,
)
```

The result is:

```ts
number | undefined
```

---

# Humidity

Humidity is optional.

If `device.humidityEntity` exists, the manager reads its current numeric value:

```ts
device.humidityEntity
  ? this.readNumericState(
      device.humidityEntity,
    )
  : undefined
```

If no humidity entity exists, the runtime humidity value remains `undefined`.

---

# Battery Level

Battery level follows the same pattern.

If `device.batteryEntity` exists:

```ts
this.readNumericState(
  device.batteryEntity,
)
```

Otherwise:

```ts
undefined
```

---

# Availability

Availability is determined exclusively from the temperature entity.

The helper:

```ts
private isEntityAvailable(
  entityId: string,
): boolean
```

returns `false` when the Home Assistant state is:

- missing;
- `unavailable`;
- `unknown`.

It returns `true` for any other defined state.

Conceptually:

```text
temperature state
      │
      ├── undefined ─────► unavailable
      ├── unavailable ───► unavailable
      ├── unknown ───────► unavailable
      └── other value ───► available
```

The resulting boolean is assigned to:

```ts
available
```

which is part of the common `PublishedClimateDevice` contract inherited by `ClimateDevice`.

---

# Numeric Conversion

Raw Home Assistant states are strings.

`readNumericState()` converts them with:

```ts
Number(rawValue)
```

The converted value is returned only if:

```ts
Number.isFinite(value)
```

Otherwise the method returns:

```ts
undefined
```

This prevents non-numeric Home Assistant values from entering the runtime climate model as invalid numbers.

---

# Metadata Preservation

`prepareClimateDevice()` preserves the metadata already attached by `ClimateDeviceBuilder`:

- manufacturer;
- model;
- software version;
- hardware version;
- serial number.

It also preserves the Home Assistant entity references:

- temperature entity;
- humidity entity;
- battery entity.

---

# Important V2 Note

The current implementation reconstructs a new `ClimateDevice` object explicitly.

It does not spread the input object.

Therefore only properties copied inside `prepareClimateDevice()` are preserved in the returned object.

This is relevant in V2 because `ClimateDevice` extends `PublishedClimateDevice`.

When new common properties are added to `PublishedClimateDevice`, this method should be reviewed to determine whether those properties also need to be copied into the prepared Home Assistant runtime object.

---

# Position in the V2 Architecture

```text
Home Assistant registry
        │
        ▼
ClimateDeviceBuilder
        │
        ▼
ClimateDevice
        │
        │ + initial Home Assistant states
        ▼
ClimateDeviceManager
        │
        ▼
Prepared ClimateDevice
        │
        │ extends
        ▼
PublishedClimateDevice
        │
        ▼
Shared catalog / publication infrastructure
```

`ClimateDeviceManager` remains entirely Home Assistant-specific.

Matter does not use this manager.

Matter obtains its runtime values through the Matter mapping and subscription path and produces `PublishedClimateDevice` data independently.

---

# Relationship with ClimateDeviceBuilder

`ClimateDeviceBuilder` determines the Home Assistant device structure:

- identity;
- entity references;
- device metadata;
- detected capabilities.

`ClimateDeviceManager` then adds runtime state:

- current temperature;
- current humidity;
- current battery level;
- current availability;
- normalized display name.

The two components therefore have complementary responsibilities.

---

# Relationship with PublishedClimateDevice

Because `ClimateDevice` extends `PublishedClimateDevice`, the values prepared here can be consumed by source-neutral publication components.

In particular, this manager prepares common fields such as:

- `name`;
- `temperature`;
- `humidity`;
- `batteryLevel`;
- `available`;
- manufacturer and model metadata.

The manager itself has no knowledge of HomeKit services or characteristics.

---

# Relationship with Runtime Events

This class loads and prepares a snapshot of Home Assistant state.

Ongoing Home Assistant changes are handled elsewhere in the runtime event path.

Therefore this manager should not be described as the component that owns all live updates for the lifetime of the plugin.

Its primary role is initial state normalization and preparation.

---

# Responsibilities

`ClimateDeviceManager` is responsible for:

- loading an initial Home Assistant state snapshot;
- caching raw entity states;
- caching valid friendly names;
- resolving the preferred display name;
- formatting display names;
- reading numeric temperature values;
- reading numeric humidity values;
- reading numeric battery values;
- deriving initial availability from the temperature entity;
- preserving selected device metadata.

It is **not** responsible for:

- entity discovery;
- grouping entities into devices;
- persistent catalog storage;
- Matter state handling;
- HomeKit accessory creation;
- direct WebSocket event subscription.

---

# Design Principles

## Snapshot-Based Preparation

The manager works from an explicit Home Assistant state snapshot loaded before device preparation.

---

## Strict Numeric Normalization

Only finite numeric values are retained.

Invalid raw states become `undefined`.

---

## Explicit Availability

Home Assistant's `unknown` and `unavailable` states are translated into the common boolean availability model.

---

## Source Isolation

All Home Assistant-specific state parsing remains outside the shared Matter/HomeKit publication layer.

---

## Separation of Structure and State

`ClimateDeviceBuilder` builds device structure.

`ClimateDeviceManager` enriches that structure with current runtime state.

This separation keeps both components small and testable.

---

# Extending the Manager

When adding a new field to `ClimateDevice` or `PublishedClimateDevice`, review `prepareClimateDevice()` carefully.

Because the returned object is constructed property by property, newly introduced fields are not preserved automatically.

A new field should be copied here only when this manager is the correct Home Assistant source for that information.

---

# Related Components

- `ClimateDevice`
- `PublishedClimateDevice`
- `ClimateDeviceBuilder`
- `DiscoveryManager`
- `EventManager`
- `DisplayNameFormatter`
- Home Assistant state retrieval

---

# Related Documentation

- [Architecture overview](README.md)
- [Platform](Platform.md)
- [ClimateDevice](ClimateDevice.md)
- [ClimateDeviceBuilder](ClimateDeviceBuilder.md)
- [Discovery](Discovery.md)
- [EventManager](EventManager.md)

`ClimateDeviceManager` prepares Home Assistant climate devices for the shared V2 publication pipeline by translating raw Home Assistant state into normalized runtime values and availability.
