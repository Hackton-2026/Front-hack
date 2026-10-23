<script setup>
// Rascunhos: caixa de entrada pessoal de ideias. Captura rápida com #etiqueta !prioridade e data, grupos por idade
// (o que está esquecido aparece), projeto sugerido e publicação em massa. Rascunhos não aparecem para o time.
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { gsap, prefersReducedMotion, staggerIn } from '../utils/motion'
import { parseQuick } from '../utils/quick'
import { useWorkspace } from '../composables/useWorkspace'
import { useUi } from '../composables/useUi'
import AppIcon from '../components/app/AppIcon.vue'
import PriorityFlag from '../components/app/PriorityFlag.vue'

const { state, drafts, project, createTask, updateTask, removeTask, day, PRIORITIES } = useWorkspace()
const { openTask, toast } = useUi()
const root = ref(null)
const capture = ref('')
const parsed = computed(() => parseQuick(capture.value))
const q = ref('')
const newest = ref(true)
const selected = reactive(new Set())
const target = reactive({})
const bulkProject = ref('')

const ageDays = (d) => Math.floor((Date.now() - new Date(d.createdAt)) / 864e5)
const list = computed(() => drafts.value
  .filter((d) => !q.value || `${d.title} ${d.tags.join(' ')}`.toLowerCase().includes(q.value.toLowerCase()))
  .sort((a, b) => (newest.value ? -1 : 1) * a.createdAt.localeCompare(b.createdAt)))
const GROUPS = [['today', 'Hoje', (a) => a < 1], ['week', 'Esta semana', (a) => a >= 1 && a <= 7], ['old', 'Esquecidos há mais de uma semana', (a) => a > 7]]
const groups = computed(() => GROUPS.map(([id, label, test]) => ({ id, label, items: list.value.filter((d) => test(ageDays(d))) })).filter((g) => g.items.length))

// projeto sugerido: o que tem mais tarefas com as mesmas etiquetas; sem etiqueta, o primeiro projeto
function suggest(d) {
  let best = null, score = 0
  for (const p of state.projects) {
    const s = state.tasks.filter((t) => t.projectId === p.id && !t.draft && t.tags.some((g) => d.tags.includes(g))).length
    if (s > score) { best = p; score = s }
  }
  return best
}
const destination = (d) => target[d.id] || d.projectId || suggest(d)?.id || state.projects[0]?.id

