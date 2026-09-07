# MatterDeviceCatalogMapper

`MatterDeviceCatalogMapper` converts Matter-specific device descriptors into the generic `DiscoveredCatalogDevice` representation consumed by the shared catalog.

It is the boundary between Matter discovery and source-aware catalog synchronization.

The Matter architecture described here belongs to the V2 development work. It does not describe the stable 1.3.7 release.

---

# Purpose

`MatterDeviceCatalogMapper` is responsible for:

- converting one `MatterDeviceDescriptor` into one `DiscoveredCatalogDevice`;
- declaring the catalog source as `matter`;
- mapping the Matter node ID to the catalog `sourceId`;
- deriving generic device capabilities from discovered Matter endpoint IDs;
- mapping Matter Basic Information metadata into generic catalog metadata;
- converting descriptor arrays in one operation.

It does not persist the catalog, manage preferences, read Matter sensor values, or publish HomeKit accessories.

---

# Single-Device Mapping

The main method is:

```ts
toDiscoveredCatalogDevice(
  descriptor: MatterDeviceDescriptor,
): DiscoveredCatalogDevice
```

It starts with an empty capability list:

```ts
const capabilities: DeviceCapability[] = [];
```

Capabilities are then derived from the endpoint IDs found during Matter discovery.

---

# Temperature Capability

If:

```ts
descriptor.temperatureEndpointId !==
undefined
```

the mapper adds:

```ts
DeviceCapability.Temperature
```

---

# Humidity Capability

If:

```ts
descriptor.humidityEndpointId !==
undefined
```

the mapper adds:

```ts
DeviceCapability.Humidity
```

---

# Battery Capability

If:

```ts
descriptor.batteryEndpointId !==
undefined
```

the mapper adds:

```ts
DeviceCapability.Battery
```

Capability mapping therefore depends on discovered Matter topology, not on whether a measurement value happened to be available during a particular state read.

---

# Catalog Identity

The generic catalog device receives:

```ts
id: descriptor.id
```

The source is explicitly:

```ts
source: 'matter'
```

and the source-specific identifier is:

```ts
sourceId: descriptor.nodeId
```

This gives the shared catalog both the plugin-level Matter ID and the original Matter node identity.

---

# Catalog Name

The catalog name is copied from:

```ts
descriptor.name
```

The descriptor name has already been selected by `MatterDeviceDiscovery` from Matter Basic Information, with `peer.id` as the final fallback.

The catalog mapper does not apply a second naming policy.

---

# Initial Catalog State

Every mapped Matter discovery result is emitted with:

```ts
state: CatalogDeviceState.Enabled
```

The catalog synchronization layer subsequently owns persistent lifecycle state and user preferences.

The initial `Enabled` value is therefore a discovery-state value, not a replacement for persistent catalog preferences.

---

# Metadata Mapping

The mapper translates descriptor metadata as follows:

```text
descriptor.vendorName       → metadata.manufacturer
descriptor.productName      → metadata.model
descriptor.serialNumber     → metadata.serialNumber
descriptor.uniqueId         → metadata.uniqueId
descriptor.softwareVersion  → metadata.softwareVersion
descriptor.hardwareVersion  → metadata.hardwareVersion
```

This produces generic metadata that can be consumed without Matter-specific knowledge.

---

# Complete Mapping

Conceptually:

```text
MatterDeviceDescriptor
        │
        ├── id ───────────────► id
        ├── nodeId ───────────► sourceId
        ├── name ─────────────► name
        ├── endpoint IDs ─────► capabilities
        └── Basic Information ► metadata

source = "matter"
state  = Enabled

        │
        ▼
DiscoveredCatalogDevice
```

---

# Multiple-Device Mapping

The convenience method:

```ts
toDiscoveredCatalogDevices(
  descriptors: MatterDeviceDescriptor[],
): DiscoveredCatalogDevice[]
```

maps every descriptor through:

```ts
toDiscoveredCatalogDevice()
```

No additional filtering or sorting is performed.

---

# Relationship with MatterDeviceDiscovery

`MatterDeviceDiscovery` produces `MatterDeviceDescriptor`.

