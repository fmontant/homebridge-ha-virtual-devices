# Troubleshooting

This guide describes how to diagnose problems in the **Homebridge HA Virtual Devices** Developer Toolkit.

The objective is to identify the failing stage before changing the repository, NAS installation, or persistent plugin state.

---

## Diagnostic Principle

When a toolkit operation fails, first determine which layer is responsible:

```text
Git / repository
        │
npm / build
        │
release
        │
SSH
        │
Docker / container detection
        │
NAS installation
        │
Homebridge runtime
        │
plugin runtime
```

Do not immediately reinstall the plugin, delete its catalog, or alter persistent state when the failure has not yet been identified.

---

## First Checks

For a local development problem, start with:

```bash
npm run verify
```

For a NAS/environment problem, start with:

```bash
npm run doctor
```

For a runtime problem, inspect targeted logs:

```bash
npm run logs -- <filter>
```

These three commands cover most first-level diagnosis.

---

## Repository Is Not Clean

### Symptom

`prepare-release` or `release` refuses to continue because the working tree contains changes.

### Diagnosis

Run:

```bash
git status --short
```

### Resolution

Review the reported files.

Commit intended changes, or deliberately restore/stash changes that should not be part of the release.

Do not blindly discard files merely to satisfy the release script.

A clean repository is required because the toolkit must know exactly which changes belong to the release.

---

## Repository Is Not Synchronized

### Symptom

Release preparation or publication reports that the local branch is not synchronized with GitHub.

### Diagnosis

Inspect the current branch and remote relationship before changing anything.

### Resolution

Determine whether the local branch is ahead, behind, or diverged from the remote.

Synchronize appropriately.

Do not automatically run an unrestricted `git pull` followed by `git push` without first understanding the divergence, especially on a release branch.

---

## Lint Failure

### Symptom

`verify`, deployment, preparation, or release stops during ESLint validation.

### Diagnosis

Run:

```bash
npm run lint
```

### Resolution

Correct the reported lint errors.

Automatic fixing is available through:

```bash
npm run lint:fix
```

or:

```bash
npm run fix
```

Review automatic changes before committing them.

Note that the NAS installation workflow itself currently performs a lint-fix pass before its strict lint validation.

---

## Build Failure

### Symptom

The TypeScript plugin or custom UI does not compile.

### Diagnosis

Run the complete build:

```bash
npm run build:all
```

If necessary, isolate the failing side:

```bash
npm run build
```

or:

```bash
npm run build:ui
```

### Resolution

Correct the reported compiler/build error before deployment or release.

---

## `git diff --check` Failure

### Symptom

`npm run verify` or a manual documentation check reports whitespace errors.

### Diagnosis

Run:

```bash
git diff --check
```

Git reports the affected file and line.

### Resolution

Correct the whitespace problem and rerun the check.

This validation does not prove functional correctness; it verifies the Git diff formatting.

---

## npm Authentication Failure

### Symptom

`release.sh` stops during npm authentication.

### Diagnosis

Run:

```bash
npm whoami
```

### Resolution

If authentication is missing or expired:

```bash
npm login
```

Then rerun the authentication check before restarting the release workflow.

---

## GitHub Authentication Failure

### Symptom

`release.sh` cannot validate the GitHub account or create the GitHub Release.

### Diagnosis

Check GitHub CLI authentication.

### Resolution

Restore a valid `gh` authentication session before continuing.

Do not replace the automated release stage with ad-hoc manual GitHub operations unless the release state has first been assessed.

---

## Version Already Published

### Symptom

The release process reports that the package version or corresponding release already exists.

### Cause

The version may already be present on npm or GitHub, or a previous release attempt may have completed partially.

### Resolution

Inspect the actual state of:

```text
package.json
npm
local Git tags
remote Git tags
GitHub Releases
```

Do not simply retry publication with the same version until the existing state is understood.

Published npm versions and release tags should be treated as immutable artifacts.

---

## Release Interrupted

### Symptom

`release.sh` stops after one or more publication actions have already completed.

### Risk

A release may be partially published, for example:

```text
npm package published
but
Git tag or GitHub Release not yet completed
```

### Resolution

Determine exactly which publication steps succeeded before taking any corrective action.

Do not restart the entire release workflow blindly and do not increment the version until the partial state has been assessed.

---

## SSH Connection Failure

### Symptom

`install-on-nas`, `doctor`, or `logs` cannot connect to the NAS.

### Current Default

```text
REMOTE_HOST=homebridge-nas
```

