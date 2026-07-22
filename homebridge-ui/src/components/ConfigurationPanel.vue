<script setup lang="ts">
import {
  computed,
  onMounted,
  ref,
} from 'vue';

import type {
  IHomebridgePluginUi,
} from '@homebridge/plugin-ui-utils';

declare const homebridge:
  IHomebridgePluginUi;

type PluginConfiguration = {
  platform?: string;
  name?: string;
  haUrl?: string;
  token?: string;
  autoDiscovery?: boolean;
  includeHumidity?: boolean;
  includeBattery?: boolean;
  [key: string]: unknown;
};

type ConfigurationStatus =
  | 'checking'
  | 'connected'
  | 'dirty'
  | 'verification-required'
  | 'unconfigured'
  | 'unreachable';

type ConfigurationStatusResponse = {
  configured: boolean;
  connected: boolean;
  state:
    | 'connected'
    | 'unconfigured'
    | 'unauthorized'
    | 'unreachable';
  message: string;
};

const defaultConfiguration:
PluginConfiguration = {
  haUrl: '',
  token: '',
  autoDiscovery: true,
  includeHumidity: true,
  includeBattery: true,
};

const expanded =
  ref(true);

const loading =
  ref(false);

const saving =
  ref(false);

const checking =
  ref(false);

const showToken =
  ref(false);

const errorMessage =
  ref('');

const successMessage =
  ref('');

const pluginConfigurations =
  ref<PluginConfiguration[]>([]);

const configuration =
  ref<PluginConfiguration>({
    ...defaultConfiguration,
  });

const initialConfiguration =
  ref<PluginConfiguration>({
    ...defaultConfiguration,
  });

const persistedConnectionStatus =
  ref<ConfigurationStatusResponse | null>(
    null,
  );

const attemptedConnectionStatus =
  ref<ConfigurationStatusResponse | null>(
    null,
  );

const attemptedConfigurationKey =
  ref('');

const verificationRequired =
  ref(false);

const hasRequiredConfiguration =
  computed(() =>
    normalizeText(
      configuration.value.haUrl,
    ).length > 0 &&
    normalizeText(
      configuration.value.token,
    ).length > 0,
  );

const currentConfigurationKey =
  computed(() =>
    JSON.stringify(
      comparableConfiguration(
        configuration.value,
      ),
    ),
  );

const initialConfigurationKey =
  computed(() =>
    JSON.stringify(
      comparableConfiguration(
        initialConfiguration.value,
      ),
    ),
  );

const hasChanges =
  computed(() =>
    currentConfigurationKey.value !==
    initialConfigurationKey.value,
  );

const canSubmit =
  computed(() =>
    hasChanges.value ||
    verificationRequired.value,
  );

const currentAttemptedStatus =
  computed(() =>
    hasChanges.value &&
    attemptedConfigurationKey.value ===
      currentConfigurationKey.value
      ? attemptedConnectionStatus.value
      : null,
  );

const status =
  computed<ConfigurationStatus>(() => {
    if (
      loading.value ||
      saving.value ||
      checking.value
    ) {
      return 'checking';
    }

    if (hasChanges.value) {
      if (
        !hasRequiredConfiguration.value
      ) {
        return 'unconfigured';
      }

      if (
        currentAttemptedStatus.value &&
        !currentAttemptedStatus.value
          .connected
      ) {
        return 'unreachable';
      }

      return 'dirty';
    }

    if (
      !hasRequiredConfiguration.value
    ) {
      return 'unconfigured';
    }

    if (verificationRequired.value) {
      return 'verification-required';
    }

    return persistedConnectionStatus
      .value?.connected
      ? 'connected'
      : 'unreachable';
  });

const statusLabel =
  computed(() => {
    switch (status.value) {
      case 'checking':
        return 'Vérification…';
      case 'connected':
        return 'Connecté';
      case 'dirty':
        return 'Modifications non enregistrées';
      case 'verification-required':
        return 'À vérifier';
      case 'unreachable':
        return 'Connexion impossible';
      default:
        return 'Non configuré';
    }
  });

