import {
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { dirname } from 'node:path';

export interface MatterCommissioningRequest {
  id: string;
  pairingCode: string;
  createdAt: string;
}

export interface MatterCommissioningResponse {
  id: string;
  success: boolean;
  completedAt: string;
  error?: string;
}

export class MatterCommissioningStore {
  public constructor(
    private readonly requestFilePath: string,
    private readonly responseFilePath: string,
  ) {}

  public async saveRequest(
    request: MatterCommissioningRequest,
  ): Promise<void> {
    await this.writeJson(
      this.requestFilePath,
      request,
    );
  }

  public async loadRequest():
    Promise<MatterCommissioningRequest | undefined> {
    return this.readJson<
      MatterCommissioningRequest
    >(
      this.requestFilePath,
    );
  }

  public async deleteRequest():
    Promise<void> {
    await rm(
      this.requestFilePath,
      {
        force: true,
      },
    );
  }

  public async saveResponse(
    response: MatterCommissioningResponse,
  ): Promise<void> {
    await this.writeJson(
      this.responseFilePath,
      response,
    );
  }

  public async loadResponse():
    Promise<MatterCommissioningResponse | undefined> {
    return this.readJson<
      MatterCommissioningResponse
    >(
      this.responseFilePath,
    );
  }

  public async deleteResponse():
    Promise<void> {
    await rm(
      this.responseFilePath,
      {
        force: true,
      },
    );
  }

  private async readJson<T>(
    filePath: string,
  ): Promise<T | undefined> {
    try {
      const content =
        await readFile(
          filePath,
          'utf8',
        );

      return JSON.parse(
        content,
      ) as T;
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        return undefined;
      }

      throw error;
    }
  }

  private async writeJson(
    filePath: string,
    value: unknown,
  ): Promise<void> {
    await mkdir(
      dirname(
        filePath,
      ),
      {
        recursive: true,
      },
    );

    const temporaryFilePath =
      `${filePath}.tmp`;

    const content =
      JSON.stringify(
        value,
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
      filePath,
    );
  }
}