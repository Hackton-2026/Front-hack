<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { EASE, DUR, gsap, prefersReducedMotion } from '../../utils/motion'
import { useWorkspace } from '../../composables/useWorkspace'
import { useUi } from '../../composables/useUi'
import { useOnboarding } from '../../composables/useOnboarding'
import AppIcon from './AppIcon.vue'
import AppSelect from './AppSelect.vue'
import AppCheckbox from './AppCheckbox.vue'
import AppDateInput from './AppDateInput.vue'
import StatusBadge from './StatusBadge.vue'
import PriorityFlag from './PriorityFlag.vue'
import Avatars from './Avatars.vue'

const props = defineProps({ tasks: { type: Array, required: true }, projectId: { type: [String, Number], default: null }, defaults: { type: Object, default: () => ({}) }, showProject: Boolean })
const { state, STATUSES, PRIORITIES, code, project, member, peopleOf, isOverdue, createTask, updateTask, bulkUpdateTasks, today } = useWorkspace()
const { openTask, toast, confirmAsk } = useUi()
const { complete } = useOnboarding()
const closed = reactive({})
const adding = reactive({})
const root = ref(null)

// Agrupar & Ordenar (Linear Display + Asana style)
const groupBy = ref('status')
const sortBy = ref('manual')
const GROUP_OPTIONS = [
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Prioridade' },
  { value: 'assignee', label: 'Responsável' },
  { value: 'due', label: 'Prazo' },
]
const SORT_OPTIONS = [
  { value: 'manual', label: 'Ordem padrão' },
  { value: 'priority', label: 'Prioridade' },
  { value: 'due', label: 'Prazo mais próximo' },
  { value: 'updated', label: 'Atualizadas' },
]
const STATUS_OPTIONS = STATUSES.map((s) => ({ value: s.id, label: s.name, color: s.color }))
const PRIORITY_OPTIONS = [{ value: '', label: 'Sem prioridade', color: '#5d5851' }, ...PRIORITIES.map((p) => ({ value: p.id, label: p.name, color: p.color }))]
const PRIO_RANK = { urgent: 0, high: 1, normal: 2, low: 3, '': 4 }

const sortedTasks = computed(() => {
  const list = [...props.tasks]
  if (sortBy.value === 'priority') return list.sort((a, b) => (PRIO_RANK[a.priority || ''] ?? 4) - (PRIO_RANK[b.priority || ''] ?? 4))
  if (sortBy.value === 'due') return list.sort((a, b) => (a.due || '9999-99-99').localeCompare(b.due || '9999-99-99'))
  if (sortBy.value === 'updated') return list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
  return list.sort((a, b) => (a.sortPosition || 0) - (b.sortPosition || 0))
})

const groups = computed(() => {
  const src = sortedTasks.value
  if (groupBy.value === 'priority') {
    return [...PRIORITIES, { id: '', name: 'Sem prioridade', color: '#5d5851' }].map((p) => ({
      id: p.id || 'none',
      key: p.id,
      name: p.name,
      color: p.color,
      isStatus: false,
      tasks: src.filter((t) => (t.priority || '') === p.id),
      quickPatch: { status: 'todo', priority: p.id },
    })).filter((g) => g.tasks.length > 0 || g.key)
  }
  if (groupBy.value === 'assignee') {
    const ids = [...new Set(src.flatMap((t) => t.assignees))]
    return [
      ...ids.map((id) => ({
        id: String(id),
        name: member(id)?.name || 'Alguém',
        color: member(id)?.color || '#919599',
        isStatus: false,
        tasks: src.filter((t) => t.assignees.includes(id)),
        quickPatch: { status: 'todo', assignees: [id] },
      })),
      {
        id: 'unassigned',
        name: 'Sem responsável',
        color: '#5d5851',
        isStatus: false,
        tasks: src.filter((t) => !t.assignees.length),
        quickPatch: { status: 'todo', assignees: [] },
      },
    ].filter((g) => g.tasks.length > 0)
  }
  if (groupBy.value === 'due') {
    const t0 = today()
    const d7 = new Date()
    d7.setDate(d7.getDate() + 7)
    const t7 = `${d7.getFullYear()}-${String(d7.getMonth() + 1).padStart(2, '0')}-${String(d7.getDate()).padStart(2, '0')}`
    return [
      { id: 'late', name: 'Atrasadas', color: '#ff5b4d', isStatus: false, tasks: src.filter((t) => isOverdue(t)), quickPatch: { status: 'todo' } },
      { id: 'today', name: 'Vence hoje', color: '#fba45c', isStatus: false, tasks: src.filter((t) => t.due === t0 && !isOverdue(t)), quickPatch: { status: 'todo', due: t0 } },
      { id: 'week', name: 'Próximos 7 dias', color: '#f2c46d', isStatus: false, tasks: src.filter((t) => t.due && t.due > t0 && t.due <= t7), quickPatch: { status: 'todo' } },
      { id: 'later', name: 'Mais adiante', color: '#cdcdcb', isStatus: false, tasks: src.filter((t) => t.due && t.due > t7), quickPatch: { status: 'todo' } },
      { id: 'nodue', name: 'Sem prazo', color: '#5d5851', isStatus: false, tasks: src.filter((t) => !t.due), quickPatch: { status: 'todo' } },
    ].filter((g) => g.tasks.length > 0)
  }
  return STATUSES.map((s) => ({
    ...s,
    isStatus: true,
    tasks: src.filter((t) => t.status === s.id),
    quickPatch: { status: s.id },
  }))
})

