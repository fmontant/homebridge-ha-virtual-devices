# Homebridge HA Virtual Devices

Homebridge HA Virtual Devices exposes environmental sensors in Apple
Home as clean, native HomeKit accessories.

Starting with version 2.0, sensors can come from **Home Assistant,
Matter, or both at the same time**.

The plugin groups compatible environmental information into a single
read-only HomeKit thermostat accessory, keeping Apple Home clear and
easy to use.

------------------------------------------------------------------------

## Overview

Homebridge HA Virtual Devices provides two independent sensor sources:

-   **Home Assistant** --- discovers compatible environmental sensors
    already integrated into Home Assistant.
-   **Matter** --- connects directly to compatible Matter sensors,
    including devices already present in Apple Home, without requiring
    Home Assistant.

Both sources can be enabled independently or used together.

Regardless of their source, discovered sensors feed the same persistent
device catalog and are published to HomeKit using the same native
accessory model.

Instead of exposing temperature, humidity and battery information as
separate accessories, compatible data is grouped into a single read-only
HomeKit thermostat accessory.

The result is:

-   a cleaner Apple Home interface;
-   fewer accessories to manage;
-   richer information in a single tile;
-   the freedom to use Home Assistant, Matter, or both;
-   a user experience built entirely on native HomeKit services.

No polling.

No manual device mapping.

No custom HomeKit services.

Only native HomeKit accessories.

------------------------------------------------------------------------

## Why this plugin exists

Apple Home does not provide a dedicated accessory type specifically
designed for presenting environmental sensors as a single,
information-rich tile.

Publishing each sensor independently can quickly create unnecessary
complexity:

-   one accessory for temperature;
-   one accessory for humidity;
-   separate battery information.

After evaluating the available native HomeKit accessory types, the
thermostat service proved to provide the clearest experience for this
use case.

A single thermostat tile can naturally display:

-   current temperature;
-   current relative humidity;
-   accessory information;
-   battery level when available.

The objective of this project is simple:

> Use native HomeKit capabilities to present environmental sensors
> clearly in Apple Home, regardless of whether their data comes from
> Home Assistant or Matter.

The accessories created by the plugin are strictly read-only. No heating
or cooling controls are exposed.

------------------------------------------------------------------------

## Features

### Flexible sensor sources

Version 2.0 introduces two independent providers.

You can use:

-   **Home Assistant only**;
-   **Matter only**;
-   **Home Assistant and Matter simultaneously**.

Home Assistant is therefore no longer required when compatible sensors
can be accessed directly through Matter.

For existing installations upgraded from version 1.x, the historical
behavior is preserved by default: Home Assistant remains enabled and
Matter remains disabled until explicitly activated.

------------------------------------------------------------------------

### Automatic discovery

When Home Assistant is enabled, compatible environmental entities are
discovered automatically.

When Matter is enabled, compatible commissioned Matter sensors are
discovered and integrated directly.

No manual mapping between individual temperature, humidity and battery
entities is required.

------------------------------------------------------------------------

### Matter commissioning

Matter devices can be added directly from the Homebridge plugin
interface.

For a Matter sensor already installed in Apple Home:

1.  Open the sensor settings in the Apple Home app.
2.  Choose **Turn On Pairing Mode**.
3.  Apple Home generates a new Matter sharing code.
4.  Enable Matter in the plugin configuration.
5.  Enter the sharing code in the **Add a Matter sensor** panel.
6.  Select **Add sensor**.

After successful commissioning, the sensor appears in the common device
catalog and can be renamed to make it easier to identify.

This allows a compatible Matter sensor to remain available in Apple Home
while also being used directly by Homebridge HA Virtual Devices.

------------------------------------------------------------------------

### Automatic grouping

Related environmental information is grouped into a single HomeKit
accessory whenever available.

Instead of exposing separate accessories for:

-   temperature;
-   humidity;
-   battery;

Apple Home displays one thermostat tile containing the compatible
information for the device.

------------------------------------------------------------------------

## Native HomeKit accessories

Everything exposed by the plugin uses standard HomeKit services and
characteristics.

The plugin does not rely on:

-   custom HomeKit services;
-   unsupported characteristics;
-   proprietary HomeKit workarounds.

The objective is to provide the most compatible and native Apple Home
experience possible.

------------------------------------------------------------------------

