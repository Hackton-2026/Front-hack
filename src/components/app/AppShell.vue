<script setup>
// Casca da área logada, na estrutura do app do Plane: trilho de ícones, barra lateral recolhível,
// barra do topo (workspace, busca, progresso do "Começar", caixa de entrada) e o botão de notas.
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { gsap, prefersReducedMotion } from '../../utils/motion'
import { useAuth } from '../../composables/useAuth'
import { useOnboarding } from '../../composables/useOnboarding'
import AppIcon from './AppIcon.vue'
import NotesDock from './NotesDock.vue'

defineProps({ title: { type: String, required: true }, icon: { type: String, default: 'rocket' } })

const { user } = useAuth()
const { count, total } = useOnboarding()
const name = computed(() => user.value?.first_name || user.value?.username || 'Visitante')
const initials = computed(() => name.value.slice(0, 2).toUpperCase())

const RAIL = [
  { icon: 'work', label: 'Trabalho', active: true },
  { icon: 'wiki', label: 'Wiki' },
  { icon: 'ai', label: 'IA' },
]
const NAV = [
  { icon: 'home', label: 'Início' },
  { icon: 'draft', label: 'Rascunhos' },
  { icon: 'mine', label: 'Seu trabalho' },
  { icon: 'note', label: 'Notas' },
]

const root = ref(null)
const sidebar = ref(null)
const collapsed = ref(false)
const reduced = prefersReducedMotion()

// Recolher a barra lateral: largura animada com GSAP e os itens somem antes (200ms, como no Plane)
function toggleSidebar() {
  collapsed.value = !collapsed.value
  if (reduced) return
  const items = sidebar.value.querySelectorAll('.side__inner > *')
  gsap.killTweensOf([sidebar.value, items])
  if (collapsed.value) {
    gsap.timeline()
      .to(items, { autoAlpha: 0, x: -8, duration: 0.15, stagger: 0.015, ease: 'power2.in' })
      .to(sidebar.value, { width: 0, duration: 0.35, ease: 'power3.inOut' }, '-=0.05')
  } else {
    gsap.timeline()
      .to(sidebar.value, { width: 248, duration: 0.35, ease: 'power3.inOut' })
      .fromTo(items, { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: 0.3, stagger: 0.025, ease: 'power2.out' }, '-=0.15')
  }
}

let ctx
onMounted(() => {
  if (reduced) return
  ctx = gsap.context(() => {
    // entrada: trilho, depois barra lateral em cascata, depois o topo (fade-in-up de 10px do Plane)
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.rail__item', { x: -10, autoAlpha: 0, duration: 0.4, stagger: 0.05 })
      .from('.side__inner > *', { y: 10, autoAlpha: 0, duration: 0.45, stagger: 0.035 }, '-=0.25')
      .from('.top > *', { y: -6, autoAlpha: 0, duration: 0.4, stagger: 0.06 }, '<')
  }, root.value)
})
onUnmounted(() => ctx?.revert())
</script>

