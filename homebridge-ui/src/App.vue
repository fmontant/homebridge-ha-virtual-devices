<script setup lang="ts">
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
} from 'vue';

import { catalogApi } from './api/catalogApi';
import DeviceDetails from './components/DeviceDetails.vue';
import DeviceRow from './components/DeviceRow.vue';
import {
  catalogEventListener,
} from './events/catalogEventListener';
import type {
  CatalogDevice,
  DeviceState,
} from './models/catalogDevice';

type SortKey =
  | 'state'
  | 'name'
  | 'source'
  | 'room';

type SortDirection =
  | 'asc'
  | 'desc';

type StateFilter =
  | DeviceState
  | '';

const search =
  ref('');

const stateFilter =
  ref<StateFilter>('');

const roomFilter =
  ref('');

const loading =
  ref(false);

const initialized =
  ref(false);

const errorMessage =
  ref('');

const devices =
  ref<CatalogDevice[]>([]);

const selectedDeviceId =
  ref<string | null>(null);

const sortKey =
  ref<SortKey | null>(null);

const sortDirection =
  ref<SortDirection>('asc');

const selectedDevice =
  computed<CatalogDevice | null>(
    () => {
      if (!selectedDeviceId.value) {
        return null;
      }

      return (
        devices.value.find(
          device =>
            device.id ===
            selectedDeviceId.value,
        ) ??
        null
      );
    },
  );

const availableRooms =
  computed(() => {
    const rooms =
      devices.value
        .map(device =>
          device.room.trim(),
        )
        .filter(room =>
          room.length > 0,
        );

    return [
      ...new Set(rooms),
    ].sort(
      (left, right) =>
        left.localeCompare(
          right,
          'fr',
          {
            numeric: true,
            sensitivity: 'base',
          },
        ),
    );
  });

const filteredDevices =
  computed(() => {
    const query =
      search.value
        .trim()
        .toLowerCase();

    return devices.value.filter(
      device => {
        const matchesSearch =
          !query ||
          [
            device.name,
            device.source,
            device.room,
            device.state,
            ...device.capabilities,
          ]
            .join(' ')
            .toLowerCase()
            .includes(query);

        const matchesState =
          !stateFilter.value ||
          device.state ===
            stateFilter.value;

        const matchesRoom =
          !roomFilter.value ||
          device.room ===
            roomFilter.value;

        return (
          matchesSearch &&
          matchesState &&
          matchesRoom
        );
      },
    );
  });

const sortedDevices =
  computed(() => {
    if (sortKey.value === null) {
      return filteredDevices.value;
    }

    const direction =
      sortDirection.value === 'asc'
        ? 1
        : -1;

    return filteredDevices.value
      .map(
        (device, index) => ({
          device,
          index,
        }),
      )
      .sort(
        (left, right) => {
          const comparison =
            getSortValue(
              left.device,
              sortKey.value!,
            ).localeCompare(
              getSortValue(
                right.device,
                sortKey.value!,
              ),
              'fr',
              {
                numeric: true,
                sensitivity: 'base',
              },
            );

          if (comparison !== 0) {
            return (
              comparison *
              direction
            );
          }

          return (
            left.index -
            right.index
          );
        },
      )
      .map(
        ({ device }) =>
          device,
      );
  });

const initialLoading =
  computed(
    () =>
      loading.value &&
      !initialized.value,
  );

const refreshing =
  computed(
    () =>
      loading.value &&
      initialized.value,
  );

const filtersActive =
  computed(
    () =>
      search.value
        .trim()
        .length > 0 ||
      stateFilter.value !== '' ||
      roomFilter.value !== '',
  );

