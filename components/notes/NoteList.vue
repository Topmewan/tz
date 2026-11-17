<script setup lang="ts">
import NoteCard from './NoteCard.vue'
import type { Note } from '../../types/note'

defineProps<{ notes: Note[] }>()
const emit = defineEmits<{ edit: [id: string]; remove: [id: string] }>()

function onEdit(id: string): void { emit('edit', id) }
function onRemove(id: string): void { emit('remove', id) }
</script>

<template>
  <section class="note-list" aria-label="Все заметки">
    <NoteCard
      v-for="note in notes"
      :key="note.id"
      :note="note"
      @edit="onEdit"
      @remove="onRemove"
    />
  </section>
</template>

<style scoped lang="scss">
@use '~/assets/scss/tokens' as *;
.note-list { display: grid; grid-template-columns: minmax(0, 1fr); gap: $space-4; }
@include tablet { .note-list { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: $space-5; } }
@media (min-width: $breakpoint-wide) { .note-list { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
</style>
