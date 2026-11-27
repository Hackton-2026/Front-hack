<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { EASE, DUR, gsap, prefersReducedMotion } from '../../utils/motion'
import { useWorkspace } from '../../composables/useWorkspace'
import { useOnboarding } from '../../composables/useOnboarding'
import { useUi } from '../../composables/useUi'
import { api } from '../../services/api'
import AppIcon from './AppIcon.vue'
import AppSelect from './AppSelect.vue'
import AppCheckbox from './AppCheckbox.vue'
import AppDateInput from './AppDateInput.vue'
import GooeyButton from '../GooeyButton.vue'

const { state, STATUSES, PRIORITIES, createTask, code, peopleOf, rolesOf } = useWorkspace()
const { complete } = useOnboarding()
const { ui, closeNew, openTask, toast } = useUi()
const form = reactive({})
const error = ref('')
const box = ref(null)
const titleInput = ref(null)
const createMore = ref(false)
const templates = ref([])
const selectedTemplate = ref('')

async function loadTemplates() {
  try {
    const list = await api('/api/items/?kind=template')
    templates.value = Array.isArray(list) ? list : []
  } catch { templates.value = [] }
}

watch(() => ui.creating, async (defaults) => {
  if (!defaults) return
  Object.assign(form, {
    title: '',
    projectId: state.projects[0]?.id || '',
    status: 'todo',
    priority: state.prefs.defaultPriority,
    assignees: state.prefs.assignMe ? [state.me] : [],
    start: '',
    due: '',
    description: '',
    cycle: null,
    modules: [],
    recurrence: '',
    clientVisible: false,
  }, defaults)
  error.value = ''
  selectedTemplate.value = ''
  loadTemplates()
  await nextTick()
  titleInput.value?.focus()
  if (!prefersReducedMotion()) gsap.fromTo(box.value, { scale: 0.96, y: 10, autoAlpha: 0 }, { scale: 1, y: 0, autoAlpha: 1, duration: DUR.fast, ease: EASE.out })
})

watch(() => form.projectId, (pid) => {
  if (!pid || !form.assignees) return
  const allowed = new Set(peopleOf(pid).map((m) => m.id))
  form.assignees = form.assignees.filter((id) => allowed.has(id))
})
function toggleMember(id) {
  form.assignees = form.assignees.includes(id) ? form.assignees.filter((a) => a !== id) : [...form.assignees, id]
}
const roles = computed(() => (form.projectId ? rolesOf(form.projectId) : []))
const roleOn = (r) => r.ids.every((id) => form.assignees?.includes(id))
function toggleRole(r) {
  form.assignees = roleOn(r) ? form.assignees.filter((id) => !r.ids.includes(id)) : [...new Set([...form.assignees, ...r.ids])]
}
const projectOptions = computed(() => [...state.projects.map((p) => ({ value: p.id, label: p.name, color: p.color }))])
const statusOptions = STATUSES.map((s) => ({ value: s.id, label: s.name, color: s.color }))
const priorityOptions = [{ value: '', label: 'Sem prioridade' }, ...PRIORITIES.map((p) => ({ value: p.id, label: p.name, color: p.color }))]
const recurrenceOptions = [
  { value: '', label: 'Não repete' },
  { value: 'daily', label: 'Todo dia' },
  { value: 'weekly', label: 'Toda semana' },
  { value: 'biweekly', label: 'A cada 15 dias' },
  { value: 'monthly', label: 'Todo mês' },
]
const templateOptions = computed(() => [{ value: '', label: 'Usar modelo…' }, ...templates.value.map((t) => ({ value: String(t.id), label: t.name }))])

function applyTemplate(id) {
  selectedTemplate.value = id
  const tpl = templates.value.find((t) => String(t.id) === String(id))
  if (!tpl) return
  form.title = tpl.name || form.title
  if (tpl.data?.priority) form.priority = tpl.data.priority
  if (tpl.data?.description) form.description = tpl.data.description
  nextTick(() => titleInput.value?.focus())
}

function save() {
  if (!form.title.trim()) { error.value = 'Dê um título para a tarefa.'; titleInput.value?.focus(); return }
  if (!form.projectId) { error.value = 'Escolha um projeto para a tarefa.'; return }
  if (form.start && form.due && form.start > form.due) { error.value = 'O início não pode ser depois do prazo.'; return }
  const task = createTask({ ...form, title: form.title.trim(), start: form.start || null, due: form.due || null, projectId: form.projectId })
  complete('task')
  if (createMore.value) {
    toast(`Tarefa “${task.title}” criada.`)
    form.title = ''
    form.description = ''
    selectedTemplate.value = ''
    error.value = ''
    nextTick(() => titleInput.value?.focus())
    return code(task)
  }
  closeNew()
  openTask(task)
  return code(task)
}

function onFormKey(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault()
    save()
  }
}
</script>

