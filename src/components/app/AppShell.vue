<script setup>
// Casca da área logada (estrutura do app do Plane): trilho de ícones, barra lateral recolhível, topo com busca,
// progresso do "Começar", caixa de entrada e ajuda. Fica montada entre as rotas; só o conteúdo troca.
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { gsap, prefersReducedMotion } from '../../utils/motion'
import { useAuth } from '../../composables/useAuth'
import { useOnboarding } from '../../composables/useOnboarding'
import { useWorkspace } from '../../composables/useWorkspace'
import { useUi } from '../../composables/useUi'
import AppIcon from './AppIcon.vue'
import NotesDock from './NotesDock.vue'
import CommandPalette from './CommandPalette.vue'
import TaskCreateModal from './TaskCreateModal.vue'
import TaskDrawer from './TaskDrawer.vue'
import InboxPanel from './InboxPanel.vue'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const { count, total, complete } = useOnboarding()
const { state, unread, createProject, load } = useWorkspace()
const { ui, newTask } = useUi()
const name = computed(() => user.value?.first_name || user.value?.username || 'Visitante')
const initials = computed(() => name.value.slice(0, 2).toUpperCase())
const title = computed(() => ui.crumb || route.meta.title || '')

const RAIL = [
  { icon: 'work', label: 'Trabalho', to: '/inicio', area: 'work' },
  { icon: 'wiki', label: 'Wiki', to: '/wiki', area: 'wiki' },
  { icon: 'ai', label: 'IA', to: '/ia', area: 'ai' },
]
const NAV = [
  { icon: 'home', label: 'Início', to: '/inicio' },
  { icon: 'draft', label: 'Rascunhos', to: '/rascunhos' },
  { icon: 'mine', label: 'Seu trabalho', to: '/meu-trabalho' },
  { icon: 'note', label: 'Notas', to: '/notas' },
]

const root = ref(null)
const sidebar = ref(null)
const collapsed = ref(false)
const inboxOpen = ref(false)
const helpOpen = ref(false)
const addingProject = ref(false)
const projectName = ref('')
const reduced = prefersReducedMotion()

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

async function startProject() {
  addingProject.value = true
  await nextTick()
  root.value.querySelector('.new-project input')?.focus()
}
async function saveProject() {
  const n = projectName.value.trim()
  addingProject.value = false
  projectName.value = ''
  if (!n) return
  const p = await createProject(n, ['#e56515', '#fba45c', '#919599', '#f2c46d'][state.projects.length % 4])
  if (!p) return
  complete('project')
  router.push(`/projetos/${p.id}`)
}

// Atalhos globais: Ctrl K busca, N nova tarefa (fora de campos de texto), Esc fecha os painéis
function onKey(e) {
  const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); ui.palette = !ui.palette }
  else if (!typing && e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey && !ui.creating) { e.preventDefault(); newTask() }
  else if (e.key === 'Escape') { inboxOpen.value = false; helpOpen.value = false }
}
function onClick(e) {
  if (!e.target.closest('.pop')) { inboxOpen.value = false; helpOpen.value = false }
}

// Troca de página: o título volta para o da rota e o conteúdo entra subindo 10px (fade-in-up do Plane).
// Só o caminho conta: trocar a aba ?v= de um projeto não é troca de página.
watch(() => route.path, async () => {
  ui.crumb = ''
  inboxOpen.value = false
  if (reduced) return
  await nextTick()
  const page = root.value?.querySelector('.main__scroll > *')
  if (page) gsap.fromTo(page, { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4, ease: 'power2.out' })
  root.value.querySelector('.main__scroll').scrollTop = 0
})

let ctx
onMounted(() => {
  load()
  addEventListener('keydown', onKey)
  addEventListener('click', onClick)
  if (reduced) return
  ctx = gsap.context(() => {
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.rail__item', { x: -10, autoAlpha: 0, duration: 0.4, stagger: 0.05 })
      .from('.side__inner > *', { y: 10, autoAlpha: 0, duration: 0.45, stagger: 0.035 }, '-=0.25')
      .from('.top > *', { y: -6, autoAlpha: 0, duration: 0.4, stagger: 0.06 }, '<')
  }, root.value)
})
onUnmounted(() => {
  ctx?.revert()
  removeEventListener('keydown', onKey)
  removeEventListener('click', onClick)
})
</script>

