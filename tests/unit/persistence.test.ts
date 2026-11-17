import { describe, expect, it } from 'vitest'
import type { Note, NoteDraft } from '../../types/note'
import { applyExternalNotesValue, hydrateFromStorage, persistDraft, persistNotes, readRestorableDraft } from '../../utils/storage/persistence'
import { DRAFT_STORAGE_KEY, NOTES_STORAGE_KEY } from '../../utils/storage/storageKeys'

class MemoryStorage {
  private values = new Map<string, string>()
  getItem(key: string): string | null { return this.values.get(key) ?? null }
  setItem(key: string, value: string): void { this.values.set(key, value) }
  removeItem(key: string): void { this.values.delete(key) }
}

const note: Note = { id: 'open', title: 'Open', todos: [], createdAt: '1', updatedAt: '2' }
const draft: NoteDraft = { noteId: 'open', baseUpdatedAt: '2', note: { ...note, title: 'Draft' }, savedAt: '3' }

describe('manual persistence and cross-tab updates', () => {
  it('writes versioned notes and a restorable draft', () => {
    const storage = new MemoryStorage()
    persistNotes(storage, [note])
    persistDraft(storage, draft)
    expect(JSON.parse(storage.getItem(NOTES_STORAGE_KEY) ?? '{}').schemaVersion).toBe(1)
    expect(JSON.parse(storage.getItem(DRAFT_STORAGE_KEY) ?? '{}').draft.note.title).toBe('Draft')
    expect(hydrateFromStorage(storage)).toMatchObject({ ok: true, value: [note] })
    expect(readRestorableDraft(storage, [note])).toEqual(draft)
  })

  it('does not restore a draft if its source note was removed or changed', () => {
    const storage = new MemoryStorage()
    persistDraft(storage, draft)
    expect(readRestorableDraft(storage, [])).toBeNull()
    expect(readRestorableDraft(storage, [{ ...note, updatedAt: 'different' }])).toBeNull()
  })

  it('applies another tab update and signals deletion of the open note', () => {
    const storage = new MemoryStorage()
    persistDraft(storage, draft)
    const store = {
      notes: [note],
      deleted: null as string | null,
      hydrate(next: Note[]): void { this.notes = next },
      setExternalDeletion(id: string | null): void { this.deleted = id },
    }
    const result = applyExternalNotesValue(storage, JSON.stringify({ schemaVersion: 1, notes: [], savedAt: 'now' }), 'open', store)
    expect(result).toEqual({ externalDeletionId: 'open', isValid: true })
    expect(store.notes).toEqual([])
    expect(store.deleted).toBe('open')
    expect(storage.getItem(DRAFT_STORAGE_KEY)).toBeNull()
  })

  it('ignores corrupt data and does not replace the existing store value', () => {
    const storage = new MemoryStorage()
    const store = {
      notes: [note],
      hydrate(next: Note[]): void { this.notes = next },
      setExternalDeletion(): void {},
    }
    const result = applyExternalNotesValue(storage, '{bad', 'open', store)
    expect(result.isValid).toBe(false)
    expect(store.notes).toEqual([note])
  })
})
