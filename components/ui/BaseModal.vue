<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFocusTrap } from '../../composables/useFocusTrap'

const props = defineProps<{ title: string; labelledBy?: string }>()
const isOpen = defineModel<boolean>({ required: true })
const dialog = ref<HTMLElement | null>(null)
const titleId = computed(() => props.labelledBy ?? `dialog-${Math.random().toString(36).slice(2)}`)
useFocusTrap(isOpen, dialog)
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal" @click.self="isOpen = false">
      <section
        ref="dialog"
        class="modal__panel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
      >
        <header class="modal__header">
          <h2 :id="titleId" class="modal__title">{{ title }}</h2>
          <button class="modal__close" type="button" aria-label="Закрыть" @click="isOpen = false">×</button>
        </header>
        <div class="modal__body"><slot /></div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
@use '~/assets/scss/tokens' as *;
.modal {
  position: fixed;
  z-index: $layer-modal;
  inset: 0;
  display: grid;
  place-items: center;
  padding: $space-4;
  background: $color-overlay;
}
.modal__panel {
  width: min(100%, $dialog-width);
  max-height: calc($viewport-height - $space-8);
  overflow: auto;
  border: $border-width solid $color-line;
  border-radius: $radius-card;
  background: $color-surface;
  box-shadow: $shadow-card;
}
.modal__header { display: flex; align-items: center; justify-content: space-between; gap: $space-4; padding: $space-5 $space-6; border-bottom: $border-width solid $color-line; }
.modal__title { margin: 0; color: $color-ink; font-size: $font-heading; }
.modal__close { border: 0; background: transparent; color: $color-muted; font-size: $font-large; cursor: pointer; }
.modal__body { padding: $space-6; }
</style>
