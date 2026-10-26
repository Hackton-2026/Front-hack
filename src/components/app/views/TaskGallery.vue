<script setup>
import { useWorkspace } from '../../../composables/useWorkspace'
import { useUi } from '../../../composables/useUi'
import StatusBadge from '../StatusBadge.vue'
import PriorityFlag from '../PriorityFlag.vue'
import Avatars from '../Avatars.vue'

defineProps({ tasks: { type: Array, required: true } })
const { code, isOverdue } = useWorkspace()
const { openTask } = useUi()
const fmt = (d) => new Date(`${d}T12:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
</script>

<template>
  <div class="gallery">
    <button v-for="t in tasks" :key="t.id" type="button" class="card" @click="openTask(t)">
      <span class="top"><StatusBadge :status="t.status" compact /><small>{{ code(t) }}</small><PriorityFlag :priority="t.priority" /></span>
      <strong>{{ t.title }}</strong>
      <p v-if="t.description">{{ t.description.slice(0, 140) }}</p>
      <span v-if="t.tags.length" class="tags"><span v-for="g in t.tags" :key="g">#{{ g }}</span></span>
      <span class="foot"><Avatars :ids="t.assignees" /><small v-if="t.due" :class="{ late: isOverdue(t) }">{{ fmt(t.due) }}</small></span>
    </button>
    <p v-if="!tasks.length" class="empty">Nenhuma tarefa.</p>
  </div>
</template>

<style scoped>
.gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); gap: 0.75rem; }
.card { display: flex; flex-direction: column; gap: 0.5rem; min-height: 9rem; padding: 0.85rem; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); font: inherit; color: var(--text); text-align: left; cursor: pointer; transition: border-color 0.2s var(--ease); }
.card:hover { border-color: var(--accent); }
.card:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
.top, .foot { display: flex; align-items: center; gap: 0.5rem; }
.foot { justify-content: space-between; margin-top: auto; }
small { font-size: 11.5px; color: var(--muted); }
strong { font-size: 14px; line-height: 1.35; }
p { margin: 0; font-size: 12.5px; color: var(--muted); }
.tags { display: flex; flex-wrap: wrap; gap: 0.3rem; font-size: 11.5px; color: var(--accent-soft); }
.late { color: #ff8a80; }
.empty { grid-column: 1 / -1; padding: 2rem; text-align: center; color: var(--muted); }
</style>
