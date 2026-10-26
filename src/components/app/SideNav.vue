<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { gsap, prefersReducedMotion } from '../../utils/motion'
import { useWorkspace } from '../../composables/useWorkspace'
import { useUi } from '../../composables/useUi'
import { useOnboarding } from '../../composables/useOnboarding'
import AppIcon from './AppIcon.vue'
import ProjectIcon from './ProjectIcon.vue'
import BrandIcon from './BrandIcon.vue'
import DeleteProjectDialog from './DeleteProjectDialog.vue'
import { api } from '../../services/api'

const emit = defineEmits(['collapse'])
const PERSONAL = [
  { key: null, icon: 'home', label: 'Início', to: '/inicio' },
  { key: 'drafts', icon: 'draft', label: 'Rascunhos', to: '/rascunhos' },
  { key: 'mine', icon: 'mine', label: 'Seu trabalho', to: '/meu-trabalho' },
  { key: 'notes', icon: 'note', label: 'Notas', to: '/notas' },
  { key: 'favorites', icon: 'star', label: 'Favoritos', to: '/favoritos' },
]
const MORE = [
  { key: 'cycles', icon: 'cycle', label: 'Ciclos', to: '/ciclos' },
  { key: 'analytics', icon: 'chart', label: 'Análises', to: '/analises' },
  { key: 'archives', icon: 'archive', label: 'Arquivados', to: '/arquivados' },
  { key: 'dashboards', icon: 'dashboard', label: 'Painéis', to: '/paineis' },
]
const SUB = [
  { key: null, icon: 'overview', label: 'Visão geral', path: '/visao-geral' },
  { key: null, icon: 'items', label: 'Itens de trabalho', path: '' },
  { key: 'cycles', icon: 'cycle', label: 'Ciclos', path: '/ciclos' },
  { key: 'modules', icon: 'module', label: 'Módulos', path: '/modulos' },
  { key: 'pages', icon: 'page', label: 'Páginas', path: '/paginas' },
  { key: null, icon: 'chat', label: 'Chat', path: '/chat' },
  { key: null, icon: 'user', label: 'Membros', path: '/membros' },
]
const TRY = [
  { brand: 'github', label: 'Conectar ao GitHub', to: '/ajustes?tab=integrations' },
  { brand: 'slack', label: 'Conectar ao Slack', to: '/comecar' },
  { icon: 'ai', label: 'Experimente a Novexo IA', to: '/ia' },
]
const FEATURES = [
  { key: 'cycles', label: 'Ciclos' },
  { key: 'modules', label: 'Módulos' },
  { key: 'pages', label: 'Páginas' },
]

const route = useRoute()
const router = useRouter()
const { state, createProject, archiveProject } = useWorkspace()

const plan = ref(null)
api('/api/billing/').then((b) => (plan.value = b.subscription && { ...b.subscription, name: b.plans.find((p) => p.code === b.subscription.plan)?.name })).catch(() => {})
const planBadge = computed(() => {
  const s = plan.value
  if (!s) return null
  if (s.status === 'trialing' && s.trial_ends_at) {
    const days = Math.max(0, Math.ceil((new Date(s.trial_ends_at) - Date.now()) / 864e5))
    return { text: `Teste do ${s.name}: ${days} ${days === 1 ? 'dia' : 'dias'}`, to: `/checkout?plano=${s.plan}&ciclo=anual` }
  }
  if (s.plan === 'free' || s.status === 'canceled') return { text: 'Assinar um plano', to: '/checkout?plano=business&ciclo=anual' }
  return { text: `Plano ${s.name}${s.status === 'past_due' ? ' · pagamento pendente' : ''}`, to: '/ajustes?tab=billing' }
})
const { newTask, toast } = useUi()
const { complete } = useOnboarding()
const prefs = computed(() => state.prefs)
const personal = computed(() => PERSONAL.filter((n) => !n.key || prefs.value.nav[n.key] !== false))
const pinned = computed(() => MORE.filter((m) => prefs.value.pinned.includes(m.key)))
const sub = computed(() => SUB.filter((s) => !s.key || prefs.value.features[s.key]))

