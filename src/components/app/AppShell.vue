<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { EASE, DUR, gsap, prefersReducedMotion } from '../../utils/motion'
import { useAuth } from '../../composables/useAuth'
import { api } from '../../services/api'
import { useOnboarding } from '../../composables/useOnboarding'
import { useWorkspace } from '../../composables/useWorkspace'
import { useUi } from '../../composables/useUi'
import { formatPageTitle } from '../../composables/usePageTitle'
import AppIcon from './AppIcon.vue'
import AccountMenu from './AccountMenu.vue'
import NotesDock from './NotesDock.vue'
import CommandPalette from './CommandPalette.vue'
import TaskCreateModal from './TaskCreateModal.vue'
import TaskDrawer from './TaskDrawer.vue'
import ProjectChat from '../../views/ProjectChat.vue'
import { onForegroundPush } from '../../services/push'
import SideNav from './SideNav.vue'
import BrandN from './BrandN.vue'
import '../../assets/app-pages.css'

const route = useRoute()
const router = useRouter()
const mobileNav = ref(false)
// o + de Projetos cria projeto: abre a lista e põe o cursor no formulário de novo projeto
async function newProject() {
  mobileNav.value = false
  if (route.path !== '/projetos') await router.push('/projetos')
  await nextTick()
  const f = document.getElementById('novo-projeto')
  f?.scrollIntoView({ block: 'center' })
  f?.focus()
}
const { user } = useAuth()
const { count, total } = useOnboarding()
const { state, unread, aiEnabled, load, refreshFeed, touchRecent } = useWorkspace()

const lightQuery = matchMedia('(prefers-color-scheme: light)')
const systemLight = ref(lightQuery.matches)
const onScheme = (e) => (systemLight.value = e.matches)
lightQuery.addEventListener('change', onScheme)
onUnmounted(() => lightQuery.removeEventListener('change', onScheme))
const light = computed(() => state.prefs.theme === 'light' || (state.prefs.theme === 'auto' && systemLight.value))
watchEffect(() => {
  document.documentElement.dataset.calm = state.prefs.calm ? 'on' : ''
  document.documentElement.style.setProperty('--accent', state.prefs.accent || '#e56515')
})
const { ui, newTask } = useUi()
watch(() => [route.query.task, state.loaded], ([id]) => { if (id && state.tasks.some((t) => t.id === Number(id))) ui.taskId = Number(id) }, { immediate: true })
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
watchEffect(() => {
  const raw = title.value
  if (!raw) return
  const short = raw.length <= 22 ? raw : (raw.split(' › ').pop() || route.meta.title || raw)
  document.title = formatPageTitle(short)
})
// ownTitle: a página já mostra o próprio título; um caminho de um nível só o repetiria
const crumbs = computed(() => {
  const parts = title.value.split(' › ').map((label) => ({ label }))
  const id = route.path.match(/^\/projetos\/(\d+)/)?.[1]
  if (!id || parts.length < 2) return parts
  parts[0].to = `/projetos/${id}/visao-geral`
  if (parts.length > 2 && /\/paginas\/\d+/.test(route.path)) parts[1].to = `/projetos/${id}/paginas`
  return [{ label: 'Projetos', to: '/projetos' }, ...parts]
})

const RAIL = [
  { icon: 'mine', label: 'Seu trabalho', to: '/meu-trabalho', area: 'work' },
  { icon: 'inbox', label: 'Caixa de entrada', to: '/caixa-de-entrada', area: 'inbox', badge: true },
  { icon: 'folder', label: 'Projetos', to: '/projetos', area: 'work', tree: true },
  { icon: 'wiki', label: 'Documentos', to: '/wiki', area: 'wiki' },
  { icon: 'ai', label: 'IA', to: '/ia', area: 'ai' },
]
const rail = computed(() => RAIL.filter((r) => {
  if (r.area === 'ai') return aiEnabled.value
  return !r.area || state.settings.products?.[r.area] !== false
}))
const inProjects = computed(() => route.meta.area === 'work' && route.path !== '/meu-trabalho')
const isActive = (r) => (r.tree ? route.path === '/projetos' : r.to === '/meu-trabalho' ? route.path === r.to : route.meta.area === r.area)
const ROLE_NAMES = { owner: 'Dono', admin: 'Admin', member: 'Membro', limited: 'Membro limitado', guest: 'Convidado' }
const roleName = computed(() => ROLE_NAMES[state.members.find((m) => m.id === state.me)?.role] || 'Membro')
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

