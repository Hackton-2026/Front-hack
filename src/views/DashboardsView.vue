<script setup>
import { computed, onMounted, ref } from 'vue'
import { gsap, prefersReducedMotion } from '../utils/motion'
import { useWorkspace } from '../composables/useWorkspace'
import { useUi } from '../composables/useUi'
import AppIcon from '../components/app/AppIcon.vue'
import ProjectIcon from '../components/app/ProjectIcon.vue'
import ProgressRing from '../components/app/ProgressRing.vue'

const { state, progress, tasksOf, isOverdue, today, day, project, code, doneRatio, member } = useWorkspace()
const { openTask } = useUi()
const root = ref(null)
const editing = ref(false)
const WIDGETS = { projects: 'Progresso dos projetos', due: 'Prazos dos próximos 7 dias', load: 'Carga por pessoa', cycles: 'Ciclos ativos', activity: 'Atividade recente' }
state.prefs.dash ||= { order: Object.keys(WIDGETS), hidden: [] }
const dash = state.prefs.dash
Object.keys(WIDGETS).forEach((k) => dash.order.includes(k) || dash.order.push(k))
const pos = (k) => dash.order.indexOf(k)
const shown = (k) => !dash.hidden.includes(k)
const toggle = (k) => { dash.hidden = shown(k) ? [...dash.hidden, k] : dash.hidden.filter((h) => h !== k) }
function move(k, dir) {
  const o = [...dash.order], i = o.indexOf(k), j = i + dir
  if (j < 0 || j >= o.length) return
  ;[o[i], o[j]] = [o[j], o[i]]
  dash.order = o
}
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
const load = computed(() => state.people.map((m) => ({ ...m, open: tasks.value.filter((t) => t.status !== 'done' && t.assignees.includes(m.id)).length, late: tasks.value.filter((t) => isOverdue(t) && t.assignees.includes(m.id)).length })).filter((m) => m.open).sort((a, b) => b.open - a.open))
const maxLoad = computed(() => Math.max(1, ...load.value.map((m) => m.open)))
const task = (id) => state.tasks.find((t) => t.id === id)
const recent = computed(() => state.activity.slice(0, 8))
const ago = (iso) => { const m = Math.round((Date.now() - new Date(iso)) / 6e4); return m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} d` }
const fmt = (d) => (d === today() ? 'Hoje' : new Date(`${d}T12:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }))

onMounted(() => {
  if (!root.value) return
  const nums = root.value.querySelectorAll('.kpi b')
  if (prefersReducedMotion()) return
  gsap.from(root.value.querySelectorAll('.card, .kpi'), { y: 14, autoAlpha: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out' })
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
    <div class="pg-bar">
      <strong>Painel do workspace</strong><span class="pg-muted">{{ state.workspaceName }}</span>
      <div class="pg-bar__right"><button type="button" class="pg-btn" :class="{ primary: editing }" :aria-pressed="editing" @click="editing = !editing"><AppIcon name="grid" :size="14" />{{ editing ? 'Pronto' : 'Personalizar' }}</button></div>
    </div>
    <div v-if="editing" class="custom" aria-label="Blocos do painel">
      <div v-for="(k, i) in dash.order" :key="k" class="wd" :class="{ off: !shown(k) }">
        <label><input type="checkbox" :checked="shown(k)" @change="toggle(k)" />{{ WIDGETS[k] }}</label>
        <button type="button" class="pg-icon" :disabled="i === 0" :aria-label="`Subir ${WIDGETS[k]}`" @click="move(k, -1)">↑</button>
        <button type="button" class="pg-icon" :disabled="i === dash.order.length - 1" :aria-label="`Descer ${WIDGETS[k]}`" @click="move(k, 1)">↓</button>
      </div>
    </div>
    <div class="kpis">
      <div v-for="k in KPIS" :key="k.label" class="kpi" :class="{ 'is-warn': k.warn && k.n }">
        <span class="kpi__ic"><AppIcon :name="k.icon" :size="17" /></span>
        <b>{{ k.n }}</b><span>{{ k.label }}</span>
      </div>
    </div>
    <div class="grid">
      <section v-if="shown('projects')" class="card" :style="{ order: pos('projects') }">
        <header><h2>Progresso dos projetos</h2></header>
        <p v-if="!state.projects.length" class="pg-muted">Nenhum projeto ainda.</p>
        <ul class="plist">
          <li v-for="p in state.projects" :key="p.id">
            <RouterLink :to="`/projetos/${p.id}/visao-geral`"><ProjectIcon :icon="p.icon" :color="p.color" :size="15" />{{ p.name }}</RouterLink>
            <span class="pg-muted">{{ tasksOf(p.id).filter((t) => t.status === 'done').length }}/{{ tasksOf(p.id).length }}</span>
            <span class="pbar"><span :data-v="progress(p.id)" :style="{ transform: `scaleX(${progress(p.id)})` }" /></span>
          </li>
        </ul>
      </section>
      <section v-if="shown('due')" class="card" :style="{ order: pos('due') }">
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
      <section v-if="shown('load')" class="card" :style="{ order: pos('load') }">
        <header><h2>Carga por pessoa</h2><span class="pg-muted">abertos · atrasados</span></header>
        <p v-if="!load.length" class="pg-muted">Ninguém com itens abertos.</p>
        <ul class="plist">
          <li v-for="m in load" :key="m.id">
            <span class="who"><i class="dot" :style="{ background: m.color }" />{{ member(m.id)?.name }}</span>
            <span class="pg-muted">{{ m.open }}<template v-if="m.late"> · <b class="late">{{ m.late }}</b></template></span>
            <span class="pbar"><span :data-v="m.open / maxLoad" :style="{ transform: `scaleX(${m.open / maxLoad})` }" /></span>
          </li>
        </ul>
      </section>
      <section v-if="shown('activity')" class="card" :style="{ order: pos('activity') }">
        <header><h2>Atividade recente</h2></header>
        <p v-if="!recent.length" class="pg-muted">Nada aconteceu ainda.</p>
        <ul class="due">
          <li v-for="a in recent" :key="a.id">
            <button type="button" :disabled="!task(a.taskId)" @click="openTask(task(a.taskId))"><span class="t">{{ a.text }}</span></button>
            <time>{{ ago(a.at) }}</time>
          </li>
        </ul>
      </section>
      <section v-if="shown('cycles')" class="card wide" :style="{ order: pos('cycles') }">
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
.custom { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1rem 1.25rem 0; padding: 0.75rem; border: 1px dashed var(--line-strong); border-radius: 12px; }
.wd { display: flex; align-items: center; gap: 0.2rem; padding: 0.25rem 0.3rem 0.25rem 0.6rem; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); font-size: 13px; }
.wd.off { opacity: 0.55; }
.wd label { display: flex; align-items: center; gap: 0.4rem; margin-right: 0.3rem; cursor: pointer; }
.wd input { accent-color: var(--accent); }
.pg-icon:disabled { opacity: 0.3; }
.who { display: flex; align-items: center; gap: 0.45rem; }
.dot { width: 9px; height: 9px; border-radius: 50%; }
b.late { color: #ff8a7a; }
.due button:disabled { cursor: default; }
@media (max-width: 900px) { .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } .grid { grid-template-columns: 1fr; } }
</style>
