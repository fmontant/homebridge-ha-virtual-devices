# Deployment

This guide explains how to deploy a published version of **Homebridge HA Virtual Devices** to a Homebridge server for validation or production use.

It assumes that the package has already been published to npm or that a local package has been generated for testing.

---

## Deployment Methods

Two deployment methods are supported:

- install a package published on npm;
- install a locally generated package for testing.

Choose the method that matches your objective.

---

## Deploy a Published Version

Install the latest published version directly from npm.

```bash
npm install homebridge-ha-virtual-devices
```

Or install a specific version.

```bash
npm install -g homebridge-ha-virtual-devices@<version>
```

Restart Homebridge after the installation.

---

## Deploy a Local Package

Generate the package.

```bash
npm pack
```

Then deploy it using the Developer Toolkit.

```bash
npm run install-on-nas
```

The deployment script transfers the generated package to the NAS and installs it on the target Homebridge instance.

---

## Verify the Installation

After deployment:

- restart Homebridge if required;
- verify that the plugin starts without errors;
- confirm that the expected version is installed;
- open the Homebridge user interface;
- verify that the plugin configuration page is available;
- ensure that the device catalog loads correctly.

---

## Troubleshooting

If the deployment fails:

- verify network connectivity;
- verify SSH access to the NAS;
- confirm that Homebridge is running;
- review the installation logs;
- verify that the package was generated successfully.

For common deployment issues, see the [Troubleshooting](Troubleshooting.md) guide.

---

## Next Steps

Once deployment has been verified, continue with functional testing before publishing the release for production use.
