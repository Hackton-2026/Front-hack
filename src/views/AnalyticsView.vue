<script setup>
// Análises do workspace (Plane → Analytics): itens por status, prioridade e pessoa, e criados x concluídos
// no período (7/14/30 dias), KPIs com variação contra o período anterior, tempo de ciclo, etiquetas em alta
// e frases-resumo geradas dos números. Filtra por projeto.
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { gsap, prefersReducedMotion } from '../utils/motion'
import { useWorkspace } from '../composables/useWorkspace'
import AppIcon from '../components/app/AppIcon.vue'
import AppSelect from '../components/app/AppSelect.vue'

const { state, STATUSES, PRIORITIES, member, day } = useWorkspace()
const pid = ref('')
const span = ref(14)
const root = ref(null)

const tasks = computed(() => state.tasks.filter((t) => !t.draft && (!pid.value || t.projectId === Number(pid.value))))
const byStatus = computed(() => STATUSES.map((s) => ({ ...s, n: tasks.value.filter((t) => t.status === s.id).length })))
const byPriority = computed(() => [...PRIORITIES, { id: '', name: 'Sem prioridade', color: '#5d5851' }].map((p) => ({ ...p, n: tasks.value.filter((t) => (t.priority || '') === p.id).length })))
const byPerson = computed(() => state.people.map((m) => {
  const mine = tasks.value.filter((t) => t.assignees.includes(m.id))
  return { ...m, open: mine.filter((t) => t.status !== 'done').length, done: mine.filter((t) => t.status === 'done').length }
}).filter((m) => m.open + m.done).sort((a, b) => b.open + b.done - (a.open + a.done)))
const maxOf = (list, f) => Math.max(1, ...list.map(f))

// KPIs do período contra o período anterior de mesmo tamanho
const doneAt = (t) => (t.completedAt || t.updatedAt).slice(0, 10)
const inRange = (d, from, to) => d >= day(from) && d <= day(to)
function period(back) {
  const from = -span.value * (back + 1) + 1, to = -span.value * back
  const done = tasks.value.filter((t) => t.status === 'done' && inRange(doneAt(t), from, to))
  const cycle = done.map((t) => (new Date(doneAt(t)) - new Date(t.createdAt.slice(0, 10))) / 864e5)
  return {
    created: tasks.value.filter((t) => inRange(t.createdAt.slice(0, 10), from, to)).length,
    done: done.length,
    cycle: cycle.length ? cycle.reduce((a, b) => a + b, 0) / cycle.length : null,
  }
}
const today = day(0)
const kpis = computed(() => {
  const now = period(0), prev = period(1)
  const late = tasks.value.filter((t) => t.status !== 'done' && t.due && t.due < today).length
  return [
    { id: 'created', label: 'Criados', v: now.created, d: now.created - prev.created },
    { id: 'done', label: 'Concluídos', v: now.done, d: now.done - prev.done, good: 1 },
    { id: 'cycle', label: 'Tempo de ciclo', v: now.cycle === null ? '–' : `${now.cycle.toFixed(1)} d`, d: now.cycle === null || prev.cycle === null ? 0 : +(now.cycle - prev.cycle).toFixed(1), good: -1, unit: ' d' },
    { id: 'late', label: 'Atrasados agora', v: late, d: 0 },
  ]
})
const topTags = computed(() => {
  const n = {}
  tasks.value.filter((t) => inRange(t.createdAt.slice(0, 10), 1 - span.value, 0)).forEach((t) => t.tags.forEach((g) => { n[g] = (n[g] || 0) + 1 }))
  return Object.entries(n).sort((a, b) => b[1] - a[1]).slice(0, 6)
})
// frases curtas tiradas dos próprios números
const insights = computed(() => {
  const [c, d, , l] = kpis.value, out = []
  if (c.v || d.v) out.push(d.v >= c.v ? `O time concluiu ${d.v} e criou ${c.v}: a fila está diminuindo.` : `Entraram ${c.v - d.v} itens a mais do que saíram: a fila está crescendo.`)
  if (d.d) out.push(`${Math.abs(d.d)} conclusões ${d.d > 0 ? 'a mais' : 'a menos'} que nos ${span.value} dias anteriores.`)
  if (l.v) out.push(`${l.v} ${l.v === 1 ? 'item está atrasado' : 'itens estão atrasados'}. Vale revisar prazos ou dividir o trabalho.`)
  const top = byPerson.value[0]
  if (top && byPerson.value.length > 1 && top.open > 2 * (byPerson.value[1].open || 1)) out.push(`${member(top.id)?.name} tem ${top.open} itens abertos, bem mais que o resto do time.`)
  if (topTags.value[0]) out.push(`#${topTags.value[0][0]} é o assunto que mais apareceu no período.`)
  return out
})
const deltaClass = (k) => (!k.d || !k.good ? '' : k.d * k.good > 0 ? 'up' : 'down')

