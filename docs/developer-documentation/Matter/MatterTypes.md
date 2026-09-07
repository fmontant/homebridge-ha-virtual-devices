# Matter Types

`types.ts` defines the two internal data contracts shared by the Matter discovery, mapping, subscription, and provider layers:

- `MatterDeviceDescriptor`
- `MatterDeviceState`

Together they separate the relatively stable structure and metadata of a Matter device from its current normalized sensor values.

The Matter architecture described here belongs to the V2 development work. It does not describe the stable 1.3.7 release.

---

# MatterDeviceDescriptor

```ts
export interface MatterDeviceDescriptor {
  id: string;
  peerId: string;
  name: string;
  nodeId: string;
  vendorName?: string;
  productName?: string;
  serialNumber?: string;
  uniqueId?: string;
  softwareVersion?: string;
  hardwareVersion?: string;
  temperatureEndpointId?: number;
  humidityEndpointId?: number;
  batteryEndpointId?: number;
}
```

The descriptor is produced by `MatterDeviceDiscovery`.

It contains device identity, Matter metadata, and the endpoint numbers selected for supported measurements.

## Identity

```text
id      plugin Matter device ID
peerId  identifier used to retrieve the active Matter peer
nodeId  Matter node identifier represented as a string
name    discovered device name
```

The current discovery implementation builds `id` as:

```text
matter:<nodeId>
```

The three identifiers have different roles:

- `id` is the plugin-level device identity;
- `peerId` identifies the active Matter peer;
- `nodeId` identifies the Matter node.

They should not be treated as interchangeable values.

## Metadata

The optional metadata fields are:

```text
vendorName
productName
serialNumber
uniqueId
softwareVersion
hardwareVersion
```

They originate from Matter Basic Information.

## Measurement Endpoints

The optional endpoint fields are:

```text
temperatureEndpointId
humidityEndpointId
batteryEndpointId
```

Their presence indicates that discovery found the corresponding supported Matter cluster.

These endpoint IDs are reused by both `MatterDeviceMapper` and `MatterSubscriptionManager`.

---

# MatterDeviceState

```ts
export interface MatterDeviceState {
  temperature?: number;
  humidity?: number;
  batteryLevel?: number;
  available: boolean;
}
```

`MatterDeviceState` represents the normalized current measurements read from a Matter peer.

The three measurements are optional because a device may not expose every capability or a usable value may not be available during a read.

`available` is mandatory.

In the current `MatterDeviceMapper.readState()` implementation, it is set to:

```ts
true
```

for the state returned by the mapper.

The type therefore expresses availability as part of the runtime state contract, while the current mapper implementation does not derive it from a separate Matter availability signal.

---

# Separation of Structure and State

The two interfaces deliberately represent different concerns:

```text
MatterDeviceDescriptor
    │
    ├── identity
    ├── metadata
    └── endpoint topology

MatterDeviceState
    │
    ├── temperature
    ├── humidity
    ├── battery level
    └── availability
```

This allows discovery to describe a device independently from its current measurement values.

The descriptor can therefore be reused for catalog mapping and subscription setup without requiring a current measurement read.

---

# Runtime Mapping

`MatterDeviceMapper` combines both contracts:

```text
MatterDeviceDescriptor
        +
MatterDeviceState
        │
        ▼
PublishedClimateDevice
```

The resulting `PublishedClimateDevice` is the source-neutral contract used by the common publication layer.

The descriptor-specific Matter topology does not need to cross into that common runtime contract.

---

# Catalog Mapping

Only the descriptor is required for catalog discovery:

```text
MatterDeviceDescriptor
        │
        ▼
MatterDeviceCatalogMapper
        │
        ▼
DiscoveredCatalogDevice
```

Capabilities are derived from the presence of the descriptor endpoint IDs.

The catalog mapping therefore does not require current temperature, humidity, or battery values.

---

# Live Subscriptions

`MatterSubscriptionManager` receives the descriptor so it can attach observers using:

```text
temperatureEndpointId
humidityEndpointId
batteryEndpointId
```

Live values are then emitted using the plugin device `id`.

`MatterDeviceState` is not used as the event callback format.

The separation is intentional:

```text
Descriptor
    │
    └── identifies where live values are observed

Subscription callback
    │
    └── carries device ID + normalized value
```

---

# Data Flow

The two contracts participate in different stages of the Matter path:

```text
Matter peer
    │
    ▼
MatterDeviceDiscovery
    │
    ▼
MatterDeviceDescriptor
    │
    ├──────────────► MatterDeviceCatalogMapper
    │                         │
    │                         ▼
    │                  DiscoveredCatalogDevice
    │
    ├──────────────► MatterDeviceMapper
    │                         │
    │                         ▼
    │                  MatterDeviceState
    │                         │
    │                         ▼
    │                  PublishedClimateDevice
    │
    └──────────────► MatterSubscriptionManager
                              │
                              ▼
                       live normalized updates
```

This separates structural discovery, catalog mapping, initial runtime state, and live updates.

---

# Optionality and Capabilities

The endpoint identifiers are optional because a Matter device may expose only some of the supported measurement clusters.

The corresponding measurement values are also optional.

These two forms of optionality have different meanings:

```text
endpoint ID present
    │
    └── capability was discovered

measurement value present
    │
    └── a usable value was available during the read
```

A capability can therefore be known to exist even when its current measurement is unavailable.

---

# Identity and Source Boundary

The descriptor carries the Matter-specific identity needed inside the Matter subsystem:

```text
id
peerId
nodeId
```

When mapped to the shared catalog, the Matter source is declared explicitly and the Matter node ID becomes the source-specific identifier.

When mapped to `PublishedClimateDevice`, the plugin-level `id` is retained while Matter-specific peer and endpoint details remain outside the common model.

---

# Related Components

- `MatterDeviceDiscovery`
- `MatterDeviceMapper`
- `MatterDeviceCatalogMapper`
- `MatterSubscriptionManager`
- `MatterProvider`
- `PublishedClimateDevice`

---

# Related Documentation

- [Matter](README.md)
- [MatterDeviceDiscovery](MatterDeviceDiscovery.md)
- [MatterDeviceMapper](MatterDeviceMapper.md)
- [MatterDeviceCatalogMapper](MatterDeviceCatalogMapper.md)
- [MatterSubscriptionManager](MatterSubscriptionManager.md)
- [MatterProvider](MatterProvider.md)
- [ClimateDevice](../architecture/ClimateDevice.md)

---

# Source File

The implementation documented here is:

```text
src/matter/types.ts
```

These two interfaces form the internal Matter data boundary of V2: `MatterDeviceDescriptor` describes what a commissioned Matter device is and where its supported measurements live, while `MatterDeviceState` carries the normalized values read from it.
