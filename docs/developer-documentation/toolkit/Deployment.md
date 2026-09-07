# Deployment

This guide describes the current deployment workflow used to install **Homebridge HA Virtual Devices** on the maintainer's Homebridge NAS.

The Developer Toolkit supports deploying the **current local working project**. A prior npm publication is not required.

---

## Deployment Scope

There are two distinct concepts:

```text
official publication
        │
        └── npm / Git / GitHub

development NAS deployment
        │
        └── local source → package → NAS → Homebridge
```

`npm run install-on-nas` belongs to the second workflow.

It can therefore be used while developing an unreleased version without changing the stable version published on npm.

---

## Standard Development Deployment

Run:

```bash
npm run install-on-nas
```

This executes:

```text
scripts/install-on-nas.sh
```

The script performs the complete local-package deployment workflow.

---

## Local Validation and Packaging

Before transferring anything to the NAS, the script runs the project quality and build steps.

The current sequence includes:

```text
npm run lint -- --fix
        │
        ▼
npm run lint
        │
        ▼
npm run build:all
        │
        ▼
npm pack --json
```

The resulting npm package is therefore built from the current local project rather than downloaded from the npm registry.

If one of these validation steps fails, deployment must not be considered successful.

---

## SSH Transfer

The deployment script connects to the configured NAS through SSH.

The current default is:

```text
REMOTE_HOST=homebridge-nas
```

The temporary remote deployment directory defaults to:

```text
/tmp/homebridge-ha-virtual-devices-install
```

These values are configurable through environment variables.

---

## Homebridge Container Detection

The toolkit does not depend on a fixed generated Homebridge container name.

Instead, shared logic detects the active Homebridge container at deployment time.

Conceptually:

```text
SSH to NAS
    │
    ▼
locate Docker
    │
    ▼
detect Homebridge container
    │
    ▼
use detected container
```

This avoids coupling deployment to names such as a particular:

```text
homebridge-homebridge_vXX
```

which may change when the Homebridge installation is recreated or upgraded.

The same detection approach is reused by the diagnostic and log tools.

---

## Docker Environment

The current maintainer NAS defaults include:

```text
DOCKER_BIN=/Volume1/@apps/DockerEngine/dockerd/bin/docker
HOMEBRIDGE_PROJECT_DIR=/homebridge
```

The Docker executable path is explicitly configurable because the TerraMaster installation does not rely on a generic assumption that `docker` is available through the remote shell `PATH`.

---

## Installation inside Homebridge

After transfer and container detection, the deployment process installs the generated local npm package in the Homebridge environment.

The high-level flow is:

```text
local source
    │
    ▼
lint / build
    │
    ▼
npm package
    │
    ▼
SSH transfer
    │
    ▼
detected Homebridge container
    │
    ▼
npm install
    │
    ▼
container restart
```

The deployment script handles the restart as part of the workflow.

A separate manual Homebridge restart should therefore not normally be required after a successful `install-on-nas` execution.

---

## Development Deployment with Verification

For the normal maintainer development cycle, use:

```bash
npm run dev
```

`dev.sh` performs:

```text
npm run install-on-nas
        │
        ▼
npm run doctor
```

This is the preferred workflow when the objective is not merely to install the package but also to verify the resulting environment immediately afterward.

---

## Diagnostic Verification

The diagnostic can also be run independently:

```bash
npm run doctor
```

It verifies the local/remote prerequisites and inspects the Homebridge environment after automatic container detection.

This is useful when:

- deployment appears to have succeeded but runtime state needs confirmation;
- the Homebridge container has changed;
- the installed plugin or Homebridge environment needs to be checked;
- SSH or Docker access is suspected.

---

## Runtime Logs

After deployment, inspect Homebridge logs with:

```bash
npm run logs
```

or filter them:

```bash
npm run logs -- matter
npm run logs -- catalog
npm run logs -- homekit
npm run logs -- Terrasse
```

The logs command uses the same SSH and container-detection approach.

---

## Environment Overrides

The deployment toolkit uses environment variables so that maintainer-specific defaults can be overridden.

Current deployment defaults include:

```text
REMOTE_HOST=homebridge-nas
REMOTE_DIR=/tmp/homebridge-ha-virtual-devices-install
DOCKER_BIN=/Volume1/@apps/DockerEngine/dockerd/bin/docker
HOMEBRIDGE_PROJECT_DIR=/homebridge
```

For example, a different SSH host can be supplied without changing the script itself by overriding `REMOTE_HOST`.

The scripts remain the source of truth for the complete set of supported environment variables.

---

## Published npm Versions

Installing a version directly from npm is a normal Homebridge/npm installation operation, but it is distinct from the project's `install-on-nas` development workflow.

The Developer Toolkit's NAS installer packages the local checkout itself.

This distinction is important during V2 development:

```text
stable npm release
        ≠
local development deployment
```

A V2 development build can therefore be tested on the NAS while the stable npm release remains unchanged.

---

## Verification after Deployment

A successful development deployment should be followed by checks appropriate to the change being tested.

At minimum:

```text
Homebridge container running
        │
        ▼
plugin installed
        │
        ▼
plugin starts correctly
        │
        ▼
configuration/UI available
        │
        ▼
expected runtime behavior
```

`npm run dev` automates the installation plus the toolkit diagnostic, while functional plugin behavior must still be validated according to the feature under development.

---

## Failure Handling

If deployment fails, do not immediately reinstall or alter persistent plugin state.

First determine which stage failed:

```text
local validation
package generation
SSH connection
Docker access
container detection
package installation
container restart
runtime startup
```

Use:

```bash
npm run doctor
```

for environment diagnosis and:

```bash
npm run logs -- <filter>
```

for runtime investigation.

See [`Troubleshooting.md`](Troubleshooting.md) for the broader toolkit troubleshooting procedure.

---

## Relationship to Release

Deployment does not publish a release.

The official release process remains:

```text
npm run prepare-release
        │
        ▼
npm run release
```

NAS deployment can be performed independently during development or after publication.

The complete maintainer orchestrator:

```bash
npm run toolkit:publish
```

combines preparation, official release, and NAS installation when that complete sequence is desired.

---

## Related Documentation

- [Toolkit Overview](README.md)
- [Toolkit Reference](Toolkit.md)
- [Getting Started](GettingStarted.md)
- [Release Workflow](ReleaseWorkflow.md)
- [Troubleshooting](Troubleshooting.md)
