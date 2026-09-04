import '@matter/nodejs';

import { ServerNode } from '@matter/node';

export class MatterController {
  private node?: ServerNode;

  public async start(): Promise<void> {
    if (this.node) {
      return;
    }

    const node = await ServerNode.create();

    await node.start();

    this.node = node;
  }

  public async stop(): Promise<void> {
    if (!this.node) {
      return;
    }

    await this.node.close();

    this.node = undefined;
  }

  public getNode(): ServerNode {
    if (!this.node) {
      throw new Error(
        'Matter controller is not started.',
      );
    }

    return this.node;
  }
}