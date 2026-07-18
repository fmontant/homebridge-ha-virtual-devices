import type {
  CatalogDevice,
} from './catalogDevice';

export const CATALOG_UPDATED_EVENT =
  'catalog-updated';

export interface CatalogUpdatedEvent {
  devices: CatalogDevice[];
  updatedAt: string;
}

export function isCatalogUpdatedEvent(
  value: unknown,
): value is CatalogUpdatedEvent {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return false;
  }

  const event =
    value as Partial<CatalogUpdatedEvent>;

  return (
    Array.isArray(
      event.devices,
    ) &&
    typeof event.updatedAt === 'string'
  );
}