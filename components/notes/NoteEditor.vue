<script setup lang="ts">
import BaseInput from '../ui/BaseInput.vue'
import TodoList from './TodoList.vue'
import type { Note } from '../../types/note'

const props = defineProps<{ note: Note, isNew: boolean }>()
const emit = defineEmits<{
  titleInput: [value: string]
  textInput: [payload: { todoId: string, value: string }]
  textCommit: []
  toggle: [payload: { todoId: string, isCompleted: boolean }]
  remove: [todoId: string]
  add: []
}>()

function onTitleInput(value: string): void { emit('titleInput', value) }
function onTextInput(payload: { todoId: string, value: string }): void { emit('textInput', payload) }
function onTextCommit(): void { emit('textCommit') }
function onToggle(payload: { todoId: string, isCompleted: boolean }): void { emit('toggle', payload) }
function onRemove(todoId: string): void { emit('remove', todoId) }
function onAdd(): void { emit('add') }
</script>

<template>
  <section
    class="note-editor"
    aria-labelledby="editor-title"
  >
    <header class="note-editor__header">
      <p class="note-editor__eyebrow">
        {{ props.isNew ? 'НОВАЯ ЗАМЕТКА' : 'РЕДАКТИРОВАНИЕ' }}
      </p>
      <h1
        id="editor-title"
        class="note-editor__title"
      >
        Организуйте мысли по шагам
      </h1>
    </header>
    <BaseInput
      id="note-title"
      label="Название заметки"
      :model-value="props.note.title"
      placeholder="Например, планы на выходные"
      @update:model-value="onTitleInput"
      @blur="onTextCommit"
    />
    <TodoList
      :todos="props.note.todos"
      @text-input="onTextInput"
      @text-commit="onTextCommit"
      @toggle="onToggle"
      @remove="onRemove"
      @add="onAdd"
    />
  </section>
</template>

<style scoped lang="scss">
@use '~/assets/scss/tokens' as *;
.note-editor {
  display: grid;
  gap: $space-6;
}
.note-editor__header {
  display: grid;
  gap: $space-2;
}
.note-editor__eyebrow {
  margin: 0;
  color: $color-accent;
  font-size: $font-small;
  font-weight: $font-weight-emphasis;
  letter-spacing: $letter-spacing-emphasis;
}
.note-editor__title {
  margin: 0;
  max-width: $content-width;
  font-size: clamp($font-display-editor-min, $font-display-editor-fluid, $font-display-editor-max);
  line-height: $line-height-display;
}
</style>
