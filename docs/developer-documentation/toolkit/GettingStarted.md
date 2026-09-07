# Getting Started

This guide prepares a development environment for **Homebridge HA Virtual Devices V2**.

It is intended for developers who want to inspect, build, modify, or contribute to the plugin.

---

## Prerequisites

The local workstation requires:

- Git;
- Node.js;
- npm;
- a source-code editor.

Homebridge itself does not need to be installed locally when development and validation are performed against a remote Homebridge installation.

For the maintainer NAS workflow, additional requirements include:

- SSH access to the NAS;
- the configured `homebridge-nas` SSH host, unless `REMOTE_HOST` is overridden;
- Docker on the remote NAS;
- a running Homebridge container.

Official release operations additionally require the tools and authenticated accounts checked by the release scripts, including npm and GitHub CLI access.

---

## Clone the Repository

Clone the project and enter the repository:

```bash
git clone https://github.com/fmontant/homebridge-ha-virtual-devices.git
cd homebridge-ha-virtual-devices
```

---

## Install Dependencies

Install the root project dependencies:

```bash
npm install
```

The custom Homebridge UI has its own package:

```bash
cd homebridge-ui
npm install
cd ..
```

---

## Project Areas

The main development areas are:

```text
src/
├── accessories/
├── builders/
├── catalog/
├── factories/
├── homeassistant/
├── managers/
├── mappers/
├── matter/
├── models/
├── ui/
└── platform.ts

homebridge-ui/
└── src/

scripts/
├── dev.sh
├── doctor.sh
├── install-on-nas.sh
├── logs.sh
├── prepare-release.sh
├── publish.sh
├── release.sh
└── lib/
```

V2 supports both **Home Assistant** and **Matter** as device providers.

Provider-specific code converges on the shared catalog and HomeKit publication architecture documented under [`../architecture/`](../architecture/README.md).

---

## Build the Project

Build both the plugin and the custom UI:

```bash
npm run build:all
```

This runs the TypeScript plugin build and the UI build.

The individual build commands are:

```bash
npm run build
npm run build:ui
```

---

## Validate the Project

The preferred complete validation command is:

```bash
npm run verify
```

It runs:

```text
npm run lint
        │
        ▼
npm run build:all
        │
        ▼
git diff --check
```

A successful `verify` confirms that linting and both builds pass and that no whitespace errors are present in the Git diff.

Individual commands remain available when diagnosing a specific stage:

```bash
npm run lint
npm run build:all
```

---

## Development against the NAS

The maintainer development environment can deploy the current working project to the Homebridge NAS with:

```bash
npm run dev
```

The current `dev` workflow performs:

```text
npm run install-on-nas
        │
        ▼
npm run doctor
```

`install-on-nas` performs the build/package/deployment operation and automatically detects the Homebridge Docker container.

`doctor` then verifies the resulting installation.

This workflow is specific to the configured development NAS and is not a general requirement for contributors.

---

## Diagnose the NAS Environment

Run:

```bash
npm run doctor
```

to validate the local prerequisites, SSH connectivity, remote Homebridge container, and installed environment.

The toolkit uses shared container-detection logic rather than requiring a fixed Homebridge container name.

---

## Inspect Homebridge Logs

Use:

```bash
npm run logs
```

to access the Homebridge logs through the development NAS.

An optional text filter can be supplied:

```bash
npm run logs -- matter
npm run logs -- catalog
npm run logs -- Terrasse
```

---

## Configuration during V2 Development

V2 supports three valid provider configurations:

```text
Home Assistant only
Matter only
Home Assistant + Matter
```

At least one provider must be enabled by the UI configuration.

For backward compatibility, configurations created before the provider-selection options existed are interpreted as:

```text
Home Assistant enabled
Matter disabled
```

Home Assistant requires its URL and access token when that provider is enabled.

Matter commissioning is available from the custom UI when the Matter provider is enabled.

---

## Release Commands

Development validation and official publication are separate operations.

Do not use release commands merely to test a development build.

The official sequence is documented in [`ReleaseWorkflow.md`](ReleaseWorkflow.md) and uses:

```text
npm run prepare-release
npm run release
```

The complete toolkit orchestrator is also exposed as:

```bash
npm run toolkit:publish
```

and includes the maintainer NAS installation after the official release stages.

---

## Recommended First Validation

After installing dependencies, a new development checkout should first pass:

```bash
npm run verify
```

If working with the configured maintainer NAS, continue with:

```bash
npm run doctor
```

before relying on remote deployment commands.

---

## Next Steps

Continue with:

- [Toolkit Reference](Toolkit.md)
- [Release Workflow](ReleaseWorkflow.md)
- [Deployment](Deployment.md)
- [Reference](Reference.md)
- [Troubleshooting](Troubleshooting.md)

For implementation details:

- [Architecture](../architecture/README.md)
- [Matter](../Matter/README.md)
- [Architecture Decision Records](../adr/README.md)
