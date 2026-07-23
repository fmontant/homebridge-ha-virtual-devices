<script setup lang="ts">
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
} from 'vue';

import type {
  CatalogDevice,
} from '../models/catalogDevice';

import CollapsibleSection from './CollapsibleSection.vue';

import {
  systemInformationApi,
  type SystemInformation,
} from '../api/systemInformationApi';

const props = defineProps<{
  devices: CatalogDevice[];
  lastSynchronizationAt?: string;
}>();

const expanded =
  ref(false);

const now =
  ref(Date.now());

const systemInformation =
  ref<SystemInformation | null>(
    null,
  );

let refreshTimer:
  ReturnType<typeof setInterval> |
  undefined;

const discoveredCount =
  computed(
    () =>
      props.devices.length,
  );

const activeCount =
  computed(
    () =>
      props.devices.filter(
        device =>
          device.state === 'enabled' &&
          device.enabled &&
          !device.archived,
      ).length,
  );

const favoriteCount =
  computed(
    () =>
      props.devices.filter(
        device =>
          device.favorite,
      ).length,
  );

const exposedCount =
  computed(
    () =>
      props.devices.filter(
        device =>
          device.state === 'enabled' &&
          device.enabled &&
          !device.archived,
      ).length,
  );

const restoredCount =
  computed(
    () =>
      props.devices.filter(
        device =>
          device.state === 'enabled' &&
          device.enabled &&
          !device.archived,
      ).length,
  );

const lastCommunicationAt =
  computed<string | undefined>(
    () => {
      const timestamps =
        props.devices
          .map(
            device =>
              device.lastCommunication,
          )
          .filter(
            (
              value,
            ): value is string =>
              typeof value === 'string' &&
              value.length > 0 &&
              !Number.isNaN(
                Date.parse(value),
              ),
          )
          .sort(
            (left, right) =>
              Date.parse(right) -
              Date.parse(left),
          );

      return timestamps[0];
    },
  );

const lastSynchronizationLabel =
  computed(
    () =>
      formatRelativeTime(
        props.lastSynchronizationAt,
      ),
  );

const lastCommunicationLabel =
  computed(
    () =>
      formatRelativeTime(
        lastCommunicationAt.value,
      ),
  );

function formatRelativeTime(
  value?: string,
): string {
  if (!value) {
    return 'Non disponible';
  }

  const timestamp =
    Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return 'Non disponible';
  }

  const elapsedSeconds =
    Math.max(
      0,
      Math.floor(
        (
          now.value -
          timestamp
        ) /
        1000,
      ),
    );

  if (elapsedSeconds < 60) {
  return 'À l’instant';
}

  const elapsedMinutes =
    Math.floor(
      elapsedSeconds /
      60,
    );

  if (elapsedMinutes < 60) {
    return `il y a ${elapsedMinutes} minute${
      elapsedMinutes > 1
        ? 's'
        : ''
    }`;
  }

  const elapsedHours =
    Math.floor(
      elapsedMinutes /
      60,
    );

  if (elapsedHours < 24) {
    return `il y a ${elapsedHours} heure${
      elapsedHours > 1
        ? 's'
        : ''
    }`;
  }

  const elapsedDays =
    Math.floor(
      elapsedHours /
      24,
    );

  return `il y a ${elapsedDays} jour${
    elapsedDays > 1
      ? 's'
      : ''
  }`;
}

onMounted(async () => {
  systemInformation.value =
    await systemInformationApi
      .getInformation();

  refreshTimer =
    setInterval(
      () => {
        now.value =
          Date.now();
      },
      1000,
    );
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(
      refreshTimer,
    );
  }
});
</script>

