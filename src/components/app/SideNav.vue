<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { EASE, DUR, gsap, prefersReducedMotion } from '../../utils/motion'
import { useWorkspace } from '../../composables/useWorkspace'
import { useUi } from '../../composables/useUi'
import { useOnboarding } from '../../composables/useOnboarding'
import AppIcon from './AppIcon.vue'
import ProjectIcon from './ProjectIcon.vue'
import Avatars from './Avatars.vue'
import DeleteProjectDialog from './DeleteProjectDialog.vue'

const MORE = [
  { label: 'Notas', to: '/notas' },
  { label: 'Favoritos', to: '/favoritos' },
  { label: 'Análises', to: '/analises' },
  { label: 'Painéis', to: '/paineis' },
  { label: 'Arquivados', to: '/arquivados' },
]
const SUB = [
  { key: null, label: 'Visão geral', path: '/visao-geral' },
  { key: null, label: 'Itens de trabalho', path: '' },
  { key: 'modules', label: 'Módulos', path: '/modulos' },
  { key: 'pages', label: 'Documentos do projeto', path: '/paginas' },
  { key: null, label: 'Chat', path: '/chat' },
  { key: null, label: 'Membros', path: '/membros' },
]

const route = useRoute()
const router = useRouter()
const { state, tasksOf, createProject, archiveProject } = useWorkspace()
const { toast } = useUi()
const { complete } = useOnboarding()
const prefs = computed(() => state.prefs)
const sub = computed(() => SUB.filter((s) => !s.key || prefs.value.features[s.key]))
const openCount = (p) => tasksOf(p.id).filter((t) => t.status !== 'done').length
const moreActive = computed(() => MORE.some((m) => route.path.startsWith(m.to)))

