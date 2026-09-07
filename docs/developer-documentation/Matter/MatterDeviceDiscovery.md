# MatterDeviceDiscovery

`MatterDeviceDiscovery` converts commissioned Matter peers exposed by the Matter controller into plugin-level `MatterDeviceDescriptor` objects.

Its responsibility is deliberately limited to topology and metadata discovery. It enumerates peers, inspects supported endpoint capabilities, reads Matter Basic Information, selects a discovery name, derives the plugin Matter device identity, and produces descriptors for the rest of the Matter pipeline.

It does not read live sensor measurements, synchronize the shared catalog, manage subscriptions, or publish HomeKit accessories.

The Matter architecture described here belongs to the V2 development work. It does not describe the stable 1.3.7 release.

---

# Purpose

`MatterDeviceDiscovery` is responsible for:

- iterating over commissioned Matter peers;
- detecting temperature-measurement endpoints;
- detecting relative-humidity-measurement endpoints;
- detecting power-source endpoints;
- reading Matter Basic Information;
- choosing a human-readable discovery name;
- deriving the plugin Matter device ID;
- returning `MatterDeviceDescriptor` objects.

It does not perform:

- commissioning;
- controller lifecycle management;
- live temperature, humidity, or battery reads;
- catalog synchronization;
- HomeKit publication;
- subscription management;
- custom-name persistence.

---

# Public API

The discovery entry point is:

```ts
discover(
  node: ServerNode,
): Promise<MatterDeviceDescriptor[]>
```

It receives the active `ServerNode` created and owned by `MatterController`.

The controller lifecycle is therefore outside this component.

---

# Discovery Flow

The method iterates over:

```ts
node.peers
```

For every peer, it creates a descriptor through the internal descriptor-building process.

Conceptually:

```text
ServerNode
    │
    ▼
node.peers
    │
    ▼
for each ClientNode
    │
    ▼
inspect endpoints
    │
    ▼
read Basic Information
    │
    ▼
MatterDeviceDescriptor
```

The discovery result is a structural representation of the currently commissioned Matter peer.

---

# Endpoint Capability Detection

For every peer, discovery tracks optional endpoint identifiers:

```ts
let temperatureEndpointId: number | undefined;
let humidityEndpointId: number | undefined;
let batteryEndpointId: number | undefined;
```

It then scans the peer's endpoints.

The presence of supported cluster state is used to identify the endpoint associated with each supported climate capability.

Discovery records the endpoint number but does not read the corresponding measurement value.

---

# Temperature Measurement Endpoint

An endpoint is considered temperature-capable when:

```ts
endpoint.maybeStateOf(
  'temperatureMeasurement',
)
```

returns a state.

Its endpoint number is stored as:

```ts
temperatureEndpointId =
  endpoint.number;
```

---

# Relative Humidity Endpoint

An endpoint is considered humidity-capable when:

```ts
endpoint.maybeStateOf(
  'relativeHumidityMeasurement',
)
```

returns a state.

Its endpoint number is stored as:

```ts
humidityEndpointId =
  endpoint.number;
```

---

# Power Source Endpoint

An endpoint is considered battery or power-source capable when:

```ts
endpoint.maybeStateOf(
  'powerSource',
)
```

returns a state.

Its endpoint number is stored as:

```ts
batteryEndpointId =
  endpoint.number;
```

The discovery layer records the endpoint location. Battery value normalization is performed later by `MatterDeviceMapper`.

---

# Endpoint Selection Behavior

The current implementation scans every endpoint and overwrites the stored endpoint number when another matching supported cluster is encountered.

Therefore, if multiple endpoints expose the same supported cluster, the descriptor retains the endpoint number from the last matching endpoint encountered during iteration.

This behavior is an implementation characteristic of the current discovery logic and is not a product-model selection rule.

---

# Peer Address Requirement

After endpoint inspection, discovery reads:

```ts
peer.peerAddress
```

If no peer address is available, discovery throws:

```text
Matter peer <peer.id> has no peer address.
```

A peer without a Matter peer address therefore cannot produce a descriptor.

The discovery method does not catch this error locally. The caller is responsible for handling the failed discovery operation.

---

# Matter Node ID

The Matter node ID is derived from:

```ts
peerAddress.nodeId.toString()
```

and stored as:

```text
nodeId
```

The plugin-level Matter device ID is constructed as:

```ts
matter:${nodeId}
```

This gives the Matter descriptor a source-qualified plugin identity.

---

# Basic Information

Discovery reads Matter Basic Information through the peer's Matter agent.

The following values are extracted when available:

```text
nodeLabel
productLabel
productName
vendorName
serialNumber
uniqueId
softwareVersionString
hardwareVersionString
```

These values provide the metadata needed by later catalog and publication layers.

Discovery does not persist the metadata itself.

---

# Device Name Selection

The discovery name follows this priority order:

```text
nodeLabel
    │
    ▼
productLabel
    │
    ▼
productName
    │
    ▼
peer.id
```

The corresponding selection is:

```ts
basicInformation.nodeLabel?.trim() ||
basicInformation.productLabel?.trim() ||
basicInformation.productName?.trim() ||
peer.id;
```

Whitespace-only labels are therefore ignored.

This is the Matter discovery name. It is not necessarily the final HomeKit-facing name because persistent catalog preferences and Matter custom-name persistence are handled elsewhere.

---

# Descriptor Construction

Discovery returns:

```ts
MatterDeviceDescriptor
```

with the following information:

```text
id
peerId
name
nodeId
vendorName
productName
serialNumber
uniqueId
softwareVersion
hardwareVersion
temperatureEndpointId
humidityEndpointId
batteryEndpointId
```

