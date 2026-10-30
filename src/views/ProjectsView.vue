<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { EASE, DUR, gsap, prefersReducedMotion, staggerIn } from '../utils/motion'
import { useWorkspace } from '../composables/useWorkspace'
import { useOnboarding } from '../composables/useOnboarding'
import AppIcon from '../components/app/AppIcon.vue'
import ProjectIcon from '../components/app/ProjectIcon.vue'
import { iconClass } from '../components/app/projectIcons'
import Avatars from '../components/app/Avatars.vue'
import AppSelect from '../components/app/AppSelect.vue'
import GooeyButton from '../components/GooeyButton.vue'

const COLORS = ['#e56515', '#fba45c', '#919599', '#f2c46d', '#cdcdcb', '#7fc47a']
const router = useRouter()
const { state, tasksOf, progress, createProject, isOverdue, today, day, starred, toggleStar, peopleOf } = useWorkspace()
const { complete } = useOnboarding()
const name = ref('')
const color = ref(COLORS[0])
const error = ref('')
const root = ref(null)
const q = ref('')
const filter = ref('all')
const sort = ref('star')
const view = ref('cards')

const HEALTH = { late: ['Atrasado', 'var(--danger, #ff8a80)'], risk: ['Em risco', '#f2c46d'], ok: ['No prazo', 'var(--success, #7fc47a)'], empty: ['Sem itens', 'var(--muted)'] }
function info(p) {
  const all = tasksOf(p.id)
  const open = all.filter((t) => t.status !== 'done')
  const late = open.filter(isOverdue).length
  const soon = open.filter((t) => t.due && t.due <= day(3)).length
  const next = open.filter((t) => t.due && t.due >= today()).sort((a, b) => a.due.localeCompare(b.due))[0]
  const cycle = state.cycles.find((c) => c.project === p.id && c.start_date <= today() && c.end_date >= today())
  return {
    total: all.length, open: open.length, done: all.length - open.length, late, pct: progress(p.id), next, cycle,
    health: !all.length ? 'empty' : late ? 'late' : soon ? 'risk' : 'ok',
    people: p.members?.length ? p.members : [...new Set(all.flatMap((t) => t.assignees))],
  }
}
const rows = computed(() => {
  const list = state.projects.map((p) => ({ p, ...info(p) }))
    .filter(({ p, people, late }) => (!q.value || `${p.name} ${p.prefix}`.toLowerCase().includes(q.value.toLowerCase())) && (filter.value === 'all' || (filter.value === 'mine' && people.includes(state.me)) || (filter.value === 'late' && late)))
  const by = { star: (a, b) => Number(starred('project', b.p.id)) - Number(starred('project', a.p.id)) || a.p.name.localeCompare(b.p.name), progress: (a, b) => b.pct - a.pct, late: (a, b) => b.late - a.late, name: (a, b) => a.p.name.localeCompare(b.p.name) }[sort.value]
  return list.sort(by)
})
const fmt = (d) => (d === today() ? 'hoje' : d === day(1) ? 'amanhã' : new Date(`${d}T12:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }))
const daysLeft = (c) => Math.max(0, Math.round((new Date(`${c.end_date}T12:00`) - new Date(`${today()}T12:00`)) / 864e5))

async function create() {
  if (!name.value.trim()) { error.value = 'Dê um nome ao projeto.'; return }
  const p = await createProject(name.value.trim(), color.value)
  if (!p) return
  complete('project')
  router.push(`/projetos/${p.id}`)
}
async function animate() {
  await nextTick()
  if (!root.value) return
  staggerIn(root.value.querySelectorAll('.card, tbody tr'))
  if (!prefersReducedMotion()) root.value.querySelectorAll('.pbar span').forEach((bar) => gsap.fromTo(bar, { scaleX: 0 }, { scaleX: Number(bar.dataset.v), duration: DUR.long, ease: EASE.expo, delay: 0.2 }))
}
watch([view, filter, sort], animate)
onMounted(animate)
</script>

<template>
  <div ref="root" class="pg projects">
    <div class="pg-bar">
      <h1>Projetos <span v-if="state.projects.length" class="count">{{ state.projects.length }}</span></h1>
      <div class="pg-bar__right">
        <label class="pg-search"><AppIcon name="search" :size="14" /><input v-model="q" placeholder="Buscar projeto" aria-label="Buscar projeto" /></label>
        <AppSelect v-model="filter" :options="[{ value: 'all', label: 'Todos' }, { value: 'mine', label: 'Onde eu participo' }, { value: 'late', label: 'Com atraso' }]" size="sm" aria-label="Filtrar projetos" />
        <AppSelect v-model="sort" :options="[{ value: 'star', label: 'Favoritos primeiro' }, { value: 'progress', label: 'Mais avançados' }, { value: 'late', label: 'Mais atrasados' }, { value: 'name', label: 'Nome' }]" size="sm" aria-label="Ordenar projetos" />
        <div class="pg-seg" role="group" aria-label="Visualização">
          <button type="button" :aria-pressed="view === 'cards'" aria-label="Cartões" title="Cartões" @click="view = 'cards'"><AppIcon name="grid" :size="14" /></button>
          <button type="button" :aria-pressed="view === 'table'" aria-label="Tabela" title="Tabela" @click="view = 'table'"><AppIcon name="list" :size="14" /></button>
        </div>
      </div>
    </div>

    <div v-if="view === 'cards'" class="grid">
      <article v-for="r in rows" :key="r.p.id" class="card" :style="{ '--c': r.p.color }">
        <header class="card__top">
          <span class="badge"><ProjectIcon v-if="iconClass(r.p.icon)" :icon="r.p.icon" :size="15" /><template v-else>{{ r.p.name.slice(0, 1) }}</template></span>
          <RouterLink :to="`/projetos/${r.p.id}`" class="name">{{ r.p.name }}</RouterLink>
          <button type="button" class="pg-icon star" :class="{ on: starred('project', r.p.id) }" :aria-pressed="starred('project', r.p.id)" :aria-label="starred('project', r.p.id) ? 'Tirar dos favoritos' : 'Favoritar'" @click="toggleStar('project', r.p.id)"><AppIcon name="star" :size="14" /></button>
        </header>
        <div class="health" :style="{ '--h': HEALTH[r.health][1] }"><i />{{ HEALTH[r.health][0] }}<span class="prefix">{{ r.p.prefix }}</span></div>
        <div class="prog"><div class="pbar"><span :data-v="r.pct" :style="{ transform: `scaleX(${r.pct})` }" /></div><b>{{ Math.round(r.pct * 100) }}%</b></div>
        <dl class="nums">
          <div><dt>Abertas</dt><dd :class="{ zero: !r.open }">{{ r.open }}</dd></div>
          <div><dt>Concluídas</dt><dd :class="{ zero: !r.done }">{{ r.done }}</dd></div>
          <div><dt>Atrasadas</dt><dd :class="{ late: r.late, zero: !r.late }">{{ r.late }}</dd></div>
        </dl>
        <ul class="facts">
          <li><AppIcon name="cycle" :size="13" />{{ r.cycle ? `${r.cycle.name}, faltam ${daysLeft(r.cycle)} d` : 'Sem ciclo ativo' }}</li>
          <li><AppIcon name="calendar" :size="13" />{{ r.next ? `Próximo prazo: ${fmt(r.next.due)}` : 'Nenhum prazo pela frente' }}</li>
        </ul>
        <footer class="foot">
          <Avatars :ids="r.people" />
          <RouterLink :to="`/projetos/${r.p.id}`" class="open">Abrir <AppIcon name="arrow" :size="13" /></RouterLink>
        </footer>
      </article>
      <form class="card new" novalidate @submit.prevent="create">
        <strong>Novo projeto</strong>
        <input v-model="name" placeholder="Nome do projeto" aria-label="Nome do projeto" :aria-invalid="!!error" @input="error = ''" />
        <div class="colors" role="radiogroup" aria-label="Cor">
          <button v-for="c in COLORS" :key="c" type="button" role="radio" :aria-checked="color === c" :style="{ background: c }" :aria-label="`Cor ${c}`" @click="color = c" />
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <GooeyButton type="submit" variant="primary">Criar projeto</GooeyButton>
      </form>
    </div>

    <div v-else class="table-wrap">
      <table>
        <thead><tr><th>Projeto</th><th>Saúde</th><th>Progresso</th><th>Abertas</th><th>Atrasadas</th><th>Próximo prazo</th><th>Ciclo</th><th>Pessoas</th></tr></thead>
        <tbody>
          <tr v-for="r in rows" :key="r.p.id">
            <td><span class="sq" :style="{ background: r.p.color }" /><RouterLink :to="`/projetos/${r.p.id}`" class="name">{{ r.p.name }}</RouterLink><AppIcon v-if="starred('project', r.p.id)" name="star" :size="12" class="tstar" /></td>
            <td><span class="health" :style="{ '--h': HEALTH[r.health][1] }"><i />{{ HEALTH[r.health][0] }}</span></td>
            <td><div class="prog small"><div class="pbar"><span :data-v="r.pct" :style="{ transform: `scaleX(${r.pct})` }" /></div><b>{{ Math.round(r.pct * 100) }}%</b></div></td>
            <td>{{ r.open }}</td>
            <td :class="{ late: r.late }">{{ r.late }}</td>
            <td>{{ r.next ? fmt(r.next.due) : '—' }}</td>
            <td>{{ r.cycle ? r.cycle.name : '—' }}</td>
            <td><Avatars :ids="r.people" /></td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="!rows.length" class="pg-muted none">Nenhum projeto com esse filtro.</p>
  </div>
</template>

<style scoped>
.projects { gap: 1rem; padding-bottom: 2rem; }
h1 { display: flex; align-items: center; gap: 0.5rem; }
.count { padding: 0.05rem 0.45rem; border-radius: 999px; background: var(--surface-2); font-size: 12px; font-weight: 500; color: var(--muted); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr)); gap: 1rem; padding: 0 1.25rem; }
.card { display: flex; flex-direction: column; gap: 0.75rem; padding: 1rem 1.1rem; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); color: var(--text); transition: border-color 0.2s var(--ease), translate 0.25s var(--ease); }
.card:not(.new):hover { border-color: var(--line-strong); translate: 0 -2px; }
.card__top { display: flex; align-items: center; gap: 0.6rem; }
.badge { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 8px; background: color-mix(in srgb, var(--c) 22%, transparent); font-weight: 600; color: var(--c); }
.name { flex: 1; min-width: 0; overflow: hidden; font-size: 15px; font-weight: 600; color: var(--text); text-decoration: none; text-overflow: ellipsis; white-space: nowrap; }
.name:hover { color: var(--accent-soft); }
.star.on, .tstar { color: #f2c46d; }
.health { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 12px; font-weight: 500; color: var(--h); }
.health i { width: 7px; height: 7px; border-radius: 50%; background: var(--h); }
.prefix { margin-left: auto; font: 500 11px/1 'Geist Mono', monospace; color: var(--muted); }
.prog { display: flex; align-items: center; gap: 0.6rem; }
.prog .pbar { flex: 1; }
.prog b { font-size: 12px; font-weight: 600; color: var(--muted); }
.prog.small .pbar { width: 6rem; flex: none; }
.pbar { height: 5px; overflow: hidden; border-radius: 999px; background: var(--surface-2); }
.pbar span { display: block; height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent-soft)); transform-origin: left; }
.nums { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin: 0; }
.nums dt { font-size: 11.5px; color: var(--muted); }
.nums dd { margin: 0; font: 600 1.2rem/1.2 'Geist', system-ui, sans-serif; font-variant-numeric: tabular-nums; }
.nums dd.zero { color: var(--muted); font-weight: 500; }
.late { color: var(--danger, #ff8a80); }
.facts { display: flex; flex-direction: column; gap: 0.3rem; margin: 0; padding: 0; list-style: none; font-size: 12.5px; color: var(--muted); }
.facts li { display: flex; align-items: center; gap: 0.4rem; }
.foot { display: flex; align-items: center; justify-content: space-between; margin-top: auto; }
.open { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 12.5px; color: var(--accent-soft); text-decoration: none; }
.new { border-style: dashed; box-shadow: none; }
.new input { height: 34px; padding: 0 0.6rem; border: 1px solid var(--line-strong); border-radius: 6px; background: var(--bg); font: inherit; color: var(--text); outline: none; }
.new input:focus { border-color: var(--accent); }
.colors { display: flex; gap: 0.4rem; }
.colors button { width: 20px; height: 20px; padding: 0; border: 2px solid transparent; border-radius: 50%; cursor: pointer; }
.colors button[aria-checked='true'] { border-color: var(--text); }
.error { margin: 0; font-size: 12.5px; color: #ffb48a; }
.table-wrap { margin: 0 1.25rem; overflow-x: auto; border: 1px solid var(--line); border-radius: 10px; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { padding: 0.55rem 0.75rem; background: var(--surface); font-size: 11.5px; font-weight: 600; color: var(--muted); text-align: left; white-space: nowrap; }
td { padding: 0.55rem 0.75rem; border-top: 1px solid var(--line); color: var(--text); white-space: nowrap; }
td:first-child { display: flex; align-items: center; gap: 0.5rem; }
.sq { width: 10px; height: 10px; border-radius: 3px; }
.none { padding: 0 1.25rem; }
:is(.name, .open, .colors button):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
</style>
