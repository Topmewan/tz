import type { Note, NoteDraft, TodoItem } from '../../types/note'
import type { ParseResult, PersistedDraftV1, PersistedNotesV1 } from '../../types/storage'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isTodo(value: unknown): value is TodoItem {
  return isObject(value) && typeof value.id === 'string' && typeof value.text === 'string' && typeof value.isCompleted === 'boolean'
}

export function isNote(value: unknown): value is Note {
  return isObject(value)
    && typeof value.id === 'string'
    && typeof value.title === 'string'
    && Array.isArray(value.todos)
    && value.todos.every(isTodo)
    && typeof value.createdAt === 'string'
    && typeof value.updatedAt === 'string'
}

export function parseNotes(raw: string | null): ParseResult<PersistedNotesV1> {
  if (raw === null) return { ok: true, value: { schemaVersion: 1, notes: [], savedAt: new Date(0).toISOString() } }
  let parsed: unknown
  try { parsed = JSON.parse(raw) as unknown }
  catch { return { ok: false, reason: 'invalid-json' } }
  if (!isObject(parsed) || !Array.isArray(parsed.notes)) return { ok: false, reason: 'invalid-schema' }
  if (parsed.schemaVersion !== 1) return { ok: false, reason: 'unsupported-version' }
  if (!parsed.notes.every(isNote) || typeof parsed.savedAt !== 'string') return { ok: false, reason: 'invalid-schema' }
  return { ok: true, value: parsed as unknown as PersistedNotesV1 }
}

export function isDraft(value: unknown): value is NoteDraft {
  return isObject(value)
    && (value.noteId === null || typeof value.noteId === 'string')
    && (value.baseUpdatedAt === null || typeof value.baseUpdatedAt === 'string')
    && isNote(value.note)
    && typeof value.savedAt === 'string'
}

export function parseDraft(raw: string | null): ParseResult<PersistedDraftV1 | null> {
  if (raw === null) return { ok: true, value: null }
  let parsed: unknown
  try { parsed = JSON.parse(raw) as unknown }
  catch { return { ok: false, reason: 'invalid-json' } }
  if (!isObject(parsed) || !('schemaVersion' in parsed)) return { ok: false, reason: 'invalid-schema' }
  if (parsed.schemaVersion !== 1) return { ok: false, reason: 'unsupported-version' }
  if (!isDraft(parsed.draft)) return { ok: false, reason: 'invalid-schema' }
  return { ok: true, value: parsed as unknown as PersistedDraftV1 }
}

export function serializeNotes(notes: Note[], savedAt = new Date().toISOString()): string {
  return JSON.stringify({ schemaVersion: 1, notes, savedAt } satisfies PersistedNotesV1)
}

export function serializeDraft(draft: NoteDraft): string {
  return JSON.stringify({ schemaVersion: 1, draft } satisfies PersistedDraftV1)
}

export function isDraftRestorable(draft: NoteDraft, notes: Note[]): boolean {
  if (draft.noteId === null) return true
  return notes.some(note => note.id === draft.noteId && note.updatedAt === draft.baseUpdatedAt)
}
