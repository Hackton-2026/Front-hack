<script setup>
// Mapa mental: o projeto no centro, um ramo por status e as tarefas como folhas
import { computed } from 'vue'
import { useWorkspace } from '../../../composables/useWorkspace'
import { useUi } from '../../../composables/useUi'

const props = defineProps({ tasks: { type: Array, required: true }, title: { type: String, default: '' } })
const { STATUSES } = useWorkspace()
const { openTask } = useUi()
const branches = computed(() => STATUSES.map((s) => ({ ...s, tasks: props.tasks.filter((t) => t.status === s.id) })))
</script>

<template>
  <div class="map">
    <div class="root">{{ title }}</div>
    <div class="branches">
      <div v-for="b in branches" :key="b.id" class="branch" :style="{ '--c': b.color }">
        <div class="node">{{ b.name }} <small>{{ b.tasks.length }}</small></div>
        <div class="leaves">
          <button v-for="t in b.tasks" :key="t.id" type="button" class="leaf" @click="openTask(t)">{{ t.title }}</button>
          <span v-if="!b.tasks.length" class="leaf empty">vazio</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map { display: flex; align-items: center; gap: 2.5rem; overflow-x: auto; padding: 1rem 0.5rem; }
.root { flex-shrink: 0; padding: 0.8rem 1.1rem; border-radius: 12px; background: var(--accent); font-weight: 650; color: #fff; }
.branches { position: relative; display: flex; flex-direction: column; gap: 1rem; padding-left: 1.5rem; border-left: 2px solid var(--line-strong); }
.branch { position: relative; display: flex; align-items: center; gap: 1.5rem; }
.branch::before { content: ''; position: absolute; left: -1.5rem; top: 50%; width: 1.5rem; border-top: 2px solid var(--line-strong); }
.node { flex-shrink: 0; min-width: 9rem; padding: 0.5rem 0.8rem; border: 2px solid var(--c); border-radius: 999px; font-weight: 600; font-size: 13px; color: var(--text); }
.node small { color: var(--muted); }
.leaves { display: flex; flex-wrap: wrap; gap: 0.4rem; padding-left: 1rem; border-left: 2px dashed color-mix(in srgb, var(--c) 60%, transparent); }
.leaf { padding: 0.3rem 0.65rem; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); font-size: 12.5px; color: var(--text); cursor: pointer; }
.leaf:hover { border-color: var(--c); }
.leaf.empty { color: var(--muted); cursor: default; }
.leaf:focus-visible { outline: 2px solid var(--accent-soft); }
</style>
