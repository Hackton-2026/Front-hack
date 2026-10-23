<script setup>
// Modal "Nova tarefa" (o "New work item" do Plane / "Create task" do ClickUp). Sem projeto vira rascunho.
import { nextTick, reactive, ref, watch } from 'vue'
import { gsap, prefersReducedMotion } from '../../utils/motion'
import { useWorkspace } from '../../composables/useWorkspace'
import { useOnboarding } from '../../composables/useOnboarding'
import { useUi } from '../../composables/useUi'
import AppIcon from './AppIcon.vue'
import GooeyButton from '../GooeyButton.vue'

const { state, STATUSES, PRIORITIES, createTask, code } = useWorkspace()
const { complete } = useOnboarding()
const { ui, closeNew, openTask } = useUi()
const form = reactive({})
const error = ref('')
const box = ref(null)
const titleInput = ref(null)

watch(() => ui.creating, async (defaults) => {
  if (!defaults) return
  Object.assign(form, { title: '', projectId: state.projects[0]?.id || '', status: 'todo', priority: '', assignees: [state.me], due: '', description: '', cycle: null, modules: [] }, defaults)
  error.value = ''
  await nextTick()
  titleInput.value?.focus()
  if (!prefersReducedMotion()) gsap.fromTo(box.value, { scale: 0.96, y: 10, autoAlpha: 0 }, { scale: 1, y: 0, autoAlpha: 1, duration: 0.3, ease: 'power3.out' })
})

function toggleMember(id) {
  form.assignees = form.assignees.includes(id) ? form.assignees.filter((a) => a !== id) : [...form.assignees, id]
}
function save(draft) {
  if (!form.title.trim()) { error.value = 'Dê um título para a tarefa.'; titleInput.value?.focus(); return }
  const task = createTask({ ...form, title: form.title.trim(), due: form.due || null, projectId: draft ? null : form.projectId || null, draft: draft || !form.projectId })
  if (!task.draft) complete('task')
  closeNew()
  if (!task.draft) openTask(task)
  return code(task)
}
</script>

<template>
  <div v-if="ui.creating" class="veil" @click.self="closeNew" @keydown.esc="closeNew">
    <form ref="box" class="modal" role="dialog" aria-modal="true" aria-labelledby="new-title" novalidate @submit.prevent="save(false)">
      <header>
        <h2 id="new-title">Nova tarefa</h2>
        <button type="button" class="x" aria-label="Fechar" @click="closeNew"><AppIcon name="close" :size="16" /></button>
      </header>
      <input ref="titleInput" v-model="form.title" class="title" placeholder="Título da tarefa" aria-label="Título" :aria-invalid="!!error" />
      <textarea v-model="form.description" rows="3" placeholder="Descrição (opcional)" aria-label="Descrição" />
      <div class="row">
        <label>Projeto
          <select v-model="form.projectId">
            <option value="">Sem projeto (rascunho)</option>
            <option v-for="p in state.projects" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </label>
        <label>Status
          <select v-model="form.status"><option v-for="s in STATUSES" :key="s.id" :value="s.id">{{ s.name }}</option></select>
        </label>
        <label>Prioridade
          <select v-model="form.priority"><option value="">Sem prioridade</option><option v-for="p in PRIORITIES" :key="p.id" :value="p.id">{{ p.name }}</option></select>
        </label>
        <label>Prazo <input v-model="form.due" type="date" /></label>
      </div>
      <fieldset class="people">
        <legend>Responsáveis</legend>
        <button v-for="m in state.members" :key="m.id" type="button" class="chip" :class="{ 'is-on': form.assignees.includes(m.id) }" :aria-pressed="form.assignees.includes(m.id)" @click="toggleMember(m.id)">
          <span class="dot" :style="{ background: m.color }" />{{ m.name }}
        </button>
      </fieldset>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <footer>
        <button type="button" class="ghost" @click="save(true)">Salvar como rascunho</button>
        <GooeyButton type="submit" variant="primary">Criar tarefa</GooeyButton>
      </footer>
    </form>
  </div>
</template>

<style scoped>
.veil { position: fixed; inset: 0; z-index: 80; display: grid; place-items: start center; padding: 10vh 1rem 1rem; overflow-y: auto; background: rgb(0 0 0 / 0.55); }
.modal { display: flex; flex-direction: column; gap: 0.9rem; width: min(100%, 38rem); padding: 1.25rem; border: 1px solid var(--line-strong); border-radius: 12px; background: var(--surface); box-shadow: 0 30px 60px rgb(0 0 0 / 0.5); }
header { display: flex; align-items: center; justify-content: space-between; }
h2 { margin: 0; font: 600 1rem/1.2 'Geist', system-ui, sans-serif; color: var(--text); }
.x { display: grid; place-items: center; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 6px; background: none; color: var(--muted); cursor: pointer; }
.x:hover { background: var(--surface-2); color: var(--text); }
.title { padding: 0; border: 0; background: none; font: 600 1.25rem/1.3 'Geist', system-ui, sans-serif; color: var(--text); outline: none; }
textarea, select, .row input { width: 100%; border: 1px solid var(--line-strong); border-radius: 6px; background: var(--bg); font: inherit; color: var(--text); outline: none; color-scheme: dark; }
textarea { padding: 0.6rem 0.7rem; resize: vertical; }
select, .row input { height: 34px; padding: 0 0.5rem; }
textarea:focus, select:focus, .row input:focus { border-color: var(--accent); }
.row { display: grid; grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr)); gap: 0.6rem; }
.row label { display: flex; flex-direction: column; gap: 0.3rem; font-size: 12px; font-weight: 500; color: var(--muted); }
.people { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0; padding: 0; border: 0; }
.people legend { margin-bottom: 0.4rem; padding: 0; font-size: 12px; font-weight: 500; color: var(--muted); }
.chip { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.3rem 0.6rem; border: 1px solid var(--line-strong); border-radius: 999px; background: none; font-size: 12.5px; cursor: pointer; transition: border-color 0.2s var(--ease), background 0.2s var(--ease); }
.chip.is-on { border-color: var(--accent); background: rgb(229 101 21 / 0.14); }
.dot { width: 9px; height: 9px; border-radius: 50%; }
.error { margin: 0; font-size: 13px; color: #ffb48a; }
footer { display: flex; justify-content: flex-end; align-items: center; gap: 0.75rem; padding-top: 0.25rem; }
.ghost { padding: 0.45rem 0.8rem; border: 0; border-radius: 6px; background: none; color: var(--muted); cursor: pointer; }
.ghost:hover { background: var(--surface-2); color: var(--text); }
:is(.x, .chip, .ghost):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
</style>