## Real-time updates

Updates are event-driven.

With **Home Assistant**, the plugin uses the Home Assistant WebSocket
API and automatically reconnects after temporary communication failures.

With **Matter**, the plugin subscribes directly to the supported Matter
attributes exposed by commissioned devices.

No periodic polling is required for normal sensor updates.

Changes are propagated to the corresponding HomeKit accessories as they
are received from the active provider.

------------------------------------------------------------------------

## Rich accessory information

Whenever available, accessories expose additional information through
HomeKit:

-   Manufacturer
-   Model
-   Firmware version
-   Hardware version
-   Serial number
-   Battery level

The exact information available depends on the source device and the
data exposed by Home Assistant or Matter.

------------------------------------------------------------------------

## Persistent device catalog

The plugin maintains a persistent catalog of discovered devices.

Both Home Assistant and Matter feed this same catalog. Each discovered
device retains its source information while sharing the same publication
and preference model.

Unlike traditional Homebridge accessories that may disappear permanently
when a source becomes temporarily unavailable, the catalog keeps track
of known devices over time.

Each device record can contain:

-   unique identifier;
-   source;
-   display name;
-   room;
-   publication state;
-   favorite status;
-   hidden state;
-   availability;
-   discovery date;
-   last communication;
-   synchronization status.

The catalog allows user preferences to survive:

-   Homebridge restarts;
-   temporary source interruptions;
-   Home Assistant restarts;
-   plugin upgrades.

The detailed catalog architecture is documented in:

`docs/developer-documentation/architecture/`

------------------------------------------------------------------------

## Dynamic synchronization

The Homebridge interface allows users to modify device preferences
without restarting Homebridge.

When a preference changes, the plugin automatically updates the device
catalog and synchronizes the corresponding HomeKit accessory.

Example workflow:

-   edit a device preference in the Homebridge UI;
-   update the persistent catalog;
-   synchronize the affected accessory;
-   update HomeKit automatically.

No Homebridge restart is required for normal preference changes.

------------------------------------------------------------------------

## Installation

Install the plugin directly from the Homebridge Plugin Manager or using
npm.

``` bash
npm install -g homebridge-ha-virtual-devices
```

Restart Homebridge after installation.

------------------------------------------------------------------------

## Configuration

Version 2.0 allows Home Assistant and Matter to be enabled
independently.

At least one source must be enabled.

### Home Assistant only

This is the default mode for existing installations and provides
continuity with version 1.x.

``` json
{
  "platform": "HAVirtualDevices",
  "name": "HA Virtual Devices",
  "homeAssistantEnabled": true,
  "matterEnabled": false,
  "haUrl": "http://homeassistant.local:8123",
  "token": "YOUR_LONG_LIVED_ACCESS_TOKEN"
}
```

### Matter only

Home Assistant credentials are not required when Home Assistant is
disabled.

``` json
{
  "platform": "HAVirtualDevices",
  "name": "HA Virtual Devices",
  "homeAssistantEnabled": false,
  "matterEnabled": true
}
```

After saving the configuration, use the Matter commissioning panel in
the plugin interface to add compatible sensors.

### Home Assistant and Matter

Both providers can run simultaneously.

``` json
{
  "platform": "HAVirtualDevices",
  "name": "HA Virtual Devices",
  "homeAssistantEnabled": true,
  "matterEnabled": true,
  "haUrl": "http://homeassistant.local:8123",
  "token": "YOUR_LONG_LIVED_ACCESS_TOKEN"
}
```

Devices discovered by both providers coexist in the common catalog.
Version 2.0 does not automatically merge devices simply because they
represent the same physical sensor.

### Configuration parameters

  ---------------------------------------------------------------------------------------------------
  Parameter                Required         Default                             Description
  ------------------------ ---------------- ----------------------------------- ---------------------
  `name`                   Yes              `HA Virtual Devices`                Platform name
                                                                                displayed in
                                                                                Homebridge

  `homeAssistantEnabled`   No               `true`                              Enable Home Assistant
                                                                                as a sensor source

  `matterEnabled`          No               `false`                             Enable Matter as a
                                                                                sensor source

  `haUrl`                  When Home        `http://homeassistant.local:8123`   Full Home Assistant
                           Assistant is                                         URL, without a
                           enabled                                              trailing slash

  `token`                  When Home        ---                                 Home Assistant
                           Assistant is                                         long-lived access
                           enabled                                              token

  `ignoredDevices`         No               `[]`                                Home Assistant device
                                                                                names or identifiers
                                                                                that must not be
                                                                                published to HomeKit

  `debug`                  No               `false`                             Enable additional
                                                                                technical information
                                                                                in Homebridge logs
  ---------------------------------------------------------------------------------------------------

