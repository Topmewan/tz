import { describe, expect, it } from 'vitest'
import type { Note } from '../../types/note'
import { applyCommand, createHistory, recordApplied, redo, textCommand, todoAddedCommand, todoRemovedCommand, undo } from '../../utils/history/commandHistory'

const baseNote = (): Note => ({
  id: 'n-1',
  title: 'Plan',
  todos: [
    { id: 'a', text: 'first', isCompleted: false },
    { id: 'b', text: 'second', isCompleted: true },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

describe('commandHistory', () => {
  it('applies and reverses a text delta without storing a Note snapshot', () => {
    const command = textCommand({ kind: 'title' }, 'Plan', 'Updated')
    expect(command).not.toBeNull()
    const next = applyCommand(baseNote(), command!)
    expect(next.title).toBe('Updated')
    expect(applyCommand(next, command!, true).title).toBe('Plan')
    expect(Object.keys(command!)).toEqual(['kind', 'target', 'before', 'after'])
    expect(command).not.toHaveProperty('note')
  })

  it('undoes and redoes task completion, insertion, and removal in the original order', () => {
    const original = baseNote()
    const toggled = applyCommand(original, { kind: 'todo-completion', todoId: 'a', before: false, after: true })
    expect(toggled.todos[0]?.isCompleted).toBe(true)
    expect(applyCommand(toggled, { kind: 'todo-completion', todoId: 'a', before: false, after: true }, true).todos[0]?.isCompleted).toBe(false)

    const added = { id: 'c', text: 'third', isCompleted: false }
    const afterInsert = applyCommand(original, todoAddedCommand(1, added))
    expect(afterInsert.todos.map(todo => todo.id)).toEqual(['a', 'c', 'b'])
    expect(applyCommand(afterInsert, todoAddedCommand(1, added), true).todos.map(todo => todo.id)).toEqual(['a', 'b'])

    const removed = original.todos[0]!
    const removeCommand = todoRemovedCommand(0, removed)
    const afterRemove = applyCommand(original, removeCommand)
    expect(afterRemove.todos.map(todo => todo.id)).toEqual(['b'])
    expect(applyCommand(afterRemove, removeCommand, true).todos.map(todo => todo.id)).toEqual(['a', 'b'])
  })

  it('clears the redo branch after a new operation', () => {
    const first = textCommand({ kind: 'title' }, 'Plan', 'A')!
    const second = textCommand({ kind: 'title' }, 'A', 'B')!
    let history = recordApplied(createHistory(), first)
    history = recordApplied(history, second)
    const undone = undo(baseNote(), history)
    const branch = recordApplied(undone.history, textCommand({ kind: 'title' }, 'Plan', 'C')!)
    expect(branch.redoStack).toHaveLength(0)
  })

  it('keeps only the newest 50 operations', () => {
    let history = createHistory()
    for (let index = 0; index < 51; index += 1) {
      history = recordApplied(history, { kind: 'todo-completion', todoId: String(index), before: false, after: true })
    }
    expect(history.undoStack).toHaveLength(50)
    expect(history.undoStack[0]).toMatchObject({ todoId: '1' })
  })

  it('does not change the note when undo and redo stacks are empty', () => {
    const note = baseNote()
    const history = createHistory()
    expect(undo(note, history)).toEqual({ note, history })
    expect(redo(note, history)).toEqual({ note, history })
  })
})
