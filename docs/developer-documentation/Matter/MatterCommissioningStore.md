# MatterCommissioningStore

`MatterCommissioningStore` is the file-based exchange layer used by the Matter commissioning workflow.

It persists one commissioning request and one commissioning response in separate JSON files so the UI-facing side and the Homebridge platform runtime can exchange commissioning work without requiring a direct in-memory call.

The Matter architecture described here belongs to the V2 development work. It does not describe the stable 1.3.7 release.

---

# Purpose

`MatterCommissioningStore` is responsible for:

- saving a commissioning request;
- loading the pending commissioning request;
- deleting the request file;
- saving a commissioning response;
- loading the latest commissioning response;
- deleting the response file;
- creating parent directories when necessary;
- writing JSON through a temporary file followed by rename;
- treating missing files as an absent request or response.

It does not perform Matter commissioning itself.

---

# Request Format

The commissioning request contract is:

```ts
export interface MatterCommissioningRequest {
  id: string;
  pairingCode: string;
  createdAt: string;
}
```

The fields are:

```text
id           request identifier
pairingCode  Matter sharing/pairing code
createdAt    request creation timestamp
```

The pairing code is part of the transient commissioning request and is therefore written using the restricted temporary-file mode described below.

---

# Response Format

The commissioning response contract is:

```ts
export interface MatterCommissioningResponse {
  id: string;
  success: boolean;
  completedAt: string;
  deviceId?: string;
  deviceName?: string;
  error?: string;
}
```

The response can represent either a successful commissioning result or an error.

A successful response can include:

```text
deviceId
deviceName
```

A failed response can include:

```text
error
```

The store persists the response but does not decide whether commissioning succeeded.

---

# Construction

The constructor receives two independent paths:

```ts
requestFilePath: string
responseFilePath: string
```

The store does not derive or hardcode these locations.

This keeps the persistence component independent from the platform's storage-layout decisions.

---

# Saving a Request

`saveRequest()` delegates to the generic JSON writer:

```ts
await this.writeJson(
  this.requestFilePath,
  request,
);
```

The request is therefore persisted in the configured request file.

---

# Loading a Request

`loadRequest()` delegates to:

```ts
this.readJson<MatterCommissioningRequest>(
  this.requestFilePath,
)
```

The result type is:

```ts
Promise<
  MatterCommissioningRequest |
  undefined
>
```

If the request file does not exist, the method returns `undefined`.

---

# Deleting a Request

`deleteRequest()` removes the request file with:

```ts
rm(
  this.requestFilePath,
  {
    force: true,
  },
)
```

Because `force` is enabled, deleting an already absent request file does not fail for that reason.

---

# Saving a Response

`saveResponse()` writes the response through the same generic JSON writer:

```ts
await this.writeJson(
  this.responseFilePath,
  response,
);
```

---

# Loading a Response

`loadResponse()` reads:

```ts
MatterCommissioningResponse
```

from the configured response file.

The result is:

```ts
Promise<
  MatterCommissioningResponse |
  undefined
>
```

A missing response file is represented by `undefined`.

---

# Deleting a Response

`deleteResponse()` removes the response file with:

```ts
rm(
  this.responseFilePath,
  {
    force: true,
  },
)
```

---

# Reading JSON

The private helper:

```ts
readJson<T>(
  filePath: string,
): Promise<T | undefined>
```

reads the complete file as UTF-8 text and parses it through:

```ts
JSON.parse(
  content,
)
```

The parsed result is treated as the requested generic type.

The current implementation does not perform additional runtime schema validation.

---

# Missing File Behavior

`readJson()` handles:

```text
ENOENT
```

specially.

If the file does not exist, it returns:

```ts
undefined
```

Other read errors and JSON parsing errors are rethrown.

This allows callers to distinguish:

```text
no pending request/response
```

from:

```text
a real persistence or parsing failure
```

---

# Writing JSON

The private helper:

```ts
writeJson(
  filePath: string,
  value: unknown,
): Promise<void>
```

first creates the parent directory:

```ts
mkdir(
  dirname(filePath),
  {
    recursive: true,
  },
)
```

It then serializes the value using:

```ts
JSON.stringify(
  value,
  null,
  2,
)
```

and appends a final newline.

---

# Temporary File Strategy

Writes go first to:

```ts
`${filePath}.tmp`
```

