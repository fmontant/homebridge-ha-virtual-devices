# MatterDeviceNameStore

`MatterDeviceNameStore` is the Matter-specific persistence layer used to preserve user-defined HomeKit-facing names across Matter rediscovery.

It stores a mapping from stable Matter `uniqueId` values to custom names in a dedicated JSON registry.

The Matter architecture described here belongs to the V2 development work. It does not describe the stable 1.3.7 release.

---

# Purpose

`MatterDeviceNameStore` is responsible for:

- loading the Matter device-name registry;
- returning a stored name for a Matter `uniqueId`;
- saving or replacing a stored name;
- creating the storage directory when necessary;
- writing updates through a temporary file followed by rename;
- creating an empty registry when the file does not yet exist.

It does not decide when a name should be saved or restored. That orchestration belongs to higher-level components.

---

# Registry Format

The private registry structure is:

```ts
interface MatterDeviceNameRegistry {
  version: 1;
  devices: Record<
    string,
    {
      name: string;
    }
  >;
}
```

Conceptually:

```json
{
  "version": 1,
  "devices": {
    "<matter-unique-id>": {
      "name": "Terrasse"
    }
  }
}
```

The registry key is the Matter device `uniqueId`.

The registry is deliberately smaller and more specialized than the shared device catalog.

---

# Construction

The constructor receives only:

```ts
filePath: string
```

This is the complete path of the dedicated Matter name-registry file.

The store does not calculate its own storage location.

---

# Reading a Name

`getName(uniqueId)` loads the current registry and returns:

```ts
registry.devices[uniqueId]?.name
```

The result is:

```ts
Promise<string | undefined>
```

If the device is unknown, the method returns `undefined`.

The store does not generate a fallback name.

---

# Saving a Name

`saveName(uniqueId, name)` follows this sequence:

```text
load registry
    │
    ▼
set devices[uniqueId]
    │
    ▼
save registry
```

The stored entry is:

```ts
registry.devices[uniqueId] = {
  name,
};
```

Calling `saveName()` again for the same `uniqueId` replaces the previously stored name.

The store itself does not determine whether the supplied name is a user-defined name or whether it should replace another naming source. The caller decides when persistence is appropriate.

---

# Loading the Registry

The private `load()` method reads:

```ts
this.filePath
```

as UTF-8 text and parses it with:

```ts
JSON.parse(content)
```

The parsed object is treated as:

```ts
MatterDeviceNameRegistry
```

The current implementation does not perform additional structural validation after parsing.

Consequently, malformed JSON or other read errors are not silently converted into an empty registry.

---

# Missing File Behavior

If reading fails with:

```text
ENOENT
```

the store returns a new empty registry:

```ts
{
  version: 1,
  devices: {},
}
```

A missing registry file is therefore treated as a normal first-use condition.

Other read or parse errors are rethrown.

---

# Saving the Registry

Before writing, the store creates the parent directory with:

```ts
mkdir(
  dirname(this.filePath),
  {
    recursive: true,
  },
)
```

The JSON content is serialized with indentation:

```ts
JSON.stringify(
  registry,
  null,
  2,
)
```

and a final newline is appended.

This keeps the registry human-readable and stable for inspection.

---

# Temporary File and Replacement

The store writes first to:

```ts
`${this.filePath}.tmp`
```

using:

```ts
writeFile()
```

The temporary file is then moved into place with:

```ts
rename(
  temporaryFilePath,
  this.filePath,
)
```

The intended sequence is:

```text
serialize registry
    │
    ▼
write .tmp file
    │
    ▼
rename .tmp to final path
```

This avoids writing the JSON directly over the existing registry file.

The implementation does not document or provide a separate recovery mechanism for an interrupted write.

---

# File Permissions

The temporary file is created with:

```ts
mode: 0o600
```

This restricts the file to owner read and write permissions at creation time.

---

# Relationship with MatterProvider

