import type { Note, NoteDraft, NoteId } from '../../types/note'
import type { ParseResult } from '../../types/storage'
import { isDraftRestorable, parseDraft, parseNotes, serializeDraft, serializeNotes } from './noteStorage'
import { DRAFT_STORAGE_KEY, NOTES_STORAGE_KEY } from './storageKeys'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface NotesStorePort {
  notes: Note[]
  hydrate(notes: Note[]): void
  setExternalDeletion(id: NoteId | null): void
}

export function hydrateFromStorage(storage: StorageLike): ParseResult<Note[]> {
  const result = parseNotes(storage.getItem(NOTES_STORAGE_KEY))
  if (!result.ok) return result
  return { ok: true, value: result.value.notes }
}

export function persistNotes(storage: StorageLike, notes: Note[]): void {
  storage.setItem(NOTES_STORAGE_KEY, serializeNotes(notes))
}

export function persistDraft(storage: StorageLike, draft: NoteDraft): void {
  storage.setItem(DRAFT_STORAGE_KEY, serializeDraft(draft))
}

export function readRestorableDraft(storage: StorageLike, notes: Note[]): NoteDraft | null {
  const result = parseDraft(storage.getItem(DRAFT_STORAGE_KEY))
  if (!result.ok || !result.value) return null
  return isDraftRestorable(result.value.draft, notes) ? result.value.draft : null
}

export function clearDraft(storage: StorageLike): void {
  storage.removeItem(DRAFT_STORAGE_KEY)
}

export function applyExternalNotesValue(
  storage: StorageLike,
  rawValue: string | null,
  activeNoteId: NoteId | null,
  store: NotesStorePort,
): { externalDeletionId: NoteId | null, isValid: boolean } {
  const result = parseNotes(rawValue)
  if (!result.ok) return { externalDeletionId: null, isValid: false }
  const previousIds = new Set(store.notes.map(note => note.id))
  const nextIds = new Set(result.value.notes.map(note => note.id))
  const isActiveNoteRemoved = activeNoteId !== null && previousIds.has(activeNoteId) && !nextIds.has(activeNoteId)
  store.hydrate(result.value.notes)
  const externalDeletionId = isActiveNoteRemoved ? activeNoteId : null
  if (externalDeletionId) {
    store.setExternalDeletion(externalDeletionId)
    const draftResult = parseDraft(storage.getItem(DRAFT_STORAGE_KEY))
    if (draftResult.ok && draftResult.value?.draft.noteId === externalDeletionId) clearDraft(storage)
  }
  return { externalDeletionId, isValid: true }
}
