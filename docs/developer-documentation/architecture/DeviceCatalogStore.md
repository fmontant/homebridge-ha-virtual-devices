# DeviceCatalogStore

`DeviceCatalogStore` is the persistence layer used by `DeviceCatalog`.

Its responsibility is deliberately narrow: read and write the persistent catalog file safely, validate loaded data, and normalize persisted preferences for backward compatibility.

It does not implement discovery, synchronization, publication, or HomeKit behavior.

---

# Purpose

`DeviceCatalogStore` provides:

- loading the catalog from disk;
- validating persisted entries;
- normalizing stored preferences;
- serializing save operations;
- writing catalog updates safely through a temporary file;
- handling a missing catalog file as an empty catalog.

`DeviceCatalog` owns catalog behavior. `DeviceCatalogStore` owns file persistence.

---

# Construction

The store receives the target catalog file path:

```ts
constructor(
  private readonly filePath: string,
) { }
```

It also maintains a write queue:

```ts
private saveQueue:
  Promise<void> =
    Promise.resolve();
```

This queue ensures save operations are executed sequentially.

---

# Loading

The main read method is:

```ts
public async load():
  Promise<CatalogDevice[]>
```

The method reads the catalog file as UTF-8 text:

```ts
await readFile(
  this.filePath,
  'utf8',
);
```

The content is parsed as JSON.

If the parsed value is not an array, the store returns:

```ts
[]
```

The remaining entries are:

1. filtered through `isCatalogDevice()`;
2. normalized through `normalizeCatalogDevice()`.

Conceptually:

```text
Persistent JSON file
        │
        ▼
     readFile()
        │
        ▼
     JSON.parse()
        │
        ▼
     Array check
        │
        ▼
isCatalogDevice()
        │
        ▼
normalizeCatalogDevice()
        │
        ▼
 CatalogDevice[]
```

---

# Missing File Behavior

If the catalog file does not exist, `load()` does not fail.

`isFileNotFoundError()` checks for:

```ts
error.code === 'ENOENT'
```

and `load()` returns an empty array.

This allows the plugin to start normally before the catalog file has been created.

Other read or parse errors are rethrown.

---

# Persisted Entry Validation

`isCatalogDevice()` performs a structural validation before an entry is accepted.

The value must be a non-null object and include:

```text
id            string
source        string
sourceId      string
name          string
state         string
capabilities  array
metadata      non-null object
preferences   non-null object
timestamps    non-null object
```

Entries that do not satisfy these minimum structural requirements are ignored during loading.

The validation is intentionally structural. It does not perform exhaustive field-by-field semantic validation of every nested property.

---

# Preference Normalization

`normalizeCatalogDevice()` provides compatibility for persisted catalog entries whose preference object may not contain every current field.

The stored preferences are interpreted as:

```ts
Partial<DevicePreferences>
```

Defaults are then applied:

```ts
enabled:
  storedPreferences.enabled ??
  true

favorite:
  storedPreferences.favorite ??
  false

hidden:
  storedPreferences.hidden ??
  false

archived:
  storedPreferences.archived ??
  false
```

Optional values are preserved:

```ts
room:
  storedPreferences.room

homeKitName:
  storedPreferences.homeKitName
```

This means an older persisted catalog can be loaded even when newer preference fields were not present when it was written.

---

# Saving

The public save method is:

```ts
public save(
  devices: CatalogDevice[],
): Promise<void>
```

The catalog array is serialized with:

```ts
JSON.stringify(
  devices,
  null,
  2,
);
```

so the persisted file is human-readable JSON with two-space indentation.

The physical write is not started directly.

Instead, each save is chained onto `saveQueue`.

---

# Serialized Write Queue

The store initializes:

```ts
private saveQueue:
  Promise<void> =
    Promise.resolve();
```

For each save:

```ts
const saveOperation =
  this.saveQueue.then(
    () =>
      this.writeCatalog(
        content,
      ),
  );
```

The queue is then advanced with:

```ts
this.saveQueue =
  saveOperation.catch(
    () => undefined,
  );
```

and the original `saveOperation` is returned to the caller.

This gives two useful properties:

1. saves are executed sequentially;
2. one failed save does not permanently block later saves.

The caller still receives the failure of its own save operation.

Conceptually:

```text
save A ─────► write A
                 │
save B ──────────┘────► write B
                           │
save C ────────────────────┘────► write C
```