const moreOpen = ref(false)
const customizing = ref(false)
const menuFor = ref(null)
const menuPos = ref({ top: 0, left: 0 })
function toggleMenu(p, e) {
  if (menuFor.value === p.id) { menuFor.value = null; return }
  const r = e.currentTarget.getBoundingClientRect()
  const edge = e.currentTarget.closest('aside')?.getBoundingClientRect().right ?? r.right
  menuPos.value = { top: Math.max(8, Math.min(r.top - 4, innerHeight - 250)), left: Math.max(edge, r.right) + 8 }
  menuFor.value = p.id
}
const closeMenu = () => { menuFor.value = null }
const addingProject = ref(false)
const projectName = ref('')
const projInput = ref(null)
const openProjects = reactive(new Set())
const reduced = prefersReducedMotion()

const deleting = ref(null)
const currentProject = computed(() => (route.path.match(/^\/projetos\/(\d+)/) || [])[1])
watch(currentProject, (id) => id && openProjects.add(Number(id)), { immediate: true })

const base = (p) => `/projetos/${p.id}`
const subActive = (p, s) => route.path === base(p) + s.path || (s.path && route.path.startsWith(`${base(p)}${s.path}/`))
const toggleProject = (p) => (openProjects.has(p.id) ? openProjects.delete(p.id) : openProjects.add(p.id))
const toggleSection = (k) => (prefs.value.open[k] = !prefs.value.open[k])
function togglePin(key) {
  prefs.value.pinned = prefs.value.pinned.includes(key) ? prefs.value.pinned.filter((k) => k !== key) : [...prefs.value.pinned, key]
}

function onEnter(el, done) {
  if (reduced) return done()
  gsap.fromTo(el, { height: 0, autoAlpha: 0, overflow: 'hidden' }, { height: 'auto', autoAlpha: 1, duration: 0.3, ease: 'power3.out', clearProps: 'overflow', onComplete: done })
  gsap.from(el.children, { x: -6, autoAlpha: 0, duration: 0.25, stagger: 0.03, ease: 'power2.out', delay: 0.05 })
}
function onLeave(el, done) {
  if (reduced) return done()
  gsap.to(el, { height: 0, autoAlpha: 0, overflow: 'hidden', duration: 0.22, ease: 'power2.in', onComplete: done })
}
function onMoreEnter(el, done) {
  if (reduced) return done()
  gsap.timeline({ onComplete: done })
    .fromTo(el, { x: -14, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.3, ease: 'power3.out' })
    .from(el.querySelectorAll('.more__item'), { x: -8, autoAlpha: 0, duration: 0.25, stagger: 0.04, ease: 'power2.out' }, '-=0.15')
}
function onMoreLeave(el, done) {
  if (reduced) return done()
  gsap.to(el, { x: -10, autoAlpha: 0, duration: 0.18, ease: 'power2.in', onComplete: done })
}
const dialog = ref(null)
watch(customizing, async (v) => {
  if (!v) return
  await nextTick()
  dialog.value?.querySelector('input')?.focus()
  if (!reduced) gsap.fromTo(dialog.value, { y: 12, scale: 0.97, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.32, ease: 'power3.out' })
})

async function startProject() {
  addingProject.value = true
  prefs.value.open.projects = true
  await nextTick()
  projInput.value?.focus()
}
async function saveProject() {
  const n = projectName.value.trim()
  addingProject.value = false
  projectName.value = ''
  if (!n) return
  const p = await createProject(n, ['#e56515', '#fba45c', '#919599', '#f2c46d'][state.projects.length % 4])
  if (!p) return
  complete('project')
  openProjects.add(p.id)
  router.push(`${base(p)}/visao-geral`)
}
async function copyLink(p) {
  menuFor.value = null
  try { await navigator.clipboard.writeText(`${location.origin}${base(p)}`); toast('Link do projeto copiado.') } catch { toast('Não foi possível copiar o link.') }
}
async function archive(p) {
  menuFor.value = null
  if (await archiveProject(p)) {
    toast(`${p.name} foi para Arquivados.`)
    if (currentProject.value == p.id) router.push('/projetos')
  }
}

function onDocClick(e) {
  if (!e.target.closest('.more, .more-btn')) moreOpen.value = false
  if (!e.target.closest('.pmenu, .pmenu-btn')) menuFor.value = null
}
function onKey(e) {
  if (e.key !== 'Escape') return
  moreOpen.value = false
  customizing.value = false
  menuFor.value = null
}
watch(() => route.path, () => (moreOpen.value = false))
onMounted(() => {
  addEventListener('click', onDocClick)
  addEventListener('scroll', closeMenu, true)
  addEventListener('resize', closeMenu)
  addEventListener('keydown', onKey)
})
onUnmounted(() => {
  removeEventListener('scroll', closeMenu, true)
  removeEventListener('resize', closeMenu)
  removeEventListener('click', onDocClick)
  removeEventListener('keydown', onKey)
})
</script>

