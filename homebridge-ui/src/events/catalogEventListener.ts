import '@homebridge/plugin-ui-utils/ui.interface';

import {
  CATALOG_UPDATED_EVENT,
  isCatalogUpdatedEvent,
  type CatalogUpdatedEvent,
} from '../models/catalogEvent';

export type CatalogEventCallback = (
  event: CatalogUpdatedEvent,
) => void;

export class CatalogEventListener {
  private callback?: CatalogEventCallback;

  private readonly eventHandler = (
    event: Event,
  ): void => {

    console.log(
      '[UI] événement reçu',
      event,
    );

    if (!(event instanceof MessageEvent)) {
      console.log(
        '[UI] pas un MessageEvent',
      );
      return;
    }

    console.log(
      '[UI] données',
      event.data,
    );

    if (
      !isCatalogUpdatedEvent(
        event.data,
      )
    ) {
      console.log(
        '[UI] événement ignoré',
      );
      return;
    }

    console.log(
      '[UI] catalog-updated validé',
    );

    this.callback?.(
      event.data,
    );
  };

  public subscribe(
    callback: CatalogEventCallback,
  ): void {
    this.unsubscribe();

    this.callback =
      callback;

    window.homebridge.addEventListener(
      CATALOG_UPDATED_EVENT,
      this.eventHandler,
    );
  }

  public unsubscribe(): void {
    window.homebridge.removeEventListener(
      CATALOG_UPDATED_EVENT,
      this.eventHandler,
    );

    this.callback =
      undefined;
  }
}

export const catalogEventListener =
  new CatalogEventListener();