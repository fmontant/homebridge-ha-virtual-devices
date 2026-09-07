export interface MatterDeviceDescriptor {
  id: string;
  peerId: string;
  name: string;
  nodeId: string;
  vendorName?: string;
  productName?: string;
  serialNumber?: string;
  uniqueId?: string;
  softwareVersion?: string;
  hardwareVersion?: string;
  temperatureEndpointId?: number;
  humidityEndpointId?: number;
  batteryEndpointId?: number;
}

export interface MatterDeviceState {
  temperature?: number;
  humidity?: number;
  batteryLevel?: number;
  available: boolean;
}