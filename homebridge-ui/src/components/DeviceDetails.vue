<script setup lang="ts">
import {
  computed,
  nextTick,
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
    deleted: [deviceId: string];
  }>();

const room = ref('');
const favorite = ref(false);
const enabled = ref(false);
const archived = ref(false);
const saving = ref(false);
const deleting = ref(false);
const showDeleteConfirmation = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const hasDevice = computed(
  () => props.device !== null,
);

const canEditEnabled = computed(
  () => props.device?.state !== 'missing',
);

const canArchive = computed(
  () => props.device?.state === 'missing',
);

const stateLabel = computed(
  () => {
    switch (props.device?.state) {
      case 'enabled':
        return 'Actif';

      case 'disabled':
        return 'Désactivé';

      case 'missing':
        return 'Manquant';

      case 'error':
        return 'Erreur';

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

      case 'missing':
        return 'state-missing';

      case 'error':
        return 'state-error';

      default:
        return '';
    }
  },
);

const displayedStateLabel = computed(
  () => {
    if (props.device?.archived) {
      return 'Archivé';
    }

    return props.device?.available === false
      ? 'Hors ligne'
      : stateLabel.value;
  },
);

const displayedStateClass = computed(
  () => {
    if (props.device?.archived) {
      return 'state-archived';
    }

    return props.device?.available === false
      ? 'state-offline'
      : stateClass.value;
  },
);

const displayedRoom = computed(
  () => room.value.trim(),
);

function formatLastCommunication(
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

  const elapsedMilliseconds =
    Date.now() - date.getTime();

  if (elapsedMilliseconds < 0) {
    return 'Moins d’une minute';
  }

  const elapsedMinutes =
    Math.floor(
      elapsedMilliseconds / 60_000,
    );

  if (elapsedMinutes < 1) {
    return 'Moins d’une minute';
  }

  if (elapsedMinutes < 60) {
    return `Il y a ${elapsedMinutes} ${
      elapsedMinutes === 1
        ? 'minute'
        : 'minutes'
    }`;
  }

  const elapsedHours =
    Math.floor(
      elapsedMinutes / 60,
    );

  if (elapsedHours < 24) {
    return `Il y a ${elapsedHours} ${
      elapsedHours === 1
        ? 'heure'
        : 'heures'
    }`;
  }

  const elapsedDays =
    Math.floor(
      elapsedHours / 24,
    );

  if (elapsedDays < 30) {
    return `Il y a ${elapsedDays} ${
      elapsedDays === 1
        ? 'jour'
        : 'jours'
    }`;
  }

  const formattedDate =
    new Intl.DateTimeFormat(
      'fr-FR',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      },
    ).format(date);

  const formattedTime =
    new Intl.DateTimeFormat(
      'fr-FR',
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      },
    ).format(date);

  return `Le ${formattedDate} à ${formattedTime}`;
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
      device?.enabled ?? true;

    archived.value =
      device?.archived ?? false;

    showDeleteConfirmation.value = false;
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
          archived:
            archived.value,
        },
      );

    emit(
      'updated',
      updatedDevice,
    );

    await nextTick();

    successMessage.value =
      'Préférences enregistrées.';
  } catch (error: unknown) {
    errorMessage.value =
      getErrorMessage(error);
  } finally {
    saving.value = false;
  }
}

function requestDelete():
  void {
  if (
    !props.device ||
    saving.value ||
    deleting.value
  ) {
    return;
  }

  errorMessage.value = '';
  successMessage.value = '';
  showDeleteConfirmation.value = true;
}

function cancelDelete():
  void {
  if (deleting.value) {
    return;
  }

  showDeleteConfirmation.value = false;
}

