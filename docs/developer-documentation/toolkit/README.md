# Developer Toolkit

The **Developer Toolkit** provides the scripts and documentation required to build, validate, release and deploy **Homebridge HA Virtual Devices**.

It was created to make every release reproducible, reduce manual operations and ensure that every published version follows the same quality standards.

---

## Background

The Developer Toolkit was introduced to replace a manual release workflow with a fully reproducible and automated process.

It centralizes the release scripts, validation steps and deployment utilities required to publish official releases of the project.

---

## Overview

The toolkit automates the complete release workflow:

```text
Development
      │
      ▼
prepare-release
      │
      ▼
Git validation
      │
      ▼
Release validation
      │
      ▼
npm publication
      │
      ▼
Git tag creation
      │
      ▼
GitHub publication
      │
      ▼
NAS deployment (optional)
```

---

## Objectives

The toolkit has four primary objectives:

- automate repetitive development tasks;
- prevent common release mistakes;
- guarantee reproducible releases;
- standardize the development workflow.

---

## Toolkit Components

### Release Preparation

Prepares a new project version.

Responsibilities include:

- selecting the next version;
- validating Semantic Versioning;
- updating `package.json`;
- creating the release commit;
- pushing changes to GitHub.

---

### Release

Publishes an official project release.

Before publishing, the toolkit automatically verifies:

- required tools;
- current Git branch;
- repository status;
- GitHub synchronization;
- npm authentication;
- version availability;
- code quality (lint);
- project build;
- generated files;
- package contents.

After confirmation it automatically:

- publishes the package to npm;
- creates the Git tag;
- publishes the tag to GitHub.

---

### NAS Deployment

Provides deployment utilities specific to the development environment.

This component intentionally remains separate from the generic release workflow because it depends on the author's TerraMaster Homebridge installation.

---

### Shared Library

All shared Bash functions are centralized in:

```text
scripts/lib/common.sh
```

This library provides:

- console output helpers;
- Git validation;
- npm validation;
- version management;
- confirmation prompts;
- quality checks;
- common utilities.

Centralizing shared logic guarantees consistent behaviour across every toolkit script.

---

## Design Principles

The toolkit follows a small number of design principles:

- one responsibility per script;
- shared code in a single location;
- fail fast on unexpected situations;
- explicit confirmation before publication;
- deterministic release process;
- readable console output;
- reproducible builds.

---

## Documentation

| Document | Description |
|----------|-------------|
| GettingStarted.md | Installing and using the toolkit. |
| Architecture.md | Internal architecture and design choices. |
| ReleaseProcess.md | Complete release workflow. |
| InstallOnNAS.md | Deploying a package to the development NAS. |
| BashErrorHandling.md | Bash error handling strategy. |

---

## Related Documentation

- [Architecture](../architecture/README.md)
- [Architecture Decision Records](../adr/README.md)
- [Diagrams](../diagrams/README.md)

---

## Status

The Developer Toolkit is considered production-ready and is used for every official release of **Homebridge HA Virtual Devices**.

---

## Version

This documentation applies to the Developer Toolkit introduced with **Homebridge HA Virtual Devices 1.1.6**.

It will evolve together with the toolkit in future releases.