const connectionMessage =
  computed(() => {
    if (
      status.value ===
        'unreachable'
    ) {
      return hasChanges.value
        ? currentAttemptedStatus
          .value?.message ?? ''
        : persistedConnectionStatus
          .value?.message ?? '';
    }

    return '';
  });

async function loadConfiguration():
Promise<void> {
  if (loading.value) {
    return;
  }

  loading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const loadedConfigurations =
      await homebridge
        .getPluginConfig() as
        PluginConfiguration[];

    pluginConfigurations.value =
      loadedConfigurations;

    const currentConfiguration =
      loadedConfigurations[0] ?? {};

    const normalizedConfiguration =
      normalizeConfiguration(
        currentConfiguration,
      );

    configuration.value = {
      ...normalizedConfiguration,
    };

    initialConfiguration.value = {
      ...normalizedConfiguration,
    };

    persistedConnectionStatus.value =
      await requestConnectionStatus(
        normalizedConfiguration,
      );

    verificationRequired.value = false;

    expanded.value =
      !persistedConnectionStatus.value
        .connected;
  } catch (error: unknown) {
    errorMessage.value =
      getErrorMessage(error);
    expanded.value = true;
  } finally {
    loading.value = false;
  }
}

async function saveConfiguration():
Promise<void> {
  if (
    saving.value ||
    checking.value ||
    !canSubmit.value
  ) {
    return;
  }

  errorMessage.value = '';
  successMessage.value = '';

  const updatedConfiguration =
    normalizeConfiguration(
      configuration.value,
    );

  if (
    !normalizeText(
      updatedConfiguration.haUrl,
    ) ||
    !normalizeText(
      updatedConfiguration.token,
    )
  ) {
    attemptedConfigurationKey.value =
      currentConfigurationKey.value;

    attemptedConnectionStatus.value = {
      configured: false,
      connected: false,
      state: 'unconfigured',
      message:
        'Adresse ou jeton manquant',
    };

    errorMessage.value =
      'La configuration est incomplète.';
    expanded.value = true;

    return;
  }

  const configurationChanged =
    hasChanges.value;

  checking.value = true;

  try {
    const connectionStatus =
      await requestConnectionStatus(
        updatedConfiguration,
      );

    attemptedConfigurationKey.value =
      currentConfigurationKey.value;

    attemptedConnectionStatus.value =
      connectionStatus;

    if (!connectionStatus.connected) {
      verificationRequired.value = true;

      if (!configurationChanged) {
        persistedConnectionStatus.value =
          connectionStatus;
      }

      errorMessage.value =
        'Configuration non enregistrée : ' +
        connectionStatus.message +
        '.';

      expanded.value = true;

      return;
    }
  } catch (error: unknown) {
    const message =
      getErrorMessage(error);

    attemptedConfigurationKey.value =
      currentConfigurationKey.value;

    attemptedConnectionStatus.value = {
      configured: true,
      connected: false,
      state: 'unreachable',
      message,
    };

    verificationRequired.value = true;

    if (!configurationChanged) {
      persistedConnectionStatus.value =
        attemptedConnectionStatus.value;
    }

    errorMessage.value =
      'Configuration non enregistrée : ' +
      message +
      '.';

    expanded.value = true;

    return;
  } finally {
    checking.value = false;
  }

  verificationRequired.value = false;

  if (!configurationChanged) {
    persistedConnectionStatus.value =
      attemptedConnectionStatus.value;

    verificationRequired.value = false;

    attemptedConnectionStatus.value =
      null;

    attemptedConfigurationKey.value =
      '';

    successMessage.value =
      'Connexion Home Assistant vérifiée.';

    expanded.value = false;

    return;
  }

  saving.value = true;

  try {
    const updatedConfigurations =
      pluginConfigurations.value.length > 0
        ? [
          updatedConfiguration,
          ...pluginConfigurations.value.slice(1),
        ]
        : [updatedConfiguration];

    await homebridge
      .updatePluginConfig(
        updatedConfigurations,
      );

    await homebridge
      .savePluginConfig();

    pluginConfigurations.value =
      updatedConfigurations;

    configuration.value = {
      ...updatedConfiguration,
    };

    initialConfiguration.value = {
      ...updatedConfiguration,
    };

    persistedConnectionStatus.value =
      attemptedConnectionStatus.value;

    attemptedConnectionStatus.value =
      null;

    attemptedConfigurationKey.value =
      '';

    successMessage.value =
      'Configuration enregistrée.';

    expanded.value = false;
  } catch (error: unknown) {
    errorMessage.value =
      getErrorMessage(error);
    expanded.value = true;
  } finally {
    saving.value = false;
  }
}

