export type NoteId = string
export type TodoId = string

export interface TodoItem {
  id: TodoId
  text: string
  isCompleted: boolean
}

export interface Note {
  id: NoteId
  title: string
  todos: TodoItem[]
  createdAt: string
  updatedAt: string
}

export interface NoteDraft {
  noteId: NoteId | null
  baseUpdatedAt: string | null
  note: Note
  savedAt: string
}

export type EditorTarget
  = | { kind: 'title' }
    | { kind: 'todoText', todoId: TodoId }
