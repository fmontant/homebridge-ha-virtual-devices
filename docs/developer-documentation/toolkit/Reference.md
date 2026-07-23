# Reference

This document provides a reference for the Developer Toolkit scripts.

It is intended for maintainers and contributors who need to understand the purpose of each script before using it.

After reading this guide, you will know when to use each script and what it is designed to do.

---

## Overview

The Developer Toolkit is located in the `scripts` directory.

```text
scripts/
├── prepare-release.sh
├── release.sh
├── install-on-nas.sh
└── lib/
    └── common.sh
```

Each script has a specific responsibility.

---

## prepare-release.sh

### Purpose

Prepares the next project release.

### Responsibilities

- Validate the Git repository.
- Verify repository synchronization.
- Determine the next version.
- Update the project version.
- Create the release commit.
- Create the Git tag.

### Typical Usage

Run this script before publishing a new version.

---

## release.sh

### Purpose

Publishes a prepared release.

### Responsibilities

- Validate the project.
- Verify npm authentication.
- Build the project.
- Generate the npm package.
- Publish the package.
- Push Git tags.

### Typical Usage

Run this script after `prepare-release.sh`.

---

## install-on-nas.sh

### Purpose

Deploys a published package to the development Homebridge server.

### Responsibilities

- Transfer the published package.
- Install the package on the NAS.
- Simplify deployment operations.

### Typical Usage

Run this script after a successful publication.

---

## lib/common.sh

### Purpose

Provides shared functions used by the toolkit.

### Responsibilities

- Common logging.
- Error handling.
- Git utilities.
- npm utilities.
- User interaction.
- Shared helper functions.

This file is an internal component and is not intended to be executed directly.

---

## Script Execution Order

The recommended execution order is:

```text
prepare-release.sh
        │
        ▼
release.sh
        │
        ▼
install-on-nas.sh
```

Following this workflow helps ensure consistent and reliable releases.