const primaryActionLabel =
  computed(() => {
    if (checking.value) {
      return 'Vérification…';
    }

    if (saving.value) {
      return 'Enregistrement…';
    }

    return hasChanges.value
      ? 'Enregistrer'
      : 'Vérifier';
  });

async function requestConnectionStatus(
  value: PluginConfiguration,
): Promise<ConfigurationStatusResponse> {
  return await homebridge.request(
    '/config/status',
    {
      haUrl:
        normalizeText(
          value.haUrl,
        ),
      token:
        normalizeText(
          value.token,
        ),
    },
  ) as ConfigurationStatusResponse;
}

function resetConfiguration():
void {
  configuration.value = {
    ...initialConfiguration.value,
  };

  attemptedConnectionStatus.value =
    null;

  attemptedConfigurationKey.value =
    '';

  errorMessage.value = '';
  successMessage.value = '';
}

function clearMessages():
void {
  errorMessage.value = '';
  successMessage.value = '';
}

function normalizeConfiguration(
  value: PluginConfiguration,
): PluginConfiguration {
  return {
    platform: value.platform,
    name: value.name,
    haUrl:
      normalizeText(value.haUrl),
    token:
      normalizeText(value.token),
    autoDiscovery: true,
includeHumidity: true,
includeBattery: true,
  };
}

function comparableConfiguration(
  value: PluginConfiguration,
): PluginConfiguration {
  return {
  haUrl:
    normalizeText(value.haUrl),
  token:
    normalizeText(value.token),

  autoDiscovery: true,
  includeHumidity: true,
  includeBattery: true,
};
}

function normalizeText(
  value: unknown,
): string {
  return typeof value === 'string'
    ? value.trim()
    : '';
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

  return 'La configuration n’a pas pu être enregistrée.';
}

onMounted(() => {
  void loadConfiguration();
});
</script>

<template>
  <section class="configuration-panel">
    <button
      type="button"
      class="configuration-header"
      :aria-expanded="expanded"
      aria-controls="home-assistant-configuration"
      @click="expanded = !expanded"
    >
      <span
        class="configuration-indicator"
        aria-hidden="true"
      >
        {{ expanded ? '▼' : '▶' }}
      </span>

      <span class="configuration-title">
        <strong>
          Configuration Home Assistant
        </strong>

        <small>
          Connexion et options générales du plugin
        </small>
      </span>

      <span
        class="configuration-status"
        :class="`status-${status}`"
      >
        <span
          class="status-dot"
          aria-hidden="true"
        />

        {{ statusLabel }}
      </span>
    </button>

    <div
      v-if="expanded"
      id="home-assistant-configuration"
      class="configuration-content"
    >
      <div
        v-if="loading"
        class="configuration-loading"
        role="status"
        aria-live="polite"
      >
        Chargement de la configuration…
      </div>

      <div
        v-else
        class="configuration-form"
      >
        <label class="configuration-field">
          <span>
            Adresse Home Assistant
          </span>

          <input
  v-model="configuration.haUrl"
  type="url"
  name="home-assistant-server-address"
  autocomplete="off"
  autocapitalize="none"
  autocorrect="off"
  spellcheck="false"
  inputmode="url"
  enterkeyhint="next"
  aria-label="Adresse du serveur Home Assistant"
  placeholder="http://homeassistant.local:8123"
  :disabled="saving || checking"
  @input="clearMessages"
/>
        </label>

        <label class="configuration-field">
          <span>
            Jeton d’accès longue durée
          </span>

          <span class="token-field">
            <input
  v-model="configuration.token"
  type="text"
  name="ha-api-token-not-a-password"
  autocomplete="new-password"
  autocapitalize="none"
  autocorrect="off"
  spellcheck="false"
  inputmode="text"
  aria-label="Jeton d'accès Home Assistant"
  data-1p-ignore="true"
  data-lpignore="true"
  :class="{
    'token-masked': !showToken,
  }"
  placeholder="Jeton Home Assistant"
  :disabled="saving || checking"
  @input="clearMessages"
