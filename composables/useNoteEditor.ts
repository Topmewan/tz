import { computed, onScopeDispose, ref, type Ref } from 'vue'
import { useNotesStore } from '../stores/notes'
import type { EditorCommand } from '../types/history'
import type { EditorTarget, Note, NoteDraft, TodoItem } from '../types/note'
import { applyCommand, createHistory, recordApplied, redo as redoHistory, textCommand, todoAddedCommand, todoRemovedCommand, undo as undoHistory } from '../utils/history/commandHistory'
import { useNotesPersistence } from './useNotesPersistence'

export interface NoteEditor {
  note: Ref<Note>
  canUndo: Readonly<Ref<boolean>>
  canRedo: Readonly<Ref<boolean>>
  canEdit: Readonly<Ref<boolean>>
  isDirty: Readonly<Ref<boolean>>
  updateText: (target: EditorTarget, value: string) => void
  commitText: () => void
  addTodo: () => void
  removeTodo: (todoId: string) => void
  toggleTodo: (todoId: string, isCompleted: boolean) => void
  undo: () => void
  redo: () => void
  save: () => boolean
  discard: () => void
  hasEmptyTodos: Readonly<Ref<boolean>>
  restoreDraft: (draft: NoteDraft) => void
}

interface PendingText {
  target: EditorTarget
  before: string
}

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `note-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function sameTarget(left: EditorTarget, right: EditorTarget): boolean {
  return left.kind === right.kind && (left.kind === 'title' || (right.kind === 'todoText' && left.todoId === right.todoId))
}

function setText(note: Note, target: EditorTarget, value: string): Note {
  if (target.kind === 'title') return { ...note, title: value }
  return { ...note, todos: note.todos.map(todo => todo.id === target.todoId ? { ...todo, text: value } : todo) }
}

function copyNote(note: Note): Note {
  return { ...note, todos: note.todos.map(todo => ({ ...todo })) }
}

export function useNoteEditor(noteId: string, recoveredDraft: NoteDraft | null = null): NoteEditor {
  const store = useNotesStore()
  const persistence = useNotesPersistence()
  const original = store.findNote(noteId)
  const isNew = noteId === 'new'
  const base: Note = isNew
    ? { id: createId(), title: '', todos: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    : original ?? { id: noteId, title: '', todos: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  const initialNote = recoveredDraft ? copyNote(recoveredDraft.note) : copyNote(base)
  const note = ref<Note>(initialNote)
  const baseline = ref(JSON.stringify(initialNote))
  const history = ref(createHistory())
  const pending = ref<PendingText | null>(null)
  let pendingTimer: ReturnType<typeof setTimeout> | undefined
  const canEdit = computed(() => isNew || Boolean(store.findNote(noteId)))
  const canUndo = computed(() => history.value.undoStack.length > 0)
  const canRedo = computed(() => history.value.redoStack.length > 0)
  const isDirty = computed(() => JSON.stringify(note.value) !== baseline.value)
  const hasEmptyTodos = computed(() => note.value.todos.some(todo => !todo.text.trim()))

  function saveCurrentDraft(): void {
    persistence.saveDraft({
      noteId: isNew ? null : noteId,
      baseUpdatedAt: original?.updatedAt ?? null,
      note: copyNote(note.value),
      savedAt: new Date().toISOString(),
    })
  }

  function commitText(): void {
    if (pendingTimer) clearTimeout(pendingTimer)
    pendingTimer = undefined
    if (!pending.value) return
    const command = textCommand(pending.value.target, pending.value.before, getText(note.value, pending.value.target))
    if (command) history.value = recordApplied(history.value, command)
    pending.value = null
  }

  function getText(current: Note, target: EditorTarget): string {
    if (target.kind === 'title') return current.title
    return current.todos.find(todo => todo.id === target.todoId)?.text ?? ''
  }

  function updateText(target: EditorTarget, value: string): void {
    if (!canEdit.value) return
    if (pending.value && !sameTarget(pending.value.target, target)) commitText()
    if (!pending.value) pending.value = { target, before: getText(note.value, target) }
    note.value = setText(note.value, target, value)
    if (pendingTimer) clearTimeout(pendingTimer)
    pendingTimer = setTimeout(commitText, 500)
    saveCurrentDraft()
  }

  function applyAndRecord(command: EditorCommand): void {
    commitText()
    note.value = applyCommand(note.value, command)
    history.value = recordApplied(history.value, command)
    saveCurrentDraft()
  }

  function addTodo(): void {
    if (!canEdit.value) return
    commitText()
    const todo: TodoItem = { id: createId(), text: '', isCompleted: false }
    const index = note.value.todos.length
    note.value = { ...note.value, todos: [...note.value.todos, todo] }
    history.value = recordApplied(history.value, todoAddedCommand(index, todo))
    saveCurrentDraft()
  }

  function removeTodo(todoId: string): void {
    if (!canEdit.value) return
    commitText()
    const index = note.value.todos.findIndex(todo => todo.id === todoId)
    const todo = note.value.todos[index]
    if (index < 0 || !todo) return
    note.value = { ...note.value, todos: note.value.todos.filter(item => item.id !== todoId) }
    history.value = recordApplied(history.value, todoRemovedCommand(index, todo))
    saveCurrentDraft()
  }

  function toggleTodo(todoId: string, isCompleted: boolean): void {
    if (!canEdit.value) return
    const todo = note.value.todos.find(item => item.id === todoId)
    if (!todo || todo.isCompleted === isCompleted) return
    applyAndRecord({ kind: 'todo-completion', todoId, before: todo.isCompleted, after: isCompleted })
  }

  function undo(): void {
    if (!canEdit.value) return
    commitText()
    const result = undoHistory(note.value, history.value)
    note.value = result.note
    history.value = result.history
    saveCurrentDraft()
  }

  function redo(): void {
    if (!canEdit.value) return
    commitText()
    const result = redoHistory(note.value, history.value)
    note.value = result.note
    history.value = result.history
    saveCurrentDraft()
  }

  function resetHistory(): void {
    history.value = createHistory()
    pending.value = null
    if (pendingTimer) clearTimeout(pendingTimer)
    pendingTimer = undefined
  }

  function save(): boolean {
    if (!canEdit.value) return false
    commitText()
    const now = new Date().toISOString()
    const cleanedTodos = note.value.todos.filter(todo => todo.text.trim()).map(todo => ({ ...todo, text: todo.text.trim() }))
    const savedNote: Note = {
      ...note.value,
      title: note.value.title.trim(),
      todos: cleanedTodos,
      createdAt: original?.createdAt ?? note.value.createdAt,
      updatedAt: now,
    }
    store.upsertNote(savedNote)
    note.value = copyNote(savedNote)
    baseline.value = JSON.stringify(savedNote)
    persistence.flush()
    persistence.clearDraft()
    resetHistory()
    return true
  }

  function restoreDraft(draft: NoteDraft): void {
    if (!canEdit.value) return
    note.value = copyNote(draft.note)
    baseline.value = JSON.stringify(original ?? base)
    history.value = createHistory()
  }

  function discard(): void {
    if (!canEdit.value) return
    persistence.clearDraft()
    resetHistory()
    if (original) note.value = copyNote(original)
  }

  onScopeDispose(() => {
    if (pendingTimer) clearTimeout(pendingTimer)
  })

  return { note, canUndo, canRedo, canEdit, isDirty, updateText, commitText, addTodo, removeTodo, toggleTodo, undo, redo, save, discard, hasEmptyTodos, restoreDraft }
}
