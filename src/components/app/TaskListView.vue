<script setup>
// Visualização em Lista (a "List view" do ClickUp): grupos por status, recolhíveis, com adição rápida na linha
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { gsap, prefersReducedMotion } from '../../utils/motion'
import { useWorkspace } from '../../composables/useWorkspace'
import { useUi } from '../../composables/useUi'
import { useOnboarding } from '../../composables/useOnboarding'
import AppIcon from './AppIcon.vue'
import StatusBadge from './StatusBadge.vue'
import PriorityFlag from './PriorityFlag.vue'
import Avatars from './Avatars.vue'

const props = defineProps({ tasks: { type: Array, required: true }, projectId: { type: [String, Number], default: null }, defaults: { type: Object, default: () => ({}) }, showProject: Boolean })
const { STATUSES, code, project, isOverdue, createTask, updateTask, today } = useWorkspace()
const { openTask } = useUi()
const { complete } = useOnboarding()
const closed = reactive({})
const adding = reactive({})
const root = ref(null)

const groups = computed(() => STATUSES.map((s) => ({ ...s, tasks: props.tasks.filter((t) => t.status === s.id) })))
const fmt = (d) => d === today() ? 'Hoje' : new Date(`${d}T12:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

function toggleGroup(g, el) {
  closed[g.id] = !closed[g.id]
  if (!closed[g.id] && !prefersReducedMotion()) nextTick(() => gsap.from(el.closest('.group').querySelectorAll('.row'), { y: -6, autoAlpha: 0, duration: 0.3, stagger: 0.03, ease: 'power2.out' }))
}
async function quickAdd(status) {
  const title = (adding[status] || '').trim()
  if (!title) return
  createTask({ title, status, projectId: props.projectId, ...props.defaults })
  complete('task')
  adding[status] = ''
  await nextTick()
  const rows = root.value.querySelectorAll(`[data-group="${status}"] .row`)
  if (rows.length && !prefersReducedMotion()) gsap.from(rows[rows.length - 1], { y: 6, autoAlpha: 0, backgroundColor: 'rgb(229 101 21 / 0.2)', duration: 0.6, ease: 'power2.out' })
}
const tick = (t) => updateTask(t, { status: t.status === 'done' ? 'todo' : 'done' })

onMounted(() => {
  if (!prefersReducedMotion()) gsap.from(root.value.querySelectorAll('.group'), { y: 10, autoAlpha: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' })
})
</script>

<template>
  <div ref="root" class="list">
    <section v-for="g in groups" :key="g.id" class="group" :data-group="g.id">
      <header class="group__head">
        <button type="button" class="caret" :class="{ 'is-closed': closed[g.id] }" :aria-expanded="!closed[g.id]" :aria-label="`${closed[g.id] ? 'Abrir' : 'Fechar'} ${g.name}`" @click="toggleGroup(g, $event.currentTarget)"><AppIcon name="chevron" :size="14" /></button>
        <StatusBadge :status="g.id" />
        <span class="count">{{ g.tasks.length }}</span>
      </header>
      <template v-if="!closed[g.id]">
        <div class="cols" aria-hidden="true"><span>Nome</span><span>Responsáveis</span><span>Prazo</span><span>Prioridade</span></div>
        <div v-for="t in g.tasks" :key="t.id" class="row" role="button" tabindex="0" @click="openTask(t)" @keydown.enter="openTask(t)">
          <span class="name">
            <button type="button" class="tick" :class="{ on: t.status === 'done' }" :aria-label="t.status === 'done' ? 'Reabrir' : 'Concluir'" @click.stop="tick(t)"><StatusBadge :status="t.status" compact /></button>
            <span class="title">{{ t.title }}</span>
            <span v-if="showProject && t.projectId" class="proj" :style="{ '--c': project(t.projectId)?.color }">{{ project(t.projectId)?.name }}</span>
            <span v-for="tag in t.tags.slice(0, 2)" :key="tag" class="ntag">{{ tag }}</span>
            <span v-if="t.checklist.length" class="sub" :title="'Checklist'"><AppIcon name="check" :size="12" />{{ t.checklist.filter((i) => i.done).length }}/{{ t.checklist.length }}</span>
            <span class="code">{{ code(t) }}</span>
          </span>
          <Avatars :ids="t.assignees" />
          <span class="due" :class="{ late: isOverdue(t) }">{{ t.due ? fmt(t.due) : '—' }}</span>
          <PriorityFlag :priority="t.priority" label />
        </div>
        <form class="quick" @submit.prevent="quickAdd(g.id)">
          <AppIcon name="plus" :size="14" />
          <input v-model="adding[g.id]" :placeholder="`Adicionar tarefa em ${g.name}`" :aria-label="`Nova tarefa em ${g.name}`" />
        </form>
      </template>
    </section>
  </div>
</template>

<style scoped>
.list { display: flex; flex-direction: column; gap: 1.25rem; }
.group__head { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem; }
.caret { display: grid; place-items: center; width: 22px; height: 22px; padding: 0; border: 0; border-radius: 4px; background: none; color: var(--muted); cursor: pointer; transition: rotate 0.25s var(--ease); }
.caret.is-closed { rotate: -90deg; }
.caret:hover { background: var(--surface-2); color: var(--text); }
.count { font-size: 12px; color: var(--muted); }
.cols, .row { display: grid; grid-template-columns: minmax(0, 1fr) 7rem 6.5rem 7.5rem; align-items: center; gap: 0.75rem; padding: 0 0.75rem; }
.cols { height: 28px; border-bottom: 1px solid var(--line); font-size: 11.5px; color: var(--muted); }
.row { min-height: 40px; border-bottom: 1px solid var(--line); cursor: pointer; transition: background 0.15s var(--ease); }
.row:hover { background: var(--surface); }
:global(.is-compact) .row { min-height: 32px; }
:global(.is-compact) .quick { height: 30px; }
.row:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: -2px; }
.name { display: flex; align-items: center; gap: 0.5rem; min-width: 0; }
.tick { display: grid; place-items: center; width: 22px; height: 22px; padding: 0; border: 0; border-radius: 50%; background: none; cursor: pointer; }
.tick:hover { background: var(--surface-2); }
.title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.row:has(.tick.on) .title { color: var(--muted); text-decoration: line-through; }
.proj { flex-shrink: 0; padding: 0.05rem 0.4rem; border-radius: 4px; background: color-mix(in srgb, var(--c) 18%, transparent); font-size: 11px; color: var(--text); }
.ntag { flex-shrink: 0; padding: 0.05rem 0.4rem; border-radius: 4px; background: var(--surface-2); font-size: 11px; color: var(--muted); }
.sub { display: inline-flex; align-items: center; gap: 0.2rem; flex-shrink: 0; font-size: 11.5px; color: var(--muted); }
.code { flex-shrink: 0; margin-left: auto; font: 500 11px/1 'Geist Mono', monospace; color: var(--muted); opacity: 0; transition: opacity 0.15s; }
.row:hover .code { opacity: 1; }
.due { font-size: 12.5px; color: var(--muted); }
.due.late { color: #ff8a80; }
.quick { display: flex; align-items: center; gap: 0.5rem; padding: 0 0.75rem; height: 36px; color: var(--muted); }
.quick input { flex: 1; border: 0; background: none; font: inherit; color: var(--text); outline: none; }
.quick:focus-within { background: var(--surface); }
:is(.caret, .tick):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
@media (max-width: 760px) {
  .cols { display: none; }
  .row { grid-template-columns: minmax(0, 1fr) auto; }
  .row .due, .row :deep(.flag) { display: none; }
}
</style>
