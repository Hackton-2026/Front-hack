<script setup>
import { APP_NAME } from '../config'

// Marca do app: um laço desenhado à mão + nome. Troque o <path> pelo logo do seu projeto.
defineProps({
  showName: { type: Boolean, default: true },
  size: { type: Number, default: 22 },
})
</script>

<template>
  <RouterLink to="/" class="logo" :aria-label="APP_NAME">
    <svg class="mark" :width="size" :height="size" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9.5 21.5c-4-3.2-6.4-7.4-5.2-11.3C5.4 6.4 9.1 3.7 12.8 4.3c3.6.6 6.1 4 5.3 7.3-.7 2.9-3.7 4.6-6.2 3.6-2-.8-2.6-3.2-1.2-4.6 1.2-1.2 3.3-.9 4 .6"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
      />
    </svg>
    <span v-if="showName">{{ APP_NAME }}</span>
  </RouterLink>
</template>

<style scoped>
.logo { display: inline-flex; align-items: center; gap: var(--space-2); color: var(--color-heading); font-weight: 600; text-decoration: none; letter-spacing: -0.01em; }
</style>
