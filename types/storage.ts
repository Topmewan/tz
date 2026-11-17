import type { Note, NoteDraft } from './note'

export interface PersistedNotesV1 {
  schemaVersion: 1
  notes: Note[]
  savedAt: string
}

export interface PersistedDraftV1 {
  schemaVersion: 1
  draft: NoteDraft
}

export type ParseResult<T>
  = | { ok: true, value: T }
    | { ok: false, reason: 'invalid-json' | 'invalid-schema' | 'unsupported-version' }
