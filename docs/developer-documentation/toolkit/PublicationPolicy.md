# Publication Policy

## 1. Purpose

This document defines the publication policy for the Homebridge HA Virtual Devices project.

Its purpose is to ensure that every public release follows the same quality standards regarding source code, documentation, packaging and communication.

This policy describes *what* must be produced for each release.
Technical implementation details are documented separately.

---

## 2. Publication Principles

### Consistency

Every release must follow the same publication process.

### Single Source of Truth

Information must be written once and reused whenever possible.

Duplicate documentation should be avoided.

### Transparency

Published releases must accurately describe the delivered changes.

Future features must never appear in release documentation.

### Quality

A release is considered complete only when:

- the source code is validated;
- the documentation is updated;
- the package is published successfully;
- the published version has been verified.

---

## 3. Publication Artifacts

Each public release produces the following artifacts.

### README

Project presentation.

Purpose:

- introduce the plugin;
- explain installation;
- describe the main features;
- provide links to the documentation.

### CHANGELOG

Complete history of published versions.

Purpose:

- record delivered changes;
- document fixes and improvements;
- provide a reliable historical reference.

The CHANGELOG never contains future work.

### GitHub Release

Official announcement of a published version.

Purpose:

- summarize the release;
- highlight the most important changes;
- direct readers to the CHANGELOG for complete details.

### npm Package

Official distribution package.

Purpose:

- deliver the plugin;
- expose the latest README;
- publish the new version.

---

## 4. Publication Workflow

Each release follows the same sequence.

1. Complete development
2. Update documentation
3. Validate the project
4. Publish the GitHub Release
5. Publish the npm package
6. Verify the published release

---

## 5. Writing Guidelines

### README

The README is the project's public entry point.

It should remain concise, accurate and focused on users.

### CHANGELOG

The CHANGELOG records only published changes.

Entries should be factual and easy to scan.

### GitHub Release

GitHub Releases communicate the value of a new version.

They summarize the most important changes without duplicating the CHANGELOG.

---

## 6. Publication Checklist

Before publishing:

- Version updated
- Documentation updated
- CHANGELOG completed
- Project builds successfully
- Lint passes
- Package validated

After publishing:

- GitHub Release available
- npm package available
- Installation verified
- Upgrade verified

---

## 7. Continuous Improvement

The publication process may evolve over time.

Whenever possible, repetitive tasks should be automated.

Automation must always implement this policy rather than replace it.
