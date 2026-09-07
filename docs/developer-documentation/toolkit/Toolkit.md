# Developer Toolkit Reference

The **Developer Toolkit** of Homebridge HA Virtual Devices groups the scripts used to validate, prepare, publish, deploy, diagnose, and inspect the plugin during development and release.

The toolkit is designed to make the delivery process reproducible and to avoid manual divergence between local development, npm publication, GitHub release creation, and NAS deployment.

## Entry Points

The main npm commands are:

```text
npm run verify
npm run prepare-release
npm run release
npm run install-on-nas
npm run doctor
npm run logs
npm run dev
```

Equivalent `toolkit:*` aliases are also available for the main toolkit scripts.

## High-Level Workflow

The intended workflow is:

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
npm run release
    │
    ▼
npm run install-on-nas
```

For local development against the maintainer NAS, `npm run dev` automates deployment followed by diagnostic verification.

## Validation

### `npm run verify`

Runs the standard project verification chain:

```text
lint
  │
  ▼
build:all
  │
  ▼
git diff --check
```

It is the lightweight validation command to run before release preparation.

## Release Preparation

### `npm run prepare-release`

Executes:

```text
scripts/prepare-release.sh
```

The script verifies:

- required local tools;
- current Git branch;
- clean repository state;
- synchronization with GitHub;
- release notes preparation;
- lint and build quality checks;
- absence of generated repository changes after build.

It then:

- updates the working changelog;
- updates `package.json` and `package-lock.json`;
- prepares the release changelog entry;
- verifies that only the expected release files changed;
- creates the release-preparation commit;
- pushes that commit to GitHub.

At completion, the expected next step is:

```text
npm run release
```

## Release Publication

### `npm run release`

Executes:

```text
scripts/release.sh
```

Before publication, the script checks:

- required tools;
- Git branch and repository state;
- synchronization with GitHub;
- npm authentication;
- GitHub authentication;
- package version availability;
- release notes;
- lint and build validation;
- absence of generated changes after build;
- npm package contents using `npm pack --dry-run --json`.

After confirmation, it:

```text
npm publish
    │
    ▼
create Git tag
    │
    ▼
push branch and tag
    │
    ▼
create GitHub Release
```

The release script is therefore responsible for the official npm and GitHub publication phase.

## Complete Publication Orchestrator

### `npm run toolkit:publish`

Executes:

```text
scripts/publish.sh
```

`publish.sh` is the orchestration entry point for the complete publication cycle.

It delegates work to the specialized scripts:

```text
prepare-release.sh
        │
        ▼
release.sh
        │
        ▼
install-on-nas.sh
```

It does not replace the specialized scripts; it coordinates them.

## NAS Installation

### `npm run install-on-nas`

Executes:

```text
scripts/install-on-nas.sh
```

The installation process is specific to the maintainer development environment.

The script performs the local quality and packaging steps before transferring the generated package to the NAS.

The observed workflow includes:

```text
lint --fix
   │
   ▼
lint
   │
   ▼
build:all
   │
   ▼
npm pack --json
   │
   ▼
SSH transfer
   │
   ▼
Homebridge container detection
   │
   ▼
npm install inside container
   │
   ▼
Homebridge container restart
```

The deployment logic uses the shared container-detection helpers instead of relying on a fixed Homebridge container name.

Important environment defaults currently include:

```text
REMOTE_HOST=homebridge-nas
REMOTE_DIR=/tmp/homebridge-ha-virtual-devices-install
DOCKER_BIN=/Volume1/@apps/DockerEngine/dockerd/bin/docker
HOMEBRIDGE_PROJECT_DIR=/homebridge
```

These values may be overridden through environment variables.

## Diagnostic

### `npm run doctor`

Executes:

```text
scripts/doctor.sh
```

The diagnostic script validates both local and remote deployment prerequisites.

Its checks include:

- local tools;
- SSH connectivity;
- shared remote helper preparation;
- Homebridge container detection;
- Node.js;
- npm;
- Homebridge;
- installed plugin state.

The diagnostic relies on the same shared container-detection logic as deployment.

The current default remote values include:

```text
REMOTE_HOST=homebridge-nas
DOCKER_BIN=/Volume1/@apps/DockerEngine/dockerd/bin/docker
HOMEBRIDGE_STATE_DIR=/homebridge/ha-virtual-devices
```

## Logs

### `npm run logs`

Executes:

```text
scripts/logs.sh
```

The command connects through SSH, detects the Homebridge container, and exposes the Homebridge logs.

It supports optional text filtering.

Examples:

```text
npm run logs
npm run logs -- homekit
npm run logs -- ws
npm run logs -- device
npm run logs -- catalog
npm run logs -- event
npm run logs -- Terrasse
```

The filter is passed as free text.

This is intended for targeted diagnosis without manually locating the Homebridge container.

## Development Deployment

### `npm run dev`

Executes:

```text
scripts/dev.sh
```

The script currently orchestrates two steps:

```text
npm run install-on-nas
        │
        ▼
npm run doctor
```

Its purpose is to deploy the current working version to the development NAS and immediately validate the installation.

Because `install-on-nas` performs lint/build/packaging, `dev` is more than a simple restart helper.

## Shared Bash Library

Shared logic is centralized in:

```text
scripts/lib/common.sh
```

This library is used by the toolkit scripts for common concerns such as:

- command validation;
- Git validation;
- npm validation;
- structured console output;
- confirmation helpers;
- version handling;
- release utilities;
- Homebridge container detection.

Centralizing this logic avoids duplicating environment-specific behavior across deployment, diagnostics, and logs.

## Script Responsibilities

| Script | Responsibility |
|---|---|
| `dev.sh` | Deploy current work to NAS, then run diagnostics |
| `doctor.sh` | Validate local, SSH, Docker/Homebridge and plugin installation state |
| `install-on-nas.sh` | Build, package, transfer and install the plugin on the NAS |
| `logs.sh` | Open/filter Homebridge logs through automatic container detection |
| `prepare-release.sh` | Prepare version, changelog and release commit |
| `release.sh` | Publish npm package, Git tag and GitHub Release |
| `publish.sh` | Orchestrate the complete prepare → release → NAS deployment flow |

## npm Script Mapping

The current package exposes:

```text
verify
prepare-release
release
install-on-nas
logs
doctor
dev
```

and aliases:

```text
toolkit:prepare
toolkit:release
toolkit:install
toolkit:publish
toolkit:logs
toolkit:doctor
toolkit:dev
```

## Design Principles

The toolkit follows these principles:

```text
specialized scripts
       +
shared common library
       +
fail-fast validation
       +
reproducible builds
       +
explicit release steps
       +
automatic environment detection
```

Release logic and maintainer-specific deployment logic remain separated.

This allows official publication to remain reproducible while still supporting a convenient NAS development workflow.

## Related Documentation

- [`README.md`](README.md): toolkit overview
- [`GettingStarted.md`](GettingStarted.md): development environment setup
- [`Reference.md`](Reference.md): command/script reference
- [`ReleaseWorkflow.md`](ReleaseWorkflow.md): release sequence
- [`Deployment.md`](Deployment.md): NAS deployment
- [`Troubleshooting.md`](Troubleshooting.md): toolkit diagnosis
- [`PublicationPolicy.md`](PublicationPolicy.md): publication rules
- [`../architecture/README.md`](../architecture/README.md): plugin architecture
