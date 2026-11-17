<script setup lang="ts">
import { onScopeDispose } from 'vue'
import { useNotesPersistence } from './composables/useNotesPersistence'

if (import.meta.client) {
  const persistence = useNotesPersistence()
  onScopeDispose(persistence.dispose)
}
</script>

<template>
  <NuxtPage />
</template>
