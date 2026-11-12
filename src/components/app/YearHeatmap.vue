<script setup>
import { computed, ref } from 'vue'
import { dayKey, doneTasks, longestStreak, shortDay } from '../../utils/completions'

// Mapa do ano na Visão geral: um ponto por dia (semanas em colunas, de domingo a sábado), mais escuro quanto mais
// tarefas o projeto concluiu. "3D" levanta cada dia numa coluna em perspectiva isométrica.
const WEEKS = 53
const props = defineProps({ tasks: { type: Array, required: true } })
const mode = ref('flat')

const counts = computed(() => {
  const by = {}
  for (const t of doneTasks(props.tasks)) {
    const k = dayKey(t.completedAt)
    by[k] = (by[k] || 0) + 1
  }
  return by
})
// weeks[w][d]: domingo da semana mais antiga até hoje; dias depois de hoje ficam null
const weeks = computed(() => {
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - today.getDay() - (WEEKS - 1) * 7)
  const todayKey = dayKey(today)
  return Array.from({ length: WEEKS }, (_, w) => Array.from({ length: 7 }, (_, d) => {
    const day = new Date(start)
    day.setDate(start.getDate() + w * 7 + d)
    const key = dayKey(day)
    return key > todayKey ? null : { key, n: counts.value[key] || 0, month: day.getMonth(), date: day.getDate() }
  }))
})
const days = computed(() => weeks.value.flat().filter(Boolean))
const max = computed(() => Math.max(1, ...days.value.map((c) => c.n)))
const level = (n) => (n ? Math.ceil((n / max.value) * 4) : 0)
const total = computed(() => days.value.reduce((s, c) => s + c.n, 0))
const best = computed(() => days.value.reduce((b, c) => (c.n > (b?.n || 0) ? c : b), null))
const streak = computed(() => longestStreak(days.value.map((c) => c.key), (k) => counts.value[k]))
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
// o nome do mês fica em cima da semana que tem o dia 1
const monthAt = (w) => {
  const c = weeks.value[w].find((x) => x?.date === 1)
  return c ? MONTHS[c.month] : ''
}
const plural = (n) => `${n} ${n === 1 ? 'tarefa' : 'tarefas'}`

// 3D: cada dia vira um prisma em perspectiva oblíqua (semanas para o lado, dias para trás). Desenha do fundo para a
// frente e da esquerda para a direita, para a frente e o lado de cada prisma cobrirem os vizinhos de trás.
const TW = 7.4 // largura de uma semana
const DX = 5.6 // quanto cada dia anda para o lado...
const DY = 7.5 // ...e para baixo
const HMAX = 56
const S = 0.8 // o prisma ocupa 80% da casa, o resto é o vão entre eles
const prisms = computed(() => weeks.value.flatMap((col, w) => col.map((c, d) => c && { ...c, w, d }))
  .filter(Boolean)
  .sort((a, b) => a.d - b.d || a.w - b.w)
  .map((c) => {
    const x = c.w * TW + c.d * DX
    const y = c.d * DY + HMAX
    const h = c.n ? 2 + (c.n / max.value) * HMAX : 0
    const [cw, dx, dy] = [TW * S, DX * S, DY * S]
    const top = `${x},${y - h} ${x + cw},${y - h} ${x + cw + dx},${y + dy - h} ${x + dx},${y + dy - h}`
    const front = `${x + dx},${y + dy - h} ${x + cw + dx},${y + dy - h} ${x + cw + dx},${y + dy} ${x + dx},${y + dy}`
    const right = `${x + cw},${y - h} ${x + cw + dx},${y + dy - h} ${x + cw + dx},${y + dy} ${x + cw},${y}`
    return { ...c, top, front, right, lv: level(c.n) }
  }))
const box = { w: WEEKS * TW + 7 * DX + 2, h: 7 * DY + HMAX + 2 }
</script>

