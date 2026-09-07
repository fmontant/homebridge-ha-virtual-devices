# CatalogApi

`CatalogApi` is the UI-facing access layer for the persistent device catalog.

It exposes catalog devices in a presentation-oriented form, reloads persisted state before reads, applies a limited set of editable preferences, and delegates catalog mutation to `CatalogManager`.

In V2, the API model is explicitly source-aware through `source` and `sourceId`, so Home Assistant and Matter devices can be represented through the same UI contract.

---

# Purpose

`CatalogApi` is responsible for:

- listing catalog devices for the plugin UI;
- reading one catalog device by ID;
- marking a device as viewed;
- updating supported user preferences;
- mapping internal `CatalogDevice` objects into UI-facing objects;
- sorting the device list before returning it;
- exposing publication and display state without giving the UI direct access to catalog internals.

It does not own persistence, synchronization, discovery, HomeKit publication, or provider logic.

---

# UI Contract

The API exposes:

```ts
export interface CatalogApiDevice {
  id: string;
  source: string;
  sourceId: string;
  name: string;
  state: CatalogDeviceState;
  capabilities: DeviceCapability[];
  metadata: DeviceMetadata;
  preferences: DevicePreferences;
  timestamps: DeviceTimestamps;
  available: boolean;
  lastCommunication?: string;
  publishable: boolean;
}
```

This contract contains both source identity and UI-oriented derived values.

---

# Source Awareness

V2 explicitly exposes:

```text
source
sourceId
```

This allows the UI to know where a device came from while continuing to use one shared catalog model.

The API itself does not branch on Home Assistant versus Matter.

It simply returns the source recorded in the catalog.

---

# Reading All Devices

`getDevices()` performs three steps.

First it reloads the catalog:

```ts
await this.catalogManager.load();
```

Then it retrieves and maps every catalog device:

```text
CatalogDevice
    │
    ▼
CatalogApiMapper
    │
    ▼
CatalogApiDevice
```

Finally it passes the resulting array through:

```ts
CatalogSorter.sort()
```

before returning it to the UI.

The UI therefore receives a fresh, mapped, sorted representation of the persisted catalog.

---

# Reading One Device

`getDevice(id)` also reloads the catalog first.

It then performs:

```ts
catalogManager.get(id)
```

If the device does not exist, the method returns:

```ts
undefined
```

Otherwise it maps the catalog object through:

```ts
CatalogApiMapper.toApiDevice()
```

and returns the UI-facing object.

---

# Marking a Device as Viewed

`markDeviceViewed(id)` delegates to:

```ts
catalogManager.setFirstViewedAt(id)
```

It then calls:

```ts
getDevice(id)
```

and returns the refreshed API representation.

The first-view timestamp is therefore managed by the catalog layer, not by the UI.

---

# Updating Preferences

The update payload type is:

```ts
export type CatalogApiDevicePreferencesUpdate =
  Partial<DevicePreferences>;
```

However, `CatalogApi` intentionally applies only a specific supported subset.

The method currently handles:

```text
enabled
hidden
favorite
room
```

Each property is checked independently.

---

# Enabled

If:

```ts
typeof preferences.enabled ===
'boolean'
```

the API calls:

```ts
catalogManager.setEnabled(
  id,
  preferences.enabled,
)
```

---

# Hidden

If:

```ts
typeof preferences.hidden ===
'boolean'
```

the API calls:

```ts
catalogManager.setHidden(
  id,
  preferences.hidden,
)
```

---

# Favorite

If:

```ts
typeof preferences.favorite ===
'boolean'
```

the API calls:

```ts
catalogManager.setFavorite(
  id,
  preferences.favorite,
)
```

---

# Room

`room` is handled using an explicit own-property test:

```ts
Object.prototype.hasOwnProperty.call(
  preferences,
  'room',
)
```

This is important because clearing a room can require passing an explicit empty or undefined-like value rather than simply omitting the field.

When present, the API delegates to:

```ts
catalogManager.setRoom(
  id,
  preferences.room,
)
```

---

# Preferences Not Applied Here

Although the input type is `Partial<DevicePreferences>`, the current implementation does **not** apply every possible preference field.

In particular, `CatalogApi.updatePreferences()` does not currently call setters for fields such as:

```text
homeKitName
archived
```

Those fields must not be assumed to be editable through this method unless the implementation is extended.

---

# Update Flow

`updatePreferences()` first reloads the catalog and verifies that the target device exists.

If no matching device is found, it returns:

```ts
undefined
```

Otherwise it applies each supported preference mutation in sequence through `CatalogManager`.

At the end it calls:

```ts
getDevice(id)
```

to return the refreshed API representation.

Conceptually:

```text
UI preference update
        │
        ▼
CatalogApi
        │
        ▼
CatalogManager setters
        │
        ▼
persistent catalog
        │
        ▼
CatalogApi.getDevice()
        │
        ▼
updated UI model
```

---

# CatalogApiMapper