function add() {
  const { title, tags, priority, due } = parsed.value
  if (!title) return
  createTask({ title, tags, priority, due, projectId: null, assignees: [state.me] })
  capture.value = ''
  nextTick(() => staggerIn(root.value?.querySelectorAll('.draft:first-child')))
}
async function publish(d, el) {
  const projectId = destination(d)
  if (!projectId) { toast('Crie um projeto antes de publicar.'); return }
  const go = () => { selected.delete(d.id); updateTask(d, { draft: false, projectId }) }
  const row = el?.closest('.draft')
  prefersReducedMotion() || !row ? go() : gsap.to(row, { x: 40, autoAlpha: 0, duration: 0.3, ease: 'power2.in', onComplete: go })
}
function publishSelected() {
  const pid = Number(bulkProject.value) || null
  const items = drafts.value.filter((d) => selected.has(d.id))
  for (const d of items) { if (pid) target[d.id] = pid; publish(d) }
  toast(`${items.length} rascunho(s) publicado(s).`)
}
function removeSelected() {
  drafts.value.filter((d) => selected.has(d.id)).forEach((d) => removeTask(d))
  selected.clear()
}
const toggleSel = (d) => (selected.has(d.id) ? selected.delete(d.id) : selected.add(d.id))
const allSelected = computed(() => list.value.length > 0 && list.value.every((d) => selected.has(d.id)))
const toggleAll = () => (allSelected.value ? selected.clear() : list.value.forEach((d) => selected.add(d.id)))
const fmt = (d) => (d === day(0) ? 'hoje' : d === day(1) ? 'amanhã' : new Date(`${d}T12:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }))
const prioName = (id) => PRIORITIES.find((p) => p.id === id)?.name
watch(q, async () => { await nextTick(); staggerIn(root.value?.querySelectorAll('.draft')) })
</script>

<template>
  <div ref="root" class="pg drafts">
    <div class="pg-bar">
      <h1>Rascunhos <span class="count">{{ drafts.length }}</span></h1>
      <div class="pg-bar__right">
        <label class="pg-search"><AppIcon name="search" :size="14" /><input v-model="q" placeholder="Buscar rascunhos" aria-label="Buscar rascunhos" /></label>
        <button type="button" class="pg-btn" @click="newest = !newest"><AppIcon name="sort" :size="14" />{{ newest ? 'Mais novos' : 'Mais antigos' }}</button>
      </div>
    </div>

    <form class="capture" @submit.prevent="add">
      <AppIcon name="plus" :size="16" />
      <input v-model="capture" placeholder='Anote uma ideia: "Revisar copy #marketing !alta amanhã" e Enter' aria-label="Novo rascunho" />
      <span v-if="parsed.tags.length || parsed.priority || parsed.due" class="tokens" aria-live="polite">
        <span v-for="t in parsed.tags" :key="t" class="tok">#{{ t }}</span>
        <span v-if="parsed.priority" class="tok">!{{ prioName(parsed.priority) }}</span>
        <span v-if="parsed.due" class="tok"><AppIcon name="calendar" :size="11" />{{ fmt(parsed.due) }}</span>
      </span>
    </form>

    <div v-if="selected.size" class="bulk" role="toolbar" aria-label="Ações nos selecionados">
      <strong>{{ selected.size }} selecionado(s)</strong>
      <select v-model="bulkProject" class="pg-select" aria-label="Projeto para publicar"><option value="">Projeto sugerido de cada um</option><option v-for="p in state.projects" :key="p.id" :value="p.id">{{ p.name }}</option></select>
      <button type="button" class="pg-btn primary" @click="publishSelected">Publicar</button>
      <button type="button" class="pg-btn" @click="removeSelected"><AppIcon name="trash" :size="14" />Apagar</button>
      <button type="button" class="pg-btn" @click="selected.clear()">Cancelar</button>
    </div>

    <div v-if="!drafts.length" class="pg-empty">
      <span class="pg-empty__art"><AppIcon name="draft" :size="36" /></span>
      <h2>Sua caixa de ideias</h2>
      <p>Anote aqui o que ainda não tem projeto. Use <code>#etiqueta</code>, <code>!alta</code> e <code>amanhã</code> ou <code>25/11</code> para já deixar pronto. Só você vê os rascunhos.</p>
    </div>
    <p v-else-if="!list.length" class="pg-muted none">Nenhum rascunho com "{{ q }}".</p>

    <section v-for="g in groups" :key="g.id" class="group" :class="{ old: g.id === 'old' }">
      <header>
        <label class="box"><input type="checkbox" :checked="allSelected" aria-label="Selecionar todos" @change="toggleAll" /></label>
        <h2>{{ g.label }}</h2><span class="pg-muted">{{ g.items.length }}</span>
        <span v-if="g.id === 'old'" class="hint">Publique ou apague: ideias paradas viram ruído.</span>
      </header>
      <div v-for="d in g.items" :key="d.id" class="draft" :class="{ sel: selected.has(d.id) }">
        <label class="box"><input type="checkbox" :checked="selected.has(d.id)" :aria-label="`Selecionar ${d.title}`" @change="toggleSel(d)" /></label>
        <button type="button" class="title" @click="openTask(d)">{{ d.title }}</button>
        <span v-for="t in d.tags" :key="t" class="pg-tag">#{{ t }}</span>
        <PriorityFlag v-if="d.priority" :priority="d.priority" />
        <span v-if="d.due" class="pg-pill"><AppIcon name="calendar" :size="12" />{{ fmt(d.due) }}</span>
        <span class="age pg-muted" :class="{ stale: ageDays(d) > 7 }">{{ ageDays(d) < 1 ? 'hoje' : `há ${ageDays(d)} d` }}</span>
        <select v-model="target[d.id]" class="pg-select" :aria-label="`Projeto para ${d.title}`">
          <option :value="undefined">{{ project(destination(d))?.name ? `${project(destination(d)).name}${!d.projectId && suggest(d) ? ' (sugerido)' : ''}` : 'Escolher projeto' }}</option>
          <option v-for="p in state.projects" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
        <button type="button" class="pg-btn" @click="publish(d, $event.currentTarget)">Publicar</button>
        <button type="button" class="pg-icon" :aria-label="`Apagar ${d.title}`" @click="removeTask(d)"><AppIcon name="trash" :size="15" /></button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.drafts { gap: 0.9rem; padding-bottom: 2rem; }
h1 { display: flex; align-items: center; gap: 0.5rem; }
.count { padding: 0.05rem 0.45rem; border-radius: 999px; background: var(--surface-2); font-size: 12px; font-weight: 500; color: var(--muted); }
.capture { display: flex; align-items: center; gap: 0.6rem; margin: 0 1.25rem; padding: 0.6rem 0.8rem; border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent); border-radius: 10px; background: var(--surface); color: var(--accent-soft); }
.capture:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent); }
.capture input { flex: 1; min-width: 0; border: 0; background: none; font: inherit; font-size: 14.5px; color: var(--text); outline: none; }
.tokens { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.tok { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.1rem 0.5rem; border-radius: 999px; background: color-mix(in srgb, var(--accent) 16%, transparent); font-size: 12px; color: var(--accent-soft); }
.bulk { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; margin: 0 1.25rem; padding: 0.5rem 0.7rem; border: 1px solid var(--line-strong); border-radius: 10px; background: var(--surface-2); }
.bulk strong { margin-right: auto; font-size: 13px; }
.none { padding: 0 1.25rem; }
code { padding: 0.05rem 0.3rem; border-radius: 4px; background: var(--surface-2); font-size: 12px; }
.group header { display: flex; align-items: center; gap: 0.6rem; padding: 0.4rem 1.25rem; }
.group h2 { margin: 0; font-size: 12.5px; font-weight: 600; color: var(--text); }
.group.old h2 { color: #f2c46d; }
.hint { margin-left: auto; font-size: 12px; color: var(--muted); }
.draft { display: flex; flex-wrap: wrap; align-items: center; gap: 0.55rem; padding: 0.5rem 1.25rem; border-top: 1px solid var(--line); }
.draft:hover, .draft.sel { background: var(--surface); }
.draft.sel { box-shadow: inset 2px 0 var(--accent); }
.title { flex: 1; min-width: 10rem; padding: 0; border: 0; background: none; font: inherit; font-size: 14px; font-weight: 500; color: var(--text); text-align: left; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.title:hover { color: var(--accent-soft); }
.age.stale { color: #f2c46d; }
.box input { width: 15px; height: 15px; margin: 0; accent-color: var(--accent); cursor: pointer; }
:is(.title, .box input):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
</style>
