<script setup lang="ts">
import {
  computed,
  ref,
  watch,
} from 'vue';

import { catalogApi } from '../api/catalogApi';
import type {
  CatalogDevice,
} from '../models/catalogDevice';

const props =
  defineProps<{
    device: CatalogDevice | null;
  }>();

const emit =
  defineEmits<{
    updated: [device: CatalogDevice];
  }>();

const room = ref('');
const favorite = ref(false);
const enabled = ref(false);
const hidden = ref(false);
const saving = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const hasDevice = computed(
  () => props.device !== null,
);

const canEditState = computed(
  () => props.device?.state !== 'missing',
);

const stateLabel = computed(
  () => {
    switch (props.device?.state) {
      case 'enabled':
        return 'Actif';

      case 'disabled':
        return 'Désactivé';

      case 'hidden':
        return 'Masqué';

      case 'missing':
        return 'Manquant';

      default:
        return '';
    }
  },
);

const stateClass = computed(
  () => {
    switch (props.device?.state) {
      case 'enabled':
        return 'state-enabled';

      case 'disabled':
        return 'state-disabled';

      case 'hidden':
        return 'state-hidden';

      case 'missing':
        return 'state-missing';

      default:
        return '';
    }
  },
);

const displayedStateLabel = computed(
  () =>
    props.device?.available === false
      ? 'Hors ligne'
      : stateLabel.value,
);

const displayedStateClass = computed(
  () =>
    props.device?.available === false
      ? 'state-offline'
      : stateClass.value,
);

const displayedRoom = computed(
  () => room.value.trim(),
);

function formatDate(
  value?: string,
): string {
  if (!value) {
    return '—';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    'fr-FR',
  );
}

function getCapabilityLabel(
  capability: string,
): string {
  switch (capability) {
    case 'temperature':
      return 'Température';

    case 'humidity':
      return 'Humidité';

    case 'battery':
      return 'Batterie';

    case 'pressure':
      return 'Pression';

    case 'illuminance':
      return 'Luminosité';

    case 'airQuality':
      return 'Qualité de l’air';

    case 'co2':
      return 'CO₂';

    case 'voc':
      return 'COV';

    default:
      return capability;
  }
}

function getCapabilityIcon(
  capability: string,
): string {
  switch (capability) {
    case 'temperature':
      return '🌡️';

    case 'humidity':
      return '💧';

    case 'battery':
      return '🔋';

    case 'pressure':
      return '🧭';

    case 'illuminance':
      return '☀️';

    case 'airQuality':
      return '🍃';

    case 'co2':
      return '💨';

    case 'voc':
      return '🫧';

    default:
      return '•';
  }
}

watch(
  () => props.device,
  device => {
    room.value =
      device?.room ?? '';

    favorite.value =
      device?.favorite ?? false;

    enabled.value =
      device?.state === 'enabled';

    hidden.value =
      device?.state === 'hidden';

    errorMessage.value = '';
    successMessage.value = '';
  },
  {
    immediate: true,
  },
);

async function savePreferences():
  Promise<void> {
  if (!props.device || saving.value) {
    return;
  }

  saving.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const updatedDevice =
      await catalogApi.updatePreferences(
        props.device.id,
        {
          room:
            room.value.trim(),
          favorite:
            favorite.value,
          enabled:
            enabled.value,
          hidden:
            hidden.value,
        },
      );

    emit(
      'updated',
      updatedDevice,
    );

    successMessage.value =
      'Préférences enregistrées.';
  } catch (error: unknown) {
    errorMessage.value =
      getErrorMessage(error);
  } finally {
    saving.value = false;
  }
}

function getErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  if (
    typeof error === 'string' &&
    error.trim()
  ) {
    return error;
  }

  return 'Les préférences n’ont pas pu être enregistrées.';
}
</script>

<template>
  <aside class="details">
    <template v-if="hasDevice && device">
      <header class="details-header">
        <div>
          <h2>{{ device.name }}</h2>
          <p>{{ device.source }}</p>

          <p
            v-if="displayedRoom"
            class="room"
          >
            {{ displayedRoom }}
          </p>
        </div>

        <span
  class="state"
  :class="displayedStateClass"
>
  {{ displayedStateLabel }}
