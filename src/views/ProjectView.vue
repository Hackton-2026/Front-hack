<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { gsap, prefersReducedMotion } from '../utils/motion'
import { useWorkspace } from '../composables/useWorkspace'
import { useUi } from '../composables/useUi'
import { useOnboarding } from '../composables/useOnboarding'
import AppIcon from '../components/app/AppIcon.vue'
import ProjectIcon from '../components/app/ProjectIcon.vue'
import Avatars from '../components/app/Avatars.vue'
import AppSelect from '../components/app/AppSelect.vue'
import TaskListView from '../components/app/TaskListView.vue'
import TaskBoard from '../components/app/TaskBoard.vue'
import TaskCalendar from '../components/app/TaskCalendar.vue'
import GooeyButton from '../components/GooeyButton.vue'
import { LAYOUTS, layout } from '../components/app/views/layouts'
import TaskGantt from '../components/app/views/TaskGantt.vue'
import TaskTable from '../components/app/views/TaskTable.vue'
import TaskGallery from '../components/app/views/TaskGallery.vue'
import TaskForm from '../components/app/views/TaskForm.vue'
import TaskStats from '../components/app/views/TaskStats.vue'
import TaskPeople from '../components/app/views/TaskPeople.vue'
import TaskMindmap from '../components/app/views/TaskMindmap.vue'
import ViewWhiteboard from '../components/app/views/ViewWhiteboard.vue'
import ViewDoc from '../components/app/views/ViewDoc.vue'
import ViewActivity from '../components/app/views/ViewActivity.vue'
import CyclesView from './CyclesView.vue'

const VIEWS = [
  { id: 'list', label: 'Lista', icon: 'list' },
  { id: 'board', label: 'Kanban', icon: 'grid' },
  { id: 'calendar', label: 'Calendário', icon: 'calendar' },
  { id: 'gantt', label: 'Gantt', icon: 'chart' },
]
const NO_FILTERS = ['doc', 'whiteboard', 'activity', 'form', 'cycles']
const props = defineProps({ id: { type: String, required: true }, cycle: { type: String, default: '' }, module: { type: String, default: '' }, view: { type: String, default: '' } })
const route = useRoute()
const router = useRouter()
const { state, STATUSES, PRIORITIES, project, member, isOverdue, tasksOf, progress, doneRatio, createItem, updateItem, removeItem } = useWorkspace()
const { ui, newTask, openChat, closeChat } = useUi()
const { complete } = useOnboarding()
const pid = computed(() => Number(props.id))
const p = computed(() => project(pid.value))
const view = computed(() => VIEWS.find((v) => v.id === route.query.v)?.id || state.prefs.defaultView)
const onlyMine = ref(false)
const q = ref('')
const tabs = ref(null)

const saved = computed(() => props.view && state.views.find((x) => x.id === Number(props.view)))
const kind = computed(() => saved.value?.type || view.value)
const pinned = computed(() => (props.cycle || props.module ? [] : state.views
  .filter((v) => v.project === pid.value && v.is_pinned && (!v.is_private || v.owner === state.me))
  .sort((a, b) => a.order - b.order || a.id - b.id)))

const MAX_TABS = 6
const visible = computed(() => { const v = pinned.value.slice(0, MAX_TABS); return saved.value?.is_pinned && !v.includes(saved.value) ? [...v.slice(0, -1), saved.value] : v })
const overflow = computed(() => pinned.value.filter((v) => !visible.value.includes(v)))

const menu = ref(null)
const adding = ref(false)
const findLayout = ref('')
const asPrivate = ref(false)
const asPinned = ref(true)
const shown = (group) => LAYOUTS.filter((l) => l.group === group && (!findLayout.value || `${l.label} ${l.desc}`.toLowerCase().includes(findLayout.value.toLowerCase())))
async function addView(l) {
  if (l.soon) return
  const v = await createItem('view', { project: pid.value, name: l.label, type: l.type, is_private: asPrivate.value, is_pinned: asPinned.value, order: pinned.value.length, config: {} })
  if (!v) return
  adding.value = false
  findLayout.value = ''
  complete('view')
  router.push(`/projetos/${pid.value}/visoes/${v.id}`)
}
const closeMenu = (e) => { if (adding.value && !menu.value?.contains(e.target)) adding.value = false }
onMounted(() => addEventListener('pointerdown', closeMenu))
onUnmounted(() => removeEventListener('pointerdown', closeMenu))

