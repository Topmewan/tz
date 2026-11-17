import { onMounted, onScopeDispose, watch, type Ref } from 'vue'

export function useFocusTrap(isOpen: Ref<boolean>, dialog: Ref<HTMLElement | null>): void {
  let previousFocus: HTMLElement | null = null
  let previousOverflow = ''
  let isActive = false

  function isVisible(element: HTMLElement): boolean {
    if (!element.isConnected || element.closest('[hidden], [inert], [aria-hidden="true"]')) return false
    let current: HTMLElement | null = element
    while (current) {
      const style = window.getComputedStyle(current)
      if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse' || style.opacity === '0') return false
      if (current === dialog.value) break
      current = current.parentElement
    }
    return element.getClientRects().length > 0
  }

  function getFocusable(): HTMLElement[] {
    if (!dialog.value) return []
    return Array.from(dialog.value.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )).filter(isVisible)
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      isOpen.value = false
      return
    }
    if (event.key !== 'Tab') return
    const focusable = getFocusable()
    if (!focusable.length) {
      event.preventDefault()
      dialog.value?.focus()
      return
    }
    const first = focusable[0]
    const last = focusable.at(-1)
    const isFocusInside = Boolean(dialog.value?.contains(document.activeElement))
    if (!isFocusInside) {
      event.preventDefault()
      ;(event.shiftKey ? last : first)?.focus()
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  }

  function activate(): void {
    if (isActive || typeof document === 'undefined') return
    isActive = true
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    ;(getFocusable()[0] ?? dialog.value)?.focus()
    document.addEventListener('keydown', onKeydown)
  }

  function deactivate(): void {
    if (!isActive || typeof document === 'undefined') return
    isActive = false
    document.body.style.overflow = previousOverflow
    document.removeEventListener('keydown', onKeydown)
    if (previousFocus?.isConnected) previousFocus.focus()
    previousFocus = null
  }

  watch(isOpen, (isVisible) => {
    if (isVisible) activate()
    else deactivate()
  }, { flush: 'post' })

  onMounted(() => {
    if (isOpen.value) activate()
  })

  onScopeDispose(deactivate)
}
