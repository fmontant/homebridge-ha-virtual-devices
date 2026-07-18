import type {
  CatalogApiDevice,
} from './catalogApi.js';

export const CATALOG_UPDATED_EVENT =
  'catalog-updated';

export interface CatalogUpdatedEvent {
  devices: CatalogApiDevice[];
  updatedAt: string;
}

export type CatalogEventPusher = (
  event: string,
  data: CatalogUpdatedEvent,
) => void;

export class CatalogEventPublisher {
  constructor(
    private readonly pushEvent:
      CatalogEventPusher,
  ) {}

  public publish(
    devices: CatalogApiDevice[],
  ): void {
    this.pushEvent(
      CATALOG_UPDATED_EVENT,
      {
        devices,
        updatedAt:
          new Date().toISOString(),
      },
    );
  }
}