<script setup>
import ProjectIcon from '../components/app/ProjectIcon.vue'
// Itens de trabalho do projeto: as três visualizações (Lista, Quadro, Calendário) sobre os mesmos dados.
// Também abre um ciclo, um módulo ou uma visão salva: aí mostra só as tarefas dele.
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { gsap, prefersReducedMotion } from '../utils/motion'
import { useWorkspace } from '../composables/useWorkspace'
import { useUi } from '../composables/useUi'
import { useOnboarding } from '../composables/useOnboarding'
import AppIcon from '../components/app/AppIcon.vue'
import Avatars from '../components/app/Avatars.vue'
import TaskListView from '../components/app/TaskListView.vue'
import TaskBoard from '../components/app/TaskBoard.vue'
import TaskCalendar from '../components/app/TaskCalendar.vue'
import GooeyButton from '../components/GooeyButton.vue'

const VIEWS = [
  { id: 'list', label: 'Lista', icon: 'doc' },
  { id: 'board', label: 'Quadro', icon: 'work' },
  { id: 'calendar', label: 'Calendário', icon: 'chevron' },
]
const props = defineProps({ id: { type: String, required: true }, cycle: { type: String, default: '' }, module: { type: String, default: '' }, view: { type: String, default: '' } })
const route = useRoute()
const router = useRouter()
const { state, project, tasksOf, progress, doneRatio } = useWorkspace()
const { ui, newTask } = useUi()
const { complete } = useOnboarding()
const pid = computed(() => Number(props.id)) // a rota traz texto; os ids da API são números
const p = computed(() => project(pid.value))
const view = computed(() => VIEWS.find((v) => v.id === route.query.v)?.id || 'list')
const onlyMine = ref(false)
const q = ref('')
const tabs = ref(null)

// recorte aberto: ciclo, módulo ou visão salva (filtros por status, prioridade, responsáveis e etiquetas)
const scope = computed(() => {
  if (props.cycle) { const c = state.cycles.find((x) => x.id === Number(props.cycle)); return c && { kind: 'Ciclo', name: c.name, back: 'ciclos', match: (t) => t.cycle === c.id, defaults: { cycle: c.id } } }
  if (props.module) { const m = state.modules.find((x) => x.id === Number(props.module)); return m && { kind: 'Módulo', name: m.name, back: 'modulos', match: (t) => t.modules.includes(m.id), defaults: { modules: [m.id] } } }
  if (props.view) {
    const v = state.views.find((x) => x.id === Number(props.view))
    if (!v) return null
    const f = v.config || {}
    const has = (k, val) => !f[k]?.length || f[k].includes(val)
    return { kind: 'Visão', name: v.name, back: 'visoes', defaults: {}, match: (t) => has('status', t.status) && has('priority', t.priority) && (!f.assignees?.length || t.assignees.some((a) => f.assignees.includes(a))) && (!f.tags?.length || t.tags.some((g) => f.tags.includes(g))) }
  }
  return { kind: '', name: '', match: () => true, defaults: {} }
})
const scoped = computed(() => (scope.value ? tasksOf(pid.value).filter(scope.value.match) : []))
const tasks = computed(() => scoped.value.filter((t) => (!onlyMine.value || t.assignees.includes(state.me)) && (!q.value || t.title.toLowerCase().includes(q.value.toLowerCase()))))
const people = computed(() => [...new Set(scoped.value.flatMap((t) => t.assignees))])
const pct = computed(() => (scope.value?.kind ? doneRatio(scoped.value) : progress(pid.value)))
const add = () => newTask({ projectId: p.value.id, ...scope.value.defaults })

watch([p, scope], ([v, s]) => (ui.crumb = !v ? 'Projeto não encontrado' : s?.kind ? `${v.name} › ${s.name}` : `${v.name} › Itens de trabalho`), { immediate: true })
function setView(id) {
  router.replace({ query: { ...route.query, v: id === 'list' ? undefined : id } })
  if (id !== 'list') complete('view')
}
// indicador da aba desliza até a aba ativa
async function moveInk(animate = true) {
  await nextTick()
  const el = tabs.value?.querySelector('[aria-selected="true"]')
  const ink = tabs.value?.querySelector('.ink')
  if (!el || !ink) return
  const to = { x: el.offsetLeft, width: el.offsetWidth }
  animate && !prefersReducedMotion() ? gsap.to(ink, { ...to, duration: 0.35, ease: 'power3.out' }) : gsap.set(ink, to)
}
watch(view, () => moveInk())
onMounted(() => moveInk(false))
</script>

