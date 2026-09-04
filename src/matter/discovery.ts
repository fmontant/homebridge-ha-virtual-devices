import type { ClientNode, ServerNode } from '@matter/node';
import { BasicInformationBehavior } from '@matter/node/behaviors';
import type {
  MatterDeviceDescriptor,
} from './types.js';

export class MatterDeviceDiscovery {
  public async discover(
    node: ServerNode,
  ): Promise<MatterDeviceDescriptor[]> {
    const devices: MatterDeviceDescriptor[] = [];

    for (const peer of node.peers) {

      devices.push(
        await this.createDescriptor(peer),
      );
    }

    return devices;
  }

  private async createDescriptor(
    peer: ClientNode,
  ): Promise<MatterDeviceDescriptor> {
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
    const basicInformation =
  await peer.act(
    agent => {
      const state =
        agent.get(
          BasicInformationBehavior,
        ).state;

      return {
        nodeLabel: state.nodeLabel,
        productLabel: state.productLabel,
        productName: state.productName,
        vendorName: state.vendorName,
        serialNumber: state.serialNumber,
      };
    },
  );

    const deviceName =
  basicInformation.nodeLabel?.trim() ||
  basicInformation.productLabel?.trim() ||
  basicInformation.productName?.trim() ||
peer.id;

    return {
      id: `matter:${nodeId}`,
      peerId: peer.id,
      name: deviceName,
      nodeId,
      vendorName:
                basicInformation.vendorName,
      productName:
                basicInformation.productName,
      serialNumber:
                basicInformation.serialNumber,
      temperatureEndpointId,
      humidityEndpointId,
      batteryEndpointId,
    };
  }
}