The temporary file is written using `writeFile()` and then moved into place through:

```ts
rename(
  temporaryFilePath,
  filePath,
)
```

The write flow is:

```text
create parent directory
        │
        ▼
serialize JSON
        │
        ▼
write <file>.tmp
        │
        ▼
rename to final path
```

This keeps the final file replacement separate from the JSON write itself.

The current implementation does not include local cleanup of a failed temporary file.

---

# File Permissions

The temporary request and response files are created with:

```ts
mode: 0o600
```

which grants read/write permission to the owner at creation time.

This is particularly relevant to the request file because it contains a Matter pairing code.

---

# Request / Response Exchange Pattern

Conceptually, the store supports the following file-based workflow:

```text
UI / commissioning initiator
          │
          ▼
saveRequest()
          │
          ▼
request JSON file
          │
          ▼
Platform runtime
          │
          ▼
loadRequest()
          │
          ▼
Matter commissioning
          │
          ▼
saveResponse()
          │
          ▼
response JSON file
          │
          ▼
UI reads result
```

The actual commissioning operation remains outside this store.

---

# Relationship with MatterProvider

`MatterProvider` owns the actual Matter commissioning operation through:

```ts
commission(
  pairingCode,
)
```

`MatterCommissioningStore` only persists the request and result exchanged around that operation.

It does not call `MatterProvider` directly.

---

# Relationship with Platform

The platform runtime can use the store to:

1. detect a pending commissioning request;
2. execute commissioning through the provider;
3. persist a success or failure response;
4. remove the processed request.

The store remains deliberately unaware of this orchestration.

---

# Separation from MatterDeviceNameStore

Both classes use small JSON files, but they serve different purposes.

`MatterCommissioningStore` persists transient commissioning exchange state:

```text
request
response
```

`MatterDeviceNameStore` persists longer-lived Matter custom-name mappings:

```text
uniqueId → name
```

They are separate persistence domains and should not be merged conceptually.

---

# Relationship with MatterController

`MatterController` owns the low-level Matter controller lifecycle and exposes the commissioning primitive.

The separation is:

```text
MatterCommissioningStore
    │
    └── persists request and response

MatterProvider
    │
    └── orchestrates commissioning

MatterController
    │
    └── performs the Matter commissioning operation
```

This keeps file persistence independent from the Matter protocol lifecycle.

---

# Error Behavior

The store handles missing files specially:

```text
ENOENT → undefined
```

Other read errors and JSON parsing errors are propagated.

For writes, errors from directory creation, file writing, or rename propagate to the caller.

The current implementation does not include local cleanup of a failed temporary file.

---

# Responsibilities

`MatterCommissioningStore` is responsible for:

- request persistence;
- response persistence;
- request deletion;
- response deletion;
- JSON reading;
- JSON writing;
- directory creation;
- temporary-file replacement.

It is not responsible for:

- validating the Matter pairing code;
- commissioning a Matter node;
- discovering the newly commissioned device;
- synchronizing the catalog;
- publishing HomeKit accessories;
- deciding whether commissioning succeeded or failed.

---

# Design Principles

## File-Based Decoupling

Commissioning requests and results are exchanged through files, allowing the UI-facing side and the platform runtime to remain decoupled.

## Explicit Request and Response Contracts

The request and response structures are separate and strongly typed.

## Missing Means No Work

An absent request or response file is represented by `undefined` rather than treated as an error.

## Write Before Replace

JSON content is written to a temporary file before the final file path is replaced.

## Restricted File Mode

Temporary files use owner-only read/write permissions because commissioning data can include a Matter pairing code.

## Clear Responsibility Boundaries

The store persists commissioning exchange data but does not perform or interpret the Matter operation itself.

---

# Related Components

- `MatterProvider`
- `MatterController`
- `MatterDeviceNameStore`
- Platform commissioning workflow

---

# Related Documentation

- [Matter](README.md)
- [MatterProvider](MatterProvider.md)
- [MatterController](MatterController.md)
- [MatterDeviceNameStore](MatterDeviceNameStore.md)
- [Platform](../architecture/Platform.md)

---

# Source File

The implementation documented here is:

```text
src/matter/commissioningStore.ts
```

`MatterCommissioningStore` is the V2 file-based commissioning exchange boundary. It persists a pending Matter request and its resulting success or failure response while leaving the actual Matter operation to the provider and controller layers.
