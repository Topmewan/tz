import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Note, NoteDraft, NoteId } from '../../types/note'
import type { PersistenceEventTarget, StorageChange } from '../../utils/storage/persistenceLifecycle'
import { createPersistenceLifecycle, type PersistenceStore } from '../../utils/storage/persistenceLifecycle'
import type { StorageLike } from '../../utils/storage/persistence'
import { parseNotes, serializeDraft, serializeNotes } from '../../utils/storage/noteStorage'
import { DRAFT_STORAGE_KEY, NOTES_STORAGE_KEY } from '../../utils/storage/storageKeys'

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>()
  getItem(key: string): string | null { return this.values.get(key) ?? null }
  setItem(key: string, value: string): void { this.values.set(key, value) }
  removeItem(key: string): void { this.values.delete(key) }
}

class TestStore implements PersistenceStore {
  notes: Note[] = []
  hasHydrated = false
  externalDeletionId: NoteId | null = null
  private subscribers = new Set<() => void>()
  hydrate(notes: Note[]): void { this.notes = notes; this.hasHydrated = true; this.externalDeletionId = null }
  setExternalDeletion(id: NoteId | null): void { this.externalDeletionId = id }
  subscribe(onChange: () => void): () => void {
    this.subscribers.add(onChange)
    return () => this.subscribers.delete(onChange)
  }
  changed(): void { for (const subscriber of this.subscribers) subscriber() }
}

class EventHub implements PersistenceEventTarget {
  activeNoteId: NoteId | null = 'note-1'
  storageListeners = new Set<(event: StorageChange) => void>()
  pageHideListeners = new Set<() => void>()
  addStorageListener(listener: (event: StorageChange) => void): void { this.storageListeners.add(listener) }
  removeStorageListener(listener: (event: StorageChange) => void): void { this.storageListeners.delete(listener) }
  addPageHideListener(listener: () => void): void { this.pageHideListeners.add(listener) }
  removePageHideListener(listener: () => void): void { this.pageHideListeners.delete(listener) }
  getActiveNoteId(): NoteId | null { return this.activeNoteId }
  dispatchStorage(event: StorageChange): void { for (const listener of this.storageListeners) listener(event) }
}

const initialNote: Note = { id: 'note-1', title: 'Original', todos: [], createdAt: '1', updatedAt: '2' }

describe('app persistence lifecycle', () => {
  afterEach(() => vi.useRealTimers())

  it('cleans up listeners on disposal and reattaches them on a later app initialization', () => {
    vi.useFakeTimers()
    const storage = new MemoryStorage()
    const hub = new EventHub()
    const store = new TestStore()
    storage.setItem(NOTES_STORAGE_KEY, serializeNotes([initialNote]))

    const firstLifecycle = createPersistenceLifecycle(store, storage, store.subscribe.bind(store), hub)
    expect(hub.storageListeners.size).toBe(1)
    expect(hub.pageHideListeners.size).toBe(1)
    store.notes = [{ ...initialNote, title: 'Saved update' }]
    store.changed()
    vi.advanceTimersByTime(300)
    const firstSave = parseNotes(storage.getItem(NOTES_STORAGE_KEY))
    expect(firstSave.ok && firstSave.value.notes[0]?.title).toBe('Saved update')

    firstLifecycle.dispose()
    expect(hub.storageListeners.size).toBe(0)
    expect(hub.pageHideListeners.size).toBe(0)

    const secondLifecycle = createPersistenceLifecycle(store, storage, store.subscribe.bind(store), hub)
    expect(hub.storageListeners.size).toBe(1)
    expect(hub.pageHideListeners.size).toBe(1)
    hub.dispatchStorage({
      key: NOTES_STORAGE_KEY,
      newValue: serializeNotes([]),
      storageArea: storage,
    })
    expect(store.notes).toEqual([])
    expect(store.externalDeletionId).toBe('note-1')

    secondLifecycle.dispose()
    expect(hub.storageListeners.size).toBe(0)
    expect(hub.pageHideListeners.size).toBe(0)
  })

  it('offers a stale draft for safe discard instead of treating it as restorable', () => {
    const storage = new MemoryStorage()
    const hub = new EventHub()
    const store = new TestStore()
    const currentNote = { ...initialNote, updatedAt: 'later-revision' }
    const staleDraft: NoteDraft = {
      noteId: initialNote.id,
      baseUpdatedAt: initialNote.updatedAt,
      note: { ...initialNote, title: 'Unrestorable local copy' },
      savedAt: '3',
    }
    storage.setItem(NOTES_STORAGE_KEY, serializeNotes([currentNote]))
    storage.setItem(DRAFT_STORAGE_KEY, serializeDraft(staleDraft))

    const lifecycle = createPersistenceLifecycle(store, storage, store.subscribe.bind(store), hub)
    expect(lifecycle.restoredDraft).toBeNull()
    expect(lifecycle.conflictingDraft).toEqual(staleDraft)
    lifecycle.dispose()
  })

})
