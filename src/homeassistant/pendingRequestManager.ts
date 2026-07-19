export type PendingRequest =
  | 'subscribe_state_events'
  | 'subscribe_entity_registry_events'
  | 'subscribe_device_registry_events'
  | 'device_registry'
  | 'entity_registry';

export class PendingRequestManager {
  private nextMessageId = 1;

  private readonly pendingRequests =
    new Map<number, PendingRequest>();

  public create(
    requestType: PendingRequest,
  ): number {
    const id = this.nextMessageId++;

    this.pendingRequests.set(
      id,
      requestType,
    );

    return id;
  }

  public get(
    id: number,
  ): PendingRequest | undefined {
    return this.pendingRequests.get(id);
  }

  public complete(
    id: number,
  ): void {
    this.pendingRequests.delete(id);
  }

  public clear(): void {
    this.pendingRequests.clear();
  }

  public isSubscription(
    requestType: PendingRequest,
  ): boolean {
    return (
      requestType ===
        'subscribe_state_events' ||
      requestType ===
        'subscribe_entity_registry_events' ||
      requestType ===
        'subscribe_device_registry_events'
    );
  }
}