`CatalogApiMapper` converts an internal `CatalogDevice` into a `CatalogApiDevice`.

It copies:

```text
id
source
sourceId
name
capabilities
metadata
preferences
timestamps
available
```

The array/object fields are copied into new containers rather than returned by direct reference.

---

# Displayed State

The UI-facing state may differ from the raw catalog state.

`CatalogApiMapper.getDisplayedState()` applies this priority:

```text
archived
    │
    ▼
Archived

else disabled
    │
    ▼
Disabled

else
    │
    ▼
device.state
```

Specifically:

```ts
if (device.preferences.archived) {
  return CatalogDeviceState.Archived;
}

if (!device.preferences.enabled) {
  return CatalogDeviceState.Disabled;
}

return device.state;
```

This means preference-driven states override the underlying discovery state for display purposes.

---

# Publishable

The mapper derives:

```ts
publishable =
  device.preferences.enabled &&
  !device.preferences.archived
```

This matches the publication rule used by the catalog layer.

`hidden` and `favorite` do not affect `publishable`.

---

# Last Communication

The API exposes:

```ts
lastCommunication
```

using:

```ts
device.lastCommunication ??
device.timestamps.lastSeen
```

So the explicit communication timestamp is preferred when available.

Otherwise the last-seen timestamp is used as fallback.

---

# Sorting

`CatalogApi` owns a `CatalogSorter` instance and sorts the mapped device list before returning it from `getDevices()`.

Sorting happens after mapping, meaning the sorter works with the UI-facing representation rather than raw catalog objects.

The exact ordering policy belongs to `CatalogSorter`, not to `CatalogApi`.

---

# Relationship with CatalogManager

`CatalogManager` is the operational dependency of `CatalogApi`.

`CatalogApi` delegates:

```text
load
getAll
get
setFirstViewedAt
setEnabled
setHidden
setFavorite
setRoom
```

to `CatalogManager`.

The API therefore acts as a boundary rather than reimplementing catalog behavior.

---

# Relationship with DeviceCatalog

`DeviceCatalog` owns the actual catalog rules and persistent device state.

`CatalogApi` does not manipulate `DeviceCatalog` directly.

The dependency chain is:

```text
Plugin UI
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

---

# Relationship with the UI

The UI should consume `CatalogApiDevice` rather than internal catalog structures.

This gives the backend control over:

- displayed state;
- publication status;
- fallback communication timestamps;
- supported preference mutations;
- sorting.

It also prevents the UI from depending directly on catalog implementation details.

---

# V2 Provider Independence

`CatalogApi` is provider-neutral.

It does not connect to Home Assistant or Matter and does not commission or discover devices.

Because each API device includes:

```text
source
sourceId
```

the same API can expose entries from both providers through one common catalog interface.

---

# Responsibilities

`CatalogApi` is responsible for:

- exposing catalog data to the UI;
- refreshing catalog data before reads;
- mapping internal devices to API devices;
- deriving UI-facing publication and state information through the mapper;
- sorting the device list;
- applying the supported editable preferences.

It is **not** responsible for:

- device discovery;
- Matter commissioning;
- Home Assistant communication;
- HomeKit accessory creation;
- catalog synchronization;
- persistence implementation;
- deciding provider enablement.

---

# Design Principles

## Thin UI Boundary

The API delegates domain behavior to `CatalogManager` and presentation mapping to `CatalogApiMapper`.

---

## Source-Neutral Contract

Home Assistant and Matter devices use the same `CatalogApiDevice` structure.

---

## Derived Presentation State

The API-facing state reflects user preferences such as disabled or archived status, not just raw discovery state.

---

## Explicit Mutation Surface

Even though the update payload is typed as `Partial<DevicePreferences>`, only explicitly implemented preference setters are applied.

This keeps the UI mutation surface controlled by backend code.

---

# Extending CatalogApi

Changes belong here when they concern:

- fields exposed to the plugin UI;
- supported preference mutations;
- UI-facing lookup methods;
- list retrieval behavior.

When adding a new API field, review:

- `CatalogApiDevice`;
- `CatalogApiMapper`;
- UI types and consumers.

When adding a new editable preference, review:

- `DevicePreferences`;
- `CatalogManager` setter support;
- `DeviceCatalog` mutation behavior;
- `CatalogApi.updatePreferences()`;
- UI controls.

---

# Related Components

- `CatalogManager`
- `DeviceCatalog`
- `DeviceCatalogStore`
- `CatalogApiMapper`
- `CatalogSorter`
- `CatalogDevice`

---

# Related Documentation

- [Architecture overview](README.md)
- [CatalogManager](CatalogManager.md)
- [DeviceCatalog](DeviceCatalog.md)
- [DeviceCatalogStore](DeviceCatalogStore.md)

`CatalogApi` is the V2 UI boundary for the shared catalog: it presents source-aware devices through a stable API model while keeping persistence and catalog rules behind `CatalogManager`.
