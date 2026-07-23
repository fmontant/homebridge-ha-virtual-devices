# Release Workflow

This guide explains how to prepare, validate and publish a new release of **Homebridge HA Virtual Devices** using the Developer Toolkit.

It is intended for project maintainers responsible for publishing official releases.

After reading this guide, you will be able to prepare, publish and verify a release safely and consistently.

---

## Before You Start

Before preparing a release, make sure that:

- all planned changes have been completed;
- the project builds successfully;
- all linting checks pass;
- the Git working tree is clean;
- the local repository is synchronized with GitHub;
- you are authenticated with npm.

These checks significantly reduce the risk of publishing an incomplete or inconsistent release.

---

## Validate the Project

Before creating a release, verify the project quality.

Run:

```bash
npm run lint

npm run build:all
```

Both commands must complete successfully before continuing.

---

## Prepare the Release

Run the release preparation workflow.

```bash
npm run prepare-release
```

The preparation script automatically:

- validates the Git repository;
- verifies repository synchronization;
- determines the next project version;
- updates the project version;
- creates the release commit;
- creates the Git tag.

At the end of this step, the repository is ready for publication.

---

## Publish the Release

Publish the prepared release.

```bash
npm run release
```

Before publishing, the toolkit verifies:

- repository status;
- Git synchronization;
- npm authentication;
- project integrity;
- package generation.

If every validation succeeds, the package is published to npm and the Git tag is pushed to GitHub.

---

## Verify the Publication

After publication, verify that:

- the new version is available on npm;
- the Git tag exists locally and remotely;
- the GitHub repository contains the published tag;
- the local repository is clean.

These checks confirm that the release completed successfully.

---

## Next Steps

Once the publication has been verified, continue with the deployment process described in [Deployment](Deployment.md).
