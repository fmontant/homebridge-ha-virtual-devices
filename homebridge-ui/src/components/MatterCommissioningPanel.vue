<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { matterApi } from '../api/matterApi';
import CollapsibleSection from './CollapsibleSection.vue';

const { t } =
  useI18n();

const expanded =
  ref(true);

const pairingCode =
  ref('');

const commissioning =
  ref(false);

const errorMessage =
  ref('');

const successMessage =
  ref('');

const canSubmit =
  computed(
    () =>
      pairingCode.value.trim().length > 0 &&
      !commissioning.value,
  );

function clearMessages(): void {
  errorMessage.value = '';
  successMessage.value = '';
}

async function commissionDevice(): Promise<void> {
  clearMessages();

  const code =
    pairingCode.value.trim();

  if (!code) {
    errorMessage.value =
      t('matter.messages.missingCode');

    return;
  }

  commissioning.value = true;

  try {
    const response =
      await matterApi.commission(code);

    if (!response.success) {
      errorMessage.value =
        t(
          'matter.messages.failed',
          {
            message:
              response.error ??
              'Erreur inconnue',
          },
        );

      return;
    }

    successMessage.value =
      t('matter.messages.success');

    pairingCode.value = '';
  } catch (error) {
    errorMessage.value =
      t(
        'matter.messages.failed',
        {
          message:
            error instanceof Error
              ? error.message
              : String(error),
        },
      );
  } finally {
    commissioning.value = false;
  }
}
</script>

<template>
  <CollapsibleSection
    v-model="expanded"
    :title="t('matter.title')"
    :description="t('matter.description')"
    content-id="matter-commissioning"
  >
    <div class="configuration-form">
      <p>
        {{
          t(
            'matter.messages.instructions',
          )
        }}
      </p>

      <label class="configuration-field">
        <span>
          {{
            t(
              'matter.fields.pairingCode.label',
            )
          }}
        </span>

        <input
          v-model="pairingCode"
          type="text"
          name="matter-pairing-code"
          autocomplete="off"
          autocapitalize="none"
          autocorrect="off"
          spellcheck="false"
          inputmode="numeric"
          enterkeyhint="done"
          :aria-label="
            t(
              'matter.fields.pairingCode.ariaLabel',
            )
          "
          :placeholder="
            t(
              'matter.fields.pairingCode.placeholder',
            )
          "
          :disabled="commissioning"
          @input="clearMessages"
        >
      </label>

      <div
        v-if="errorMessage"
        class="configuration-message error-message"
        role="alert"
      >
        {{ errorMessage }}
      </div>

      <div
        v-if="successMessage"
        class="configuration-message success-message"
        role="status"
        aria-live="polite"
      >
        {{ successMessage }}
      </div>

      <div class="configuration-actions">
        <button
          type="button"
          class="primary-button"
          :disabled="!canSubmit"
          @click="commissionDevice"
        >
          {{
            commissioning
              ? t(
                'matter.actions.commissioning',
              )
              : t(
                'matter.actions.commission',
              )
          }}
        </button>
      </div>
    </div>
  </CollapsibleSection>
</template>