<template>
  <div ref="root" class="app" :class="{ 'is-collapsed': collapsed }">
    <header class="top">
      <button type="button" class="ws">
        <span class="ws__badge">NV</span>
        <span class="ws__name">Área de trabalho</span>
        <AppIcon name="chevron" :size="14" />
      </button>
      <label class="search">
        <AppIcon name="search" :size="15" />
        <input type="search" placeholder="Buscar tarefas, projetos e documentos" aria-label="Buscar" />
        <kbd>Ctrl K</kbd>
      </label>
      <div class="top__right">
        <RouterLink to="/comecar" class="progress-btn" :aria-label="`Começar: ${count} de ${total} passos`">
          <svg viewBox="0 0 20 20" class="ring" aria-hidden="true">
            <circle cx="10" cy="10" r="8" class="ring__track" />
            <circle cx="10" cy="10" r="8" class="ring__bar" :style="{ strokeDashoffset: 50.27 * (1 - count / total) }" />
          </svg>
          Começar
        </RouterLink>
        <button type="button" class="icon-btn" aria-label="Caixa de entrada"><AppIcon name="inbox" /></button>
        <button type="button" class="icon-btn" aria-label="Ajuda"><AppIcon name="help" /></button>
        <span class="avatar" :title="name">{{ initials }}</span>
      </div>
    </header>

    <nav class="rail" aria-label="Áreas">
      <button v-for="r in RAIL" :key="r.label" type="button" class="rail__item" :class="{ 'is-active': r.active }">
        <span class="rail__icon"><AppIcon :name="r.icon" :size="19" /></span>{{ r.label }}
      </button>
      <span class="rail__sep" />
      <button type="button" class="rail__item"><span class="rail__icon"><AppIcon name="settings" :size="19" /></span>Ajustes</button>
      <NotesDock class="rail__dock" />
    </nav>

    <aside ref="sidebar" class="side" :aria-hidden="collapsed" :inert="collapsed">
      <div class="side__inner">
        <div class="side__head">
          <strong>Trabalho</strong>
          <button type="button" class="icon-btn sm" aria-label="Recolher barra lateral" @click="toggleSidebar"><AppIcon name="sidebar" :size="16" /></button>
        </div>
        <button type="button" class="new-btn"><AppIcon name="plus" :size="16" /> Nova tarefa</button>
        <nav class="side__group" aria-label="Seu trabalho">
          <a v-for="n in NAV" :key="n.label" href="#" class="side__link" @click.prevent><AppIcon :name="n.icon" :size="17" />{{ n.label }}</a>
        </nav>
        <div class="side__group">
          <span class="side__label">Workspace</span>
          <a href="#" class="side__link" @click.prevent><AppIcon name="folder" :size="17" />Projetos</a>
          <a href="#" class="side__link" @click.prevent><AppIcon name="more" :size="17" />Mais</a>
        </div>
        <div class="side__group">
          <span class="side__label">Projetos</span>
          <a href="#" class="side__link" @click.prevent><span class="dot" />Área de trabalho</a>
        </div>
        <RouterLink to="/#planos" class="trial">Teste do Business: 13 dias</RouterLink>
      </div>
    </aside>
    <button v-if="collapsed" type="button" class="expand" aria-label="Abrir barra lateral" @click="toggleSidebar"><AppIcon name="sidebar" :size="16" /></button>

    <main class="main">
      <div class="crumb"><AppIcon :name="icon" :size="16" /> {{ title }}</div>
      <div class="main__scroll"><slot /></div>
    </main>
  </div>
</template>

