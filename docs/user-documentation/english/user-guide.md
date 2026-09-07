# User Guide

Welcome to **Homebridge HA Virtual Devices**.

This guide explains how to install, configure and use version 2 of the plugin with **Home Assistant**, **Matter**, or both simultaneously, to publish compatible sensors in **Apple Home**.

No development knowledge is required.

------------------------------------------------------------------------

## Overview

Homebridge HA Virtual Devices transforms compatible sensor data into HomeKit accessories designed for display in Apple Home.

Version 2 can use two independent sources:

- **Home Assistant**, through its API and WebSocket connection.
- **Matter**, by directly integrating a compatible Matter device into the plugin.

Both sources can be enabled simultaneously. Devices discovered from either source are managed through the same plugin catalog.

The plugin is designed to:

- simplify sensor integration into Apple Home;
- avoid manually creating virtual accessories;
- preserve user preferences;
- provide a simple graphical interface;
- allow Matter to be used without requiring Home Assistant.

------------------------------------------------------------------------

## Main features

The plugin provides:

- selection of Home Assistant, Matter, or both sources;
- automatic discovery of compatible Home Assistant sensors;
- Matter sensor addition from the plugin interface;
- publication as HomeKit accessories;
- favorites management;
- device enable and disable controls;
- device hiding;
- persistent custom names;
- an internal catalog room assignment;
- availability and last communication tracking;
- persistent user preferences;
- dynamic value synchronization.

------------------------------------------------------------------------

## Installation

### Prerequisites

You need:

- Homebridge installed and working;
- a Node.js version compatible with your Homebridge installation;
- for Home Assistant: an accessible Home Assistant server and a Long-Lived Access Token;
- for Matter: a compatible Matter sensor that can be placed in pairing mode.

Home Assistant is not required when using Matter only.

### Installation from Homebridge

1. Open the Homebridge interface.
2. Go to **Plugins**.
3. Search for `homebridge-ha-virtual-devices`.
4. Click **Install**.

### Installation with npm

```bash
npm install -g homebridge-ha-virtual-devices
```

------------------------------------------------------------------------

## Initial configuration

Open the plugin settings and select at least one source:

- **Use Home Assistant**
- **Use Matter**

You can enable both.

A configuration with both sources disabled is not valid.

### Home Assistant only

Enable **Use Home Assistant** and disable **Use Matter**.

Enter:

- the Home Assistant address;
- the Long-Lived Access Token.

Then save the configuration.

### Matter only

Disable **Use Home Assistant** and enable **Use Matter**.

Home Assistant connection settings are not required.

The **Add a Matter sensor** panel becomes available in the interface.

### Home Assistant and Matter

Enable both options.

The plugin then uses both providers and adds devices from Home Assistant and Matter to the same catalog.

------------------------------------------------------------------------

## Adding a Matter sensor

A Matter sensor already installed in Apple Home can be shared with the plugin using Matter pairing mode.

In the **Home** app:

1. Open the settings of the sensor you want to add.
2. Select **Turn On Pairing Mode**.
3. Home generates a new Matter sharing code.
4. Copy this code.

In the plugin interface:

1. Make sure **Use Matter** is enabled.
2. Open **Add a Matter sensor**.
3. Enter the new sharing code.
4. Click **Add sensor**.

After a successful addition, the sensor appears in the device list.

You can then rename it to make it easier to identify.

> The code used here is the new sharing code generated when pairing mode is enabled, not necessarily the code originally printed on the device.

------------------------------------------------------------------------

## Home Assistant discovery

When Home Assistant is enabled, the plugin automatically searches for compatible sensors.

No individual sensor configuration is required.

Each discovered device is added to the persistent catalog.

If Home Assistant is disabled, the plugin does not attempt to connect to it.

------------------------------------------------------------------------

## Common catalog

The catalog centralizes the devices known to the plugin, regardless of their source.

For each device, the interface can be used to:

- enable or disable it;
- hide it;
- add it to favorites;
- change its name when supported;
- manage its internal plugin room;
- view its source and detailed information.

Preferences are preserved across synchronizations and restarts.

### About rooms

The room stored in the catalog is an internal plugin setting.

