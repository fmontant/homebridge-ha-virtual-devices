import type { Logging } from 'homebridge';

import type { AccessoryManager } from './accessoryManager.js';

interface HomeAssistantStateChangedEvent {
  event?: {
    data?: {
      entity_id?: string;
      new_state?: {
        state?: string;
      } | null;
    };
  };
}

export class EventManager {
  constructor(
    private readonly accessoryManager:
      AccessoryManager,
    private readonly log: Logging,
  ) {}

  public handleEvent(
    event: unknown,
  ): void {
    const message =
      event as HomeAssistantStateChangedEvent;

    const entityId =
      message.event?.data
        ?.entity_id;

    const rawState =
      message.event?.data
        ?.new_state?.state;

    if (
      !entityId ||
      rawState === undefined
    ) {
      return;
    }

    const value =
      Number(rawState);

    if (!Number.isFinite(value)) {
      this.log.debug(
        `État ignoré pour ${entityId} : ${rawState}`,
      );

      return;
    }

    const updated =
      this.accessoryManager
        .updateEntity(
          entityId,
          value,
        );

    if (!updated) {
      return;
    }

    this.log.debug(
      'Mise à jour temps réel : ' +
      `${entityId} = ${value}`,
    );
  }
}