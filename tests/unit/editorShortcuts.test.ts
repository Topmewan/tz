import { describe, expect, it } from 'vitest'
import { isNativeTextControl, type ShortcutTarget } from '../../composables/useEditorShortcuts'

function target(tagName: string, isContentEditable = false, role: string | null = null): ShortcutTarget {
  return { tagName, isContentEditable, getAttribute: () => role }
}

describe('native undo target detection', () => {
  it.each(['input', 'textarea', 'select'])('leaves native undo enabled for %s', (tagName) => {
    expect(isNativeTextControl(target(tagName))).toBe(true)
  })

  it('leaves native undo enabled for contenteditable and textbox roles', () => {
    expect(isNativeTextControl(target('div', true))).toBe(true)
    expect(isNativeTextControl(target('div', false, 'textbox'))).toBe(true)
  })

  it('allows editor shortcuts outside native text controls', () => {
    expect(isNativeTextControl(target('button'))).toBe(false)
    expect(isNativeTextControl(null)).toBe(false)
  })
})
