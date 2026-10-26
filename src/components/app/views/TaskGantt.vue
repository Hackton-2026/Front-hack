<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useWorkspace } from '../../../composables/useWorkspace'
import { useUi } from '../../../composables/useUi'
import Avatars from '../Avatars.vue'

const props = defineProps({ tasks: { type: Array, required: true }, byPerson: Boolean })
const { STATUSES, member, code, today, isOverdue, updateTask } = useWorkspace()
const { openTask } = useUi()
const DAY = 864e5
const ZOOM = { day: 36, week: 14 }
const zoom = ref('day')
const w = computed(() => ZOOM[zoom.value])

const toDay = (s) => Date.parse(`${String(s).slice(0, 10)}T12:00`)
const iso = (ms) => new Date(ms).toISOString().slice(0, 10)
const span = (t) => {
  const end = toDay(t.due)
  return { start: Math.min(toDay(t.start || t.createdAt || t.due), end), end }
}
const dated = computed(() => props.tasks.filter((t) => t.due))
const undated = computed(() => props.tasks.filter((t) => !t.due))

const range = computed(() => {
  const now = toDay(today())
  const all = dated.value.flatMap((t) => Object.values(span(t)))
  const from = Math.min(now, ...all) - 7 * DAY
  const to = Math.max(now, ...all) + 14 * DAY
  const days = Array.from({ length: Math.min(366, Math.round((to - from) / DAY) + 1) }, (_, i) => new Date(from + i * DAY))
  return { from, days }
})
const months = computed(() => {
  const out = []
  for (const d of range.value.days) {
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (out.at(-1)?.key === key) out.at(-1).n++
    else {
      const month = d.toLocaleDateString('pt-BR', { month: 'long' })
      out.push({ key, n: 1, label: `${month[0].toUpperCase()}${month.slice(1)} ${d.getFullYear()}` })
    }
  }
  return out
})
const x = (ms) => Math.round((ms - range.value.from) / DAY) * w.value
const todayX = computed(() => x(toDay(today())))
const width = computed(() => range.value.days.length * w.value)

const groups = computed(() => {
  if (!props.byPerson) return [{ key: 'all', name: '', tasks: dated.value }]
  const ids = [...new Set(dated.value.flatMap((t) => (t.assignees.length ? t.assignees : [null])))]
  return ids.map((id) => ({ key: id ?? 'none', name: id ? member(id)?.name || '?' : 'Sem responsável', tasks: dated.value.filter((t) => (id ? t.assignees.includes(id) : !t.assignees.length)) }))
})
const status = (t) => STATUSES.find((s) => s.id === t.status) || STATUSES[0]
const progress = (t) => (t.status === 'done' ? 1 : t.checklist?.length ? t.checklist.filter((i) => i.done).length / t.checklist.length : 0)
const fmt = (ms) => new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

const drag = ref(null)
function grab(e, t, mode) {
  if (e.button !== 0) return
  const s = span(t)
  drag.value = { t, mode, x0: e.clientX, start: s.start, end: s.end, delta: 0, moved: false }
  e.currentTarget.setPointerCapture(e.pointerId)
}
function slide(e) {
  const d = drag.value
  if (!d) return
  d.delta = Math.round((e.clientX - d.x0) / w.value)
  if (Math.abs(e.clientX - d.x0) > 3) d.moved = true
}
function drop(t) {
  const d = drag.value
  drag.value = null
  if (!d?.moved) return openTask(t)
  if (!d.delta) return
  const due = d.end + d.delta * DAY
  if (d.mode === 'move') updateTask(t, { start: iso(d.start + d.delta * DAY), due: iso(due) })
  else if (due >= d.start) updateTask(t, { due: iso(due), ...(t.start ? {} : { start: iso(d.start) }) })
}
const live = (t) => {
  const s = span(t)
  const d = drag.value?.t === t ? drag.value : null
  const start = d && d.mode === 'move' ? s.start + d.delta * DAY : s.start
  const end = d ? Math.max(start, s.end + d.delta * DAY) : s.end
  return { start, end }
}

const scroller = ref(null)
function goToday(smooth = true) {
  scroller.value?.scrollTo({ left: Math.max(0, todayX.value - scroller.value.clientWidth / 3), behavior: smooth ? 'smooth' : 'auto' })
}
onMounted(() => nextTick(() => goToday(false)))
watch(zoom, () => nextTick(() => goToday(false)))
</script>

