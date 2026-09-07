# Developer Toolkit

The **Developer Toolkit** provides the scripts and documentation used to validate, prepare, publish, deploy, diagnose, and inspect **Homebridge HA Virtual Devices**.

Its purpose is to make development and release operations reproducible while keeping official publication separate from the maintainer-specific NAS workflow.

---

## Overview

The toolkit currently covers four complementary workflows:

```text
Quality validation
    │
    └── npm run verify

Release
    │
    ├── npm run prepare-release
    └── npm run release

NAS development / deployment
    │
    ├── npm run install-on-nas
    ├── npm run dev
    └── npm run doctor

Diagnostics
    │
    ├── npm run doctor
    └── npm run logs
```

A complete orchestrated publication flow is also available through:

```text
npm run toolkit:publish
```

---

## Main Commands

| Command | Purpose |
|---|---|
| `npm run verify` | Run lint, complete build, and `git diff --check`. |
| `npm run prepare-release` | Prepare the version, changelog, release commit, and push it to GitHub. |
| `npm run release` | Validate and publish the package to npm, create the Git tag, and create the GitHub Release. |
| `npm run install-on-nas` | Build, package, transfer, and install the current project on the development NAS. |
| `npm run doctor` | Diagnose the local/remote Homebridge development installation. |
| `npm run logs` | Access Homebridge logs, optionally filtered by text. |
| `npm run dev` | Deploy to the NAS and immediately run the diagnostic. |
| `npm run toolkit:publish` | Orchestrate preparation, official release, and NAS installation. |

Toolkit aliases are also exposed for the specialized scripts:

```text
toolkit:prepare
toolkit:release
toolkit:install
toolkit:logs
toolkit:doctor
toolkit:dev
```

---

## Release Workflow

The normal official release path is:

```text
Development
    │
    ▼
npm run verify
    │
    ▼
npm run prepare-release
    │
    ▼
release preparation commit
    │
    ▼
npm run release
    │
    ├── npm publication
    ├── Git tag
    └── GitHub Release
```

NAS installation is a separate environment-specific operation and is not required to define an npm/GitHub release.

The complete maintainer workflow can nevertheless be orchestrated by `scripts/publish.sh`.

---

## Release Preparation

`scripts/prepare-release.sh` is responsible for preparing the repository for an official release.

It verifies the development environment and repository state, prepares the release notes, runs quality checks, updates the version and changelog, verifies the expected modified files, creates the preparation commit, and pushes that commit to GitHub.

The expected next command after successful preparation is:

```text
npm run release
```

---

## Release Publication

`scripts/release.sh` performs the official publication phase.

Before publishing, it validates:

- required tools;
- Git branch and repository state;
- GitHub synchronization;
- npm authentication;
- GitHub authentication;
- version availability;
- release notes;
- lint and build;
- generated repository state;
- npm package contents.

After confirmation it publishes to npm, creates and pushes the Git tag, and creates the corresponding GitHub Release.

---

## Complete Publication Orchestrator

`scripts/publish.sh` is the high-level toolkit orchestrator.

It delegates the complete sequence to the specialized scripts:

```text
prepare-release.sh
        │
        ▼
release.sh
        │
        ▼
install-on-nas.sh
```

The specialized scripts remain independently usable.

---

## NAS Deployment

`scripts/install-on-nas.sh` handles deployment to the maintainer's Homebridge installation.

Its workflow includes local lint/build validation, npm package creation, SSH transfer, automatic Homebridge container detection, installation inside the container, and container restart.

The deployment logic deliberately remains separate from the generic release process because the NAS, SSH alias, Docker path, and Homebridge container environment are specific to the development installation.

---

## Development Deployment

`scripts/dev.sh` provides the convenient development workflow:

```text
npm run install-on-nas
        │
        ▼
npm run doctor
```

It deploys the current working project to the NAS and then verifies the resulting installation.

---

## Diagnostics

### Doctor

`scripts/doctor.sh` checks the local and remote environment used by the development toolkit.

It verifies the required tools, SSH access, Homebridge container discovery, and the software/plugin state inside the container.

### Logs

`scripts/logs.sh` connects to the Homebridge logs after automatically locating the Homebridge container.

It supports optional free-text filtering, for example:

```text
npm run logs -- homekit
npm run logs -- catalog
npm run logs -- Terrasse
```

---

## Automatic Homebridge Container Detection

Deployment, diagnostics, and log access reuse shared Homebridge container-detection logic.

The toolkit therefore does not depend on a hard-coded container instance name such as a particular `homebridge-homebridge_vXX` value.

This is important because the generated Docker container name may change when the Homebridge installation is recreated or upgraded.

---

## Shared Library

Shared Bash functionality is centralized in:

```text
scripts/lib/common.sh
```

The common library provides reusable validation and environment helpers used by the specialized toolkit scripts.

This keeps Git/npm validation, console behavior, and Homebridge/Docker environment handling consistent across commands.

---

## Design Principles

The toolkit follows these principles:

- one clear responsibility per specialized script;
- common behavior centralized in shared helpers;
- fail fast when prerequisites are not satisfied;
- validate before modifying or publishing;
- explicit official release stages;
- reproducible package generation;
- automatic Homebridge environment detection where appropriate;
- separation between generic publication and maintainer-specific NAS deployment.

---

## Documentation

| Document | Description |
|---|---|
| [Toolkit](Toolkit.md) | Detailed reference for the current toolkit commands and scripts. |
| [Getting Started](GettingStarted.md) | Preparing the development environment. |
| [Release Workflow](ReleaseWorkflow.md) | Preparing, publishing, and verifying a release. |
| [Deployment](Deployment.md) | Development NAS deployment workflow. |
| [Reference](Reference.md) | Toolkit command and script reference. |
| [Troubleshooting](Troubleshooting.md) | Diagnosing development, release, and deployment problems. |
| [Publication Policy](PublicationPolicy.md) | Rules governing official publication. |

Release-note templates are also available in this directory for English and French GitHub releases.

---

## Related Documentation

- [Developer Documentation](../README.md)
- [Architecture](../architecture/README.md)
- [Architecture Decision Records](../adr/README.md)
- [Diagrams](../diagrams/README.md)
- [Matter](../Matter/README.md)

---

## Current Status

The toolkit is the maintained development and release workflow for **Homebridge HA Virtual Devices**.

This documentation describes the current toolkit behavior and should evolve with the scripts rather than remain tied to the version in which the toolkit was originally introduced.
