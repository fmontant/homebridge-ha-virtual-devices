# Changelog Toolkit

## Purpose

This library centralizes all operations on the project's CHANGELOG.

Its purpose is to provide a single API for reading, validating, updating and extracting release notes without exposing the Markdown structure to the rest of the toolkit.

## Responsibilities

The library is responsible for:

- loading the changelog
- parsing Markdown
- validating its structure
- exposing a domain model
- updating the Unreleased section
- preparing a new release
- extracting release notes
- writing the updated changelog

## Non responsibilities

The library is not responsible for:

- Git operations
- npm publication
- GitHub Releases
- user interaction
- confirmations
- version selection

These responsibilities belong to the shell scripts.

## Public API

The library will expose a single entry point.

```javascript
const {
  loadChangelog,
} = require('./changelog');
```

The returned object will provide methods such as:

- validate()
- save()
- getVersions()
- getRelease(version)
- getUnreleased()
- prepareRelease(...)
- extractRelease(...)

## Internal architecture

The implementation will progressively be split into dedicated modules.

```
changelog/
    README.md
    parser.cjs
    model.cjs
    serializer.cjs
    validator.cjs
```

Only the public API should be used outside this directory.

Internal modules may evolve without impacting the toolkit.

## Design principles

- Single responsibility
- No Markdown parsing outside this library
- Backward compatible
- Fully testable
- Language agnostic