const fmt = (d) => d === today() ? 'Hoje' : new Date(`${d}T12:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

// Rodapé estilo Monday.com em CSS leve: proporção de status + janela de datas do grupo
function groupDateRange(tasks) {
  const dates = tasks.map((t) => t.due).filter(Boolean).sort()
  if (!dates.length) return ''
  return dates[0] === dates[dates.length - 1] ? fmt(dates[0]) : `${fmt(dates[0])} – ${fmt(dates[dates.length - 1])}`
}
function groupStatusSegments(tasks) {
  if (!tasks.length) return []
  return STATUSES.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
    count: tasks.filter((t) => t.status === s.id).length,
  })).filter((s) => s.count > 0)
}

// Inline assignee popover
const openWhoTaskId = ref(null)
function toggleAssignee(t, uid) {
  const next = t.assignees.includes(uid) ? t.assignees.filter((a) => a !== uid) : [...t.assignees, uid]
  updateTask(t, { assignees: next })
}
const closePop = (e) => { if (openWhoTaskId.value && !e.target.closest('.who-cell')) openWhoTaskId.value = null }

// Multi-select + Shift+Click + Bulk Actions Bar (Linear / Asana style)
const selected = ref([])
let lastClickedId = null
const flatOrder = computed(() => groups.value.flatMap((g) => g.tasks.map((t) => t.id)))
const bulkBusy = ref(false)
const cycleBulkOptions = computed(() => {
  if (!props.projectId) return []
  return [{ value: '', label: 'Ciclo…' }, { value: '__none', label: 'Sem ciclo' }, ...state.cycles.filter((c) => c.project === Number(props.projectId)).map((c) => ({ value: String(c.id), label: c.name }))]
})

function toggleSelect(taskId, e) {
  if (e?.shiftKey && lastClickedId && flatOrder.value.includes(lastClickedId)) {
    const a = flatOrder.value.indexOf(lastClickedId)
    const b = flatOrder.value.indexOf(taskId)
    const [from, to] = a < b ? [a, b] : [b, a]
    selected.value = [...new Set([...selected.value, ...flatOrder.value.slice(from, to + 1)])]
  } else if (selected.value.includes(taskId)) {
    selected.value = selected.value.filter((id) => id !== taskId)
  } else {
    selected.value = [...selected.value, taskId]
  }
  lastClickedId = taskId
}

async function runBulk(patch, label) {
  if (!selected.value.length || bulkBusy.value) return
  if (patch.delete) {
    const ok = await confirmAsk(`Apagar ${selected.value.length} ${selected.value.length === 1 ? 'tarefa' : 'tarefas'}?`, {
      message: 'As tarefas selecionadas irão para a lixeira do workspace.',
    })
    if (!ok) return
  }
  bulkBusy.value = true
  const count = await bulkUpdateTasks(selected.value, patch)
  bulkBusy.value = false
  if (count !== false) {
    toast(`${count} ${count === 1 ? 'tarefa atualizada' : 'tarefas atualizadas'}${label ? ` (${label})` : ''}.`)
    selected.value = []
  }
}

function onKey(e) {
  if (e.key === 'Escape' && selected.value.length) selected.value = []
}

function toggleGroup(g, el) {
  closed[g.id] = !closed[g.id]
  if (!closed[g.id] && !prefersReducedMotion()) nextTick(() => gsap.from(el.closest('.group').querySelectorAll('.row'), { y: -6, autoAlpha: 0, duration: DUR.fast, stagger: 0.025, ease: EASE.soft }))
}
async function quickAdd(g) {
  const title = (adding[g.id] || '').trim()
  if (!title) return
  createTask({ title, projectId: props.projectId, ...props.defaults, ...g.quickPatch })
  complete('task')
  adding[g.id] = ''
  await nextTick()
  const rows = root.value?.querySelectorAll(`[data-group="${g.id}"] .row`)
  if (rows?.length && !prefersReducedMotion()) gsap.from(rows[rows.length - 1], { y: 6, autoAlpha: 0, backgroundColor: 'rgb(229 101 21 / 0.18)', duration: DUR.mid, ease: EASE.soft })
}
const tick = (t) => updateTask(t, { status: t.status === 'done' ? 'todo' : 'done' })

onMounted(() => {
  addEventListener('pointerdown', closePop)
  addEventListener('keydown', onKey)
  if (!prefersReducedMotion() && root.value) gsap.from(root.value.querySelectorAll('.group'), { y: 10, autoAlpha: 0, duration: DUR.fast, stagger: 0.05, ease: EASE.soft })
})
onUnmounted(() => {
  removeEventListener('pointerdown', closePop)
  removeEventListener('keydown', onKey)
})
</script>

<template>
  <div ref="root" class="list">
    <div class="list__bar">
      <label class="opt"><AppIcon name="layers" :size="13" />Agrupar
        <AppSelect v-model="groupBy" :options="GROUP_OPTIONS" size="sm" aria-label="Agrupar lista por" />
      </label>
      <label class="opt"><AppIcon name="sliders" :size="13" />Ordenar
        <AppSelect v-model="sortBy" :options="SORT_OPTIONS" size="sm" aria-label="Ordenar lista por" />
      </label>
      <span class="list__hint">Clique em qualquer campo para editar na linha · <kbd>Shift</kbd>+clique seleciona vários</span>
    </div>

    <section v-for="g in groups" :key="g.id" class="group" :data-group="g.id">
      <header class="group__head">
        <button type="button" class="caret" :class="{ 'is-closed': closed[g.id] }" :aria-expanded="!closed[g.id]" :aria-label="`${closed[g.id] ? 'Abrir' : 'Fechar'} ${g.name}`" @click="toggleGroup(g, $event.currentTarget)"><AppIcon name="chevron" :size="14" /></button>
        <StatusBadge v-if="g.isStatus" :status="g.id" />
        <span v-else class="g-pill"><i :style="{ background: g.color }" />{{ g.name }}</span>
        <span v-if="g.tasks.length" class="count">{{ g.tasks.length }}</span>
      </header>
      <template v-if="!closed[g.id]">
        <div class="cols" aria-hidden="true"><span /><span>Nome</span><span>Status</span><span>Responsáveis</span><span>Prazo</span><span>Prioridade</span></div>
        <div v-for="t in g.tasks" :key="t.id" class="row" :class="{ 'is-selected': selected.includes(t.id) }" role="button" tabindex="0" @click="openTask(t)" @keydown.enter="openTask(t)">
          <span class="sel-cell" @click.stop="toggleSelect(t.id, $event)">
            <AppCheckbox :model-value="selected.includes(t.id)" size="sm" :aria-label="`Selecionar ${t.title}`" @update:model-value="() => {}" />
          </span>
          <span class="name">
            <button type="button" class="tick" :class="{ on: t.status === 'done' }" :aria-label="t.status === 'done' ? 'Reabrir' : 'Concluir'" @click.stop="tick(t)"><StatusBadge :status="t.status" compact /></button>
            <span class="title">{{ t.title }}</span>
            <span v-if="t.recurrence" class="recur" title="Tarefa recorrente"><AppIcon name="cycle" :size="11" /></span>
            <span v-if="t.clientVisible" class="cvis" title="Visível no portal do cliente"><AppIcon name="globe" :size="11" /></span>
            <span v-if="showProject && t.projectId" class="proj" :style="{ '--c': project(t.projectId)?.color }">{{ project(t.projectId)?.name }}</span>
            <span v-for="tag in t.tags.slice(0, 2)" :key="tag" class="ntag">{{ tag }}</span>
            <span v-if="t.checklist.length" class="sub" title="Checklist"><AppIcon name="check" :size="12" />{{ t.checklist.filter((i) => i.done).length }}/{{ t.checklist.length }}</span>
            <span class="code">{{ code(t) }}</span>
          </span>
          <span class="inline-cell" @click.stop>
            <AppSelect ghost size="sm" :model-value="t.status" :options="STATUS_OPTIONS" aria-label="Alterar status" @change="(v) => updateTask(t, { status: v })" />
          </span>
          <span class="who-cell" @click.stop>
            <button type="button" class="who-btn" :aria-expanded="openWhoTaskId === t.id" aria-label="Alterar responsáveis" @click="openWhoTaskId = openWhoTaskId === t.id ? null : t.id">
              <Avatars v-if="t.assignees.length" :ids="t.assignees" :size="22" />
              <span v-else class="who-empty"><AppIcon name="user" :size="13" /></span>
            </button>
            <Transition name="pop">
              <div v-if="openWhoTaskId === t.id" class="who-pop" role="menu">
                <button v-for="m in peopleOf(t.projectId)" :key="m.id" type="button" role="menuitemcheckbox" :aria-checked="t.assignees.includes(m.id)" @click="toggleAssignee(t, m.id)">
                  <span class="dot" :style="{ background: m.color }" /><span>{{ m.name }}</span><AppIcon v-if="t.assignees.includes(m.id)" name="check" :size="13" class="chk" />
                </button>
              </div>
            </Transition>
          </span>
          <span class="inline-cell due-cell" :class="{ late: isOverdue(t) }" @click.stop>
            <AppDateInput size="sm" :model-value="t.due || ''" placeholder="—" aria-label="Alterar prazo" @change="(v) => updateTask(t, { due: v || null })" />
          </span>
          <span class="inline-cell" @click.stop>
            <AppSelect ghost size="sm" :model-value="t.priority || ''" :options="PRIORITY_OPTIONS" aria-label="Alterar prioridade" @change="(v) => updateTask(t, { priority: v })" />
          </span>
        </div>

        <form v-if="projectId || defaults.projectId" class="quick" @submit.prevent="quickAdd(g)">
          <AppIcon name="plus" :size="14" />
          <input v-model="adding[g.id]" :placeholder="`Adicionar tarefa em ${g.name}`" :aria-label="`Nova tarefa em ${g.name}`" />
        </form>

        <!-- Rodapé resumo leve (inspirado no Monday, sem bloat) -->
        <footer v-if="g.tasks.length" class="group__foot">
          <div class="seg-bar" :title="`${g.tasks.filter((t) => t.status === 'done').length} de ${g.tasks.length} concluídas`">
            <span v-for="seg in groupStatusSegments(g.tasks)" :key="seg.id" :style="{ flex: seg.count, background: seg.color }" :title="`${seg.name}: ${seg.count}`" />
          </div>
          <span class="foot-stat">{{ g.tasks.filter((t) => t.status === 'done').length }}/{{ g.tasks.length }} concluídas</span>
          <span v-if="groupDateRange(g.tasks)" class="foot-dates"><AppIcon name="calendar" :size="11" />{{ groupDateRange(g.tasks) }}</span>
        </footer>
      </template>
    </section>

    <!-- Barra flutuante de ações em lote -->
    <Transition name="bulk">
      <div v-if="selected.length" class="bulk" role="region" aria-label="Ações em lote">
        <span class="bulk__count">{{ selected.length }} {{ selected.length === 1 ? 'selecionada' : 'selecionadas' }}</span>
        <AppSelect size="sm" :model-value="''" :options="[{ value: '', label: 'Status…' }, ...STATUS_OPTIONS]" aria-label="Mudar status em lote" @change="(v) => v && runBulk({ status: v }, 'status')" />
        <AppSelect size="sm" :model-value="''" :options="[{ value: '', label: 'Prioridade…' }, ...PRIORITY_OPTIONS]" aria-label="Mudar prioridade em lote" @change="(v) => runBulk({ priority: v }, 'prioridade')" />
        <AppDateInput size="sm" :model-value="''" placeholder="Prazo…" aria-label="Definir prazo em lote" @change="(v) => v && runBulk({ due: v }, 'prazo')" />
        <AppSelect v-if="cycleBulkOptions.length > 2" size="sm" :model-value="''" :options="cycleBulkOptions" aria-label="Mover para ciclo em lote" @change="(v) => v && runBulk({ cycle: v === '__none' ? null : Number(v) }, 'ciclo')" />
        <button type="button" class="pg-btn bulk__danger" :disabled="bulkBusy" @click="runBulk({ delete: true }, 'apagadas')"><AppIcon name="trash" :size="13" />Apagar</button>
        <button type="button" class="bulk__close" aria-label="Limpar seleção" @click="selected = []"><AppIcon name="close" :size="14" /></button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.list { display: flex; flex-direction: column; gap: 1.15rem; padding-bottom: 3.5rem; }
.list__bar { display: flex; flex-wrap: wrap; align-items: center; gap: 0.65rem; }
.opt { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 12.5px; color: var(--muted); }
.list__hint { margin-left: auto; font-size: 11.5px; color: var(--muted); }
.list__hint kbd { padding: 0 0.3rem; border: 1px solid var(--line-strong); border-radius: 4px; font: 500 10.5px/1.4 'Geist Mono', monospace; }
.group__head { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem; }
.g-pill { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.15rem 0.55rem; border-radius: 6px; background: var(--surface-2); font-size: 12.5px; font-weight: 500; color: var(--text); }
.g-pill i { width: 8px; height: 8px; border-radius: 50%; }
.caret { display: grid; place-items: center; width: 22px; height: 22px; padding: 0; border: 0; border-radius: 4px; background: none; color: var(--muted); cursor: pointer; transition: rotate 200ms var(--ease); }
.caret.is-closed { rotate: -90deg; }
.caret:hover { background: var(--surface-2); color: var(--text); }
.count { font-size: 12px; font-variant-numeric: tabular-nums; color: var(--muted); }
.cols, .row { display: grid; grid-template-columns: 24px minmax(0, 1fr) 7.5rem 6rem 7rem 7.2rem; align-items: center; gap: 0.55rem; padding: 0 0.65rem; }
.cols { height: 28px; border-bottom: 1px solid var(--line); font-size: 11.5px; color: var(--muted); }
.row { min-height: 40px; border-bottom: 1px solid var(--line); cursor: pointer; transition: background-color 140ms ease; }
.row:hover { background: var(--surface); }
.row.is-selected { background: color-mix(in srgb, var(--accent) 9%, var(--surface)); }
:global(.is-compact) .row { min-height: 32px; }
:global(.is-compact) .quick { height: 30px; }
.row:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: -2px; }
.sel-cell { display: grid; place-items: center; opacity: 0.25; transition: opacity 140ms ease; }
.row:hover .sel-cell, .row.is-selected .sel-cell { opacity: 1; }
.name { display: flex; align-items: center; gap: 0.45rem; min-width: 0; }
.tick { display: grid; place-items: center; width: 22px; height: 22px; padding: 0; border: 0; border-radius: 50%; background: none; cursor: pointer; transition: transform 140ms cubic-bezier(0.23, 1, 0.32, 1); }
.tick:hover { background: var(--surface-2); }
.tick:active { transform: scale(0.92); }
.title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.row:has(.tick.on) .title { color: var(--muted); text-decoration: line-through; }
.recur, .cvis { display: inline-grid; place-items: center; flex-shrink: 0; width: 18px; height: 18px; border-radius: 4px; background: var(--surface-2); color: var(--accent-soft); }
.proj { flex-shrink: 0; padding: 0.05rem 0.4rem; border-radius: 4px; background: color-mix(in srgb, var(--c) 18%, transparent); font-size: 11px; color: var(--text); }
.ntag { flex-shrink: 0; padding: 0.05rem 0.4rem; border-radius: 4px; background: var(--surface-2); font-size: 11px; color: var(--muted); }
.sub { display: inline-flex; align-items: center; gap: 0.2rem; flex-shrink: 0; font-size: 11.5px; font-variant-numeric: tabular-nums; color: var(--muted); }
.code { flex-shrink: 0; margin-left: auto; font: 500 11px/1 'Geist Mono', monospace; color: var(--muted); opacity: 0; transition: opacity 150ms ease; }
.row:hover .code { opacity: 1; }
.inline-cell { min-width: 0; }
.inline-cell :deep(.sel), .inline-cell :deep(.nvx-date) { height: 28px; font-size: 12px; }
.due-cell.late :deep(.nvx-date) { color: var(--danger, #ff8a80); border-color: rgb(255 91 77 / 0.35); }
.who-cell { position: relative; display: flex; align-items: center; }
.who-btn { display: inline-flex; align-items: center; min-height: 26px; padding: 0.1rem 0.25rem; border: 1px solid transparent; border-radius: 6px; background: none; cursor: pointer; transition: border-color 140ms ease, background-color 140ms ease; }
.who-btn:hover { border-color: var(--line-strong); background: var(--surface-2); }
.who-empty { display: grid; place-items: center; width: 22px; height: 22px; border: 1px dashed var(--line-strong); border-radius: 50%; color: var(--muted); }
.who-pop { position: absolute; top: calc(100% + 4px); left: 0; z-index: 35; display: flex; flex-direction: column; min-width: 12.5rem; max-height: 15rem; overflow-y: auto; padding: 0.3rem; border: 1px solid var(--line-strong); border-radius: 8px; background: var(--surface); box-shadow: 0 16px 34px rgb(0 0 0 / 0.45); transform-origin: top left; }
.who-pop button { display: flex; align-items: center; gap: 0.5rem; padding: 0.38rem 0.55rem; border: 0; border-radius: 5px; background: none; font-size: 12.5px; color: var(--text); text-align: left; cursor: pointer; }
.who-pop button:hover { background: var(--surface-2); }
.who-pop .dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
.who-pop .chk { margin-left: auto; color: var(--accent-soft); }
.quick { display: flex; align-items: center; gap: 0.5rem; padding: 0 0.75rem 0 2.3rem; height: 36px; color: var(--muted); }
.quick input { flex: 1; border: 0; background: none; font: inherit; color: var(--text); outline: none; }
.quick:focus-within { background: var(--surface); }
.group__foot { display: flex; align-items: center; gap: 0.75rem; padding: 0.45rem 0.75rem 0.25rem 2.3rem; font-size: 11.5px; font-variant-numeric: tabular-nums; color: var(--muted); }
.seg-bar { display: flex; gap: 2px; width: 7.5rem; height: 6px; overflow: hidden; border-radius: 999px; background: var(--surface-2); }
.seg-bar span { min-width: 6px; border-radius: 999px; transition: flex 220ms cubic-bezier(0.23, 1, 0.32, 1); }
.foot-dates { display: inline-flex; align-items: center; gap: 0.3rem; margin-left: auto; padding: 0.1rem 0.45rem; border: 1px solid var(--line); border-radius: 999px; background: var(--surface); }

.bulk { position: fixed; left: 50%; bottom: 1.35rem; z-index: 75; display: flex; flex-wrap: wrap; align-items: center; gap: 0.45rem; padding: 0.45rem 0.65rem; border: 1px solid var(--line-strong); border-radius: 10px; background: var(--surface); box-shadow: 0 20px 44px rgb(0 0 0 / 0.55); transform: translateX(-50%); }
.bulk__count { padding: 0 0.4rem; font-size: 12.5px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--accent-soft); }
.bulk__danger { color: var(--danger); }
.bulk__close { display: grid; place-items: center; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 6px; background: none; color: var(--muted); cursor: pointer; }
.bulk__close:hover { background: var(--surface-2); color: var(--text); }
.bulk-enter-active { transition: opacity 180ms cubic-bezier(0.23, 1, 0.32, 1), transform 200ms cubic-bezier(0.23, 1, 0.32, 1); }
.bulk-leave-active { transition: opacity 140ms cubic-bezier(0.23, 1, 0.32, 1), transform 140ms cubic-bezier(0.23, 1, 0.32, 1); }
.bulk-enter-from, .bulk-leave-to { opacity: 0; transform: translate(-50%, 14px); }

:is(.caret, .tick, .who-btn, .bulk__close):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
@media (max-width: 900px) {
  .list__hint { display: none; }
  .cols { display: none; }
  .row { grid-template-columns: 24px minmax(0, 1fr) auto; }
  .row .inline-cell { display: none; }
  .group__foot { padding-left: 0.75rem; }
}
@media (prefers-reduced-motion: reduce) {
  .bulk-enter-active, .bulk-leave-active { transition: none; }
}
</style>