The custom Homebridge interface prevents saving a configuration in which
both Home Assistant and Matter are disabled.

### Upgrading from version 1.x

Version 2.0 preserves the historical Home Assistant configuration by
default.

If `homeAssistantEnabled` and `matterEnabled` are absent from an
existing configuration:

-   Home Assistant is treated as enabled;
-   Matter is treated as disabled.

This allows an existing Home Assistant installation to continue working
without requiring the new source-selection options to be added manually.

------------------------------------------------------------------------

## Documentation

Complete documentation is available in the `docs` directory.

The documentation is divided into user and developer sections.

------------------------------------------------------------------------

## User Documentation

User documentation covers installation, configuration and day-to-day
operation of the plugin.

See:

`docs/user-documentation/`

Topics include:

-   installation;
-   Home Assistant configuration;
-   Matter configuration and commissioning;
-   device catalog management;
-   troubleshooting.

------------------------------------------------------------------------

## Developer Documentation

Developer documentation describes the internal architecture and
development workflow.

See:

`docs/developer-documentation/`

It covers the main components involved in:

-   Home Assistant discovery and synchronization;
-   Matter provider operation;
-   source-neutral climate devices;
-   persistent catalog management;
-   HomeKit accessory publication;
-   custom Homebridge UI;
-   development and release tooling.

------------------------------------------------------------------------

## Development Toolkit

The project includes a development toolkit that automates the main
maintenance and deployment operations.

Common commands include:

  -----------------------------------------------------------------------
  Command                       Description
  ----------------------------- -----------------------------------------
  `npm run dev`                 Deploy the current development build to
                                the configured Homebridge environment and
                                run diagnostics

  `npm run install-on-nas`      Build and install the plugin on the NAS
                                development environment

  `npm run doctor`              Check the Homebridge environment and
                                plugin state

  `npm run logs`                Display Homebridge logs, optionally using
                                a filter

  `npm run prepare-release`     Prepare a new release

  `npm run release`             Publish a prepared release
  -----------------------------------------------------------------------

Developer tooling is intended to keep development, testing and
deployment reproducible.

Detailed documentation is available under:

`docs/developer-documentation/toolkit/`

------------------------------------------------------------------------

## Screenshots

Screenshots of Apple Home and the Homebridge administration interface
are maintained with the project documentation.

They illustrate:

-   thermostat-style environmental sensor tiles in Apple Home;
-   the persistent device catalog;
-   device details and preferences;
-   source selection;
-   Matter commissioning.

------------------------------------------------------------------------

## Project philosophy

Homebridge HA Virtual Devices follows a few simple principles.

### Native first

The plugin prefers native HomeKit services whenever possible.

### Simple configuration

Automatic discovery is preferred over manual device mapping.

Users can choose the source that best matches their environment: Home
Assistant, Matter, or both.

### Reliability

Temporary communication failures should not require users to recreate
accessories.

The persistent catalog keeps device identity and user preferences
separate from temporary source availability.

### Maintainability

Each component has a clearly defined responsibility.

Home Assistant and Matter operate as independent providers while
publishing through the same source-neutral catalog and HomeKit accessory
model.

------------------------------------------------------------------------

## Frequently Asked Questions

### Is Home Assistant required?

No.

Starting with version 2.0, the plugin can operate with Matter only.

Home Assistant remains fully supported and is enabled by default for
existing installations.

------------------------------------------------------------------------

### Can Home Assistant and Matter be used at the same time?

Yes.

Both providers can be enabled simultaneously and feed the same
persistent device catalog.

Devices from the two sources coexist. They are not automatically merged
solely because they represent the same physical sensor.

------------------------------------------------------------------------

### Does the plugin modify Home Assistant?

No.

The Home Assistant integration is read-only.

It:

-   discovers compatible entities;
-   subscribes to Home Assistant events;
-   updates the corresponding HomeKit accessories.

