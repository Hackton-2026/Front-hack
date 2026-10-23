<script setup>
// Ciclos do Plane: abas Ativo / Próximos / Concluídos, o ciclo ativo com o resumo por grupo de status e o
// gráfico de burn-down. Sem projeto na rota (/ciclos) mostra os ciclos ativos de todos os projetos.
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { gsap, prefersReducedMotion, staggerIn } from '../utils/motion'
import { useWorkspace } from '../composables/useWorkspace'
import { useUi } from '../composables/useUi'
import AppIcon from '../components/app/AppIcon.vue'
import AppModal from '../components/app/AppModal.vue'
import AppSelect from '../components/app/AppSelect.vue'
import ProgressRing from '../components/app/ProgressRing.vue'

const props = defineProps({ id: { type: String, default: '' } })
const router = useRouter()
const { state, project, today, day, doneRatio, createItem, updateItem, removeItem, member } = useWorkspace()
const { ui } = useUi()
const pid = computed(() => Number(props.id) || null)
const p = computed(() => pid.value && project(pid.value))
const TABS = [
  { id: 'active', label: 'Ativo' },
  { id: 'upcoming', label: 'Próximos' },
  { id: 'completed', label: 'Concluídos' },
]
const tab = ref('active')
const q = ref('')
const menu = ref(null)
const collapsed = reactive(new Set())
const root = ref(null)

