<script setup lang="ts">
import BaseCheckbox from '../ui/BaseCheckbox.vue'
import BaseInput from '../ui/BaseInput.vue'
import BaseButton from '../ui/BaseButton.vue'
import type { TodoItem } from '../../types/note'

const props = defineProps<{ todo: TodoItem; index: number }>()
const emit = defineEmits<{
  textInput: [payload: { todoId: string; value: string }]
  textCommit: []
  toggle: [payload: { todoId: string; isCompleted: boolean }]
  remove: [todoId: string]
}>()

function onTextInput(value: string): void { emit('textInput', { todoId: props.todo.id, value }) }
function onTextCommit(): void { emit('textCommit') }
function onToggle(isCompleted: boolean): void { emit('toggle', { todoId: props.todo.id, isCompleted }) }
function onRemove(): void { emit('remove', props.todo.id) }
</script>

<template>
  <li class="todo-row" :class="{ 'todo-row--complete': props.todo.isCompleted }">
    <BaseCheckbox
      :id="`todo-${todo.id}`"
      :label="`Выполнено: ${todo.text || `Задача ${index + 1}`}`"
      :model-value="todo.isCompleted"
      @update:model-value="onToggle"
    />
    <BaseInput
      :id="`todo-text-${todo.id}`"
      :label="`Текст задачи ${index + 1}`"
      :model-value="todo.text"
      placeholder="Например, купить продукты"
      @update:model-value="onTextInput"
      @blur="onTextCommit"
    />
    <BaseButton variant="ghost" :aria-label="`Удалить задачу ${index + 1}`" @click="onRemove">Удалить</BaseButton>
  </li>
</template>

<style scoped lang="scss">
@use '~/assets/scss/tokens' as *;
.todo-row { display: grid; grid-template-columns: 1fr; align-items: center; gap: $space-3; padding: $space-4 0; border-bottom: $border-width solid $color-line; }
.todo-row--complete :deep(.field__control) { color: $color-muted; }
@include tablet { .todo-row { grid-template-columns: #{$todo-label-column} #{$todo-input-column} auto; } }
</style>