It does not create, modify or delete entities inside Home Assistant.

------------------------------------------------------------------------

### Does Matter require Home Assistant?

No.

Matter is an independent provider.

A compatible Matter sensor can be commissioned directly through the
plugin interface using a Matter sharing code generated from Apple Home.

------------------------------------------------------------------------

### Can a Matter sensor already in Apple Home also be used by the plugin?

Yes, when the device supports Matter multi-admin sharing.

From Apple Home, enable pairing mode for the device and generate a new
Matter sharing code. The code can then be entered in the plugin's Matter
commissioning panel.

The device remains part of the existing Matter fabric while the plugin
joins it as another Matter controller.

------------------------------------------------------------------------

### Is polling used?

Normal sensor updates are event-driven.

Home Assistant uses its WebSocket API, while Matter uses subscriptions
to supported device attributes.

------------------------------------------------------------------------

### What happens if Home Assistant restarts?

When Home Assistant is enabled, the plugin automatically reconnects
after communication is restored.

Devices are rediscovered, current values are refreshed and the
corresponding HomeKit accessories are updated.

No user action should normally be required.

------------------------------------------------------------------------

### What happens if a sensor temporarily disappears?

The persistent catalog keeps track of known devices.

When communication is interrupted:

-   availability can be updated;
-   the accessory remains known;
-   user preferences are preserved.

When the sensor becomes available again, normal operation can resume
without recreating its catalog entry.

------------------------------------------------------------------------

### Will my preferences be lost after upgrading?

The persistent catalog is designed to preserve device preferences across
plugin upgrades.

This includes information such as:

-   favorites;
-   rooms;
-   publication state;
-   hidden devices;
-   discovery history.

Version 2.0 also preserves the historical Home Assistant source behavior
when upgrading from version 1.x.

------------------------------------------------------------------------

## Roadmap

Version 2.0 marks an important architectural milestone: direct Matter
integration is now part of the plugin rather than a future objective.

Future work can therefore focus on extending the experience built around
the common catalog and the two provider architecture.

### Near term

#### User experience

-   bulk operations in the device catalog;
-   additional administration tools;
-   improved device management;
-   richer diagnostics.

#### Developer toolkit

-   additional diagnostic checks;
-   improved troubleshooting tools;
-   extended development automation;
-   better developer documentation.

### Mid term

#### Provider improvements

-   improved discovery;
-   more resilient synchronization;
-   additional configuration and diagnostic options;
-   broader compatibility across supported sources.

#### Environmental sensors

Evaluate support for additional environmental information when it can be
represented cleanly through native HomeKit capabilities, including:

-   air quality;
-   CO₂;
-   volatile organic compounds (VOC);
-   atmospheric pressure;
-   illuminance.

### Long term

#### Native ecosystem integration

Continue improving direct integration with open smart-home standards
while preserving the project's native HomeKit approach and avoiding
unnecessary dependencies.

#### Project sustainability

-   continued documentation improvements;
-   community contributions;
-   long-term maintainability;
-   performance optimizations.

------------------------------------------------------------------------

## Contributing

Contributions are welcome.

Before submitting changes, please consult the contribution guidelines
and developer documentation included in the repository.

The project aims to keep changes:

-   focused;
-   maintainable;
-   compatible with native HomeKit behavior;
-   documented;
-   testable.

See `CONTRIBUTING.md` for the main contribution guide and
`CONTRIBUTING.fr.md` for the French version.

------------------------------------------------------------------------

## Support

When reporting an issue, include enough information to reproduce and
diagnose the problem whenever possible.

Useful information includes:

-   Homebridge version;
-   plugin version;
-   Node.js version;
-   enabled provider or providers;
-   relevant Homebridge logs;
-   device type and source;
-   steps required to reproduce the issue.

Do not publish Home Assistant access tokens, Matter credentials, pairing
codes or other secrets.

------------------------------------------------------------------------

## License

This project is distributed under the license defined in the repository.

See the `LICENSE` file for details.

------------------------------------------------------------------------

## Acknowledgements

Homebridge HA Virtual Devices is built around the Homebridge and HomeKit
ecosystems and, starting with version 2.0, integrates both Home
Assistant and Matter as environmental sensor sources.

Thanks to the Homebridge, Home Assistant and Matter open-source
communities and to everyone who tests, reports issues and contributes to
the project.