### Diagnosis

Verify that the SSH host is reachable and that the configured SSH alias or override is correct.

### Resolution

Restore SSH connectivity before investigating Docker or Homebridge.

A Docker diagnostic cannot succeed if the SSH layer itself is unavailable.

---

## Docker Command Failure

### Symptom

The toolkit reaches the NAS but cannot execute Docker operations.

### Current Default Docker Path

```text
/Volume1/@apps/DockerEngine/dockerd/bin/docker
```

### Diagnosis

Run:

```bash
npm run doctor
```

The diagnostic uses the same remote environment assumptions as the deployment tooling.

### Resolution

Verify the configured `DOCKER_BIN` and remote Docker installation.

Do not assume that `docker` is available directly from the NAS shell `PATH`.

---

## Homebridge Container Not Detected

### Symptom

Deployment, diagnostics, or logs cannot identify the Homebridge container.

### Architecture

The toolkit deliberately uses automatic Homebridge container detection rather than a fixed container name.

Therefore, a changing name such as:

```text
homebridge-homebridge_vXX
```

should not require editing every toolkit script.

### Diagnosis

Use:

```bash
npm run doctor
```

If detection still fails, investigate the Docker environment and the shared detection logic rather than hard-coding the currently observed container name.

---

## NAS Deployment Failure

### Symptom

`npm run install-on-nas` stops before completing installation.

### Identify the Stage

The deployment path is approximately:

```text
lint/fix
   │
lint
   │
build
   │
npm pack
   │
SSH transfer
   │
container detection
   │
npm install
   │
container restart
```

Use the last successful step in the console output to locate the failure.

### Resolution

Correct that specific stage before redeploying.

A deployment failure does not automatically mean the npm package or plugin runtime is defective.

---

## `npm run dev` Failure

### Architecture

`dev.sh` runs:

```text
install-on-nas
      │
      ▼
doctor
```

### Diagnosis

Determine whether the failure occurred during:

1. deployment; or
2. the post-deployment diagnostic.

If installation succeeded but `doctor` failed, do not unnecessarily rebuild/redeploy until the diagnostic failure is understood.

---

## Plugin Does Not Start after Deployment

### Diagnosis

First run:

```bash
npm run doctor
```

Then inspect the relevant runtime logs:

```bash
npm run logs -- homebridge-ha-virtual-devices
```

or use a more specific filter related to the observed problem.

### Resolution

Distinguish between:

- installation failure;
- Homebridge startup failure;
- plugin configuration error;
- provider startup error;
- runtime/device synchronization error.

Do not delete the persistent device catalog as a generic first response.

---

## Home Assistant Provider Problem

For a V2 runtime problem specific to Home Assistant, use targeted log terms associated with the connection, WebSocket, registry, device, or catalog path.

Remember that V2 can run with Home Assistant disabled.

A Home Assistant connection failure is therefore relevant only when that provider is enabled.

---

## Matter Provider Problem

For a V2 runtime problem specific to Matter, inspect Matter-related logs without assuming that Home Assistant is involved.

Matter commissioning and Matter runtime synchronization are separate from the Home Assistant WebSocket path.

Do not recommission a working Matter device merely because an unrelated catalog or HomeKit presentation problem is observed.

---

## Log Filtering

The toolkit accepts free-text filters.

Examples:

```bash
npm run logs -- homekit
npm run logs -- ws
npm run logs -- device
npm run logs -- catalog
npm run logs -- event
npm run logs -- matter
npm run logs -- Terrasse
```

Prefer a narrow filter when the full Homebridge output is too large to diagnose comfortably.

---

## Persistent State

The plugin maintains persistent runtime/catalog information in the Homebridge environment.

When troubleshooting, treat that data as diagnostic evidence.

Avoid deleting it until there is a demonstrated reason to reset state.

This is particularly important for V2 because the persistent catalog can contain devices and user preferences originating from different providers.

---

## Information to Collect

If the problem remains unresolved, collect only the information relevant to the failing stage:

```text
command executed
last successful step
exact error
Git state, if relevant
doctor output, if relevant
targeted logs, if relevant
```

Focused diagnostic output is generally more useful than an unfiltered dump of the entire Homebridge log.

---

## Related Documentation

- [Toolkit Overview](README.md)
- [Toolkit Reference](Toolkit.md)
- [Command Reference](Reference.md)
- [Deployment](Deployment.md)
- [Release Workflow](ReleaseWorkflow.md)
- [Publication Policy](PublicationPolicy.md)
