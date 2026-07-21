# Troubleshooting

This guide helps diagnose and resolve the most common issues encountered when using **Homebridge HA Virtual Devices**.

Most problems can be identified quickly using Homebridge logs together with the Home Assistant Developer Tools.

---

# Before you start

Before investigating an issue, verify:

- Homebridge is running.
- Home Assistant is running.
- Both systems can communicate over the network.
- The plugin is enabled.
- Your Long-Lived Access Token is still valid.

Many problems are caused by network connectivity or authentication failures.

---

# Enable debug logging

When reporting a problem, enable the plugin's debug logging first.

Restart Homebridge after enabling debug mode.

The logs usually provide enough information to identify:

- connection problems;
- discovery issues;
- synchronization failures;
- accessory lifecycle events.

---

# Home Assistant connection

## Symptoms

- No devices are discovered.
- The plugin repeatedly reconnects.
- Homebridge logs show connection errors.

## Possible causes

- Incorrect Home Assistant URL.
- Invalid access token.
- Firewall restrictions.
- Home Assistant unavailable.

## Resolution

Verify:

- the configured URL;
- the Long-Lived Access Token;
- Home Assistant accessibility from the Homebridge host.

---

# No devices discovered

## Symptoms

The catalog remains empty.

## Possible causes

- No supported sensors exist.
- Discovery failed.
- Home Assistant connection failed.

## Resolution

Verify that your sensors expose supported entities such as:

- temperature;
- humidity;
- battery level.

Then restart Homebridge and review the logs.

---

# Accessory not visible in Apple Home

## Symptoms

The device exists in the catalog but does not appear in Apple Home.

## Verify

- Publication is enabled.
- The device is not hidden.
- Homebridge completed synchronization.
- Apple Home has refreshed.

If necessary, wait a few seconds after changing the publication state.

Since version 1.0.9, synchronization is automatic.

---

# Temperature does not update

## Symptoms

Apple Home shows an old temperature.

## Verify

- Home Assistant receives new values.
- The sensor is available.
- The WebSocket connection is active.

If Home Assistant itself is not updating, the plugin cannot receive new values.

---

# Humidity missing

## Possible causes

- The sensor has no humidity entity.
- Humidity publication is disabled.
- Discovery occurred before the humidity entity became available.

Restarting Homebridge usually forces a complete rediscovery.

---

# Battery level missing

Battery information is displayed only when:

- Home Assistant exposes a battery entity;
- battery support is enabled;
- the battery entity belongs to the same physical device.

---

# Device unavailable

## Symptoms

The device appears unavailable.

## Typical causes

- Battery replacement.
- Zigbee routing changes.
- Coordinator restart.
- Home Assistant restart.

Normally no action is required.

Once communication resumes, the accessory automatically recovers.

---

# Device disappeared

The plugin intentionally keeps catalog entries.

This preserves:

- favorites;
- rooms;
- publication state;
- discovery history.

If the sensor returns later, the existing catalog entry is reused.

---

# Publication changes not applied

Since version 1.0.9, publication changes are synchronized automatically.

If synchronization does not occur:

1. Verify the catalog was updated.
2. Verify Homebridge logs.
3. Wait a few seconds.
4. Restart Homebridge only if synchronization still does not occur.

Restarting should be considered a last resort.

---

# Home Assistant restarted

The plugin automatically reconnects.

Expected behavior:

- reconnect;
- rediscover devices;
- refresh values;
- continue synchronization.

No manual intervention should normally be required.

---

# Apple Home still shows old values

Apple Home occasionally caches values.

Verify first that:

- Home Assistant displays the correct value;
- Homebridge logs show updated values.

If both are correct, Apple Home generally refreshes automatically after a short delay.

---

# Duplicate accessories

Duplicate accessories are usually caused by:

- multiple Homebridge instances;
- multiple plugin installations;
- HomeKit cache inconsistencies.

Verify that only one instance of the plugin manages a given Home Assistant installation.

---

# UI does not refresh

If the Homebridge UI does not immediately display changes:

- reload the page;
- verify Homebridge is running;
- verify the plugin has started correctly.

Real-time synchronization requires the UI backend to be running normally.

---

# Catalog inconsistencies

If the catalog appears inconsistent:

- stop Homebridge;
- verify the catalog file exists;
- inspect its JSON structure;
- restart Homebridge.

Do not manually edit the catalog unless you understand its structure.

---

# Reading the logs

Useful log messages include:

```
Loading accessory from cache

Restoring HomeKit accessory

Accessory configured

Catalog synchronized

Availability updated

Device discovered

Accessory unpublished

Accessory published
```

These messages generally indicate where the synchronization process currently is.

---

# Collecting diagnostic information

Before opening an issue, collect:

- Homebridge version;
- Node.js version;
- Home Assistant version;
- plugin version;
- operating system;
- complete error message;
- relevant log excerpts;
- steps to reproduce.

The more information provided, the easier the diagnosis.

---

# Known limitations

The plugin intentionally relies only on native HomeKit capabilities.

Some Apple Home behaviors cannot be modified, including:

- internal HomeKit caching;
- refresh timing;
- thermostat presentation;
- accessory layout inside Apple Home.

These limitations originate from HomeKit itself rather than the plugin.

---

# Reporting an issue

When reporting an issue on GitHub, include:

1. A clear description of the problem.
2. What you expected to happen.
3. What actually happened.
4. Relevant logs.
5. Steps required to reproduce the issue.

Screenshots of Apple Home and the Homebridge UI are often extremely helpful.

---

# Final advice

Most reported issues are resolved by checking three things:

1. Home Assistant is providing the expected values.
2. Homebridge is receiving and logging those values.
3. Apple Home has refreshed after synchronization.

Following this order avoids unnecessary troubleshooting and quickly identifies where the problem actually occurs.
