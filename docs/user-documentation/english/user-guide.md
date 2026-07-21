# User Guide

Welcome to **Homebridge HA Virtual Devices**.

This guide explains how to install, configure and use the plugin on a daily basis.

Unlike the Architecture and Developer Guide documents, this guide focuses entirely on the end-user experience.

---

# What does this plugin do?

The plugin automatically discovers compatible environmental sensors from Home Assistant and exposes them to Apple Home through Homebridge.

Instead of creating multiple HomeKit accessories for a single physical sensor, the plugin intelligently groups them into one native thermostat accessory.

Example:

Without the plugin:

```
Living Room Temperature
Living Room Humidity
Living Room Battery
```

With the plugin:

```
Living Room
(Thermostat)
```

The result is a cleaner Apple Home interface.

---

# Supported devices

The plugin currently supports environmental sensors exposing one or more of the following information:

- Temperature
- Relative Humidity
- Battery Level

Support for additional sensor types will be added over time.

---

# Installation

Install the plugin from the Homebridge Plugin Manager or manually using npm.

```
npm install -g homebridge-ha-virtual-devices
```

Restart Homebridge after installation.

---

# Initial configuration

Configure the plugin with your Home Assistant address and a Long-Lived Access Token.

Example:

```json
{
  "platform": "HomeAssistantVirtualDevices",
  "name": "Home Assistant Virtual Devices",
  "host": "http://homeassistant.local:8123",
  "token": "YOUR_TOKEN"
}
```

Once Homebridge starts, discovery begins automatically.

No device configuration is required.

---

# First startup

During startup the plugin:

1. Connects to Home Assistant.
2. Discovers compatible entities.
3. Groups related entities.
4. Builds the device catalog.
5. Restores cached HomeKit accessories.
6. Publishes new accessories when necessary.

The first startup may take a few seconds depending on the number of devices.

---

# Using the Homebridge UI

The integrated Homebridge interface is the recommended way to manage your devices.

From the UI you can:

- browse discovered devices;
- search by name;
- sort devices;
- filter by room;
- mark favorites;
- enable or disable publication;
- hide devices;
- inspect device details.

Changes are applied automatically.

No Homebridge restart is required.

---

# Device information

Selecting a device displays detailed information including:

- Device name
- Home Assistant entity
- Room
- Availability
- Publication state
- Favorite
- Discovery date
- Last communication
- Supported capabilities

This information is read directly from the persistent catalog.

---

# Favorites

Frequently used devices can be marked as favorites.

Favorites make large installations easier to navigate.

Favorite status is preserved across:

- Homebridge restarts
- Plugin upgrades
- Home Assistant restarts

---

# Rooms

Devices can be assigned to rooms.

Room information is used by the Homebridge UI for filtering and organization.

Changing a room updates the persistent catalog immediately.

---

# Publishing devices

Each discovered device has its own publication state.

Enabled devices are published to Apple Home.

Disabled devices remain in the catalog but are not exposed to HomeKit.

This allows users to keep unwanted sensors without deleting them.

---

# Hidden devices

Devices can also be hidden.

Hidden devices remain stored in the catalog while being removed from the normal working view.

This is useful for obsolete or rarely used sensors.

---

# Availability

The plugin continuously tracks device availability.

Typical situations include:

- battery replacement;
- temporary Zigbee outage;
- Home Assistant restart;
- coordinator restart.

Availability changes are automatically reflected inside the catalog.

When possible, HomeKit also reflects communication failures.

---

# Last communication

Each device records the timestamp of its latest successful communication.

This information helps identify:

- sleeping devices;
- disconnected sensors;
- communication issues;
- battery-related problems.

---

# Automatic synchronization

One of the major advantages of version 1.0.9 is dynamic synchronization.

Changing a preference immediately updates HomeKit.

Examples:

- enable publication;
- disable publication;
- change favorite;
- modify room.

There is no need to restart Homebridge.

---

# Updating the plugin

Updating is straightforward.

1. Install the new version.
2. Restart Homebridge.

The persistent catalog preserves:

- favorites;
- rooms;
- publication state;
- hidden devices;
- discovery history.

No additional migration is normally required.

---

# Best practices

For the best experience:

- keep Home Assistant updated;
- keep Homebridge updated;
- use stable Zigbee routing;
- replace batteries before they are completely depleted;
- avoid deleting devices unless necessary.

The plugin is designed to recover automatically from temporary failures.

---

# Frequently Asked Questions

## Why are my sensors displayed as thermostats?

Because Apple Home does not provide a dedicated environmental sensor accessory.

The thermostat service offers the best native experience.

---

## Can I remove a device?

Yes.

Simply disable its publication from the Homebridge UI.

The device remains stored in the catalog.

---

## Can I restore it later?

Yes.

Re-enable publication and the accessory will be synchronized automatically.

---

## Will I lose my favorites?

No.

Favorites are stored in the persistent catalog.

---

## Do I need to restart Homebridge after every change?

No.

Since version 1.0.9, almost every configuration change is synchronized automatically.

---

# Need help?

If you encounter a problem:

1. Enable debug logging.
2. Reproduce the issue.
3. Consult the Troubleshooting guide.
4. Open a GitHub Issue if necessary.

Including logs and reproduction steps will greatly help diagnose the problem.

---

# Summary

Homebridge HA Virtual Devices is designed around one simple objective:

Provide the cleanest possible Apple Home experience while remaining entirely based on native HomeKit services.

The plugin takes care of discovery, synchronization and persistence so that users can focus on using their smart home—not maintaining it.
