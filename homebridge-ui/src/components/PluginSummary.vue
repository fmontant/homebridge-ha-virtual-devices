<script setup lang="ts">
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
} from 'vue';

import { useI18n } from 'vue-i18n';

import type {
  CatalogDevice,
} from '../models/catalogDevice';

import CollapsibleSection from './CollapsibleSection.vue';

import {
  systemInformationApi,
  type SystemInformation,
} from '../api/systemInformationApi';

const { t } = useI18n();

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
    return t('pluginSummary.notAvailable');
  }

  const timestamp =
    Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return t('pluginSummary.notAvailable');
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
    return t(
      'pluginSummary.relative.now',
    );
  }

  const elapsedMinutes =
    Math.floor(
      elapsedSeconds /
      60,
    );

  if (elapsedMinutes < 60) {
    return t(
      'pluginSummary.relative.minutes',
      { count: elapsedMinutes },
    );
  }

  const elapsedHours =
    Math.floor(
      elapsedMinutes /
      60,
    );

  if (elapsedHours < 24) {
    return t(
      'pluginSummary.relative.hours',
      { count: elapsedHours },
    );
  }

  const elapsedDays =
    Math.floor(
      elapsedHours /
      24,
    );

  return t(
    'pluginSummary.relative.days',
    { count: elapsedDays },
  );
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
    :title="t('pluginSummary.title')"
    :description="t('pluginSummary.description')"
    content-id="plugin-functioning-summary"
  >
    <div class="summary-grid">
      <section class="summary-card">
        <h2>
          🌐 {{ t('pluginSummary.connection.title') }}
        </h2>

        <dl>
          <div>
            <dt>
              {{ t('pluginSummary.connection.homeAssistant') }}
            </dt>

            <dd class="connected-value">
              <span
                class="status-dot"
                aria-hidden="true"
              />

              {{ t('pluginSummary.connection.connected') }}
            </dd>
          </div>

          <div>
            <dt>
              {{ t('pluginSummary.connection.lastSynchronization') }}
            </dt>

            <dd>
              {{ lastSynchronizationLabel }}
            </dd>
          </div>

          <div>
            <dt>
              {{ t('pluginSummary.connection.lastCommunication') }}
            </dt>

            <dd>
              {{ lastCommunicationLabel }}
            </dd>
          </div>
        </dl>
      </section>

      <section class="summary-card">
        <h2>
          📚 {{ t('pluginSummary.catalog.title') }}
        </h2>

        <dl>
          <div>
            <dt>
              {{ t('pluginSummary.catalog.discoveredDevices') }}
            </dt>

            <dd>
              {{ discoveredCount }}
            </dd>
          </div>

          <div>
            <dt>
              {{ t('pluginSummary.catalog.activeDevices') }}
            </dt>

            <dd>
              {{ activeCount }}
            </dd>
          </div>

          <div>
            <dt>
              {{ t('pluginSummary.catalog.favorites') }}
            </dt>

            <dd>
              {{ favoriteCount }}
            </dd>
          </div>
        </dl>
      </section>

      <section class="summary-card">
        <h2>
          🏠 {{ t('pluginSummary.homeKit.title') }}
        </h2>

        <dl>
          <div>
            <dt>
              {{ t('pluginSummary.homeKit.exposedThermostats') }}
            </dt>

            <dd>
              {{ exposedCount }}
            </dd>
          </div>

          <div>
            <dt>
              {{ t('pluginSummary.homeKit.restoredThermostats') }}
            </dt>

            <dd>
              {{ restoredCount }}
            </dd>
          </div>
        </dl>
      </section>

      <section class="summary-card">
        <h2>
          ⚙️ {{ t('pluginSummary.system.title') }}
        </h2>

        <dl>
          <div>
            <dt>
              {{ t('pluginSummary.system.plugin') }}
            </dt>

            <dd>
              {{
                systemInformation?.pluginVersion ??
                t('pluginSummary.notAvailable')
              }}
            </dd>
          </div>

          <div>
            <dt>
              {{ t('pluginSummary.system.homebridge') }}
            </dt>

            <dd>
              {{
                systemInformation?.homebridgeVersion ??
                t('pluginSummary.notAvailable')
              }}
            </dd>
          </div>

          <div>
            <dt>
              {{ t('pluginSummary.system.homebridgeUi') }}
            </dt>

            <dd>
              {{
                systemInformation?.homebridgeUiVersion ??
                t('pluginSummary.notAvailable')
              }}
            </dd>
          </div>

          <div>
            <dt>
              {{ t('pluginSummary.system.node') }}
            </dt>

            <dd>
              {{
                systemInformation?.nodeVersion ??
                t('pluginSummary.notAvailable')
              }}
            </dd>
          </div>

          <div>
            <dt>
              {{ t('pluginSummary.system.platform') }}
            </dt>

            <dd>
              {{
                systemInformation?.platform ??
                t('pluginSummary.notAvailable')
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
