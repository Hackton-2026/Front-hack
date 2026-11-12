<script setup>
import { computed, ref } from 'vue'
import { useWorkspace } from '../../composables/useWorkspace'
import { useUi } from '../../composables/useUi'
import { creditedTo, doneTasks, dayKey, lastDays, shortDay } from '../../utils/completions'

// Quinzena da Visão geral: quantas tarefas cada pessoa concluiu por dia nos últimos 15 dias. Mostra as 5 que mais
// concluíram e você (destacado). O botão de ranking junta os quadrados de cada pessoa numa barra com o total.
const DAYS = 15
const TOP = 5
const props = defineProps({ tasks: { type: Array, required: true } })
const { state, member } = useWorkspace()
const { openTask } = useUi()

const mode = ref('grid')
const open = ref(null) // { person, day } do quadrado clicado
const days = computed(() => lastDays(DAYS))

const rows = computed(() => {
  const inWindow = new Set(days.value)
  const by = new Map()
  for (const t of doneTasks(props.tasks)) {
    const day = dayKey(t.completedAt)
    if (!inWindow.has(day)) continue
    for (const id of creditedTo(t)) {
      const row = by.get(id) || { id, total: 0, perDay: {} }
      row.total += 1
      ;(row.perDay[day] ||= []).push(t)
      by.set(id, row)
    }
  }
  const ranked = [...by.values()].sort((a, b) => b.total - a.total)
  const top = ranked.slice(0, TOP)
  if (!top.some((r) => r.id === state.me)) top.push(by.get(state.me) || { id: state.me, total: 0, perDay: {} })
  return mode.value === 'rank' ? top.sort((a, b) => b.total - a.total) : top
})
const maxDay = computed(() => Math.max(1, ...rows.value.flatMap((r) => Object.values(r.perDay).map((l) => l.length))))
const maxTotal = computed(() => Math.max(1, ...rows.value.map((r) => r.total)))
const level = (n) => (n ? Math.ceil((n / maxDay.value) * 4) : 0)
const firstName = (id) => (member(id)?.name || 'Alguém').split(' ')[0]

const openList = computed(() => (open.value ? [...(rows.value.find((r) => r.id === open.value.person)?.perDay[open.value.day] || [])] : [])
  .sort((a, b) => a.completedAt.localeCompare(b.completedAt)))
const hour = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
const plural = (n) => `${n} ${n === 1 ? 'tarefa' : 'tarefas'}`
</script>

<template>
  <section class="fh card" aria-labelledby="fh-title">
    <header class="fh__head">
      <div>
        <h3 id="fh-title">Tarefas concluídas</h3>
        <p v-if="open">{{ open.person === state.me ? 'Você' : firstName(open.person) }} · {{ shortDay(open.day) }} · {{ plural(openList.length) }}</p>
        <p v-else-if="mode === 'rank'">Ranking da quinzena</p>
        <p v-else>{{ shortDay(days[0]) }} – {{ shortDay(days[days.length - 1]) }}</p>
      </div>
      <button v-if="open" type="button" class="fh__back" @click="open = null"><i class="fi-rr-angle-small-left" aria-hidden="true" />Voltar</button>
      <div v-else class="fh__modes" role="group" aria-label="Como mostrar">
        <button type="button" :aria-pressed="mode === 'grid'" title="Por dia" aria-label="Por dia" @click="mode = 'grid'"><i class="fi-rr-apps" aria-hidden="true" /></button>
        <button type="button" :aria-pressed="mode === 'rank'" title="Ranking" aria-label="Ranking" @click="mode = 'rank'"><i class="fi-rr-chart-histogram" aria-hidden="true" /></button>
      </div>
    </header>

    <ul v-if="open" class="fh__list">
      <li v-for="t in openList" :key="t.id">
        <button type="button" @click="openTask(t)">
          <i class="dot" aria-hidden="true" /><span class="title">{{ t.title }}</span><span class="meta">{{ hour(t.completedAt) }} · {{ t.code }}</span>
        </button>
      </li>
    </ul>

    <TransitionGroup v-else tag="div" name="fh-row" class="fh__rows" :class="`is-${mode}`">
      <div v-for="(r, i) in rows" :key="r.id" class="fh__row" :class="{ me: r.id === state.me }" :style="{ '--i': i }">
        <span class="fh__name" :title="member(r.id)?.name">{{ firstName(r.id) }}<small v-if="r.id === state.me">você</small></span>
        <div class="fh__cells">
          <button
            v-for="d in days" :key="d" type="button" class="cell" :class="`l${level(r.perDay[d]?.length || 0)}`"
            :style="{ '--n': r.perDay[d]?.length || 0, '--max': maxTotal }"
            :disabled="mode === 'rank' || !r.perDay[d]"
            :aria-label="`${firstName(r.id)}, ${shortDay(d)}: ${plural(r.perDay[d]?.length || 0)}`"
            :title="`${shortDay(d)}: ${plural(r.perDay[d]?.length || 0)}`"
            @click="open = { person: r.id, day: d }"
          />
          <b class="total">{{ r.total }}</b>
        </div>
      </div>
    </TransitionGroup>
    <p v-if="!open && !rows.some((r) => r.total)" class="fh__empty">Nenhuma tarefa concluída nos últimos 15 dias.</p>
  </section>