<template>
  <div ref="root" class="app" :class="{ 'is-collapsed': collapsed, 'is-compact': state.prefs.density === 'compact' }">
    <header class="top">
      <RouterLink to="/inicio" class="ws">
        <span class="ws__badge">NV</span>
        <span class="ws__name">{{ state.workspaceName }}</span>
      </RouterLink>
      <button type="button" class="search" @click="ui.palette = true">
        <AppIcon name="search" :size="15" />
        <span>Buscar tarefas, projetos e documentos</span>
        <kbd>Ctrl K</kbd>
      </button>
      <div class="top__right">
        <RouterLink to="/comecar" class="progress-btn" :aria-label="`Começar: ${count} de ${total} passos`">
          <svg viewBox="0 0 20 20" class="ring" aria-hidden="true">
            <circle cx="10" cy="10" r="8" class="ring__track" />
            <circle cx="10" cy="10" r="8" class="ring__bar" :style="{ strokeDashoffset: 50.27 * (1 - count / total) }" />
          </svg>
          Começar
        </RouterLink>
        <div class="pop">
          <button type="button" class="icon-btn" :aria-expanded="inboxOpen" aria-label="Caixa de entrada" @click="inboxOpen = !inboxOpen; helpOpen = false">
            <AppIcon name="inbox" /><span v-if="unread" class="badge">{{ unread > 9 ? '9+' : unread }}</span>
          </button>
          <InboxPanel :open="inboxOpen" @close="inboxOpen = false" />
        </div>
        <div class="pop">
          <button type="button" class="icon-btn" :aria-expanded="helpOpen" aria-label="Ajuda" @click="helpOpen = !helpOpen; inboxOpen = false"><AppIcon name="help" /></button>
          <div v-if="helpOpen" class="help">
            <strong>Atalhos</strong>
            <p><kbd>Ctrl</kbd><kbd>K</kbd> buscar e abrir qualquer coisa</p>
            <p><kbd>N</kbd> nova tarefa</p>
            <p><kbd>Esc</kbd> fechar painéis</p>
            <RouterLink to="/comecar" @click="helpOpen = false">Ver o guia de início</RouterLink>
          </div>
        </div>
        <RouterLink to="/ajustes" class="avatar" :title="name">{{ initials }}</RouterLink>
      </div>
    </header>

    <nav class="rail" aria-label="Áreas">
      <RouterLink v-for="r in RAIL" :key="r.label" :to="r.to" class="rail__item" :class="{ 'is-active': route.meta.area === r.area }">
        <span class="rail__icon"><AppIcon :name="r.icon" :size="19" /></span>{{ r.label }}
      </RouterLink>
      <span class="rail__sep" />
      <RouterLink to="/ajustes" class="rail__item" :class="{ 'is-active': route.meta.area === 'settings' }"><span class="rail__icon"><AppIcon name="settings" :size="19" /></span>Ajustes</RouterLink>
      <NotesDock class="rail__dock" />
    </nav>

    <aside ref="sidebar" class="side" :aria-hidden="collapsed" :inert="collapsed">
      <div class="side__inner">
        <div class="side__head">
          <strong>Trabalho</strong>
          <button type="button" class="icon-btn sm" aria-label="Recolher barra lateral" @click="toggleSidebar"><AppIcon name="sidebar" :size="16" /></button>
        </div>
        <button type="button" class="new-btn" @click="newTask()"><AppIcon name="plus" :size="16" /> Nova tarefa <kbd>N</kbd></button>
        <nav class="side__group" aria-label="Seu trabalho">
          <RouterLink v-for="n in NAV" :key="n.label" :to="n.to" class="side__link"><AppIcon :name="n.icon" :size="17" />{{ n.label }}</RouterLink>
        </nav>
        <div class="side__group">
          <span class="side__label">Workspace</span>
          <RouterLink to="/projetos" class="side__link" exact-active-class="router-link-active"><AppIcon name="folder" :size="17" />Projetos</RouterLink>
          <RouterLink to="/comecar" class="side__link"><AppIcon name="rocket" :size="17" />Começar</RouterLink>
        </div>
        <div class="side__group">
          <span class="side__label">Projetos <button type="button" class="add-p" aria-label="Novo projeto" @click="startProject"><AppIcon name="plus" :size="14" /></button></span>
          <RouterLink v-for="p in state.projects" :key="p.id" :to="`/projetos/${p.id}`" class="side__link"><span class="dot" :style="{ background: p.color }" />{{ p.name }}</RouterLink>
          <form v-if="addingProject" class="new-project" @submit.prevent="saveProject">
            <input v-model="projectName" placeholder="Nome do projeto" aria-label="Nome do novo projeto" @blur="saveProject" @keydown.esc="addingProject = false" />
          </form>
        </div>
        <RouterLink to="/precos" class="trial">Teste do Business: 13 dias</RouterLink>
      </div>
    </aside>
    <button v-if="collapsed" type="button" class="expand" aria-label="Abrir barra lateral" @click="toggleSidebar"><AppIcon name="sidebar" :size="16" /></button>

    <main class="main">
      <div class="crumb"><AppIcon :name="route.meta.icon || 'work'" :size="16" /> {{ title }}<slot name="crumb" /></div>
      <div v-if="!state.loaded" class="loading" role="status">
        <template v-if="state.error">
          <p>Não foi possível carregar o workspace: {{ state.error }}</p>
          <button type="button" class="retry" @click="load">Tentar de novo</button>
        </template>
        <template v-else><span class="spin" aria-hidden="true" />Carregando seu workspace…</template>
      </div>
      <div v-else class="main__scroll"><slot /></div>
    </main>

    <Transition name="toast"><p v-if="ui.message" class="toast" role="alert">{{ ui.message }}</p></Transition>
    <TaskDrawer />
    <TaskCreateModal />
    <CommandPalette />
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
.app :deep(button) { font: inherit; color: inherit; }
kbd { padding: 0.05rem 0.3rem; border: 1px solid var(--line-strong); border-radius: 4px; font: 500 11px/1.3 'Geist Mono', monospace; color: var(--muted); }

