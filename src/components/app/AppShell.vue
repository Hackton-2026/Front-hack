<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { gsap, prefersReducedMotion } from '../../utils/motion'
import { useAuth } from '../../composables/useAuth'
import { api } from '../../services/api'
import { useOnboarding } from '../../composables/useOnboarding'
import { useWorkspace } from '../../composables/useWorkspace'
import { useUi } from '../../composables/useUi'
import AppIcon from './AppIcon.vue'
import AccountMenu from './AccountMenu.vue'
import NotesDock from './NotesDock.vue'
import CommandPalette from './CommandPalette.vue'
import TaskCreateModal from './TaskCreateModal.vue'
import TaskDrawer from './TaskDrawer.vue'
import ProjectChat from '../../views/ProjectChat.vue'
import { onForegroundPush } from '../../services/push'
import InboxPanel from './InboxPanel.vue'
import SideNav from './SideNav.vue'
import '../../assets/app-pages.css'

const route = useRoute()
const noSide = computed(() => ['settings', 'ai'].includes(route.meta.area))
const { user } = useAuth()
const { count, total } = useOnboarding()
const { state, unread, load, refreshFeed, touchRecent } = useWorkspace()

const lightQuery = matchMedia('(prefers-color-scheme: light)')
const systemLight = ref(lightQuery.matches)
const onScheme = (e) => (systemLight.value = e.matches)
lightQuery.addEventListener('change', onScheme)
onUnmounted(() => lightQuery.removeEventListener('change', onScheme))
const light = computed(() => state.prefs.theme === 'light' || (state.prefs.theme === 'auto' && systemLight.value))
watchEffect(() => (document.documentElement.dataset.calm = state.prefs.calm ? 'on' : ''))
watch(() => [route.query.task, state.loaded], ([id]) => { if (id && state.tasks.some((t) => t.id === Number(id))) ui.taskId = Number(id) }, { immediate: true })
const { ui, newTask } = useUi()
const photo = computed(() => state.people.find((m) => m.id === state.me)?.avatar || user.value?.avatar || '')
const hideVerify = ref(false)
const resending = ref(false)
async function resendVerify() {
  resending.value = true
  try {
    await api('/api/auth/verify-email/resend/', { method: 'POST' })
    useUi().toast(`Mandamos um link novo para ${user.value.email}. Confira a caixa de entrada e o spam.`)
  } catch (e) {
    useUi().toast(e.status === 429 ? 'Espere um minuto para pedir outro link.' : e.message)
  } finally {
    resending.value = false
  }
}
const title = computed(() => ui.crumb || route.meta.title || '')

const RAIL = [
  { icon: 'work', label: 'Trabalho', to: '/inicio', area: 'work' },
  { icon: 'wiki', label: 'Documentos', to: '/wiki', area: 'wiki' },
  { icon: 'ai', label: 'IA', to: '/ia', area: 'ai' },
]
const rail = computed(() => RAIL.filter((r) => state.settings.products?.[r.area] !== false))

const root = ref(null)
const sidebar = ref(null)
const collapsed = ref(false)
const inboxOpen = ref(false)
const helpOpen = ref(false)
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

function onKey(e) {
  const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable
  if (!state.prefs.shortcuts && e.key !== 'Escape') return
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); ui.palette = !ui.palette }
  else if (!typing && e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey && !ui.creating) { e.preventDefault(); newTask() }
  else if (e.key === 'Escape') { inboxOpen.value = false; helpOpen.value = false}
}
function onClick(e) {
  if (!e.target.closest('.pop')) { inboxOpen.value = false; helpOpen.value = false}
}

