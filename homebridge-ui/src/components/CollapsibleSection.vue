<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title: string;
    description: string;
    contentId?: string;
  }>(),
  {
    contentId: undefined,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

function toggle():
void {
  emit(
    'update:modelValue',
    !props.modelValue,
  );
}
</script>

<template>
  <section class="collapsible-section">
    <button
      type="button"
      class="collapsible-header"
      :aria-expanded="modelValue"
      :aria-controls="contentId"
      @click="toggle"
    >
      <span
        class="collapsible-indicator"
        :class="{
          'is-expanded': modelValue,
        }"
        aria-hidden="true"
      />

      <span class="collapsible-heading">
        <span class="collapsible-title">
          {{ title }}
        </span>

        <span class="collapsible-description">
          {{ description }}
        </span>
      </span>

      <span
        v-if="$slots.status"
        class="collapsible-status"
      >
        <slot name="status" />
      </span>
    </button>

    <div
      v-if="modelValue"
      :id="contentId"
      class="collapsible-content"
    >
      <slot />
    </div>
  </section>
</template>

<style scoped>
.collapsible-section {
  width: 100%;
  margin-bottom: 16px;
  overflow: hidden;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #ffffff;
}

.collapsible-header {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  min-height: 66px;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.collapsible-header:hover {
  background: #f3f4f6;
}

.collapsible-header:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: -2px;
}

.collapsible-indicator {
  width: 0;
  height: 0;
  flex: 0 0 auto;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 7px solid #6b7280;
  transition: transform 0.15s ease;
}

.collapsible-indicator.is-expanded {
  transform: rotate(90deg);
}

.collapsible-heading {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.collapsible-title {
  color: #111827;
  font-weight: 400;
  line-height: 1.2;
}

.collapsible-description {
  color: #6b7280;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.25;
}

.collapsible-status {
  display: inline-flex;
  align-items: center;
  margin-left: auto;
}

.collapsible-content {
  padding: 16px;
  border-top: 1px solid #d1d5db;
}

@media (max-width: 700px) {
  .collapsible-header {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .collapsible-indicator {
    margin-top: 4px;
  }

  .collapsible-status {
    width: 100%;
    margin-left: 17px;
  }
}
</style>
