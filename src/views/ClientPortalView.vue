<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '../services/api'
import { STATUSES } from '../composables/useWorkspace'
import BrandN from '../components/app/BrandN.vue'
import ProjectIcon from '../components/app/ProjectIcon.vue'
import ProgressRing from '../components/app/ProgressRing.vue'
import StatusBadge from '../components/app/StatusBadge.vue'
import PriorityFlag from '../components/app/PriorityFlag.vue'
import AppIcon from '../components/app/AppIcon.vue'

const props = defineProps({ token: { type: String, required: true } })
const data = ref(null)
const loading = ref(true)
const error = ref('')
const statusFilter = ref('')
const q = ref('')

onMounted(async () => {
  try {
    data.value = await api(`/api/public/portal/${encodeURIComponent(props.token)}/`, { auth: false })
  } catch (e) {
    error.value = e.status === 404 ? 'Este portal não está ativo ou o link expirou.' : (e.message || 'Não foi possível carregar o portal.')
  } finally {
    loading.value = false
  }
})

const filtered = computed(() => {
  const list = data.value?.tasks || []
  const term = q.value.trim().toLowerCase()
  return list.filter((t) => (!statusFilter.value || t.status === statusFilter.value)
    && (!term || `${t.code} ${t.title} ${(t.tags || []).join(' ')}`.toLowerCase().includes(term)))
})

const grouped = computed(() => STATUSES
  .map((s) => ({ ...s, items: filtered.value.filter((t) => t.status === s.id) }))
  .filter((g) => g.items.length))

