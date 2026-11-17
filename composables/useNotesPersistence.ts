import { useNotesStore } from '../stores/notes'
import type { PersistenceLifecycle, StorageChange } from '../utils/storage/persistenceLifecycle'
import { createPersistenceLifecycle } from '../utils/storage/persistenceLifecycle'
import type { StorageLike } from '../utils/storage/persistence'
import type { NoteId } from '../types/note'

let persistenceInstance: PersistenceLifecycle | null = null

export function useNotesPersistence(): PersistenceLifecycle {
  if (persistenceInstance) return persistenceInstance
  const store = useNotesStore()
  const storage = window.localStorage as StorageLike
  let storageListener: ((event: StorageEvent) => void) | null = null
  const eventTarget = {
    addStorageListener: (listener: (event: StorageChange) => void): void => {
      storageListener = (event: StorageEvent): void => listener(event)
      window.addEventListener('storage', storageListener)
    },
    removeStorageListener: (listener: (event: StorageChange) => void): void => {
      if (!storageListener) return
      window.removeEventListener('storage', storageListener)
      storageListener = null
    },
    addPageHideListener: (listener: () => void): void => window.addEventListener('pagehide', listener),
    removePageHideListener: (listener: () => void): void => window.removeEventListener('pagehide', listener),
    getActiveNoteId: (): NoteId | null => {
      const routeParts = window.location.pathname.split('/').filter(Boolean)
      return routeParts[0] === 'notes' && routeParts[1] !== 'new' ? routeParts[1] ?? null : null
    },
  }
  const lifecycle = createPersistenceLifecycle(
    store,
    storage,
    (onChange) => store.$subscribe((_mutation, state) => {
      if (state.hasHydrated) onChange()
    }, { detached: true }),
    eventTarget,
  )
  persistenceInstance = {
    ...lifecycle,
    dispose: () => {
      lifecycle.dispose()
      persistenceInstance = null
    },
  }
  return persistenceInstance
}
