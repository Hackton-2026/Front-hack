<script setup>
import { computed } from 'vue'
import { useWorkspace } from '../../../composables/useWorkspace'
import { useUi } from '../../../composables/useUi'
import StatusBadge from '../StatusBadge.vue'

const props = defineProps({ tasks: { type: Array, required: true }, team: Boolean })
const { state, day, isOverdue, code } = useWorkspace()
const { openTask } = useUi()
const LIMIT = 3
const open = computed(() => props.tasks.filter((t) => t.status !== 'done'))
const week = computed(() => {
  const offset = (new Date().getDay() + 6) % 7
  return Array.from({ length: 7 }, (_, i) => day(i - offset))
})
const people = computed(() => [
  ...state.members.map((m) => ({ id: m.id, name: m.name, color: m.color, tasks: open.value.filter((t) => t.assignees.includes(m.id)) })),
  { id: null, name: 'Sem responsável', color: '#5b5853', tasks: open.value.filter((t) => !t.assignees.length) },
].filter((p) => p.id !== null || p.tasks.length))
const label = (d) => new Date(`${d}T12:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })
</script>

<template>
  <div v-if="!team" class="wrap">
    <table class="load">
      <thead><tr><th>Pessoa</th><th v-for="d in week" :key="d" :class="{ today: d === day(0) }">{{ label(d) }}</th><th>Abertas</th><th>Atrasadas</th></tr></thead>
      <tbody>
        <tr v-for="p in people" :key="p.id ?? 'none'">
          <td><span class="dot" :style="{ background: p.color }" />{{ p.name }}</td>
          <td v-for="d in week" :key="d" :class="{ today: d === day(0) }">
            <span v-if="p.tasks.filter((t) => t.due === d).length" class="cell" :class="{ over: p.tasks.filter((t) => t.due === d).length > LIMIT }">{{ p.tasks.filter((t) => t.due === d).length }}</span>
          </td>
          <td>{{ p.tasks.length }}</td>
          <td :class="{ late: p.tasks.some(isOverdue) }">{{ p.tasks.filter(isOverdue).length }}</td>
        </tr>
      </tbody>
    </table>
    <p class="muted">Cada célula conta as tarefas abertas com prazo naquele dia. Mais de {{ LIMIT }} no dia fica em destaque.</p>
  </div>
  <div v-else class="team">
    <section v-for="p in people" :key="p.id ?? 'none'" class="person">
      <header><span class="av" :style="{ background: p.color }">{{ p.name.slice(0, 2).toUpperCase() }}</span><strong>{{ p.name }}</strong><small>{{ p.tasks.length }} abertas</small></header>
      <button v-for="t in p.tasks" :key="t.id" type="button" class="task" @click="openTask(t)">
        <StatusBadge :status="t.status" compact /><span>{{ t.title }}</span><small :class="{ late: isOverdue(t) }">{{ code(t) }}</small>
      </button>
      <p v-if="!p.tasks.length" class="muted">Nada aberto.</p>
    </section>
  </div>
</template>

<style scoped>
.wrap { display: flex; flex-direction: column; gap: 0.5rem; overflow-x: auto; }
.load { width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid var(--line); }
th, td { padding: 0.5rem 0.6rem; border-bottom: 1px solid var(--line); text-align: center; white-space: nowrap; color: var(--text); }
th { font-size: 11.5px; font-weight: 600; color: var(--muted); background: var(--surface); }
th:first-child, td:first-child { text-align: left; }
.today { background: color-mix(in srgb, var(--accent) 8%, transparent); }
.dot { display: inline-block; width: 8px; height: 8px; margin-right: 0.45rem; border-radius: 50%; }
.cell { display: inline-grid; place-items: center; min-width: 22px; height: 22px; border-radius: 6px; background: var(--surface-2); font-weight: 600; }
.cell.over { background: rgb(255 91 77 / 0.25); color: var(--danger, #ff8a80); }
.late { color: var(--danger, #ff8a80); }
.muted { margin: 0; font-size: 12px; color: var(--muted); }
.team { display: grid; grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr)); gap: 0.75rem; }
.person { display: flex; flex-direction: column; gap: 0.3rem; padding: 0.8rem; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
.person header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem; color: var(--text); }
.person header small { margin-left: auto; color: var(--muted); }
.av { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; font: 700 10px/1 'Lexend', system-ui, sans-serif; color: #000; }
.task { display: flex; align-items: center; gap: 0.45rem; padding: 0.35rem 0.3rem; border: 0; border-radius: 6px; background: none; font-size: 13px; color: var(--text); text-align: left; cursor: pointer; }
.task span { flex: 1; overflow: hidden; text-align: left; text-overflow: ellipsis; white-space: nowrap; }
.task small { color: var(--muted); }
.task:hover { background: var(--surface-2); }
.task:focus-visible { outline: 2px solid var(--accent-soft); }
</style>
