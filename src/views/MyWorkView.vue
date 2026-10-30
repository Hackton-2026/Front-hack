<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { EASE, DUR, gsap, prefersReducedMotion, staggerIn } from '../utils/motion'
import { useWorkspace } from '../composables/useWorkspace'
import { useUi } from '../composables/useUi'
import AppIcon from '../components/app/AppIcon.vue'
import StatusBadge from '../components/app/StatusBadge.vue'
import PriorityFlag from '../components/app/PriorityFlag.vue'
import TaskBoard from '../components/app/TaskBoard.vue'
import TaskGantt from '../components/app/views/TaskGantt.vue'

const { state, mine, project, code, isOverdue, updateTask, day } = useWorkspace()
const { openTask } = useUi()
const root = ref(null)
const tab = ref('assigned')
const view = ref('list')
const q = ref('')
const weekAgo = day(-7)
const doneAt = (t) => (t.completedAt || t.updatedAt || '').slice(0, 10)
const created = computed(() => state.tasks.filter((t) => !t.draft && t.creator === state.me))
const finished = computed(() => mine.value.filter((t) => t.status === 'done' && doneAt(t) >= weekAgo))
const source = computed(() => ({ assigned: mine.value.filter((t) => t.status !== 'done'), created: created.value.filter((t) => t.status !== 'done'), done: finished.value })[tab.value])
const tasks = computed(() => source.value.filter((t) => !q.value || `${t.title} ${code(t)}`.toLowerCase().includes(q.value.toLowerCase())))

const open = computed(() => mine.value.filter((t) => t.status !== 'done'))
const STATS = computed(() => [
  ['Abertas', open.value.length, 'items', ''],
  ['Atrasadas', open.value.filter(isOverdue).length, 'pulse', 'warn'],
  ['Para hoje', open.value.filter((t) => t.due === day(0)).length, 'calendar', 'accent'],
  ['Concluídas em 7 dias', finished.value.length, 'check', 'good'],
])
const week = computed(() => {
  const offset = (new Date().getDay() + 6) % 7
  return Array.from({ length: 7 }, (_, i) => { const d = day(i - offset); return { d, n: open.value.filter((t) => t.due === d).length, today: d === day(0) } })
})
const maxDay = computed(() => Math.max(3, ...week.value.map((w) => w.n)))

const endOfWeek = computed(() => week.value[6].d)
const BUCKETS = [
  ['late', 'Atrasadas', (t) => isOverdue(t)],
  ['today', 'Hoje', (t) => t.due === day(0)],
  ['week', 'Ainda esta semana', (t) => t.due > day(0) && t.due <= endOfWeek.value],
  ['later', 'Depois', (t) => t.due > endOfWeek.value],
  ['none', 'Sem prazo', (t) => !t.due],
]
const buckets = computed(() => (tab.value === 'done'
  ? [{ id: 'done', label: 'Concluídas nos últimos 7 dias', items: tasks.value }]
  : BUCKETS.map(([id, label, test]) => ({ id, label, items: tasks.value.filter((t) => t.status !== 'done' && test(t)) }))).filter((b) => b.items.length))
