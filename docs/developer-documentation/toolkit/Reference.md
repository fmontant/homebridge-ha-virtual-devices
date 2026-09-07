# Developer Toolkit Reference

This document is the command and script reference for the **Homebridge HA Virtual Devices** Developer Toolkit.

It describes the current toolkit entry points and the responsibility of each script.

---

## Toolkit Layout

The main scripts are located in:

```text
scripts/
├── dev.sh
├── doctor.sh
├── install-on-nas.sh
├── logs.sh
├── prepare-release.sh
├── publish.sh
├── release.sh
└── lib/
    └── common.sh
```

The project exposes these scripts primarily through npm commands.

---

## Command Summary

| npm command | Script / action | Purpose |
|---|---|---|
| `npm run verify` | npm command chain | Lint, build the complete project, then run `git diff --check`. |
| `npm run prepare-release` | `prepare-release.sh` | Prepare the next official release. |
| `npm run release` | `release.sh` | Publish the prepared version to npm and GitHub. |
| `npm run install-on-nas` | `install-on-nas.sh` | Build, package, and deploy the current project to the development NAS. |
| `npm run doctor` | `doctor.sh` | Diagnose the local and remote Homebridge environment. |
| `npm run logs` | `logs.sh` | Access and optionally filter Homebridge logs. |
| `npm run dev` | `dev.sh` | Deploy to the NAS and run diagnostics. |
| `npm run toolkit:publish` | `publish.sh` | Orchestrate preparation, release, and NAS deployment. |

Aliases are also available:

```text
toolkit:prepare
toolkit:release
toolkit:install
toolkit:logs
toolkit:doctor
toolkit:dev
```

---

## `npm run verify`

### Purpose

Run the standard project validation without preparing or publishing a release.

### Execution

```text
npm run lint
      │
      ▼
npm run build:all
      │
      ▼
git diff --check
```

### Typical Usage

Use during development and before beginning a release workflow.

---

## `prepare-release.sh`

### npm Entry Point

```bash
npm run prepare-release
```

or:

```bash
npm run toolkit:prepare
```

### Purpose

Prepare the repository and version metadata for the next official release.

### Responsibilities

The current script:

- checks required tools;
- checks the Git branch;
- requires a clean repository;
- verifies synchronization with GitHub;
- prepares release notes;
- runs lint/build quality validation;
- verifies that the build did not modify tracked content;
- updates the working changelog;
- updates the package version;
- updates the release changelog entry;
- verifies the expected modified release files;
- creates the release-preparation commit;
- pushes that commit to GitHub.

### Important Boundary

`prepare-release.sh` does **not** perform the npm publication.

After successful completion, the next stage is:

```bash
npm run release
```

---

## `release.sh`

### npm Entry Point

```bash
npm run release
```

or:

```bash
npm run toolkit:release
```

### Purpose

Publish an already prepared release.

### Pre-Publication Checks

The current script verifies:

- required tools;
- Git branch;
- clean repository;
- GitHub synchronization;
- npm authentication;
- GitHub authentication;
- version availability;
- release notes;
- lint and build;
- absence of generated repository changes;
- npm package contents with a dry-run package build.

### Publication Actions

After confirmation, it:

```text
npm publish
    │
    ▼
create annotated Git tag
    │
    ▼
push branch and tag
    │
    ▼
create GitHub Release
```

### Important Boundary

The Git tag belongs to the **release** stage, not to `prepare-release.sh`.

---

## `publish.sh`

### npm Entry Point

```bash
npm run toolkit:publish
```

### Purpose

Orchestrate the complete maintainer publication workflow.

### Execution

```text
prepare-release.sh
        │
        ▼
release.sh
        │
        ▼
install-on-nas.sh
```

`publish.sh` is an orchestrator. The implementation of each phase remains in its specialized script.

---

## `install-on-nas.sh`

### npm Entry Point

```bash
npm run install-on-nas
```

or:

```bash
npm run toolkit:install
```

### Purpose

Build and install the current project on the maintainer's remote Homebridge NAS.

### Local Phase

The script performs project validation and packaging, including:

```text
npm run lint -- --fix
npm run lint
npm run build:all
npm pack --json
```

### Remote Phase

