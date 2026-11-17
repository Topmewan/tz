<script setup lang="ts">
import BaseButton from './BaseButton.vue'
import BaseModal from './BaseModal.vue'

withDefaults(defineProps<{ title: string; message: string; confirmLabel?: string; danger?: boolean }>(), {
  confirmLabel: 'Подтвердить',
  danger: false,
})
const isOpen = defineModel<boolean>({ required: true })
const emit = defineEmits<{ confirm: []; cancel: [] }>()

function onConfirm(): void {
  emit('confirm')
  isOpen.value = false
}

function onCancel(): void {
  emit('cancel')
  isOpen.value = false
}
</script>

<template>
  <BaseModal v-model="isOpen" :title="title">
    <p class="confirm__message">{{ message }}</p>
    <div class="confirm__actions">
      <BaseButton variant="secondary" @click="onCancel">Отмена</BaseButton>
      <BaseButton :variant="danger ? 'danger' : 'primary'" @click="onConfirm">{{ confirmLabel }}</BaseButton>
    </div>
  </BaseModal>
</template>

<style scoped lang="scss">
@use '~/assets/scss/tokens' as *;
.confirm__message { margin: 0 0 $space-5; color: $color-ink; line-height: $line-height-body; }
.confirm__actions { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: $space-3; }
</style>
