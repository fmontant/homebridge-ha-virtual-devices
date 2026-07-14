export class EntityMatcher {

  public static sameDevice(
    entityA: string,
    entityB: string,
  ): boolean {
    return this.deviceKey(entityA) === this.deviceKey(entityB);
  }

  public static deviceKey(
    entityId: string,
  ): string {
    return entityId
      .replace(/^sensor\./, '')
      .replace(/_(temperature|humidite|humidity|batterie|battery)(_\d+)?$/, '$2');
  }
}