<script setup>
// Painel lateral da tarefa (a "task view" do ClickUp): tudo editável na hora, com checklist e histórico
import { computed, nextTick, ref, watch } from 'vue'
import { gsap, prefersReducedMotion } from '../../utils/motion'
import { useWorkspace } from '../../composables/useWorkspace'
import { useUi } from '../../composables/useUi'
import AppIcon from './AppIcon.vue'
import StatusBadge from './StatusBadge.vue'

const { state, STATUSES, PRIORITIES, code, updateTask, removeTask, taskActivity } = useWorkspace()
const { ui, closeTask } = useUi()
const task = computed(() => state.tasks.find((t) => t.id === ui.taskId))
const panel = ref(null)
const newItem = ref('')
const newTag = ref('')
const confirmDelete = ref(false)
const reduced = prefersReducedMotion()

// Histórico da tarefa vem da API (os signals do backend registram cada mudança)
const activity = ref([])
const needNote = ref(false)
const note = ref('')
async function loadActivity() {
  const id = task.value?.id
  if (typeof id !== 'number') { activity.value = []; return }
  try { activity.value = (await taskActivity(id)).slice(0, 15) } catch { /* mantém o que tinha */ }
}
watch(() => [ui.taskId, task.value?.updatedAt], loadActivity)
const doneItems = computed(() => task.value?.checklist.filter((i) => i.done).length || 0)
const when = (iso) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

watch(() => ui.taskId, async (id, old) => {
  confirmDelete.value = false
  needNote.value = false
  note.value = ''
  if (!id || old || reduced) return
  await nextTick()
  gsap.fromTo(panel.value, { x: 40, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.35, ease: 'power3.out' })
  gsap.from(panel.value.querySelectorAll('.sec'), { y: 10, autoAlpha: 0, duration: 0.35, stagger: 0.04, ease: 'power2.out', delay: 0.08 })
})
function close() {
  if (reduced || !panel.value) return closeTask()
  gsap.to(panel.value, { x: 40, autoAlpha: 0, duration: 0.2, ease: 'power2.in', onComplete: closeTask })
}

const set = (fields) => updateTask(task.value, fields)
// Quem não é admin precisa da nota de conclusão (regra da ShyDevs, validada no backend)
function toggleDone() {
  if (task.value.status === 'done') return set({ status: 'todo' })
  if (!state.isAdmin) { needNote.value = true; return }
  set({ status: 'done' })
}
async function finishWithNote() {
  if (!note.value.trim()) return
  if ((await set({ status: 'done', note: note.value.trim() })) === true) { needNote.value = false; note.value = '' }
}
function toggleMember(id) {
  const a = task.value.assignees
  set({ assignees: a.includes(id) ? a.filter((x) => x !== id) : [...a, id] })
}
function addItem() {
  if (!newItem.value.trim()) return
  set({ checklist: [...task.value.checklist, { id: Math.random().toString(36).slice(2, 8), title: newItem.value.trim(), done: false }] })
  newItem.value = ''
}
function toggleItem(item, el) {
  item.done = !item.done
  // marcar uma etapa com a tarefa pendente já inicia a tarefa: a regra é do backend e o status volta na resposta
  set({ checklist: [...task.value.checklist] })
  if (item.done && !reduced) gsap.fromTo(el, { scale: 0.7 }, { scale: 1, duration: 0.4, ease: 'back.out(2.4)' })
}
const removeItem = (item) => set({ checklist: task.value.checklist.filter((i) => i !== item) })
function addTag() {
  const tag = newTag.value.trim().toLowerCase()
  if (tag && !task.value.tags.includes(tag)) set({ tags: [...task.value.tags, tag] })
  newTag.value = ''
}
function publish() { if (task.value.projectId) set({ draft: false }) }
function destroy() {
  if (!confirmDelete.value) { confirmDelete.value = true; return }
  const t = task.value
  closeTask()
  removeTask(t)
}
</script>