watch(() => route.path, async () => {
  ui.crumb = ''
  inboxOpen.value = false
  if (reduced) return
  await nextTick()
  const page = root.value?.querySelector('.main__scroll > *')
  if (page) gsap.fromTo(page, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' })
  root.value.querySelector('.main__scroll').scrollTop = 0
})

watch(() => ui.taskId, (id) => typeof id === 'number' && touchRecent('task', id))
watch(() => route.path, (path) => {
  const m = path.match(/^\/projetos\/(\d+)(?:\/paginas\/(\d+))?/)
  if (m) touchRecent(m[2] ? 'page' : 'project', Number(m[2] || m[1]))
}, { immediate: true })

let ctx
const inboxTimer = setInterval(() => !document.hidden && state.loaded && refreshFeed(), 30000)
onMounted(() => {
  load()
  onForegroundPush((data) => { useUi().toast(data.body ? `${data.title}: ${data.body}` : data.title); refreshFeed() })
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
  clearInterval(inboxTimer)
  ctx?.revert()
  removeEventListener('keydown', onKey)
  removeEventListener('click', onClick)
})
</script>

<template>
  <div
    ref="root"
    class="app"
    :class="{ 'is-collapsed': collapsed, 'is-compact': state.prefs.density === 'compact', 'is-light': light, 'is-contrast': state.prefs.contrast, 'is-calm': state.prefs.calm, 'no-ids': !state.prefs.showIds, 'no-hand': !state.prefs.handCursor }"
    :style="{ '--accent': state.prefs.accent }"
  >
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
        <AccountMenu :photo="photo" @open="inboxOpen = false; helpOpen = false" />
      </div>
    </header>

    <nav class="rail" aria-label="Áreas">
      <RouterLink v-for="r in rail" :key="r.label" :to="r.to" class="rail__item" :class="{ 'is-active': route.meta.area === r.area }">
        <span class="rail__icon"><AppIcon :name="r.icon" :size="19" /></span>{{ r.label }}
      </RouterLink>
      <span class="rail__sep" />
      <RouterLink to="/ajustes" class="rail__item" :class="{ 'is-active': route.meta.area === 'settings' }"><span class="rail__icon"><AppIcon name="settings" :size="19" /></span>Ajustes</RouterLink>
      <RouterLink to="/" class="rail__item rail__item--site" title="Voltar para o site do Novexo"><span class="rail__icon"><AppIcon name="globe" :size="19" /></span>Site</RouterLink>
      <NotesDock class="rail__dock" />
    </nav>

    <aside v-show="!noSide" ref="sidebar" class="side" :aria-hidden="collapsed" :inert="collapsed">
      <div class="side__inner"><SideNav @collapse="toggleSidebar" /></div>
    </aside>
    <button v-if="collapsed && !noSide" type="button" class="expand" aria-label="Abrir barra lateral" @click="toggleSidebar"><AppIcon name="sidebar" :size="16" /></button>

    <main class="main">
      <p v-if="user && user.email_verified === false && !hideVerify" class="verify" role="status">
        <AppIcon name="inbox" :size="15" />
        <span>Confirme seu e-mail <strong>{{ user.email }}</strong>: mandamos um link para lá.</span>
        <button type="button" class="verify__btn" :disabled="resending" @click="resendVerify">{{ resending ? 'Enviando…' : 'Reenviar link' }}</button>
        <button type="button" class="verify__x" aria-label="Fechar aviso" @click="hideVerify = true"><AppIcon name="close" :size="14" /></button>
      </p>
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
    <ProjectChat v-if="ui.chat && state.loaded && route.path !== `/projetos/${ui.chat}/chat`" :id="ui.chat" />
    <TaskDrawer />
    <TaskCreateModal />
    <CommandPalette />
  </div>
</template>

<style scoped>
.app {
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
.app { color-scheme: dark; }
.app.is-light {
  --bg: #f7f5f2;
  --surface: #ffffff;
  --surface-2: #efebe6;
  --line: #e4ded6;
  --line-strong: #d2cac0;
  --text: #1c1a17;
  --muted: #6b655d;
  --accent-soft: #b9500f;
  color-scheme: light;
}
.app.is-contrast { --muted: var(--text); --line: var(--line-strong); }
.app.is-calm :deep(*) { transition: none !important; animation: none !important; }
.app.no-ids :deep(:is(.code, .row__code, .card__code)) { display: none; }
.app.no-hand :deep(:is(button, a, [role='switch'], select)) { cursor: default; }
.app :deep(button) { font: inherit; color: inherit; }
kbd { padding: 0.05rem 0.3rem; border: 1px solid var(--line-strong); border-radius: 4px; font: 500 11px/1.3 'Geist Mono', monospace; color: var(--muted); }

.top { grid-area: top; position: relative; z-index: 70; display: flex; align-items: center; gap: 1rem; padding: 0 0.75rem 0 1rem; }
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
:is(.ws, .icon-btn, .rail__item, .progress-btn, .expand, .search, .avatar):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }

.rail { grid-area: rail; display: flex; flex-direction: column; align-items: center; gap: 0.25rem; padding: 0.5rem 0 0.75rem; }
.rail__item { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; width: 56px; padding: 0.4rem 0; font-size: 11px; color: var(--muted); text-decoration: none; }
.rail__icon { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 8px; transition: background 0.2s var(--ease), color 0.2s var(--ease); }
.rail__item:hover .rail__icon { background: var(--surface-2); color: var(--text); }
.rail__item.is-active { color: var(--text); }
.rail__item.is-active .rail__icon { background: var(--surface-2); color: var(--accent-soft); }
.rail__sep { width: 24px; height: 1px; margin: 0.4rem 0; background: var(--line); }
.rail__dock { margin-top: auto; }

.side { grid-area: side; width: 248px; overflow: hidden; border: 1px solid var(--line); border-width: 1px 1px 0 1px; border-radius: 10px 0 0 0; background: var(--surface); }
.app.is-collapsed .side { border-color: transparent; }
.side__inner { display: flex; flex-direction: column; gap: 1rem; width: 248px; height: 100%; padding: 0.75rem; overflow-y: auto; }
.expand { position: fixed; left: 72px; top: 58px; z-index: 5; display: grid; place-items: center; width: 30px; height: 30px; border: 1px solid var(--line); border-radius: 6px; background: var(--surface); color: var(--muted); cursor: pointer; }

.main { grid-area: main; display: flex; flex-direction: column; min-width: 0; min-height: 0; border-top: 1px solid var(--line); background: var(--bg); }
.verify { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; margin: 0; padding: 0.55rem 1.5rem; border-bottom: 1px solid color-mix(in srgb, var(--accent) 40%, transparent); background: color-mix(in srgb, var(--accent) 10%, var(--surface)); font-size: 13px; color: var(--text); }
.verify strong { font-weight: 600; overflow-wrap: anywhere; }
.verify > :deep(svg) { flex: none; color: var(--accent-soft); }
.verify__btn { margin-left: auto; padding: 0.3rem 0.7rem; border: 1px solid var(--accent); border-radius: 6px; background: none; font: inherit; font-weight: 500; color: var(--text); cursor: pointer; }
.verify__btn:hover { background: color-mix(in srgb, var(--accent) 18%, transparent); }
.verify__btn:disabled { opacity: 0.6; cursor: default; }
.verify__x { display: grid; place-items: center; width: 26px; height: 26px; padding: 0; border: 0; border-radius: 6px; background: none; color: var(--muted); cursor: pointer; }
.verify__x:hover { background: var(--surface-2); color: var(--text); }
:is(.verify__btn, .verify__x):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
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
