<script setup>
// Gantt (uma linha por tarefa) e Linha do tempo (agrupada por pessoa). A barra vai da criação até o prazo.
import { computed } from 'vue'
import { useWorkspace } from '../../../composables/useWorkspace'
import { useUi } from '../../../composables/useUi'

const props = defineProps({ tasks: { type: Array, required: true }, byPerson: Boolean })
const { STATUSES, member, code, today } = useWorkspace()
const { openTask } = useUi()
const DAY = 864e5
const toDay = (s) => Date.parse(`${String(s).slice(0, 10)}T12:00`)
const span = (t) => { const end = toDay(t.due); return { start: Math.min(toDay(t.createdAt || t.due), end), end } }
const dated = computed(() => props.tasks.filter((t) => t.due))
const undated = computed(() => props.tasks.filter((t) => !t.due))
const range = computed(() => {
  const now = toDay(today())
  const all = dated.value.flatMap((t) => Object.values(span(t)))
  const from = Math.min(now, ...all) - 2 * DAY
  const days = Math.min(120, Math.round((Math.max(now, ...all) + 5 * DAY - from) / DAY))
  return { from, days: Array.from({ length: days }, (_, i) => new Date(from + i * DAY)) }
})
const col = (ms) => Math.round((ms - range.value.from) / DAY) + 1
const groups = computed(() => {
  if (!props.byPerson) return [{ key: 'all', name: '', tasks: dated.value }]
  const ids = [...new Set(dated.value.flatMap((t) => (t.assignees.length ? t.assignees : [null])))]
  return ids.map((id) => ({ key: id ?? 'none', name: id ? member(id)?.name || '?' : 'Sem responsável', tasks: dated.value.filter((t) => (id ? t.assignees.includes(id) : !t.assignees.length)) }))
})
const color = (t) => STATUSES.find((s) => s.id === t.status)?.color
const todayCol = computed(() => col(toDay(today())))
</script>

<template>
  <div class="gantt">
    <p v-if="!dated.length" class="empty">Nenhuma tarefa com prazo. Dê um prazo às tarefas para elas aparecerem aqui.</p>
    <div v-else class="scroll">
      <div class="grid" :style="{ '--days': range.days.length }">
        <div class="label head">{{ byPerson ? 'Pessoa / tarefa' : 'Tarefa' }}</div>
        <div v-for="(d, i) in range.days" :key="i" class="day head" :class="{ mon: d.getDay() === 1 }">{{ d.getDate() === 1 || i === 0 || d.getDay() === 1 ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '' }}</div>
        <template v-for="g in groups" :key="g.key">
          <div v-if="byPerson" class="group">{{ g.name }} · {{ g.tasks.length }}</div>
          <template v-for="t in g.tasks" :key="`${g.key}-${t.id}`">
            <button type="button" class="label" @click="openTask(t)"><small>{{ code(t) }}</small> {{ t.title }}</button>
            <div class="track" :style="{ gridColumn: `2 / span ${range.days.length}` }">
              <span class="today" :style="{ left: `calc(${todayCol - 1} * var(--w))` }" />
              <button type="button" class="bar" :style="{ left: `calc(${col(span(t).start) - 1} * var(--w))`, width: `calc(${col(span(t).end) - col(span(t).start) + 1} * var(--w))`, background: color(t) }" :title="`${t.title} · prazo ${new Date(toDay(t.due)).toLocaleDateString('pt-BR')}`" @click="openTask(t)">{{ t.title }}</button>
            </div>
          </template>
        </template>
      </div>
    </div>
    <details v-if="undated.length" class="undated">
      <summary>{{ undated.length }} sem prazo</summary>
      <button v-for="t in undated" :key="t.id" type="button" @click="openTask(t)">{{ code(t) }} · {{ t.title }}</button>
    </details>
  </div>
</template>

<style scoped>
.gantt { display: flex; flex-direction: column; gap: 0.75rem; --w: 30px; }
.scroll { overflow-x: auto; border: 1px solid var(--line); border-radius: 8px; }
.grid { display: grid; grid-template-columns: 15rem repeat(var(--days), var(--w)); min-width: max-content; font-size: 12.5px; }
.head { position: sticky; top: 0; padding: 0.4rem 0.3rem; border-bottom: 1px solid var(--line); background: var(--surface); color: var(--muted); white-space: nowrap; font-size: 11px; }
.day { overflow: visible; }
.day.mon { border-left: 1px solid var(--line); }
.label { position: sticky; left: 0; z-index: 1; overflow: hidden; padding: 0.45rem 0.6rem; border: 0; border-bottom: 1px solid var(--line); background: var(--surface); font: inherit; color: var(--text); text-align: left; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }
.label small { color: var(--muted); }
.track { position: relative; border-bottom: 1px solid var(--line); }
.today { position: absolute; top: 0; bottom: 0; width: var(--w); background: color-mix(in srgb, var(--accent) 10%, transparent); }
.bar { position: absolute; top: 6px; bottom: 6px; overflow: hidden; padding: 0 0.4rem; border: 0; border-radius: 5px; font: 500 11px/1.9 'Geist', system-ui, sans-serif; color: #111; text-align: left; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }
.group { grid-column: 1 / -1; padding: 0.45rem 0.6rem; border-bottom: 1px solid var(--line); background: var(--surface-2); font-weight: 600; color: var(--text); }
.empty { margin: 0; padding: 2rem; text-align: center; color: var(--muted); }
.undated summary { font-size: 12.5px; color: var(--muted); cursor: pointer; }
.undated button { display: block; padding: 0.3rem 0; border: 0; background: none; font-size: 13px; color: var(--text); cursor: pointer; }
:is(.label, .bar, .undated button):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: -2px; }
</style>
