# Publication Policy

## 1. Purpose

This document defines the publication policy for **Homebridge HA Virtual Devices**.

Its purpose is to ensure that every public release is coherent across source code, documentation, npm, Git, and GitHub.

This document defines **what must be true for a release**. The operational commands are documented in [`ReleaseWorkflow.md`](ReleaseWorkflow.md).

---

## 2. Core Principles

### Release only completed work

A public release must describe functionality that is actually present and validated in the released source.

Planned or unfinished features must not be presented as delivered.

### Keep release artifacts consistent

A released version must remain consistent across:

```text
source repository
package.json
CHANGELOG.md
npm package
Git tag
GitHub Release
```

### Validate before publishing

Publication must not be used as a test mechanism.

Code, UI, documentation, package contents, and repository state must be validated before the irreversible publication steps begin.

### Preserve stable releases during development

Development builds may be deployed and tested independently of the currently published npm version.

An unreleased development branch must not require modifying or republishing the stable release simply to perform NAS validation.

### Treat published versions as immutable

Once a version has been published to npm and represented by a release tag, it should be treated as an immutable release artifact.

Corrections should normally be delivered through a new version rather than rewriting the history of an existing public release.

---

## 3. Required Release Artifacts

### Source Repository

The release source must correspond to the version being published.

The repository must be clean and synchronized at the points required by the toolkit.

### `package.json` and `package-lock.json`

The package version must be updated consistently by the release-preparation workflow.

### `CHANGELOG.md`

The changelog is the durable history of delivered changes.

It must:

- describe changes actually included in the release;
- avoid announcing unfinished future work as released;
- identify the release version clearly;
- remain consistent with the package being published.

### README and Documentation

Public and developer documentation must reflect the behavior of the release.

For a major architectural release such as V2, this includes the relevant provider, configuration, user, architecture, and developer documentation.

### npm Package

The npm package is the official distributed plugin artifact.

Its contents must be inspected before publication through the toolkit's package-validation stage.

### Git Tag

Each official release receives the corresponding annotated Git tag.

Tag creation belongs to the **release stage**, after successful npm publication in the current workflow.

### GitHub Release

The GitHub Release communicates the published version and uses the prepared release information.

It must correspond to the same version as the npm package and Git tag.

---

## 4. Required Quality State

Before official publication, the project must pass the normal validation chain.

The standard development check is:

```bash
npm run verify
```

which covers:

```text
lint
  │
  ▼
build:all
  │
  ▼
git diff --check
```

The release scripts repeat and extend these checks.

A release must not proceed by bypassing a failed validation.

---

## 5. Documentation Policy

Documentation is part of the release, not a post-release correction task.

Before a release:

- user documentation must describe the released behavior;
- developer documentation must describe the current architecture where relevant;
- release notes and changelog must agree with the implementation;
- obsolete instructions that could cause incorrect configuration or deployment should be corrected.

Documentation may describe architectural context, but future functionality must be clearly distinguished from functionality delivered in the release.

---

## 6. Translation Policy

For the current project, French is the editorial reference language for translation review.

Before a release that changes user-visible UI text:

```text
French reference wording
        │
        ▼
English synchronization
        │
        ▼
German synchronization
        │
        ▼
Spanish synchronization
```

The supported locale structures and semantic meaning must be aligned before the release is considered translation-complete.

Detailed rules are documented in [`../i18n/TranslationReference.md`](../i18n/TranslationReference.md).

---

## 7. Official Publication Workflow

The current official workflow is:

```text
complete development
        │
        ▼
complete documentation / translations
        │
        ▼
npm run verify
        │
        ▼
npm run prepare-release
        │
        ▼
release preparation commit pushed
        │
        ▼
npm run release
        │
        ├── npm publish
        ├── Git tag
        └── GitHub Release
        │
        ▼
post-publication verification
```

The exact operational behavior is defined by the toolkit scripts.

---

## 8. Separation of Preparation and Publication

`prepare-release.sh` prepares the release metadata and repository state.

It does **not** create the Git tag and does **not** publish the npm package.

`release.sh` performs the official publication operations after its own validation.

This separation is intentional: preparation remains reversible until the publication stage begins.

---

## 9. NAS Deployment Policy

NAS deployment is not itself an official publication artifact.

The development NAS workflow can install a locally generated package before release:

```text
local working tree
        │
        ▼
build / npm pack
        │
        ▼
NAS Homebridge installation
```

This allows unreleased work to be validated without changing the stable npm release.

After an official release, NAS installation can also be used as an additional real-environment verification.

---

## 10. Complete Toolkit Orchestration

The maintainer may use:

```bash
npm run toolkit:publish
```

to orchestrate:

```text
prepare-release
      │
      ▼
release
      │
      ▼
install-on-nas
```

The orchestrator does not change the responsibilities of the individual stages.

---

## 11. Publication Checklist

Before `prepare-release`:

- planned release work complete;
- documentation updated;
- translations complete when affected;
- functional validation complete;
- `npm run verify` successful;
- intended release branch ready.

After `prepare-release`, before `release`:

- preparation commit created successfully;
- version and changelog correct;
- repository clean;
- branch synchronized with GitHub;
- no unintended changes introduced after preparation.

After `release`:

- npm version published;
- expected Git tag present locally/remotely;
- GitHub Release created;
- repository remains clean and synchronized;
- published package/version corresponds to the intended release.

When applicable, the release can then be installed and validated on the Homebridge NAS.

---

## 12. Partial Publication Failure

Publication steps are not all equally reversible.

If a release fails after an irreversible action such as `npm publish`, do not blindly restart the entire workflow.

First determine which artifacts already exist:

```text
npm version?
Git tag?
remote tag?
GitHub Release?
```

Corrective action must preserve consistency between these artifacts.

---

## 13. V2 Release Policy

The future V2 release must not begin until the V2 development branch has completed its intended release preparation, including:

- functional V2 implementation;
- user documentation;
- developer documentation;
- translation synchronization;
- final validation.

Until that point, the current stable public release remains independent from V2 development and NAS testing.

---

## 14. Continuous Improvement

The publication process may evolve as the toolkit evolves.

Automation should encode and enforce this policy wherever practical, while the documentation must be updated whenever script responsibilities or release ordering changes.

The scripts remain the operational source of truth; this policy defines the release guarantees they are intended to enforce.

---

## Related Documentation

- [Toolkit Overview](README.md)
- [Toolkit Reference](Toolkit.md)
- [Release Workflow](ReleaseWorkflow.md)
- [Deployment](Deployment.md)
- [Troubleshooting](Troubleshooting.md)
- [Translation Reference](../i18n/TranslationReference.md)