---

# Safe File Replacement

`writeCatalog()` performs the actual disk write.

The target directory is created first:

```ts
await mkdir(
  directory,
  {
    recursive: true,
  },
);
```

A unique temporary file path is then generated from:

- the target file path;
- the current process id;
- a random UUID.

Conceptually:

```text
device-catalog.json
        │
        └── temporary path:
            device-catalog.json.<pid>.<uuid>.tmp
```

The serialized content is written to this temporary file first.

A trailing newline is added:

```ts
`${content}\n`
```

The temporary file is then renamed to the final catalog path.

```text
write temporary file
        │
        ▼
      rename
        │
        ▼
 final catalog file
```

This avoids writing the final catalog file incrementally.

---

# Write Failure Cleanup

If writing or renaming fails, the store attempts to remove the temporary file:

```ts
await rm(
  temporaryFilePath,
  {
    force: true,
  },
).catch(
  () => undefined,
);
```

Cleanup failure is ignored so that the original write error can be rethrown.

The original persistence error therefore remains visible to the caller.

---

# Relationship with DeviceCatalog

The relationship is intentionally simple:

```text
DeviceCatalog
      │
      ├── load()
      └── save()
            │
            ▼
   DeviceCatalogStore
            │
            ▼
   persistent JSON file
```

`DeviceCatalog` manages:

- in-memory devices;
- synchronization;
- missing-device rules;
- preferences;
- publication eligibility.

`DeviceCatalogStore` manages:

- disk reads;
- disk writes;
- structural validation;
- preference normalization;
- write serialization;
- temporary-file replacement.

---

# Relationship with V2 Providers

`DeviceCatalogStore` is source-neutral.

It does not contain Home Assistant-specific or Matter-specific logic.

Provider source separation is handled higher in the catalog synchronization path.

The store simply persists whatever valid `CatalogDevice` objects it receives.

```text
Home Assistant ─┐
                │
Matter ─────────┼──► DeviceCatalog
                │         │
                └─────────┘
                          ▼
                 DeviceCatalogStore
                          │
                          ▼
                 device-catalog.json
```

---

# Responsibilities

`DeviceCatalogStore` is responsible for:

- reading the catalog file;
- returning an empty catalog when the file does not yet exist;
- parsing JSON;
- rejecting structurally invalid entries;
- normalizing persisted preferences;
- serializing catalog arrays;
- sequencing save operations;
- creating the parent directory when needed;
- writing through a unique temporary file;
- replacing the final file through `rename()`;
- cleaning temporary files after failed writes.

It is **not** responsible for:

- device discovery;
- source-aware synchronization;
- missing-device decisions;
- preference semantics;
- HomeKit publication;
- Matter commissioning;
- Home Assistant WebSocket events;
- UI behavior.

---

# Design Principles

## Narrow Persistence Responsibility

The store only knows how to persist and restore catalog data.

Business rules remain in `DeviceCatalog` and higher layers.

---

## Backward-Compatible Loading

Missing preference fields receive safe defaults during load.

This allows persisted catalogs created by older versions to remain usable.

---

## Sequential Saves

The promise queue prevents overlapping write operations from racing against each other.

---

## Safe Replacement

The final catalog file is replaced only after the complete new content has been written to a temporary file.

---

## Recoverable Save Queue

A failed write is propagated to its caller but swallowed only for the internal queue continuation, allowing later save operations to proceed.

---

# Extending DeviceCatalogStore

Changes belong here when they concern:

- persistent file format;
- load validation;
- migration or normalization of stored values;
- write sequencing;
- safe file replacement.

Changes to synchronization behavior, publication rules, or provider semantics should not be implemented here.

When adding new persistent fields, review:

- `CatalogDevice`;
- `isCatalogDevice()` if the new field must be required;
- `normalizeCatalogDevice()` if backward-compatible defaults are needed.

---

# Related Components

- `DeviceCatalog`
- `CatalogManager`
- `CatalogDevice`
- `DevicePreferences`

---

# Related Documentation

- [Architecture overview](README.md)
- [DeviceCatalog](DeviceCatalog.md)
- [CatalogManager](CatalogManager.md)
- [Platform](Platform.md)

`DeviceCatalogStore` is the low-level persistence boundary of the shared V2 catalog. It keeps storage concerns isolated from discovery and synchronization while providing sequential and safe catalog writes.
