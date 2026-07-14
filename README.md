<p align="center">
  <img src="docs/images/logo.png" width="180" alt="Homebridge HA Virtual Devices">
</p>

<h1 align="center">Homebridge HA Virtual Devices</h1>

<p align="center">
Automatically transform your Home Assistant environmental sensors into elegant HomeKit thermostat tiles.
</p>

<p align="center">

![Homebridge](https://img.shields.io/badge/Homebridge-2.x-orange)
![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Compatible-41BDF5)
![Node](https://img.shields.io/badge/Node.js-22%2B-green)
![License](https://img.shields.io/badge/License-Apache%202.0-blue)

</p>

---

# Overview

Homebridge HA Virtual Devices automatically discovers compatible environmental devices from Home Assistant and exposes them as optimized HomeKit accessories.

Instead of creating separate Temperature, Humidity and Battery accessories, the plugin intelligently groups them into a single HomeKit Thermostat tile.

The result is a cleaner Apple Home interface with richer information for each device.

The plugin is completely read-only.

It never sends commands to Home Assistant and never controls heating equipment.

---

# Why this plugin?

Apple Home displays environmental sensors using multiple independent accessories.

A single physical sensor may appear as:

- Temperature
- Humidity
- Battery

This quickly becomes difficult to organize when dozens of sensors are installed.

Homebridge HA Virtual Devices solves this by creating one elegant accessory per physical device.

Everything is grouped into one place.

---

# Features

## Automatic discovery

No manual configuration.

Compatible devices are automatically discovered using the Home Assistant Device Registry and Entity Registry.

## Real-time updates

The plugin uses the Home Assistant WebSocket API.

No polling.

Sensor values are updated instantly.

## Rich HomeKit accessory

Each thermostat tile may include:

- Current temperature
- Current humidity
- Battery level
- Manufacturer
- Model
- Firmware version
- Hardware version
- Serial number

## Homebridge configuration

The plugin can be configured directly from the Homebridge user interface.

Available options include:

- Enable or disable humidity
- Enable or disable battery
- Ignore selected devices
- Debug logging

## Automatic cleanup

Accessories removed from Home Assistant are automatically removed from HomeKit.

---

# Comparison

| Feature | Standard HomeKit Sensors | HA Virtual Devices |
|----------|-------------------------:|-------------------:|
| Temperature | ✅ | ✅ |
| Humidity in same tile | ❌ | ✅ |
| Battery in same tile | ❌ | ✅ |
| Manufacturer | ❌ | ✅ |
| Model | ❌ | ✅ |
| Firmware version | ❌ | ✅ |
| Hardware version | ❌ | ✅ |
| Serial number | ❌ | ✅ |
| Real-time updates | Depends | ✅ |
| Automatic discovery | Depends | ✅ |
| One accessory per device | ❌ | ✅ |

---

# Screenshots

Coming soon.

The documentation will include:

- Home Assistant device
- Homebridge configuration
- Apple Home thermostat tile
- Accessory details
- Before / After comparison
# Installation

## Requirements

Before installing the plugin, ensure you have:

- Homebridge 2.x or later
- Node.js 22 or later
- Home Assistant
- A Home Assistant Long-Lived Access Token
- WebSocket API enabled (default configuration)

---

## Install from the Homebridge UI

1. Open the **Plugins** page.
2. Search for **Homebridge HA Virtual Devices**.
3. Install the plugin.
4. Open the plugin settings.
5. Configure your Home Assistant connection.
6. Save the configuration.
7. Restart Homebridge.

The plugin will automatically discover compatible devices during startup.

---

## Install manually

```bash
npm install -g homebridge-ha-virtual-devices
```

Restart Homebridge after installation.

---

# Configuration

The plugin is fully configurable from the Homebridge Settings UI.

You may also configure it directly inside `config.json`.

## Example configuration

```json
{
  "platform": "HAVirtualDevices",
  "name": "HA Virtual Devices",
  "haUrl": "http://192.168.1.100:8123",
  "token": "YOUR_LONG_LIVED_ACCESS_TOKEN",
  "includeHumidity": true,
  "includeBattery": true,
  "ignoredDevices": [],
  "debug": false
}
```

---

# Configuration options

| Option | Required | Default | Description |
|---------|:-------:|:------:|-------------|
| `haUrl` | ✅ | - | Home Assistant URL |
| `token` | ✅ | - | Long-Lived Access Token |
| `includeHumidity` | ❌ | `true` | Display humidity inside the thermostat tile |
| `includeBattery` | ❌ | `true` | Display battery information |
| `ignoredDevices` | ❌ | `[]` | List of devices ignored by the plugin |
| `debug` | ❌ | `false` | Enable debug logging |

---

## ignoredDevices

Sometimes you may not want every Home Assistant device to appear in Apple Home.

Example:

```json
"ignoredDevices": [
  "Terrace",
  "Outdoor Sensor"
]
```

Ignored devices are:

- never created;
- automatically removed from HomeKit if already present;
- ignored during future discoveries.

---

## includeHumidity

By default, humidity is displayed whenever the device provides it.

```json
"includeHumidity": false
```

The thermostat tile will then only display temperature.

---

## includeBattery

Battery level is enabled by default.

```json
"includeBattery": false
```

When disabled:

- Battery Level is removed.
- Low Battery status is removed.
- Charging State is removed.

The accessory becomes a pure environmental sensor.

---

# First startup

During the first launch, the plugin will:

1. Connect to Home Assistant.
2. Download all device states.
3. Retrieve the Device Registry.
4. Retrieve the Entity Registry.
5. Discover compatible environmental devices.
6. Create HomeKit accessories.
7. Connect to the Home Assistant WebSocket.
8. Receive updates in real time.

No manual discovery is required.

---

# Supported devices

The plugin currently supports environmental devices exposing:

- Temperature
- Humidity (optional)
- Battery level (optional)

The plugin has been extensively tested with IKEA environmental sensors.

Support for additional manufacturers will continue to improve over time.
# How it works

Homebridge HA Virtual Devices has been designed around the official Home Assistant APIs.

The plugin automatically discovers compatible devices, groups their environmental data and exposes them as optimized HomeKit accessories.

No manual mapping is required.

---

## Discovery process

At startup, the plugin performs the following operations:

1. Connects to Home Assistant.
2. Downloads the current states.
3. Retrieves the Device Registry.
4. Retrieves the Entity Registry.
5. Associates entities with their physical devices.
6. Builds a complete virtual device.
7. Creates or restores the corresponding HomeKit accessory.
8. Starts listening for real-time updates through the WebSocket API.

---

## Read-only design

This plugin never sends commands to Home Assistant.

No service call is ever executed.

No entity state is modified.

The Thermostat service is used only as a richer visual representation inside Apple Home.

---

## Why a Thermostat?

Apple Home currently provides only a limited interface for Temperature Sensors.

Using the Thermostat service allows multiple environmental values to be grouped into a single accessory.

Advantages include:

- Current temperature
- Current humidity
- Battery level
- Rich accessory information
- Better visibility in Apple Home

The displayed target temperature is only required by HomeKit.

It is never sent back to Home Assistant.

---

# Device metadata

Whenever available, the plugin automatically imports:

- Manufacturer
- Model
- Firmware version
- Hardware version
- Serial number

These values are displayed directly inside Apple Home.

Example:

Manufacturer

IKEA of Sweden

Model

TIMMERFLOTTE temp/hmd sensor

Firmware

1.0.21

Hardware

P2.1

Serial Number

xxxxxxxxxxxx

---

# Real-time updates

The plugin uses the Home Assistant WebSocket API.

Whenever a sensor changes:

Temperature

Humidity

Battery level

the corresponding HomeKit accessory is updated immediately.

No polling interval is used.

This reduces network traffic while providing instantaneous updates.

---

# Supported Home Assistant entities

Currently supported:

- Temperature sensors
- Humidity sensors
- Battery sensors

Additional environmental sensors may be supported in future releases.

---

# Architecture

The project has been intentionally split into small independent components.

```text
Home Assistant
        │
        ▼
 HomeAssistantClient
        │
        ▼
ClimateDeviceManager
        │
        ▼
DiscoveryManager
        │
        ▼
AccessoryManager
        │
        ▼
ClimateAccessory
        │
        ▼
Apple Home
```

This architecture makes the code easier to maintain and extend.

---

# Project philosophy

The goal of this plugin is simple:

One physical device

↓

One HomeKit accessory

↓

Everything in one place

Rather than exposing many independent accessories, the plugin focuses on providing a clean and consistent Apple Home experience.
# Frequently Asked Questions

## Why does the plugin create Thermostat accessories?

The HomeKit Thermostat service provides the best user interface available in Apple Home for environmental sensors.

It allows multiple measurements to be grouped into a single accessory while offering a much richer interface than standard temperature sensors.

The plugin never controls heating equipment.

---

## Does the plugin modify Home Assistant?

No.

The plugin is completely read-only.

It only reads information from Home Assistant.

No service calls are executed.

No entity state is modified.

---

## Which devices are supported?

Any Home Assistant device exposing a temperature sensor.

Humidity and battery information are automatically added whenever available.

The plugin has been extensively tested with IKEA environmental sensors but should work with many other manufacturers.

---

## Why isn't one of my devices visible?

Possible reasons include:

- the device does not expose a temperature sensor;
- it is listed in `ignoredDevices`;
- Home Assistant has not yet associated the entities with the device;
- the plugin cannot access the Device Registry or Entity Registry.

Enable debug logging if you need additional information.

---

## Can I disable humidity?

Yes.

```json
"includeHumidity": false
```

Humidity characteristics will not be created.

---

## Can I disable battery information?

Yes.

```json
"includeBattery": false
```

Battery characteristics will not be created.

---

## Can I ignore specific devices?

Yes.

```json
"ignoredDevices": [
  "Terrace",
  "Garage"
]
```

Ignored devices are automatically removed from HomeKit.

---

## Does the plugin require polling?

No.

The plugin relies on the Home Assistant WebSocket API.

Updates are received instantly.

---

## Roadmap

### Version 1.0

- Automatic discovery
- Temperature
- Humidity
- Battery
- Device metadata
- Homebridge configuration
- Automatic cleanup
- WebSocket synchronization

### Version 1.1

Planned improvements:

- Custom accessory names
- Improved diagnostics
- Better error reporting
- Additional environmental sensors

### Future ideas

- Air quality sensors
- CO₂ sensors
- Illuminance sensors
- Composite accessories
- Advanced filtering
- Performance improvements

---

# Troubleshooting

## Enable debug logging

```json
"debug": true
```

The plugin will log:

- discovered devices;
- registry information;
- accessory creation;
- real-time updates;
- ignored devices.

---

## Build the project

```bash
npm install
npm run build
```

---

## Deploy

```bash
npm run deploy
```

---

## Report an issue

When opening a GitHub issue, please include:

- Homebridge version
- Node.js version
- Home Assistant version
- Plugin version
- Relevant log entries
- Configuration (without your access token)

This information greatly helps identify and resolve issues quickly.
# Development

## Clone the repository

```bash
git clone https://github.com/<your-account>/homebridge-ha-virtual-devices.git

cd homebridge-ha-virtual-devices
```

---

## Install dependencies

```bash
npm install
```

---

## Build

```bash
npm run build
```

---

## Deploy to Homebridge

```bash
npm run deploy
```

The deployment script automatically:

- builds the TypeScript project;
- copies the compiled files;
- updates the plugin files;
- prepares the Homebridge installation.

Restart your Homebridge container after deployment.

---

## Project structure

```text
src/
├── accessories/
├── factories/
├── homeassistant/
├── managers/
├── models/
├── platform.ts
└── settings.ts

docs/
├── images/
└── screenshots/

scripts/

config.schema.json

README.md

README.fr.md
```

---

# Contributing

Contributions are welcome.

Before opening a Pull Request:

- build the project;
- test the plugin with Homebridge;
- ensure the code passes ESLint;
- update the documentation if necessary.

Please keep Pull Requests focused on a single feature or bug fix.

---

# License

This project is distributed under the Apache License 2.0.

See the LICENSE file for details.

---

# Acknowledgements

This project would not exist without the work of the Homebridge and Home Assistant communities.

Special thanks to:

- The Homebridge project
- The Home Assistant project
- Every contributor and tester

---

# Support

If you encounter an issue:

1. Enable debug logging.
2. Reproduce the problem.
3. Collect the relevant log entries.
4. Open a GitHub issue.

Please include:

- Homebridge version
- Home Assistant version
- Node.js version
- Plugin version
- Configuration (without your access token)

---

# Changelog

See CHANGELOG.md for release history.

---

# Future

The current version focuses on environmental sensors.

The architecture has been designed to support additional virtual HomeKit accessories in future releases while keeping the same automatic discovery philosophy.

---

Made with ❤️ for the Homebridge and Home Assistant communities.