<template>
  <div v-if="task" class="veil" @click.self="close" @keydown.esc="close">
    <aside ref="panel" class="drawer" role="dialog" aria-modal="true" :aria-label="`Tarefa ${task.title}`">
      <header class="head">
        <span class="code">{{ task.draft ? 'Rascunho' : code(task) }}</span>
        <div class="head__actions">
          <button v-if="!task.draft" type="button" class="done-btn" :class="{ 'is-done': task.status === 'done' }" @click="toggleDone">
            <AppIcon name="check" :size="15" />{{ task.status === 'done' ? 'Concluída' : 'Marcar como concluída' }}
          </button>
          <button v-else type="button" class="done-btn" :disabled="!task.projectId" :title="task.projectId ? '' : 'Escolha um projeto para publicar'" @click="publish">Publicar</button>
          <button type="button" class="icon" aria-label="Fechar" @click="close"><AppIcon name="close" :size="17" /></button>
        </div>
      </header>

      <form v-if="needNote" class="note" @submit.prevent="finishWithNote">
        <label for="done-note">Como foi concluída? <span>Obrigatório para membros.</span></label>
        <textarea id="done-note" v-model="note" rows="2" placeholder="Ex.: PR #12 aprovado e publicado" />
        <div><button type="button" class="ghost" @click="needNote = false">Cancelar</button><button type="submit" class="done-btn is-done" :disabled="!note.trim()">Concluir tarefa</button></div>
      </form>
      <div class="body">
        <textarea class="title sec" :value="task.title" rows="1" aria-label="Título" @change="set({ title: $event.target.value.trim() || task.title })" />

        <dl class="props sec">
          <dt>Status</dt>
          <dd class="with-badge"><StatusBadge :status="task.status" compact /><select :value="task.status" aria-label="Status" @change="set({ status: $event.target.value })"><option v-for="s in STATUSES" :key="s.id" :value="s.id">{{ s.name }}</option></select></dd>
          <dt>Prioridade</dt>
          <dd><select :value="task.priority" aria-label="Prioridade" @change="set({ priority: $event.target.value })"><option value="">Sem prioridade</option><option v-for="p in PRIORITIES" :key="p.id" :value="p.id">{{ p.name }}</option></select></dd>
          <dt>Prazo</dt>
          <dd><input type="date" :value="task.due || ''" aria-label="Prazo" @change="set({ due: $event.target.value || null })" /></dd>
          <dt>Projeto</dt>
          <dd><select :value="task.projectId || ''" aria-label="Projeto" @change="set({ projectId: Number($event.target.value) || null })"><option value="">Sem projeto</option><option v-for="p in state.projects" :key="p.id" :value="p.id">{{ p.name }}</option></select></dd>
          <template v-if="task.projectId">
            <dt>Ciclo</dt>
            <dd><select :value="task.cycle || ''" aria-label="Ciclo" @change="set({ cycle: Number($event.target.value) || null })"><option value="">Sem ciclo</option><option v-for="c in state.cycles.filter((c) => c.project === task.projectId)" :key="c.id" :value="c.id">{{ c.name }}</option></select></dd>
            <dt>Módulos</dt>
            <dd class="chips">
              <button v-for="m in state.modules.filter((m) => m.project === task.projectId)" :key="m.id" type="button" class="chip" :class="{ 'is-on': task.modules.includes(m.id) }" :aria-pressed="task.modules.includes(m.id)" @click="set({ modules: task.modules.includes(m.id) ? task.modules.filter((x) => x !== m.id) : [...task.modules, m.id] })">{{ m.name }}</button>
              <span v-if="!state.modules.some((m) => m.project === task.projectId)" class="none">Nenhum módulo neste projeto</span>
            </dd>
          </template>
          <dt>Responsáveis</dt>
          <dd class="chips">
            <button v-for="m in state.members" :key="m.id" type="button" class="chip" :class="{ 'is-on': task.assignees.includes(m.id) }" :aria-pressed="task.assignees.includes(m.id)" @click="toggleMember(m.id)">
              <span class="dot" :style="{ background: m.color }" />{{ m.name.split(' ')[0] }}
            </button>
          </dd>
          <dt>Etiquetas</dt>
          <dd class="chips">
            <span v-for="t in task.tags" :key="t" class="ntag">{{ t }}<button type="button" :aria-label="`Remover ${t}`" @click="set({ tags: task.tags.filter((x) => x !== t) })">×</button></span>
            <input v-model="newTag" class="tag-input" placeholder="+ etiqueta" aria-label="Nova etiqueta" @keydown.enter.prevent="addTag" @blur="addTag" />
          </dd>
        </dl>

        <section class="sec">
          <h3>Descrição</h3>
          <textarea class="desc" :value="task.description" rows="4" placeholder="Adicione detalhes, links ou critérios de pronto…" aria-label="Descrição" @change="set({ description: $event.target.value })" />
        </section>

        <section class="sec">
          <h3>Checklist <span>{{ doneItems }}/{{ task.checklist.length }}</span></h3>
          <div v-if="task.checklist.length" class="cbar"><span :style="{ transform: `scaleX(${doneItems / task.checklist.length})` }" /></div>
          <ul class="items">
            <li v-for="item in task.checklist" :key="item.id" :class="{ 'is-done': item.done }">
              <button type="button" class="box" :aria-pressed="item.done" :aria-label="item.title" @click="toggleItem(item, $event.currentTarget)"><AppIcon name="check" :size="12" /></button>
              <span>{{ item.title }}</span>
              <button type="button" class="rm" :aria-label="`Remover ${item.title}`" @click="removeItem(item)"><AppIcon name="close" :size="13" /></button>
            </li>
          </ul>
          <form class="add" @submit.prevent="addItem"><input v-model="newItem" placeholder="Adicionar etapa" aria-label="Nova etapa" /></form>
        </section>

        <section class="sec">
          <h3>Atividade</h3>
          <ol class="log">
            <li v-for="a in activity" :key="a.id"><span>{{ a.text }}</span><time>{{ when(a.at) }}</time></li>
            <li v-if="!activity.length" class="muted">Sem atividade ainda. Mudanças de status e criação aparecem aqui.</li>
          </ol>
        </section>

        <button type="button" class="delete sec" @click="destroy">{{ confirmDelete ? 'Clique de novo para apagar de vez' : 'Apagar tarefa' }}</button>
      </div>
      <footer class="foot">{{ task.completionNote ? `Nota de conclusão: ${task.completionNote} · ` : '' }}atualizada {{ when(task.updatedAt) }}</footer>
    </aside>
  </div>