const collapsed = ref(new Set())
const toggle = (id) => (collapsed.value.has(id) ? collapsed.value.delete(id) : collapsed.value.add(id))
const fmt = (d) => (d === day(0) ? 'hoje' : d === day(1) ? 'amanhã' : d === day(-1) ? 'ontem' : new Date(`${d}T12:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }))
const weekday = (d) => new Date(`${d}T12:00`).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
const complete = (t) => updateTask(t, { status: t.status === 'done' ? 'todo' : 'done' })

async function animate() {
  await nextTick()
  staggerIn(root.value?.querySelectorAll('.task'))
}
watch([tab, view], animate)
onMounted(() => {
  animate()
  if (!prefersReducedMotion() && root.value) gsap.from(root.value.querySelectorAll('.wk i'), { scaleY: 0, transformOrigin: 'bottom', duration: DUR.mid, stagger: 0.04, ease: EASE.out })
})
</script>

<template>
  <div ref="root" class="pg mywork">
    <div class="pg-bar">
      <h1>Seu trabalho</h1>
      <div class="pg-bar__right">
        <label class="pg-search"><AppIcon name="search" :size="14" /><input v-model="q" placeholder="Buscar nas suas tarefas" aria-label="Buscar nas suas tarefas" /></label>
        <div class="pg-seg" role="group" aria-label="Visualização">
          <button type="button" :aria-pressed="view === 'list'" title="Lista" aria-label="Lista" @click="view = 'list'"><AppIcon name="list" :size="14" /></button>
          <button type="button" :aria-pressed="view === 'board'" title="Quadro" aria-label="Quadro" @click="view = 'board'"><AppIcon name="grid" :size="14" /></button>
          <button type="button" :aria-pressed="view === 'timeline'" title="Linha do tempo" aria-label="Linha do tempo" @click="view = 'timeline'"><AppIcon name="chart" :size="14" /></button>
        </div>
      </div>
    </div>

    <div class="top">
      <div class="stats">
        <div v-for="[label, n, ic, tone] in STATS" :key="label" class="stat" :class="n ? tone : 'zero'"><AppIcon :name="ic" :size="15" /><b>{{ n }}</b><span>{{ label }}</span></div>
      </div>
      <div class="wk" aria-label="Carga da semana">
        <div v-for="w in week" :key="w.d" class="wk__day" :class="{ today: w.today }" :title="`${w.n} tarefa(s) em ${fmt(w.d)}`">
          <span class="wk__bar"><i :style="{ height: `${(w.n / maxDay) * 100}%` }" :class="{ over: w.n > 3 }" /></span>
          <small>{{ weekday(w.d) }}</small>
        </div>
      </div>
    </div>

    <div class="pg-tabs tabs" role="tablist">
      <button v-for="[id, label, n] in [['assigned', 'Atribuídas a mim', mine.filter((t) => t.status !== 'done').length], ['created', 'Criadas por mim', created.filter((t) => t.status !== 'done').length], ['done', 'Concluídas', finished.length]]" :key="id" type="button" role="tab" :aria-selected="tab === id" @click="tab = id">{{ label }}<span v-if="n" class="n">{{ n }}</span></button>
    </div>

    <template v-if="view === 'list'">
      <div v-if="!buckets.length" class="pg-empty">
        <span class="pg-empty__art"><AppIcon name="check" :size="36" /></span>
        <h2>{{ tab === 'done' ? 'Nada concluído na semana ainda' : 'Tudo em dia por aqui' }}</h2>
        <p>{{ q ? `Nenhuma tarefa com "${q}".` : 'Quando alguém atribuir uma tarefa a você, ela aparece aqui, agrupada por quando vence.' }}</p>
      </div>
      <section v-for="b in buckets" :key="b.id" class="bucket" :class="b.id">
        <button type="button" class="bucket__head" :aria-expanded="!collapsed.has(b.id)" @click="toggle(b.id)">
          <AppIcon name="chevron" :size="13" class="chev" /><h2>{{ b.label }}</h2><span class="pg-muted">{{ b.items.length }}</span>
        </button>
        <div v-if="!collapsed.has(b.id)">
          <div v-for="t in b.items" :key="t.id" class="task">
            <button type="button" class="tick" :class="{ done: t.status === 'done' }" :aria-label="t.status === 'done' ? `Reabrir ${t.title}` : `Concluir ${t.title}`" @click="complete(t)"><AppIcon name="check" :size="11" /></button>
            <StatusBadge :status="t.status" compact />
            <span class="code">{{ code(t) }}</span>
            <button type="button" class="title" @click="openTask(t)">{{ t.title }}</button>
            <span v-if="project(t.projectId)" class="pg-pill proj"><i :style="{ background: project(t.projectId).color }" />{{ project(t.projectId).name }}</span>
            <PriorityFlag v-if="t.priority" :priority="t.priority" />
            <span v-if="t.due" class="due" :class="{ late: isOverdue(t), today: t.due === day(0) }">{{ fmt(t.due) }}</span>
          </div>
        </div>
      </section>
    </template>
    <div v-else-if="view === 'board'" class="pad"><TaskBoard :tasks="tasks" /></div>
    <div v-else class="pad"><TaskGantt :tasks="tasks" /></div>
  </div>
</template>

<style scoped>
.mywork { gap: 0.9rem; padding-bottom: 2rem; }
.top { display: flex; flex-wrap: wrap; gap: 1rem; align-items: stretch; padding: 0 1.25rem; }
.stats { display: grid; flex: 1; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: 0.6rem; }
.stat { display: grid; grid-template-columns: auto 1fr; grid-template-rows: auto auto; column-gap: 0.5rem; align-items: center; padding: 0.7rem 0.85rem; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); color: var(--muted); }
.stat b { font: 650 1.4rem/1 'Geist', system-ui, sans-serif; color: var(--text); }
.stat span { grid-column: 1 / -1; font-size: 12px; }
.stat.warn b { color: var(--danger, #ff8a80); } .stat.accent b { color: var(--accent-soft); } .stat.good b { color: var(--success, #7fc47a); }
.stat.zero b { color: var(--muted); font-weight: 500; }
.wk { display: flex; gap: 0.35rem; align-items: flex-end; padding: 0.6rem 0.8rem; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
.wk__day { display: flex; flex-direction: column; align-items: center; gap: 0.3rem; }
.wk__bar { display: flex; align-items: flex-end; width: 18px; height: 52px; border-radius: 5px; background: var(--surface-2); overflow: hidden; }
.wk__bar i { display: block; width: 100%; border-radius: 5px; background: var(--accent-soft); }
.wk__bar i.over { background: var(--danger, #ff8a80); }
.wk__day small { font-size: 10.5px; color: var(--muted); text-transform: capitalize; }
.wk__day.today small { color: var(--accent-soft); font-weight: 600; }
.tabs { padding: 0 1.25rem; }
.bucket__head { display: flex; align-items: center; gap: 0.5rem; width: 100%; padding: 0.45rem 1.25rem; border: 0; background: none; color: var(--text); cursor: pointer; text-align: left; }
.bucket__head h2 { margin: 0; font-size: 12.5px; font-weight: 600; }
.bucket.late h2 { color: var(--danger, #ff8a80); } .bucket.today h2 { color: var(--accent-soft); }
.chev { transition: transform 0.2s var(--ease); }
.bucket__head[aria-expanded='false'] .chev { transform: rotate(-90deg); }
.task { display: flex; align-items: center; gap: 0.6rem; padding: 0.5rem 1.25rem; border-top: 1px solid var(--line); }
.task:hover { background: var(--surface); }
.tick { display: grid; place-items: center; width: 17px; height: 17px; padding: 0; border: 1.5px solid var(--line-strong); border-radius: 5px; background: none; color: transparent; cursor: pointer; }
.tick:hover { border-color: var(--accent); color: var(--accent-soft); }
.tick.done { border-color: var(--accent); background: var(--accent); color: #000; }
.code { font: 500 11.5px/1 'Geist Mono', monospace; color: var(--muted); }
.title { flex: 1; min-width: 0; padding: 0; border: 0; background: none; font: inherit; font-size: 14px; font-weight: 500; color: var(--text); text-align: left; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.title:hover { color: var(--accent-soft); }
.due { padding: 0.15rem 0.5rem; border-radius: 6px; background: var(--surface-2); font-size: 12px; color: var(--muted); }
.due.today { color: var(--accent-soft); } .due.late { color: var(--danger, #ff8a80); }
.pad { padding: 0 1.25rem; }
@media (max-width: 760px) { .proj { display: none; } }
:is(.tick, .title, .bucket__head):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
</style>
