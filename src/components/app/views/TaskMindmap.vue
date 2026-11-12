<script setup>
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
      <div v-for="(b, i) in branches" :key="b.id" class="branch" :style="{ '--c': b.color, '--i': i }">
        <div class="node">{{ b.name }} <small>{{ b.tasks.length }}</small></div>
        <TransitionGroup name="leaf" tag="div" class="leaves">
          <button v-for="(t, j) in b.tasks" :key="t.id" type="button" class="leaf" :style="{ '--j': Math.min(j, 12) }" @click="openTask(t)">{{ t.title }}</button>
          <span v-if="!b.tasks.length" key="empty" class="leaf empty">vazio</span>
        </TransitionGroup>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map { display: flex; align-items: center; gap: 3rem; overflow-x: auto; padding: 1.25rem 0.75rem; }
.root { position: relative; flex-shrink: 0; padding: 0.85rem 1.2rem; border-radius: 14px; background: var(--accent); font-weight: 650; color: #fff; box-shadow: 0 6px 20px color-mix(in srgb, var(--accent) 35%, transparent); animation: mm-in 0.4s ease-out both; }
.root::after { content: ''; position: absolute; left: 100%; top: 50%; width: 1.5rem; border-top: 2px solid var(--line-strong); }
.branches { position: relative; display: flex; flex-direction: column; gap: 1.1rem; padding-left: 1.5rem; border-left: 2px solid var(--line-strong); border-radius: 2px; }
.branch { position: relative; display: flex; align-items: center; gap: 1.5rem; animation: mm-in 0.4s ease-out both; animation-delay: calc(var(--i) * 80ms + 120ms); }
.branch::before { content: ''; position: absolute; left: -1.5rem; top: 50%; width: 1.5rem; border-top: 2px solid var(--line-strong); }
.node { position: relative; flex-shrink: 0; min-width: 9rem; padding: 0.5rem 0.9rem; border: 2px solid var(--c); border-radius: 999px; background: color-mix(in srgb, var(--c) 10%, var(--surface)); font-weight: 600; font-size: 13px; color: var(--text); transition: background 0.2s ease-out, translate 0.2s ease-out, box-shadow 0.2s ease-out; }
.node::after { content: ''; position: absolute; left: 100%; top: 50%; width: 1.5rem; border-top: 2px dashed color-mix(in srgb, var(--c) 60%, transparent); }
.branch:hover .node { translate: 2px 0; background: color-mix(in srgb, var(--c) 20%, var(--surface)); box-shadow: 0 4px 14px color-mix(in srgb, var(--c) 25%, transparent); }
.node small { color: var(--muted); }
.leaves { display: flex; flex-wrap: wrap; gap: 0.45rem; padding-left: 1rem; border-left: 2px dashed color-mix(in srgb, var(--c) 60%, transparent); }
.leaf { padding: 0.3rem 0.7rem; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); font-size: 12.5px; color: var(--text); cursor: pointer; animation: mm-in 0.35s ease-out both; animation-delay: calc(var(--i, 0) * 80ms + var(--j, 0) * 30ms + 250ms); transition: border-color 0.2s ease-out, background 0.2s ease-out, translate 0.2s ease-out, box-shadow 0.2s ease-out; }
.leaf:hover { border-color: var(--c); background: var(--surface-2); translate: 0 -2px; box-shadow: 0 6px 14px rgb(0 0 0 / 0.25); }
.leaf.empty { color: var(--muted); cursor: default; }
.leaf.empty:hover { translate: none; box-shadow: none; background: var(--surface); border-color: var(--line); }
.leaf:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
.leaf-enter-active, .leaf-leave-active, .leaf-move { transition: opacity 0.25s ease-out, transform 0.25s ease-out; }
.leaf-leave-active { position: absolute; }
.leaf-enter-from, .leaf-leave-to { opacity: 0; transform: scale(0.9); }
@keyframes mm-in { from { opacity: 0; transform: translateX(-8px); } }
@media (prefers-reduced-motion: reduce) {
  .root, .branch, .leaf { animation: none; }
  .node, .leaf, .leaf-enter-active, .leaf-leave-active, .leaf-move { transition: none; }
  .leaf:hover, .branch:hover .node { translate: none; }
}
</style>
