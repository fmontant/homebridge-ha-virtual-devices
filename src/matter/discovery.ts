import type { ClientNode, ServerNode } from '@matter/node';

import type {
  MatterDeviceDescriptor,
} from './types.js';

export class MatterDeviceDiscovery {
  public discover(
    node: ServerNode,
  ): MatterDeviceDescriptor[] {
    const devices: MatterDeviceDescriptor[] = [];

    for (const peer of node.peers) {
      devices.push(
        this.createDescriptor(peer),
      );
    }

    return devices;
  }

  private createDescriptor(
    peer: ClientNode,
  ): MatterDeviceDescriptor {
    let temperatureEndpointId: number | undefined;
    let humidityEndpointId: number | undefined;
    let batteryEndpointId: number | undefined;

    for (const endpoint of peer.endpoints) {
      if (
        endpoint.maybeStateOf(
          'temperatureMeasurement',
        )
      ) {
        temperatureEndpointId = endpoint.number;
      }

      if (
        endpoint.maybeStateOf(
          'relativeHumidityMeasurement',
        )
      ) {
        humidityEndpointId = endpoint.number;
      }

      if (
        endpoint.maybeStateOf(
          'powerSource',
        )
      ) {
        batteryEndpointId = endpoint.number;
      }
    }

    const peerAddress = peer.peerAddress;

    if (!peerAddress) {
      throw new Error(
        `Matter peer ${peer.id} has no peer address.`,
      );
    }

    const nodeId = peerAddress.nodeId.toString();

    return {
      id: `matter:${nodeId}`,
      peerId: peer.id,
      name: peer.id,
      nodeId,
      temperatureEndpointId,
      humidityEndpointId,
      batteryEndpointId,
    };
  }
}