<template>
  <div class="gantt" :style="{ '--w': `${w}px` }">
    <div class="bar-tools">
      <div class="seg" role="group" aria-label="Zoom">
        <button type="button" :aria-pressed="zoom === 'day'" @click="zoom = 'day'">Dias</button>
        <button type="button" :aria-pressed="zoom === 'week'" @click="zoom = 'week'">Semanas</button>
      </div>
      <button type="button" class="ghost" @click="goToday()">Hoje</button>
      <span class="hint">Arraste a barra para mudar as datas · a ponta direita muda o prazo</span>
    </div>

    <p v-if="!dated.length" class="empty">Nenhuma tarefa com prazo. Dê um prazo às tarefas para elas aparecerem aqui.</p>
    <div v-else ref="scroller" class="scroll">
      <div class="grid" :style="{ gridTemplateColumns: `16rem ${width}px` }">
        <div class="corner">{{ byPerson ? 'Pessoa / tarefa' : 'Tarefa' }}</div>
        <div class="head">
          <div class="months"><span v-for="m in months" :key="m.key" :style="{ width: `${m.n * w}px` }"><b>{{ m.label }}</b></span></div>
          <div class="days">
            <span v-for="(d, i) in range.days" :key="i" :class="{ we: d.getDay() === 0 || d.getDay() === 6, now: i * w === todayX }">
              <template v-if="zoom === 'day'"><small>{{ 'DSTQQSS'[d.getDay()] }}</small>{{ d.getDate() }}</template>
              <template v-else-if="d.getDay() === 1">{{ d.getDate() }}</template>
            </span>
          </div>
          <span class="today-pill" :style="{ left: `${todayX + w / 2}px` }">Hoje</span>
        </div>

        <template v-for="g in groups" :key="g.key">
          <div v-if="byPerson" class="group">{{ g.name }}<small>{{ g.tasks.length }}</small></div>
          <template v-for="t in g.tasks" :key="`${g.key}-${t.id}`">
            <button type="button" class="label" @click="openTask(t)">
              <i class="dot" :style="{ background: status(t).color }" :title="status(t).name" />
              <small class="code">{{ code(t) }}</small>
              <span class="title">{{ t.title }}</span>
              <Avatars v-if="t.assignees.length" :ids="t.assignees" :size="18" />
            </button>
            <div class="track" :class="{ zoomed: zoom === 'week' }">
              <span class="today-line" :style="{ left: `${todayX + w / 2}px` }" />
              <div
                class="bar" :class="{ late: isOverdue(t), done: t.status === 'done', dragging: drag?.t === t }"
                :style="{ left: `${x(live(t).start) + 2}px`, width: `${x(live(t).end) - x(live(t).start) + w - 4}px`, '--c': isOverdue(t) ? '#ff5b4d' : status(t).color, '--p': progress(t) }"
                role="button" tabindex="0" :aria-label="`${t.title}: ${fmt(live(t).start)} a ${fmt(live(t).end)}`" :title="`${t.title} · ${fmt(live(t).start)} → ${fmt(live(t).end)}`"
                @pointerdown="grab($event, t, 'move')" @pointermove="slide" @pointerup="drop(t)" @pointercancel="drag = null" @keydown.enter="openTask(t)"
              >
                <span class="fill" aria-hidden="true" />
                <span class="text">{{ t.title }}</span>
                <span class="handle" aria-hidden="true" @pointerdown.stop="grab($event, t, 'end')" @pointermove="slide" @pointerup.stop="drop(t)" />
              </div>
              <span v-if="drag?.t === t && drag.moved" class="tip" :style="{ left: `${x(live(t).start)}px` }">{{ fmt(live(t).start) }} → {{ fmt(live(t).end) }}</span>
            </div>
          </template>
        </template>
      </div>
    </div>

    <details v-if="undated.length" class="undated">
      <summary>{{ undated.length }} sem prazo</summary>
      <button v-for="t in undated" :key="t.id" type="button" @click="openTask(t)"><small>{{ code(t) }}</small> {{ t.title }}</button>
    </details>
  </div>
</template>

