# EventManager

The `EventManager` class handles real-time Home Assistant state-change events and forwards relevant updates to `AccessoryManager`.

It belongs exclusively to the Home Assistant runtime path.

Its role is deliberately narrow: extract an entity state from an incoming event, translate Home Assistant availability semantics, validate numeric measurements, and forward accepted changes to the already published accessory infrastructure.

---

# Purpose

After initial discovery and state preparation, Home Assistant can report changes while the plugin is running.

`EventManager` processes those events so that compatible HomeKit accessories can reflect new sensor values and availability without rebuilding the discovery model.

The manager does not maintain its own device collection.

---

# Public API

The class exposes one public method:

```ts
public handleEvent(
  event: unknown,
): void
```

The input is deliberately typed as `unknown`.

The manager locally interprets the subset of the Home Assistant event structure that it needs.

---

# Event Shape

The expected event shape is represented internally by:

```ts
interface HomeAssistantStateChangedEvent {
  event?: {
    data?: {
      entity_id?: string;
      new_state?: {
        state?: string;
      } | null;
    };
  };
}
```

Only two values are consumed:

- `entity_id`;
- `new_state.state`.

The manager does not depend on the complete Home Assistant event payload.

---

# Dependencies

`EventManager` receives:

```ts
AccessoryManager
```

and:

```ts
Logging
```

through its constructor.

`AccessoryManager` is the downstream update boundary.

The logger is used only for debug information.

---

# Event Processing Flow

The complete flow is:

```text
Home Assistant state_changed event
              │
              ▼
         EventManager
              │
              ▼
 Extract entity_id + raw state
              │
       ┌──────┴──────┐
       │             │
 unavailable /     other
   unknown            │
       │              ▼
       │       numeric conversion
       │              │
       │        ┌─────┴─────┐
       │        │           │
       │     invalid      finite
       │        │           │
       ▼        ▼           ▼
 availability  ignored   available=true
    false                   │
                            ▼
                     updateEntity()
                            │
                            ▼
                     AccessoryManager
```

---

# Missing Event Data

The manager first extracts:

```ts
const entityId =
  message.event?.data?.entity_id;

const rawState =
  message.event?.data?.new_state?.state;
```

If either the entity identifier is missing or the new state is undefined:

```ts
if (
  !entityId ||
  rawState === undefined
) {
  return;
}
```

the event is silently ignored.

This also naturally ignores events whose `new_state` is `null`.

---

# Unavailable and Unknown States

Home Assistant states:

```text
unavailable
unknown
```

are treated as unavailable.

The manager calls:

```ts
this.accessoryManager
  .updateAvailability(
    entityId,
    false,
  );
```

If `AccessoryManager` reports that no relevant accessory was updated, processing stops.

When an update occurs, the manager logs:

```text
Entité indisponible : <entityId>
```

No numeric update is attempted for these states.

---

# Numeric State Validation

For any other state, the manager converts the raw string with:

```ts
const value =
  Number(rawState);
```

It then requires:

```ts
Number.isFinite(value)
```

If conversion does not produce a finite number, the event is ignored and a debug message is emitted:

```text
État ignoré pour <entityId> : <rawState>
```

This prevents non-numeric Home Assistant states from reaching climate accessory updates.

---

# Restoring Availability

For a valid finite numeric state, the manager first marks the corresponding entity as available:

```ts
this.accessoryManager
  .updateAvailability(
    entityId,
    true,
  );
```

This happens before the measurement itself is forwarded.

Therefore a sensor that previously reported `unknown` or `unavailable` can return to the available state when it produces a valid numeric value.

---

# Updating the Measurement

After restoring availability, the manager forwards the numeric value:

```ts
const updated =
  this.accessoryManager
    .updateEntity(
      entityId,
      value,
    );
```

If no matching entity is managed by `AccessoryManager`, processing stops without a success log.

When an update is accepted, the manager logs:

```text
Mise à jour temps réel : <entityId> = <value>
```

---

# Position in the V2 Architecture

```text
Home Assistant WebSocket events
             │
             ▼
        EventManager
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

This is the Home Assistant real-time update path.

It is distinct from the initial discovery and preparation path:

```text
Home Assistant registries
          │
          ▼
DiscoveryManager
          │
          ▼
ClimateDeviceBuilder
          │
          ▼
