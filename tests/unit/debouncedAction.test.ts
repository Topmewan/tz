import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDebouncedAction } from '../../utils/debouncedAction'

describe('debounced persistence scheduler', () => {
  afterEach(() => vi.useRealTimers())

  it('writes only after the debounce pause', () => {
    vi.useFakeTimers()
    const write = vi.fn()
    const scheduler = createDebouncedAction(write, 300)
    scheduler.schedule()
    scheduler.schedule()
    vi.advanceTimersByTime(299)
    expect(write).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(write).toHaveBeenCalledTimes(1)
  })

  it('flushes a pending write immediately and does not write twice', () => {
    vi.useFakeTimers()
    const write = vi.fn()
    const scheduler = createDebouncedAction(write, 500)
    scheduler.schedule()
    scheduler.flush()
    vi.advanceTimersByTime(500)
    expect(write).toHaveBeenCalledTimes(1)
  })

  it('cancels pending work for a cross-tab deletion', () => {
    vi.useFakeTimers()
    const write = vi.fn()
    const scheduler = createDebouncedAction(write, 300)
    scheduler.schedule()
    scheduler.cancel()
    vi.advanceTimersByTime(300)
    expect(write).not.toHaveBeenCalled()
  })
})