The descriptor combines Matter identity, topology, capabilities, and Basic Information metadata.

It does not contain current temperature, humidity, or battery values.

---

# Identity Fields

## Plugin Device ID

```ts
id: `matter:${nodeId}`
```

This is the plugin-facing Matter device ID.

## Peer ID

```ts
peerId: peer.id
```

This links the descriptor to the active Matter peer.

## Matter Node ID

```text
nodeId
```

This stores the Matter node identifier as a string.

The three fields serve different purposes and should not be treated as interchangeable identifiers.

---

# Capability Fields

The descriptor contains optional endpoint identifiers:

```ts
temperatureEndpointId
humidityEndpointId
batteryEndpointId
```

Their presence identifies where supported Matter clusters were discovered.

Later components use these endpoint identifiers to:

- read initial measurements;
- register live measurement observers.

Discovery itself does not perform either operation.

---

# Metadata Fields

The descriptor can carry:

```ts
vendorName
productName
serialNumber
uniqueId
softwareVersion
hardwareVersion
```

These values originate from Matter `BasicInformationBehavior`.

Later layers can use them for catalog metadata and HomeKit accessory information.

---

# Relationship with MatterController

`MatterController` owns the active Matter `ServerNode`.

`MatterProvider` obtains that node through:

```ts
controller.getNode()
```

and passes it to:

```ts
discovery.discover(node)
```

`MatterDeviceDiscovery` therefore does not own controller startup or shutdown.

---

# Relationship with MatterProvider

`MatterProvider` invokes discovery at the beginning of each full Matter synchronization pass.

The returned descriptors become inputs for:

- `MatterDeviceCatalogMapper`;
- `MatterDeviceMapper`;
- `MatterSubscriptionManager`;
- peer lookup through `descriptor.peerId`.

Discovery is therefore the first Matter-specific stage after the controller has been started.

---

# Relationship with MatterDeviceCatalogMapper

`MatterDeviceCatalogMapper` converts the descriptors returned by discovery into the generic discovered-device representation expected by the shared catalog.

This keeps Matter-specific peer, endpoint, and topology details outside `DeviceCatalog`.

The mapper is responsible for assigning the Matter source identity to the generic catalog representation.

---

# Relationship with MatterDeviceMapper

`MatterDeviceMapper` uses the endpoint identifiers discovered here to read the current Matter sensor state from a peer.

The separation is:

```text
MatterDeviceDiscovery
    │
    └── determines where supported clusters are located

MatterDeviceMapper
    │
    └── determines what values those clusters currently expose
```

This keeps topology discovery separate from runtime state mapping.

---

# Relationship with MatterSubscriptionManager

`MatterSubscriptionManager` receives the descriptor and uses its endpoint identifiers to attach live observers to supported Matter measurements.

The separation is:

```text
MatterDeviceDiscovery
    │
    └── identifies supported endpoints

MatterSubscriptionManager
    │
    └── observes changes on those endpoints
```

---

# Error Behavior

The explicit discovery error in the current implementation is a missing `peerAddress`.

If one peer reaches that condition, descriptor creation throws and the current `discover()` call does not catch the error locally.

The caller, normally `MatterProvider`, is responsible for handling the failed discovery operation.

---

# Responsibilities

`MatterDeviceDiscovery` is responsible for:

- enumerating commissioned Matter peers;
- detecting supported endpoints;
- extracting the Matter node ID;
- reading Basic Information;
- selecting the discovery name;
- constructing `MatterDeviceDescriptor`.

It is not responsible for:

- commissioning;
- controller lifecycle;
- reading temperature, humidity, or battery values;
- normalizing Matter measurement units;
- synchronizing the shared catalog;
- managing catalog preferences;
- managing live subscription callbacks;
- persisting custom names;
- creating Homebridge accessories.

---

# Design Principles

## Descriptor Before State

Discovery creates a structural description of each Matter peer before runtime measurement state is read.

This separates device topology and metadata from current sensor values.

## Matter-Specific Knowledge Stays Local

Cluster names, endpoint IDs, peer IDs, and Basic Information access remain inside the Matter subsystem.

The shared catalog receives mapped generic data later.

## Stable Source-Qualified Device ID

The plugin device ID uses:

```text
matter:<nodeId>
```

This identifies the Matter source namespace at the plugin level.

## Capability Detection by Endpoint

Supported climate capabilities are inferred from the presence of supported Matter cluster state on endpoints rather than from a hardcoded product-model list.

## No Measurement Responsibility

Discovery records where supported measurements exist but does not read or normalize their values.

That responsibility belongs to `MatterDeviceMapper` and, for live changes, `MatterSubscriptionManager`.

---

# Related Components

- `MatterController`
- `MatterProvider`
- `MatterDeviceMapper`
- `MatterDeviceCatalogMapper`
- `MatterSubscriptionManager`
- `MatterDeviceDescriptor`

---

# Related Documentation

- [Matter](README.md)
- [MatterProvider](MatterProvider.md)
- [MatterController](MatterController.md)
- [MatterDeviceMapper](MatterDeviceMapper.md)
- [MatterSubscriptionManager](MatterSubscriptionManager.md)
- [Architecture overview](../architecture/README.md)

---

# Source File

The implementation documented here is:

```text
src/matter/discovery.ts
```

`MatterDeviceDiscovery` is the Matter topology and metadata boundary. It turns commissioned peers into structural descriptors while leaving runtime values, persistence, synchronization, subscriptions, and HomeKit publication to the appropriate layers.
