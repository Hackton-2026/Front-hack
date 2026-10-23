<script setup>
// Calendário do mês (a "Calendar view" do ClickUp): arrastar a tarefa para outro dia muda o prazo,
// o painel "Sem data" alimenta o calendário e clicar num dia cria uma tarefa com aquele prazo.
import { computed, nextTick, ref } from 'vue'
import { gsap, prefersReducedMotion } from '../../utils/motion'
import { useWorkspace } from '../../composables/useWorkspace'
import { useUi } from '../../composables/useUi'
import AppIcon from './AppIcon.vue'
import StatusBadge from './StatusBadge.vue'

const props = defineProps({ tasks: { type: Array, required: true }, projectId: { type: [String, Number], default: null }, defaults: { type: Object, default: () => ({}) } })
const { state, status, updateTask, today } = useWorkspace()
const { openTask, newTask } = useUi()
const cursor = ref(new Date(`${today()}T12:00`))
cursor.value.setDate(1)
const grid = ref(null)
const dragging = ref(null)
const over = ref(null)
const MAX = 3

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const weekStart = computed(() => state.prefs.weekStart)
const weekdays = computed(() => {
  const names = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
  return [...names.slice(weekStart.value), ...names.slice(0, weekStart.value)]
})
const monthLabel = computed(() => cursor.value.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }))
const days = computed(() => {
  const first = new Date(cursor.value)
  const offset = (first.getDay() - weekStart.value + 7) % 7
  const start = new Date(first)
  start.setDate(1 - offset)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const key = iso(d)
    return { key, n: d.getDate(), out: d.getMonth() !== first.getMonth(), today: key === today(), tasks: props.tasks.filter((t) => t.due === key) }
  })
})
const undated = computed(() => props.tasks.filter((t) => !t.due && t.status !== 'done'))

// Mês anterior/próximo: a grade sai para um lado e entra pelo outro
async function shift(dir) {
  const go = () => { const d = new Date(cursor.value); d.setMonth(d.getMonth() + dir); cursor.value = d }
  if (prefersReducedMotion()) return go()
  await gsap.to(grid.value, { x: -20 * dir, autoAlpha: 0, duration: 0.15, ease: 'power2.in' })
  go()
  await nextTick()
  gsap.fromTo(grid.value, { x: 20 * dir, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.3, ease: 'power3.out' })
}
function goToday() {
  const d = new Date(`${today()}T12:00`)
  d.setDate(1)
  cursor.value = d
}
function drop(day) {
  const task = dragging.value
  over.value = null
  dragging.value = null
  if (!task || task.due === day) return
  updateTask(task, { due: day })
  nextTick(() => {
    const el = grid.value.querySelector(`[data-day="${day}"] [data-task="${task.id}"]`)
    if (el && !prefersReducedMotion()) gsap.from(el, { scale: 0.85, autoAlpha: 0, duration: 0.4, ease: 'back.out(2)' })
  })
}
</script>

<template>
  <div class="cal">
    <div class="cal__main">
      <header class="bar">
        <strong class="month">{{ monthLabel }}</strong>
        <div class="nav">
          <button type="button" class="nav__btn" aria-label="Mês anterior" @click="shift(-1)"><AppIcon name="chevron" :size="15" style="rotate: 90deg" /></button>
          <button type="button" class="nav__today" @click="goToday">Hoje</button>
          <button type="button" class="nav__btn" aria-label="Próximo mês" @click="shift(1)"><AppIcon name="chevron" :size="15" style="rotate: -90deg" /></button>
        </div>
      </header>
      <div class="week" aria-hidden="true"><span v-for="w in weekdays" :key="w">{{ w }}</span></div>
      <div ref="grid" class="grid">
        <div
          v-for="d in days"
          :key="d.key"
          :data-day="d.key"
          class="day"
          :class="{ out: d.out, today: d.today, over: over === d.key }"
          @dragover.prevent="over = d.key"
          @dragleave.self="over = null"
          @drop.prevent="drop(d.key)"
          @click.self="newTask({ due: d.key, projectId: projectId || state.projects[0]?.id, ...defaults })"
        >
          <span class="day__n">{{ d.n }}</span>
          <button
            v-for="t in d.tasks.slice(0, MAX)"
            :key="t.id"
            :data-task="t.id"
            type="button"
            class="chip"
            :class="{ done: t.status === 'done' }"
            :style="{ '--c': status(t.status).color }"
            draggable="true"
            @dragstart="dragging = t"
            @dragend="dragging = null; over = null"
            @click="openTask(t)"
          >{{ t.title }}</button>
          <span v-if="d.tasks.length > MAX" class="more">+{{ d.tasks.length - MAX }} mais</span>
        </div>
      </div>
    </div>
    <aside class="undated" :class="{ over: over === 'none' }" @dragover.prevent="over = 'none'" @dragleave.self="over = null" @drop.prevent="dragging && updateTask(dragging, { due: null }); dragging = null; over = null">
      <h3>Sem data <span>{{ undated.length }}</span></h3>
      <p class="hint">Arraste para um dia do calendário.</p>
      <button v-for="t in undated" :key="t.id" type="button" class="row" draggable="true" @dragstart="dragging = t" @dragend="dragging = null; over = null" @click="openTask(t)">
        <StatusBadge :status="t.status" compact />{{ t.title }}
      </button>
    </aside>
  </div>
