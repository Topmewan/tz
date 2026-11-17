<script setup lang="ts">
import BaseButton from '../ui/BaseButton.vue'

defineProps<{ canUndo: boolean, canRedo: boolean, isDirty: boolean }>()
const emit = defineEmits<{ undo: [], redo: [], save: [], cancel: [], remove: [] }>()

function onUndo(): void { emit('undo') }
function onRedo(): void { emit('redo') }
function onSave(): void { emit('save') }
function onCancel(): void { emit('cancel') }
function onRemove(): void { emit('remove') }
</script>

<template>
  <nav
    class="editor-toolbar"
    aria-label="Действия с заметкой"
  >
    <div class="editor-toolbar__history">
      <BaseButton
        variant="secondary"
        :disabled="!canUndo"
        aria-keyshortcuts="Control+Z Meta+Z"
        @click="onUndo"
      >
        Отменить
      </BaseButton>
      <BaseButton
        variant="secondary"
        :disabled="!canRedo"
        aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z"
        @click="onRedo"
      >
        Повторить
      </BaseButton>
    </div>
    <div class="editor-toolbar__primary">
      <BaseButton
        variant="ghost"
        @click="onCancel"
      >
        Отменить редактирование
      </BaseButton>
      <BaseButton
        variant="danger"
        @click="onRemove"
      >
        Удалить
      </BaseButton>
      <BaseButton
        variant="primary"
        :disabled="!isDirty"
        @click="onSave"
      >
        Сохранить
      </BaseButton>
    </div>
  </nav>
</template>

<style scoped lang="scss">
@use '~/assets/scss/tokens' as *;
.editor-toolbar {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding-bottom: $space-4;
  border-bottom: $border-width solid $color-line;
}
.editor-toolbar__history,
.editor-toolbar__primary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: $space-2;
}
@include tablet {
  .editor-toolbar {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}
</style>