/* ---- topo ---- */
.top { grid-area: top; display: flex; align-items: center; gap: 1rem; padding: 0 0.75rem 0 1rem; }
.ws { display: flex; align-items: center; gap: 0.6rem; padding: 0.3rem 0.5rem; border-radius: 6px; color: var(--text); text-decoration: none; transition: background 0.2s var(--ease); }
.ws:hover { background: var(--surface-2); }
.ws__badge { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 5px; background: var(--accent); font: 700 11px/1 'Lexend', system-ui, sans-serif; color: #000; }
.ws__name { font-weight: 600; }
.search { display: flex; align-items: center; gap: 0.5rem; flex: 0 1 26rem; margin: 0 auto; padding: 0 0.6rem; height: 30px; border: 1px solid var(--line); border-radius: 6px; background: var(--surface); color: var(--muted); cursor: pointer; text-align: left; transition: border-color 0.2s var(--ease); }
.search:hover { border-color: var(--line-strong); }
.search span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.top__right { display: flex; align-items: center; gap: 0.35rem; }
.progress-btn { display: inline-flex; align-items: center; gap: 0.45rem; height: 30px; padding: 0 0.7rem; border: 1px solid var(--line-strong); border-radius: 6px; background: var(--surface-2); font-weight: 500; color: var(--text); text-decoration: none; transition: border-color 0.2s var(--ease); }
.progress-btn:hover { border-color: var(--accent); }
.ring { width: 16px; height: 16px; rotate: -90deg; }
.ring circle { fill: none; stroke-width: 2.5; }
.ring__track { stroke: var(--line-strong); }
.ring__bar { stroke: var(--accent); stroke-dasharray: 50.27; stroke-linecap: round; transition: stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.pop { position: relative; }
.icon-btn { position: relative; display: grid; place-items: center; width: 32px; height: 32px; padding: 0; border: 0; border-radius: 6px; background: none; color: var(--muted); cursor: pointer; transition: background 0.2s var(--ease), color 0.2s var(--ease); }
.icon-btn:hover, .icon-btn[aria-expanded='true'] { background: var(--surface-2); color: var(--text); }
.icon-btn.sm { width: 28px; height: 28px; }
.badge { position: absolute; top: 2px; right: 1px; min-width: 15px; height: 15px; padding: 0 3px; border-radius: 999px; background: var(--accent); font: 700 9.5px/15px 'Geist', sans-serif; color: #000; }
.help { position: absolute; top: 42px; right: 0; z-index: 60; display: flex; flex-direction: column; gap: 0.5rem; width: 17rem; padding: 0.9rem 1rem; border: 1px solid var(--line-strong); border-radius: 10px; background: var(--surface); box-shadow: 0 20px 40px rgb(0 0 0 / 0.45); font-size: 13px; }
.help p { margin: 0; color: var(--muted); }
.help kbd { margin-right: 0.2rem; }
.help a { color: var(--accent-soft); text-decoration: none; }
.avatar { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-soft), var(--accent)); font: 700 11px/1 'Lexend', system-ui, sans-serif; color: #000; text-decoration: none; }
:is(.ws, .icon-btn, .rail__item, .side__link, .new-btn, .progress-btn, .trial, .expand, .search, .avatar, .add-p):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }

/* ---- trilho ---- */
.rail { grid-area: rail; display: flex; flex-direction: column; align-items: center; gap: 0.25rem; padding: 0.5rem 0 0.75rem; }
.rail__item { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; width: 56px; padding: 0.4rem 0; font-size: 11px; color: var(--muted); text-decoration: none; }
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
.new-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.45rem 0.75rem; border: 1px solid var(--line-strong); border-radius: 6px; background: var(--surface-2); font-weight: 500; cursor: pointer; transition: border-color 0.2s var(--ease); }
.new-btn kbd { margin-left: auto; }
.new-btn:hover { border-color: var(--accent); }
.side__group { display: flex; flex-direction: column; gap: 1px; }
.side__label { display: flex; align-items: center; justify-content: space-between; padding: 0.25rem 0.5rem; font-size: 12px; font-weight: 500; color: var(--muted); }
.add-p { display: grid; place-items: center; width: 20px; height: 20px; padding: 0; border: 0; border-radius: 4px; background: none; color: var(--muted); cursor: pointer; }
.add-p:hover { background: var(--surface-2); color: var(--text); }
.side__link { position: relative; display: flex; align-items: center; gap: 0.6rem; padding: 0.4rem 0.5rem; border-radius: 6px; color: var(--text); text-decoration: none; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; transition: background 0.2s var(--ease); }
.side__link:hover { background: var(--surface-2); }
.side__link.router-link-active { background: var(--surface-2); }
.side__link.router-link-active::before { content: ''; position: absolute; left: 0; top: 25%; bottom: 25%; width: 2px; border-radius: 2px; background: var(--accent); }
.side__link :deep(.app-icon) { color: var(--muted); }
.dot { flex-shrink: 0; width: 8px; height: 8px; border-radius: 2px; }
.new-project input { width: 100%; height: 30px; margin-top: 2px; padding: 0 0.5rem; border: 1px solid var(--accent); border-radius: 6px; background: var(--bg); font: inherit; color: var(--text); outline: none; }
.trial { margin-top: auto; align-self: flex-start; padding: 0.35rem 0.65rem; border-radius: 6px; background: var(--surface-2); font-size: 12.5px; font-weight: 500; color: var(--text); text-decoration: none; }
.trial:hover { color: var(--accent-soft); }
.expand { position: fixed; left: 72px; top: 58px; z-index: 5; display: grid; place-items: center; width: 30px; height: 30px; border: 1px solid var(--line); border-radius: 6px; background: var(--surface); color: var(--muted); cursor: pointer; }

