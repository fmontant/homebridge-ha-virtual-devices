import {
  CatalogDeviceState,
} from '../catalog/catalogDevice.js';

interface SortableCatalogDevice {
  name: string;
  state: CatalogDeviceState;
  preferences: {
    favorite: boolean;
  };
}

export class CatalogSorter {
  public sort<
    T extends SortableCatalogDevice,
  >(
    devices: T[],
  ): T[] {
    return [...devices]
      .sort(
        (left, right) =>
          this.compare(
            left,
            right,
          ),
      );
  }

  private compare(
    left: SortableCatalogDevice,
    right: SortableCatalogDevice,
  ): number {
    const priorityDifference =
      this.getPriority(
        left,
      ) -
      this.getPriority(
        right,
      );

    if (
      priorityDifference !==
      0
    ) {
      return priorityDifference;
    }

    return left.name.localeCompare(
      right.name,
      'fr',
      {
        sensitivity: 'base',
      },
    );
  }

  private getPriority(
    device: SortableCatalogDevice,
  ): number {
    if (
      device.preferences.favorite
    ) {
      return 0;
    }

    switch (
      device.state
    ) {
    case CatalogDeviceState.Enabled:
      return 1;

    case CatalogDeviceState.Missing:
      return 2;

    default:
      return 3;
    }
  }
}