It does not automatically move the accessory to a room in the Apple Home app. HomeKit room assignment remains managed directly in Home.

------------------------------------------------------------------------

## Favorites

Favorites make it easier to find the most important devices.

Use the ★ icon in the catalog to add or remove a favorite.

The change is stored in the persistent catalog.

------------------------------------------------------------------------

## Device states

### Active

The device is enabled in the plugin and can be published to HomeKit.

### Disabled

The device remains known to the catalog but is no longer published as an active device.

### Hidden

The device is intentionally hidden from the interface to simplify the display.

### Missing

The plugin previously knew the device but can no longer find it during synchronization with its source.

Stored preferences are retained so that the device can be recovered if it reappears.

------------------------------------------------------------------------

## Availability

Availability indicates whether the source is currently providing usable information for the device.

An unavailable device is not automatically removed from the catalog.

When a sensor becomes available again, its new values can be synchronized again.

------------------------------------------------------------------------

## Last communication

**Last communication** indicates the most recent activity recorded for the sensor.

An old date can indicate:

- a sensor that is no longer communicating;
- a depleted battery;
- a connection loss;
- a problem between the plugin and the sensor source.

The interpretation depends on the source used: Home Assistant or Matter.

------------------------------------------------------------------------

## Administration interface

The graphical interface allows you to:

- select the sources to use;
- add a Matter sensor;
- search for a device;
- filter the catalog;
- sort the results;
- view device details;
- modify preferences.

The Matter panel is displayed only when Matter is enabled.

------------------------------------------------------------------------

## Search and sorting

The search field makes it easy to find a device.

The catalog can also be sorted using the criteria provided by the interface, such as name, room, state, or favorites.

------------------------------------------------------------------------

## Device details

Depending on the device and its source, the details panel can display:

- name;
- identifier;
- source;
- internal plugin room;
- state;
- available capabilities;
- availability;
- last communication.

------------------------------------------------------------------------

## Synchronization

The plugin receives changes from its sources and updates the corresponding devices.

With Home Assistant, changes are received through the WebSocket connection.

With Matter, devices integrated through the Matter provider send their changes to the plugin.

Catalog preferences remain independent from these value updates.

------------------------------------------------------------------------

## Upgrade from version 1.x

Version 2 introduces source selection.

To preserve historical behavior, an existing configuration that does not yet contain the new source settings is interpreted as follows:

- Home Assistant: **enabled**
- Matter: **disabled**

Migration therefore does not require an existing Home Assistant installation to be reconfigured immediately.

------------------------------------------------------------------------

## Updating the plugin

When updating:

1. Install the new version.
2. Restart Homebridge if the interface or Homebridge requests it.
3. Check the logs if you notice unusual behavior.

The persistent catalog is designed to preserve user preferences.

------------------------------------------------------------------------

## Best practices

We recommend:

- enabling only the sources you actually use;
- keeping Homebridge and related components up to date;
- monitoring sensor batteries;
- checking Last communication when a sensor appears to be frozen;
- using favorites and hiding to keep the catalog easy to navigate;
- checking Homebridge logs before performing major corrective actions.

------------------------------------------------------------------------

## FAQ

### Why are my sensors displayed as thermostats?

Apple Home does not provide a dedicated environmental sensor accessory presentation for this type of data.

The thermostat service provides a suitable native HomeKit presentation for these sensors.

### Can I remove a device?

You can disable a device from the plugin interface without removing it from the persistent catalog.

The device remains known to the plugin and can be managed again later.

### Can I restore it later?

Yes.

If a device becomes available again, its existing catalog entry and stored preferences are retained.

### Will I lose my favorites?

No.

Favorites are stored in the persistent catalog and are preserved across synchronizations and Homebridge restarts.

### Do I need to restart Homebridge after every change?

No.

Changes to catalog preferences and publication settings are synchronized automatically. A Homebridge restart should not normally be required.

------------------------------------------------------------------------

## Support

If you encounter a problem:

1. Consult the [Troubleshooting guide](troubleshooting.md).
2. Check the Homebridge logs.
3. Identify the affected source: Home Assistant, Matter, or both.
4. Record the plugin and Homebridge versions.
5. Open a GitHub issue if the problem persists.