async function renameView() {
  const name = prompt('Nome da visualização', saved.value.name)?.trim()
  if (name) updateItem('view', saved.value, { name })
}
const togglePin = () => updateItem('view', saved.value, { is_pinned: !saved.value.is_pinned })
async function deleteView() {
  if (!confirm(`Apagar a visualização "${saved.value.name}"?`)) return
  const v = saved.value
  router.push(`/projetos/${pid.value}`)
  removeItem('view', v)
}

const scope = computed(() => {
  if (props.cycle) { const c = state.cycles.find((x) => x.id === Number(props.cycle)); return c && { kind: 'Ciclo', name: c.name, back: 'ciclos', match: (t) => t.cycle === c.id, defaults: { cycle: c.id } } }
  if (props.module) { const m = state.modules.find((x) => x.id === Number(props.module)); return m && { kind: 'Módulo', name: m.name, back: 'modulos', match: (t) => t.modules.includes(m.id), defaults: { modules: [m.id] } } }
  if (props.view) {
    const v = state.views.find((x) => x.id === Number(props.view))
    if (!v) return null
    const f = v.config || {}
    const has = (k, val) => !f[k]?.length || f[k].includes(val)
    return { kind: 'Visão', name: v.name, back: '', defaults: {}, match: (t) => has('status', t.status) && has('priority', t.priority) && (!f.assignees?.length || t.assignees.some((a) => f.assignees.includes(a))) && (!f.tags?.length || t.tags.some((g) => f.tags.includes(g))) }
  }
  return { kind: '', name: '', match: () => true, defaults: {} }
})
const scoped = computed(() => (scope.value ? tasksOf(pid.value).filter(scope.value.match) : []))
const people = computed(() => p.value?.members || [])

const f = ref({ who: '', status: '', priority: '', due: '' })
const filtering = computed(() => Object.values(f.value).some(Boolean) || onlyMine.value || q.value)
const clearFilters = () => { f.value = { who: '', status: '', priority: '', due: '' }; onlyMine.value = false; q.value = '' }
const WHO_OPTIONS = computed(() => [{ value: '', label: 'Responsável' }, { value: 'none', label: 'Sem responsável' }, ...people.value.map((id) => ({ value: id, label: member(id)?.name || 'Pessoa' }))])
const STATUS_OPTIONS = [{ value: '', label: 'Situação' }, ...STATUSES.map((s) => ({ value: s.id, label: s.name, color: s.color }))]
const PRIORITY_OPTIONS = [{ value: '', label: 'Prioridade' }, ...PRIORITIES.map((x) => ({ value: x.id, label: x.name, color: x.color })), { value: 'none', label: 'Sem prioridade' }]
const DUE_OPTIONS = [{ value: '', label: 'Prazo' }, { value: 'late', label: 'Atrasadas' }, { value: 'today', label: 'Vence hoje' }, { value: 'week', label: 'Próximos 7 dias' }, { value: 'none', label: 'Sem prazo' }]
const ymd = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const dueMatch = (t, k) => !k
  || (k === 'late' && isOverdue(t))
  || (k === 'today' && t.due === ymd())
  || (k === 'week' && !!t.due && t.due >= ymd() && t.due <= ymd(7))
  || (k === 'none' && !t.due)
const tasks = computed(() => scoped.value.filter((t) => (!onlyMine.value || t.assignees.includes(state.me))
  && (!q.value || t.title.toLowerCase().includes(q.value.toLowerCase()))
  && (!f.value.who || (f.value.who === 'none' ? !t.assignees.length : t.assignees.includes(f.value.who)))
  && (!f.value.status || t.status === f.value.status)
  && (!f.value.priority || (f.value.priority === 'none' ? !t.priority : t.priority === f.value.priority))
  && dueMatch(t, f.value.due)))
