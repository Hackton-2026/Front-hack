<script setup>
// Quadro kanban (o "Board" do ClickUp): arrastar o card troca o status; o GSAP Flip anima a reorganização
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { Flip } from 'gsap/Flip'
import { gsap, prefersReducedMotion } from '../../utils/motion'
import { useWorkspace } from '../../composables/useWorkspace'
import { useUi } from '../../composables/useUi'
import AppIcon from './AppIcon.vue'
import StatusBadge from './StatusBadge.vue'
import PriorityFlag from './PriorityFlag.vue'
import Avatars from './Avatars.vue'

gsap.registerPlugin(Flip)

const props = defineProps({ tasks: { type: Array, required: true }, projectId: { type: String, default: null } })
const { STATUSES, code, isOverdue, updateTask, createTask, today } = useWorkspace()
const { openTask } = useUi()
const root = ref(null)
const dragging = ref(null)
const over = ref(null)
const adding = reactive({})
const reduced = prefersReducedMotion()

const columns = computed(() => STATUSES.map((s) => ({ ...s, tasks: props.tasks.filter((t) => t.status === s.id) })))
const fmt = (d) => d === today() ? 'Hoje' : new Date(`${d}T12:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

// Muda os dados e anima as posições antigas → novas de todos os cards
async function withFlip(change) {
  const state = reduced ? null : Flip.getState(root.value.querySelectorAll('.card'))
  change()
  await nextTick()
  if (state) Flip.from(state, { targets: root.value.querySelectorAll('.card'), duration: 0.45, ease: 'power3.out', absolute: true, onEnter: (els) => gsap.from(els, { scale: 0.9, autoAlpha: 0, duration: 0.35 }) })
}

function onDragStart(e, task) {
  dragging.value = task
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', task.id)
}
function onDrop(status) {
  const task = dragging.value
  over.value = null
  dragging.value = null
  if (!task || task.status === status) return
  withFlip(() => updateTask(task, { status }))
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
function add(status) {
  const title = (adding[status] || '').trim()
  if (!title) return
  withFlip(() => createTask({ title, status, projectId: props.projectId }))
  adding[status] = ''
}

onMounted(() => {
  if (!reduced) gsap.from(root.value.querySelectorAll('.col'), { y: 14, autoAlpha: 0, duration: 0.45, stagger: 0.07, ease: 'power2.out' })
})
</script>

<template>
  <div ref="root" class="board">
    <section
      v-for="c in columns"
      :key="c.id"
      class="col"
      :class="{ 'is-over': over === c.id }"
      :aria-label="c.name"
      @dragover.prevent="over = c.id"
      @dragleave.self="over = null"
      @drop.prevent="onDrop(c.id)"
    >
      <header class="col__head"><StatusBadge :status="c.id" /><span class="count">{{ c.tasks.length }}</span></header>
      <article
        v-for="t in c.tasks"
        :key="t.id"
        :data-flip-id="t.id"
        class="card"
        :class="{ 'is-dragging': dragging === t }"
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
        <span class="card__code">{{ code(t) }}</span>
        <p class="card__title">{{ t.title }}</p>
        <div v-if="t.tags.length" class="card__tags"><span v-for="tag in t.tags" :key="tag">{{ tag }}</span></div>
        <footer class="card__foot">
          <Avatars :ids="t.assignees" :size="20" />
          <span v-if="t.checklist.length" class="meta"><AppIcon name="check" :size="12" />{{ t.checklist.filter((i) => i.done).length }}/{{ t.checklist.length }}</span>
          <span v-if="t.due" class="meta" :class="{ late: isOverdue(t) }">{{ fmt(t.due) }}</span>
          <PriorityFlag :priority="t.priority" class="flag" />
        </footer>
      </article>
      <form class="add" @submit.prevent="add(c.id)">
        <input v-model="adding[c.id]" placeholder="+ Nova tarefa" :aria-label="`Nova tarefa em ${c.name}`" />
      </form>
    </section>
  </div>
</template>

<style scoped>
.board { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(16rem, 1fr); gap: 0.85rem; align-items: start; overflow-x: auto; padding-bottom: 0.5rem; }
.col { display: flex; flex-direction: column; gap: 0.5rem; min-height: 10rem; padding: 0.6rem; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); transition: border-color 0.2s var(--ease), background 0.2s var(--ease); }
.col.is-over { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 6%, var(--surface)); }
.col__head { display: flex; align-items: center; gap: 0.5rem; padding: 0.15rem 0.2rem 0.35rem; }
.count { font-size: 12px; color: var(--muted); }
.card { display: flex; flex-direction: column; gap: 0.45rem; padding: 0.7rem 0.75rem; border: 1px solid var(--line-strong); border-radius: 8px; background: var(--surface-2); cursor: grab; transition: border-color 0.2s var(--ease), translate 0.2s var(--ease), opacity 0.2s; }
.card:hover { border-color: color-mix(in srgb, var(--accent) 55%, var(--line-strong)); translate: 0 -1px; }
.card:active { cursor: grabbing; }
.card.is-dragging { opacity: 0.4; }
.card:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
.card__code { font: 500 11px/1 'Geist Mono', monospace; color: var(--muted); }
.card__title { margin: 0; font-weight: 500; line-height: 1.35; }
.card__tags { display: flex; flex-wrap: wrap; gap: 0.25rem; }
.card__tags span { padding: 0.05rem 0.4rem; border-radius: 4px; background: var(--surface); font-size: 11px; color: var(--muted); }
.card__foot { display: flex; align-items: center; gap: 0.6rem; }
.meta { display: inline-flex; align-items: center; gap: 0.2rem; font-size: 11.5px; color: var(--muted); }
.meta.late { color: #ff8a80; }
.flag { margin-left: auto; }
.add input { width: 100%; height: 32px; padding: 0 0.5rem; border: 1px dashed transparent; border-radius: 6px; background: none; font: inherit; color: var(--text); outline: none; }
.add input::placeholder { color: var(--muted); }
.add input:hover { border-color: var(--line-strong); }
.add input:focus { border: 1px solid var(--accent); background: var(--bg); }
</style>