<template>
  <div class="side__head">
    <strong>Trabalho</strong>
    <span class="head__btns">
      <button type="button" class="icon-btn sm" aria-label="Personalizar navegação" title="Personalizar navegação" @click="customizing = true"><AppIcon name="sliders" :size="16" /></button>
      <button type="button" class="icon-btn sm" aria-label="Recolher barra lateral" title="Recolher barra lateral" @click="emit('collapse')"><AppIcon name="sidebar" :size="16" /></button>
    </span>
  </div>
  <button type="button" class="new-btn" @click="newTask(currentProject ? { projectId: Number(currentProject) } : {})"><AppIcon name="newitem" :size="16" /> Novo item de trabalho <kbd>N</kbd></button>

  <nav class="side__group" aria-label="Seu trabalho">
    <RouterLink v-for="n in personal" :key="n.label" :to="n.to" class="side__link"><AppIcon :name="n.icon" :size="17" />{{ n.label }}</RouterLink>
  </nav>

  <div class="side__group">
    <button type="button" class="side__label" :aria-expanded="prefs.open.workspace" @click="toggleSection('workspace')">Workspace <AppIcon name="chevron" :size="14" class="chev" /></button>
    <Transition :css="false" @enter="onEnter" @leave="onLeave">
      <div v-if="prefs.open.workspace" class="sect">
        <RouterLink to="/projetos" class="side__link" exact-active-class="router-link-active"><AppIcon name="folder" :size="17" />Projetos</RouterLink>
        <RouterLink v-for="m in pinned" :key="m.key" :to="m.to" class="side__link"><AppIcon :name="m.icon" :size="17" />{{ m.label }}</RouterLink>
        <button type="button" class="side__link more-btn" :aria-expanded="moreOpen" @click="moreOpen = !moreOpen"><AppIcon name="more" :size="17" />{{ moreOpen ? 'Ocultar' : 'Mais' }}</button>
      </div>
    </Transition>
  </div>

  <div class="side__group">
    <div class="side__label">
      <button type="button" class="label-btn" :aria-expanded="prefs.open.projects" @click="toggleSection('projects')">Projetos <AppIcon name="chevron" :size="14" class="chev" /></button>
      <button type="button" class="add-p" aria-label="Novo projeto" title="Novo projeto" @click="startProject"><AppIcon name="plus" :size="14" /></button>
    </div>
    <Transition :css="false" @enter="onEnter" @leave="onLeave">
      <div v-if="prefs.open.projects" class="sect">
        <div v-for="p in state.projects" :key="p.id" class="proj">
          <div class="proj__row">
            <button type="button" class="side__link proj__btn" :aria-expanded="openProjects.has(p.id)" @click="toggleProject(p)">
              <ProjectIcon :icon="p.icon" :color="p.color" :size="15" class="emoji" />
              <span class="proj__name">{{ p.name }}</span>
              <span v-if="p.shared" class="shared" :title="`Compartilhado por ${p.owner_name}`"><AppIcon name="user" :size="12" /></span>
              <AppIcon name="chevron" :size="13" class="chev proj__chev" />
            </button>
            <button type="button" class="pmenu-btn" :aria-label="`Opções de ${p.name}`" :aria-expanded="menuFor === p.id" @click="toggleMenu(p, $event)"><AppIcon name="more" :size="15" /></button>
            <Teleport defer to=".app">
            <div v-if="menuFor === p.id" class="pmenu" role="menu" :style="{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }">
              <RouterLink role="menuitem" :to="`${base(p)}/visao-geral`" @click="menuFor = null"><AppIcon name="overview" :size="15" />Abrir visão geral</RouterLink>
              <button type="button" role="menuitem" @click="copyLink(p)"><AppIcon name="arrow" :size="15" />Copiar link</button>
              <RouterLink v-if="p.my_permission === 'full'" role="menuitem" :to="`${base(p)}/membros`" @click="menuFor = null"><AppIcon name="user" :size="15" />Convidar pessoas</RouterLink>
              <button v-if="state.isAdmin && !p.shared" type="button" role="menuitem" @click="archive(p)"><AppIcon name="archive" :size="15" />Arquivar</button>
              <button v-if="state.isAdmin && !p.shared" type="button" role="menuitem" class="danger" @click="menuFor = null; deleting = p"><AppIcon name="trash" :size="15" />Excluir</button>
              <RouterLink v-if="p.shared" role="menuitem" :to="`${base(p)}/membros`" @click="menuFor = null"><AppIcon name="close" :size="15" />Sair do projeto</RouterLink>
            </div>
            </Teleport>
          </div>
          <Transition :css="false" @enter="onEnter" @leave="onLeave">
            <div v-if="openProjects.has(p.id)" class="sub">
              <RouterLink v-for="s in sub" :key="s.label" :to="base(p) + s.path" class="side__link sub__link" :class="{ 'is-active': subActive(p, s) }"><AppIcon :name="s.icon" :size="15" />{{ s.label }}</RouterLink>
            </div>
          </Transition>
        </div>
        <form v-if="addingProject" class="new-project" @submit.prevent="saveProject">
          <input ref="projInput" v-model="projectName" placeholder="Nome do projeto" aria-label="Nome do novo projeto" @blur="saveProject" @keydown.esc="addingProject = false" />
        </form>
        <p v-if="!state.projects.length && !addingProject" class="empty">Nenhum projeto ainda. <button type="button" @click="startProject">Criar um</button></p>
      </div>
    </Transition>
  </div>

  <div class="side__group try">
    <button type="button" class="side__label" :aria-expanded="prefs.open.try" @click="toggleSection('try')">Experimente <AppIcon name="chevron" :size="14" class="chev" /></button>
    <Transition :css="false" @enter="onEnter" @leave="onLeave">
      <div v-if="prefs.open.try" class="sect">
        <RouterLink v-for="t in TRY" :key="t.label" :to="t.to" class="side__link"><BrandIcon v-if="t.brand" :name="t.brand" :size="16" /><AppIcon v-else :name="t.icon" :size="16" />{{ t.label }}</RouterLink>
      </div>
    </Transition>
  </div>
  <RouterLink v-if="planBadge" :to="planBadge.to" class="trial">{{ planBadge.text }}</RouterLink>

  <Teleport to="body">
    <Transition :css="false" @enter="onMoreEnter" @leave="onMoreLeave">
      <nav v-if="moreOpen" class="more" aria-label="Mais do workspace">
        <div v-for="m in MORE" :key="m.key" class="more__item">
          <RouterLink :to="m.to" @click="moreOpen = false"><AppIcon :name="m.icon" :size="17" />{{ m.label }}</RouterLink>
          <button type="button" class="pin" :class="{ 'is-on': prefs.pinned.includes(m.key) }" :aria-pressed="prefs.pinned.includes(m.key)" :aria-label="`${prefs.pinned.includes(m.key) ? 'Desafixar' : 'Fixar'} ${m.label} na barra lateral`" @click="togglePin(m.key)"><AppIcon name="pin" :size="14" /></button>
        </div>
      </nav>
    </Transition>

    <div v-if="customizing" class="overlay" @click.self="customizing = false">
      <section ref="dialog" class="custom" role="dialog" aria-modal="true" aria-labelledby="custom-title">
        <header>
          <h2 id="custom-title">Personalizar navegação</h2>
          <button type="button" class="icon-btn sm" aria-label="Fechar" @click="customizing = false"><AppIcon name="close" :size="16" /></button>
        </header>
        <p class="lead">Os itens marcados ficam sempre na barra lateral. Os outros continuam no menu Mais. Isso vale só para você.</p>
        <fieldset>
          <legend>Pessoal</legend>
          <label v-for="n in PERSONAL.filter((x) => x.key)" :key="n.key"><input type="checkbox" :checked="prefs.nav[n.key] !== false" @change="prefs.nav[n.key] = $event.target.checked" /><AppIcon :name="n.icon" :size="15" />{{ n.label }}</label>
        </fieldset>
        <fieldset>
          <legend>Workspace</legend>
          <label v-for="m in MORE" :key="m.key"><input type="checkbox" :checked="prefs.pinned.includes(m.key)" @change="togglePin(m.key)" /><AppIcon :name="m.icon" :size="15" />{{ m.label }}</label>
        </fieldset>
        <fieldset>
          <legend>Projetos</legend>
          <label v-for="f in FEATURES" :key="f.key"><input v-model="prefs.features[f.key]" type="checkbox" /><AppIcon :name="SUB.find((s) => s.key === f.key).icon" :size="15" />{{ f.label }}</label>
        </fieldset>
      </section>
    </div>
  </Teleport>
  <DeleteProjectDialog :project="deleting" @close="deleting = null" />