const canEdit = computed(() => ['edit', 'full'].includes(p.value?.my_permission))
const pct = computed(() => (scope.value?.kind ? doneRatio(scoped.value) : progress(pid.value)))
const add = () => newTask({ projectId: p.value.id, ...scope.value.defaults })

watch([p, scope], ([v, s]) => (ui.crumb = !v ? 'Projeto não encontrado' : s?.kind ? `${v.name} › ${s.name}` : `${v.name} › Itens de trabalho`), { immediate: true })
function setView(id) {
  const query = { ...route.query, v: id === state.prefs.defaultView ? undefined : id }
  props.view ? router.push({ path: `/projetos/${pid.value}`, query }) : router.replace({ query })
  if (id !== 'list') complete('view')
}
async function moveInk(animate = true) {
  await nextTick()
  const el = tabs.value?.querySelector('[aria-selected="true"]')
  const ink = tabs.value?.querySelector('.ink')
  if (!el || !ink) return
  const to = { x: el.offsetLeft, width: el.offsetWidth }
  animate && !prefersReducedMotion() ? gsap.to(ink, { ...to, duration: 0.35, ease: 'power3.out' }) : gsap.set(ink, to)
}
watch([view, () => props.view, () => pinned.value.length], () => moveInk())
onMounted(() => moveInk(false))
</script>