<style scoped>
.gantt { display: flex; flex-direction: column; gap: 0.75rem; }
.bar-tools { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
.seg { display: flex; padding: 2px; border: 1px solid var(--line); border-radius: 7px; }
.seg button { height: 26px; padding: 0 0.65rem; border: 0; border-radius: 5px; background: none; font-size: 12.5px; color: var(--muted); cursor: pointer; }
.seg button[aria-pressed='true'] { background: var(--surface-2); color: var(--text); }
.ghost { height: 30px; padding: 0 0.7rem; border: 1px solid var(--line-strong); border-radius: 7px; background: none; font-size: 12.5px; color: var(--text); cursor: pointer; }
.ghost:hover { background: var(--surface-2); }
.hint { margin-left: auto; font-size: 12px; color: var(--muted); }

.scroll { overflow: auto; max-height: 70vh; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
.grid { display: grid; min-width: max-content; font-size: 12.5px; }

.corner { position: sticky; top: 0; left: 0; z-index: 4; display: flex; align-items: flex-end; padding: 0 0.85rem 0.55rem; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); background: var(--surface); font-size: 11.5px; font-weight: 500; color: var(--muted); }
.head { position: sticky; top: 0; z-index: 3; border-bottom: 1px solid var(--line); background: var(--surface); }
.months { display: flex; height: 26px; }
.months span { flex-shrink: 0; overflow: clip; padding: 0.4rem 0.6rem 0; border-left: 1px solid var(--line); font-size: 11.5px; font-weight: 600; color: var(--text); white-space: nowrap; } .months span:first-child { border-left: 0; }
.months b { position: sticky; left: calc(16rem + 0.6rem); font-weight: inherit; } .days { display: flex; height: 30px; }
.days span { display: flex; flex-shrink: 0; flex-direction: column; align-items: center; justify-content: center; width: var(--w); font: 500 11.5px/1.15 'Geist Mono', monospace; color: var(--muted); }
.days small { font-size: 9px; opacity: 0.7; }
.days .we { background: color-mix(in srgb, var(--surface-2) 60%, transparent); }
.days .now { color: var(--text); font-weight: 700; }
.today-pill { position: absolute; bottom: -9px; z-index: 2; translate: -50% 0; padding: 0.05rem 0.4rem; border-radius: 999px; background: var(--accent); font-size: 10px; font-weight: 600; color: #000; pointer-events: none; }

.group { position: sticky; left: 0; grid-column: 1 / -1; display: flex; align-items: center; gap: 0.45rem; padding: 0.5rem 0.85rem; border-bottom: 1px solid var(--line); background: var(--surface-2); font-weight: 600; color: var(--text); }
.group small { font-weight: 400; color: var(--muted); }

.label { position: sticky; left: 0; z-index: 2; display: flex; align-items: center; gap: 0.5rem; height: 40px; min-width: 0; padding: 0 0.85rem; border: 0; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); background: var(--surface); font: inherit; color: var(--text); text-align: left; cursor: pointer; }
.label:hover { background: var(--surface-2); }
.dot { flex-shrink: 0; width: 8px; height: 8px; border-radius: 50%; }
.code { flex-shrink: 0; font: 500 11px/1 'Geist Mono', monospace; color: var(--muted); }
.title { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.track {
  position: relative; height: 40px; border-bottom: 1px solid var(--line);
  background-image: repeating-linear-gradient(90deg, transparent 0 calc(var(--w) - 1px), color-mix(in srgb, var(--line) 55%, transparent) calc(var(--w) - 1px) var(--w));
}
.track.zoomed { background-image: repeating-linear-gradient(90deg, transparent 0 calc(var(--w) * 7 - 1px), color-mix(in srgb, var(--line) 55%, transparent) calc(var(--w) * 7 - 1px) calc(var(--w) * 7)); }
.today-line { position: absolute; top: 0; bottom: 0; width: 1.5px; translate: -50% 0; background: var(--accent); opacity: 0.8; pointer-events: none; }

.bar {
  position: absolute; top: 8px; height: 24px; display: flex; align-items: center; overflow: hidden; padding: 0 0.55rem;
  border: 1px solid color-mix(in srgb, var(--c) 60%, transparent); border-radius: 6px; background: color-mix(in srgb, var(--c) 18%, var(--surface));
  font: 500 11.5px/1 'Geist', system-ui, sans-serif; color: var(--text); white-space: nowrap; cursor: grab; touch-action: none; user-select: none;
  transition: box-shadow 0.15s ease;
}
.bar:hover { box-shadow: 0 0 0 1px color-mix(in srgb, var(--c) 70%, transparent), 0 4px 12px rgb(0 0 0 / 0.25); }
.bar.dragging { cursor: grabbing; box-shadow: 0 6px 18px rgb(0 0 0 / 0.35); z-index: 1; }
.bar.done { opacity: 0.65; }
.fill { position: absolute; inset: 0 auto 0 0; width: calc(var(--p) * 100%); background: color-mix(in srgb, var(--c) 32%, transparent); pointer-events: none; }
.text { position: relative; overflow: hidden; text-overflow: ellipsis; }
.handle { position: absolute; top: 0; right: 0; bottom: 0; width: 9px; cursor: ew-resize; }
.handle::after { content: ''; position: absolute; top: 6px; bottom: 6px; right: 3px; width: 2px; border-radius: 2px; background: color-mix(in srgb, var(--c) 80%, transparent); opacity: 0; transition: opacity 0.15s ease; }
.bar:hover .handle::after { opacity: 1; }
.tip { position: absolute; top: -2px; z-index: 2; translate: 0 -100%; padding: 0.15rem 0.45rem; border-radius: 5px; background: var(--text); font-size: 11px; color: var(--bg); white-space: nowrap; pointer-events: none; }

.empty { margin: 0; padding: 2rem; border: 1px dashed var(--line); border-radius: 10px; text-align: center; color: var(--muted); }
.undated summary { font-size: 12.5px; color: var(--muted); cursor: pointer; }
.undated button { display: block; padding: 0.3rem 0; border: 0; background: none; font-size: 13px; color: var(--text); cursor: pointer; }
.undated small { color: var(--muted); }
:is(.label, .bar, .undated button, .seg button, .ghost):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: -2px; }
@media (max-width: 640px) { .hint { display: none; } }
</style>
