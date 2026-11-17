<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '../components/ui/BaseButton.vue'
import EmptyState from '../components/ui/EmptyState.vue'
import NoteList from '../components/notes/NoteList.vue'
import ConfirmDialog from '../components/ui/ConfirmDialog.vue'
import { useNotesStore } from '../stores/notes'
import { useNotesPersistence } from '../composables/useNotesPersistence'

const store = useNotesStore()
const persistence = useNotesPersistence()
const router = useRouter()
const pendingDeleteId = ref<string | null>(null)
const route = useRoute()
const hasEmptyTodoNotice = computed(() => route.query.notice === 'empty-todos')
const isDeleteOpen = computed({
  get: () => pendingDeleteId.value !== null,
  set: (value: boolean) => { if (!value) pendingDeleteId.value = null },
})
const pendingNote = computed(() => store.findNote(pendingDeleteId.value ?? ''))
const displayTitle = computed(() => pendingNote.value?.title.trim() || 'Без названия')

function openNew(): void {
  void router.push('/notes/new')
}

function editNote(id: string): void {
  void router.push(`/notes/${encodeURIComponent(id)}`)
}

function requestDelete(id: string): void {
  pendingDeleteId.value = id
}

function deleteNote(): void {
  if (!pendingDeleteId.value) return
  store.deleteNote(pendingDeleteId.value)
  persistence.clearDraft()
  persistence.flush()
  pendingDeleteId.value = null
}
</script>

<template>
  <main class="home">
    <header class="home__header">
      <div class="home__intro">
        <p class="home__eyebrow">
          ТИХОЕ МЕСТО ДЛЯ ПЛАНОВ
        </p>
        <h1 class="home__title">
          Заметки
        </h1>
        <p class="home__description">
          Соберите мысли и превратите их в понятные следующие шаги.
        </p>
      </div>
      <BaseButton
        variant="primary"
        @click="openNew"
      >
        Новая заметка <span aria-hidden="true">＋</span>
      </BaseButton>
    </header>
    <p
      v-if="hasEmptyTodoNotice"
      class="home__notice"
      role="status"
    >
      Пустые пункты удалены при сохранении заметки.
    </p>
    <section
      class="home__content"
      aria-label="Список заметок"
    >
      <NoteList
        v-if="store.sortedNotes.length"
        :notes="store.sortedNotes"
        @edit="editNote"
        @remove="requestDelete"
      />
      <EmptyState
        v-else
        title="Пока здесь пусто"
        description="Создайте первую заметку — и список задач появится здесь."
      >
        <BaseButton
          variant="primary"
          @click="openNew"
        >
          Создать заметку
        </BaseButton>
      </EmptyState>
    </section>
    <ConfirmDialog
      v-model="isDeleteOpen"
      title="Удалить заметку?"
      :message="`Заметка «${displayTitle}» будет удалена без возможности восстановления.`"
      confirm-label="Удалить"
      danger
      @confirm="deleteNote"
      @cancel="pendingDeleteId = null"
    />
  </main>
</template>

<style scoped lang="scss">
@use '~/assets/scss/tokens' as *;
.home {
  width: min(100% - #{$space-8}, $content-width);
  min-height: $viewport-height;
  margin-inline: auto;
  padding-block: $space-8;
}
.home__header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-5;
  margin-bottom: $space-8;
}
.home__intro {
  max-width: $home-intro-width;
}
.home__eyebrow {
  margin: 0 0 $space-2;
  color: $color-accent;
  font-size: $font-small;
  font-weight: $font-weight-emphasis;
  letter-spacing: $letter-spacing-emphasis;
}
.home__title {
  margin: 0;
  font-size: clamp($font-display-home-min, $font-display-home-fluid, $font-display-home-max);
  line-height: $line-height-display;
}
.home__description {
  max-width: $home-copy-width;
  margin: $space-3 0 0;
  color: $color-muted;
  line-height: $line-height-copy;
}
.home__content {
  padding-bottom: $space-8;
}
.home__notice {
  margin: 0 0 $space-4;
  padding: $space-3;
  border-radius: $radius-control;
  background: $color-soft;
  color: $color-accent;
}
@include tablet {
  .home__header {
    flex-direction: row;
    align-items: center;
  }
}
</style>
