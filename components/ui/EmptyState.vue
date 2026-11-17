<script setup lang="ts">
defineProps<{ title: string, description: string }>()
</script>

<template>
  <section
    class="empty"
    aria-live="polite"
  >
    <h2 class="empty__title">
      {{ title }}
    </h2>
    <p class="empty__description">
      {{ description }}
    </p>
    <slot />
  </section>
</template>

<style scoped lang="scss">
@use '~/assets/scss/tokens' as *;
.empty {
  padding: $space-8 $space-4;
  border: $border-width-dashed dashed $color-line;
  border-radius: $radius-card;
  text-align: center;
}
.empty__title {
  margin: 0 0 $space-2;
  color: $color-ink;
}
.empty__description {
  margin: 0 0 $space-4;
  color: $color-muted;
}
</style>
