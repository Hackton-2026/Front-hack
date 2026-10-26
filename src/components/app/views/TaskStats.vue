<script setup>
import { computed } from 'vue'
import { useWorkspace } from '../../../composables/useWorkspace'

const props = defineProps({ tasks: { type: Array, required: true } })
const { STATUSES, PRIORITIES, member, isOverdue } = useWorkspace()
const count = (fn) => props.tasks.filter(fn).length
const kpis = computed(() => [
  ['Tarefas', props.tasks.length],
  ['Concluídas', `${props.tasks.length ? Math.round((count((t) => t.status === 'done') / props.tasks.length) * 100) : 0}%`],
  ['Atrasadas', count(isOverdue)],
  ['Sem responsável', count((t) => !t.assignees.length)],
])
const bars = computed(() => {
  const people = [...new Set(props.tasks.flatMap((t) => t.assignees))]
  return [
    ['Por status', STATUSES.map((s) => [s.name, count((t) => t.status === s.id), s.color])],
    ['Por prioridade', [...PRIORITIES.map((p) => [p.name, count((t) => t.priority === p.id), p.color]), ['Sem prioridade', count((t) => !t.priority), '#5b5853']]],
    ['Por pessoa (abertas)', people.map((id) => [member(id)?.name || '?', count((t) => t.status !== 'done' && t.assignees.includes(id)), member(id)?.color || '#919599'])],
  ]
})
const max = (rows) => Math.max(1, ...rows.map((r) => r[1]))
</script>

<template>
  <div class="stats">
    <div class="kpis">
      <div v-for="[label, value] in kpis" :key="label" class="kpi"><strong>{{ value }}</strong><span>{{ label }}</span></div>
    </div>
    <div class="charts">
      <section v-for="[title, rows] in bars" :key="title" class="chart">
        <h3>{{ title }}</h3>
        <p v-if="!rows.length" class="muted">Sem dados.</p>
        <div v-for="[name, n, c] in rows" :key="name" class="bar">
          <span class="name">{{ name }}</span>
          <span class="track"><span :style="{ width: `${(n / max(rows)) * 100}%`, background: c }" /></span>
          <span class="n">{{ n }}</span>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.stats { display: flex; flex-direction: column; gap: 1rem; }
.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: 0.75rem; }
.kpi { display: flex; flex-direction: column; gap: 0.2rem; padding: 0.9rem 1rem; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
.kpi strong { font: 650 1.6rem/1 'Geist', system-ui, sans-serif; color: var(--text); }
.kpi span { font-size: 12px; color: var(--muted); }
.charts { display: grid; grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr)); gap: 0.75rem; }
.chart { display: flex; flex-direction: column; gap: 0.45rem; padding: 0.9rem 1rem; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
h3 { margin: 0 0 0.25rem; font-size: 12.5px; color: var(--muted); }
.bar { display: grid; grid-template-columns: 7.5rem 1fr 2rem; align-items: center; gap: 0.5rem; font-size: 12.5px; color: var(--text); }
.name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.track { height: 8px; overflow: hidden; border-radius: 999px; background: var(--surface-2); }
.track span { display: block; height: 100%; border-radius: inherit; }
.n { text-align: right; color: var(--muted); }
.muted { margin: 0; font-size: 12.5px; color: var(--muted); }
</style>