// criados x concluídos por dia
const W = 1000, H = 220, PAD = { l: 30, r: 28, t: 10, b: 26 }
const days = computed(() => Array.from({ length: span.value }, (_, i) => day(i - span.value + 1)))
const series = computed(() => {
  const created = days.value.map((d) => tasks.value.filter((t) => t.createdAt.slice(0, 10) === d).length)
  const done = days.value.map((d) => tasks.value.filter((t) => t.status === 'done' && doneAt(t) === d).length)
  const max = Math.max(1, ...created, ...done)
  const last = span.value - 1
  const x = (i) => PAD.l + (i / last) * (W - PAD.l - PAD.r)
  const y = (v) => PAD.t + (1 - v / max) * (H - PAD.t - PAD.b)
  const line = (arr) => `M${arr.map((v, i) => `${x(i)},${y(v)}`).join(' L')}`
  return { created: line(created), done: line(done), area: `${line(created)} L${x(last)},${y(0)} L${x(0)},${y(0)}Z`, max, y, totals: [created.reduce((a, b) => a + b, 0), done.reduce((a, b) => a + b, 0)], labels: [0, Math.floor(last / 2), last].map((i) => ({ x: x(i), t: new Date(`${days.value[i]}T12:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) })) }
})

async function animate() {
  await nextTick()
  if (prefersReducedMotion() || !root.value) return
  gsap.fromTo(root.value.querySelectorAll('.bar i'), { scaleX: 0 }, { scaleX: 1, transformOrigin: 'left', duration: 0.8, stagger: 0.03, ease: 'power3.out' })
  gsap.fromTo(root.value.querySelectorAll('.ln'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.1, ease: 'power2.inOut' })
  gsap.fromTo(root.value.querySelectorAll('.area'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, delay: 0.4 })
}
watch([pid, span], animate)
onMounted(() => {
  animate()
  if (!prefersReducedMotion()) gsap.from(root.value.querySelectorAll('.card'), { y: 14, autoAlpha: 0, duration: 0.5, stagger: 0.07, ease: 'power3.out' })
})
</script>

<template>
  <div ref="root" class="pg">
    <div class="pg-bar">
      <strong>Análises</strong>
      <div class="pg-bar__right">
        <div class="pg-seg" role="group" aria-label="Período">
          <button v-for="n in [7, 14, 30]" :key="n" type="button" :aria-pressed="span === n" @click="span = n">{{ n }} dias</button>
        </div>
        <AppSelect v-model="pid" :options="[{ value: '', label: 'Todos os projetos' }, ...state.projects.map((p) => ({ value: p.id, label: p.name }))]" size="sm" aria-label="Projeto" />
      </div>
    </div>
    <div class="kpis">
      <div v-for="k in kpis" :key="k.id" class="kpi">
        <small>{{ k.label }}</small>
        <strong>{{ k.v }}</strong>
        <span v-if="k.d" class="delta" :class="deltaClass(k)">{{ k.d > 0 ? '▲' : '▼' }} {{ Math.abs(k.d) }}{{ k.unit || '' }} vs {{ span }} d antes</span>
        <span v-else class="delta">{{ k.id === 'late' ? 'hoje' : 'igual ao período anterior' }}</span>
      </div>
    </div>
    <ul v-if="insights.length" class="insights" aria-label="Resumo">
      <li v-for="t in insights" :key="t"><AppIcon name="bolt" :size="14" />{{ t }}</li>
    </ul>
    <div class="grid">
      <section class="card wide">
        <header><h2>Criados x concluídos</h2><span class="pg-muted">últimos {{ span }} dias</span></header>
        <p class="legend"><span><i class="c1" />Criados <b>{{ series.totals[0] }}</b></span><span><i class="c2" />Concluídos <b>{{ series.totals[1] }}</b></span></p>
        <svg :viewBox="`0 0 ${W} ${H}`" role="img" :aria-label="`${series.totals[0]} criados e ${series.totals[1]} concluídos nos últimos ${span} dias`">
          <g v-for="v in [0, Math.ceil(series.max / 2), series.max]" :key="v"><line :x1="PAD.l" :x2="W - PAD.r" :y1="series.y(v)" :y2="series.y(v)" class="grid-ln" /><text :x="PAD.l - 8" :y="series.y(v) + 4" text-anchor="end">{{ v }}</text></g>
          <text v-for="l in series.labels" :key="l.x" :x="l.x" :y="H - 6" text-anchor="middle">{{ l.t }}</text>
          <path :d="series.area" class="area" />
          <path :d="series.created" class="ln c1" />
          <path :d="series.done" class="ln c2" />
        </svg>
      </section>
      <section class="card">
        <header><h2>Por status</h2><span class="pg-muted">{{ tasks.length }} itens</span></header>
        <ul class="bars"><li v-for="s in byStatus" :key="s.id"><span>{{ s.name }}</span><b>{{ s.n }}</b><span class="bar"><i :style="{ width: `${(s.n / maxOf(byStatus, (x) => x.n)) * 100}%`, background: s.color }" /></span></li></ul>
      </section>
      <section class="card">
        <header><h2>Por prioridade</h2></header>
        <ul class="bars"><li v-for="p in byPriority" :key="p.id"><span>{{ p.name }}</span><b>{{ p.n }}</b><span class="bar"><i :style="{ width: `${(p.n / maxOf(byPriority, (x) => x.n)) * 100}%`, background: p.color }" /></span></li></ul>
      </section>
      <section class="card wide">
        <header><h2>Por pessoa</h2><span class="pg-muted">abertos e concluídos</span></header>
        <p v-if="!byPerson.length" class="pg-muted">Ninguém com itens ainda.</p>
        <ul class="bars people">
          <li v-for="m in byPerson" :key="m.id">
            <span><i class="av" :style="{ background: m.color }" />{{ member(m.id)?.name }}</span><b>{{ m.open }} / {{ m.done }}</b>
            <span class="bar stack"><i :style="{ width: `${(m.open / maxOf(byPerson, (x) => x.open + x.done)) * 100}%`, background: 'var(--accent-soft)' }" /><i :style="{ width: `${(m.done / maxOf(byPerson, (x) => x.open + x.done)) * 100}%`, background: 'var(--accent)' }" /></span>
          </li>
        </ul>
      </section>
      <section class="card wide">
        <header><h2>Etiquetas em alta</h2><span class="pg-muted">criados no período</span></header>
        <p v-if="!topTags.length" class="pg-muted">Nenhuma etiqueta usada no período.</p>
        <ul v-else class="bars"><li v-for="[g, n] in topTags" :key="g"><span>#{{ g }}</span><b>{{ n }}</b><span class="bar"><i :style="{ width: `${(n / topTags[0][1]) * 100}%`, background: 'var(--accent-soft)' }" /></span></li></ul>
      </section>
    </div>
    <p v-if="!tasks.length" class="pg-empty"><AppIcon name="chart" :size="28" />Crie alguns itens de trabalho para ver as análises.</p>
  </div>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; padding: 1.25rem; }
.card { display: flex; flex-direction: column; gap: 0.75rem; padding: 1rem 1.1rem; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); }
.wide { grid-column: 1 / -1; }
.card header { display: flex; align-items: baseline; justify-content: space-between; }
h2 { margin: 0; font: 600 1rem/1.3 'Geist', system-ui, sans-serif; color: var(--text); }
.legend { display: flex; gap: 1.25rem; margin: 0; font-size: 13px; color: var(--muted); }
.legend span { display: inline-flex; align-items: center; gap: 0.4rem; }
.legend b { color: var(--text); }
.legend i { width: 14px; height: 3px; border-radius: 2px; }
i.c1 { background: var(--accent-soft); }
i.c2 { background: #7fc47a; }
.card > svg { width: 100%; height: auto; overflow: visible; }
.card > svg text { fill: var(--muted); font-size: 11px; }
.grid-ln { stroke: var(--line); }
.ln { fill: none; stroke-width: 2.5; stroke-linejoin: round; stroke-linecap: round; }
.ln.c1 { stroke: var(--accent-soft); }
.ln.c2 { stroke: #7fc47a; }
.area { fill: rgb(251 164 92 / 0.08); }
.bars { display: flex; flex-direction: column; gap: 0.7rem; margin: 0; padding: 0; list-style: none; }
.bars li { display: grid; grid-template-columns: 1fr auto; gap: 0.3rem 0.75rem; font-size: 13px; }
.bars b { font-variant-numeric: tabular-nums; }
.bar { grid-column: 1 / -1; display: flex; height: 8px; overflow: hidden; border-radius: 999px; background: var(--surface-2); }
.bar i { display: block; height: 100%; border-radius: 999px; }
.bar.stack i { border-radius: 0; }
.people li > span:first-child { display: flex; align-items: center; gap: 0.45rem; }
.av { width: 10px; height: 10px; border-radius: 50%; }
.pg-empty { flex-direction: row; padding: 1rem; color: var(--muted); }
.pg-seg button { width: auto; padding: 0 0.55rem; font-size: 12px; }
.kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; padding: 1.25rem 1.25rem 0; }
.kpi { display: flex; flex-direction: column; gap: 0.2rem; padding: 0.85rem 1rem; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); }
.kpi small { font-size: 12px; color: var(--muted); }
.kpi strong { font: 600 1.6rem/1.2 'Geist', system-ui, sans-serif; font-variant-numeric: tabular-nums; color: var(--text); }
.delta { font-size: 11.5px; color: var(--muted); }
.delta.up { color: #7fc47a; }
.delta.down { color: #ff8a80; }
.insights { display: flex; flex-direction: column; gap: 0.4rem; margin: 1rem 1.25rem 0; padding: 0.8rem 1rem; border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent); border-radius: 12px; background: color-mix(in srgb, var(--accent) 7%, var(--surface)); list-style: none; font-size: 13.5px; }
.insights li { display: flex; align-items: center; gap: 0.5rem; }
.insights :deep(svg) { flex: none; color: var(--accent-soft); }
@media (max-width: 760px) { .grid, .kpis { grid-template-columns: 1fr 1fr; } .grid { grid-template-columns: 1fr; } }
</style>