const fmtDue = (iso) => new Date(`${iso}T12:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
</script>

<template>
  <div class="portal">
    <header class="bar">
      <RouterLink to="/" class="brand" aria-label="Novexo">
        <BrandN :size="20" />
        <span>NOVEXO</span>
      </RouterLink>
      <RouterLink v-if="data?.form_token" :to="`/f/${data.form_token}`" class="cta">
        <AppIcon name="plus" :size="14" />Nova solicitação
      </RouterLink>
    </header>

    <main class="wrap">
      <div v-if="loading" class="state-box">Carregando portal…</div>

      <div v-else-if="error" class="state-box">
        <h1>Portal indisponível</h1>
        <p>{{ error }}</p>
        <RouterLink to="/" class="cta">Ir para o Novexo</RouterLink>
      </div>

      <template v-else-if="data">
        <section class="hero">
          <div class="hero__left">
            <span class="proj" :style="{ '--c': data.project_color }"><ProjectIcon :icon="data.project_icon" :color="data.project_color" :size="22" /></span>
            <div>
              <span class="kicker">Portal do cliente</span>
              <h1>{{ data.title }}</h1>
              <p v-if="data.subtitle" class="sub">{{ data.subtitle }}</p>
            </div>
          </div>
          <div class="hero__ring">
            <ProgressRing :value="(data.summary?.pct || 0) / 100" :size="58" />
            <div>
              <strong>{{ data.summary?.pct || 0 }}%</strong>
              <small>concluído</small>
            </div>
          </div>
        </section>

        <section class="kpis" aria-label="Resumo das entregas">
          <div class="kpi"><span>Total visível</span><strong>{{ data.summary?.total || 0 }}</strong></div>
          <div class="kpi"><span>Em andamento</span><strong>{{ data.summary?.in_progress || 0 }}</strong></div>
          <div class="kpi"><span>Pendentes</span><strong>{{ data.summary?.pending || 0 }}</strong></div>
          <div class="kpi"><span>Concluídas</span><strong>{{ data.summary?.done || 0 }}</strong></div>
        </section>

        <section class="toolbar">
          <div class="pills" role="tablist" aria-label="Filtrar por status">
            <button type="button" role="tab" :aria-selected="!statusFilter" @click="statusFilter = ''">Todas</button>
            <button v-for="s in STATUSES" :key="s.id" type="button" role="tab" :aria-selected="statusFilter === s.id" @click="statusFilter = s.id">{{ s.name }}</button>
          </div>
          <label class="find"><AppIcon name="search" :size="14" /><input v-model="q" placeholder="Buscar entrega…" aria-label="Buscar entrega" /></label>
        </section>

        <div v-if="!grouped.length" class="state-box">
          <p>{{ data.tasks.length ? 'Nenhuma entrega combina com o filtro.' : 'Nenhuma entrega foi publicada neste portal ainda.' }}</p>
        </div>

        <section v-for="g in grouped" :key="g.id" class="group">
          <header class="group__head">
            <StatusBadge :status="g.id" />
            <span class="group__n">{{ g.items.length }}</span>
          </header>
          <ul class="rows">
            <li v-for="t in g.items" :key="t.id">
              <span class="code">{{ t.code }}</span>
              <span class="title">{{ t.title }}</span>
              <span v-if="t.checklist_total" class="chk">{{ t.checklist_done }}/{{ t.checklist_total }}</span>
              <span v-for="tag in (t.tags || []).slice(0, 3)" :key="tag" class="tag">{{ tag }}</span>
              <PriorityFlag :priority="t.priority" />
              <span v-if="t.due" class="due">{{ fmtDue(t.due) }}</span>
            </li>
          </ul>
        </section>
      </template>
    </main>

    <footer class="foot">Acompanhamento ao vivo via <RouterLink to="/">Novexo</RouterLink></footer>
  </div>
</template>

<style scoped>
.portal {
  --bg: #0f0e0d;
  --surface: #181614;
  --surface-2: #211f1c;
  --line: rgb(255 255 255 / 0.08);
  --line-strong: rgb(255 255 255 / 0.14);
  --text: #f2efea;
  --muted: #9e9890;
  --accent: #e56515;
  --accent-soft: #fba45c;
  --ease: cubic-bezier(0.23, 1, 0.32, 1);
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  color: var(--text);
  font: 400 15px/1.5 'Geist', system-ui, sans-serif;
}
.bar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; height: 60px; padding: 0 clamp(1rem, 4vw, 2.5rem); border-bottom: 1px solid var(--line); }
.brand { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--text); text-decoration: none; font: 800 1rem/1 'Lexend', 'Geist', system-ui, sans-serif; letter-spacing: -0.02em; }
.cta { display: inline-flex; align-items: center; gap: 0.4rem; height: 34px; padding: 0 0.9rem; border: 1px solid var(--accent); border-radius: 8px; background: var(--accent); font: 600 13px/1 'Geist', system-ui, sans-serif; color: #000; text-decoration: none; transition: background 0.15s var(--ease), transform 0.12s var(--ease); }
.cta:hover { background: var(--accent-soft); border-color: var(--accent-soft); }
.cta:active { transform: scale(0.97); }

.wrap { flex: 1; display: flex; flex-direction: column; gap: 1.5rem; width: min(100%, 58rem); margin: 0 auto; padding: 2rem clamp(1rem, 4vw, 2rem) 3.5rem; }
.hero { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1.25rem; padding: 1.4rem 1.5rem; border: 1px solid var(--line); border-radius: 14px; background: var(--surface); }
.hero__left { display: flex; align-items: center; gap: 1rem; min-width: 0; }
.proj { display: grid; place-items: center; flex-shrink: 0; width: 46px; height: 46px; border: 1px solid var(--line-strong); border-radius: 12px; background: var(--surface-2); }
.kicker { display: block; font-size: 11.5px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--accent-soft); }
h1 { margin: 0.15rem 0 0; font: 650 1.5rem/1.2 'Geist', system-ui, sans-serif; letter-spacing: -0.02em; color: var(--text); }
.sub { margin: 0.25rem 0 0; font-size: 13.5px; color: var(--muted); }
.hero__ring { display: flex; align-items: center; gap: 0.75rem; }
.hero__ring strong { display: block; font: 650 1.35rem/1.1 'Geist', system-ui, sans-serif; font-variant-numeric: tabular-nums; }
.hero__ring small { font-size: 12px; color: var(--muted); }

.kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.65rem; }
@media (max-width: 640px) { .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.kpi { display: flex; flex-direction: column; gap: 0.2rem; padding: 0.9rem 1rem; border: 1px solid var(--line); border-radius: 11px; background: var(--surface); }
.kpi span { font-size: 12px; color: var(--muted); }
.kpi strong { font: 650 1.45rem/1.15 'Geist', system-ui, sans-serif; font-variant-numeric: tabular-nums; color: var(--text); }

.toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem; }
.pills { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.pills button { height: 30px; padding: 0 0.7rem; border: 1px solid var(--line); border-radius: 7px; background: none; font-size: 12.5px; font-weight: 500; color: var(--muted); cursor: pointer; transition: border-color 0.15s var(--ease), color 0.15s var(--ease), background 0.15s var(--ease); }
.pills button:hover { color: var(--text); border-color: var(--line-strong); }
.pills button[aria-selected='true'] { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--text); }
.find { display: flex; align-items: center; gap: 0.45rem; height: 32px; padding: 0 0.65rem; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); color: var(--muted); }
.find:focus-within { border-color: var(--accent); }
.find input { width: 12rem; border: 0; background: none; font: inherit; font-size: 13px; color: var(--text); outline: none; }

.group { display: flex; flex-direction: column; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); overflow: hidden; }
.group__head { display: flex; align-items: center; gap: 0.55rem; padding: 0.65rem 0.95rem; border-bottom: 1px solid var(--line); background: color-mix(in srgb, var(--surface-2) 55%, var(--surface)); }
.group__n { font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }
.rows { display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none; }
.rows li { display: flex; flex-wrap: wrap; align-items: center; gap: 0.65rem; padding: 0.7rem 0.95rem; font-size: 13.5px; }
.rows li + li { border-top: 1px solid var(--line); }
.code { font: 500 12px/1 'Geist Mono', monospace; color: var(--muted); font-variant-numeric: tabular-nums; }
.title { flex: 1; min-width: 12rem; font-weight: 500; color: var(--text); }
.chk { padding: 0.12rem 0.45rem; border-radius: 5px; background: var(--surface-2); font: 500 11.5px/1.2 'Geist Mono', monospace; color: var(--muted); font-variant-numeric: tabular-nums; }
.tag { padding: 0.12rem 0.45rem; border-radius: 4px; background: var(--surface-2); font-size: 11.5px; color: var(--muted); }
.due { font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap; }

.state-box { display: flex; flex-direction: column; align-items: center; gap: 0.65rem; padding: 2.5rem 1.5rem; border: 1px solid var(--line); border-radius: 14px; background: var(--surface); text-align: center; color: var(--muted); }
.state-box h1 { margin: 0; }
.state-box p { margin: 0; }
.foot { padding: 1.25rem; text-align: center; font-size: 12px; color: var(--muted); }
.foot a { color: var(--text); text-decoration: none; }
.foot a:hover { color: var(--accent-soft); }
:is(.cta, .brand, .pills button):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .cta:active { transform: none; } }
</style>
