<script setup>
import { computed } from 'vue'

// Foto do usuário ou iniciais quando não tem foto
const props = defineProps({ user: Object, size: { type: Number, default: 36 } })
const initials = computed(() => {
  const u = props.user || {}
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || '?'
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
})
</script>

<template>
  <span class="avatar" :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${size * 0.4}px` }">
    <img v-if="user?.avatar" :src="user.avatar" :alt="user.username" />
    <template v-else>{{ initials }}</template>
  </span>
</template>

<style scoped>
.avatar {
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: hidden;
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-weight: 600;
}
.avatar img { width: 100%; height: 100%; object-fit: cover; }
</style>