<template>
  <Transition name="veil">
  <div v-if="ui.creating" class="veil" @click.self="closeNew" @keydown.esc="closeNew">
    <form ref="box" class="modal" role="dialog" aria-modal="true" aria-labelledby="new-title" novalidate @submit.prevent="save" @keydown="onFormKey">
      <header>
        <div class="head-left">
          <h2 id="new-title">Nova tarefa</h2>
          <AppSelect v-if="templates.length" :model-value="selectedTemplate" :options="templateOptions" size="sm" aria-label="Aplicar modelo de tarefa" @change="applyTemplate" />
        </div>
        <button type="button" class="x" aria-label="Fechar" @click="closeNew"><AppIcon name="close" :size="16" /></button>
      </header>
      <input ref="titleInput" v-model="form.title" class="title" placeholder="Título da tarefa" aria-label="Título" :aria-invalid="!!error" />
      <textarea v-model="form.description" rows="3" placeholder="Descrição (opcional) · Ctrl + Enter para criar" aria-label="Descrição" />
      <div class="row">
        <div class="field"><span>Projeto</span><AppSelect v-model="form.projectId" block :options="projectOptions" aria-label="Projeto" /></div>
        <div class="field"><span>Status</span><AppSelect v-model="form.status" block :options="statusOptions" aria-label="Status" /></div>
        <div class="field"><span>Prioridade</span><AppSelect v-model="form.priority" block :options="priorityOptions" aria-label="Prioridade" /></div>
        <div class="field"><span>Início</span><AppDateInput v-model="form.start" block placeholder="Início" aria-label="Início" /></div>
        <div class="field"><span>Prazo</span><AppDateInput v-model="form.due" block placeholder="Prazo" aria-label="Prazo" /></div>
        <div class="field"><span>Repetir</span><AppSelect v-model="form.recurrence" block :options="recurrenceOptions" aria-label="Recorrência" /></div>
      </div>
      <fieldset class="people">
        <legend>Responsáveis</legend>
        <button v-for="r in roles" :key="`cargo-${r.title}`" type="button" class="chip role" :class="{ 'is-on': roleOn(r) }" :aria-pressed="roleOn(r)" :title="`Todos com o cargo ${r.title}`" @click="toggleRole(r)">
          <AppIcon name="user" :size="12" />{{ r.title }} <small>{{ r.ids.length }}</small>
        </button>
        <span v-if="roles.length" class="sep" aria-hidden="true" />
        <button v-for="m in peopleOf(form.projectId)" :key="m.id" type="button" class="chip" :class="{ 'is-on': form.assignees.includes(m.id) }" :aria-pressed="form.assignees.includes(m.id)" @click="toggleMember(m.id)">
          <span class="dot" :style="{ background: m.color }" />{{ m.name }}
        </button>
      </fieldset>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <footer>
        <div class="foot-opts">
          <AppCheckbox v-model="createMore" size="sm" label="Criar mais" />
          <AppCheckbox v-model="form.clientVisible" size="sm" label="Visível ao cliente" />
        </div>
        <GooeyButton type="submit" variant="primary">Criar tarefa</GooeyButton>
      </footer>
    </form>
  </div>
  </Transition>
</template>

<style scoped>
.veil { position: fixed; inset: 0; z-index: 80; display: grid; place-items: start center; padding: 10vh 1rem 1rem; overflow-y: auto; background: rgb(0 0 0 / 0.55); }
.modal { display: flex; flex-direction: column; gap: 0.9rem; width: min(100%, 40rem); padding: 1.25rem; border: 1px solid var(--line-strong); border-radius: 12px; background: var(--surface); box-shadow: 0 30px 60px rgb(0 0 0 / 0.5); }
header { display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; }
.head-left { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
h2 { margin: 0; font: 600 1rem/1.2 'Geist', system-ui, sans-serif; color: var(--text); }
.x { display: grid; place-items: center; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 6px; background: none; color: var(--muted); cursor: pointer; transition: background-color 150ms ease, color 150ms ease, transform 150ms cubic-bezier(0.23, 1, 0.32, 1); }
.x:hover { background: var(--surface-2); color: var(--text); }
.x:active { transform: scale(0.95); }
.title { padding: 0; border: 0; background: none; font: 600 1.25rem/1.3 'Geist', system-ui, sans-serif; letter-spacing: -0.02em; color: var(--text); outline: none; }
textarea, .row input { width: 100%; border: 1px solid var(--line-strong); border-radius: 6px; background: var(--bg); font: inherit; color: var(--text); outline: none; }
textarea { padding: 0.6rem 0.7rem; resize: vertical; }
.row input { height: 34px; padding: 0 0.5rem; }
textarea:focus, .row input:focus { border-color: var(--accent); }
.row { display: grid; grid-template-columns: repeat(auto-fit, minmax(8.2rem, 1fr)); gap: 0.6rem; }
.row label, .field { display: flex; flex-direction: column; gap: 0.3rem; font-size: 12px; font-weight: 500; color: var(--muted); }
.field :deep(.sel), .field :deep(.nvx-date) { height: 34px; background: var(--bg); }
.chip.role small { color: var(--muted); font-variant-numeric: tabular-nums; }
.sep { width: 1px; align-self: stretch; margin: 0 0.2rem; background: var(--line-strong); }
.people { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0; padding: 0; border: 0; }
.people legend { margin-bottom: 0.4rem; padding: 0; font-size: 12px; font-weight: 500; color: var(--muted); }
.chip { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.3rem 0.6rem; border: 1px solid var(--line-strong); border-radius: 999px; background: none; font-size: 12.5px; cursor: pointer; transition: border-color 160ms var(--ease), background-color 160ms var(--ease), transform 140ms cubic-bezier(0.23, 1, 0.32, 1); }
.chip:active { transform: scale(0.97); }
.chip.is-on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, transparent); }
.dot { width: 9px; height: 9px; border-radius: 50%; }
.error { margin: 0; font-size: 13px; color: #ffb48a; }
footer { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0.75rem; padding-top: 0.35rem; border-top: 1px solid var(--line); }
.foot-opts { display: flex; flex-wrap: wrap; align-items: center; gap: 0.9rem; }
:is(.x, .chip):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
</style>
