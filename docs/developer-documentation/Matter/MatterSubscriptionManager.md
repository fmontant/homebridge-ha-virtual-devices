# MatterSubscriptionManager

`MatterSubscriptionManager` owns the live Matter measurement observers used after the initial synchronization pass.

It subscribes to temperature, humidity, and battery change events on the Matter endpoints previously identified by discovery and forwards normalized values through callback functions supplied by `MatterProvider`.

---

# Purpose

`MatterSubscriptionManager` is responsible for:

- registering live observers on supported Matter endpoints;
- listening for temperature changes;
- listening for relative-humidity changes;
- listening for battery-percentage changes;
- converting Matter measurement units into plugin units;
- forwarding updates by plugin device ID;
- closing all registered observers when subscriptions are rebuilt or the provider stops.

It does not discover endpoints, read initial values, synchronize the catalog, or update HomeKit accessories directly.

---

# Callback Contract

The subscription manager exposes:

```ts
export interface MatterSubscriptionCallbacks {
  onTemperature?: (
    deviceId: string,
    value: number,
  ) => void;

  onHumidity?: (
    deviceId: string,
    value: number,
  ) => void;

  onBattery?: (
    deviceId: string,
    value: number,
  ) => void;
}
```

All callbacks are optional.

The manager therefore remains independent from `AccessoryManager` and only emits normalized device-level measurements.

---

# Observer Storage

Observers are grouped through:

```ts
private readonly observers =
  new ObserverGroup();
```

from:

```ts
@matter/general
```

This central group is later closed by `stop()`.

---

# Subscribe Entry Point

The public subscription method is:

```ts
subscribe(
  peer: ClientNode,
  descriptor: MatterDeviceDescriptor,
  callbacks: MatterSubscriptionCallbacks,
): void
```

It receives:

- the active Matter peer;
- the descriptor containing selected endpoint IDs;
- the callbacks used to forward normalized updates.

---

# Endpoint Matching

The method iterates over:

```ts
peer.endpoints
```

and compares each endpoint number with:

```ts
descriptor.temperatureEndpointId
descriptor.humidityEndpointId
descriptor.batteryEndpointId
```

Only endpoints previously selected by `MatterDeviceDiscovery` are observed.

---

# Temperature Subscription

When the endpoint number matches:

```ts
descriptor.temperatureEndpointId
```

the manager subscribes to:

```ts
TemperatureMeasurementClient
  .measuredValue$Changed
```

through:

```ts
endpoint
  .eventsOf(
    TemperatureMeasurementClient,
  )
  .measuredValue$Changed
```

If the event value is not numeric, it is ignored.

Otherwise the Matter value is converted with:

```ts
value / 100
```

and forwarded as:

```ts
callbacks.onTemperature?.(
  descriptor.id,
  value / 100,
)
```

---

# Humidity Subscription

When the endpoint number matches:

```ts
descriptor.humidityEndpointId
```

the manager observes:

```ts
RelativeHumidityMeasurementClient
  .measuredValue$Changed
```

Non-numeric values are ignored.

Numeric values are normalized with:

```ts
value / 100
```

and emitted through:

```ts
callbacks.onHumidity?.(
  descriptor.id,
  value / 100,
)
```

---

# Battery Subscription

When the endpoint number matches:

```ts
descriptor.batteryEndpointId
```

the manager observes:

```ts
PowerSourceClient
  .batPercentRemaining$Changed
```

Non-numeric values are ignored.

Numeric values are converted with:

```ts
value / 2
```

and emitted through:

```ts
callbacks.onBattery?.(
  descriptor.id,
  value / 2,
)
```

---

# Unit Conversions

The subscription manager uses the same conversions as `MatterDeviceMapper`:

```text
temperature measuredValue    / 100
humidity measuredValue       / 100
batPercentRemaining          / 2
```

This keeps initial state reads and live updates consistent.

---

# Device Identity

Callbacks use:

```ts
descriptor.id
```

rather than Matter peer IDs or Home Assistant entity IDs.

This means live Matter updates are routed through the plugin's own device identity.

---

# Relationship with MatterProvider

`MatterProvider` supplies callbacks that forward updates to `AccessoryManager`.

For example:

```text
Matter event
    │
    ▼
MatterSubscriptionManager
    │
    ▼
callback(deviceId, value)
    │
    ▼
AccessoryManager
```

The provider currently connects:

```text
onTemperature → updateTemperature()
onHumidity    → updateHumidity()
onBattery     → updateBattery()
```

---

# Relationship with MatterDeviceDiscovery

`MatterDeviceDiscovery` selects the endpoint IDs stored in `MatterDeviceDescriptor`.

`MatterSubscriptionManager` reuses exactly those endpoint IDs when attaching observers.

This keeps endpoint selection centralized in discovery.

---

# Relationship with MatterDeviceMapper

`MatterDeviceMapper` reads the initial state during synchronization.

`MatterSubscriptionManager` observes subsequent changes.

They deliberately mirror one another:

```text
initial read                 live update

TemperatureMeasurementClient  TemperatureMeasurementClient
RelativeHumidity...           RelativeHumidity...
PowerSourceClient             PowerSourceClient
```

They also apply the same unit conversions.

---

# Subscription Lifecycle

Before each full Matter synchronization, `MatterProvider` calls:

```ts
subscriptions.stop()
```

It then recreates subscriptions for the currently discovered peers.

The same `stop()` method is also called when `MatterProvider` shuts down.

---

# Stopping Subscriptions

`stop()` performs:

```ts
this.observers.close();
```

This closes the shared `ObserverGroup`.

No peer-specific loop is required in this class.

---

# Error and Filtering Behavior

Each event handler explicitly verifies:

```ts
typeof value === 'number'
```

before emitting a callback.

Unsupported or absent callbacks are harmless because optional chaining is used:

```ts
callbacks.onTemperature?.(...)
callbacks.onHumidity?.(...)
callbacks.onBattery?.(...)
```

---

# Responsibilities

`MatterSubscriptionManager` is responsible for:

- registering Matter event observers;
- endpoint matching;
- live measurement normalization;
- callback dispatch;
- observer-group shutdown.

It is **not** responsible for:

- Matter commissioning;
- controller lifecycle;
- discovery;
- initial state reads;
- catalog persistence;
- runtime publication memory;
- HomeKit updates.

---

# Design Principles

## Initial State and Live State Stay Separate

Initial values are read by `MatterDeviceMapper`.

Future changes are observed here.

---

## Common Device-Level Callbacks

The class emits only:

```text
deviceId + normalized value
```

This prevents Matter behavior classes from leaking into the shared publication layer.

---

## Shared Conversion Rules

Live values use the same normalization rules as the initial mapper.

---

## Centralized Observer Cleanup

All subscriptions are owned by one `ObserverGroup`, allowing the provider to rebuild or stop the complete Matter subscription set in one operation.

---

# Related Components

- `MatterProvider`
- `MatterDeviceDiscovery`
- `MatterDeviceMapper`
- `MatterDeviceDescriptor`
- `AccessoryManager`

---

# Related Documentation

- [MatterProvider](MatterProvider.md)
- [MatterDeviceDiscovery](MatterDeviceDiscovery.md)
- [MatterDeviceMapper](MatterDeviceMapper.md)
- [AccessoryManager](../architecture/AccessoryManager.md)

`MatterSubscriptionManager` is the live-update boundary of the V2 Matter path: it observes supported Matter measurements, normalizes them, and forwards source-independent device updates to the provider.
