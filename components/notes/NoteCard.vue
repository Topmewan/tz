<script setup lang="ts">
import { computed } from 'vue'
import type { Note } from '../../types/note'
import BaseButton from '../ui/BaseButton.vue'

const props = defineProps<{ note: Note }>()
const emit = defineEmits<{ edit: [id: string]; remove: [id: string] }>()
const previewTodos = computed(() => props.note.todos.slice(0, 3))
const remainingCount = computed(() => Math.max(0, props.note.todos.length - previewTodos.value.length))
const displayTitle = computed(() => props.note.title.trim() || 'Без названия')

function onEdit(): void { emit('edit', props.note.id) }
function onRemove(): void { emit('remove', props.note.id) }
</script>

<template>
  <article class="note-card">
    <header class="note-card__header">
      <h2 class="note-card__title">{{ displayTitle }}</h2>
      <span class="note-card__count">{{ note.todos.length }} задач</span>
    </header>
    <ul v-if="previewTodos.length" class="note-card__todos">
      <li v-for="todo in previewTodos" :key="todo.id" class="note-card__todo">
        <span class="note-card__check" aria-hidden="true">{{ todo.isCompleted ? '✓' : '○' }}</span>
        <span :class="{ 'note-card__todo-text--done': todo.isCompleted }" class="note-card__todo-text">{{ todo.text || 'Без текста' }}</span>
      </li>
    </ul>
    <p v-else class="note-card__empty">Список задач пока пуст</p>
    <p v-if="remainingCount" class="note-card__remaining">И ещё {{ remainingCount }}</p>
    <footer class="note-card__actions">
      <BaseButton variant="primary" @click="onEdit">Открыть</BaseButton>
      <BaseButton variant="ghost" @click="onRemove">Удалить</BaseButton>
    </footer>
  </article>
</template>

<style scoped lang="scss">
@use '~/assets/scss/tokens' as *;
.note-card { display: grid; align-content: start; gap: $space-4; padding: $space-5; border: $border-width solid $color-line; border-radius: $radius-card; background: $color-surface; box-shadow: $shadow-card; }
.note-card__header { display: flex; align-items: baseline; justify-content: space-between; gap: $space-3; }
.note-card__title { margin: 0; overflow-wrap: anywhere; font-size: $font-heading; }
.note-card__count, .note-card__remaining { color: $color-muted; font-size: $font-small; }
.note-card__todos { display: grid; gap: $space-2; margin: 0; padding: 0; list-style: none; }
.note-card__todo { display: flex; align-items: start; gap: $space-2; }
.note-card__check { color: $color-accent; font-weight: $font-weight-bold; }
.note-card__todo-text { overflow-wrap: anywhere; }
.note-card__todo-text--done { color: $color-muted; text-decoration: line-through; }
.note-card__empty { margin: 0; color: $color-muted; }
.note-card__remaining { margin: 0; }
.note-card__actions { display: flex; gap: $space-2; margin-top: auto; }
</style>
