<script setup lang="ts">
defineProps<{ label: string, id: string, multiline?: boolean, placeholder?: string }>()
const model = defineModel<string>({ required: true })
</script>

<template>
  <label
    class="field"
    :for="id"
  >
    <span class="field__label">{{ label }}</span>
    <textarea
      v-if="multiline"
      :id="id"
      v-model="model"
      class="field__control field__control--multiline"
      :placeholder="placeholder"
    />
    <input
      v-else
      :id="id"
      v-model="model"
      class="field__control"
      :placeholder="placeholder"
    >
  </label>
</template>

<style scoped lang="scss">
@use '~/assets/scss/tokens' as *;
.field {
  display: grid;
  gap: $space-2;
}
.field__label {
  color: $color-muted;
  font-size: $font-small;
  font-weight: $font-weight-semibold;
}
.field__control {
  width: 100%;
  min-height: $control-height;
  padding: $space-3;
  border: $border-width solid $color-line;
  border-radius: $radius-control;
  background: $color-surface;
  color: $color-ink;
  font: inherit;
  &:focus-visible {
    outline: $focus-outline-width solid $color-focus;
    outline-offset: $focus-outline-offset;
    border-color: transparent;
  }
}
.field__control--multiline {
  min-height: $space-12;
  resize: vertical;
}
</style>
