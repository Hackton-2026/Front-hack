<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import '../assets/landing.css'
import '../assets/infopage.css'
import SiteNav from '../components/landing/SiteNav.vue'
import SiteFooter from '../components/landing/SiteFooter.vue'
import GooeyButton from '../components/GooeyButton.vue'
import { API_URL } from '../config'
import { vReveal } from '../utils/motion'

const EVERY = 30
const SLOW_MS = 1500

const CHECKS = reactive([
  { id: 'api', name: 'API', what: 'Projetos, tarefas, wiki e chat', path: '/api/payments/config/', ok: (r) => r.ok },
  { id: 'auth', name: 'Login e cadastro', what: 'Entrar, criar conta e renovar a sessão', path: '/api/health/', ok: (r, j) => r.ok && j?.database === true },
  { id: 'pay', name: 'Pagamentos', what: 'Pix e cartão pelo Mercado Pago', path: '/api/payments/config/', ok: (r, j) => r.ok && Array.isArray(j?.methods),
    note: (j) => (j?.test_mode ? 'Em modo de teste: nenhuma cobrança é real.' : '') },
].map((c) => ({ ...c, state: 'checking', ms: null, extra: '' })))

async function check(c) {
  const t0 = performance.now()
  try {
    const r = await fetch(`${API_URL}${c.path}`, { cache: 'no-store' })
    const j = r.headers.get('content-type')?.includes('json') ? await r.json().catch(() => null) : null
    c.ms = Math.round(performance.now() - t0)
    c.state = !c.ok(r, j) ? 'down' : c.ms > SLOW_MS ? 'slow' : 'up'
    c.extra = c.note?.(j) || ''
  } catch {
    c.ms = null
    c.state = 'down'
  }
}

const checkedAt = ref(null)
const now = ref(Date.now())
async function runAll() {
  await Promise.all(CHECKS.map(check))
  checkedAt.value = Date.now()
}
const ago = computed(() => (checkedAt.value ? Math.max(0, Math.round((now.value - checkedAt.value) / 1000)) : null))
const overall = computed(() => {
  if (CHECKS.some((c) => c.state === 'checking') && !checkedAt.value) return 'checking'
  if (CHECKS.some((c) => c.state === 'down')) return 'down'
  return CHECKS.some((c) => c.state === 'slow') ? 'slow' : 'up'
})
const LABEL = { up: 'Funcionando', slow: 'Lento', down: 'Fora do ar', checking: 'Verificando…' }
const HEADLINE = { up: 'Tudo funcionando.', slow: 'Funcionando, mas lento.', down: 'Algo está fora do ar.', checking: 'Verificando…' }

let previousTitle, timer, clock
onMounted(() => {
  previousTitle = document.title
  document.title = 'Status | Novexo'
  runAll()
  timer = setInterval(runAll, EVERY * 1000)
  clock = setInterval(() => (now.value = Date.now()), 1000)
})
onUnmounted(() => {
  document.title = previousTitle
  clearInterval(timer)
  clearInterval(clock)
})
</script>

<template>
  <div id="topo" class="lp ip">
    <SiteNav />
    <main class="ip-main">
      <section class="ip-hero" aria-labelledby="status-title">
        <div v-reveal.now>
          <p class="ip-kicker">Status</p>
          <h1 id="status-title" class="status-head" :class="`is-${overall}`"><span class="status-dot" aria-hidden="true" />{{ HEADLINE[overall].replace(/\.$/, '') }}<em>.</em></h1>
        </div>
        <p v-reveal.now="0.15" class="ip-lead" aria-live="polite">
          Esta página testa a API <strong>agora, a partir do seu navegador</strong>, a cada {{ EVERY }} segundos.
          <template v-if="ago !== null"> Última checagem há {{ ago }} s.</template>
        </p>
      </section>

      <section class="ip-section" aria-labelledby="status-services">
        <header><h2 id="status-services">Serviços<br><span>verificados.</span></h2>
          <p>O tempo inclui a ida e a volta pela sua internet, então pode variar de um lugar para outro.</p></header>
        <div>
          <ul class="ip-list status-list">
            <li v-for="c in CHECKS" :key="c.id">
              <span class="status-dot" :class="`is-${c.state}`" aria-hidden="true" />
              <div class="status-row">
                <div><h3>{{ c.name }}</h3><p>{{ c.what }}<template v-if="c.extra">, {{ c.extra }}</template></p></div>
                <div class="status-meta">
                  <strong :class="`is-${c.state}`">{{ LABEL[c.state] }}</strong>
                  <span v-if="c.ms !== null">{{ c.ms }} ms</span>
                </div>
              </div>
            </li>
          </ul>
          <GooeyButton class="status-again" variant="secondary" size="lg" @click="runAll">Verificar de novo</GooeyButton>
        </div>
      </section>

      <section class="ip-section" aria-labelledby="status-history">
        <header><h2 id="status-history">Incidentes<br><span>recentes.</span></h2></header>
        <div v-reveal>
          <p class="ip-note">Ainda não guardamos um histórico de incidentes: esta página mostra só como está agora. Se algo parecer fora do ar para você, fale com a gente pelo contato.</p>
        </div>
      </section>
    </main>
    <SiteFooter blend-from-black />
  </div>
</template>

<style scoped>
.status-head .status-dot { width: .3em; height: .3em; margin: 0 .3em 0 .05em; vertical-align: .14em; }
.status-dot { position: relative; display: inline-block; flex-shrink: 0; width: 10px; height: 10px; margin-top: 6px; border-radius: 50%; background: #6d655d; }
.status-dot.is-up, .is-up > .status-dot { background: #4ade80; box-shadow: 0 0 0 4px rgb(74 222 128 / .14); }
.status-dot.is-slow, .is-slow > .status-dot { background: var(--lp-orange-soft); box-shadow: 0 0 0 4px rgb(251 164 92 / .16); }
.status-dot.is-down, .is-down > .status-dot { background: #ef4444; box-shadow: 0 0 0 4px rgb(239 68 68 / .16); }
.status-dot.is-checking, .is-checking > .status-dot { animation: status-pulse 1s ease-in-out infinite; }
@keyframes status-pulse { 50% { opacity: .35; } }
.status-list > li { grid-template-columns: 24px 1fr; align-items: start; }
.status-row { display: flex; justify-content: space-between; gap: 20px; }
.status-meta { display: grid; justify-items: end; gap: 4px; flex-shrink: 0; font: 11px var(--font-mono); color: #8d857c; }
.status-meta strong { font: 600 12px var(--lp-sans); }
.status-meta .is-up { color: #86efac; }
.status-meta .is-slow { color: var(--lp-orange-soft); }
.status-meta .is-down { color: #fca5a5; }
.status-meta .is-checking { color: #a59d94; }
.status-again { margin-top: 24px; }
@media (prefers-reduced-motion: reduce) { .status-dot { animation: none !important; } }
</style>
