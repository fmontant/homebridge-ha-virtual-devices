import type {
  ClimateAccessory,
} from '../accessories/climateAccessory.js';

export class AccessoryEntityIndex {
  private readonly accessoriesByEntityId =
    new Map<string, ClimateAccessory>();

  private readonly deviceIdsByEntityId =
    new Map<string, string>();

  private readonly entityIdsByAccessoryUUID =
    new Map<string, Set<string>>();

  public register(
    entityId: string,
    deviceId: string,
    accessoryUUID: string,
    accessory: ClimateAccessory,
  ): void {
    this.accessoriesByEntityId.set(
      entityId,
      accessory,
    );

    this.deviceIdsByEntityId.set(
      entityId,
      deviceId,
    );

    let registeredEntityIds =
      this.entityIdsByAccessoryUUID.get(
        accessoryUUID,
      );

    if (!registeredEntityIds) {
      registeredEntityIds =
        new Set<string>();

      this.entityIdsByAccessoryUUID.set(
        accessoryUUID,
        registeredEntityIds,
      );
    }

    registeredEntityIds.add(
      entityId,
    );
  }

  public getAccessory(
    entityId: string,
  ): ClimateAccessory | undefined {
    return this.accessoriesByEntityId.get(
      entityId,
    );
  }

  public getDeviceId(
    entityId: string,
  ): string | undefined {
    return this.deviceIdsByEntityId.get(
      entityId,
    );
  }

  public removeAccessory(
    accessoryUUID: string,
  ): void {
    const entityIds =
      this.entityIdsByAccessoryUUID.get(
        accessoryUUID,
      );

    if (!entityIds) {
      return;
    }

    for (
      const entityId
      of entityIds
    ) {
      this.accessoriesByEntityId.delete(
        entityId,
      );

      this.deviceIdsByEntityId.delete(
        entityId,
      );
    }

    this.entityIdsByAccessoryUUID.delete(
      accessoryUUID,
    );
  }

  public clear():
    void {
    this.accessoriesByEntityId.clear();
    this.deviceIdsByEntityId.clear();
    this.entityIdsByAccessoryUUID.clear();
  }
}
