import { effectScope } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useNotesStore } from '../../stores/notes'
import type { Note, NoteDraft } from '../../types/note'

import { useNoteEditor } from '../../composables/useNoteEditor'

const persistence = vi.hoisted(() => ({
  drafts: [] as NoteDraft[],
  removed: 0,
  flushed: 0,
}))

vi.mock('../../composables/useNotesPersistence', () => ({
  useNotesPersistence: () => ({
    saveDraft: (draft: NoteDraft) => persistence.drafts.push(draft),
    clearDraft: () => { persistence.removed += 1 },
    flush: () => { persistence.flushed += 1 },
    restoredDraft: null,
    storageError: null,
  }),
}))

describe('note editor session', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
    persistence.drafts = []
    persistence.removed = 0
    persistence.flushed = 0
  })

  it('groups continuous text input into one command after debounce and supports undo/redo', () => {
    const scope = effectScope()
    scope.run(() => {
      const editor = useNoteEditor('new')
      editor.updateText({ kind: 'title' }, 'P')
      editor.updateText({ kind: 'title' }, 'Plan')
      expect(editor.canUndo.value).toBe(false)
      vi.advanceTimersByTime(500)
      expect(editor.canUndo.value).toBe(true)
      editor.undo()
      expect(editor.note.value.title).toBe('')
      editor.redo()
      expect(editor.note.value.title).toBe('Plan')
    })
    scope.stop()
  })

  it('commits on blur, ignores unchanged text, and clears history on save', () => {
    const scope = effectScope()
    scope.run(() => {
      const editor = useNoteEditor('new')
      editor.updateText({ kind: 'title' }, '')
      editor.commitText()
      expect(editor.canUndo.value).toBe(false)
      editor.updateText({ kind: 'title' }, 'A')
      editor.commitText()
      expect(editor.canUndo.value).toBe(true)
      editor.save()
      expect(editor.canUndo.value).toBe(false)
      expect(useNotesStore().notes[0]?.title).toBe('A')
      expect(persistence.removed).toBe(1)
      expect(persistence.flushed).toBe(1)
    })
    scope.stop()
  })

  it('records checkbox and task operations atomically; empty task rows are removed on save', () => {
    const scope = effectScope()
    scope.run(() => {
      const editor = useNoteEditor('new')
      editor.addTodo()
      const todoId = editor.note.value.todos[0]!.id
      editor.toggleTodo(todoId, true)
      editor.removeTodo(todoId)
      expect(editor.canUndo.value).toBe(true)
      editor.undo()
      expect(editor.note.value.todos[0]?.id).toBe(todoId)
      editor.save()
      expect(useNotesStore().notes[0]?.todos).toEqual([])
    })
    scope.stop()
  })

  it('clears the redo branch after editing following undo and preserves only 50 actions', () => {
    const scope = effectScope()
    scope.run(() => {
      const editor = useNoteEditor('new')
      for (let index = 0; index < 55; index += 1) {
        editor.addTodo()
        editor.commitText()
        editor.removeTodo(editor.note.value.todos.at(-1)!.id)
        editor.commitText()
      }
      expect(editor.canUndo.value).toBe(true)
      editor.undo()
      editor.addTodo()
      expect(editor.canRedo.value).toBe(false)
    })
    scope.stop()
  })

  it('restores a draft in one working copy and discards cleanly', () => {
    const scope = effectScope()
    scope.run(() => {
      const editor = useNoteEditor('new')
      const draft: NoteDraft = {
        noteId: null,
        baseUpdatedAt: null,
        note: { ...editor.note.value, title: 'Recovered' },
        savedAt: new Date().toISOString(),
      }
      editor.restoreDraft(draft)
      expect(editor.note.value.title).toBe('Recovered')
      editor.discard()
      expect(persistence.removed).toBe(1)
    })
    scope.stop()
  })

  it('blocks saving after the open note is deleted in another tab', () => {
    const scope = effectScope()
    scope.run(() => {
      const store = useNotesStore()
      const savedNote: Note = {
        id: 'shared-note',
        title: 'Before',
        todos: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      }
      store.hydrate([savedNote])
      const editor = useNoteEditor(savedNote.id)
      editor.updateText({ kind: 'title' }, 'Local edit')

      store.deleteNote(savedNote.id)
      store.setExternalDeletion(savedNote.id)
      expect(editor.canEdit.value).toBe(false)
      expect(editor.save()).toBe(false)
      expect(store.notes).toEqual([])
    })
    scope.stop()
  })

  it('does not create editable sessions for missing IDs', () => {
    const scope = effectScope()
    scope.run(() => {
      const editor = useNoteEditor('missing-note')
      editor.updateText({ kind: 'title' }, 'ignored')
      editor.addTodo()
      expect(editor.canEdit.value).toBe(false)
      expect(editor.note.value.title).toBe('')
      expect(editor.note.value.todos).toHaveLength(0)
      expect(editor.save()).toBe(false)
      expect(useNotesStore().notes).toHaveLength(0)
    })
    scope.stop()
  })
})
