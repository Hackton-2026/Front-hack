<script setup>
import { useWorkspace } from '../../composables/useWorkspace'

defineProps({ ids: { type: Array, default: () => [] }, size: { type: Number, default: 22 } })
const { member } = useWorkspace()
const initials = (name) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
</script>

<template>
  <span class="avs" :style="{ '--s': `${size}px` }">
    <span v-for="id in ids.slice(0, 3)" :key="id" class="av" :title="member(id)?.name" :style="{ background: member(id)?.color }">
      <img v-if="member(id)?.avatar" :src="member(id).avatar" alt="" />
      <template v-else>{{ initials(member(id)?.name || '?') }}</template>
    </span>
    <span v-if="ids.length > 3" class="av more">+{{ ids.length - 3 }}</span>
    <span v-if="!ids.length" class="av empty" title="Sem responsável" />
  </span>
</template>

<style scoped>
.avs { display: inline-flex; }
.av { display: grid; place-items: center; width: var(--s); height: var(--s); border: 2px solid var(--surface); border-radius: 50%; font: 700 calc(var(--s) * 0.38)/1 'Lexend', system-ui, sans-serif; color: #000; }
.av + .av { margin-left: calc(var(--s) * -0.3); }
.av { overflow: hidden; }
.av img { width: 100%; height: 100%; object-fit: cover; }
.av.more { background: var(--surface-2); color: var(--muted); }
.av.empty { border: 1.5px dashed var(--line-strong); background: none; }
</style>
