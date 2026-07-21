# Developer Guide

This document is intended for developers who want to understand, extend or contribute to **Homebridge HA Virtual Devices**.

It complements the Architecture document by focusing on the codebase, development workflow and contribution guidelines.

---

# Project goals

The project has four primary objectives:

- expose environmental sensors using only native HomeKit services;
- require as little configuration as possible;
- remain reliable in long-running Homebridge installations;
- provide a clean, maintainable architecture.

Every contribution should support these goals.

---

# Project structure

```
homebridge-ha-virtual-devices
│
├── src/
│   ├── accessories/
│   ├── catalog/
│   ├── discovery/
│   ├── managers/
│   ├── models/
│   ├── platform/
│   ├── services/
│   └── ui/
│
├── homebridge-ui/
│
├── docs/
│
├── dist/
│
└── package.json
```

The exact internal organization may evolve over time, but responsibilities should remain clearly separated.

---

# Core concepts

The project revolves around three different representations of a device.

## Home Assistant entities

These are raw entities received from Home Assistant.

Examples:

- temperature
- humidity
- battery

These objects should never be exposed directly to HomeKit.

---

## ClimateDevice

A `ClimateDevice` is the runtime representation.

It aggregates all entities belonging to one physical sensor.

It contains:

- live values;
- detected capabilities;
- metadata;
- runtime state.

It exists only while Homebridge is running.

---

## CatalogDevice

A `CatalogDevice` represents persistent information.

Typical properties include:

- publication state;
- room;
- favorite;
- hidden flag;
- timestamps;
- availability.

Unlike `ClimateDevice`, it survives restarts.

---

# Data flow

```
Home Assistant

        │

        ▼

Discovery

        │

        ▼

ClimateDevice

        │

        ▼

Catalog synchronization

        │

        ▼

Accessory synchronization

        │

        ▼

HomeKit
```

Every new feature should integrate into this flow instead of creating shortcuts.

---

# Coding principles

## Single Responsibility

A class should have one responsibility.

Avoid classes that both:

- communicate with Home Assistant;
- manage persistence;
- manipulate HomeKit.

Those concerns belong to different layers.

---

## Composition

Prefer composing small services instead of building very large managers.

---

## Readability

Readable code is preferred over clever code.

Future contributors should understand the project quickly.

---

## Type safety

Use TypeScript types whenever possible.

Avoid:

```
any
```

Prefer explicit interfaces and models.

---

# Logging

Logs should help users understand what the plugin is doing.

Good logs describe:

- discoveries;
- synchronization;
- accessory lifecycle;
- reconnections;
- failures.

Avoid excessive debug output in production builds.

---

# HomeKit

Only native HomeKit services should be used.

Whenever possible:

- reuse existing characteristics;
- avoid custom services;
- keep Apple Home behavior predictable.

This philosophy is one of the defining characteristics of the project.

---

# Home Assistant

The plugin is intentionally read-only.

It should:

- discover;
- subscribe;
- synchronize.

It should never modify Home Assistant entities.

---

# Persistence

Only user preferences belong in the persistent catalog.

Examples:

- favorites;
- rooms;
- publication state;
- hidden devices.

Transient runtime values should remain in memory.

---

# Adding a new sensor

Supporting a new environmental sensor generally requires:

1. extending discovery;
2. updating `ClimateDeviceBuilder`;
3. extending `ClimateAccessory`;
4. updating catalog metadata if necessary;
5. updating the UI if new information is displayed.

The synchronization pipeline itself should remain unchanged.

---

# Updating the Homebridge UI

When modifying the UI:

- keep components focused;
- reuse existing models;
- avoid business logic inside Vue components;
- keep synchronization automatic.

The UI should remain a thin client.

---

# Testing

Before submitting a contribution:

- build the project;
- verify TypeScript compilation;
- verify linting;
- install the generated package;
- test on a real Homebridge instance whenever possible.

Recommended commands:

```bash
npm run lint
npm run build
npm run build:ui
npm pack
```

---

# Pull Requests

Pull Requests should:

- address a single topic;
- include clear commit messages;
- update documentation when necessary;
- preserve backward compatibility whenever possible.

Large architectural changes should be discussed through an Issue before implementation.

---

# Documentation

Documentation is considered part of the project.

New features should be accompanied by updates to:

- README
- CHANGELOG
- Architecture
- User Guide (when applicable)

Keeping documentation synchronized with the code is a project requirement.

---

# Design philosophy

When hesitating between two implementations, prefer the one that is:

- simpler;
- more maintainable;
- more predictable;
- more aligned with native HomeKit.

Small, incremental improvements are preferred over large rewrites.

The project has grown by continuously refining its architecture while preserving stability.

Future contributions should follow the same philosophy.