async function loadDevices():
Promise<void> {
  if (loading.value) {
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const loadedDevices =
      await catalogApi
        .getDevices();

    devices.value =
      loadedDevices;

    if (
      selectedDeviceId.value &&
      !loadedDevices.some(
        device =>
          device.id ===
          selectedDeviceId.value,
      )
    ) {
      selectedDeviceId.value =
        null;
    }

    initialized.value =
      true;
  } catch (error: unknown) {
    errorMessage.value =
      getErrorMessage(
        error,
      );
  } finally {
    loading.value =
      false;
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

  return 'Le catalogue n’a pas pu être chargé.';
}

function getSortValue(
  device: CatalogDevice,
  key: SortKey,
): string {
  switch (key) {
    case 'state':
      return device.state;

    case 'name':
      return device.name;

    case 'source':
      return device.source;

    case 'room':
      return device.room;

    default:
      return '';
  }
}

function changeSort(
  key: SortKey,
): void {
  if (
    sortKey.value === key
  ) {
    sortDirection.value =
      sortDirection.value === 'asc'
        ? 'desc'
        : 'asc';

    return;
  }

  sortKey.value =
    key;

  sortDirection.value =
    'asc';
}

function getSortIndicator(
  key: SortKey,
): string {
  if (
    sortKey.value === null ||
    sortKey.value !== key
  ) {
    return '';
  }

  return sortDirection.value === 'asc'
    ? '▲'
    : '▼';
}

function resetFilters():
void {
  search.value = '';
  stateFilter.value = '';
  roomFilter.value = '';
}

function selectDevice(
  device: CatalogDevice,
): void {
  selectedDeviceId.value =
    device.id;
}

function updateDevice(
  updatedDevice: CatalogDevice,
): void {
  const deviceIndex =
    devices.value.findIndex(
      device =>
        device.id ===
        updatedDevice.id,
    );

  if (deviceIndex === -1) {
    return;
  }

  devices.value[deviceIndex] =
    updatedDevice;
}

async function toggleFavorite(
  device: CatalogDevice,
): Promise<void> {
  const previousFavorite =
    device.favorite;

  const favorite =
    !previousFavorite;

  device.favorite =
    favorite;

  errorMessage.value =
    '';

  try {
    const updatedDevice =
      await catalogApi
        .setFavorite(
          device.id,
          favorite,
        );

    updateDevice(
      updatedDevice,
    );
  } catch (error: unknown) {
    device.favorite =
      previousFavorite;

    errorMessage.value =
      getErrorMessage(
        error,
      );
  }
}

onMounted(() => {
  catalogEventListener
    .subscribe(
      () => {
        void loadDevices();
      },
    );

  void loadDevices();
});

onUnmounted(() => {
  catalogEventListener
    .unsubscribe();
});
</script>

<template>
  <main class="app">
    <header class="header">
      <div>
        <h1>
          Homebridge HA Virtual Devices
        </h1>

        <p>
          Gestion des appareils Home Assistant exposés à HomeKit.
        </p>
      </div>

      <button
        type="button"
        class="primary-button"
        :disabled="loading"
        @click="loadDevices"
      >
        <span
          v-if="loading"
          class="button-spinner"
          aria-hidden="true"
        />

        {{
          refreshing
            ? 'Actualisation…'
            : 'Actualiser'
        }}
      </button>
    </header>

    <section class="toolbar">
      <input
        v-model="search"
        class="search-input"
        type="search"
        placeholder="Rechercher un appareil…"
      />

      <select
        v-model="stateFilter"
        class="filter-select"
        aria-label="Filtrer par état"
      >
        <option value="">
          Tous les états
        </option>

        <option value="enabled">
          Actif
        </option>

        <option value="disabled">
          Désactivé
        </option>

        <option value="hidden">
          Masqué
        </option>

        <option value="missing">
          Manquant
        </option>
      </select>

      <select
        v-model="roomFilter"
        class="filter-select"
        aria-label="Filtrer par pièce"
      >
        <option value="">
          Toutes les pièces
        </option>

        <option
          v-for="room in availableRooms"
          :key="room"
          :value="room"
        >
          {{ room }}
        </option>
      </select>

      <button
        v-if="filtersActive"
        type="button"
        class="reset-button"
        @click="resetFilters"
      >
        Réinitialiser
      </button>

      <span class="device-count">
        {{ sortedDevices.length }}
        appareil{{ sortedDevices.length > 1 ? 's' : '' }}
      </span>
    </section>

    <section
      v-if="errorMessage"
      class="error-message"
      role="alert"
    >
      <div>
        <strong>
          {{
            initialized
              ? 'Erreur d’actualisation'
              : 'Erreur de chargement'
          }}
        </strong>

        <p>
          {{ errorMessage }}
        </p>
      </div>

      <button
        type="button"
        class="retry-button"
        :disabled="loading"
        @click="loadDevices"
      >
        Réessayer
      </button>
    </section>

    <section class="workspace">
      <section class="catalog">
        <div class="table-header">
          <button
            type="button"
            class="sort-button"
            @click="changeSort('state')"
          >
            État

            <span class="sort-indicator">
              {{ getSortIndicator('state') }}
            </span>
          </button>

          <span class="favorite-header">
            ★
          </span>

          <button
            type="button"
            class="sort-button"
            @click="changeSort('name')"
          >
            Nom

            <span class="sort-indicator">
              {{ getSortIndicator('name') }}
            </span>
          </button>

          <button
            type="button"
            class="sort-button"
            @click="changeSort('source')"
          >
            Source

            <span class="sort-indicator">
              {{ getSortIndicator('source') }}
            </span>
          </button>

          <button
            type="button"
            class="sort-button"
            @click="changeSort('room')"
          >
            Pièce

            <span class="sort-indicator">
              {{ getSortIndicator('room') }}
            </span>
          </button>
        </div>

        <div
          v-if="initialLoading"
          class="loading-state"
          role="status"
          aria-live="polite"
        >
          <span
            class="loading-spinner"
            aria-hidden="true"
          />

          <span>
            Chargement du catalogue…
          </span>
        </div>

        <template v-else>
          <DeviceRow
            v-for="device in sortedDevices"
            :key="device.id"
            :device="device"
            :selected="
              device.id ===
              selectedDeviceId
            "
            @click="selectDevice(device)"
            @favorite="toggleFavorite(device)"
          />

          <p
            v-if="sortedDevices.length === 0"
            class="empty-state"
          >
            {{
              errorMessage &&
              !initialized
                ? 'Catalogue indisponible.'
                : filtersActive
                  ? 'Aucun appareil ne correspond aux filtres.'
                  : 'Aucun appareil.'
            }}
          </p>
        </template>
      </section>

      <section class="details-panel">
        <DeviceDetails
          :device="selectedDevice"
          @updated="updateDevice"
        />
      </section>
    </section>
  </main>
</template>

<style scoped>
.app {
  width: 100%;
  padding: 24px;
  container-type: inline-size;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header h1 {
  margin: 0 0 6px;
}

.header p {
  margin: 0;
  color: #6b7280;
}

.primary-button {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  min-width: 132px;
  padding: 10px 18px;
  cursor: pointer;
}

.primary-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.button-spinner,
.loading-spinner {
  display: inline-block;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.button-spinner {
  width: 14px;
  height: 14px;
}

.loading-spinner {
  width: 24px;
  height: 24px;
}

.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.search-input {
  flex: 1;
  min-width: 220px;
}

.filter-select {
  min-width: 150px;
}

.search-input,
.filter-select {
  padding: 9px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #ffffff;
  color: inherit;
  font: inherit;
}

.search-input:focus,
.filter-select:focus {
  border-color: #2563eb;
  outline: 2px solid rgb(37 99 235 / 20%);
}

.reset-button {
  padding: 9px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #ffffff;
  color: inherit;
  cursor: pointer;
}

.reset-button:hover {
  background: #f3f4f6;
}

.device-count {
  color: #6b7280;
  white-space: nowrap;
}

.error-message {
  display: flex;
  gap: 24px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 14px 16px;
  border: 1px solid #ef9a9a;
  border-radius: 8px;
  background: #ffebee;
  color: #b71c1c;
}

.error-message strong {
  display: block;
  margin-bottom: 4px;
}

.error-message p {
  margin: 0;
}

.retry-button {
  flex-shrink: 0;
  padding: 8px 14px;
  cursor: pointer;
}

.retry-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.workspace {
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    minmax(320px, 380px);
  gap: 16px;
  align-items: stretch;
}

.catalog,
.details-panel {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.details-panel {
  min-height: 420px;
}

.table-header {
  display: grid;
  grid-template-columns:
    100px
    40px
    1fr
    180px
    150px;
  align-items: center;
  padding: 12px 16px;
  font-weight: 600;
}

.sort-button {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  min-width: 0;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.sort-button:hover {
  color: #2563eb;
}

.sort-button:focus-visible {
  border-radius: 4px;
  outline: 2px solid #2563eb;
  outline-offset: 3px;
}

.sort-indicator {
  display: inline-block;
  width: 12px;
  font-size: 10px;
}

.favorite-header {
  text-align: center;
}

.loading-state {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  color: #6b7280;
}

.empty-state {
  padding: 32px;
  text-align: center;
  color: #6b7280;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@container (max-width: 1000px) {
  .workspace {
    grid-template-columns: 1fr;
  }

  .details-panel {
    min-height: 320px;
  }
}

@media (max-width: 1100px) {
  .workspace {
    grid-template-columns:
      minmax(0, 1fr)
      320px;
  }

  .table-header {
    grid-template-columns:
      90px
      40px
      1fr
      140px
      110px;
  }
}

@media (max-width: 900px) {
  .toolbar {
    flex-wrap: wrap;
  }

  .search-input {
    flex-basis: 100%;
  }

  .device-count {
    margin-left: auto;
  }

  .workspace {
    grid-template-columns: 1fr;
  }

  .details-panel {
    min-height: 320px;
  }
}
</style>
