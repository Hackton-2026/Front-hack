<script setup>
import { computed } from 'vue'
import { STATUSES } from '../../composables/useWorkspace'

const props = defineProps({ status: { type: String, required: true }, compact: Boolean })
const s = computed(() => STATUSES.find((x) => x.id === props.status))
</script>

<template>
  <span class="status" :class="{ compact }" :style="{ '--c': s.color }">
    <span class="status__dot" :class="s.group" aria-hidden="true" />
    <span v-if="!compact">{{ s.name }}</span>
    <span v-else class="sr-only">{{ s.name }}</span>
  </span>
</template>

<style scoped>
.status { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.15rem 0.5rem; border-radius: 4px; background: color-mix(in srgb, var(--c) 16%, transparent); font-size: 12px; font-weight: 500; color: var(--text); white-space: nowrap; }
.status.compact { padding: 0; background: none; }
.status__dot { width: 11px; height: 11px; border: 2px solid var(--c); border-radius: 50%; }
.status__dot.active { background: conic-gradient(var(--c) 0 50%, transparent 50%); }
.status__dot.done { background: var(--c); box-shadow: inset 0 0 0 2px var(--surface); }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
</style>
