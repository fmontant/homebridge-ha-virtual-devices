import { EventEmitter } from 'node:events';

import type { CatalogDevice } from './catalogDevice.js';

export interface DeviceCatalogEvents {
  added: (device: CatalogDevice) => void;
  updated: (device: CatalogDevice) => void;
  missing: (device: CatalogDevice) => void;
  removed: (device: CatalogDevice) => void;
  preferencesChanged: (device: CatalogDevice) => void;
}

export class DeviceCatalogEventsEmitter {
  private readonly emitter =
    new EventEmitter();

  public on<K extends keyof DeviceCatalogEvents>(
    event: K,
    listener: DeviceCatalogEvents[K],
  ): void {
    this.emitter.on(
      event,
      listener,
    );
  }

  public emit<K extends keyof DeviceCatalogEvents>(
    event: K,
    device: CatalogDevice,
  ): void {
    this.emitter.emit(
      event,
      device,
    );
  }
}