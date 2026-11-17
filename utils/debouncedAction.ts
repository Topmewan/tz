export interface DebouncedAction {
  schedule: () => void
  flush: () => void
  cancel: () => void
}

export function createDebouncedAction(action: () => void, delayMs: number): DebouncedAction {
  let timer: ReturnType<typeof setTimeout> | undefined

  function cancel(): void {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
  }

  function flush(): void {
    if (timer === undefined) return
    cancel()
    action()
  }

  function schedule(): void {
    cancel()
    timer = setTimeout(flush, delayMs)
  }

  return { schedule, flush, cancel }
}