<template>
  <CollapsibleSection
    v-model="expanded"
    title="Récapitulatif du fonctionnement"
    description="Informations récapitulatives du fonctionnement"
    content-id="plugin-functioning-summary"
  >
    <div class="summary-grid">
      <section class="summary-card">
        <h2>
          🌐 Connexion
        </h2>

        <dl>
          <div>
            <dt>
              Home Assistant
            </dt>

            <dd class="connected-value">
              <span
                class="status-dot"
                aria-hidden="true"
              />

              Connecté
            </dd>
          </div>

          <div>
            <dt>
              Dernière synchronisation
            </dt>

            <dd>
              {{ lastSynchronizationLabel }}
            </dd>
          </div>

          <div>
            <dt>
              Dernière communication
            </dt>

            <dd>
              {{ lastCommunicationLabel }}
            </dd>
          </div>
        </dl>
      </section>

      <section class="summary-card">
        <h2>
          📚 Catalogue
        </h2>

        <dl>
          <div>
            <dt>
              Appareils découverts
            </dt>

            <dd>
              {{ discoveredCount }}
            </dd>
          </div>

          <div>
            <dt>
              Actifs
            </dt>

            <dd>
              {{ activeCount }}
            </dd>
          </div>

          <div>
            <dt>
              Favoris
            </dt>

            <dd>
              {{ favoriteCount }}
            </dd>
          </div>
        </dl>
      </section>

      <section class="summary-card">
        <h2>
          🏠 HomeKit
        </h2>

        <dl>
          <div>
            <dt>
              Thermostats exposés
            </dt>

            <dd>
              {{ exposedCount }}
            </dd>
          </div>

          <div>
            <dt>
              Thermostats restaurés
            </dt>

            <dd>
              {{ restoredCount }}
            </dd>
          </div>
        </dl>
      </section>

      <section class="summary-card">
  <h2>
    ⚙️ Système
  </h2>

  <dl>
    <div>
      <dt>
        Plugin
      </dt>

      <dd>
        {{
          systemInformation?.pluginVersion ??
          'Non disponible'
        }}
      </dd>
    </div>

    <div>
      <dt>
        Homebridge
      </dt>

      <dd>
        {{
          systemInformation?.homebridgeVersion ??
          'Non disponible'
        }}
      </dd>
    </div>

    <div>
      <dt>
        Homebridge UI
      </dt>

      <dd>
        {{
          systemInformation?.homebridgeUiVersion ??
          'Non disponible'
        }}
      </dd>
    </div>

    <div>
      <dt>
        Node.js
      </dt>

      <dd>
        {{
          systemInformation?.nodeVersion ??
          'Non disponible'
        }}
      </dd>
    </div>

    <div>
      <dt>
        Plateforme
      </dt>

      <dd>
        {{
          systemInformation?.platform ??
          'Non disponible'
        }}
      </dd>
    </div>
  </dl>
</section>
    </div>
  </CollapsibleSection>
</template>

<style scoped>
.summary-grid {
  display: grid;
  grid-template-columns:
    repeat(
      4,
      minmax(0, 1fr)
    );
  gap: 12px;
}

.summary-card {
  min-width: 0;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.summary-card h2 {
  margin: 0 0 12px;
  color: #111827;
  font-size: 1rem;
  font-weight: 400;
}

dl {
  display: grid;
  gap: 0;
  margin: 0;
}

dl div {
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    auto;
  gap: 16px;
  align-items: baseline;
  padding: 9px 0;
  border-bottom: 1px solid #eef0f3;
}

dl div:first-child {
  padding-top: 0;
}

dl div:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

dt {
  min-width: 0;
  color: #6b7280;
  font-size: 0.85rem;
}

dd {
  margin: 0;
  color: #111827;
  font-weight: 600;
  text-align: right;
  overflow-wrap: anywhere;
}

.connected-value {
  display: inline-flex;
  gap: 7px;
  align-items: center;
  color: #166534;
}

.status-dot {
  width: 9px;
  height: 9px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #22c55e;
}

@media (max-width: 1000px) {
  .summary-grid {
    grid-template-columns:
      repeat(
        2,
        minmax(0, 1fr)
      );
  }
}

@media (max-width: 600px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
