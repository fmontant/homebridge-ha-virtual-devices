<script setup lang="ts">
import type { CatalogDevice } from '../models/catalogDevice';

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

const labels = {
  enabled: 'Actif',
  disabled: 'Désactivé',
  hidden: 'Masqué',
  missing: 'Manquant',
};

const badgeClass = {
  enabled: 'badge-enabled',
  disabled: 'badge-disabled',
  hidden: 'badge-hidden',
  missing: 'badge-missing',
};

const availabilityLabel = (
  device: CatalogDevice,
): string =>
  device.available
    ? labels[device.state]
    : 'Hors ligne';

const availabilityClass = (
  device: CatalogDevice,
): string =>
  device.available
    ? badgeClass[device.state]
    : 'badge-offline';
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
      :aria-label="
        device.favorite
          ? `Retirer ${device.name} des favoris`
          : `Ajouter ${device.name} aux favoris`
      "
      @click.stop="emit('favorite')"
    >
      {{ device.favorite ? '★' : '☆' }}
    </button>

    <strong>{{ device.name }}</strong>

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

.badge-enabled {
  background: #e8f5e9;
  color: #2e7d32;
}

.badge-disabled {
  background: #eeeeee;
  color: #616161;
}

.badge-hidden {
  background: #fff3e0;
  color: #ef6c00;
}

.badge-missing {
  background: #ffebee;
  color: #c62828;
}

.badge-offline {
  background: #ffebee;
  color: #b71c1c;
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