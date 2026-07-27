<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type {
  CatalogDevice,
  DeviceState,
} from '../models/catalogDevice';

withDefaults(
  defineProps<{
    device: CatalogDevice;
    selected?: boolean;
  }>(),
  {
    selected: false,
  },
);

const emit = defineEmits<{
  click: [];
  favorite: [];
}>();

const { t } = useI18n();

const badgeClass: Record<DeviceState, string> = {
  archived: 'state-archived',
  enabled: 'state-enabled',
  disabled: 'state-disabled',
  missing: 'state-missing',
  error: 'state-error',
};

const availabilityLabel = (
  device: CatalogDevice,
): string =>
  device.available
    ? t(`deviceRow.states.${device.state}`)
    : t('deviceRow.states.offline');

const availabilityClass = (
  device: CatalogDevice,
): string =>
  device.available
    ? badgeClass[device.state]
    : 'state-offline';

const favoriteAriaLabel = (
  device: CatalogDevice,
): string =>
  device.favorite
    ? t('deviceRow.favorite.remove', {
        name: device.name,
      })
    : t('deviceRow.favorite.add', {
        name: device.name,
      });
</script>

<template>
  <div
    class="device-row"
    :class="{ 'device-row-selected': selected }"
    role="button"
    tabindex="0"
    :aria-pressed="selected"
    @click="emit('click')"
    @keydown.enter="emit('click')"
    @keydown.space.prevent="emit('click')"
  >
    <span
      class="badge"
      :class="availabilityClass(device)"
    >
      {{ availabilityLabel(device) }}
    </span>

    <button
      type="button"
      class="favorite-button"
      :aria-label="favoriteAriaLabel(device)"
      @click.stop="emit('favorite')"
    >
      {{ device.favorite ? '★' : '☆' }}
    </button>

    <strong class="device-name">
      {{ device.name }}

      <span
        v-if="!device.firstViewedAt"
        class="new-badge"
      >
        {{ t('deviceRow.badges.new') }}
      </span>
    </strong>

    <span>{{ device.source }}</span>

    <span>{{ device.room || '—' }}</span>
  </div>
</template>

<style scoped>
.device-row {
  display: grid;
  grid-template-columns: 100px 40px 1fr 180px 150px;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #ececec;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    box-shadow 0.15s ease;
}

.device-row:hover {
  background: #f8fafc;
}

.device-row:focus-visible {
  position: relative;
  z-index: 1;
  outline: 2px solid #2563eb;
  outline-offset: -2px;
}

.device-row-selected {
  background: #eff6ff;
  box-shadow: inset 4px 0 0 #2563eb;
}

.device-row-selected:hover {
  background: #dbeafe;
}

.badge {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-width: 78px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.state-archived {
  background: #e0e7ff;
  color: #3730a3;
}

.state-enabled {
  background: #e8f5e9;
  color: #2e7d32;
}

.state-disabled {
  background: #eeeeee;
  color: #616161;
}

.state-missing {
  background: #ffebee;
  color: #c62828;
}

.state-offline {
  background: #ffebee;
  color: #b71c1c;
}

.state-error {
  background: #fff3e0;
  color: #c2410c;
}

.device-name {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.new-badge {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  padding: 2px 7px;
  border-radius: 999px;
  background: #2563eb;
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0.04em;
}

.favorite-button {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  color: #f5a623;
  transition: transform 0.15s ease;
}

.favorite-button:hover {
  transform: scale(1.1);
}

.favorite-button:focus-visible {
  border-radius: 4px;
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
</style>