</span>
      </header>

      <details
        class="card"
        open
      >
        <summary>
          Préférences
        </summary>

        <form
          class="preferences-form"
          @submit.prevent="savePreferences"
        >
          <label class="field">
            <span>Pièce</span>

            <input
              v-model="room"
              type="text"
              placeholder="Aucune pièce"
            />
          </label>

          <div class="checkbox-grid">
            <label class="checkbox-field">
              <input
                v-model="favorite"
                type="checkbox"
              />

              <span>Appareil favori</span>
            </label>

            <label class="checkbox-field">
              <input
                v-model="enabled"
                type="checkbox"
                :disabled="!canEditState"
              />

              <span>Appareil actif</span>
            </label>

            <label class="checkbox-field">
              <input
                v-model="hidden"
                type="checkbox"
                :disabled="!canEditState"
              />

              <span>Masquer dans le catalogue</span>
            </label>
          </div>

          <p
            v-if="!canEditState"
            class="information-message"
          >
            L’état d’un appareil manquant ne peut pas être modifié.
          </p>

          <p
            v-if="errorMessage"
            class="error-message"
            role="alert"
          >
            {{ errorMessage }}
          </p>

          <p
            v-if="successMessage"
            class="success-message"
            role="status"
          >
            {{ successMessage }}
          </p>

          <button
            type="submit"
            :disabled="saving"
          >
            {{
              saving
                ? 'Enregistrement…'
                : 'Enregistrer'
            }}
          </button>
        </form>
      </details>

      <details
        class="card"
        open
      >
        <summary>
          Général
        </summary>

        <dl>
          <dt>Identifiant</dt>
          <dd>{{ device.id }}</dd>

          <dt>État</dt>
<dd>{{ stateLabel }}</dd>

<dt>Disponibilité</dt>
<dd>
  {{
    device.available
      ? 'Disponible'
      : 'Hors ligne'
  }}
</dd>

<dt>Dernière communication</dt>
<dd>
  {{ formatDate(device.lastCommunication) }}
</dd>
        </dl>
      </details>

      <details
        class="card"
        open
      >
        <summary>
          Capacités
        </summary>

        <div class="capability-list">
          <span
            v-for="capability in device.capabilities"
            :key="capability"
            class="capability"
          >
            <span
              class="capability-icon"
              aria-hidden="true"
            >
              {{ getCapabilityIcon(capability) }}
            </span>

            <span>
              {{ getCapabilityLabel(capability) }}
            </span>
          </span>

          <span
            v-if="device.capabilities.length === 0"
            class="empty-capabilities"
          >
            Aucune capacité détectée.
          </span>
        </div>
      </details>
    </template>

    <div
      v-else
      class="empty"
    >
      Sélectionnez un appareil dans le catalogue.
    </div>
  </aside>
</template>

<style scoped>
.details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  padding: 16px;
}

.details-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
}

.details-header h2 {
  margin: 0 0 4px;
  font-size: 20px;
}

.details-header p {
  margin: 0;
  color: #6b7280;
}

.details-header .room {
  margin-top: 4px;
  font-size: 13px;
  font-weight: 600;
}

.state {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.state-enabled {
  background: #e8f5e9;
  color: #2e7d32;
}

.state-disabled {
  background: #eeeeee;
  color: #616161;
}

.state-hidden {
  background: #fff3e0;
  color: #ef6c00;
}

.state-missing {
  background: #ffebee;
  color: #c62828;
}

.state-offline {
  background: #ffebee;
  color: #b71c1c;
}

.card {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
}

.card summary {
  padding: 13px 16px;
  cursor: pointer;
  font-weight: 600;
  user-select: none;
}

.card[open] summary {
  border-bottom: 1px solid #e5e7eb;
}

.card summary:focus-visible {
  border-radius: 10px;
  outline: 2px solid #2563eb;
  outline-offset: -2px;
}

.preferences-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field span,
.checkbox-field span {
  font-weight: 500;
}

.field input {
  padding: 9px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: inherit;
  font: inherit;
}

.checkbox-grid {
  display: grid;
  gap: 10px;
}

.checkbox-field {
  display: flex;
  gap: 10px;
  align-items: center;
}

.checkbox-field input {
  width: 16px;
  height: 16px;
}

.preferences-form button {
  align-self: flex-start;
  padding: 9px 14px;
  cursor: pointer;
}

.preferences-form button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.information-message,
.error-message,
.success-message {
  margin: 0;
  font-size: 14px;
}

.information-message {
  color: #6b7280;
}

.error-message {
  color: #b91c1c;
}

.success-message {
  color: #166534;
}

dl {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 8px 16px;
  margin: 0;
  padding: 16px;
}

dt {
  font-weight: 600;
}

dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
}

.capability-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 16px;
}

.capability {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 5px 9px;
  border-radius: 999px;
  background: #f3f4f6;
  font-size: 13px;
}

.capability-icon {
  line-height: 1;
}

.empty-capabilities {
  color: #6b7280;
  font-size: 14px;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  color: #6b7280;
  text-align: center;
}
</style>