The package and required deployment helpers are transferred through SSH.

The remote installation then uses Docker to:

- detect the Homebridge container;
- copy/install the package;
- restart the Homebridge container;
- inspect the resulting installation state.

### Environment Defaults

The script currently defines defaults including:

```text
REMOTE_HOST=homebridge-nas
REMOTE_DIR=/tmp/homebridge-ha-virtual-devices-install
DOCKER_BIN=/Volume1/@apps/DockerEngine/dockerd/bin/docker
HOMEBRIDGE_PROJECT_DIR=/homebridge
```

They can be overridden through the corresponding environment variables.

### Important Boundary

Despite its name, this command is useful for **development builds as well as post-release installation**. It is not limited to packages already published on npm.

---

## `doctor.sh`

### npm Entry Point

```bash
npm run doctor
```

or:

```bash
npm run toolkit:doctor
```

### Purpose

Diagnose the development Homebridge environment.

### Responsibilities

The current script checks:

- required local tools;
- SSH connectivity;
- availability of the shared helper library remotely;
- automatic Homebridge container detection;
- software versions/state inside the Homebridge environment;
- plugin installation/state.

Current environment defaults include:

```text
REMOTE_HOST=homebridge-nas
REMOTE_DIR=/tmp/homebridge-ha-virtual-devices-install
DOCKER_BIN=/Volume1/@apps/DockerEngine/dockerd/bin/docker
HOMEBRIDGE_PROJECT_DIR=/homebridge
HOMEBRIDGE_STATE_DIR=/homebridge/ha-virtual-devices
```

---

## `logs.sh`

### npm Entry Point

```bash
npm run logs
```

or:

```bash
npm run toolkit:logs
```

### Purpose

Access Homebridge logs without manually identifying the current Docker container.

### Filtering

The command accepts optional free text:

```bash
npm run logs -- homekit
npm run logs -- ws
npm run logs -- device
npm run logs -- catalog
npm run logs -- event
npm run logs -- Terrasse
```

The script establishes SSH access, prepares the common helper remotely, detects the Homebridge container, and connects to its logs.

---

## `dev.sh`

### npm Entry Point

```bash
npm run dev
```

or:

```bash
npm run toolkit:dev
```

### Purpose

Provide the standard maintainer development deployment cycle.

### Execution

```text
npm run install-on-nas
        │
        ▼
npm run doctor
```

A successful `dev` run therefore means that deployment completed and the subsequent diagnostic completed successfully.

---

## `lib/common.sh`

### Purpose

Provide shared Bash functionality to the toolkit scripts.

It is an internal library and is not intended to be executed as a standalone toolkit command.

### Role

The library centralizes behavior reused by multiple scripts, including validation, output helpers, Git/npm operations, and remote Homebridge/Docker support.

In particular, deployment, diagnostics, and logs reuse shared Homebridge container-detection logic instead of relying on a fixed generated container name.

---

## Build Commands Used by the Toolkit

The toolkit builds on the standard npm commands:

```text
npm run build
npm run build:ui
npm run build:all
npm run lint
npm run lint:fix
npm run verify
```

Current definitions include:

```text
build      → TypeScript plugin build
build:ui   → custom UI build and publication into homebridge-ui/public
build:all  → build + build:ui
lint       → ESLint with zero warnings allowed
lint:fix   → ESLint automatic fixes
verify     → lint + build:all + git diff --check
```

---

## Which Command Should I Use?

For normal code validation:

```bash
npm run verify
```

For deploying current development work to the configured NAS and validating it:

```bash
npm run dev
```

For diagnosing the NAS installation without deploying:

```bash
npm run doctor
```

For examining runtime behavior:

```bash
npm run logs -- <filter>
```

For preparing an official release:

```bash
npm run prepare-release
```

For publishing that prepared release:

```bash
npm run release
```

For the complete maintainer publication sequence:

```bash
npm run toolkit:publish
```

---

## Related Documentation

- [Toolkit Overview](README.md)
- [Getting Started](GettingStarted.md)
- [Release Workflow](ReleaseWorkflow.md)
- [Deployment](Deployment.md)
- [Troubleshooting](Troubleshooting.md)
- [Publication Policy](PublicationPolicy.md)
