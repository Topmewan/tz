import type { NoteDraft, NoteId } from '../../types/note'
import { applyExternalNotesValue, clearDraft, hydrateFromStorage, persistDraft, persistNotes, type NotesStorePort, type StorageLike } from './persistence'
import { isDraftRestorable, parseDraft } from './noteStorage'
import { DRAFT_STORAGE_KEY, NOTES_STORAGE_KEY } from './storageKeys'
import { createDebouncedAction } from '../debouncedAction'

export interface PersistenceStore extends NotesStorePort {
  hasHydrated: boolean
}

export interface StorageChange {
  key: string | null
  newValue: string | null
  storageArea: StorageLike | null
}

export interface PersistenceEventTarget {
  addStorageListener: (listener: (event: StorageChange) => void) => void
  removeStorageListener: (listener: (event: StorageChange) => void) => void
  addPageHideListener: (listener: () => void) => void
  removePageHideListener: (listener: () => void) => void
  getActiveNoteId: () => NoteId | null
}

export interface PersistenceLifecycle {
  restoredDraft: NoteDraft | null
  conflictingDraft: NoteDraft | null
  storageError: string | null
  saveDraft: (draft: NoteDraft) => void
  clearDraft: () => void
  flush: () => void
  dispose: () => void
}

export function createPersistenceLifecycle(
  store: PersistenceStore,
  storage: StorageLike,
  subscribe: (onChange: () => void) => () => void,
  eventTarget: PersistenceEventTarget,
): PersistenceLifecycle {
  const hydration = hydrateFromStorage(storage)
  let storageError: string | null = null
  if (hydration.ok) store.hydrate(hydration.value)
  else {
    store.hydrate([])
    storageError = 'Не удалось прочитать сохранённые данные. Они не были перезаписаны.'
  }
  const draftResult = parseDraft(storage.getItem(DRAFT_STORAGE_KEY))
  const parsedDraft = draftResult.ok ? draftResult.value?.draft ?? null : null
  const isDraftValid = Boolean(parsedDraft && isDraftRestorable(parsedDraft, store.notes))
  const restoredDraft = isDraftValid ? parsedDraft : null
  const conflictingDraft = parsedDraft && !isDraftValid ? parsedDraft : null
  let canWriteNotes = hydration.ok
  let pendingDraft: NoteDraft | null = null

  const notesWriter = createDebouncedAction(() => {
    if (!canWriteNotes) return
    try { persistNotes(storage, store.notes) }
    catch { storageError = 'Не удалось сохранить заметки.' }
  }, 300)
  const draftWriter = createDebouncedAction(() => {
    if (!pendingDraft) return
    try { persistDraft(storage, pendingDraft) }
    catch { storageError = 'Не удалось сохранить черновик.' }
  }, 500)

  function flush(): void {
    notesWriter.cancel()
    if (!canWriteNotes) return
    try { persistNotes(storage, store.notes) }
    catch { storageError = 'Не удалось сохранить заметки.' }
  }

  const unsubscribe = subscribe(() => {
    if (canWriteNotes && store.hasHydrated) notesWriter.schedule()
  })

  function saveDraft(draft: NoteDraft): void {
    pendingDraft = draft
    draftWriter.schedule()
  }

  function removeDraft(): void {
    draftWriter.cancel()
    pendingDraft = null
    try { clearDraft(storage) }
    catch { storageError = 'Не удалось удалить черновик.' }
  }

  function onStorage(event: StorageChange): void {
    if (event.storageArea !== storage) return
    if (event.key !== NOTES_STORAGE_KEY && event.key !== null) return
    notesWriter.cancel()
    const result = applyExternalNotesValue(storage, event.newValue, eventTarget.getActiveNoteId(), store)
    if (!result.isValid) canWriteNotes = false
    if (result.externalDeletionId) {
      draftWriter.cancel()
      pendingDraft = null
    }
    else if (result.isValid) canWriteNotes = true
  }

  function onPageHide(): void {
    flush()
    draftWriter.flush()
  }

  function dispose(): void {
    onPageHide()
    unsubscribe()
    eventTarget.removeStorageListener(onStorage)
    eventTarget.removePageHideListener(onPageHide)
  }

  eventTarget.addStorageListener(onStorage)
  eventTarget.addPageHideListener(onPageHide)
  return { restoredDraft, conflictingDraft, storageError, saveDraft, clearDraft: removeDraft, flush, dispose }
}