<template>
  <div v-if="p && scope" class="proj">
    <header class="head">
      <div class="head__title">
        <span v-if="p.icon" class="emoji" aria-hidden="true"><ProjectIcon :icon="p.icon" /></span><span v-else class="sq" :style="{ background: p.color }" />
        <div>
          <RouterLink v-if="scope.kind" :to="`/projetos/${p.id}/${scope.back}`" class="back">{{ scope.kind }} · {{ p.name }}</RouterLink>
          <h1>{{ scope.kind ? scope.name : p.name }}</h1>
        </div>
        <span class="pct">{{ Math.round(pct * 100) }}% concluído · {{ scoped.length }} {{ scoped.length === 1 ? 'item' : 'itens' }}</span>
      </div>
      <div class="head__right">
        <Avatars :ids="people" :size="26" />
        <GooeyButton variant="primary" @click="add">Novo item de trabalho</GooeyButton>
      </div>
    </header>
    <div class="pbar" aria-hidden="true"><span :style="{ transform: `scaleX(${pct})` }" /></div>

    <div class="toolbar">
      <div ref="tabs" class="tabs" role="tablist" aria-label="Visualização">
        <span class="ink" aria-hidden="true" />
        <button v-for="v in VIEWS" :key="v.id" type="button" role="tab" :aria-selected="view === v.id" @click="setView(v.id)">{{ v.label }}</button>
      </div>
      <div class="filters">
        <label class="find"><AppIcon name="search" :size="14" /><input v-model="q" placeholder="Filtrar tarefas" aria-label="Filtrar tarefas" /></label>
        <button type="button" class="toggle" :aria-pressed="onlyMine" @click="onlyMine = !onlyMine"><AppIcon name="mine" :size="14" />Só minhas</button>
      </div>
    </div>

    <TaskListView v-if="view === 'list'" :tasks="tasks" :project-id="p.id" :defaults="scope.defaults" />
    <TaskBoard v-else-if="view === 'board'" :tasks="tasks" :project-id="p.id" :defaults="scope.defaults" />
    <TaskCalendar v-else :tasks="tasks" :project-id="p.id" :defaults="scope.defaults" />
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
.pbar { height: 3px; overflow: hidden; border-radius: 999px; background: var(--surface-2); }
.pbar span { display: block; height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent-soft)); transform-origin: left; transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1); }
.toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem; border-bottom: 1px solid var(--line); }
.tabs { position: relative; display: flex; gap: 0.25rem; }
.tabs button { padding: 0.55rem 0.75rem; border: 0; background: none; font-weight: 500; color: var(--muted); cursor: pointer; transition: color 0.2s var(--ease); }
.tabs button[aria-selected='true'], .tabs button:hover { color: var(--text); }
.tabs button:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: -2px; border-radius: 6px; }
.ink { position: absolute; left: 0; bottom: -1px; height: 2px; border-radius: 2px; background: var(--accent); }
.filters { display: flex; align-items: center; gap: 0.5rem; padding-bottom: 0.45rem; }
.find { display: flex; align-items: center; gap: 0.4rem; height: 30px; padding: 0 0.55rem; border: 1px solid var(--line); border-radius: 6px; color: var(--muted); }
.find:focus-within { border-color: var(--accent); }
.find input { width: 9rem; border: 0; background: none; font: inherit; color: var(--text); outline: none; }
.toggle { display: inline-flex; align-items: center; gap: 0.35rem; height: 30px; padding: 0 0.65rem; border: 1px solid var(--line); border-radius: 6px; background: none; font-size: 12.5px; color: var(--muted); cursor: pointer; }
.toggle[aria-pressed='true'] { border-color: var(--accent); background: rgb(229 101 21 / 0.12); color: var(--text); }
.toggle:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
.missing { padding: 3rem 1.5rem; text-align: center; color: var(--muted); }
.missing a { color: var(--accent-soft); }
</style>