During Matter synchronization, `MatterProvider` can use the store to restore a previously persisted HomeKit-facing name.

For a Matter device with a non-empty:

```ts
metadata.uniqueId
```

the provider can call:

```ts
deviceNameStore.getName(
  uniqueId,
)
```

When a stored name exists, the provider restores:

```ts
catalogDevice.preferences.homeKitName
```

and persists the updated shared catalog.

The name store therefore provides the persistent Matter-specific lookup, while `MatterProvider` decides when restoration is performed.

---

# Name Persistence Across Rediscovery

The store exists to prevent loss of a custom HomeKit-facing name when a Matter device disappears from and is later recreated in the shared catalog.

The stable lookup key is:

```text
Matter uniqueId
```

rather than:

- the display name;
- the plugin device ID;
- the current peer ID.

This allows the custom name to survive recreation of the corresponding catalog entry, provided the Matter device exposes the same stable `uniqueId`.

---

# Relationship with DeviceCatalogStore

`MatterDeviceNameStore` and `DeviceCatalogStore` have separate persistence responsibilities.

```text
DeviceCatalogStore
    │
    └── shared source-aware catalog state

MatterDeviceNameStore
    │
    └── Matter uniqueId → custom HomeKit-facing name
```

`DeviceCatalogStore` persists the shared catalog, including catalog preferences.

`MatterDeviceNameStore` persists only the additional Matter-specific name mapping required to restore a custom name after rediscovery.

The two stores therefore should not be merged conceptually even though `MatterProvider` can use both during synchronization.

---

# Relationship with the Shared Catalog

The name store does not become part of the source-neutral catalog model.

Its Matter-specific key remains:

```text
uniqueId
```

The shared catalog continues to represent the device using its generic source-aware identity.

The separation keeps Matter-specific recovery information outside the generic catalog contract.

---

# Error Behavior

The store handles one read error specially:

```text
ENOENT
```

which produces an empty registry.

Other read errors and JSON parsing errors are propagated to the caller.

The save path does not contain explicit local recovery logic beyond writing to a temporary file before replacing the final file.

---

# Responsibilities

`MatterDeviceNameStore` is responsible for:

- reading stored Matter names;
- saving Matter names;
- keying names by Matter `uniqueId`;
- creating its parent directory;
- serializing the registry as JSON;
- replacing the registry through a temporary file.

It is not responsible for:

- choosing the final HomeKit name;
- detecting Matter devices;
- discovering `uniqueId`;
- deciding when a name changed;
- synchronizing the main catalog;
- updating HomeKit accessories;
- Matter commissioning.

---

# Design Principles

## Stable Identity Over Display Identity

Names are stored against the Matter `uniqueId`, not against a user-facing name.

## Dedicated Persistence

Matter name recovery is intentionally independent from the main catalog file.

## Simple Versioned Format

The registry contains:

```ts
version: 1
```

leaving room for future format evolution.

## Write Before Replace

Updates are written to a temporary file before the final path is replaced.

## Clear Ownership

The store owns persistence only. Higher-level components decide when names should be restored or saved.

---

# Related Components

- `MatterProvider`
- `MatterDeviceDiscovery`
- `DeviceCatalogStore`
- `CatalogManager`
- `MatterDeviceDescriptor`

---

# Related Documentation

- [Matter](README.md)
- [MatterProvider](MatterProvider.md)
- [MatterDeviceDiscovery](MatterDeviceDiscovery.md)
- [DeviceCatalogStore](../architecture/DeviceCatalogStore.md)
- [CatalogManager](../architecture/CatalogManager.md)

---

# Source File

The implementation documented here is:

```text
src/matter/deviceNameStore.ts
```

`MatterDeviceNameStore` is the V2 Matter custom-name persistence boundary. It keeps a dedicated mapping from stable Matter `uniqueId` values to user-defined HomeKit-facing names so those names can be restored after rediscovery.