</template>

<style scoped>
.cal { display: grid; grid-template-columns: minmax(0, 1fr) 15rem; gap: 1rem; align-items: start; }
@media (max-width: 1100px) { .cal { grid-template-columns: minmax(0, 1fr); } }
.cal__main { min-width: 0; overflow: hidden; }
.bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.6rem; }
.month { display: inline-block; font-size: 1rem; }
.month::first-letter { text-transform: uppercase; }
.nav { display: flex; gap: 0.25rem; }
.nav__btn, .nav__today { display: grid; place-items: center; height: 30px; padding: 0 0.6rem; border: 1px solid var(--line-strong); border-radius: 6px; background: none; cursor: pointer; }
.nav__btn { width: 30px; padding: 0; }
.nav__btn:hover, .nav__today:hover { border-color: var(--accent); }
.week { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); margin-bottom: 0.25rem; font-size: 11.5px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
.week span { padding: 0 0.5rem; }
.grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); border-top: 1px solid var(--line); border-left: 1px solid var(--line); }
.day { display: flex; flex-direction: column; gap: 3px; min-height: 6.5rem; padding: 0.35rem; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); cursor: pointer; transition: background 0.15s var(--ease); }
.day:hover { background: var(--surface); }
.day.out { background: color-mix(in srgb, var(--bg) 60%, #000); }
.day.out .day__n { color: color-mix(in srgb, var(--muted) 55%, transparent); }
.day.over { background: color-mix(in srgb, var(--accent) 12%, transparent); }
.day__n { align-self: flex-end; display: grid; place-items: center; min-width: 22px; height: 22px; border-radius: 50%; font-size: 12px; color: var(--muted); pointer-events: none; }
.day.today .day__n { background: var(--accent); font-weight: 600; color: #000; }
.chip { display: block; width: 100%; padding: 0.15rem 0.4rem; overflow: hidden; border: 0; border-left: 3px solid var(--c); border-radius: 4px; background: var(--surface-2); font-size: 11.5px; text-align: left; text-overflow: ellipsis; white-space: nowrap; cursor: grab; }
.chip:hover { background: color-mix(in srgb, var(--c) 18%, var(--surface-2)); }
.chip.done { color: var(--muted); text-decoration: line-through; }
.more { padding-left: 0.4rem; font-size: 11px; color: var(--muted); }
.undated { display: flex; flex-direction: column; gap: 0.35rem; padding: 0.75rem; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); transition: border-color 0.2s var(--ease); }
.undated.over { border-color: var(--accent); }
.undated h3 { margin: 0; font-size: 13px; color: var(--text); }
.undated h3 span { font-weight: 400; color: var(--muted); }
.hint { margin: 0 0 0.35rem; font-size: 12px; color: var(--muted); }
.row { display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.5rem; border: 1px solid var(--line); border-radius: 6px; background: var(--surface-2); font-size: 12.5px; text-align: left; cursor: grab; }
.row:hover { border-color: var(--line-strong); }
:is(.nav__btn, .nav__today, .chip, .row):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
</style>