<template>
  <div v-if="p && scope" class="proj">
    <header class="head">
      <div class="head__title">
        <ProjectIcon :icon="p.icon" :color="p.color" :size="22" class="emoji" />
        <div>
          <RouterLink v-if="scope.kind" :to="`/projetos/${p.id}/${scope.back}`" class="back">{{ scope.kind }} · {{ p.name }}</RouterLink>
          <h1>{{ scope.kind ? scope.name : p.name }}</h1>
        </div>
        <span class="pct">{{ Math.round(pct * 100) }}% concluído · {{ scoped.length }} {{ scoped.length === 1 ? 'item' : 'itens' }}</span>
      </div>
      <div class="head__right">
        <RouterLink :to="`/projetos/${p.id}/membros`" class="people" :title="`${people.length} ${people.length === 1 ? 'pessoa' : 'pessoas'} no projeto`"><Avatars :ids="people" :size="26" /></RouterLink>
        <button type="button" class="chat-btn" :class="{ 'is-on': ui.chat === p.id }" :aria-pressed="ui.chat === p.id" aria-label="Chat do projeto" title="Chat do projeto" @click="ui.chat === p.id ? closeChat() : openChat(p.id)"><AppIcon name="chat" :size="17" /></button>
        <RouterLink :to="`/projetos/${p.id}/membros`" class="head-btn"><AppIcon name="user" :size="15" />Participantes</RouterLink>
        <GooeyButton v-if="canEdit" variant="primary" @click="add">Novo item de trabalho</GooeyButton>
      </div>
    </header>
    <div class="pbar" aria-hidden="true"><span :style="{ transform: `scaleX(${pct})` }" /></div>

    <div class="toolbar">
      <div ref="tabs" class="tabs" role="tablist" aria-label="Visualização">
        <span class="ink" aria-hidden="true" />
        <button v-for="v in VIEWS" :key="v.id" type="button" role="tab" :aria-selected="!props.view && view === v.id" @click="setView(v.id)"><AppIcon :name="v.icon" :size="13" />{{ v.label }}</button>
        <RouterLink v-for="v in visible" :key="v.id" :to="`/projetos/${p.id}/visoes/${v.id}`" role="tab" class="tab-link" :aria-selected="saved?.id === v.id">
          <AppIcon :name="layout(v.type).icon" :size="13" />{{ v.name }}<AppIcon v-if="v.is_private" name="lock" :size="11" />
        </RouterLink>
        <details v-if="overflow.length" class="more">
          <summary>Mais {{ overflow.length }}</summary>
          <div class="more__box">
            <RouterLink v-for="v in overflow" :key="v.id" :to="`/projetos/${p.id}/visoes/${v.id}`" @click="$event.target.closest('details').open = false"><AppIcon :name="layout(v.type).icon" :size="13" />{{ v.name }}</RouterLink>
          </div>
        </details>
        <div ref="menu" class="add-view">
          <button type="button" class="add-btn" :aria-expanded="adding" @click="adding = !adding"><AppIcon name="plus" :size="13" />Visualização</button>
          <div v-if="adding" class="add-menu" role="dialog" aria-label="Adicionar visualização">
            <label class="add-find"><AppIcon name="search" :size="13" /><input v-model="findLayout" placeholder="Buscar visualizações" aria-label="Buscar visualizações" /></label>
            <template v-for="[group, title] in [['popular', 'Popular'], ['more', 'Mais visualizações']]" :key="group">
              <p v-if="shown(group).length" class="add-group">{{ title }}</p>
              <div class="add-grid">
                <button v-for="l in shown(group)" :key="l.type" type="button" class="add-item" :disabled="l.soon" @click="addView(l)">
                  <span class="add-ico"><AppIcon :name="l.icon" :size="16" /></span>
                  <span><strong>{{ l.label }}</strong><small>{{ l.soon ? 'Em breve' : l.desc }}</small></span>
                </button>
              </div>
            </template>
            <div class="add-foot">
              <label><input v-model="asPrivate" type="checkbox" /> Visualização privada</label>
              <label><input v-model="asPinned" type="checkbox" /> Fixar na barra</label>
            </div>
          </div>
        </div>
      </div>
      <div v-if="saved" class="view-actions">
        <button type="button" @click="renameView">Renomear</button>
        <button type="button" @click="togglePin">{{ saved.is_pinned ? 'Desafixar' : 'Fixar na barra' }}</button>
        <button type="button" class="danger" @click="deleteView">Apagar</button>
      </div>
      <div v-if="!NO_FILTERS.includes(kind)" class="filters">
        <label class="find"><AppIcon name="search" :size="14" /><input v-model="q" placeholder="Buscar pelo título" aria-label="Buscar tarefas pelo título" /></label>
        <AppSelect v-model="f.who" size="sm" :class="{ on: f.who }" :options="WHO_OPTIONS" aria-label="Filtrar por responsável" />
        <AppSelect v-model="f.status" size="sm" :class="{ on: f.status }" :options="STATUS_OPTIONS" aria-label="Filtrar por situação" />
        <AppSelect v-model="f.priority" size="sm" :class="{ on: f.priority }" :options="PRIORITY_OPTIONS" aria-label="Filtrar por prioridade" />
        <AppSelect v-model="f.due" size="sm" :class="{ on: f.due }" :options="DUE_OPTIONS" aria-label="Filtrar por prazo" />
        <button type="button" class="toggle" :aria-pressed="onlyMine" @click="onlyMine = !onlyMine"><AppIcon name="mine" :size="14" />Só minhas</button>
        <button v-if="filtering" type="button" class="clear" @click="clearFilters">Limpar<span class="sr-only"> filtros</span> · {{ tasks.length }} de {{ scoped.length }}</button>
      </div>
    </div>

    <TaskBoard v-if="kind === 'board'" :tasks="tasks" :project-id="p.id" :defaults="scope.defaults" />
    <TaskCalendar v-else-if="kind === 'calendar'" :tasks="tasks" :project-id="p.id" :defaults="scope.defaults" />
    <TaskGantt v-else-if="kind === 'gantt' || kind === 'timeline'" :tasks="tasks" :by-person="kind === 'timeline'" />
    <TaskTable v-else-if="kind === 'table'" :tasks="tasks" />
    <TaskGallery v-else-if="kind === 'gallery'" :tasks="tasks" />
    <TaskForm v-else-if="kind === 'form'" :project-id="p.id" :defaults="scope.defaults" />
    <TaskStats v-else-if="kind === 'dashboard'" :tasks="tasks" />
    <TaskPeople v-else-if="kind === 'workload' || kind === 'team'" :tasks="tasks" :team="kind === 'team'" />
    <TaskMindmap v-else-if="kind === 'mindmap'" :tasks="tasks" :title="saved?.name || p.name" />
    <ViewWhiteboard v-else-if="kind === 'whiteboard' && saved" :key="saved.id" :view="saved" />
    <ViewDoc v-else-if="kind === 'doc' && saved" :view="saved" />
    <ViewActivity v-else-if="kind === 'activity'" :project-id="p.id" />
    <CyclesView v-else-if="kind === 'cycles'" :id="String(p.id)" />
    <TaskListView v-else :tasks="tasks" :project-id="p.id" :defaults="scope.defaults" />
  </div>
  <div v-else class="missing">
    <p>{{ p ? 'Esse item não existe mais.' : 'Esse projeto não existe mais.' }}</p>
    <RouterLink to="/projetos">Ver todos os projetos</RouterLink>
  </div>
