# Getting Started

This guide explains how to prepare a complete development environment for **Homebridge HA Virtual Devices**.

It is intended for developers who want to build, test and contribute to the project.

After reading this guide, you will have a fully functional development environment and will be ready to start developing.

---

## Prerequisites

Before starting, make sure the following software is installed on your workstation.

- Git
- Node.js (LTS version recommended)
- npm
- Homebridge
- Homebridge Config UI X (recommended)
- A source code editor such as Visual Studio Code

Basic knowledge of Git, Node.js and the command line is assumed.

---

## Clone the Repository

Clone the project from GitHub.

```bash
git clone https://github.com/fmontant/homebridge-ha-virtual-devices.git

cd homebridge-ha-virtual-devices
```

---

## Install Dependencies

Install the project dependencies.

```bash
npm install
```

The Homebridge user interface is developed independently and has its own dependencies.

```bash
cd homebridge-ui

npm install

cd ..
```

---

## Build the Project

Compile both the plugin and the Homebridge user interface.

```bash
npm run build:all
```

The build must complete successfully before continuing.

---

## Verify the Environment

Run the project quality checks.

```bash
npm run lint
```

Then rebuild the complete project.

```bash
npm run build:all
```

If both commands complete successfully, your development environment is ready.

---

## Next Steps

Continue with the following guides:

- [Release Workflow](ReleaseWorkflow.md)
- [Deployment](Deployment.md)
- [Reference](Reference.md)
- [Troubleshooting](Troubleshooting.md)