<template>
  <section class="yh card" aria-labelledby="yh-title">
    <header class="yh__head">
      <div>
        <h3 id="yh-title">Entregas no ano</h3>
        <p>Tarefas concluídas nos últimos 12 meses</p>
      </div>
      <div class="yh__modes" role="group" aria-label="Como mostrar">
        <button type="button" :aria-pressed="mode === 'flat'" @click="mode = 'flat'">Plano</button>
        <button type="button" :aria-pressed="mode === '3d'" @click="mode = '3d'">3D</button>
      </div>
    </header>

    <dl class="yh__stats">
      <div><dt>Concluídas</dt><dd>{{ total }}</dd></div>
      <div><dt>Melhor dia</dt><dd>{{ best ? best.n : '—' }}<small v-if="best">{{ shortDay(best.key) }}</small></dd></div>
      <div><dt>Maior sequência</dt><dd>{{ streak }}<small>{{ streak === 1 ? 'dia' : 'dias' }}</small></dd></div>
    </dl>

    <div v-if="mode === 'flat'" class="yh__flat">
      <div class="yh__months" aria-hidden="true"><span v-for="(_, w) in weeks" :key="w">{{ monthAt(w) }}</span></div>
      <div class="yh__grid" role="img" :aria-label="`${plural(total)} concluídas nos últimos 12 meses`">
        <template v-for="(col, w) in weeks" :key="w">
          <i v-for="(c, d) in col" :key="d" :class="c ? `l${level(c.n)}` : 'none'" :title="c ? `${shortDay(c.key)}: ${plural(c.n)}` : undefined" />
        </template>
      </div>
    </div>
    <svg v-else class="yh__3d" :viewBox="`0 0 ${box.w} ${box.h}`" role="img" :aria-label="`${plural(total)} concluídas nos últimos 12 meses, em 3D`">
      <g v-for="p in prisms" :key="p.key" :class="`l${p.lv}`" :style="{ '--i': p.w }">
        <title>{{ shortDay(p.key) }}: {{ plural(p.n) }}</title>
        <polygon class="front" :points="p.front" /><polygon class="right" :points="p.right" /><polygon class="top" :points="p.top" />
      </g>
    </svg>

    <div class="yh__legend" aria-hidden="true">Menos <i class="l0" /><i class="l1" /><i class="l2" /><i class="l3" /><i class="l4" /> Mais</div>
  </section>
</template>

<style scoped>
.card { display: flex; flex-direction: column; gap: 0.9rem; padding: 1rem 1.1rem; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); }
.yh__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; }
h3 { margin: 0; font: 600 0.95rem/1.3 'Geist', system-ui, sans-serif; color: var(--text); }
.yh__head p { margin: 0.15rem 0 0; font-size: 12.5px; color: var(--muted); }
.yh__modes { display: flex; padding: 3px; border-radius: 8px; background: var(--surface-2); }
.yh__modes button { height: 26px; padding: 0 0.65rem; border: 0; border-radius: 6px; background: none; font-size: 12.5px; color: var(--muted); cursor: pointer; }
.yh__modes button[aria-pressed='true'] { background: var(--surface); color: var(--text); box-shadow: 0 1px 2px rgb(0 0 0 / 0.3); }
.yh__modes button:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
.yh__stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin: 0; }
.yh__stats div { padding: 0.5rem 0.65rem; border: 1px solid var(--line); border-radius: 8px; }
.yh__stats dt { font-size: 11.5px; color: var(--muted); }
.yh__stats dd { margin: 0.1rem 0 0; font: 650 1.15rem/1.2 'Geist', system-ui, sans-serif; color: var(--text); font-variant-numeric: tabular-nums; }
.yh__stats small { margin-left: 0.3rem; font-size: 11.5px; font-weight: 400; color: var(--muted); }

.yh__flat { display: flex; flex-direction: column; gap: 4px; }
.yh__months, .yh__grid { display: grid; grid-template-columns: repeat(53, 1fr); gap: 2px; }
.yh__months span { overflow: visible; font-size: 10.5px; line-height: 1; color: var(--muted); white-space: nowrap; }
.yh__grid { grid-template-rows: repeat(7, auto); grid-auto-flow: column; }
.yh__grid i { aspect-ratio: 1; border-radius: 50%; }
.l0 { background: var(--surface-2); }
.l1 { background: color-mix(in srgb, var(--accent) 30%, var(--surface-2)); }
.l2 { background: color-mix(in srgb, var(--accent) 52%, var(--surface-2)); }
.l3 { background: color-mix(in srgb, var(--accent) 76%, var(--surface-2)); }
.l4 { background: var(--accent); }
.none { visibility: hidden; }

.yh__3d { width: 100%; height: auto; overflow: visible; }
.yh__3d g { --c: var(--surface-2); animation: rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: calc(var(--i) * 6ms); }
.yh__3d .l1 { --c: color-mix(in srgb, var(--accent) 30%, var(--surface-2)); }
.yh__3d .l2 { --c: color-mix(in srgb, var(--accent) 52%, var(--surface-2)); }
.yh__3d .l3 { --c: color-mix(in srgb, var(--accent) 76%, var(--surface-2)); }
.yh__3d .l4 { --c: var(--accent); }
.yh__3d .top { fill: var(--c); }
.yh__3d .front { fill: color-mix(in srgb, var(--c) 72%, #000); }
.yh__3d .right { fill: color-mix(in srgb, var(--c) 52%, #000); }
.yh__3d g:hover .top { fill: color-mix(in srgb, var(--c) 70%, #fff); }
@keyframes rise { from { opacity: 0; transform: translateY(10px); } }

.yh__legend { display: flex; align-items: center; justify-content: flex-end; gap: 3px; font-size: 11px; color: var(--muted); }
.yh__legend i { width: 9px; height: 9px; border-radius: 50%; }
@media (prefers-reduced-motion: reduce) {
  .yh__3d g { animation: none; }
}
</style>