ClimateDeviceManager
```

---

# Relationship with AccessoryManager

`EventManager` does not determine whether an entity represents temperature, humidity, or battery.

It delegates entity resolution to `AccessoryManager`.

Two methods are used:

```ts
updateAvailability(
  entityId,
  available,
)
```

and:

```ts
updateEntity(
  entityId,
  value,
)
```

This keeps the Home Assistant event parser independent from HomeKit characteristic implementation.

---

# Relationship with Matter

Matter does **not** use `EventManager`.

Matter real-time updates are handled by the Matter subscription path, including `MatterSubscriptionManager`, whose callbacks update `AccessoryManager`.

Conceptually:

```text
Home Assistant                    Matter
      │                              │
      ▼                              ▼
 EventManager             MatterSubscriptionManager
      │                              │
      └──────────────┬───────────────┘
                     ▼
              AccessoryManager
                     │
                     ▼
              ClimateAccessory
```

The source-specific event mechanisms remain separate while sharing the downstream accessory update infrastructure.

---

# Relationship with ClimateDeviceManager

`ClimateDeviceManager` prepares the initial Home Assistant snapshot.

`EventManager` handles subsequent Home Assistant state changes.

The responsibilities are complementary:

| Component | Role |
| --- | --- |
| `ClimateDeviceManager` | Initial Home Assistant state normalization |
| `EventManager` | Real-time Home Assistant state-change forwarding |

`EventManager` does not rebuild `ClimateDevice` objects for every update.

---

# Availability Semantics

The Home Assistant event path translates source-specific string states into the plugin's boolean availability behavior.

```text
unavailable → false
unknown     → false
finite value → true
```

A non-numeric state other than `unavailable` or `unknown` is ignored rather than explicitly changing availability.

This distinction follows the current implementation.

---

# Logging

The manager currently emits debug messages for three situations.

Unavailable entity:

```text
Entité indisponible : <entityId>
```

Ignored non-numeric state:

```text
État ignoré pour <entityId> : <rawState>
```

Successful real-time update:

```text
Mise à jour temps réel : <entityId> = <value>
```

Events with missing required data are silently ignored.

---

# Responsibilities

`EventManager` is responsible for:

- receiving an unknown Home Assistant event payload;
- extracting the entity identifier;
- extracting the new raw state;
- ignoring incomplete events;
- translating `unknown` and `unavailable` to unavailable;
- validating numeric states;
- restoring availability when a finite numeric state arrives;
- forwarding numeric values to `AccessoryManager`;
- logging relevant real-time processing results.

It is **not** responsible for:

- establishing the Home Assistant WebSocket connection;
- subscribing to events;
- discovering devices;
- building `ClimateDevice` objects;
- loading the initial state snapshot;
- catalog persistence;
- Matter subscriptions;
- implementing HomeKit characteristics.

---

# Design Principles

## Small Event Adapter

The class translates one source-specific event format into generic accessory-manager update calls.

---

## Source Isolation

Home Assistant event structure and state strings remain confined to the Home Assistant path.

---

## Defensive Parsing

The incoming event is `unknown`, and all required nested fields are optional in the local event interface.

Incomplete events are ignored safely.

---

## Numeric Validation

Only finite numeric measurements are forwarded.

---

## Shared Downstream Updates

The manager does not directly manipulate HomeKit.

It delegates runtime updates to `AccessoryManager`, which can also receive updates originating from Matter.

---

# Extending Event Handling

When adding support for another Home Assistant event value, determine whether the change belongs here or downstream.

Changes belong in `EventManager` when they concern:

- Home Assistant event payload interpretation;
- Home Assistant state semantics;
- conversion from Home Assistant values.

Changes belong in `AccessoryManager` or `ClimateAccessory` when they concern:

- entity-to-accessory routing;
- shared runtime update behavior;
- HomeKit characteristic behavior.

Matter event handling should remain in the Matter subscription path.

---

# Related Components

- `AccessoryManager`
- `ClimateAccessory`
- `ClimateDeviceManager`
- `DiscoveryManager`
- Home Assistant WebSocket client
- `MatterSubscriptionManager`

---

# Related Documentation

- [Architecture overview](README.md)
- [Platform](Platform.md)
- [Discovery](Discovery.md)
- [ClimateDevice](ClimateDevice.md)
- [ClimateDeviceManager](ClimateDeviceManager.md)
- [AccessoryManager](AccessoryManager.md)
- [ClimateAccessory](ClimateAccessory.md)

`EventManager` is the Home Assistant real-time event adapter: it translates Home Assistant state changes into availability and numeric updates understood by the shared accessory infrastructure.
