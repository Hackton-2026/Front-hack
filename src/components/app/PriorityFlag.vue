<script setup>
import { computed } from 'vue'
import { PRIORITIES } from '../../composables/useWorkspace'

const props = defineProps({ priority: { type: String, default: '' }, label: Boolean })
const p = computed(() => PRIORITIES.find((x) => x.id === props.priority))
</script>

<template>
  <span class="flag" :title="p ? `Prioridade ${p.name}` : 'Sem prioridade'" :style="{ '--c': p?.color || 'var(--line-strong)' }">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V4 M5 4h11l-2 4 2 4H5" :fill="p ? 'currentColor' : 'none'" /></svg>
    <span v-if="label">{{ p?.name || 'Sem prioridade' }}</span>
  </span>
</template>

<style scoped>
.flag { display: inline-flex; align-items: center; gap: 0.35rem; color: var(--c); font-size: 12.5px; white-space: nowrap; }
.flag span { color: var(--text); }
svg { width: 15px; height: 15px; stroke: currentColor; stroke-width: 1.8; stroke-linejoin: round; stroke-linecap: round; }
</style>