async function confirmDelete():
  Promise<void> {
  if (
    !props.device ||
    deleting.value
  ) {
    return;
  }

  deleting.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const deviceId =
      props.device.id;

    const deleted =
      await catalogApi.deleteDevice(
        deviceId,
      );

    if (!deleted) {
      throw new Error(
        'Le capteur n’a pas été supprimé.',
      );
    }

    showDeleteConfirmation.value = false;

    emit(
      'deleted',
      deviceId,
    );
  } catch (error: unknown) {
    errorMessage.value =
      getErrorMessage(error);
  } finally {
    deleting.value = false;
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
                :disabled="!canEditEnabled"
              />

              <span>Appareil actif</span>
            </label>

            <label class="checkbox-field">
              <input
                v-model="archived"
                type="checkbox"
                :disabled="!canArchive"
              />

              <span>Archiver l’appareil</span>
            </label>
          </div>

          <p
            v-if="device.state === 'missing'"
            class="information-message"
          >
            Cet appareil est manquant. Il reste publié dans HomeKit jusqu’à son archivage.
          </p>

          <p
            v-else
            class="information-message"
          >
            L’archivage est disponible uniquement pour un appareil manquant.
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
            class="primary-button"
            :disabled="saving || deleting"
          >
            <svg
              class="button-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M5 3h12l2 2v16H5V3Zm2 2v5h10V6.2L15.8 5H7Zm0 14h10v-7H7v7Zm2-12h5V5H9v2Z"
              />
            </svg>
            {{
              saving
                ? 'Enregistrement…'
                : 'Enregistrer'
            }}
          </button>

          <button
            type="button"
            class="delete-button"
            :disabled="saving || deleting"
            @click="requestDelete"
          >
            <svg
              class="button-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Zm3 2v8h2v-8H9Zm4 0v8h2v-8h-2Z"
              />
            </svg>
            Supprimer le capteur du catalogue et de HomeKit
          </button>

          <div
            v-if="showDeleteConfirmation"
            class="delete-confirmation"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-confirmation-title"
          >
            <strong id="delete-confirmation-title">
              Confirmer la suppression
            </strong>

            <p>
              Supprimer « {{ device.name }} » du catalogue du plugin et de HomeKit ?
            </p>

            <p>
              Si Home Assistant le détecte de nouveau, il sera automatiquement recréé.
            </p>

            <div class="delete-confirmation-actions">
              <button
                type="button"
                class="cancel-button"
                :disabled="deleting"
                @click="cancelDelete"
              >
                Annuler
              </button>

              <button
                type="button"
                class="confirm-delete-button"
                :disabled="deleting"
                @click="confirmDelete"
              >
                {{
                  deleting
                    ? 'Suppression…'
                    : 'Confirmer la suppression'
                }}
              </button>
            </div>
          </div>
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
  {{ formatLastCommunication(device.lastCommunication) }}
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

.state-archived {
  background: #fff3e0;
  color: #ef6c00;
}

.state-error {
  background: #fff3e0;
  color: #c2410c;
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
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 8px;
  min-height: 40px;
  padding: 9px 16px;
  border-radius: 8px;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease;
}

.button-icon {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
}

.primary-button {
  color: #ffffff;
  background: #2563eb;
  border: 1px solid #2563eb;
}

.primary-button:hover:not(:disabled) {
  background: #1d4ed8;
  border-color: #1d4ed8;
  box-shadow: 0 2px 5px rgb(37 99 235 / 20%);
}

.delete-button {
  color: #ffffff;
  background: #dc2626;
  border: 1px solid #dc2626;
}

.delete-button:hover:not(:disabled) {
  background: #b91c1c;
  border-color: #b91c1c;
  box-shadow: 0 2px 5px rgb(220 38 38 / 20%);
}

.delete-confirmation {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fef2f2;
  color: #7f1d1d;
}

.delete-confirmation p {
  margin: 0;
  font-size: 14px;
}

.delete-confirmation-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 2px;
}

.cancel-button {
  color: #374151;
  background: #ffffff;
  border: 1px solid #d1d5db;
}

.cancel-button:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.confirm-delete-button {
  color: #ffffff;
  background: #dc2626;
  border: 1px solid #dc2626;
}

.confirm-delete-button:hover:not(:disabled) {
  background: #b91c1c;
  border-color: #b91c1c;
  box-shadow: 0 2px 5px rgb(220 38 38 / 20%);
}

.preferences-form button:disabled {
  cursor: wait;
  opacity: 0.55;
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
