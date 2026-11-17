import { describe, expect, it } from 'vitest'
import type { Note, NoteDraft } from '../../types/note'
import { isDraftRestorable, parseDraft, parseNotes, serializeDraft, serializeNotes } from '../../utils/storage/noteStorage'

const note: Note = {
  id: 'n1',
  title: '',
  todos: [{ id: 't1', text: '', isCompleted: false }],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
}

describe('versioned storage formats', () => {
  it('round trips empty titles and task text with schemaVersion', () => {
    const serialized = serializeNotes([note])
    expect(JSON.parse(serialized)).toMatchObject({ schemaVersion: 1, notes: [{ title: '', todos: [{ text: '' }] }] })
    const result = parseNotes(serialized)
    expect(result.ok && result.value.notes).toEqual([note])
  })

  it('accepts a missing notes value as an empty first run', () => {
    expect(parseNotes(null)).toMatchObject({ ok: true, value: { schemaVersion: 1, notes: [] } })
  })

  it('rejects malformed JSON, invalid schema, and unknown versions', () => {
    expect(parseNotes('{')).toEqual({ ok: false, reason: 'invalid-json' })
    expect(parseNotes(JSON.stringify({ schemaVersion: 1, notes: ['bad'], savedAt: 'now' }))).toEqual({ ok: false, reason: 'invalid-schema' })
    expect(parseNotes(JSON.stringify({ schemaVersion: 7, notes: [], savedAt: 'now' }))).toEqual({ ok: false, reason: 'unsupported-version' })
    expect(parseDraft(JSON.stringify({ schemaVersion: 8, draft: {} }))).toEqual({ ok: false, reason: 'unsupported-version' })
  })

  it('round trips and verifies a draft against the source note revision', () => {
    const draft: NoteDraft = { noteId: 'n1', baseUpdatedAt: note.updatedAt, note, savedAt: '2026-01-03T00:00:00.000Z' }
    const result = parseDraft(serializeDraft(draft))
    expect(result).toMatchObject({ ok: true, value: { schemaVersion: 1, draft } })
    expect(isDraftRestorable(draft, [note])).toBe(true)
    expect(isDraftRestorable(draft, [{ ...note, updatedAt: 'new-version' }])).toBe(false)
    expect(isDraftRestorable({ ...draft, noteId: null, baseUpdatedAt: null }, [])).toBe(true)
  })
})
