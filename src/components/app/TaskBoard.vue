<script setup>
// Quadro kanban (Board do ClickUp + Projects do GitHub): arrastar o card troca o status; o GSAP Flip anima a reorganização.
// Como no GitHub: descrição e limite (WIP) por coluna, colunas recolhíveis, raias (agrupar por), campos visíveis,
// etiquetas coloridas e barra de subtarefas no card. As escolhas ficam nas suas preferências.
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { Flip } from 'gsap/Flip'
import { gsap, prefersReducedMotion } from '../../utils/motion'
import { useWorkspace } from '../../composables/useWorkspace'
import { useUi } from '../../composables/useUi'
import AppIcon from './AppIcon.vue'
import StatusBadge from './StatusBadge.vue'
import PriorityFlag from './PriorityFlag.vue'
import Avatars from './Avatars.vue'

gsap.registerPlugin(Flip)

const props = defineProps({ tasks: { type: Array, required: true }, projectId: { type: [String, Number], default: null }, defaults: { type: Object, default: () => ({}) } })
const { state, STATUSES, PRIORITIES, code, isOverdue, updateTask, createTask, today, project, member } = useWorkspace()
const { openTask } = useUi()
const root = ref(null)
const dragging = ref(null)
const over = ref(null)
const adding = reactive({})
const menu = ref('')
const reduced = prefersReducedMotion()

const ABOUT = { todo: 'Ainda não começou', doing: 'Alguém está trabalhando nisso', review: 'Esperando revisão', done: 'Pronto e entregue' }
const FIELDS = { project: 'Projeto', tags: 'Etiquetas', sub: 'Subtarefas', assignees: 'Responsáveis', dates: 'Datas', priority: 'Prioridade', cycle: 'Ciclo' }
state.prefs.board ||= { limits: {}, collapsed: [], hideEmpty: false, group: '', fields: Object.fromEntries(Object.keys(FIELDS).map((k) => [k, true])) }
const cfg = state.prefs.board

const visible = computed(() => STATUSES.filter((s) => !cfg.hideEmpty || props.tasks.some((t) => t.status === s.id)))
const cols = computed(() => visible.value.map((s) => ({ ...s, tasks: props.tasks.filter((t) => t.status === s.id), collapsed: cfg.collapsed.includes(s.id), limit: cfg.limits[s.id] || 0 })))
const template = computed(() => cols.value.map((c) => (c.collapsed ? '2.6rem' : 'minmax(16.5rem, 1fr)')).join(' '))

// raias: o card cai na raia do campo escolhido; soltar numa raia de prioridade também muda a prioridade
const lanes = computed(() => {
  if (cfg.group === 'priority') return [...PRIORITIES, { id: '', name: 'Sem prioridade', color: '#5d5851' }].map((p) => ({ id: p.id, label: p.name, color: p.color, has: (t) => (t.priority || '') === p.id, patch: { priority: p.id } }))
  if (cfg.group === 'assignee') {
    const ids = [...new Set(props.tasks.flatMap((t) => t.assignees))]
    return [...ids.map((id) => ({ id, label: member(id)?.name || 'Alguém', color: member(id)?.color, has: (t) => t.assignees[0] === id })), { id: 'none', label: 'Sem responsável', color: '#5d5851', has: (t) => !t.assignees.length }]
  }
  if (cfg.group === 'project') return state.projects.map((p) => ({ id: p.id, label: p.name, color: p.color, has: (t) => t.projectId === p.id, patch: { projectId: p.id } }))
  return [{ id: 'all', label: '', has: () => true }]
})
const shownLanes = computed(() => lanes.value.filter((l) => !cfg.group || props.tasks.some(l.has)))
const inLane = (c, l) => c.tasks.filter(l.has)

