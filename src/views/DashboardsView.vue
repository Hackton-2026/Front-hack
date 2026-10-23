<script setup>
// Painéis (Plane → Dashboards): números do workspace, progresso de cada projeto, prazos da semana e ciclos ativos
import { computed, onMounted, ref } from 'vue'
import { gsap, prefersReducedMotion } from '../utils/motion'
import { useWorkspace } from '../composables/useWorkspace'
import { useUi } from '../composables/useUi'
import AppIcon from '../components/app/AppIcon.vue'
import ProgressRing from '../components/app/ProgressRing.vue'

const { state, progress, tasksOf, isOverdue, today, day, project, code, doneRatio } = useWorkspace()
const { openTask } = useUi()
const root = ref(null)
const tasks = computed(() => state.tasks.filter((t) => !t.draft))
const weekAgo = day(-7)
const KPIS = computed(() => [
  { label: 'Itens abertos', n: tasks.value.filter((t) => t.status !== 'done').length, icon: 'items' },
  { label: 'Atrasados', n: tasks.value.filter(isOverdue).length, icon: 'pulse', warn: true },
  { label: 'Concluídos na semana', n: tasks.value.filter((t) => t.status === 'done' && (t.completedAt || t.updatedAt).slice(0, 10) >= weekAgo).length, icon: 'check' },
  { label: 'Ciclos ativos', n: state.cycles.filter((c) => c.start_date <= today() && c.end_date >= today()).length, icon: 'cycle' },
])
const soon = computed(() => tasks.value.filter((t) => t.due && t.status !== 'done' && t.due <= day(7)).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 8))
const active = computed(() => state.cycles.filter((c) => c.start_date <= today() && c.end_date >= today()))
const fmt = (d) => (d === today() ? 'Hoje' : new Date(`${d}T12:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }))

onMounted(() => {
  if (!root.value) return
  const nums = root.value.querySelectorAll('.kpi b')
  if (prefersReducedMotion()) return
  gsap.from(root.value.querySelectorAll('.card, .kpi'), { y: 14, autoAlpha: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out' })
  // números contam do zero
  nums.forEach((el) => {
    const end = Number(el.textContent)
    const n = { v: 0 }
    gsap.to(n, { v: end, duration: 1, ease: 'power2.out', onUpdate: () => (el.textContent = Math.round(n.v)) })
  })
  gsap.fromTo(root.value.querySelectorAll('.pbar span'), { scaleX: 0 }, { scaleX: (i, el) => Number(el.dataset.v), duration: 0.9, stagger: 0.05, ease: 'power3.out', delay: 0.2 })
})
</script>

<template>
  <div ref="root" class="pg">
    <div class="pg-bar"><strong>Painel do workspace</strong><span class="pg-muted">{{ state.workspaceName }}</span></div>
    <div class="kpis">
      <div v-for="k in KPIS" :key="k.label" class="kpi" :class="{ 'is-warn': k.warn && k.n }">
        <span class="kpi__ic"><AppIcon :name="k.icon" :size="17" /></span>
        <b>{{ k.n }}</b><span>{{ k.label }}</span>
      </div>
    </div>
    <div class="grid">
      <section class="card">
        <header><h2>Progresso dos projetos</h2></header>
        <p v-if="!state.projects.length" class="pg-muted">Nenhum projeto ainda.</p>
        <ul class="plist">
          <li v-for="p in state.projects" :key="p.id">
            <RouterLink :to="`/projetos/${p.id}/visao-geral`"><span v-if="p.icon">{{ p.icon }}</span><i v-else class="sq" :style="{ background: p.color }" />{{ p.name }}</RouterLink>
            <span class="pg-muted">{{ tasksOf(p.id).filter((t) => t.status === 'done').length }}/{{ tasksOf(p.id).length }}</span>
            <span class="pbar"><span :data-v="progress(p.id)" :style="{ transform: `scaleX(${progress(p.id)})` }" /></span>
          </li>
        </ul>
      </section>
      <section class="card">
        <header><h2>Prazos dos próximos 7 dias</h2></header>
        <p v-if="!soon.length" class="pg-muted">Nada vencendo esta semana.</p>
        <ul class="due">
          <li v-for="t in soon" :key="t.id">
            <button type="button" @click="openTask(t)"><span class="code">{{ code(t) }}</span><span class="t">{{ t.title }}</span></button>
            <span class="pg-tag">{{ project(t.projectId)?.name }}</span>
            <time :class="{ late: isOverdue(t) }">{{ fmt(t.due) }}</time>
          </li>
        </ul>
      </section>
      <section class="card wide">
        <header><h2>Ciclos ativos</h2><RouterLink to="/ciclos" class="pg-muted">ver todos</RouterLink></header>
        <p v-if="!active.length" class="pg-muted">Nenhum ciclo rodando agora.</p>
        <div class="cycles">
          <RouterLink v-for="c in active" :key="c.id" :to="`/projetos/${c.project}/ciclos/${c.id}`" class="cy">
            <ProgressRing :value="doneRatio(tasks.filter((t) => t.cycle === c.id))" :size="40" />
            <span><strong>{{ c.name }}</strong><small>{{ project(c.project)?.name }} · até {{ fmt(c.end_date) }}</small></span>
          </RouterLink>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.9rem; padding: 1.25rem 1.25rem 0; }
.kpi { display: grid; grid-template-columns: auto 1fr; grid-template-rows: auto auto; gap: 0.1rem 0.75rem; align-items: center; padding: 1rem; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); }
.kpi__ic { grid-row: span 2; display: grid; place-items: center; width: 38px; height: 38px; border-radius: 9px; background: var(--surface-2); color: var(--accent-soft); }
.kpi b { font: 700 1.6rem/1 'Geist', system-ui, sans-serif; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
.kpi > span:last-child { font-size: 12.5px; color: var(--muted); }
.kpi.is-warn .kpi__ic { background: rgb(255 91 77 / 0.15); color: #ff8a7a; }
.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; padding: 1rem 1.25rem 1.5rem; }
.card { display: flex; flex-direction: column; gap: 0.75rem; padding: 1rem 1.1rem; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); }
.wide { grid-column: 1 / -1; }
.card header { display: flex; align-items: baseline; justify-content: space-between; }
.card header a { text-decoration: none; }
h2 { margin: 0; font: 600 1rem/1.3 'Geist', system-ui, sans-serif; color: var(--text); }
.plist, .due { display: flex; flex-direction: column; gap: 0.75rem; margin: 0; padding: 0; list-style: none; }
.plist li { display: grid; grid-template-columns: 1fr auto; gap: 0.3rem; font-size: 13.5px; }
.plist a { display: flex; align-items: center; gap: 0.45rem; color: var(--text); text-decoration: none; }
.plist a:hover { color: var(--accent-soft); }
.sq { width: 9px; height: 9px; border-radius: 3px; }
.pbar { grid-column: 1 / -1; height: 6px; overflow: hidden; border-radius: 999px; background: var(--surface-2); }
.pbar span { display: block; height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent-soft)); transform-origin: left; }
.due li { display: flex; align-items: center; gap: 0.6rem; font-size: 13px; }
.due button { display: flex; flex: 1; align-items: center; gap: 0.5rem; min-width: 0; padding: 0; border: 0; background: none; color: var(--text); text-align: left; cursor: pointer; }
.due button:hover .t { color: var(--accent-soft); }
.code { font: 500 11.5px/1 'Geist Mono', monospace; color: var(--muted); }
.t { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
time { font-size: 12px; color: var(--muted); }
time.late { color: #ff8a7a; }
.cycles { display: grid; grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr)); gap: 0.6rem; }
.cy { display: flex; align-items: center; gap: 0.7rem; padding: 0.75rem; border: 1px solid var(--line); border-radius: 10px; color: var(--text); text-decoration: none; transition: border-color 0.2s var(--ease); }
.cy:hover { border-color: var(--accent); }
.cy span { display: flex; flex-direction: column; }
.cy small { font-size: 12px; color: var(--muted); }
:is(.due button, .plist a, .cy):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; border-radius: 6px; }
@media (max-width: 900px) { .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } .grid { grid-template-columns: 1fr; } }
</style>
