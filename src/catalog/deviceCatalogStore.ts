import {
  mkdir,
  readFile,
  rename,
  writeFile,
} from 'node:fs/promises';

import { dirname } from 'node:path';

import type {
  CatalogDevice,
} from './catalogDevice.js';

export class DeviceCatalogStore {
  constructor(
    private readonly filePath: string,
  ) {}

  public async load():
    Promise<CatalogDevice[]> {
    try {
      const content =
        await readFile(
          this.filePath,
          'utf8',
        );

      const parsed =
        JSON.parse(
          content,
        ) as unknown;

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter(
        (
          device,
        ): device is CatalogDevice =>
          this.isCatalogDevice(
            device,
          ),
      );
    } catch (
      error
    ) {
      if (
        this.isFileNotFoundError(
          error,
        )
      ) {
        return [];
      }

      throw error;
    }
  }

  public async save(
    devices: CatalogDevice[],
  ): Promise<void> {
    const directory =
      dirname(
        this.filePath,
      );

    await mkdir(
      directory,
      {
        recursive: true,
      },
    );

    const temporaryFilePath =
      `${this.filePath}.tmp`;

    const content =
      JSON.stringify(
        devices,
        null,
        2,
      );

    await writeFile(
      temporaryFilePath,
      `${content}\n`,
      'utf8',
    );

    await rename(
      temporaryFilePath,
      this.filePath,
    );
  }

  private isCatalogDevice(
    value: unknown,
  ): value is CatalogDevice {
    if (
      typeof value !== 'object' ||
      value === null
    ) {
      return false;
    }

    const device =
      value as Partial<CatalogDevice>;

    return (
      typeof device.id === 'string' &&
      typeof device.source === 'string' &&
      typeof device.sourceId === 'string' &&
      typeof device.name === 'string' &&
      typeof device.state === 'string' &&
      Array.isArray(
        device.capabilities,
      ) &&
      typeof device.metadata === 'object' &&
      device.metadata !== null &&
      typeof device.preferences === 'object' &&
      device.preferences !== null &&
      typeof device.timestamps === 'object' &&
      device.timestamps !== null
    );
  }

  private isFileNotFoundError(
    error: unknown,
  ): boolean {
    return (
      error instanceof Error &&
      'code' in error &&
      error.code === 'ENOENT'
    );
  }
}