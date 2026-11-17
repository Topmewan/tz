import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useNotesStore } from '../../stores/notes'
import type { Note } from '../../types/note'

const first: Note = { id: 'a', title: 'A', todos: [], createdAt: '1', updatedAt: '2025' }
const second: Note = { id: 'b', title: 'B', todos: [], createdAt: '2', updatedAt: '2026' }

describe('notes store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('hydrates, finds, sorts, upserts, and deletes notes', () => {
    const store = useNotesStore()
    store.hydrate([first, second])
    expect(store.hasHydrated).toBe(true)
    expect(store.sortedNotes.map((note) => note.id)).toEqual(['b', 'a'])
    expect(store.findNote('a')).toEqual(first)
    store.upsertNote({ ...first, title: 'Updated' })
    expect(store.notes).toHaveLength(2)
    expect(store.findNote('a')?.title).toBe('Updated')
    store.deleteNote('b')
    expect(store.notes.map((note) => note.id)).toEqual(['a'])
  })

  it('tracks external deletion separately from persisted notes', () => {
    const store = useNotesStore()
    store.hydrate([first])
    store.setExternalDeletion('a')
    expect(store.externalDeletionId).toBe('a')
    store.hydrate([])
    expect(store.externalDeletionId).toBeNull()
  })
})