<style scoped>
.app {
  /* Paleta do Novexo no tema escuro da área logada (neutros quentes + laranja da marca) */
  --bg: #0f0e0d;
  --surface: #181614;
  --surface-2: #211f1c;
  --line: #2e2b27;
  --line-strong: #3d3934;
  --text: #f2efea;
  --muted: #a29d95;
  --accent: #e56515;
  --accent-soft: #fba45c;
  --ease: cubic-bezier(0, 0, 0.2, 1);
  display: grid;
  grid-template: 'top top top' 48px 'rail side main' 1fr / 64px auto 1fr;
  height: 100vh;
  height: 100svh;
  background: var(--bg);
  color: var(--text);
  font: 400 14px/1.45 'Geist', 'Helvetica Neue', system-ui, sans-serif;
  overflow: hidden;
}
:global(html:has(.app)), :global(html:has(.app) body) { background: #0f0e0d; }
button { font: inherit; color: inherit; }

/* ---- topo ---- */
.top { grid-area: top; display: flex; align-items: center; gap: 1rem; padding: 0 0.75rem 0 1rem; }
.ws { display: flex; align-items: center; gap: 0.6rem; padding: 0.3rem 0.5rem; border: 0; border-radius: 6px; background: none; cursor: pointer; transition: background 0.2s var(--ease); }
.ws:hover { background: var(--surface-2); }
.ws__badge { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 5px; background: var(--accent); font: 700 11px/1 'Lexend', system-ui, sans-serif; color: #000; }
.ws__name { font-weight: 600; }
.search { position: relative; display: flex; align-items: center; gap: 0.5rem; flex: 0 1 26rem; margin: 0 auto; padding: 0 0.6rem; height: 30px; border: 1px solid var(--line); border-radius: 6px; background: var(--surface); color: var(--muted); transition: border-color 0.2s var(--ease); }
.search:focus-within { border-color: var(--accent); }
.search input { flex: 1; min-width: 0; border: 0; background: none; font: inherit; color: var(--text); outline: none; }
.search kbd { font: 500 11px/1 'Geist Mono', monospace; color: var(--muted); }
.top__right { display: flex; align-items: center; gap: 0.35rem; }
.progress-btn { display: inline-flex; align-items: center; gap: 0.45rem; height: 30px; padding: 0 0.7rem; border: 1px solid var(--line-strong); border-radius: 6px; background: var(--surface-2); font-weight: 500; color: var(--text); text-decoration: none; transition: border-color 0.2s var(--ease); }
.progress-btn:hover { border-color: var(--accent); }
.ring { width: 16px; height: 16px; rotate: -90deg; }
.ring circle { fill: none; stroke-width: 2.5; }
.ring__track { stroke: var(--line-strong); }
.ring__bar { stroke: var(--accent); stroke-dasharray: 50.27; stroke-linecap: round; transition: stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.icon-btn { display: grid; place-items: center; width: 32px; height: 32px; padding: 0; border: 0; border-radius: 6px; background: none; color: var(--muted); cursor: pointer; transition: background 0.2s var(--ease), color 0.2s var(--ease); }
.icon-btn:hover { background: var(--surface-2); color: var(--text); }
.icon-btn.sm { width: 28px; height: 28px; }
.avatar { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-soft), var(--accent)); font: 700 11px/1 'Lexend', system-ui, sans-serif; color: #000; }
:is(.ws, .icon-btn, .rail__item, .side__link, .new-btn, .progress-btn, .trial, .expand):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }

/* ---- trilho ---- */
.rail { grid-area: rail; display: flex; flex-direction: column; align-items: center; gap: 0.25rem; padding: 0.5rem 0 0.75rem; }
.rail__item { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; width: 56px; padding: 0.4rem 0; border: 0; background: none; font-size: 11px; color: var(--muted); cursor: pointer; }
.rail__icon { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 8px; transition: background 0.2s var(--ease), color 0.2s var(--ease); }
.rail__item:hover .rail__icon { background: var(--surface-2); color: var(--text); }
.rail__item.is-active { color: var(--text); }
.rail__item.is-active .rail__icon { background: var(--surface-2); color: var(--accent-soft); }
.rail__sep { width: 24px; height: 1px; margin: 0.4rem 0; background: var(--line); }
.rail__dock { margin-top: auto; }

/* ---- barra lateral ---- */
.side { grid-area: side; width: 248px; overflow: hidden; border: 1px solid var(--line); border-width: 1px 1px 0 1px; border-radius: 10px 0 0 0; background: var(--surface); }
.app.is-collapsed .side { border-color: transparent; }
.side__inner { display: flex; flex-direction: column; gap: 1rem; width: 248px; height: 100%; padding: 0.75rem; overflow-y: auto; }
.side__head { display: flex; align-items: center; justify-content: space-between; padding: 0.15rem 0.25rem; font-size: 1rem; }
.new-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.45rem 0.75rem; border: 1px solid var(--line-strong); border-radius: 6px; background: var(--surface-2); font-weight: 500; cursor: pointer; transition: border-color 0.2s var(--ease), background 0.2s var(--ease); }
.new-btn:hover { border-color: var(--accent); }
.side__group { display: flex; flex-direction: column; gap: 1px; }
.side__label { padding: 0.25rem 0.5rem; font-size: 12px; font-weight: 500; color: var(--muted); }
.side__link { position: relative; display: flex; align-items: center; gap: 0.6rem; padding: 0.4rem 0.5rem; border-radius: 6px; color: var(--text); text-decoration: none; transition: background 0.2s var(--ease); }
.side__link:hover { background: var(--surface-2); }
.side__link :deep(.app-icon) { color: var(--muted); }
.dot { width: 8px; height: 8px; border-radius: 2px; background: var(--accent-soft); }
.trial { margin-top: auto; align-self: flex-start; padding: 0.35rem 0.65rem; border-radius: 6px; background: var(--surface-2); font-size: 12.5px; font-weight: 500; color: var(--text); text-decoration: none; }
.trial:hover { color: var(--accent-soft); }
.expand { position: fixed; left: 72px; top: 58px; z-index: 5; display: grid; place-items: center; width: 30px; height: 30px; border: 1px solid var(--line); border-radius: 6px; background: var(--surface); color: var(--muted); cursor: pointer; }

/* ---- conteúdo ---- */
.main { grid-area: main; display: flex; flex-direction: column; min-width: 0; min-height: 0; border-top: 1px solid var(--line); background: var(--bg); }
.app.is-collapsed .main { border-left: 0; }
.crumb { display: flex; align-items: center; gap: 0.5rem; height: 48px; padding: 0 1.5rem; border-bottom: 1px solid var(--line); font-weight: 500; }
.app.is-collapsed .crumb { padding-left: 3.25rem; }
.main__scroll { flex: 1; overflow-y: auto; }

@media (max-width: 860px) {
  .app { grid-template: 'top top' 48px 'rail main' 1fr / 64px 1fr; }
  .side, .expand, .search, .ws__name { display: none; }
}
</style>
