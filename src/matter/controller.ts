import '@matter/nodejs';

import { Environment } from '@matter/general';
import { ServerNode } from '@matter/node';

export class MatterController {

  private node?: ServerNode;

  public constructor(
        private readonly storagePath: string,
  ) { }

  public async start(): Promise<void> {

    if (this.node) {
      return;
    }

    const environment =
            new Environment(
              'homebridge-ha-virtual-devices',
              Environment.default,
            );

    environment.vars.set(
      'storage.path',
      this.storagePath,
    );

    const node =
            await ServerNode.create({
              id: 'homebridge-ha-virtual-devices',
              environment,
            });

    await node.start();

    this.node = node;
  }

  public async commission(
    pairingCode: string,
  ): Promise<void> {
    const node = this.getNode();

    await node.peers.commission({
      pairingCode,
    });
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