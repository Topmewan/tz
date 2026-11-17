import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Note, NoteId } from '../types/note'

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([])
  const hasHydrated = ref(false)
  const externalDeletionId = ref<NoteId | null>(null)
  const sortedNotes = computed(() => [...notes.value].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)))

  function hydrate(nextNotes: Note[]): void {
    notes.value = nextNotes
    hasHydrated.value = true
    externalDeletionId.value = null
  }

  function upsertNote(note: Note): void {
    const index = notes.value.findIndex(entry => entry.id === note.id)
    if (index === -1) notes.value = [...notes.value, note]
    else notes.value = notes.value.map(entry => entry.id === note.id ? note : entry)
  }

  function deleteNote(id: NoteId): void {
    notes.value = notes.value.filter(note => note.id !== id)
  }

  function findNote(id: NoteId): Note | undefined {
    return notes.value.find(note => note.id === id)
  }

  function setExternalDeletion(id: NoteId | null): void {
    externalDeletionId.value = id
  }

  return { notes, hasHydrated, externalDeletionId, sortedNotes, hydrate, upsertNote, deleteNote, findNote, setExternalDeletion }
})
