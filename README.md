# Homebridge HA Virtual Devices

> Expose Home Assistant environmental sensors as native Apple Home accessories through Homebridge.

[![Build](https://github.com/fmontant/homebridge-ha-virtual-devices/actions/workflows/build.yml/badge.svg)](https://github.com/fmontant/homebridge-ha-virtual-devices/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/homebridge-ha-virtual-devices.svg)](https://www.npmjs.com/package/homebridge-ha-virtual-devices)
[![Homebridge](https://img.shields.io/badge/Homebridge-2.x-orange)](https://homebridge.io/)
[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Compatible-blue)](https://www.home-assistant.io/)
[![Node.js](https://img.shields.io/badge/Node.js-22+-green)](https://nodejs.org/)
[![License](https://img.shields.io/github/license/fmontant/homebridge-ha-virtual-devices)](LICENSE)

![Homebridge HA Virtual Devices](docs/images/banner.png)

---

## Overview

Homebridge HA Virtual Devices bridges the gap between Home Assistant and Apple Home by exposing environmental sensors as native HomeKit accessories.

Home Assistant provides powerful tools to collect environmental data from many different devices.

Apple Home provides a clean and consistent user experience for managing connected devices.

This plugin combines both ecosystems.

Instead of exposing individual temperature, humidity and battery accessories, compatible Home Assistant entities are automatically grouped into a single native HomeKit thermostat accessory.

The result is:

- a cleaner Apple Home interface;
- fewer accessories to manage;
- richer information in a single tile;
- a user experience that feels completely native.

No polling.

No manual mapping.

No custom HomeKit services.

Only native Homekit accessories.

---

## Why this plugin exists

Apple Home currently does not provide a dedicated accessory type specifically designed for environmental sensors.

Publishing each sensor independently quickly creates unnecessary complexity:

- one accessory for temperature;
- one accessory for humidity;
- one accessory for battery information.

After evaluating the available native HomeKit accessory types, the thermostat service proved to provide the best user experience.

A single thermostat tile can naturally display:

- current temperature;
- current relative humidity;
- accessory information;
- battery level when available.

The objective of this project is simple:

> Use native HomeKit capabilities while keeping Apple Home clean, reliable and easy to use.

---

## Features

### Automatic discovery

Compatible Home Assistant entities are automatically discovered.

No manual device mapping is required.

The plugin identifies supported environmental sensors and creates the corresponding HomeKit accessories automatically.

---

### Automatic grouping

Related entities are grouped into a single accessory.

Instead of exposing:

- Temperature
- Humidity
- Battery

Apple Home displays one thermostat tile containing all available information.

This approach keeps the Home application organized and easier to navigate.

---

## Native HomeKit accessories

Everything exposed by the plugin uses standard HomeKit services and characteristics.

The plugin does not rely on:

- custom HomeKit services;
- unsupported characteristics;
- HomeKit workarounds.

The objective is to provide the most compatible experience possible.

---

## Real-time updates

Communication with Home Assistant uses the WebSocket API.

Sensor updates are immediately reflected inside Apple Home.

No polling is performed.

This provides:

- faster updates;
- lower resource consumption;
- better synchronization reliability.

---

## Rich accessory information

Whenever available, accessories expose additional information through HomeKit:

- Manufacturer
- Model
- Firmware version
- Hardware version
- Serial number
- Battery level

---

## Persistent device catalog

The plugin maintains a persistent catalog of discovered devices.

Unlike traditional Homebridge accessories that may disappear permanently when a device becomes unavailable, the catalog keeps track of known devices over time.

Each device record can contain:

- unique identifier;
- display name;
- room;
- publication state;
- favorite status;
- hidden state;
- availability;
- discovery date;
- last communication;
- synchronization status.

The catalog allows user preferences to survive:

- Homebridge restarts;
- Home Assistant restarts;
- plugin upgrades.

The detailed catalog architecture is documented in:

`docs/developer-documentation/architecture/`

---

## Dynamic synchronization

The Homebridge interface allows users to modify device preferences without restarting Homebridge.

When a preference changes, the plugin automatically updates the device catalog and synchronizes the corresponding HomeKit accessory.

Example workflow:

- Edit a device preference in Homebridge UI
- Update the persistent catalog
- Synchronize the affected accessory
- Update HomeKit automatically

No Homebridge restart is required.

---

## Installation

Install the plugin directly from the Homebridge Plugin Manager or using npm.

```bash
npm install -g homebridge-ha-virtual-devices
```

Restart Homebridge after installation.

---

## Configuration

Only a few parameters are required.

Example:

```json
{
  "platform": "HomeAssistantVirtualDevices",
  "name": "Home Assistant Virtual Devices",
  "host": "http://homeassistant.local:8123",
  "token": "YOUR_LONG_LIVED_ACCESS_TOKEN"
}
```

Configuration parameters:

| Parameter | Required | Description |
|-----------|----------|-------------|
| host | Yes | Home Assistant URL |
| token | Yes | Long-lived access token |
| includeHumidity | No | Publish humidity information when available |
| includeBattery | No | Publish battery information when available |
| logLevel | No | Logging verbosity |

---

## Documentation

Complete documentation is available in the `docs` directory.

The documentation is divided into two sections.

---

## User Documentation

Documentation intended for plugin users.

It includes:

- Installation instructions
- Configuration guide
- User guide
- Troubleshooting
- Frequently Asked Questions

Location:

```
docs/user-documentation/
```

---

## Developer Documentation

Technical documentation intended for developers and contributors.

It includes:

- Plugin architecture
- Internal components
- Architecture Decision Records
- Technical diagrams

Location:

```
docs/developer-documentation/
```

---

## Screenshots

Screenshots illustrating the Apple Home integration.

<table>
<tr>
<td align="center">
<img src="docs/screenshots/apple-home-overview.png" width="250">
<br>
Apple Home overview
</td>

<td align="center">
<img src="docs/screenshots/apple-home-thermostat.png" width="250">
<br>
Apple Home thermostat
</td>

<td align="center">
<img src="docs/screenshots/apple-home-accessory-info.png" width="250">
<br>
Apple Home accessory information
</td>
</tr>
</table>

---

## Project philosophy

Homebridge HA Virtual Devices follows a few simple principles.

### Native first

The plugin prefers native HomeKit services whenever possible.

### Simple configuration

Automatic discovery is preferred over manual configuration.

### Reliability

Temporary communication failures should not require users to recreate accessories.

### Maintainability

Each component has a clearly defined responsibility.

---

## Frequently Asked Questions

### Does the plugin modify Home Assistant?

No.

The plugin is completely read-only.

It:

- discovers compatible entities;
- subscribes to Home Assistant events;
- updates HomeKit accessories.

It never creates, modifies or deletes anything inside Home Assistant.

---

### Is polling used?

No.

The plugin relies on the Home Assistant WebSocket API.

Updates are event-driven.

This minimizes unnecessary resource usage while providing fast synchronization.

---

### What happens if Home Assistant restarts?

The plugin automatically reconnects.

Once communication is restored:

- devices are rediscovered;
- values are refreshed;
- HomeKit accessories are updated.

No user action is required.

---

### What happens if a sensor temporarily disappears?

The persistent catalog keeps track of known devices.

When communication is interrupted:

- availability is updated;
- the accessory remains known;
- user preferences are preserved.

When the sensor becomes available again, normal operation resumes automatically.

---

### Will my preferences be lost after upgrading?

No.

The persistent catalog preserves:

- favorites;
- rooms;
- publication state;
- hidden devices;
- discovery history.

---

## Roadmap

Future improvements may include:

### User Interface

- Additional filtering options
- Bulk operations
- Advanced search
- Device statistics
- Health dashboard

### Sensors

Additional support for environmental sensors:

- Air quality
- CO₂
- VOC
- Atmospheric pressure
- Illuminance

### HomeKit

Future improvements may include:

- richer accessory information;
- additional diagnostics;
- improved synchronization reporting.

---

## Contributing

Contributions are welcome.

You can help by:

- reporting bugs;
- suggesting improvements;
- improving documentation;
- submitting code;
- translating the project.

For major changes, please open an issue before implementation.

---

## Support

When reporting an issue, please include:

- Homebridge version;
- Node.js version;
- Home Assistant version;
- Plugin version;
- Relevant logs;
- Steps to reproduce the problem.

Providing complete information helps identify and resolve issues faster.

---

## License

MIT License

Copyright (c) Fabrice Montant

---

## Acknowledgements

Special thanks to:

- the Homebridge community;
- the Home Assistant community;
- everyone who tests new versions;
- everyone who reports issues and suggests improvements.

Your feedback helps continuously improve this project.