/>

            <button
              type="button"
              class="token-toggle"
              :aria-label="showToken ? 'Masquer le jeton' : 'Afficher le jeton'"
              :disabled="saving || checking"
              @click="showToken = !showToken"
            >
              {{ showToken ? 'Masquer' : 'Afficher' }}
            </button>
          </span>
        </label>

        

        <div
          v-if="
            connectionMessage &&
            status === 'unreachable'
          "
          class="configuration-message error-message"
          role="status"
          aria-live="polite"
        >
          {{ connectionMessage }}
        </div>

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
            class="secondary-button"
            :disabled="
              saving ||
              checking ||
              !hasChanges
            "
            @click="resetConfiguration"
          >
            Annuler
          </button>

          <button
            type="button"
            class="primary-button"
            :disabled="
              saving ||
              checking ||
              !canSubmit
            "
            @click="saveConfiguration"
          >
            {{ primaryActionLabel }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.configuration-panel {
  margin-bottom: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.configuration-header {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  padding: 14px 16px;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.configuration-header:hover {
  background: #f3f4f6;
}

.configuration-header:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: -2px;
}

.configuration-title {
  min-width: 0;
}

.configuration-title strong,
.configuration-title small {
  display: block;
}

.configuration-title small {
  margin-top: 3px;
  color: #6b7280;
  font-size: 13px;
  font-weight: 400;
}

.configuration-indicator {
  width: 14px;
  color: #6b7280;
  font-size: 11px;
  text-align: center;
}

.configuration-status {
  display: inline-flex;
  gap: 9px;
  align-items: center;
  margin-left: auto;
  padding: 8px 13px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 14px;
  font-weight: 650;
  line-height: 1.2;
  white-space: nowrap;
}

.status-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #9ca3af;
}

.status-checking .status-dot {
  background: #f59e0b;
}

.status-connected .status-dot {
  background: #22c55e;
}

.status-dirty .status-dot,
.status-verification-required .status-dot {
  background: #f59e0b;
}

.status-unreachable .status-dot {
  background: #ef4444;
}

.status-unconfigured .status-dot {
  background: #9ca3af;
}

.configuration-content {
  padding: 16px;
  border-top: 1px solid #ddd;
}

.configuration-loading {
  color: #6b7280;
}

.configuration-form {
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    minmax(0, 1fr);
  gap: 16px;
}

.configuration-field {
  display: grid;
  gap: 7px;
  font-weight: 600;
}

.configuration-field input {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  color: inherit;
  font: inherit;
  font-weight: 400;
}

.configuration-field input:focus {
  border-color: #2563eb;
  outline: 2px solid rgb(37 99 235 / 18%);
}

.configuration-field input:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.token-field {
  display: flex;
  gap: 8px;
}

.token-field input {
  min-width: 0;
  flex: 1;
}

.token-field input.token-masked {
  -webkit-text-security: disc;
}

.token-toggle,
.secondary-button,
.primary-button {
  padding: 8px 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.primary-button {
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;
}

.token-toggle:disabled,
.secondary-button:disabled,
.primary-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.configuration-options {
  display: flex;
  grid-column: 1 / -1;
  gap: 24px;
  align-items: center;
  flex-wrap: wrap;
}

.configuration-options label {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

.configuration-options input {
  width: 16px;
  height: 16px;
}

.configuration-message {
  grid-column: 1 / -1;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 14px;
}

.error-message {
  background: #fef2f2;
  color: #b91c1c;
}

.success-message {
  background: #f0fdf4;
  color: #166534;
}

.configuration-actions {
  display: flex;
  grid-column: 1 / -1;
  gap: 10px;
  justify-content: flex-end;
}

@media (max-width: 700px) {
  .configuration-form {
    grid-template-columns: 1fr;
  }

  .configuration-options,
  .configuration-message,
  .configuration-actions {
    grid-column: auto;
  }

  .configuration-options {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .configuration-status {
    margin-left: 0;
  }

  .token-field {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
