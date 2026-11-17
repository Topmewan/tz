<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  type?: 'button' | 'submit'
  disabled?: boolean
}>(), { variant: 'secondary', type: 'button', disabled: false })
</script>

<template>
  <button
    class="button"
    :class="`button--${variant}`"
    :type="type"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped lang="scss">
@use '~/assets/scss/tokens' as *;
.button {
  min-height: $control-height;
  padding: $space-2 $space-4;
  border: $border-width solid transparent;
  border-radius: $radius-control;
  font: inherit;
  font-weight: $font-weight-semibold;
  cursor: pointer;
  transition:
    background-color $transition-fast ease,
    transform $transition-fast ease;
  &:focus-visible {
    outline: $focus-outline-width solid $color-focus;
    outline-offset: $focus-outline-offset;
  }
  &:disabled {
    cursor: not-allowed;
    opacity: $disabled-opacity;
  }
  &:not(:disabled):hover {
    filter: brightness($button-hover-brightness);
  }
  &--primary {
    background: $color-ink;
    color: $color-surface;
  }
  &--secondary {
    background: $color-soft;
    color: $color-ink;
    border-color: $color-line;
  }
  &--danger {
    background: $color-danger;
    color: $color-surface;
  }
  &--ghost {
    background: transparent;
    color: $color-muted;
  }
}
</style>
