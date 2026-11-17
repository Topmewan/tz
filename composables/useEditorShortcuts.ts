import { onScopeDispose, onMounted, type Ref } from 'vue'

export interface EditorShortcutActions {
  undo: () => void
  redo: () => void
}

export interface ShortcutTarget {
  tagName: string
  isContentEditable: boolean
  getAttribute: (name: string) => string | null
}

export function isNativeTextControl(target: ShortcutTarget | null): boolean {
  if (!target) return false
  const tagName = target.tagName.toLowerCase()
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select'
    || target.isContentEditable || target.getAttribute('role') === 'textbox'
}

export function useEditorShortcuts(actions: EditorShortcutActions, isActive: Readonly<Ref<boolean>>): void {
  function onKeydown(event: KeyboardEvent): void {
    if (!isActive.value || !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return
    if (!(event.target instanceof HTMLElement) || isNativeTextControl(event.target)) return
    event.preventDefault()
    if (event.shiftKey) actions.redo()
    else actions.undo()
  }
  onMounted(() => {
    if (isActive.value) window.addEventListener('keydown', onKeydown)
  })
  onScopeDispose(() => window.removeEventListener('keydown', onKeydown))
}