const phase = (c) => (c.end_date < today() ? 'completed' : c.start_date > today() ? 'upcoming' : 'active')
const mine = computed(() => state.cycles.filter((c) => (!pid.value || c.project === pid.value) && (!q.value || c.name.toLowerCase().includes(q.value.toLowerCase()))))
const count = (t) => mine.value.filter((c) => phase(c) === t).length
const shown = computed(() => mine.value.filter((c) => phase(c) === (pid.value ? tab.value : 'active')))
const tasksOf = (c) => state.tasks.filter((t) => t.cycle === c.id && !t.draft)
const fmt = (d) => new Date(`${d}T12:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
const range = (c) => `${fmt(c.start_date)} – ${fmt(c.end_date)}, ${c.end_date.slice(0, 4)}`
const daysBetween = (a, b) => Math.round((new Date(`${b}T12:00`) - new Date(`${a}T12:00`)) / 864e5)

// Resumo do ciclo: quanto falta, quanto já devia faltar hoje (linha ideal) e os grupos de status
function summary(c) {
  const list = tasksOf(c)
  const scope = list.length
  const pending = list.filter((t) => t.status !== 'done').length
  const total = Math.max(1, daysBetween(c.start_date, c.end_date))
  const elapsed = Math.min(total, Math.max(0, daysBetween(c.start_date, today())))
  const ideal = Math.round(scope * (1 - elapsed / total))
  return {
    scope, pending, ideal, lead: ideal - pending,
    started: list.filter((t) => t.status === 'doing' || t.status === 'review').length,
    unstarted: list.filter((t) => t.status === 'todo').length,
    done: scope - pending,
  }
}

// Burn-down: itens pendentes por dia (um item conta como feito no dia em que foi concluído)
const W = 560, H = 220, PAD = { l: 34, r: 32, t: 12, b: 28 }
function chart(c) {
  const list = tasksOf(c)
  const total = Math.max(1, daysBetween(c.start_date, c.end_date))
  const scope = list.length
  const maxY = Math.max(1, scope)
  const x = (i) => PAD.l + (i / total) * (W - PAD.l - PAD.r)
  const y = (v) => PAD.t + (1 - v / maxY) * (H - PAD.t - PAD.b)
  const doneOn = (t) => t.status === 'done' && (t.completedAt || t.updatedAt || '').slice(0, 10)
  const last = Math.min(total, daysBetween(c.start_date, today()))
  const pts = []
  for (let i = 0; i <= Math.max(0, last); i++) {
    const d = day(daysBetween(today(), c.start_date) + i)
    pts.push([x(i), y(list.filter((t) => !(doneOn(t) && doneOn(t) <= d)).length)])
  }
  const ticks = [...new Set([0, Math.round(maxY / 2), maxY])]
  const labels = [0, Math.round(total / 2), total].map((i) => ({ x: x(i), text: fmt(day(daysBetween(today(), c.start_date) + i)) }))
  return {
    ideal: `M${x(0)},${y(scope)} L${x(total)},${y(0)}`,
    actual: pts.length > 1 ? `M${pts.map((pt) => pt.join(',')).join(' L')}` : '',
    dot: pts.at(-1), todayX: last >= 0 && last <= total ? x(last) : null,
    ticks: ticks.map((v) => ({ y: y(v), v })), labels,
  }
}

// ---- criar / editar
const editing = ref(null)
const form = reactive({ name: '', description: '', start_date: '', end_date: '', project: null })
const err = ref('')
// próximo ciclo: começa no dia seguinte ao fim do último do projeto e dura o mesmo tanto
function openNext() {
  const projectId = pid.value || state.projects[0]?.id
  const last = state.cycles.filter((c) => c.project === projectId).sort((a, b) => b.end_date.localeCompare(a.end_date))[0]
  openForm()
  if (!last) return
  const len = Math.max(1, daysBetween(last.start_date, last.end_date))
  const start = new Date(`${last.end_date}T12:00`); start.setDate(start.getDate() + 1)
  const end = new Date(start); end.setDate(end.getDate() + len)
  const iso = (d) => d.toISOString().slice(0, 10)
  const n = state.cycles.filter((c) => c.project === projectId).length + 1
  Object.assign(form, { name: `Ciclo ${n}`, start_date: iso(start), end_date: iso(end), project: projectId })
}
// linha do tempo: todos os ciclos (do projeto, ou de todos) de 2 semanas atrás até 6 semanas à frente
const TL = { from: day(-14), days: 56 }
const timeline = computed(() => state.cycles.filter((c) => (!pid.value || c.project === pid.value) && c.end_date >= TL.from && c.start_date <= day(TL.days - 14))
  .sort((a, b) => a.start_date.localeCompare(b.start_date))
  .map((c) => {
    const s = Math.max(0, daysBetween(TL.from, c.start_date)), e = Math.min(TL.days, daysBetween(TL.from, c.end_date) + 1)
    return { c, left: (s / TL.days) * 100, width: Math.max(2, ((e - s) / TL.days) * 100), phase: phase(c), pct: doneRatio(tasksOf(c)) }
  }))
const todayPos = (daysBetween(TL.from, today()) / TL.days) * 100
const daysLeft = (c) => Math.max(0, daysBetween(today(), c.end_date))
// carga por pessoa dentro do ciclo (itens abertos)
const loadOf = (c) => {
  const open = tasksOf(c).filter((t) => t.status !== 'done')
  return [...new Set(open.flatMap((t) => t.assignees))].map((id) => ({ id, n: open.filter((t) => t.assignees.includes(id)).length })).sort((a, b) => b.n - a.n)
}
function openForm(c = null) {
  menu.value = null
  editing.value = c || 'new'
  err.value = ''
  Object.assign(form, c ? { name: c.name, description: c.description, start_date: c.start_date, end_date: c.end_date, project: c.project } : { name: '', description: '', start_date: today(), end_date: day(14), project: pid.value || state.projects[0]?.id })
}
async function save() {
  if (!form.name.trim()) return (err.value = 'Dê um nome ao ciclo.')
  if (form.end_date < form.start_date) return (err.value = 'O ciclo termina antes de começar.')
  const body = { ...form, name: form.name.trim() }
  const ok = editing.value === 'new' ? await createItem('cycle', body) : await updateItem('cycle', editing.value, body)
  if (!ok) return
  editing.value = null
  tab.value = phase(body) // mostra a aba onde o ciclo foi parar
}
async function remove(c) {
  menu.value = null
  await removeItem('cycle', c)
}
const open = (c) => router.push(`/projetos/${c.project}/ciclos/${c.id}`)

// GSAP: linhas entram em cascata e a linha do burn-down se desenha
async function animate() {
  await nextTick()
  if (!root.value) return
  staggerIn(root.value.querySelectorAll('.cyc, .pg-row'))
  if (prefersReducedMotion()) return
  gsap.fromTo(root.value.querySelectorAll('.bd__actual'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.2, ease: 'power2.inOut', delay: 0.2 })
  gsap.from(root.value.querySelectorAll('.bd__dot'), { scale: 0, transformOrigin: 'center', duration: 0.4, ease: 'back.out(2)', delay: 1.2 })
}
watch([tab, () => props.id], animate)
watch(() => props.id, () => (tab.value = 'active'))
watch(p, (v) => (ui.crumb = v ? `${v.name} › Ciclos` : ''), { immediate: true })
onMounted(animate)
const onDoc = (e) => !e.target.closest('.menu-wrap') && (menu.value = null)
onMounted(() => addEventListener('click', onDoc))
onUnmounted(() => removeEventListener('click', onDoc))
</script>

<template>
  <div ref="root" class="pg">
    <div class="pg-bar">
      <div v-if="pid" class="pg-tabs" role="tablist" aria-label="Ciclos">
        <button v-for="t in TABS" :key="t.id" type="button" role="tab" :aria-selected="tab === t.id" @click="tab = t.id">{{ t.label }}<span class="n">{{ count(t.id) }}</span></button>
      </div>
      <strong v-else>Ciclos ativos de todos os projetos</strong>
      <div class="pg-bar__right">
        <label class="pg-search"><AppIcon name="search" :size="14" /><input v-model="q" placeholder="Buscar ciclos" aria-label="Buscar ciclos" /></label>
        <button v-if="state.projects.length" type="button" class="pg-btn" @click="openNext"><AppIcon name="cycle" :size="14" />Próximo ciclo</button>
        <button v-if="state.projects.length" type="button" class="pg-btn primary" @click="openForm()"><AppIcon name="plus" :size="14" />Adicionar ciclo</button>
      </div>
    </div>

    <section v-if="timeline.length" class="tl" aria-label="Linha do tempo dos ciclos">
      <div class="tl__head"><strong>Linha do tempo</strong><span class="pg-muted">2 semanas atrás → 6 semanas à frente</span></div>
      <div class="tl__track">
        <span class="tl__today" :style="{ left: `${todayPos}%` }"><small>hoje</small></span>
        <button v-for="b in timeline" :key="b.c.id" type="button" class="tl__bar" :class="b.phase" :style="{ left: `${b.left}%`, width: `${b.width}%` }" :title="`${b.c.name} · ${range(b.c)} · ${Math.round(b.pct * 100)}% concluído`" @click="open(b.c)">
          <i :style="{ width: `${b.pct * 100}%` }" /><span>{{ b.c.name }}{{ !pid ? ` · ${project(b.c.project)?.name || ''}` : '' }}</span>
        </button>
      </div>
    </section>
    <template v-if="shown.length">
      <template v-if="!pid || tab === 'active'">
        <article v-for="c in shown" :key="c.id" class="cyc">
          <header class="cyc__head">
            <button type="button" class="pg-icon" :aria-expanded="!collapsed.has(c.id)" :aria-label="collapsed.has(c.id) ? 'Expandir ciclo' : 'Recolher ciclo'" @click="collapsed.has(c.id) ? collapsed.delete(c.id) : collapsed.add(c.id)"><AppIcon name="chevron" :size="15" class="chev" /></button>
            <ProgressRing :value="doneRatio(tasksOf(c))" :size="46" />
            <button type="button" class="cyc__name" @click="open(c)">{{ c.name }}</button>
            <span v-if="!pid" class="pg-tag">{{ project(c.project)?.name }}</span>
            <span class="pg-pill cyc__date"><AppIcon name="calendar" :size="13" />{{ range(c) }}</span>
            <span v-if="phase(c) === 'active'" class="left" :class="{ hot: daysLeft(c) <= 2 }">{{ daysLeft(c) === 0 ? 'termina hoje' : `faltam ${daysLeft(c)} d` }}</span>
            <span v-if="loadOf(c).length" class="load" :title="loadOf(c).map((l) => `${member(l.id)?.name || '?'}: ${l.n}`).join(' · ')">
              <span v-for="l in loadOf(c).slice(0, 4)" :key="l.id" class="load__p" :style="{ '--c': member(l.id)?.color || 'var(--accent)' }">{{ (member(l.id)?.name || '?').slice(0, 2).toUpperCase() }}<b>{{ l.n }}</b></span>
            </span>
            <div class="menu-wrap">
              <button type="button" class="pg-icon" :aria-expanded="menu === c.id" aria-label="Opções do ciclo" @click="menu = menu === c.id ? null : c.id"><AppIcon name="more" :size="16" /></button>
              <div v-if="menu === c.id" class="pg-menu" role="menu">
                <button type="button" role="menuitem" @click="open(c)"><AppIcon name="items" :size="14" />Ver itens</button>
                <button type="button" role="menuitem" @click="openForm(c)"><AppIcon name="draft" :size="14" />Editar</button>
                <button type="button" role="menuitem" class="danger" @click="remove(c)"><AppIcon name="trash" :size="14" />Apagar</button>
              </div>
            </div>
          </header>
          <div v-if="!collapsed.has(c.id)" class="cyc__body">
            <section class="sum" :aria-label="`Resumo de ${c.name}`">
              <p class="sum__cap">Resumo dos itens deste ciclo</p>
              <p class="sum__lead" :class="{ 'is-behind': summary(c).lead < 0 }">
                <AppIcon :name="summary(c).lead < 0 ? 'pulse' : 'arrow'" :size="18" />
                {{ summary(c).scope === 0 ? 'Nenhum item no ciclo ainda' : summary(c).lead === 0 ? 'No ritmo ideal' : summary(c).lead > 0 ? `À frente por ${summary(c).lead} ${summary(c).lead === 1 ? 'item' : 'itens'}` : `Atrás por ${-summary(c).lead} ${summary(c).lead === -1 ? 'item' : 'itens'}` }}
              </p>
              <p class="sum__cap">Itens no gráfico</p>
              <ul class="legend">
                <li><i class="l-ideal" />Pendentes ideais hoje<b>{{ summary(c).ideal }}</b></li>
                <li><i class="l-pend" />Pendentes<b class="badge g">{{ summary(c).pending }}</b></li>
                <li><i class="l-start" />Iniciados<b class="badge o">{{ summary(c).started }}</b></li>
                <li><i class="l-scope" />Escopo<b>{{ summary(c).scope }}</b></li>
              </ul>
              <p class="sum__cap">Outros grupos</p>
              <ul class="legend plain">
                <li>Concluídos<b>{{ summary(c).done }}</b></li>
                <li>Não iniciados<b>{{ summary(c).unstarted }}</b></li>
              </ul>
            </section>
            <figure class="bd">
              <figcaption>Burn-down <span>dos itens de trabalho</span></figcaption>
              <svg :viewBox="`0 0 ${W} ${H}`" role="img" :aria-label="`Burn-down: ${summary(c).pending} de ${summary(c).scope} itens pendentes`">
                <g v-for="t in chart(c).ticks" :key="t.v"><line :x1="PAD.l" :x2="W - PAD.r" :y1="t.y" :y2="t.y" class="bd__grid" /><text :x="PAD.l - 8" :y="t.y + 4" text-anchor="end">{{ t.v }}</text></g>
                <text v-for="l in chart(c).labels" :key="l.x" :x="l.x" :y="H - 8" text-anchor="middle">{{ l.text }}</text>
                <line v-if="chart(c).todayX" :x1="chart(c).todayX" :x2="chart(c).todayX" :y1="PAD.t" :y2="H - PAD.b" class="bd__today" />
                <path :d="chart(c).ideal" class="bd__ideal" />
                <path v-if="chart(c).actual" :d="chart(c).actual" class="bd__actual" />
                <circle v-if="chart(c).dot" :cx="chart(c).dot[0]" :cy="chart(c).dot[1]" r="4" class="bd__dot" />
              </svg>
            </figure>
          </div>
        </article>
      </template>
      <div v-else class="pg-rows">
        <div v-for="c in shown" :key="c.id" class="pg-row">
          <ProgressRing :value="doneRatio(tasksOf(c))" :size="32" />
          <a class="pg-row__main" href="#" @click.prevent="open(c)"><span>{{ c.name }}</span></a>
          <div class="pg-row__side">
            <span class="pg-muted pg-hide-sm">{{ tasksOf(c).length }} {{ tasksOf(c).length === 1 ? 'item' : 'itens' }}</span>
            <span class="pg-pill"><AppIcon name="calendar" :size="13" />{{ range(c) }}</span>
            <button type="button" class="pg-icon" aria-label="Editar ciclo" @click="openForm(c)"><AppIcon name="draft" :size="15" /></button>
            <button type="button" class="pg-icon" aria-label="Apagar ciclo" @click="remove(c)"><AppIcon name="trash" :size="15" /></button>
          </div>
        </div>
      </div>
    </template>
    <div v-else class="pg-empty">
      <span class="pg-empty__art"><AppIcon name="cycle" :size="36" /></span>
      <h2>{{ !state.projects.length ? 'Crie um projeto primeiro' : tab === 'completed' ? 'Nenhum ciclo concluído' : tab === 'upcoming' ? 'Nenhum ciclo programado' : 'Nenhum ciclo ativo' }}</h2>
      <p>Ciclos são sprints com começo e fim: escolha as tarefas da vez e acompanhe o burn-down até o último dia.</p>
      <button v-if="state.projects.length" type="button" class="pg-btn primary" @click="openForm()"><AppIcon name="plus" :size="14" />Criar ciclo</button>
    </div>

    <AppModal :open="!!editing" :title="editing === 'new' ? 'Novo ciclo' : 'Editar ciclo'" @close="editing = null" @submit="save">
      <label class="f"><span>Nome</span><input v-model="form.name" placeholder="Ex.: Sprint 3: pagamentos" maxlength="120" /></label>
      <label v-if="!pid && editing === 'new'" class="f"><span>Projeto</span><AppSelect v-model="form.project" :options="state.projects.map((x) => ({ value: x.id, label: x.name }))" block /></label>
      <label class="f"><span>Descrição</span><textarea v-model="form.description" rows="2" placeholder="Objetivo do ciclo (opcional)" /></label>
      <div class="row2">
        <label class="f"><span>Começa</span><input v-model="form.start_date" type="date" required /></label>
        <label class="f"><span>Termina</span><input v-model="form.end_date" type="date" required /></label>
      </div>
      <p v-if="err" class="err" role="alert">{{ err }}</p>
      <template #footer>
        <button type="button" class="btn" @click="editing = null">Cancelar</button>
        <button type="submit" class="btn primary">{{ editing === 'new' ? 'Criar ciclo' : 'Salvar' }}</button>
      </template>
    </AppModal>
  </div>
</template>

<style scoped>
.cyc { border-bottom: 1px solid var(--line); }
.cyc__head { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; padding: 0.9rem 1.25rem; border-bottom: 1px solid var(--line); }
.chev { transition: rotate 0.25s var(--ease); }
[aria-expanded='false'] .chev { rotate: -90deg; }
.cyc__name { flex: 1; min-width: 10rem; padding: 0; border: 0; background: none; font: 650 1.25rem/1.25 'Geist', system-ui, sans-serif; letter-spacing: -0.01em; color: var(--text); text-align: left; cursor: pointer; }
.cyc__name:hover { color: var(--accent-soft); }
.cyc__name:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 3px; border-radius: 4px; }
.cyc__date { height: 30px; }
.menu-wrap { position: relative; }
.cyc__body { display: grid; grid-template-columns: minmax(15rem, 19rem) 1fr; }
.sum { display: flex; flex-direction: column; padding: 1rem 1.25rem; border-right: 1px solid var(--line); }
.sum__cap { margin: 0.6rem 0 0.25rem; padding-top: 0.6rem; border-top: 1px solid var(--line); font-size: 12px; color: var(--muted); }
.sum__cap:first-child { margin-top: 0; padding-top: 0; border-top: 0; }
.sum__lead { display: flex; align-items: center; gap: 0.5rem; margin: 0 0 0.25rem; font-size: 1.05rem; font-weight: 600; color: #7fc47a; }
.sum__lead.is-behind { color: #ff8a7a; }
.legend { display: flex; flex-direction: column; gap: 0.15rem; margin: 0; padding: 0; list-style: none; }
.legend li { display: flex; align-items: center; gap: 0.6rem; padding: 0.4rem 0; }
.legend b { margin-left: auto; font-weight: 600; font-variant-numeric: tabular-nums; }
.legend i { width: 14px; height: 0; border-top: 2px solid; }
.l-ideal { border-top-style: dashed !important; border-color: var(--muted); }
.l-pend { border-color: #7fc47a; }
.l-start { border-color: var(--accent); }
.l-scope { border-color: var(--accent-soft); }
.badge { display: grid; place-items: center; min-width: 22px; height: 22px; padding: 0 0.35rem; border-radius: 5px; font-size: 12px; }
.badge.g { background: rgb(127 196 122 / 0.18); color: #a6e0a2; }
.badge.o { background: rgb(229 101 21 / 0.2); color: var(--accent-soft); }
.plain li { padding: 0.45rem 0; }
.bd { margin: 0; padding: 1rem 1.25rem; }
figcaption { margin-bottom: 0.5rem; font-weight: 600; }
figcaption span { margin-left: 0.3rem; font-weight: 400; color: var(--muted); }
.bd svg { width: 100%; height: auto; overflow: visible; }
.bd svg text { fill: var(--muted); font-size: 11px; }
.bd__grid { stroke: var(--line); }
.bd__today { stroke: var(--line-strong); stroke-dasharray: 3 4; }
.bd__ideal { fill: none; stroke: var(--muted); stroke-width: 1.5; stroke-dasharray: 5 5; }
.bd__actual { fill: none; stroke: #7fc47a; stroke-width: 2.5; stroke-linejoin: round; stroke-linecap: round; }
.bd__dot { fill: #7fc47a; stroke: var(--bg); stroke-width: 2; }
@media (max-width: 900px) {
  .cyc__body { grid-template-columns: 1fr; }
  .sum { border-right: 0; border-bottom: 1px solid var(--line); }
}
.tl { margin: 0 1.25rem 0.5rem; padding: 0.8rem 1rem 1rem; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); }
.tl__head { display: flex; align-items: baseline; gap: 0.6rem; margin-bottom: 0.7rem; font-size: 13px; }
.tl__track { position: relative; display: flex; flex-direction: column; gap: 6px; min-height: 28px; padding-top: 14px; }
.tl__today { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--accent); }
.tl__today small { position: absolute; top: -2px; left: 4px; font-size: 10.5px; color: var(--accent-soft); }
.tl__bar { position: relative; height: 24px; margin-left: 0; overflow: hidden; padding: 0; border: 1px solid var(--line-strong); border-radius: 6px; background: var(--surface-2); text-align: left; cursor: pointer; }
.tl__bar i { position: absolute; inset: 0 auto 0 0; background: color-mix(in srgb, var(--accent) 35%, transparent); }
.tl__bar span { position: relative; padding: 0 0.5rem; font-size: 11.5px; font-weight: 500; line-height: 22px; color: var(--text); white-space: nowrap; }
.tl__bar.active { border-color: var(--accent); }
.tl__bar.completed { opacity: 0.6; }
.left { padding: 0.15rem 0.5rem; border-radius: 999px; background: var(--surface-2); font-size: 12px; color: var(--accent-soft); }
.left.hot { color: #ff8a80; }
.load { display: flex; gap: 4px; }
.load__p { display: inline-flex; align-items: center; gap: 3px; padding: 0.1rem 0.4rem 0.1rem 0.3rem; border-radius: 999px; background: color-mix(in srgb, var(--c) 20%, transparent); font: 700 10px/1.6 'Lexend', system-ui, sans-serif; color: var(--c); }
.load__p b { font: 600 11px/1 'Geist', system-ui, sans-serif; color: var(--text); }
.tl__bar:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
</style>