const root = ref(null)
const helpOpen = computed({ get: () => ui.help, set: (v) => (ui.help = v) })
const reduced = prefersReducedMotion()

function subEnter(el, done) {
  if (reduced) return done()
  gsap.fromTo(el, { height: 0, marginBottom: 0, autoAlpha: 0, overflow: 'hidden' }, { height: 'auto', marginBottom: '0.75rem', autoAlpha: 1, duration: DUR.fast, ease: EASE.out, clearProps: 'height,marginBottom,overflow', onComplete: done })
}
function subLeave(el, done) {
  if (reduced) return done()
  gsap.to(el, { height: 0, autoAlpha: 0, marginBottom: 0, overflow: 'hidden', duration: 0.16, ease: EASE.out, onComplete: done })
}

let chord = ''
let chordTimer = 0
function currentProjectId() {
  const m = route.path.match(/^\/projetos\/(\d+)/)
  return m ? Number(m[1]) : undefined
}
function onKey(e) {
  const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable
  if (!state.prefs.shortcuts && e.key !== 'Escape') return
  const key = e.key.toLowerCase()
  if ((e.ctrlKey || e.metaKey) && key === 'k') { e.preventDefault(); ui.palette = !ui.palette; return }
  if (e.key === 'Escape') { helpOpen.value = false; mobileNav.value = false; chord = ''; return }
  if (typing || e.ctrlKey || e.metaKey || e.altKey) return

  // Linear-style instant G-chords (no animation on keyboard navigation!)
  if (chord === 'g') {
    chord = ''
    clearTimeout(chordTimer)
    if (key === 'i') { e.preventDefault(); router.push('/caixa-de-entrada'); return }
    if (key === 'm') { e.preventDefault(); router.push('/meu-trabalho'); return }
    if (key === 'p') { e.preventDefault(); router.push('/projetos'); return }
    if (key === 'w') { e.preventDefault(); router.push('/wiki'); return }
    if (key === 'a' && aiEnabled.value) { e.preventDefault(); router.push('/ia'); return }
    if (key === 's') { e.preventDefault(); router.push('/ajustes'); return }
  }
  if (key === 'g') {
    chord = 'g'
    clearTimeout(chordTimer)
    chordTimer = setTimeout(() => { chord = '' }, 900)
    return
  }
  if ((key === 'n' || key === 'c') && !ui.creating) {
    e.preventDefault()
    const pid = currentProjectId()
    newTask(pid ? { projectId: pid } : {})
  } else if (e.key === '?') {
    e.preventDefault()
    helpOpen.value = !helpOpen.value
  }
}
function onClick(e) {
  if (!e.target.closest('.pop')) helpOpen.value = false
}

watch(() => route.path, async () => {
  ui.crumb = ''
  mobileNav.value = false
  await nextTick()
  const scroller = root.value?.querySelector('.main__scroll')
  if (scroller) scroller.scrollTop = 0
})

watch(() => ui.taskId, (id) => typeof id === 'number' && touchRecent('task', id))
watch(() => route.path, (path) => {
  const m = path.match(/^\/projetos\/(\d+)(?:\/paginas\/(\d+))?/)
  if (m) touchRecent(m[2] ? 'page' : 'project', Number(m[2] || m[1]))
}, { immediate: true })

