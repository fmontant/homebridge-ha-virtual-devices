# ADR-0005: Expose Catalog Operations through a Dedicated Catalog API

- **Status:** Accepted
- **Scope:** UI access to catalog data and preferences
- **Applies to:** Shared V2 catalog
- **Architecture:** V2

---

# Context

The plugin UI needs to read and modify persistent device catalog information without depending directly on the internal catalog implementation.

The UI must be able to:

- list devices;
- open a specific device;
- mark a device as viewed;
- update selected user preferences.

The persistent catalog contains both technical and user-facing information, but the UI should not manipulate `DeviceCatalog` directly.

Direct UI access to persistence would tightly couple the interface to:

- catalog storage format;
- synchronization internals;
- publication rules;
- device lifecycle implementation.

V2 also introduces multiple providers, so the UI-facing model must remain source-aware without becoming provider-specific.

---

# Decision

The plugin exposes catalog operations through a dedicated:

```text
CatalogApi
```

located in the UI boundary.

The current public operations are:

```ts
getDevices()
getDevice(...)
markDeviceViewed(...)
updatePreferences(...)
```

`CatalogApi` is the controlled interface between the custom Homebridge UI and the shared persistent catalog.

---

# Responsibilities

`CatalogApi` is responsible for:

- loading the catalog before reads or writes;
- returning UI-oriented device objects;
- delegating preference changes to `CatalogManager`;
- marking first inspection;
- returning updated device state after changes.

It does not own:

- persistence;
- provider discovery;
- HomeKit publication;
- catalog synchronization.

---

# Read Operations

## getDevices()

`getDevices()` loads the catalog and returns all catalog devices after mapping and sorting.

Conceptually:

```text
UI
 │
 ▼
CatalogApi.getDevices()
 │
 ├── CatalogManager.load()
 ├── CatalogManager.getAll()
 ├── CatalogApiMapper
 └── CatalogSorter
 │
 ▼
UI device list
```

This keeps internal catalog objects out of the UI contract.

---

## getDevice()

`getDevice(id)` loads the catalog and returns one mapped device when it exists.

If no matching catalog entry exists, the API returns no device rather than constructing synthetic state.

---

# Viewed State

`markDeviceViewed(id)` records the device's first-view timestamp through the catalog layer.

The operation then returns the current mapped device.

This lets the UI maintain a persistent "first viewed" state without writing timestamps directly.

---

# Preference Updates

`updatePreferences(id, preferences)` updates only the preference fields explicitly supported by the API.

The current implementation accepts changes for:

```text
enabled
hidden
favorite
room
```

when those fields are present in the request.

It then returns the freshly mapped device.

---

# Deliberately Restricted Preference Surface

The method parameter is typed broadly enough to reference device preferences, but the implementation does not blindly copy all incoming fields.

In particular, the current API does not directly apply:

```text
homeKitName
archived
```

through this method.

This is intentional from an API-design perspective: the UI boundary applies an explicit allow-list of supported mutations rather than persisting arbitrary preference properties.

---

# UI Model

`CatalogApi` does not return raw `CatalogDevice` objects directly.

A dedicated mapper produces the UI-facing representation.

The mapped model includes fields such as:

```text
id
source
sourceId
name
state
capabilities
metadata
preferences
timestamps
available
lastCommunication
publishable
```

This creates a stable presentation boundary between internal catalog state and the frontend.

---

# Derived Publication State

The UI-facing model includes:

```text
publishable
```

derived from the catalog publication rule:

```text
enabled && !archived
```

This avoids duplicating the publication rule in the frontend.

---

# Displayed State

The UI mapper also derives a presentation-oriented state.

Conceptually:

```text
archived preference
    │
    └── Archived

disabled preference
    │
    └── Disabled

otherwise
    │
    └── catalog lifecycle state
```

This allows the frontend to display a meaningful state without reimplementing catalog semantics.

---

# Source Awareness

The UI contract exposes:

```text
source
sourceId
```

so a device can be identified as coming from:

```text
Home Assistant
Matter
```

without introducing provider-specific UI APIs.

The same `CatalogApi` serves both providers because they already feed the shared catalog.

---

# Separation from CatalogManager

`CatalogManager` is the domain-facing orchestration layer around the catalog.

`CatalogApi` is the UI-facing application boundary.

Conceptually:

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
 │
 ▼
DeviceCatalogStore
```

This separation prevents the frontend from depending directly on persistence or catalog internals.

---

# Separation from CatalogApiMapper

`CatalogApiMapper` owns transformation from internal catalog data to UI-facing data.

`CatalogApi` owns operation orchestration.

Therefore:

```text
CatalogApi
    │
    └── decides what operation to perform

CatalogApiMapper
    │
    └── decides how catalog data is represented to the UI
```

---

# Separation from CatalogSorter

Sorting is delegated to a dedicated component.

The API therefore does not embed list-ordering policy into persistence or mapping logic.

---

# Consequences

## Positive

### Stable UI boundary

The frontend interacts with a compact application API instead of internal catalog classes.

### Provider neutrality

Home Assistant and Matter devices are exposed through the same API.

### Controlled mutations

The API explicitly decides which preference fields can be changed.

### Central mapping

UI-specific derived fields such as `publishable` and display state are calculated in one place.

### Lower coupling

Changes to catalog storage do not automatically require equivalent changes in frontend code.

---

## Trade-offs

### Additional mapping layer

The UI model duplicates some catalog fields by design.

This adds maintenance cost but creates a safer boundary.

### API and domain capabilities can differ

A catalog preference may exist internally without being writable through `CatalogApi`.

Developers must not assume the API exposes every domain operation.

### Reload-before-operation behavior adds filesystem work

Each API operation reloads through `CatalogManager` to ensure current persistent state.

This favors consistency over minimizing disk access.

---

# Alternatives Considered

## Let the UI access DeviceCatalog directly

Rejected because it would tightly couple the frontend to domain and persistence internals.

## Return raw CatalogDevice objects

Rejected because UI representation includes derived values and presentation semantics that should remain outside the persistent model.

## Let the frontend derive publication and display state

Rejected because this would duplicate business rules and risk drift between backend and UI behavior.

## Accept arbitrary preference updates

Rejected because unrestricted property copying would make the UI API fragile and could accidentally expose internal or future preference fields.

---

# Implementation

This decision is implemented primarily in:

```text
src/ui/catalogApi.ts
src/ui/catalogApiMapper.ts
src/ui/catalogSorter.ts
```

It relies on:

```text
src/managers/catalogManager.ts
src/catalog/deviceCatalog.ts
```

---

# Related Architecture

- [CatalogApi](../architecture/CatalogApi.md)
- [CatalogManager](../architecture/CatalogManager.md)
- [DeviceCatalog](../architecture/DeviceCatalog.md)
- [Persistent Device Catalog](ADR-0002-persistent-catalog.md)

---

# Decision Summary

Homebridge HA Virtual Devices exposes catalog functionality to the custom UI through a dedicated `CatalogApi`.

The API provides controlled read and preference-update operations, maps internal catalog objects into a stable UI model, remains source-aware and provider-neutral, and prevents the frontend from coupling directly to persistence and catalog internals.
