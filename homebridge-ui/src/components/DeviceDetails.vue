<script setup lang="ts">
import {
  computed,
  ref,
  watch,
} from 'vue';
import { useI18n } from 'vue-i18n';

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

const {
  locale,
  t,
} = useI18n();

const homeKitName = ref('');
const room = ref('');
const favorite = ref(false);
const enabled = ref(false);
const archived = ref(false);
const saving = ref(false);
const deleting = ref(false);
const showDeleteConfirmation = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const savedHomeKitName = ref('');
const savedRoom = ref('');
const savedFavorite = ref(false);
const savedEnabled = ref(false);
const savedArchived = ref(false);

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
        return t('states.enabled');
      case 'disabled':
        return t('states.disabled');
      case 'missing':
        return t('states.missing');
      case 'error':
        return t('states.error');
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
      return t('states.archived');
    }

    return props.device?.available === false
      ? t('states.offline')
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

const hasUnsavedChanges = computed(
  () =>
    homeKitName.value.trim() !==
      savedHomeKitName.value ||
    room.value.trim() !==
      savedRoom.value ||
    favorite.value !==
      savedFavorite.value ||
    enabled.value !==
      savedEnabled.value ||
    archived.value !==
      savedArchived.value,
);

function formatLastCommunication(
  value?: string,
): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const elapsedMilliseconds =
    Date.now() - date.getTime();

  if (elapsedMilliseconds < 0) {
    return t('deviceDetails.time.lessThanMinute');
  }

  const elapsedMinutes =
    Math.floor(elapsedMilliseconds / 60_000);

  if (elapsedMinutes < 1) {
    return t('deviceDetails.time.lessThanMinute');
  }

  if (elapsedMinutes < 60) {
    return t(
      'deviceDetails.time.minutes',
      { count: elapsedMinutes },
    );
  }

  const elapsedHours =
    Math.floor(elapsedMinutes / 60);

  if (elapsedHours < 24) {
    return t(
      'deviceDetails.time.hours',
      { count: elapsedHours },
    );
  }

  const elapsedDays =
    Math.floor(elapsedHours / 24);

  if (elapsedDays < 30) {
    return t(
      'deviceDetails.time.days',
      { count: elapsedDays },
    );
  }

  const formattedDate =
    new Intl.DateTimeFormat(
      locale.value,
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      },
    ).format(date);

  const formattedTime =
    new Intl.DateTimeFormat(
      locale.value,
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      },
    ).format(date);

  return t(
    'deviceDetails.time.absolute',
    {
      date: formattedDate,
      time: formattedTime,
    },
  );
}

function getCapabilityLabel(
  capability: string,
): string {
  const key =
    `deviceDetails.capabilities.${capability}`;

  return t(key);
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
    homeKitName.value =
      device?.homeKitName ?? '';

    room.value =
      device?.room ?? '';

    favorite.value =
      device?.favorite ?? false;

    enabled.value =
      device?.enabled ?? true;

    archived.value =
      device?.archived ?? false;

    savedHomeKitName.value =
      device?.homeKitName?.trim() ?? '';

    savedRoom.value =
      device?.room?.trim() ?? '';

    savedFavorite.value =
      device?.favorite ?? false;

    savedEnabled.value =
      device?.enabled ?? true;

    savedArchived.value =
      device?.archived ?? false;

    errorMessage.value = '';
    successMessage.value = '';
    showDeleteConfirmation.value = false;
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
          homeKitName:
            homeKitName.value.trim(),
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

    homeKitName.value =
      updatedDevice.homeKitName ?? '';

    room.value =
      updatedDevice.room ?? '';

    favorite.value =
      updatedDevice.favorite;

    enabled.value =
      updatedDevice.enabled;

    archived.value =
      updatedDevice.archived;

    savedHomeKitName.value =
      updatedDevice.homeKitName?.trim() ?? '';

    savedRoom.value =
      updatedDevice.room?.trim() ?? '';

    savedFavorite.value =
      updatedDevice.favorite;

    savedEnabled.value =
      updatedDevice.enabled;

    savedArchived.value =
      updatedDevice.archived;

    emit(
      'updated',
      updatedDevice,
    );

    successMessage.value =
      t('deviceDetails.messages.preferencesSaved');
  } catch (error: unknown) {
    errorMessage.value =
      getErrorMessage(error);
  } finally {
    saving.value = false;
  }
}