/* ---- conteúdo ---- */
.main { grid-area: main; display: flex; flex-direction: column; min-width: 0; min-height: 0; border-top: 1px solid var(--line); background: var(--bg); }
.crumb { display: flex; align-items: center; gap: 0.5rem; min-height: 48px; padding: 0 1.5rem; border-bottom: 1px solid var(--line); font-weight: 500; }
.app.is-collapsed .crumb { padding-left: 3.25rem; }
.main__scroll { flex: 1; min-height: 0; overflow-y: auto; }
.loading { flex: 1; display: grid; place-content: center; justify-items: center; gap: 0.75rem; color: var(--muted); text-align: center; }
.loading p { margin: 0; }
.spin { display: inline-block; width: 22px; height: 22px; border: 2px solid var(--line-strong); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { rotate: 360deg; } }
.retry { padding: 0.45rem 0.9rem; border: 1px solid var(--accent); border-radius: 6px; background: rgb(229 101 21 / 0.12); cursor: pointer; }
.toast { position: fixed; left: 50%; bottom: 1.25rem; z-index: 90; max-width: min(30rem, calc(100vw - 2rem)); margin: 0; padding: 0.7rem 1rem; border: 1px solid rgb(229 101 21 / 0.5); border-radius: 10px; background: #2a1408; color: #ffd2b3; box-shadow: 0 12px 30px rgb(0 0 0 / 0.4); translate: -50% 0; }
.toast-enter-active, .toast-leave-active { transition: opacity 0.25s var(--ease), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(10px); }

@media (max-width: 860px) {
  .app { grid-template: 'top top' 48px 'rail main' 1fr / 64px 1fr; }
  .side, .expand, .search, .ws__name { display: none; }
}
</style>