</template>

<style scoped>
.proj { display: flex; flex-direction: column; gap: 1rem; padding: 1.5rem; }
.head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; }
.head__title { display: flex; align-items: center; gap: 0.65rem; }
.sq { width: 14px; height: 14px; border-radius: 4px; }
.emoji { font-size: 1.35rem; line-height: 1; }
.back { font-size: 12px; color: var(--muted); text-decoration: none; }
.back:hover { color: var(--accent-soft); }
h1 { margin: 0; font: 650 1.5rem/1.2 'Geist', system-ui, sans-serif; letter-spacing: -0.02em; color: var(--text); }
.pct { font-size: 12.5px; color: var(--muted); }
.head__right { display: flex; align-items: center; gap: 0.75rem; }
.people { display: inline-flex; border-radius: 999px; }
.people:focus-visible, .chat-btn:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
.chat-btn { display: grid; place-items: center; width: 36px; height: 36px; padding: 0; border: 1px solid var(--line-strong); border-radius: 8px; background: none; color: var(--muted); cursor: pointer; transition: color 0.2s var(--ease), border-color 0.2s var(--ease), background 0.2s var(--ease); }
.chat-btn:hover, .chat-btn.is-on { border-color: var(--text); color: var(--text); }
.head-btn { display: inline-flex; align-items: center; gap: 0.45rem; height: 36px; padding: 0 0.85rem; border: 1px solid var(--line-strong); border-radius: 8px; color: var(--text); font-size: 13.5px; font-weight: 500; text-decoration: none; transition: border-color 0.2s var(--ease), background 0.2s var(--ease); }
.head-btn:hover { border-color: var(--text); background: var(--surface-2); }
.head-btn:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
.chat-btn.is-on { background: var(--surface-2); }
.pbar { height: 3px; overflow: hidden; border-radius: 999px; background: var(--surface-2); }
.pbar span { display: block; height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent-soft)); transform-origin: left; transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1); }
.toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem; border-bottom: 1px solid var(--line); }
.tabs { position: relative; display: flex; gap: 0.25rem; }
.tabs { flex-wrap: wrap; align-items: center; }
.tabs > button, .tab-link { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.55rem 0.7rem; border: 0; background: none; font-weight: 500; font-size: 13.5px; color: var(--muted); text-decoration: none; cursor: pointer; transition: color 0.2s var(--ease); }
.tabs > button[aria-selected='true'], .tabs > button:hover, .tab-link[aria-selected='true'], .tab-link:hover { color: var(--text); }
:is(.tabs > button, .tab-link, .add-btn, .add-item, .view-actions button):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: -2px; border-radius: 6px; }
.add-view { position: relative; }
.more { position: relative; }
.more summary { padding: 0.55rem 0.6rem; font-size: 13px; color: var(--muted); list-style: none; cursor: pointer; }
.more summary::-webkit-details-marker { display: none; }
.more summary:hover, .more[open] summary { color: var(--text); }
.more__box { position: absolute; top: 100%; left: 0; z-index: 30; display: flex; flex-direction: column; min-width: 13rem; padding: 0.3rem; border: 1px solid var(--line-strong); border-radius: 8px; background: var(--surface); box-shadow: 0 12px 32px rgb(0 0 0 / 0.35); }
.more__box a { display: flex; align-items: center; gap: 0.45rem; padding: 0.45rem 0.5rem; border-radius: 5px; font-size: 13px; color: var(--text); text-decoration: none; }
.more__box a:hover { background: var(--surface-2); }
.add-btn { display: inline-flex; align-items: center; gap: 0.3rem; margin-left: 0.25rem; padding: 0.3rem 0.6rem; border: 1px dashed var(--line-strong); border-radius: 6px; background: none; font-size: 12.5px; color: var(--muted); cursor: pointer; }
.add-btn:hover, .add-btn[aria-expanded='true'] { border-color: var(--accent); color: var(--text); }
.add-menu { position: absolute; top: calc(100% + 6px); left: 0; z-index: 30; width: min(36rem, 92vw); max-height: 70vh; overflow-y: auto; padding: 0.6rem; border: 1px solid var(--line-strong); border-radius: 10px; background: var(--surface); box-shadow: 0 16px 40px rgb(0 0 0 / 0.4); }
.add-find { display: flex; align-items: center; gap: 0.4rem; height: 32px; margin-bottom: 0.4rem; padding: 0 0.55rem; border: 1px solid var(--line-strong); border-radius: 7px; color: var(--muted); }
.add-find:focus-within { border-color: var(--accent); }
.add-find input { flex: 1; border: 0; background: none; font: inherit; color: var(--text); outline: none; }
.add-group { margin: 0.6rem 0.3rem 0.3rem; font-size: 11.5px; font-weight: 600; color: var(--muted); }
.add-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); gap: 2px; }
.add-item { display: flex; align-items: center; gap: 0.65rem; padding: 0.5rem; border: 0; border-radius: 7px; background: none; text-align: left; color: var(--text); cursor: pointer; }
.add-item:hover:not(:disabled) { background: var(--surface-2); }
.add-item:disabled { opacity: 0.5; cursor: not-allowed; }
.add-item strong { display: block; font-size: 13.5px; font-weight: 500; }
.add-item small { display: block; font-size: 11.5px; color: var(--muted); }
.add-ico { display: grid; place-items: center; flex-shrink: 0; width: 32px; height: 32px; border-radius: 8px; background: color-mix(in srgb, var(--accent) 18%, transparent); color: var(--accent-soft); }
.add-foot { display: flex; flex-wrap: wrap; gap: 1.25rem; margin-top: 0.5rem; padding: 0.6rem 0.3rem 0.1rem; border-top: 1px solid var(--line); font-size: 12.5px; color: var(--muted); }
.add-foot label { display: flex; align-items: center; gap: 0.35rem; cursor: pointer; }
.add-foot input { accent-color: var(--accent); }
.view-actions { display: flex; gap: 0.5rem; padding-bottom: 0.45rem; }
.view-actions button { padding: 0.25rem 0.5rem; border: 0; border-radius: 5px; background: none; font-size: 12px; color: var(--muted); cursor: pointer; }
.view-actions button:hover { background: var(--surface-2); color: var(--text); }
.view-actions .danger:hover { color: #ff8a80; }
.ink { position: absolute; left: 0; bottom: -1px; height: 2px; border-radius: 2px; background: var(--accent); }
.filters { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; padding-bottom: 0.45rem; }
.filters :deep(.on) { border-color: var(--accent); color: var(--text); }
.clear { height: 30px; padding: 0 0.6rem; border: 0; border-radius: 6px; background: none; font-size: 12.5px; color: var(--muted); cursor: pointer; }
.clear:hover { color: var(--text); background: var(--surface-2); }
.clear:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.find { display: flex; align-items: center; gap: 0.4rem; height: 30px; padding: 0 0.55rem; border: 1px solid var(--line); border-radius: 6px; color: var(--muted); }
.find:focus-within { border-color: var(--accent); }
.find input { width: 9rem; border: 0; background: none; font: inherit; color: var(--text); outline: none; }
.toggle { display: inline-flex; align-items: center; gap: 0.35rem; height: 30px; padding: 0 0.65rem; border: 1px solid var(--line); border-radius: 6px; background: none; font-size: 12.5px; color: var(--muted); cursor: pointer; }
.toggle[aria-pressed='true'] { border-color: var(--accent); background: rgb(229 101 21 / 0.12); color: var(--text); }
.toggle:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
.missing { padding: 3rem 1.5rem; text-align: center; color: var(--muted); }
.missing a { color: var(--accent-soft); }
</style>
