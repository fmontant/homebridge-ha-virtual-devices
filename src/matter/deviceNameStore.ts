import {
  mkdir,
  readFile,
  rename,
  writeFile,
} from 'node:fs/promises';
import { dirname } from 'node:path';

interface MatterDeviceNameRegistry {
  version: 1;
  devices: Record<
    string,
    {
      name: string;
    }
  >;
}

export class MatterDeviceNameStore {
  public constructor(
    private readonly filePath: string,
  ) {}

  public async getName(
    uniqueId: string,
  ): Promise<string | undefined> {
    const registry =
      await this.load();

    return registry.devices[uniqueId]?.name;
  }

  public async saveName(
    uniqueId: string,
    name: string,
  ): Promise<void> {
    const registry =
      await this.load();

    registry.devices[uniqueId] = {
      name,
    };

    await this.save(
      registry,
    );
  }

  private async load():
    Promise<MatterDeviceNameRegistry> {
    try {
      const content =
        await readFile(
          this.filePath,
          'utf8',
        );

      return JSON.parse(
        content,
      ) as MatterDeviceNameRegistry;
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        return {
          version: 1,
          devices: {},
        };
      }

      throw error;
    }
  }

  private async save(
    registry:
      MatterDeviceNameRegistry,
  ): Promise<void> {
    await mkdir(
      dirname(
        this.filePath,
      ),
      {
        recursive: true,
      },
    );

    const temporaryFilePath =
      `${this.filePath}.tmp`;

    const content =
      JSON.stringify(
        registry,
        null,
        2,
      );

    await writeFile(
      temporaryFilePath,
      `${content}\n`,
      {
        encoding: 'utf8',
        mode: 0o600,
      },
    );

    await rename(
      temporaryFilePath,
      this.filePath,
    );
  }

}
