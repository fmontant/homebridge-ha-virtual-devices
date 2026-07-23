# Developer Toolkit

The **Developer Toolkit** provides the scripts and documentation required to build, validate, release and deploy **Homebridge HA Virtual Devices**.

It was created to make every release reproducible, reduce manual operations and ensure that every published version follows the same quality standards.

---

## Background

The Developer Toolkit replaces a manual release workflow with a reproducible and automated process.

It centralizes the release scripts, validation steps and deployment utilities required to publish official project releases.

---

## Overview

The toolkit supports the complete release workflow:

```text
Development
      │
      ▼
prepare-release.sh
      │
      ▼
Git validation
      │
      ▼
release.sh
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
install-on-nas.sh
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
- standardize the release workflow.

---

## Toolkit Components

### Release Preparation

The `prepare-release.sh` script prepares a new project version.

Its responsibilities include:

- selecting the next version;
- validating Semantic Versioning;
- updating the project version;
- creating the release commit;
- pushing the changes to GitHub.

---

### Release

The `release.sh` script publishes an official project release.

Before publishing, it verifies:

- required tools;
- current Git branch;
- repository status;
- GitHub synchronization;
- npm authentication;
- version availability;
- code quality;
- project build;
- generated files;
- package contents.

After explicit confirmation, it:

- publishes the package to npm;
- creates the Git tag;
- pushes the tag to GitHub.

---

### NAS Deployment

The `install-on-nas.sh` script provides deployment utilities specific to the development environment.

NAS deployment intentionally remains separate from the generic release workflow because it depends on the maintainer's TerraMaster Homebridge installation.

---

### Shared Library

Shared Bash functions are centralized in:

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

Centralizing shared logic guarantees consistent behaviour across the toolkit scripts.

---

## Design Principles

The toolkit follows these design principles:

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
| [Getting Started](GettingStarted.md) | Preparing a development environment. |
| [Release Workflow](ReleaseWorkflow.md) | Preparing, publishing and verifying a release. |
| [Deployment](Deployment.md) | Deploying a published version to the development NAS. |
| [Reference](Reference.md) | Responsibilities of the toolkit scripts. |
| [Troubleshooting](Troubleshooting.md) | Diagnosing common development, release and deployment issues. |

---

## Related Documentation

- [Architecture](../architecture/README.md)
- [Architecture Decision Records](../adr/README.md)
- [Diagrams](../diagrams/README.md)

---

## Status

The Developer Toolkit is production-ready and is used for official releases of **Homebridge HA Virtual Devices**.

---

## Version

This documentation applies to the Developer Toolkit introduced with **Homebridge HA Virtual Devices 1.1.6**.

It will evolve together with the toolkit in future releases.
