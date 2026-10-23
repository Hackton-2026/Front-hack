<script setup>
// Início (o "Home" do ClickUp/Plane): números do dia, minhas tarefas por prazo, progresso dos projetos e atividade
import { computed, onMounted, ref } from 'vue'
import { gsap, prefersReducedMotion } from '../utils/motion'
import { useAuth } from '../composables/useAuth'
import { useWorkspace } from '../composables/useWorkspace'
import { useUi } from '../composables/useUi'
import StatusBadge from '../components/app/StatusBadge.vue'
import PriorityFlag from '../components/app/PriorityFlag.vue'

const { user } = useAuth()
const { state, mine, isOverdue, progress, tasksOf, code, today, day } = useWorkspace()
const { openTask } = useUi()
const root = ref(null)
const tab = ref('today')

const hour = new Date().getHours()
const hello = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
const name = computed(() => user.value?.first_name || user.value?.username || '')
const dateLabel = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

const open = computed(() => mine.value.filter((t) => t.status !== 'done'))
const buckets = computed(() => ({
  today: open.value.filter((t) => t.due === today()),
  late: open.value.filter(isOverdue),
  next: open.value.filter((t) => t.due && t.due > today() && t.due <= day(7)),
  none: open.value.filter((t) => !t.due),
}))
const TABS = [
  { id: 'today', label: 'Hoje' },
  { id: 'late', label: 'Atrasadas' },
  { id: 'next', label: 'Próximos 7 dias' },
  { id: 'none', label: 'Sem data' },
]
const stats = computed(() => [
  { label: 'Abertas comigo', value: open.value.length },
  { label: 'Para hoje', value: buckets.value.today.length },
  { label: 'Atrasadas', value: buckets.value.late.length, warn: true },
  { label: 'Concluídas', value: mine.value.filter((t) => t.status === 'done').length },
])
const fmt = (d) => new Date(`${d}T12:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
const ago = (iso) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

onMounted(() => {
  if (prefersReducedMotion()) return
  const q = (s) => root.value.querySelectorAll(s)
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from(q('.hello > *'), { y: 12, autoAlpha: 0, duration: 0.5, stagger: 0.08 })
    .from(q('.stat'), { y: 14, autoAlpha: 0, duration: 0.45, stagger: 0.06 }, '-=0.25')
    .from(q('.panel'), { y: 16, autoAlpha: 0, duration: 0.5, stagger: 0.08 }, '-=0.25')
  // contadores sobem de 0 até o valor
  q('.stat__n').forEach((el) => {
    const to = Number(el.dataset.v)
    const obj = { n: 0 }
    gsap.to(obj, { n: to, duration: 0.9, ease: 'power2.out', delay: 0.35, onUpdate: () => (el.textContent = Math.round(obj.n)) })
  })
  q('.pbar span').forEach((bar) => gsap.from(bar, { scaleX: 0, duration: 1.1, ease: 'expo.out', delay: 0.6 }))
})
</script>

<template>
  <div ref="root" class="page">
    <header class="hello">
      <p class="date">{{ dateLabel }}</p>
      <h1>{{ hello }}{{ name ? `, ${name}` : '' }}</h1>
    </header>

    <div class="stats">
      <div v-for="s in stats" :key="s.label" class="stat" :class="{ warn: s.warn && s.value }">
        <span class="stat__n" :data-v="s.value">{{ s.value }}</span>
        <span class="stat__l">{{ s.label }}</span>
      </div>
    </div>

    <div class="cols">
      <section class="panel mine" aria-labelledby="mine-title">
        <header class="panel__head">
          <h2 id="mine-title">Minhas tarefas</h2>
          <RouterLink to="/meu-trabalho">Ver tudo</RouterLink>
        </header>
        <div class="tabs" role="tablist">
          <button v-for="t in TABS" :key="t.id" type="button" role="tab" :aria-selected="tab === t.id" @click="tab = t.id">{{ t.label }} <span>{{ buckets[t.id].length }}</span></button>
        </div>
        <ul class="rows">
          <li v-for="t in buckets[tab]" :key="t.id">
            <button type="button" class="row" @click="openTask(t)">
              <StatusBadge :status="t.status" compact />
              <span class="row__title">{{ t.title }}</span>
              <span class="row__code">{{ code(t) }}</span>
              <PriorityFlag :priority="t.priority" />
              <span class="row__due" :class="{ late: isOverdue(t) }">{{ t.due ? fmt(t.due) : '' }}</span>
            </button>
          </li>
          <li v-if="!buckets[tab].length" class="empty">{{ tab === 'late' ? 'Nada atrasado. Ótimo!' : 'Nenhuma tarefa aqui.' }}</li>
        </ul>
      </section>

      <div class="side">
        <section class="panel" aria-labelledby="proj-title">
          <header class="panel__head"><h2 id="proj-title">Projetos</h2><RouterLink to="/projetos">Abrir</RouterLink></header>
          <RouterLink v-for="p in state.projects" :key="p.id" :to="`/projetos/${p.id}`" class="proj">
            <span class="proj__name"><span class="sq" :style="{ background: p.color }" />{{ p.name }}</span>
            <span class="proj__pct">{{ tasksOf(p.id).filter((t) => t.status === 'done').length }}/{{ tasksOf(p.id).length }}</span>
            <span class="pbar"><span :style="{ transform: `scaleX(${progress(p.id)})` }" /></span>
          </RouterLink>
        </section>
        <section class="panel" aria-labelledby="act-title">
          <header class="panel__head"><h2 id="act-title">Atividade recente</h2></header>
          <ol class="log">
            <li v-for="a in state.activity.slice(0, 6)" :key="a.id"><span>{{ a.text }}</span><time>{{ ago(a.at) }}</time></li>
            <li v-if="!state.activity.length" class="empty">Crie ou mova uma tarefa e a atividade do time aparece aqui.</li>
          </ol>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 1.5rem; max-width: 72rem; margin: 0 auto; padding: 2rem 1.5rem 3rem; }
.date { margin: 0 0 0.2rem; font-size: 13px; color: var(--muted); }
.date::first-letter { text-transform: uppercase; }
h1 { margin: 0; font: 700 clamp(1.5rem, 2.4vw, 1.875rem)/1.2 'Geist', system-ui, sans-serif; letter-spacing: -0.02em; color: var(--text); }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); gap: 0.75rem; }
.stat { display: flex; flex-direction: column; gap: 0.15rem; padding: 0.9rem 1rem; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
.stat__n { font: 700 1.75rem/1.1 'Geist', system-ui, sans-serif; font-variant-numeric: tabular-nums; color: var(--text); }
.stat__l { font-size: 12.5px; color: var(--muted); }
.stat.warn .stat__n { color: #ff8a80; }
.cols { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); gap: 1rem; align-items: start; }
@media (max-width: 1000px) { .cols { grid-template-columns: minmax(0, 1fr); } }
.side { display: flex; flex-direction: column; gap: 1rem; }
.panel { padding: 1rem; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
.panel__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.6rem; }
h2 { margin: 0; font: 600 14px/1.2 'Geist', system-ui, sans-serif; color: var(--text); }
.panel__head a { font-size: 12.5px; color: var(--accent-soft); text-decoration: none; }
.tabs { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-bottom: 0.5rem; }
.tabs button { padding: 0.3rem 0.6rem; border: 0; border-radius: 6px; background: none; font-size: 12.5px; color: var(--muted); cursor: pointer; }
.tabs button[aria-selected='true'] { background: var(--surface-2); color: var(--text); }
.tabs span { margin-left: 0.15rem; color: var(--muted); }
.rows { margin: 0; padding: 0; list-style: none; }
.row { display: flex; align-items: center; gap: 0.6rem; width: 100%; padding: 0.55rem 0.5rem; border: 0; border-radius: 6px; background: none; text-align: left; cursor: pointer; }
.row:hover { background: var(--surface-2); }
.row__title { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.row__code { font: 500 11px/1 'Geist Mono', monospace; color: var(--muted); }
.row__due { min-width: 3.5rem; font-size: 12px; text-align: right; color: var(--muted); }
.row__due.late { color: #ff8a80; }
.empty { padding: 1rem 0.5rem; font-size: 13px; color: var(--muted); }
.proj { display: grid; grid-template-columns: 1fr auto; gap: 0.35rem; padding: 0.5rem; border-radius: 6px; color: var(--text); text-decoration: none; }
.proj:hover { background: var(--surface-2); }
.proj__name { display: flex; align-items: center; gap: 0.5rem; }
.proj__pct { font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }
.sq { width: 10px; height: 10px; border-radius: 3px; }
.pbar { grid-column: 1 / -1; height: 4px; overflow: hidden; border-radius: 999px; background: var(--surface-2); }
.pbar span { display: block; height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent-soft)); transform-origin: left; }
.log { display: flex; flex-direction: column; gap: 0.55rem; margin: 0; padding: 0 0 0 0.85rem; border-left: 1px solid var(--line); list-style: none; }
.log li { display: flex; flex-direction: column; font-size: 12.5px; }
.log time { font-size: 11.5px; color: var(--muted); }
:is(.tabs button, .row, .proj, .panel__head a):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
</style>