const menuFor = ref(null)
const menuPos = ref({ top: 0, left: 0 })
function toggleMenu(p, e) {
  if (menuFor.value === p.id) { menuFor.value = null; return }
  const r = e.currentTarget.getBoundingClientRect()
  const edge = e.currentTarget.closest('.rail')?.getBoundingClientRect().right ?? r.right
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
watch(moreActive, (v) => v && (prefs.value.open.more = true), { immediate: true })

const base = (p) => `/projetos/${p.id}`
const subActive = (p, s) => route.path === base(p) + s.path || (s.path && route.path.startsWith(`${base(p)}${s.path}/`))
const toggleProject = (p) => (openProjects.has(p.id) ? openProjects.delete(p.id) : openProjects.add(p.id))

function onEnter(el, done) {
  if (reduced) return done()
  gsap.fromTo(el, { height: 0, autoAlpha: 0, overflow: 'hidden' }, { height: 'auto', autoAlpha: 1, duration: DUR.fast, ease: EASE.out, clearProps: 'overflow', onComplete: done })
}
function onLeave(el, done) {
  if (reduced) return done()
  gsap.to(el, { height: 0, autoAlpha: 0, overflow: 'hidden', duration: DUR.press, ease: EASE.in, onComplete: done })
}

async function startProject() {
  addingProject.value = true
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
  if (!e.target.closest('.pmenu, .pmenu-btn')) menuFor.value = null
}
const onKey = (e) => { if (e.key === 'Escape') menuFor.value = null }
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
  <div class="tree top">
    <div v-for="p in state.projects" :key="p.id" class="row">
      <button type="button" class="link proj" :aria-expanded="openProjects.has(p.id)" @click="toggleProject(p)">
        <ProjectIcon :icon="p.icon" :color="p.color" :size="14" class="proj__icon" />
        <span class="proj__name">{{ p.name }}</span>
        <!-- projeto com mais gente: quem participa; só a pessoa: quantas tarefas faltam -->
        <span v-if="p.members?.length > 1" class="count people" :aria-label="`${p.members.length} pessoas no projeto`"><Avatars :ids="p.members" :size="18" /></span>
        <span v-else-if="openCount(p)" class="count">{{ openCount(p) }}</span>
      </button>
      <button type="button" class="row-btn pmenu-btn" :aria-label="`Opções de ${p.name}`" :aria-expanded="menuFor === p.id" @click="toggleMenu(p, $event)"><AppIcon name="more" :size="15" /></button>
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
      <Transition :css="false" @enter="onEnter" @leave="onLeave">
        <div v-if="openProjects.has(p.id)" class="nest tree">
          <RouterLink v-for="s in sub" :key="s.label" :to="base(p) + s.path" class="link small" :class="{ 'is-active': subActive(p, s) }"><span class="label">{{ s.label }}</span></RouterLink>
        </div>
      </Transition>
    </div>
    <form v-if="addingProject" @submit.prevent="saveProject">
      <input ref="projInput" v-model="projectName" class="new-project" placeholder="Nome do projeto" aria-label="Nome do novo projeto" @blur="saveProject" @keydown.esc="addingProject = false" />
    </form>
    <button v-if="!addingProject" type="button" class="link small new" @click="startProject"><AppIcon name="plus" :size="13" />Novo projeto</button>

    <div class="group">
      <button type="button" class="link more" :aria-expanded="!!prefs.open.more" @click="prefs.open.more = !prefs.open.more">Mais <AppIcon name="chevron" :size="13" class="chev" /></button>
      <Transition :css="false" @enter="onEnter" @leave="onLeave">
        <div v-if="prefs.open.more" class="nest tree">
          <RouterLink v-for="m in MORE" :key="m.to" :to="m.to" class="link small"><span class="label">{{ m.label }}</span></RouterLink>
        </div>
      </Transition>
    </div>
  </div>

  <DeleteProjectDialog :project="deleting" @close="deleting = null" />
</template>

<style scoped>
.group { display: flex; flex-direction: column; gap: 1px; }
.row { position: relative; }
.link { display: flex; align-items: center; gap: 0.55rem; width: 100%; padding: 0.38rem 0.65rem; border: 0; border-radius: 7px; background: none; font-size: 13.5px; color: var(--muted); text-align: start; text-decoration: none; white-space: nowrap; cursor: pointer; transition: background 0.2s var(--ease), color 0.2s var(--ease); }
.link:hover { background: var(--surface-2); color: var(--text); }
.link.router-link-active:not(.proj), .link.is-active { background: var(--surface-2); color: var(--text); }
.small { padding-block: 0.3rem; font-size: 13px; }
.label { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.proj { padding-inline-end: 2rem; color: var(--text); }
.proj__icon { display: inline-flex; flex-shrink: 0; overflow: hidden; width: 15px; font-size: 13px; line-height: 1; }
.proj__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.count { font-size: 12px; font-variant-numeric: tabular-nums; color: var(--muted); }
.count.people { display: inline-flex; margin-inline-start: auto; }
.row:hover .count, .proj:focus-visible .count { visibility: hidden; }
.row-btn { position: absolute; inset-block-start: 4px; inset-inline-end: 4px; display: grid; place-items: center; width: 24px; height: 24px; padding: 0; border: 0; border-radius: 5px; background: none; color: var(--muted); cursor: pointer; opacity: 0; transition: opacity 0.15s, background 0.15s; }
.row:hover > .row-btn, .row-btn:focus-visible, .row-btn[aria-expanded='true'] { opacity: 1; }
.row-btn:hover { background: var(--line); color: var(--text); }
.tree { --gap: 2px; display: flex; flex-direction: column; gap: var(--gap); }
.tree > * { --mid: 16px; position: relative; }
.tree > .small { --mid: 14px; }
.tree > *::before, .tree > :not(:last-child)::after { content: ''; position: absolute; inset-inline-start: -9px; pointer-events: none; }
.tree > *::before { top: calc(-1 * var(--gap)); width: 7px; height: calc(var(--mid) + var(--gap)); border: 0 solid var(--line-strong); border-width: 0 0 1px 1px; border-end-start-radius: 7px; }
.tree > :not(:last-child)::after { top: 0; bottom: calc(-1 * var(--gap)); border-inline-start: 1px solid var(--line-strong); }
.tree > :first-child::before { top: -6px; height: calc(var(--mid) + 6px); }
/* as linhas ficam 9px à esquerda de cada item: o padding as mantém dentro da área que o GSAP revela ao abrir, e elas crescem junto */
.nest { margin-block-start: 2px; margin-inline-start: 14px; padding-inline-start: 9px; }
.row > .nest { margin-inline-start: 18px; }
.more { justify-content: flex-start; }
.new { gap: 0.45rem; }
.new :deep(.app-icon) { flex: none; }
.chev { transition: rotate 0.25s var(--ease); }
[aria-expanded='false'] > .chev { rotate: -90deg; }
.new-project { width: 100%; height: 30px; margin-top: 2px; padding: 0 0.65rem; border: 1px solid var(--accent); border-radius: 7px; background: var(--bg); font: inherit; font-size: 13.5px; color: var(--text); outline: none; }
.pmenu { position: fixed; z-index: 70; display: flex; flex-direction: column; min-width: 12rem; padding: 0.3rem; border: 1px solid var(--line-strong); border-radius: 8px; background: var(--surface); box-shadow: 0 16px 34px rgb(0 0 0 / 0.45); }
.pmenu a, .pmenu button { display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.55rem; border: 0; border-radius: 5px; background: none; font-size: 13px; color: var(--text); text-decoration: none; text-align: start; cursor: pointer; }
.pmenu a:hover, .pmenu button:hover { background: var(--surface-2); }
.pmenu .danger { color: var(--danger, #ff8a80); }
:is(.link, .row-btn):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: -2px; }
</style>
