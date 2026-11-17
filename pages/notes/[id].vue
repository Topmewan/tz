<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '../../components/ui/BaseButton.vue'
import ConfirmDialog from '../../components/ui/ConfirmDialog.vue'
import EmptyState from '../../components/ui/EmptyState.vue'
import EditorToolbar from '../../components/notes/EditorToolbar.vue'
import NoteEditor from '../../components/notes/NoteEditor.vue'
import { useEditorDialogs } from '../../composables/useEditorDialogs'
import { useEditorShortcuts } from '../../composables/useEditorShortcuts'
import { useNoteEditor } from '../../composables/useNoteEditor'
import { useNotesPersistence } from '../../composables/useNotesPersistence'
import { useNotesStore } from '../../stores/notes'

const route = useRoute()
const router = useRouter()
const store = useNotesStore()
const persistence = useNotesPersistence()
const noteId = computed(() => String(route.params.id ?? ''))
const isNew = computed(() => noteId.value === 'new')
const existingNote = computed(() => store.findNote(noteId.value))
const isFound = computed(() => isNew.value || Boolean(existingNote.value))
const candidateDraft = computed(() => {
  const draft = persistence.restoredDraft
  if (!draft) return null
  if (isNew.value && draft.noteId === null) return draft
  if (!isNew.value && draft.noteId === noteId.value) return draft
  return null
})
const conflictingDraft = computed(() => {
  const draft = persistence.conflictingDraft
  if (!draft) return null
  if (isNew.value && draft.noteId === null) return draft
  if (!isNew.value && draft.noteId === noteId.value) return draft
  return null
})
const editor = useNoteEditor(noteId.value, null)
const hasRemovedEmptyTodos = ref(false)
const dialogs = useEditorDialogs({
  noteId,
  isFound,
  isDirty: editor.isDirty,
  externalDeletionId: computed(() => store.externalDeletionId),
  candidateDraft,
  editor,
  goToList: () => { void router.push('/') },
  deleteNote: () => {
    store.deleteNote(noteId.value)
    persistence.clearDraft()
    persistence.flush()
  },
  clearDraft: persistence.clearDraft,
})

function saveNote(): void {
  hasRemovedEmptyTodos.value = editor.hasEmptyTodos.value
  if (!editor.save()) { void router.push('/'); return }
  if (hasRemovedEmptyTodos.value) void router.push({ path: '/', query: { notice: 'empty-todos' } })
  else void router.push('/')
}

function onTitleInput(value: string): void {
  editor.updateText({ kind: 'title' }, value)
}

function onTextInput(payload: { todoId: string, value: string }): void {
  editor.updateText({ kind: 'todoText', todoId: payload.todoId }, payload.value)
}

function onToggle(payload: { todoId: string, isCompleted: boolean }): void {
  editor.toggleTodo(payload.todoId, payload.isCompleted)
}

useEditorShortcuts({ undo: editor.undo, redo: editor.redo }, isFound)
</script>

<template>
  <main class="editor-page">
    <header class="editor-page__top">
      <BaseButton
        variant="ghost"
        @click="dialogs.backToList"
      >
        ← Все заметки
      </BaseButton>
      <span class="editor-page__hint">Автосохранение черновика включено</span>
    </header>
    <p
      v-if="conflictingDraft && !dialogs.isConflictDismissed.value"
      class="editor-page__conflict"
      role="alert"
    >
      Черновик относится к устаревшей версии заметки и не может быть восстановлен.
      <BaseButton
        variant="secondary"
        @click="dialogs.discardConflict"
      >
        Удалить черновик
      </BaseButton>
    </p>
    <section
      v-if="!isFound"
      class="editor-page__missing"
    >
      <EmptyState
        title="Заметка не найдена"
        description="Возможно, её уже удалили или ссылка устарела."
      >
        <BaseButton
          variant="primary"
          @click="dialogs.backToList"
        >
          Вернуться к заметкам
        </BaseButton>
      </EmptyState>
    </section>
    <section
      v-else
      class="editor-page__content"
    >
      <EditorToolbar
        :can-undo="editor.canUndo.value"
        :can-redo="editor.canRedo.value"
        :is-dirty="editor.isDirty.value && editor.canEdit.value"
        @undo="editor.undo"
        @redo="editor.redo"
        @save="saveNote"
        @cancel="dialogs.requestCancel"
        @remove="dialogs.requestDelete"
      />
      <p
        v-if="hasRemovedEmptyTodos"
        class="editor-page__notice"
        role="status"
      >
        Пустые пункты удалены при сохранении.
      </p>
      <NoteEditor
        :note="editor.note.value"
        :is-new="isNew"
        @title-input="onTitleInput"
        @text-input="onTextInput"
        @text-commit="editor.commitText"
        @toggle="onToggle"
        @remove="editor.removeTodo"
        @add="editor.addTodo"
      />
    </section>
    <ConfirmDialog
      v-model="dialogs.isOpen.value"
      :title="dialogs.config.value.title"
      :message="dialogs.config.value.message"
      :confirm-label="dialogs.config.value.confirmLabel"
      :danger="dialogs.config.value.danger"
      @confirm="dialogs.confirm"
      @cancel="dialogs.dismiss"
      @update:model-value="dialogs.onModelUpdate"
    />
  </main>
</template>

<style scoped lang="scss">
@use '~/assets/scss/tokens' as *;
.editor-page {
  width: min(100% - #{$space-8}, $content-width);
  min-height: $viewport-height;
  margin-inline: auto;
  padding-block: $space-4 $space-8;
}
.editor-page__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
  margin-bottom: $space-6;
}
.editor-page__hint {
  color: $color-muted;
  font-size: $font-small;
}
.editor-page__content {
  display: grid;
  gap: $space-6;
}
.editor-page__missing {
  padding-top: $space-8;
}
.editor-page__conflict {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: $space-3;
  margin: 0 0 $space-5;
  padding: $space-3;
  border-radius: $radius-control;
  background: $color-soft;
  color: $color-ink;
}
.editor-page__notice {
  margin: 0;
  padding: $space-3;
  border-radius: $radius-control;
  background: $color-soft;
  color: $color-accent;
}
</style>