</template>

<style scoped>
.card { display: flex; flex-direction: column; gap: 0.9rem; padding: 1rem 1.1rem; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); }
.fh__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; }
h3 { margin: 0; font: 600 0.95rem/1.3 'Geist', system-ui, sans-serif; color: var(--text); }
.fh__head p { margin: 0.15rem 0 0; font-size: 12.5px; color: var(--muted); }
.fh__modes { display: flex; padding: 3px; border-radius: 8px; background: var(--surface-2); }
.fh__modes button, .fh__back { display: grid; place-items: center; height: 26px; border: 0; border-radius: 6px; background: none; color: var(--muted); cursor: pointer; }
.fh__modes button { width: 28px; font-size: 13px; }
.fh__modes button[aria-pressed='true'] { background: var(--surface); color: var(--text); box-shadow: 0 1px 2px rgb(0 0 0 / 0.3); }
.fh__back { display: inline-flex; gap: 0.2rem; padding: 0 0.6rem; border: 1px solid var(--line-strong); font-size: 12.5px; }
.fh__back:hover, .fh__modes button:hover { color: var(--text); }
:is(.fh__modes button, .fh__back, .cell, .fh__list button):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }

.fh__rows { display: flex; flex-direction: column; gap: 6px; }
.fh__row { display: grid; grid-template-columns: 4.6rem minmax(0, 1fr); align-items: center; gap: 0.6rem; }
.fh__name { display: flex; flex-direction: column; overflow: hidden; font-size: 12.5px; color: var(--muted); text-overflow: ellipsis; white-space: nowrap; }
.fh__name small { font-size: 10.5px; color: var(--accent-soft); }
.me .fh__name { font-weight: 600; color: var(--text); }
.fh__cells { display: flex; align-items: center; min-width: 0; height: 22px; }
.cell {
  flex: 1 1 0; min-width: 0; height: 100%; margin-right: 3px; padding: 0; border: 0; border-radius: 4px; background: var(--surface-2); cursor: pointer;
  transition: flex 0.5s cubic-bezier(0.16, 1, 0.3, 1), margin 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease, transform 0.15s ease;
  transition-delay: calc(var(--i) * 35ms);
}
.cell:disabled { cursor: default; }
.cell:not(:disabled):hover { transform: scale(1.12); }
.l1 { background: color-mix(in srgb, var(--accent) 30%, var(--surface-2)); }
.l2 { background: color-mix(in srgb, var(--accent) 52%, var(--surface-2)); }
.l3 { background: color-mix(in srgb, var(--accent) 76%, var(--surface-2)); }
.l4 { background: var(--accent); }
.me .cell { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 35%, transparent); }
.total { flex-shrink: 0; width: 0; overflow: hidden; font-size: 12.5px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--text); opacity: 0; transition: opacity 0.3s ease 0.25s, width 0.5s ease; }
/* ranking: cada quadrado vira um pedaço da barra, do tamanho das tarefas daquele dia */
.is-rank .cell { flex: 0 0 calc((100% - 2.5rem) * var(--n) / var(--max)); margin-right: 1px; border-radius: 2px; }
.is-rank .cell.l0 { margin-right: 0; opacity: 0; }
.is-rank .total { width: 2.2rem; padding-left: 0.4rem; opacity: 1; }
.fh-row-move { transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1); }

.fh__list { display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none; }
.fh__list button { display: flex; align-items: center; gap: 0.6rem; width: 100%; padding: 0.55rem 0.4rem; border: 0; border-top: 1px solid var(--line); background: none; font: inherit; color: var(--text); text-align: left; cursor: pointer; }
.fh__list li:first-child button { border-top: 0; }
.fh__list button:hover { background: var(--surface-2); }
.dot { flex-shrink: 0; width: 7px; height: 7px; border-radius: 2px; background: var(--accent); }
.title { flex: 1; min-width: 0; overflow: hidden; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.meta { flex-shrink: 0; font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }
.fh__empty { margin: 0; font-size: 12.5px; color: var(--muted); }
@media (prefers-reduced-motion: reduce) {
  .cell, .total, .fh-row-move { transition: none; }
}
</style>
