import {
  readFile,
} from 'node:fs/promises';

import {
  createRequire,
} from 'node:module';

import {
  dirname,
  join,
} from 'node:path';

import {
  fileURLToPath,
} from 'node:url';

import type {
  SystemInformation,
} from './systemInformation.js';

interface PackageInformation {
  name?: string;
  version?: string;
}

export class SystemInformationService {
  private readonly require =
    createRequire(
      import.meta.url,
    );

  public async getInformation():
    Promise<SystemInformation> {
    const [
      pluginVersion,
      homebridgeVersion,
      homebridgeUiVersion,
    ] =
      await Promise.all([
        this.findCurrentPluginVersion(),
        this.findInstalledPackageVersion(
          'homebridge',
        ),
        this.findInstalledPackageVersion(
          'homebridge-config-ui-x',
        ),
      ]);

    return {
      pluginVersion:
        pluginVersion ??
        'Non disponible',

      homebridgeVersion:
        homebridgeVersion ??
        'Non disponible',

      homebridgeUiVersion:
        homebridgeUiVersion ??
        'Non disponible',

      nodeVersion:
        process.version,

      platform:
        this.getPlatformName(),
    };
  }

  private async findCurrentPluginVersion():
    Promise<string | undefined> {
    const currentFilePath =
      fileURLToPath(
        import.meta.url,
      );

    return this.findPackageVersionFromDirectory(
      dirname(
        currentFilePath,
      ),
      'homebridge-ha-virtual-devices',
    );
  }

  private async findInstalledPackageVersion(
    packageName: string,
  ): Promise<string | undefined> {
    try {
      const packageEntryPath =
        this.require.resolve(
          packageName,
        );

      return this.findPackageVersionFromDirectory(
        dirname(
          packageEntryPath,
        ),
        packageName,
      );
    } catch {
      if (
        packageName ===
          'homebridge-config-ui-x'
      ) {
        return this.readPackageVersion(
          '/opt/homebridge/lib/node_modules/homebridge-config-ui-x/package.json',
        );
      }

      return undefined;
    }
  }

  private async findPackageVersionFromDirectory(
    initialDirectory: string,
    expectedPackageName: string,
  ): Promise<string | undefined> {
    let currentDirectory =
      initialDirectory;

    while (true) {
      const packageFilePath =
        join(
          currentDirectory,
          'package.json',
        );

      const packageInformation =
        await this.readPackageInformation(
          packageFilePath,
        );

      if (
        packageInformation?.name ===
          expectedPackageName &&
        typeof packageInformation.version ===
          'string'
      ) {
        return packageInformation.version;
      }

      const parentDirectory =
        dirname(
          currentDirectory,
        );

      if (
        parentDirectory ===
          currentDirectory
      ) {
        return undefined;
      }

      currentDirectory =
        parentDirectory;
    }
  }

  private async readPackageInformation(
    packageFilePath: string,
  ): Promise<PackageInformation | undefined> {
    try {
      const content =
        await readFile(
          packageFilePath,
          'utf8',
        );

      const parsed =
        JSON.parse(
          content,
        ) as PackageInformation;

      return parsed;
    } catch {
      return undefined;
    }
  }

  private async readPackageVersion(
    packageFilePath: string,
  ): Promise<string | undefined> {
    const packageInformation =
      await this.readPackageInformation(
        packageFilePath,
      );

    return packageInformation?.version;
  }

  private getPlatformName():
    string {
    switch (
      process.platform
    ) {
    case 'darwin':
      return 'macOS';

    case 'linux':
      return 'Linux';

    case 'win32':
      return 'Windows';

    case 'freebsd':
      return 'FreeBSD';

    default:
      return process.platform;
    }
  }
}