</template>

<style scoped>
.side__head { display: flex; align-items: center; justify-content: space-between; padding: 0.15rem 0.25rem; font-size: 1rem; }
.head__btns { display: flex; gap: 2px; }
.icon-btn { position: relative; display: grid; place-items: center; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 6px; background: none; color: var(--muted); cursor: pointer; transition: background 0.2s var(--ease), color 0.2s var(--ease); }
.icon-btn:hover { background: var(--surface-2); color: var(--text); }
.new-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.45rem 0.75rem; border: 1px solid var(--line-strong); border-radius: 6px; background: var(--surface-2); font-weight: 500; cursor: pointer; transition: border-color 0.2s var(--ease); }
.new-btn kbd { margin-left: auto; }
.new-btn:hover { border-color: var(--accent); }
kbd { padding: 0.05rem 0.3rem; border: 1px solid var(--line-strong); border-radius: 4px; font: 500 11px/1.3 'Geist Mono', monospace; color: var(--muted); }
.side__group { display: flex; flex-direction: column; gap: 1px; }
.sect, .sub { display: flex; flex-direction: column; gap: 1px; }
.side__label { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 0.25rem 0.5rem; border: 0; border-radius: 6px; background: none; font-size: 12px; font-weight: 500; color: var(--muted); cursor: pointer; text-align: left; }
button.side__label:hover, .label-btn:hover { color: var(--text); }
.label-btn { display: flex; align-items: center; justify-content: space-between; flex: 1; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
.chev { transition: rotate 0.25s var(--ease); }
[aria-expanded='false'] > .chev, [aria-expanded='false'] .chev { rotate: -90deg; }
.add-p { display: grid; place-items: center; width: 20px; height: 20px; margin-left: 0.4rem; padding: 0; border: 0; border-radius: 4px; background: none; color: var(--muted); cursor: pointer; }
.add-p:hover { background: var(--surface-2); color: var(--text); }
.side__link { position: relative; display: flex; align-items: center; gap: 0.6rem; width: 100%; padding: 0.4rem 0.5rem; border: 0; border-radius: 6px; background: none; color: var(--text); text-decoration: none; text-align: left; white-space: nowrap; cursor: pointer; transition: background 0.2s var(--ease); }
.side__link:hover, .side__link[aria-expanded='true'].more-btn { background: var(--surface-2); }
.side__link.router-link-active:not(.proj__btn), .side__link.is-active { background: var(--surface-2); }
.side__link.router-link-active:not(.sub__link)::before, .side__link.is-active::before { content: ''; position: absolute; left: 0; top: 25%; bottom: 25%; width: 2px; border-radius: 2px; background: var(--accent); }
.side__link :deep(.app-icon) { color: var(--muted); }
.shared { display: inline-grid; place-items: center; margin-left: 0.15rem; color: var(--muted); }
.side__link.is-active :deep(.app-icon) { color: var(--accent-soft); }
.proj { position: relative; }
.proj__row { position: relative; display: flex; align-items: center; }
.proj__btn { padding-right: 2rem; }
.proj__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.proj__chev { opacity: 0; }
.proj__row:hover .proj__chev, .proj__btn:focus-visible .proj__chev { opacity: 1; }
.emoji { display: inline-flex; flex-shrink: 0; overflow: hidden; width: 17px; font-size: 14px; line-height: 1; text-align: center; }
.dot { flex-shrink: 0; width: 8px; height: 8px; margin: 0 4.5px; border-radius: 2px; }
.pmenu-btn { position: absolute; right: 4px; display: grid; place-items: center; width: 24px; height: 24px; padding: 0; border: 0; border-radius: 5px; background: none; color: var(--muted); cursor: pointer; opacity: 0; transition: opacity 0.15s, background 0.15s; }
.proj__row:hover .pmenu-btn, .pmenu-btn:focus-visible, .pmenu-btn[aria-expanded='true'] { opacity: 1; }
.pmenu-btn:hover { background: var(--line); color: var(--text); }
.pmenu { position: fixed; z-index: 70; display: flex; flex-direction: column; min-width: 12rem; padding: 0.3rem; border: 1px solid var(--line-strong); border-radius: 8px; background: var(--surface); box-shadow: 0 16px 34px rgb(0 0 0 / 0.45); }
.pmenu a, .pmenu button { display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.55rem; border: 0; border-radius: 5px; background: none; font-size: 13px; color: var(--text); text-decoration: none; text-align: left; cursor: pointer; }
.pmenu a:hover, .pmenu button:hover { background: var(--surface-2); }
.pmenu .danger { color: #ff8a7a; }
.sub { margin: 1px 0 4px 1rem; padding-left: 0.5rem; border-left: 1px solid var(--line); }
.sub__link { padding: 0.34rem 0.5rem; font-size: 13px; }
.new-project input { width: 100%; height: 30px; margin-top: 2px; padding: 0 0.5rem; border: 1px solid var(--accent); border-radius: 6px; background: var(--bg); font: inherit; color: var(--text); outline: none; }
.empty { margin: 0.25rem 0.5rem; font-size: 12.5px; color: var(--muted); }
.empty button { padding: 0; border: 0; background: none; color: var(--accent-soft); cursor: pointer; }
.try { margin-top: auto; }
.trial { align-self: flex-start; padding: 0.35rem 0.65rem; border-radius: 6px; background: var(--surface-2); font-size: 12.5px; font-weight: 500; color: var(--text); text-decoration: none; }
.trial:hover { color: var(--accent-soft); }
:is(.side__link, .new-btn, .trial, .add-p, .icon-btn, .side__label, .label-btn, .pmenu-btn):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }

.more, .custom { --surface: #181614; --surface-2: #211f1c; --line: #2e2b27; --line-strong: #3d3934; --text: #f2efea; --muted: #a29d95; --accent: #e56515; --accent-soft: #fba45c; --ease: cubic-bezier(0, 0, 0.2, 1); font: 400 14px/1.45 'Geist', 'Helvetica Neue', system-ui, sans-serif; color: var(--text); }
.more { position: fixed; top: 49px; bottom: 0; left: 313px; z-index: 45; width: 300px; padding: 0.75rem; border-right: 1px solid var(--line); background: var(--surface); box-shadow: 18px 0 40px rgb(0 0 0 / 0.35); }
.more__item { display: flex; align-items: center; border-radius: 6px; transition: background 0.2s var(--ease); }
.more__item:hover { background: var(--surface-2); }
.more__item a { display: flex; flex: 1; align-items: center; gap: 0.6rem; padding: 0.45rem 0.55rem; font-weight: 500; color: var(--text); text-decoration: none; }
.more__item :deep(.app-icon) { color: var(--muted); }
.pin { display: grid; place-items: center; width: 26px; height: 26px; margin-right: 4px; padding: 0; border: 0; border-radius: 5px; background: none; color: var(--muted); cursor: pointer; }
.pin:hover { color: var(--text); }
.pin.is-on { color: var(--accent-soft); }
.pin.is-on :deep(.app-icon) { fill: currentColor; }
.overlay { position: fixed; inset: 0; z-index: 80; display: grid; place-items: center; padding: 1rem; background: rgb(0 0 0 / 0.55); }
.custom { display: flex; flex-direction: column; gap: 1rem; width: min(34rem, 100%); max-height: calc(100vh - 2rem); overflow-y: auto; padding: 1.25rem 1.4rem 1.4rem; border: 1px solid var(--line-strong); border-radius: 12px; background: var(--surface); box-shadow: 0 30px 70px rgb(0 0 0 / 0.55); }
.custom header { display: flex; align-items: center; justify-content: space-between; }
.custom h2 { margin: 0; font: 600 1.15rem/1.2 'Geist', system-ui, sans-serif; color: var(--text); }
.lead { margin: -0.5rem 0 0; font-size: 13px; color: var(--muted); }
fieldset { display: flex; flex-direction: column; gap: 2px; margin: 0; padding: 0.4rem; border: 1px solid var(--line); border-radius: 8px; background: rgb(255 255 255 / 0.015); }
legend { padding: 0 0.3rem; font-size: 12.5px; font-weight: 500; color: var(--muted); }
fieldset label { display: flex; align-items: center; gap: 0.6rem; padding: 0.45rem 0.5rem; border-radius: 6px; cursor: pointer; }
fieldset label:hover { background: var(--surface-2); }
fieldset input { width: 15px; height: 15px; margin: 0; accent-color: var(--accent); }
fieldset :deep(.app-icon) { color: var(--muted); }
@media (max-width: 860px) { .more { left: 64px; } }
</style>
