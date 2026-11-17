import type { CommandHistory, EditorCommand } from '../../types/history'
import type { EditorTarget, Note, TodoItem } from '../../types/note'

export const HISTORY_LIMIT = 50

export function createHistory(): CommandHistory {
  return { undoStack: [], redoStack: [], limit: HISTORY_LIMIT }
}

function replaceText(note: Note, target: EditorTarget, value: string): Note {
  if (target.kind === 'title') return { ...note, title: value }
  return { ...note, todos: note.todos.map((todo) => todo.id === target.todoId ? { ...todo, text: value } : todo) }
}

export function applyCommand(note: Note, command: EditorCommand, isUndo = false): Note {
  switch (command.kind) {
    case 'text':
      return replaceText(note, command.target, isUndo ? command.before : command.after)
    case 'todo-added':
      return isUndo
        ? { ...note, todos: note.todos.filter((todo) => todo.id !== command.todo.id) }
        : { ...note, todos: [...note.todos.slice(0, command.index), command.todo, ...note.todos.slice(command.index)] }
    case 'todo-removed':
      return isUndo
        ? { ...note, todos: [...note.todos.slice(0, command.index), command.todo, ...note.todos.slice(command.index)] }
        : { ...note, todos: note.todos.filter((todo) => todo.id !== command.todo.id) }
    case 'todo-completion':
      return { ...note, todos: note.todos.map((todo) => todo.id === command.todoId ? { ...todo, isCompleted: isUndo ? command.before : command.after } : todo) }
  }
}

export function recordApplied(history: CommandHistory, command: EditorCommand): CommandHistory {
  const undoStack = [...history.undoStack, command]
  if (undoStack.length > history.limit) undoStack.shift()
  return { undoStack, redoStack: [], limit: history.limit }
}

export function undo(note: Note, history: CommandHistory): { note: Note; history: CommandHistory } {
  const command = history.undoStack.at(-1)
  if (!command) return { note, history }
  return {
    note: applyCommand(note, command, true),
    history: { ...history, undoStack: history.undoStack.slice(0, -1), redoStack: [...history.redoStack, command] },
  }
}

export function redo(note: Note, history: CommandHistory): { note: Note; history: CommandHistory } {
  const command = history.redoStack.at(-1)
  if (!command) return { note, history }
  const undoStack = [...history.undoStack, command]
  if (undoStack.length > history.limit) undoStack.shift()
  return {
    note: applyCommand(note, command),
    history: { ...history, undoStack, redoStack: history.redoStack.slice(0, -1) },
  }
}

export function textCommand(target: EditorTarget, before: string, after: string): EditorCommand | null {
  return before === after ? null : { kind: 'text', target, before, after }
}

export function todoAddedCommand(index: number, todo: TodoItem): EditorCommand {
  return { kind: 'todo-added', index, todo }
}

export function todoRemovedCommand(index: number, todo: TodoItem): EditorCommand {
  return { kind: 'todo-removed', index, todo }
}