function deleteDevice():
  void {
  if (
    !props.device ||
    deleting.value
  ) {
    return;
  }

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
        t('deviceDetails.errors.deleteFailed'),
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

  return t('deviceDetails.errors.saveFailed');
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
          {{ t('deviceDetails.sections.preferences') }}
        </summary>

        <form
          class="preferences-form"
          @submit.prevent="savePreferences"
        >
          <label class="field">
            <span>
              Nom HomeKit
            </span>

            <input
              v-model="homeKitName"
              type="text"
              :placeholder="device.name"
            />

            <small class="field-help">
              Laissez ce champ vide pour utiliser le nom Home Assistant.
            </small>
          </label>

          <label class="field">
            <span>
              {{ t('deviceDetails.fields.room') }}
            </span>

            <input
              v-model="room"
              type="text"
              :placeholder="t('deviceDetails.fields.noRoom')"
            />
          </label>

          <div class="checkbox-grid">
            <label class="checkbox-field">
              <input
                v-model="favorite"
                type="checkbox"
              />

              <span>
                {{ t('deviceDetails.fields.favorite') }}
              </span>
            </label>

            <label class="checkbox-field">
              <input
                v-model="enabled"
                type="checkbox"
                :disabled="!canEditEnabled"
              />

              <span>
                {{ t('deviceDetails.fields.enabled') }}
              </span>
            </label>

            <label class="checkbox-field">
              <input
                v-model="archived"
                type="checkbox"
                :disabled="!canArchive"
              />

              <span>
                {{ t('deviceDetails.fields.archive') }}
              </span>
            </label>
          </div>

          <p
            v-if="device.state === 'missing'"
            class="information-message"
          >
            {{ t('deviceDetails.information.missing') }}
          </p>

          <p
            v-else
            class="information-message"
          >
            {{ t('deviceDetails.information.archiveOnlyMissing') }}
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

          <div class="form-actions">
            <button
              type="submit"
              class="primary-button"
              :disabled="!hasUnsavedChanges || saving || deleting"
            >
              <svg
                class="button-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M5 3h11l3 3v15H5V3Zm3 0v6h8V3M8 21v-7h8v7"
                />
              </svg>

              {{
                saving
                  ? t('deviceDetails.actions.saving')
                  : t('deviceDetails.actions.save')
              }}
            </button>

            <button
              v-if="!showDeleteConfirmation"
              type="button"
              class="delete-button"
              :disabled="saving || deleting"
              @click="deleteDevice"
            >
              <svg
                class="button-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"
                />
              </svg>

              {{ t('deviceDetails.actions.delete') }}
            </button>
          </div>
        </form>

        <section
          v-if="showDeleteConfirmation"
          class="delete-confirmation"
          role="dialog"
          aria-modal="false"
          aria-labelledby="delete-confirmation-title"
        >
          <div class="delete-confirmation-heading">
            <span
              class="delete-confirmation-icon"
              aria-hidden="true"
            >
              !
            </span>

            <h3 id="delete-confirmation-title">
              {{ t('deviceDetails.delete.title') }}
            </h3>
          </div>

          <p class="delete-confirmation-text">
            {{
              t(
                'deviceDetails.delete.confirmation',
                {
                  name: device.name,
                },
              )
            }}
          </p>

          <div class="delete-confirmation-actions">
            <button
              type="button"
              class="secondary-button"
              :disabled="deleting"
              @click="cancelDelete"
            >
              {{ t('deviceDetails.actions.cancel') }}
            </button>

            <button
              type="button"
              class="delete-button"
              :disabled="deleting"
              @click="confirmDelete"
            >
              <svg
                class="button-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"
                />
              </svg>

              {{
                deleting
                  ? t('deviceDetails.actions.deleting')
                  : t('deviceDetails.actions.confirmDelete')
              }}
            </button>
          </div>
        </section>
      </details>

      <details
        class="card"
        open
      >
        <summary>
          {{ t('deviceDetails.sections.general') }}
        </summary>

        <dl>
          <dt>{{ t('deviceDetails.general.identifier') }}</dt>
          <dd>{{ device.id }}</dd>

          <dt>{{ t('deviceDetails.general.state') }}</dt>
          <dd>{{ stateLabel }}</dd>

          <dt>{{ t('deviceDetails.general.availability') }}</dt>
          <dd>
            {{
              device.available
                ? t('deviceDetails.availability.available')
                : t('deviceDetails.availability.offline')
            }}
          </dd>

          <dt>{{ t('deviceDetails.general.lastCommunication') }}</dt>
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
          {{ t('deviceDetails.sections.capabilities') }}
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
            {{ t('deviceDetails.capabilities.none') }}
          </span>
        </div>
      </details>
    </template>

    <div
      v-else
      class="empty"
    >
      {{ t('deviceDetails.emptySelection') }}
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

.field-help {
  color: #6b7280;
  font-size: 12px;
  line-height: 1.4;
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

.preferences-form button,
.delete-confirmation button {
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

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.primary-button {
  color: #ffffff;
  background: #2563eb;
  border: 1px solid #2563eb;
}

.secondary-button {
  color: #2563eb;
  background: #ffffff;
  border: 1px solid #2563eb;
}

.secondary-button:hover:not(:disabled) {
  color: #1d4ed8;
  background: #eff6ff;
  border-color: #1d4ed8;
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
  box-shadow: 0 2px 5px rgb(220 38 38 / 25%);
}

.preferences-form button:disabled,
.delete-confirmation button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.button-icon {
  width: 22px;
  height: 22px;
  margin-right: 8px;
  fill: none;
  stroke: currentcolor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  vertical-align: middle;
}
.primary-button,
.delete-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}


.delete-confirmation {
  margin: 0 16px 16px;
  padding: 16px;
  border: 1px solid #fecaca;
  border-radius: 10px;
  background: #fef2f2;
}

.delete-confirmation-heading {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}

.delete-confirmation-heading h3 {
  margin: 0;
  color: #991b1b;
  font-size: 16px;
}

.delete-confirmation-icon {
  display: inline-flex;
  flex: 0 0 24px;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  color: #ffffff;
  background: #dc2626;
  font-weight: 700;
}

.delete-confirmation-text {
  margin: 0;
  color: #4b5563;
  line-height: 1.55;
  white-space: pre-line;
}

.delete-confirmation-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 16px;
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