const fmt = (d) => (d === today() ? 'Hoje' : new Date(`${d}T12:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }))
const hue = (s) => [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7)
const subs = (t) => state.tasks.filter((x) => x.parent === t.id && !x.draft)
const cycleName = (t) => t.cycle && state.cycles.find((c) => c.id === t.cycle)?.name
const prio = (id) => PRIORITIES.find((p) => p.id === id)
const late = (c) => c.tasks.filter(isOverdue).length

// Muda os dados e anima as posições antigas → novas de todos os cards
async function withFlip(change) {
  const st = reduced ? null : Flip.getState(root.value.querySelectorAll('.card'))
  change()
  await nextTick()
  if (st) Flip.from(st, { targets: root.value.querySelectorAll('.card'), duration: 0.45, ease: 'power3.out', absolute: true, onEnter: (els) => gsap.from(els, { scale: 0.9, autoAlpha: 0, duration: 0.35 }) })
}

function onDragStart(e, task) {
  dragging.value = task
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', task.id)
}
function onDrop(status, lane) {
  const task = dragging.value
  over.value = null
  dragging.value = null
  if (!task) return
  const patch = { ...(task.status !== status && { status }), ...(lane.patch && !lane.has(task) && lane.patch) }
  if (!Object.keys(patch).length) return
  withFlip(() => updateTask(task, patch))
  nextTick(() => {
    const el = root.value.querySelector(`[data-flip-id="${task.id}"]`)
    if (el && !reduced) gsap.fromTo(el, { boxShadow: '0 0 0 2px rgb(229 101 21 / 0.9)' }, { boxShadow: '0 0 0 2px rgb(229 101 21 / 0)', duration: 1, delay: 0.3 })
  })
}
// Teclado: mover para a coluna vizinha sem arrastar
function moveBy(task, dir) {
  const i = STATUSES.findIndex((s) => s.id === task.status) + dir
  if (STATUSES[i]) withFlip(() => updateTask(task, { status: STATUSES[i].id }))
}
function add(status, lane) {
  const key = `${lane.id}:${status}`
  const title = (adding[key] || '').trim()
  if (!title) return
  withFlip(() => createTask({ title, status, projectId: props.projectId, ...props.defaults, ...lane.patch }))
  adding[key] = ''
}
const toggleCollapse = (id) => { cfg.collapsed = cfg.collapsed.includes(id) ? cfg.collapsed.filter((x) => x !== id) : [...cfg.collapsed, id]; menu.value = '' }
const setLimit = (id, v) => { cfg.limits = { ...cfg.limits, [id]: Math.max(0, Number(v) || 0) } }

const closeMenu = () => { menu.value = '' }
onUnmounted(() => window.removeEventListener('click', closeMenu))
onMounted(() => {
  window.addEventListener('click', closeMenu)
  if (!reduced) gsap.from(root.value.querySelectorAll('.col'), { y: 14, autoAlpha: 0, duration: 0.45, stagger: 0.07, ease: 'power2.out' })
})
</script>

<template>
  <div ref="root" class="kb">
    <div class="kb__bar">
      <label class="opt"><AppIcon name="layers" :size="13" />Agrupar por
        <select v-model="cfg.group" class="pg-select">
          <option value="">Nada</option><option value="priority">Prioridade</option><option value="assignee">Responsável</option><option v-if="!projectId" value="project">Projeto</option>
        </select>
      </label>
      <div class="rel">
        <button type="button" class="pg-btn" :aria-expanded="menu === 'fields'" @click.stop="menu = menu === 'fields' ? '' : 'fields'"><AppIcon name="settings" :size="13" />Campos</button>
        <div v-if="menu === 'fields'" class="pg-menu fields" @click.stop>
          <label v-for="(label, k) in FIELDS" :key="k"><input v-model="cfg.fields[k]" type="checkbox" />{{ label }}</label>
        </div>
      </div>
      <label class="opt"><input v-model="cfg.hideEmpty" type="checkbox" />Ocultar colunas vazias</label>
      <span class="total pg-muted">{{ tasks.length }} itens · {{ tasks.filter((t) => t.status === 'done').length }} concluídos</span>
    </div>

    <div class="kb__scroll">
      <div v-for="l in shownLanes" :key="l.id" class="lane">
        <h3 v-if="cfg.group" class="lane__head"><i :style="{ background: l.color }" />{{ l.label }}<span class="count">{{ tasks.filter(l.has).length }}</span></h3>
        <div class="board" :style="{ gridTemplateColumns: template }">
          <section
            v-for="c in cols"
            :key="c.id"
            class="col"
            :class="{ 'is-over': over === `${l.id}:${c.id}`, 'is-collapsed': c.collapsed, 'is-full': c.limit && c.tasks.length > c.limit }"
            :style="{ '--c': c.color }"
            :aria-label="c.name"
            @dragover.prevent="over = `${l.id}:${c.id}`"
            @dragleave.self="over = null"
            @drop.prevent="onDrop(c.id, l)"
          >
            <button v-if="c.collapsed" type="button" class="col__strip" :aria-label="`Expandir ${c.name}`" @click="toggleCollapse(c.id)">
              <i class="dot" /><span>{{ c.name }}</span><b>{{ c.tasks.length }}</b>
            </button>
            <template v-else>
              <header class="col__head">
                <div class="col__title">
                  <StatusBadge :status="c.id" />
                  <span class="count" :class="{ over: c.limit && c.tasks.length > c.limit }" :title="c.limit ? 'Itens / limite' : 'Itens'">{{ inLane(c, l).length }}<template v-if="c.limit"> / {{ c.limit }}</template></span>
                  <span v-if="late(c) && l.id === shownLanes[0].id" class="chip late" :title="`${late(c)} atrasado(s)`"><AppIcon name="calendar" :size="11" />{{ late(c) }}</span>
                  <div class="rel push">
                    <button type="button" class="pg-icon" :aria-label="`Opções de ${c.name}`" :aria-expanded="menu === c.id + l.id" @click.stop="menu = menu === c.id + l.id ? '' : c.id + l.id"><AppIcon name="more" :size="15" /></button>
                    <div v-if="menu === c.id + l.id" class="pg-menu" @click.stop>
                      <label class="lim">Limite de itens <input type="number" min="0" :value="c.limit || ''" placeholder="sem" @change="setLimit(c.id, $event.target.value)" /></label>
                      <button type="button" @click="toggleCollapse(c.id)"><AppIcon name="chevron" :size="13" />Recolher coluna</button>
                    </div>
                  </div>
                </div>
                <p v-if="l.id === shownLanes[0].id" class="col__about">{{ ABOUT[c.id] }}</p>
                <span v-if="l.id === shownLanes[0].id" class="col__bar" :title="`${Math.round((c.tasks.length / Math.max(1, tasks.length)) * 100)}% dos itens`"><i :style="{ width: `${(c.tasks.length / Math.max(1, tasks.length)) * 100}%` }" /></span>
              </header>
              <p v-if="!inLane(c, l).length" class="empty">Solte um card aqui</p>
              <article
                v-for="t in inLane(c, l)"
                :key="t.id"
                :data-flip-id="t.id"
                class="card"
                :class="{ 'is-dragging': dragging === t, 'is-late': isOverdue(t), 'is-done': t.status === 'done' }"
                :style="{ '--p': prio(t.priority)?.color || 'transparent' }"
                draggable="true"
                tabindex="0"
                :aria-label="`${t.title}. Setas esquerda e direita mudam o status.`"
                @dragstart="onDragStart($event, t)"
                @dragend="dragging = null; over = null"
                @click="openTask(t)"
                @keydown.enter="openTask(t)"
                @keydown.left.prevent="moveBy(t, -1)"
                @keydown.right.prevent="moveBy(t, 1)"
              >
                <div class="card__top">
                  <StatusBadge :status="t.status" compact />
                  <span v-if="cfg.fields.project && !projectId && project(t.projectId)" class="proj"><i :style="{ background: project(t.projectId).color }" />{{ project(t.projectId).prefix || project(t.projectId).name }}</span>
                  <span class="card__code">{{ code(t) }}</span>
                  <button v-if="t.status !== 'done'" type="button" class="next" :aria-label="`Mover ${t.title} para a próxima coluna`" title="Próxima coluna" @click.stop="moveBy(t, 1)"><AppIcon name="arrow" :size="12" /></button>
                </div>
                <p class="card__title">{{ t.title }}</p>
                <div v-if="cfg.fields.tags && t.tags.length" class="card__tags"><span v-for="tag in t.tags" :key="tag" :style="{ '--h': hue(tag) }">{{ tag }}</span></div>
                <div v-if="cfg.fields.sub && (subs(t).length || t.checklist.length)" class="sub">
                  <template v-for="[label, done, total] in [['Subtarefas', subs(t).filter((x) => x.status === 'done').length, subs(t).length], ['Checklist', t.checklist.filter((i) => i.done).length, t.checklist.length]]" :key="label">
                    <span v-if="total" class="sub__row" :title="`${label}: ${done} de ${total}`">
                      <span class="sub__bar"><i :style="{ width: `${(done / total) * 100}%` }" /></span><small>{{ done }}/{{ total }}</small>
                    </span>
                  </template>
                </div>
                <div class="chips">
                  <span v-if="cfg.fields.priority && t.priority" class="chip prio"><PriorityFlag :priority="t.priority" />{{ prio(t.priority)?.name }}</span>
                  <span v-if="cfg.fields.cycle && cycleName(t)" class="chip"><AppIcon name="cycle" :size="11" />{{ cycleName(t) }}</span>
                  <span v-if="cfg.fields.dates && t.due" class="chip" :class="{ late: isOverdue(t) }"><AppIcon name="calendar" :size="11" />{{ t.start ? `${fmt(t.start)} → ` : '' }}{{ fmt(t.due) }}</span>
                  <Avatars v-if="cfg.fields.assignees && t.assignees.length" :ids="t.assignees" :size="20" class="who" />
                </div>
              </article>
              <form class="add" @submit.prevent="add(c.id, l)">
                <AppIcon name="plus" :size="13" />
                <input v-model="adding[`${l.id}:${c.id}`]" placeholder="Adicionar item" :aria-label="`Nova tarefa em ${c.name}`" />
              </form>
            </template>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kb { display: flex; flex-direction: column; gap: 0.75rem; }
.kb__bar { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem; }
.opt { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 12.5px; color: var(--muted); cursor: pointer; }
.opt input[type='checkbox'], .fields input { accent-color: var(--accent); }
.total { margin-left: auto; font-size: 12px; }
.rel { position: relative; }
.push { margin-left: auto; }
.fields { left: 0; right: auto; gap: 0.1rem; }
.fields label { display: flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0.5rem; border-radius: 5px; font-size: 13px; cursor: pointer; }
.fields label:hover { background: var(--surface-2); }
.lim { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.35rem 0.55rem; font-size: 13px; }
.lim input { width: 3.6rem; height: 26px; padding: 0 0.4rem; border: 1px solid var(--line-strong); border-radius: 5px; background: var(--bg); font: inherit; color: var(--text); }
.kb__scroll { display: flex; flex-direction: column; gap: 1rem; overflow-x: auto; padding-bottom: 0.5rem; }
.lane__head { display: flex; align-items: center; gap: 0.5rem; margin: 0 0 0.5rem; font: 600 13px/1.3 'Geist', system-ui, sans-serif; color: var(--text); }
.lane__head i { width: 9px; height: 9px; border-radius: 3px; }
.board { display: grid; gap: 0.85rem; align-items: start; }
.col { position: relative; display: flex; flex-direction: column; gap: 0.5rem; min-height: 10rem; padding: 0.6rem; border: 1px solid var(--line); border-top: 3px solid var(--c); border-radius: 10px; background: linear-gradient(180deg, color-mix(in srgb, var(--c) 7%, var(--surface)), var(--surface) 7rem); transition: border-color 0.2s var(--ease), background 0.2s var(--ease); }
.col.is-over { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, var(--surface)); }
.col.is-full { box-shadow: inset 0 0 0 1px rgb(255 91 77 / 0.45); }
.col.is-collapsed { padding: 0; }
.col__strip { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; height: 100%; min-height: 10rem; padding: 0.7rem 0; border: 0; background: none; color: var(--text); cursor: pointer; }
.col__strip span { writing-mode: vertical-rl; font-size: 12.5px; font-weight: 500; }
.col__strip b { font-size: 11.5px; color: var(--muted); }
.dot { width: 9px; height: 9px; border-radius: 50%; background: var(--c); }
.col__head { display: flex; flex-direction: column; gap: 0.3rem; padding: 0.1rem 0.15rem 0.3rem; }
.col__title { display: flex; align-items: center; gap: 0.45rem; }
.col__about { margin: 0; font-size: 11.5px; color: var(--muted); }
.col__bar { height: 3px; overflow: hidden; border-radius: 999px; background: var(--surface-2); }
.col__bar i { display: block; height: 100%; background: var(--c); transition: width 0.4s var(--ease); }
.count { padding: 0 0.4rem; border-radius: 999px; background: var(--surface-2); font-size: 11.5px; font-variant-numeric: tabular-nums; color: var(--muted); }
.count.over { background: rgb(255 91 77 / 0.18); color: #ff8a7a; }
.empty { margin: 0; padding: 1rem 0.5rem; border: 1px dashed var(--line); border-radius: 8px; font-size: 12px; color: var(--muted); text-align: center; }
.card { position: relative; display: flex; flex-direction: column; gap: 0.45rem; padding: 0.65rem 0.75rem 0.65rem 0.85rem; overflow: hidden; border: 1px solid var(--line-strong); border-radius: 8px; background: var(--surface-2); cursor: grab; transition: border-color 0.2s var(--ease), translate 0.2s var(--ease), box-shadow 0.2s var(--ease), opacity 0.2s; }
.card::before { content: ''; position: absolute; inset: 0 auto 0 0; width: 3px; background: var(--p); }
.card:hover { border-color: color-mix(in srgb, var(--accent) 55%, var(--line-strong)); translate: 0 -1px; box-shadow: 0 8px 20px rgb(0 0 0 / 0.25); }
.card:active { cursor: grabbing; }
.card.is-dragging { opacity: 0.4; }
.card.is-done .card__title { color: var(--muted); text-decoration: line-through; text-decoration-color: var(--line-strong); }
.card:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
.card__top { display: flex; align-items: center; gap: 0.4rem; min-height: 18px; }
.proj { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 11px; color: var(--muted); }
.proj i { width: 7px; height: 7px; border-radius: 2px; }
.card__code { font: 500 11px/1 'Geist Mono', monospace; color: var(--muted); }
.next { display: grid; place-items: center; width: 20px; height: 20px; margin-left: auto; padding: 0; border: 0; border-radius: 5px; background: none; color: var(--muted); cursor: pointer; opacity: 0; transition: opacity 0.15s; }
.card:hover .next, .next:focus-visible { opacity: 1; }
.next:hover { background: var(--surface); color: var(--text); }
.card__title { margin: 0; font-weight: 500; line-height: 1.35; }
.card__tags { display: flex; flex-wrap: wrap; gap: 0.25rem; }
.card__tags span { padding: 0.05rem 0.45rem; border: 1px solid hsl(var(--h) 60% 60% / 0.45); border-radius: 999px; background: hsl(var(--h) 60% 60% / 0.14); font-size: 11px; color: hsl(var(--h) 70% 75%); }
.sub { display: flex; flex-direction: column; gap: 0.25rem; }
.sub__row { display: flex; align-items: center; gap: 0.45rem; }
.sub__bar { flex: 1; height: 4px; overflow: hidden; border-radius: 999px; background: var(--surface); }
.sub__bar i { display: block; height: 100%; background: #7fc47a; }
.sub small { font-size: 11px; font-variant-numeric: tabular-nums; color: var(--muted); }
.chips { display: flex; flex-wrap: wrap; align-items: center; gap: 0.3rem; }
.chip { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.1rem 0.4rem; border: 1px solid var(--line); border-radius: 5px; font-size: 11px; color: var(--muted); }
.chip.late { border-color: rgb(255 91 77 / 0.4); color: #ff8a80; }
.who { margin-left: auto; }
.add { display: flex; align-items: center; gap: 0.35rem; padding: 0 0.45rem; border: 1px dashed transparent; border-radius: 6px; color: var(--muted); }
.add:hover { border-color: var(--line-strong); }
.add:focus-within { border: 1px solid var(--accent); background: var(--bg); color: var(--accent-soft); }
.add input { flex: 1; height: 32px; padding: 0; border: 0; background: none; font: inherit; color: var(--text); outline: none; }
.add input::placeholder { color: var(--muted); }
:is(.col__strip, .opt input):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
</style>
