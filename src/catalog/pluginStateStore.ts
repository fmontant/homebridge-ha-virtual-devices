import {
  mkdir,
  readFile,
  rename,
  writeFile,
} from 'node:fs/promises';
import { dirname } from 'node:path';

export interface PluginState {
  lastSynchronizationAt?: string;
}

export class PluginStateStore {
  constructor(
    private readonly filePath: string,
  ) {}

  public async load():
    Promise<PluginState> {
    try {
      const content =
        await readFile(
          this.filePath,
          'utf8',
        );

      const parsed:
        unknown =
          JSON.parse(content);

      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        return {};
      }

      const state =
        parsed as Record<
          string,
          unknown
        >;

      return {
        lastSynchronizationAt:
          typeof state
            .lastSynchronizationAt ===
          'string'
            ? state
              .lastSynchronizationAt
            : undefined,
      };
    } catch (
      error
    ) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        return {};
      }

      throw error;
    }
  }

  public async save(
    state: PluginState,
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
        state,
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

  public async saveSynchronization(
    date: Date,
  ): Promise<void> {
    const state =
      await this.load();

    await this.save({
      ...state,
      lastSynchronizationAt:
        date.toISOString(),
    });
  }
}