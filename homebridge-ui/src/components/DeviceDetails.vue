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
        </div>

        <span class="state">
          {{ device.state }}
        </span>
      </header>

      <form
        class="card preferences-form"
        @submit.prevent="savePreferences"
      >
        <h3>Préférences</h3>

        <label class="field">
          <span>Pièce</span>

          <input
            v-model="room"
            type="text"
            placeholder="Aucune pièce"
          />
        </label>

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

      <section class="card">
        <h3>Général</h3>

        <dl>
          <dt>Identifiant</dt>
          <dd>{{ device.id }}</dd>

          <dt>État</dt>
          <dd>{{ device.state }}</dd>
        </dl>
      </section>

      <section class="card">
        <h3>Capacités</h3>

        <ul>
          <li
            v-for="capability in device.capabilities"
            :key="capability"
          >
            {{ capability }}
          </li>
        </ul>
      </section>
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
  gap: 16px;
  height: 100%;
  padding: 20px;
}

.details-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
}

.details-header h2 {
  margin: 0 0 4px;
}

.details-header p {
  margin: 0;
  color: #6b7280;
}

.state {
  padding: 4px 8px;
  border-radius: 999px;
  background: #f3f4f6;
  font-size: 12px;
  font-weight: 600;
}

.card {
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.card h3 {
  margin: 0 0 16px;
}

.preferences-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
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
  grid-template-columns: 120px 1fr;
  gap: 8px;
  margin: 0;
}

dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
}

ul {
  margin: 0;
  padding-left: 20px;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;
  text-align: center;
}
</style>
