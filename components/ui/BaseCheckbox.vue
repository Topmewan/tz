<script setup lang="ts">
defineProps<{ label: string; id: string; disabled?: boolean }>()
const model = defineModel<boolean>({ required: true })
</script>

<template>
  <label class="checkbox" :for="id">
    <input :id="id" v-model="model" class="checkbox__input" type="checkbox" :disabled="disabled">
    <span class="checkbox__label">{{ label }}</span>
  </label>
</template>

<style scoped lang="scss">
@use '~/assets/scss/tokens' as *;
.checkbox { display: inline-flex; align-items: center; gap: $space-2; min-height: $control-height; cursor: pointer; }
.checkbox__input { width: $space-5; height: $space-5; accent-color: $color-accent; }
.checkbox__input:focus-visible { outline: $focus-outline-width solid $color-focus; outline-offset: $focus-outline-offset; }
.checkbox__label { color: $color-ink; }
</style>
