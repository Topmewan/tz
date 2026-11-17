import type { EditorTarget, Note, TodoItem } from './note'

export interface TextEditDelta {
  kind: 'text'
  target: EditorTarget
  before: string
  after: string
}

export interface TodoAddedDelta {
  kind: 'todo-added'
  index: number
  todo: TodoItem
}

export interface TodoRemovedDelta {
  kind: 'todo-removed'
  index: number
  todo: TodoItem
}

export interface TodoCompletionDelta {
  kind: 'todo-completion'
  todoId: string
  before: boolean
  after: boolean
}

export type EditorCommand = TextEditDelta | TodoAddedDelta | TodoRemovedDelta | TodoCompletionDelta

export interface CommandHistory {
  undoStack: EditorCommand[]
  redoStack: EditorCommand[]
  limit: number
}

export interface HistoryResult {
  note: Note
  history: CommandHistory
}
