# Homebridge HA Virtual Devices

Automatically expose compatible Home Assistant environmental sensors as native Apple Home Thermostat accessories.

Homebridge HA Virtual Devices automatically discovers compatible environmental sensors from Home Assistant and exposes them as native Apple Home Thermostat accessories.

Instead of displaying multiple independent Temperature, Humidity and Battery sensors, Apple Home presents a single elegant Thermostat tile containing the most useful environmental information.

No manual mapping.

No duplicated accessories.

No polling.

A clean and native Apple Home experience.

> Reality first.
> Every screenshot in this documentation comes from a real installation of the plugin. Personal information has been anonymized where necessary.

![Banner](docs/images/banner.png)

---

## Why this plugin?

Home Assistant is excellent at collecting environmental information from a wide range of devices.

Apple Home provides one of the best user experiences for interacting with your home every day.

Homebridge HA Virtual Devices bridges both ecosystems by automatically grouping compatible measurements into native HomeKit accessories.

The result is a cleaner Apple Home interface that feels completely native.

---

## Features

### Automatic discovery

- Automatic discovery of compatible Home Assistant devices
- Zero manual mapping
- Automatic accessory creation
- Automatic device grouping

### Native HomeKit integration

- Native Apple Home Thermostat accessories
- Temperature and humidity combined into a single accessory
- Real-time updates
- Native HomeKit experience

### Device information

- Automatic manufacturer detection
- Automatic model detection
- Automatic firmware version
- Native accessory information

### Configuration

- Minimal configuration
- Device exclusion support
- Automatic synchronization

---

## Supported sensors

Currently supported:

- Temperature
- Humidity
- Battery level

Planned for future releases:

- Air quality
- CO₂
- VOC
- Atmospheric pressure
- Illuminance
- Additional environmental sensors

---

## Why Thermostat?

Apple Home does not provide a native accessory type dedicated to environmental sensors combining temperature, humidity and battery information.

The native Thermostat accessory currently offers the most intuitive and elegant way to present environmental information while preserving the Apple Home user experience.

The plugin does not emulate custom accessories.

It relies exclusively on native HomeKit services.

---

## Screenshots

The plugin integrates seamlessly into Apple Home while preserving the native Apple experience.

Temperature and humidity are combined into a single Thermostat accessory, providing a cleaner and more intuitive interface than exposing multiple independent sensors.

| Apple Home overview | Thermostat accessory | Accessory information |
|:-------------------:|:--------------------:|:---------------------:|
| ![Apple Home overview](docs/screenshots/apple-home-overview.png) | ![Thermostat](docs/screenshots/apple-home-thermostat.png) | ![Accessory information](docs/screenshots/apple-home-accessory-info.png) |

All screenshots were captured from a real installation of the plugin.

Only personal information has been anonymized.

The Apple Home interface itself has not been modified.

---

## Architecture

```mermaid
flowchart LR

HA["Home Assistant"]
HB["Homebridge HA Virtual Devices"]
HK["Apple Home"]

HA --> HB
HB --> HK
```

The plugin automatically discovers compatible environmental sensors, groups related measurements and exposes them as native Apple Home accessories.

---

## Installation

Install the plugin globally:

```bash
npm install -g homebridge-ha-virtual-devices
```

Restart Homebridge after installation.

---

## Configuration

Example configuration:

```json
{
  "platform": "HAVirtualDevices",
  "name": "HA Virtual Devices",
  "host": "http://homeassistant.local:8123",
  "token": "YOUR_LONG_LIVED_ACCESS_TOKEN"
}
```

Only two parameters are required:

- Home Assistant URL
- Home Assistant Long-Lived Access Token

After restarting Homebridge, compatible devices are discovered automatically.

---

## Compatibility

- Homebridge 1.8 or newer
- Home Assistant 2024.6 or newer
- Apple Home
- iOS 16 or newer
- macOS 13 or newer
- Matter-compatible Home Assistant installations

---

## Roadmap

Future versions will include:

- Additional environmental sensors
- Air quality accessories
- Advanced discovery options
- Enhanced filtering
- Extended metadata
- Improved diagnostics

---

## Contributing

Contributions are welcome.

Bug reports, feature requests and Pull Requests are encouraged.

Please read the `CONTRIBUTING.md` guide before submitting changes.

---

## License

Licensed under the Apache License 2.0.