let ctx
let unsubPush
let mounted = true
const inboxTimer = setInterval(() => !document.hidden && state.loaded && refreshFeed(), 30000)
onMounted(() => {
  load()
  onForegroundPush((data) => { useUi().toast(data.body ? `${data.title}: ${data.body}` : data.title); refreshFeed() })
    .then((u) => { if (!mounted) u?.(); else unsubPush = u })
    .catch(() => {})
  addEventListener('keydown', onKey)
  addEventListener('click', onClick)
  if (reduced) return
  ctx = gsap.context(() => {
    gsap.timeline({ defaults: { ease: EASE.soft } })
      .from('.rail__item', { x: -10, autoAlpha: 0, duration: DUR.fast, stagger: 0.05 })
      .from('.top > *', { y: -6, autoAlpha: 0, duration: DUR.fast, stagger: 0.06 }, '<')
  }, root.value)
})
onUnmounted(() => {
  mounted = false
  unsubPush?.()
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
    :class="{ 'is-compact': state.prefs.density === 'compact', 'is-light': light, 'is-contrast': state.prefs.contrast, 'is-calm': state.prefs.calm, 'no-ids': !state.prefs.showIds, 'no-hand': !state.prefs.handCursor, 'nav-open': mobileNav }"
    :style="{ '--accent': state.prefs.accent }"
  >
    <div v-if="mobileNav" class="rail-backdrop" aria-hidden="true" @click="mobileNav = false" />

    <header class="top">
      <button type="button" class="icon-btn mob-menu" :aria-expanded="mobileNav" aria-label="Abrir navegação" @click="mobileNav = !mobileNav">
        <AppIcon name="sidebar" :size="18" />
      </button>
      <button type="button" class="search" aria-label="Buscar tarefas, projetos e documentos" @click="ui.palette = true">
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
          <button type="button" class="icon-btn" :aria-expanded="helpOpen" aria-label="Ajuda" @click="helpOpen = !helpOpen"><AppIcon name="help" /></button>
          <Transition name="pop"><div v-if="helpOpen" class="help">
            <strong>Atalhos do teclado</strong>
            <p><kbd>Ctrl</kbd><kbd>K</kbd> buscar e abrir qualquer coisa</p>
            <p><kbd>C</kbd> ou <kbd>N</kbd> nova tarefa</p>
            <p><kbd>G</kbd><kbd>P</kbd> projetos · <kbd>G</kbd><kbd>M</kbd> seu trabalho</p>
            <p><kbd>G</kbd><kbd>I</kbd> inbox · <kbd>G</kbd><kbd>S</kbd> ajustes</p>
            <p><kbd>?</kbd> atalhos · <kbd>Esc</kbd> fechar painéis</p>
            <RouterLink to="/comecar" @click="helpOpen = false">Ver o guia de início</RouterLink>
          </div></Transition>
        </div>
      </div>
    </header>

    <nav class="rail" aria-label="Navegação principal">
      <RouterLink to="/projetos" class="ws" :title="state.workspaceName">
        <BrandN :size="34" class="ws__logo" />
        <span class="ws__text">
          <template v-if="state.loaded">
            <strong>{{ state.workspaceName || 'Workspace' }}</strong>
            <small>{{ plural(state.projects.length, 'projeto', 'projetos') }}, {{ plural(state.members.length || 1, 'membro', 'membros') }}</small>
          </template>
          <template v-else>
            <span class="skel skel--title" aria-hidden="true" />
            <span class="skel skel--sub" aria-hidden="true" />
          </template>
        </span>
      </RouterLink>
      <div class="rail__main">
        <template v-for="r in rail" :key="r.label">
          <div class="rail__row">
            <RouterLink :to="r.to" class="rail__item" :class="{ 'is-active': isActive(r) }" :title="r.label">
              <AppIcon :name="r.icon" :size="18" /><span class="rail__label">{{ r.label }}</span><span v-if="r.badge && unread" class="rail__badge">{{ unread > 9 ? '9+' : unread }}</span>
            </RouterLink>
            <button v-if="r.tree" type="button" class="rail__add" aria-label="Novo projeto" title="Novo projeto" @click="newProject()"><AppIcon name="plus" :size="15" /></button>
          </div>
          <Transition :css="false" @enter="subEnter" @leave="subLeave">
            <div v-if="r.tree && inProjects" class="rail__sub"><SideNav /></div>
          </Transition>
        </template>
      </div>
      <div class="rail__foot">
        <RouterLink to="/" class="rail__item" title="Ir para o site"><AppIcon name="globe" :size="18" /><span class="rail__label">Ir para o site</span></RouterLink>
        <div class="rail__row">
          <RouterLink to="/ajustes" class="rail__item" :class="{ 'is-active': route.meta.area === 'settings' }" title="Ajustes"><AppIcon name="settings" :size="18" /><span class="rail__label">Ajustes</span></RouterLink>
          <NotesDock class="rail__dock" />
        </div>
        <AccountMenu v-slot="{ pic, initials, label }" up :photo="photo" class="me-wrap" @open="helpOpen = false">
          <span class="me">
            <span class="me__av"><img v-if="pic" :src="pic" alt="" /><template v-else>{{ initials }}</template></span>
            <span class="me__text">
              <strong>{{ label }}</strong>
              <small v-if="state.loaded">{{ roleName }}</small>
              <span v-else class="skel skel--sub" aria-hidden="true" />
            </span>
            <AppIcon name="updown" :size="15" class="me__switch" />
          </span>
        </AccountMenu>
      </div>
    </nav>

    <main class="main">
      <p v-if="user && user.email_verified === false && !hideVerify" class="verify" role="status">
        <AppIcon name="inbox" :size="15" />
        <span>Confirme seu e-mail <strong>{{ user.email }}</strong>: mandamos um link para lá.</span>
        <button type="button" class="verify__btn" :disabled="resending" @click="resendVerify"><ArcLoader v-if="resending" />{{ resending ? 'Enviando…' : 'Reenviar link' }}</button>
        <button type="button" class="verify__x" aria-label="Fechar aviso" @click="hideVerify = true"><AppIcon name="close" :size="14" /></button>
      </p>
      <nav v-if="crumbs.length > 1 || !route.meta.ownTitle" class="crumb" aria-label="Caminho">
        <AppIcon :name="route.meta.icon || 'work'" :size="16" />
        <template v-for="(c, i) in crumbs" :key="i">
          <AppIcon v-if="i" name="angle-small-right" :size="14" class="crumb__sep" />
          <RouterLink v-if="c.to" :to="c.to" class="crumb__link">{{ c.label }}</RouterLink>
          <span v-else :aria-current="i === crumbs.length - 1 ? 'page' : null">{{ c.label }}</span>
        </template>
        <slot name="crumb" />
      </nav>
      <div v-if="!state.loaded" class="loading" role="status">
        <template v-if="state.error">
          <p>Não foi possível carregar o workspace: {{ state.error }}</p>
          <button type="button" class="retry" @click="load">Tentar de novo</button>
        </template>
        <template v-else><ArcLoader :size="22" />Carregando seu workspace…</template>
      </div>
      <div v-else class="main__scroll"><slot /></div>
    </main>

    <Transition name="toast"><p v-if="ui.message" class="toast" role="alert">{{ ui.message }}</p></Transition>
    <Transition name="slide-side">
      <ProjectChat v-if="ui.chat && state.loaded && route.path !== `/projetos/${ui.chat}/chat`" :id="ui.chat" />
    </Transition>
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
  --accent-soft: color-mix(in srgb, var(--accent) 56%, #ffffff);
  --on-accent: #140700;
  --danger: #ff8a80;
  --success: #7fc47a;
  --ease: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
  --rail-w: 248px;
  --color-heading: var(--text);
  --color-text: var(--text);
  --color-muted: var(--muted);
  --color-placeholder: var(--muted);
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-border: var(--line);
  --color-border-strong: var(--line-strong);
  scrollbar-color: color-mix(in srgb, var(--muted) 55%, transparent) transparent;
  display: grid;
  grid-template: 'rail top' 48px 'rail main' 1fr / var(--rail-w) 1fr;
  height: 100vh;
  height: 100svh;
  background: var(--bg);
  color: var(--text);
  font: 400 14px/1.45 'Geist', 'Helvetica Neue', system-ui, sans-serif;
  overflow: hidden;
}
:global(html:has(.app)), :global(html:has(.app) body) { background: #0f0e0d; }
:global(html:has(.app.is-light)), :global(html:has(.app.is-light) body) { background: #f7f5f2; }
:global(html:has(.app)) { scrollbar-color: rgb(162 157 149 / 0.55) transparent; }
.app { color-scheme: dark; }
.app.is-light {
  --bg: #f7f5f2;
  --surface: #ffffff;
  --surface-2: #efebe6;
  --line: #e4ded6;
  --line-strong: #d2cac0;
  --text: #1c1a17;
  --muted: #6b655d;
  --accent-soft: color-mix(in srgb, var(--accent) 78%, #000000);
  --danger: #b42318;
  --success: #2a7130;
  color-scheme: light;
}
.app.is-contrast { --muted: var(--text); --line: var(--line-strong); }
.app.is-calm :deep(*) { transition: none !important; animation: none !important; }
.app.no-ids :deep(:is(.code, .row__code, .card__code)) { display: none; }
.app.no-hand :deep(:is(button, a, [role='switch'], select)) { cursor: default; }
.app :deep(button) { font: inherit; }
:where(.app) :deep(button) { color: inherit; }
.app :deep(::selection) { background: color-mix(in srgb, var(--accent) 35%, transparent); color: var(--text); }
kbd { padding: 0.05rem 0.3rem; border: 1px solid var(--line-strong); border-radius: 4px; font: 500 11px/1.3 'Geist Mono', monospace; color: var(--muted); }

.top { grid-area: top; position: relative; z-index: 70; display: flex; align-items: center; gap: 0.75rem; padding: 0 0.75rem 0 1rem; }
.mob-menu { display: none; }
.rail-backdrop { display: none; }
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
.help { position: absolute; top: 42px; right: 0; z-index: 60; display: flex; flex-direction: column; gap: 0.5rem; width: 17rem; padding: 0.9rem 1rem; border: 1px solid var(--line-strong); border-radius: 10px; background: var(--surface); box-shadow: 0 20px 40px rgb(0 0 0 / 0.45); font-size: 13px; }
.help p { margin: 0; color: var(--muted); }
.help kbd { margin-right: 0.2rem; }
.help a { color: var(--accent-soft); text-decoration: none; }
:is(.ws, .icon-btn, .rail__item, .progress-btn, .search):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }

.rail { grid-area: rail; position: relative; z-index: 65; display: flex; flex-direction: column; gap: 2px; min-height: 0; padding: 0.6rem 0.65rem 0.75rem; }
.rail__main { display: flex; flex-direction: column; gap: 2px; flex: 1; min-height: 0; margin-inline: -0.65rem; padding: 0 0.65rem 1rem; overflow: hidden auto; scrollbar-width: thin; }
.rail__row { position: relative; }
.rail__sub { display: flex; flex-direction: column; gap: 0.6rem; margin-block: 2px 0.75rem; margin-inline-start: calc(1.8rem - 9px); padding-inline-start: 9px; }
.rail__add { position: absolute; inset-block-start: 50%; inset-inline-end: 6px; display: grid; place-items: center; width: 26px; height: 26px; padding: 0; border: 0; border-radius: 6px; background: none; color: var(--muted); cursor: pointer; opacity: 0; translate: 0 -50%; transition: opacity 0.15s, background 0.15s, color 0.15s; }
.rail__row:hover .rail__add, .rail__add:focus-visible { opacity: 1; }
.rail__add:hover { background: var(--line); color: var(--text); }
.ws { display: flex; align-items: center; gap: 0.65rem; margin-bottom: 1.25rem; padding: 0.35rem; border-radius: 10px; color: var(--text); text-decoration: none; transition: background 0.2s var(--ease); }
.ws:hover { background: var(--surface-2); }
.ws__logo { flex: none; width: 34px; height: 34px; }
.ws__text, .me__text { display: flex; flex-direction: column; flex: 1; min-width: 0; line-height: 1.25; }
:is(.ws__text, .me__text) :is(strong, small) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ws__text strong { font-size: 14.5px; font-weight: 600; }
:is(.ws__text, .me__text) small { font-size: 12px; font-variant-numeric: tabular-nums; color: var(--muted); }
.skel { display: block; border-radius: 4px; background: var(--surface-2); animation: skel-pulse 1.4s ease-in-out infinite; }
.skel--title { width: 72%; height: 13px; margin-bottom: 5px; }
.skel--sub { width: 52%; height: 10px; }
@keyframes skel-pulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 0.9; } }
.rail__item { display: flex; align-items: center; gap: 0.7rem; padding: 0.45rem 0.65rem; border-radius: 8px; font-weight: 500; color: var(--muted); text-decoration: none; white-space: nowrap; transition: background 0.2s var(--ease), color 0.2s var(--ease); }
.rail__item :deep(.app-icon) { flex: none; color: color-mix(in srgb, var(--accent-soft) 55%, var(--muted)); transition: color 0.2s var(--ease); }
.rail__item:hover { background: var(--surface-2); color: var(--text); }
.rail__item:hover :deep(.app-icon) { color: var(--accent-soft); }
.rail__item.is-active { background: var(--surface-2); color: var(--text); }
.rail__badge { min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px; background: var(--accent); font: 600 11px/18px 'Geist', sans-serif; font-variant-numeric: tabular-nums; color: #fff; text-align: center; }
.rail__item.is-active :deep(.app-icon) { color: var(--accent); }
.rail__label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.rail__dock { position: absolute; inset-block-end: 1px; inset-inline-end: 2px; }
.rail__foot { display: flex; flex-direction: column; gap: 2px; padding-top: 0.5rem; }
.me-wrap { margin-top: 0.5rem; }
.me { display: flex; align-items: center; gap: 0.65rem; padding: 0.5rem 0.6rem; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); transition: border-color 0.2s var(--ease); }
.me:hover, [aria-expanded='true'] > .me { border-color: color-mix(in srgb, var(--accent) 55%, var(--line-strong)); }
.me__av { display: grid; place-items: center; flex: none; width: 32px; height: 32px; overflow: hidden; border-radius: 50%; background: linear-gradient(135deg, var(--accent-soft), var(--accent)); font: 700 12px/1 'Lexend', system-ui, sans-serif; color: #000; }
.me__av img { width: 100%; height: 100%; object-fit: cover; }
.me__text strong { font-size: 13.5px; font-weight: 600; }
.me__switch { flex: none; color: var(--muted); }

.main { grid-area: main; display: flex; flex-direction: column; min-width: 0; min-height: 0; overflow: hidden; border: 1px solid var(--line); border-width: 1px 0 0 1px; border-radius: 10px 0 0 0; background: var(--bg); }
.verify { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; margin: 0; padding: 0.55rem 1.5rem; border-bottom: 1px solid color-mix(in srgb, var(--accent) 40%, transparent); background: color-mix(in srgb, var(--accent) 10%, var(--surface)); font-size: 13px; color: var(--text); }
.verify strong { font-weight: 600; overflow-wrap: anywhere; }
.verify > :deep(.app-icon) { flex: none; color: var(--accent-soft); }
.verify__btn { margin-left: auto; padding: 0.3rem 0.7rem; border: 1px solid var(--accent); border-radius: 6px; background: none; font: inherit; font-weight: 500; color: var(--text); cursor: pointer; }
.verify__btn:hover { background: color-mix(in srgb, var(--accent) 18%, transparent); }
.verify__btn:disabled { opacity: 0.6; cursor: default; }
.verify__x { display: grid; place-items: center; width: 26px; height: 26px; padding: 0; border: 0; border-radius: 6px; background: none; color: var(--muted); cursor: pointer; }
.verify__x:hover { background: var(--surface-2); color: var(--text); }
:is(.verify__btn, .verify__x):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
.crumb { display: flex; align-items: center; gap: 0.5rem; min-height: 48px; padding: 0 1.5rem; border-bottom: 1px solid var(--line); font-weight: 500; }
.crumb > :deep(.app-icon:first-child) { color: var(--accent-soft); }
.crumb__sep { color: var(--muted); }
.crumb__link { margin: -0.2rem -0.35rem; padding: 0.2rem 0.35rem; border-radius: 6px; color: var(--muted); text-decoration: none; transition: background 0.2s var(--ease), color 0.2s var(--ease); }
.crumb__link:hover { background: var(--surface-2); color: var(--text); }
.crumb__link:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 0; }
.main__scroll { flex: 1; min-height: 0; overflow-y: auto; }
.loading { flex: 1; display: grid; place-content: center; justify-items: center; gap: 0.75rem; color: var(--muted); text-align: center; }
.loading p { margin: 0; }
.retry { padding: 0.45rem 0.9rem; border: 1px solid var(--accent); border-radius: 6px; background: color-mix(in srgb, var(--accent) 12%, transparent); cursor: pointer; }
.toast { position: fixed; left: 50%; bottom: 1.25rem; z-index: 90; max-width: min(30rem, calc(100vw - 2rem)); margin: 0; padding: 0.7rem 1rem; border: 1px solid color-mix(in srgb, var(--accent) 55%, transparent); border-radius: 10px; background: color-mix(in srgb, var(--accent) 20%, var(--surface)); color: var(--accent-soft); box-shadow: 0 12px 30px rgb(0 0 0 / 0.4); translate: -50% 0; }
.toast-enter-active { transition: opacity 0.24s cubic-bezier(0.23, 1, 0.32, 1), transform 0.26s cubic-bezier(0.23, 1, 0.32, 1); }
.toast-leave-active { transition: opacity 0.16s cubic-bezier(0.23, 1, 0.32, 1), transform 0.18s cubic-bezier(0.23, 1, 0.32, 1); }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(100%); }
@media (prefers-reduced-motion: reduce) {
  .toast-enter-from, .toast-leave-to { transform: none; }
}

@media (max-width: 860px) {
  .app { --rail-w: 0px; grid-template: 'top' 52px 'main' 1fr / 1fr; }
  .mob-menu { display: grid; width: 40px; height: 40px; }
  .icon-btn { width: 40px; height: 40px; }
  .rail-backdrop { display: none; }
  .app:not(.nav-open) .rail { display: none; }
  .app.nav-open .rail-backdrop { display: block; position: fixed; inset: 0; z-index: 75; background: rgb(0 0 0 / 0.55); }
  .app.nav-open .rail { position: fixed; inset: 0 auto 0 0; z-index: 80; display: flex; width: min(82vw, 272px); background: var(--bg); border-right: 1px solid var(--line); box-shadow: 12px 0 40px rgb(0 0 0 / 0.5); }
  .app.nav-open .rail__item { min-height: 42px; }
  .main { border-left: 0; border-radius: 0; }
  .search { flex: 1 1 auto; height: 38px; margin: 0; }
  .search kbd { display: none; }
  .progress-btn { height: 38px; }
  .me-wrap :deep(.acc__menu) { right: auto; width: 17.5rem; }
}
</style>
