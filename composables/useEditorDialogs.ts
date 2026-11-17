import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import type { NoteDraft } from '../types/note'

type DialogKind = 'cancel' | 'delete' | 'restore' | 'external' | null

interface DialogCopy {
  title: string
  message: string
  confirmLabel: string
  danger: boolean
}

const DIALOG_COPY: Record<Exclude<DialogKind, null>, DialogCopy> = {
  cancel: { title: 'Отменить редактирование?', message: 'Несохранённые изменения будут потеряны.', confirmLabel: 'Отменить', danger: true },
  delete: { title: 'Удалить заметку?', message: 'Заметка будет удалена без возможности восстановления.', confirmLabel: 'Удалить', danger: true },
  restore: { title: 'Найден черновик', message: 'Восстановить незавершённые изменения из черновика?', confirmLabel: 'Восстановить', danger: false },
  external: { title: 'Заметка удалена в другой вкладке', message: 'Эта заметка была удалена в другой вкладке. Редактирование завершено.', confirmLabel: 'К списку', danger: false },
}

interface EditorSession {
  discard: () => void
  restoreDraft: (draft: NoteDraft) => void
}

export interface EditorDialogs {
  isOpen: Ref<boolean>
  config: ComputedRef<DialogCopy>
  isConflictDismissed: Ref<boolean>
  backToList: () => void
  requestCancel: () => void
  requestDelete: () => void
  confirm: () => void
  dismiss: () => void
  onModelUpdate: (isVisible: boolean) => void
  discardConflict: () => void
}

export interface EditorDialogsOptions {
  noteId: Readonly<Ref<string>>
  isFound: Readonly<Ref<boolean>>
  isDirty: Readonly<Ref<boolean>>
  externalDeletionId: Readonly<Ref<string | null>>
  candidateDraft: Readonly<Ref<NoteDraft | null>>
  editor: EditorSession
  goToList: () => void
  deleteNote: () => void
  clearDraft: () => void
}

export function useEditorDialogs(options: EditorDialogsOptions): EditorDialogs {
  const isOpen = ref(false)
  const kind = ref<DialogKind>(null)
  const isConflictDismissed = ref(false)
  const config = computed(() => DIALOG_COPY[kind.value ?? 'cancel'])

  function show(dialogKind: Exclude<DialogKind, null>): void {
    kind.value = dialogKind
    isOpen.value = true
  }

  function backToList(): void {
    if (!options.isFound.value) {
      options.goToList()
      return
    }
    requestCancel()
  }

  function requestCancel(): void {
    if (options.isDirty.value) show('cancel')
    else {
      options.editor.discard()
      options.goToList()
    }
  }

  function requestDelete(): void { show('delete') }

  function confirm(): void {
    const activeKind = kind.value
    if (activeKind === 'cancel') {
      options.editor.discard()
      options.goToList()
    }
    else if (activeKind === 'delete') {
      options.deleteNote()
      options.goToList()
    }
    else if (activeKind === 'restore') {
      const draft = options.candidateDraft.value
      if (draft) options.editor.restoreDraft(draft)
    }
    else if (activeKind === 'external') options.goToList()
    kind.value = null
    isOpen.value = false
  }

  function close(): void {
    const closedKind = kind.value
    kind.value = null
    isOpen.value = false
    if (closedKind === 'restore') options.clearDraft()
    if (closedKind === 'external') options.goToList()
  }

  function dismiss(): void { close() }

  function onModelUpdate(isVisible: boolean): void {
    if (!isVisible) close()
  }

  function discardConflict(): void {
    options.clearDraft()
    isConflictDismissed.value = true
  }

  watch(options.externalDeletionId, (id) => {
    if (id && id === options.noteId.value) show('external')
  })
  watch(options.candidateDraft, (draft) => {
    if (draft) show('restore')
  }, { immediate: true })

  return {
    isOpen, config, isConflictDismissed, backToList, requestCancel, requestDelete, confirm,
    dismiss, onModelUpdate, discardConflict,
  }
}
