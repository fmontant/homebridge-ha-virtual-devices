# Release Workflow

This guide describes the current official release workflow for **Homebridge HA Virtual Devices**.

It is intended for project maintainers preparing and publishing an npm/GitHub release.

---

## Release Principle

The release process is deliberately split into two stages:

```text
prepare-release
      │
      ▼
release
```

The first stage prepares and commits the version. The second validates and publishes it.

NAS deployment is a separate operation.

---

## Before Starting

An official release should begin only when the planned development work is complete and the branch intended for release is ready.

Run the standard project validation:

```bash
npm run verify
```

This performs:

```text
lint
  │
  ▼
build:all
  │
  ▼
git diff --check
```

The release scripts perform their own checks again, but validating first avoids entering the release process with a known problem.

---

## Stage 1: Prepare the Release

Run:

```bash
npm run prepare-release
```

This executes:

```text
scripts/prepare-release.sh
```

### Validation

The preparation script verifies:

- required tools;
- current Git branch;
- clean working tree;
- synchronization with GitHub.

It then prepares the release notes and runs the project quality checks.

After the build, it verifies that compilation has not introduced unexpected tracked changes.

### Version and Changelog

The script then:

- updates the working changelog;
- updates the package version;
- updates `package-lock.json` through the version operation;
- prepares the changelog for the selected version.

Before committing, it verifies that the release preparation modified only the expected files:

```text
CHANGELOG.md
package.json
package-lock.json
```

### Release Preparation Commit

If validation succeeds, the script:

```text
git add
   │
   ▼
git commit
   │
   ▼
git push origin <release branch>
```

The preparation commit is therefore already published to GitHub before the release stage begins.

### Important Boundary

`prepare-release.sh` does **not**:

- publish the npm package;
- create the Git tag;
- create the GitHub Release.

Those operations belong to `release.sh`.

The script explicitly indicates the next step:

```bash
npm run release
```

---

## Stage 2: Publish the Release

Run:

```bash
npm run release
```

This executes:

```text
scripts/release.sh
```

### Pre-Publication Validation

Before publishing anything, the script verifies:

- required tools, including Git, Node.js, npm and GitHub CLI;
- current Git branch;
- clean repository state;
- GitHub synchronization;
- npm authentication;
- GitHub authentication;
- package version availability;
- release notes.

It then performs the quality checks again.

### Package Inspection

The release script checks the npm package contents before publication using a dry-run package generation.

Conceptually:

```text
lint/build validation
        │
        ▼
repository unchanged
        │
        ▼
npm pack --dry-run
        │
        ▼
package contents validated
```

Only after these validations and the explicit publication confirmation does the publication phase begin.

---

## Publication

The official publication sequence is:

```text
npm publish
    │
    ▼
create annotated Git tag
    │
    ▼
push branch
    │
    ▼
push tag
    │
    ▼
create GitHub Release
```

The Git tag is created by `release.sh`, not by `prepare-release.sh`.

The GitHub Release is also created during this stage from the prepared release information.

---

## After Publication

A successful release should leave the same version represented consistently across:

```text
package.json
npm registry
Git tag
GitHub Release
```

The repository should also remain clean and synchronized after the workflow.

The toolkit performs substantial validation itself; any additional manual check should confirm these same published artifacts rather than modifying the release afterward.

---

## NAS Deployment

NAS deployment is intentionally separate from official npm/GitHub publication.

To install the project on the configured development NAS, use:

```bash
npm run install-on-nas
```

For the development workflow that installs and then validates the NAS environment:

```bash
npm run dev
```

The deployment process is documented in [`Deployment.md`](Deployment.md).

---

## Complete Maintainer Orchestration

The toolkit also provides:

```bash
npm run toolkit:publish
```

This executes the high-level `publish.sh` orchestrator.

Its intended sequence is:

```text
prepare-release.sh
        │
        ▼
release.sh
        │
        ▼
install-on-nas.sh
```

Use the individual commands when you want explicit control over each release stage.

---

## Release Safety Rules

Do not continue to the next stage when a validation fails.

In particular:

- do not publish from a dirty repository;
- do not bypass failed lint/build checks;
- do not manually create the release tag during preparation;
- do not treat NAS deployment as proof that npm/GitHub publication succeeded;
- do not modify the prepared release between `prepare-release` and `release` without reassessing the release state.

The scripts are intentionally conservative because a published npm version and Git tag should be immutable release artifacts.

---

## V2 Release

For the future V2 publication, the same toolkit workflow applies.

The V2 development branch must first reach the intended release state, including documentation and translation review, before starting `prepare-release`.

Development builds and NAS validation do not require changing or publishing the current stable npm version.

---

## Related Documentation

- [Toolkit Overview](README.md)
- [Toolkit Reference](Toolkit.md)
- [Command Reference](Reference.md)
- [Deployment](Deployment.md)
- [Publication Policy](PublicationPolicy.md)
- [Troubleshooting](Troubleshooting.md)