`MatterDeviceCatalogMapper` translates that Matter-specific descriptor into the common catalog discovery model.

```text
MatterDeviceDiscovery
        │
        ▼
MatterDeviceDescriptor
        │
        ▼
MatterDeviceCatalogMapper
        │
        ▼
DiscoveredCatalogDevice
```

The catalog mapper therefore does not perform peer discovery itself.

---

# Relationship with MatterProvider

During synchronization, `MatterProvider` calls:

```ts
catalogMapper.toDiscoveredCatalogDevices(
  descriptors,
)
```

and then passes the result to:

```ts
catalogManager.synchronizeDiscoveredDevices(
  discoveredCatalogDevices,
  'matter',
)
```

The mapper itself does not invoke synchronization.

---

# Relationship with DeviceCatalog

`DeviceCatalog` is source-neutral.

It receives generic `DiscoveredCatalogDevice` objects and a synchronization source.

Matter-specific endpoint IDs and Matter behavior classes do not enter the catalog model.

The catalog instead receives:

- generic capabilities;
- generic metadata;
- `source: 'matter'`;
- `sourceId` containing the Matter node ID.

This source-aware identity allows Matter and Home Assistant discoveries to coexist in the same catalog.

---

# Relationship with MatterDeviceMapper

The two Matter mappers serve different boundaries.

`MatterDeviceCatalogMapper` maps discovery information into the persistent catalog model.

`MatterDeviceMapper` maps current Matter sensor state into the runtime `PublishedClimateDevice` model.

```text
MatterDeviceDescriptor
       │
       ├──► MatterDeviceCatalogMapper
       │            │
       │            ▼
       │     DiscoveredCatalogDevice
       │
       └──► MatterDeviceMapper
                    │
                    ▼
             PublishedClimateDevice
```

The catalog mapper does not read or normalize measurement values.

---

# Source Identity

The source identity is deliberately explicit:

```text
source = matter
sourceId = Matter node ID
```

The combination allows the shared catalog to distinguish Matter-originated discovery from discovery performed by another provider.

The plugin-level `id` remains:

```text
matter:<nodeId>
```

as established by `MatterDeviceDiscovery`.

---

# Responsibilities

`MatterDeviceCatalogMapper` is responsible for:

- catalog identity mapping;
- Matter source declaration;
- generic capability derivation;
- metadata translation;
- array mapping.

It is not responsible for:

- Matter peer discovery;
- controller lifecycle;
- measurement reads;
- unit conversion;
- catalog persistence;
- catalog preference handling;
- subscription management;
- HomeKit publication.

---

# Design Principles

## Matter Details Stop at the Mapping Boundary

The shared catalog does not need to understand Matter endpoints or Matter Basic Information structures.

## Explicit Source Identity

Every mapped device is explicitly identified with:

```text
source = matter
```

and:

```text
sourceId = nodeId
```

## Generic Capabilities

Matter endpoint presence is translated into the same `DeviceCapability` vocabulary used by the common catalog.

## Separate Persistent and Runtime Mapping

Catalog mapping and runtime climate-device mapping remain separate responsibilities.

## No Runtime Measurement Logic

This mapper does not read, normalize, or update temperature, humidity, or battery values.

---

# Related Components

- `MatterDeviceDiscovery`
- `MatterProvider`
- `MatterDeviceMapper`
- `MatterDeviceDescriptor`
- `DiscoveredCatalogDevice`
- `CatalogManager`
- `DeviceCatalog`

---

# Related Documentation

- [Matter](README.md)
- [MatterProvider](MatterProvider.md)
- [MatterDeviceDiscovery](MatterDeviceDiscovery.md)
- [MatterDeviceMapper](MatterDeviceMapper.md)
- [CatalogManager](../architecture/CatalogManager.md)
- [DeviceCatalog](../architecture/DeviceCatalog.md)

---

# Source File

The implementation documented here is:

```text
src/matter/catalogMapper.ts
```

`MatterDeviceCatalogMapper` is the V2 Matter-to-catalog boundary. It converts Matter discovery descriptors into generic, source-aware catalog devices while keeping Matter-specific topology out of the persistent catalog model.