</template>

<style scoped>
.veil { position: fixed; inset: 0; z-index: 70; display: flex; justify-content: flex-end; background: rgb(0 0 0 / 0.4); }
.drawer { display: flex; flex-direction: column; width: min(100%, 34rem); height: 100%; border-left: 1px solid var(--line-strong); background: var(--surface); box-shadow: -20px 0 50px rgb(0 0 0 / 0.4); }
.head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; height: 52px; padding: 0 0.75rem 0 1.25rem; border-bottom: 1px solid var(--line); }
.code { font: 500 12px/1 'Geist Mono', monospace; color: var(--muted); }
.head__actions { display: flex; align-items: center; gap: 0.35rem; }
.done-btn { display: inline-flex; align-items: center; gap: 0.4rem; height: 30px; padding: 0 0.7rem; border: 1px solid var(--line-strong); border-radius: 6px; background: none; font-size: 12.5px; font-weight: 500; cursor: pointer; transition: background 0.2s var(--ease), border-color 0.2s var(--ease); }
.done-btn:hover:not(:disabled) { border-color: var(--accent); }
.done-btn.is-done { border-color: var(--accent); background: var(--accent); color: #000; }
.done-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.icon { display: grid; place-items: center; width: 30px; height: 30px; padding: 0; border: 0; border-radius: 6px; background: none; color: var(--muted); cursor: pointer; }
.icon:hover { background: var(--surface-2); color: var(--text); }
.body { flex: 1; display: flex; flex-direction: column; gap: 1.4rem; padding: 1.25rem; overflow-y: auto; }
.title { padding: 0; border: 0; background: none; font: 600 1.375rem/1.3 'Geist', system-ui, sans-serif; color: var(--text); resize: none; field-sizing: content; outline: none; }
.props { display: grid; grid-template-columns: 7rem minmax(0, 1fr); gap: 0.55rem 0.75rem; align-items: center; margin: 0; }
dt { font-size: 12.5px; color: var(--muted); }
dd { display: flex; align-items: center; gap: 0.4rem; margin: 0; min-width: 0; }
select, input[type='date'], .desc, .add input, .tag-input { border: 1px solid transparent; border-radius: 6px; background: none; font: inherit; color: var(--text); outline: none; transition: border-color 0.2s var(--ease), background 0.2s var(--ease); }
select, input[type='date'] { height: 30px; padding: 0 0.4rem; }
select:hover, input[type='date']:hover, .desc:hover { background: var(--surface-2); }
select:focus, input[type='date']:focus, .desc:focus, .add input:focus, .tag-input:focus { border-color: var(--accent); }
select option { background: var(--surface); }
.chips { flex-wrap: wrap; }
.chip { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.2rem 0.55rem; border: 1px solid var(--line-strong); border-radius: 999px; background: none; font-size: 12px; cursor: pointer; }
.chip.is-on { border-color: var(--accent); background: rgb(229 101 21 / 0.14); }
.dot { width: 8px; height: 8px; border-radius: 50%; }
.ntag { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.15rem 0.2rem 0.15rem 0.5rem; border-radius: 4px; background: var(--surface-2); font-size: 12px; }
.ntag button { border: 0; background: none; color: var(--muted); cursor: pointer; }
.tag-input { width: 6.5rem; height: 26px; padding: 0 0.4rem; font-size: 12px; }
h3 { display: flex; align-items: center; gap: 0.4rem; margin: 0 0 0.5rem; font: 600 13px/1.2 'Geist', system-ui, sans-serif; color: var(--text); }
h3 span { font-weight: 400; color: var(--muted); }
.desc { width: 100%; padding: 0.5rem; resize: vertical; }
.cbar { height: 4px; margin-bottom: 0.5rem; overflow: hidden; border-radius: 999px; background: var(--surface-2); }
.cbar span { display: block; height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent-soft)); transform-origin: left; transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
.items { display: flex; flex-direction: column; gap: 2px; margin: 0 0 0.4rem; padding: 0; list-style: none; }
.items li { display: flex; align-items: center; gap: 0.6rem; padding: 0.35rem 0.4rem; border-radius: 6px; }
.items li:hover { background: var(--surface-2); }
.items li.is-done span { color: var(--muted); text-decoration: line-through; }
.items span { flex: 1; min-width: 0; }
.box { display: grid; place-items: center; width: 17px; height: 17px; padding: 0; border: 1.5px solid var(--line-strong); border-radius: 5px; background: none; color: transparent; cursor: pointer; }
.is-done .box { border-color: var(--accent); background: var(--accent); color: #000; }
.rm { display: grid; place-items: center; width: 22px; height: 22px; padding: 0; border: 0; border-radius: 4px; background: none; color: var(--muted); cursor: pointer; opacity: 0; }
.items li:hover .rm, .rm:focus-visible { opacity: 1; }
.add input { width: 100%; height: 32px; padding: 0 0.5rem; border-color: var(--line); }
.log { display: flex; flex-direction: column; gap: 0.5rem; margin: 0; padding: 0 0 0 0.9rem; border-left: 1px solid var(--line); list-style: none; }
.log li { display: flex; flex-direction: column; font-size: 12.5px; }
.log time { font-size: 11.5px; color: var(--muted); }
.log .muted { color: var(--muted); }
.delete { align-self: flex-start; padding: 0.4rem 0.7rem; border: 1px solid rgb(255 91 77 / 0.35); border-radius: 6px; background: none; font-size: 12.5px; color: #ff8a80; cursor: pointer; }
.delete:hover { background: rgb(255 91 77 / 0.1); }
.note { display: flex; flex-direction: column; gap: 0.5rem; padding: 0.9rem 1.25rem; border-bottom: 1px solid var(--line); background: rgb(229 101 21 / 0.08); }
.note label { font-size: 13px; font-weight: 500; }
.note label span { font-weight: 400; color: var(--muted); }
.note textarea { width: 100%; padding: 0.5rem; border: 1px solid var(--line-strong); border-radius: 6px; background: var(--bg); font: inherit; color: var(--text); outline: none; resize: vertical; }
.note textarea:focus { border-color: var(--accent); }
.note div { display: flex; justify-content: flex-end; gap: 0.5rem; }
.ghost { padding: 0 0.7rem; border: 0; border-radius: 6px; background: none; color: var(--muted); cursor: pointer; }
.ghost:hover { background: var(--surface-2); color: var(--text); }
.foot { padding: 0.6rem 1.25rem; border-top: 1px solid var(--line); font-size: 11.5px; color: var(--muted); }
:is(.done-btn, .icon, .chip, .box, .rm, .delete, .ntag button):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
</style>
