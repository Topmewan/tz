<script setup lang="ts">
import BaseButton from '../ui/BaseButton.vue'
import TodoRow from './TodoRow.vue'
import type { TodoItem } from '../../types/note'

withDefaults(defineProps<{ todos: TodoItem[]; isReadOnly?: boolean }>(), { isReadOnly: false })
const emit = defineEmits<{
  textInput: [payload: { todoId: string; value: string }]
  textCommit: []
  toggle: [payload: { todoId: string; isCompleted: boolean }]
  remove: [todoId: string]
  add: []
}>()

function onAdd(): void { emit('add') }
function onTextInput(payload: { todoId: string; value: string }): void { emit('textInput', payload) }
function onTextCommit(): void { emit('textCommit') }
function onToggle(payload: { todoId: string; isCompleted: boolean }): void { emit('toggle', payload) }
function onRemove(todoId: string): void { emit('remove', todoId) }
</script>

<template>
  <section class="todo-list" aria-labelledby="todo-heading">
    <div class="todo-list__header">
      <h2 id="todo-heading" class="todo-list__title">Задачи</h2>
      <BaseButton v-if="!isReadOnly" variant="secondary" @click="onAdd">Добавить задачу</BaseButton>
    </div>
    <ul v-if="todos.length" class="todo-list__items">
      <TodoRow
        v-for="(todo, index) in todos"
        :key="todo.id"
        :todo="todo"
        :index="index"
        @text-input="onTextInput"
        @text-commit="onTextCommit"
        @toggle="onToggle"
        @remove="onRemove"
      />
    </ul>
    <p v-else class="todo-list__empty">Пока нет задач. Добавьте первую.</p>
  </section>
</template>

<style scoped lang="scss">
@use '~/assets/scss/tokens' as *;
.todo-list__header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: $space-3; margin-bottom: $space-3; }
.todo-list__title { margin: 0; font-size: $font-heading; }
.todo-list__items { margin: 0; padding: 0; list-style: none; }
.todo-list__empty { color: $color-muted; }
</style>
