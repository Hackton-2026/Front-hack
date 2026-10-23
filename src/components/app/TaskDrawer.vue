<script setup>
// Painel da tarefa (o "peek" do item de trabalho do Plane): propriedades em linha, subitens, detalhes,
// estrutura do projeto e a aba de atividade/comentários. Tudo editável na hora.
import { computed, nextTick, ref, watch } from 'vue'
import { gsap, prefersReducedMotion } from '../../utils/motion'
import { useWorkspace } from '../../composables/useWorkspace'
import { useUi } from '../../composables/useUi'
import AppIcon from './AppIcon.vue'
import Avatars from './Avatars.vue'
import StatusBadge from './StatusBadge.vue'

const { state, STATUSES, PRIORITIES, code, member, status, createTask, updateTask, removeTask, taskActivity, taskComments, addComment } = useWorkspace()
const { ui, closeTask, openTask, toast } = useUi()
const task = computed(() => state.tasks.find((t) => t.id === ui.taskId))
const saved = computed(() => typeof task.value?.id === 'number')
const panel = ref(null)
const wide = ref(false)
const menu = ref(false)
const people = ref(false)
const open = ref({ details: true, structure: true })
const newItem = ref('')
const newTag = ref('')
const newSub = ref('')
const addingSub = ref(false)
const confirmDelete = ref(false)
const reduced = prefersReducedMotion()

// Histórico e comentários vêm da API (os signals do backend registram cada mudança)
const activity = ref([])
const comments = ref([])
const tab = ref('all')
const comment = ref('')
const sending = ref(false)
const needNote = ref(false)
const note = ref('')
async function loadFeed() {
  if (!saved.value) { activity.value = []; comments.value = []; return }
  const id = task.value.id
  try {
    const [a, c] = await Promise.all([taskActivity(id), taskComments(id)])
    if (task.value?.id === id) { activity.value = a; comments.value = c }
  } catch { /* mantém o que tinha */ }
}
watch(() => [ui.taskId, task.value?.updatedAt], loadFeed)
const feed = computed(() => [
  ...(tab.value === 'comments' ? [] : activity.value.map((a) => ({ key: `a${a.id}`, at: a.at, text: a.text }))),
  ...(tab.value === 'activity' ? [] : comments.value.map((c) => ({ key: `c${c.id}`, at: c.created_at, author: c.author, body: c.body }))),
].sort((x, y) => x.at.localeCompare(y.at)))

const subitems = computed(() => state.tasks.filter((t) => t.parent === task.value?.id && !t.draft))
const parent = computed(() => state.tasks.find((t) => t.id === task.value?.parent))
// pai possível: mesmo projeto, nem ela mesma nem uma filha (o backend barra o resto do ciclo)
const parentOptions = computed(() => state.tasks.filter((t) => t.projectId === task.value.projectId && !t.draft && typeof t.id === 'number' && t.id !== task.value.id && t.parent !== task.value.id))
const doneItems = computed(() => task.value?.checklist.filter((i) => i.done).length || 0)
const when = (iso) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const ago = (iso) => {
  const min = Math.round((Date.now() - new Date(iso)) / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  if (min < 1440) return `há ${Math.round(min / 60)} h`
  return when(iso)
}

watch(() => ui.taskId, async (id, old) => {
  confirmDelete.value = false
  needNote.value = false
  note.value = ''
  menu.value = people.value = addingSub.value = false
  tab.value = 'all'
  comment.value = ''
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
function setStatus(id) {
  if (id === 'done' && !state.isAdmin && !task.value.draft) { needNote.value = true; return }
  set({ status: id })
}
const toggleDone = () => (task.value.status === 'done' ? set({ status: 'todo' }) : setStatus('done'))
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
function addSub() {
  if (!newSub.value.trim()) return
  createTask({ title: newSub.value.trim(), projectId: task.value.projectId, parent: task.value.id, assignees: [state.me] })
  newSub.value = ''
}
async function sendComment() {
  if (!comment.value.trim() || sending.value) return
  sending.value = true
  try {
    comments.value.push(await addComment(task.value.id, comment.value.trim()))
    comment.value = ''
    tab.value = tab.value === 'activity' ? 'all' : tab.value
  } catch (e) {
    toast(e.message || 'Não foi possível comentar.')
  } finally {
    sending.value = false
  }
}
async function copyCode() {
  try {
    await navigator.clipboard.writeText(`${code(task.value)} · ${task.value.title}`)
    toast('Código copiado.')
  } catch { toast('Não deu para copiar.') }
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
  <div v-if="task" class="veil" :class="{ 'is-wide': wide }" @click.self="close" @keydown.esc="close">
    <aside ref="panel" class="drawer" role="dialog" aria-modal="true" :aria-label="`Tarefa ${task.title}`">
      <header class="head">
        <div class="head__group">
          <button type="button" class="icon" aria-label="Fechar" @click="close"><AppIcon name="arrow" :size="17" /></button>
          <button type="button" class="icon" :aria-pressed="wide" :aria-label="wide ? 'Abrir como painel lateral' : 'Abrir em tela grande'" @click="wide = !wide"><AppIcon :name="wide ? 'peek' : 'expand'" :size="16" /></button>
        </div>
        <div class="head__group">
          <button v-if="!task.draft" type="button" class="done-btn" :class="{ 'is-done': task.status === 'done' }" @click="toggleDone">
            <AppIcon name="check" :size="15" />{{ task.status === 'done' ? 'Concluída' : 'Marcar como concluída' }}
          </button>
          <button v-else type="button" class="done-btn" :disabled="!task.projectId" :title="task.projectId ? '' : 'Escolha um projeto para publicar'" @click="publish">Publicar</button>
          <button v-if="saved" type="button" class="icon" aria-label="Copiar código da tarefa" @click="copyCode"><AppIcon name="link" :size="16" /></button>
          <div class="menu-wrap">
            <button type="button" class="icon" :aria-expanded="menu" aria-label="Mais opções" @click="menu = !menu; confirmDelete = false"><AppIcon name="more" :size="16" /></button>
            <div v-if="menu" class="menu" role="menu">
              <button type="button" role="menuitem" class="danger" @click="destroy"><AppIcon name="trash" :size="14" />{{ confirmDelete ? 'Clique de novo para apagar' : 'Apagar tarefa' }}</button>
            </div>
          </div>
        </div>
      </header>

      <form v-if="needNote" class="note" @submit.prevent="finishWithNote">
        <label for="done-note">Como foi concluída? <span>Obrigatório para membros.</span></label>
        <textarea id="done-note" v-model="note" rows="2" placeholder="Ex.: PR #12 aprovado e publicado" />
        <div><button type="button" class="ghost" @click="needNote = false">Cancelar</button><button type="submit" class="done-btn is-done" :disabled="!note.trim()">Concluir tarefa</button></div>
      </form>

      <div class="body">
        <div class="sec">
          <span class="code">{{ code(task) }}</span>
          <button v-if="parent" type="button" class="parent-link" @click="openTask(parent)"><AppIcon name="parent" :size="13" />{{ code(parent) }} · {{ parent.title }}</button>
          <textarea class="title" :value="task.title" rows="1" aria-label="Título" @change="set({ title: $event.target.value.trim() || task.title })" />
        </div>

        <!-- a linha de propriedades do Plane: estado, prioridade, responsáveis, início e prazo -->
        <div class="bar sec">
          <label class="cell" title="Status">
            <StatusBadge :status="task.status" compact />
            <select :value="task.status" aria-label="Status" @change="setStatus($event.target.value); $event.target.value = task.status"><option v-for="s in STATUSES" :key="s.id" :value="s.id">{{ s.name }}</option></select>
          </label>
          <label class="cell" title="Prioridade">
            <span class="prio" :style="{ background: PRIORITIES.find((p) => p.id === task.priority)?.color || 'var(--line-strong)' }" />
            <select :value="task.priority" aria-label="Prioridade" @change="set({ priority: $event.target.value })"><option value="">Sem prioridade</option><option v-for="p in PRIORITIES" :key="p.id" :value="p.id">{{ p.name }}</option></select>
          </label>
          <div class="cell menu-wrap">
            <button type="button" class="cell__btn" :aria-expanded="people" @click="people = !people">
              <Avatars v-if="task.assignees.length" :ids="task.assignees" :size="20" /><AppIcon v-else name="user" :size="15" />
              <span>{{ task.assignees.length === 1 ? member(task.assignees[0])?.name.split(' ')[0] : task.assignees.length ? `${task.assignees.length} pessoas` : 'Responsáveis' }}</span>
            </button>
            <div v-if="people" class="menu" role="menu">
              <button v-for="m in state.members" :key="m.id" type="button" role="menuitemcheckbox" :aria-checked="task.assignees.includes(m.id)" @click="toggleMember(m.id)">
                <span class="dot" :style="{ background: m.color }" />{{ m.name }}<AppIcon v-if="task.assignees.includes(m.id)" name="check" :size="13" class="tick" />
              </button>
            </div>
          </div>
          <label class="cell" title="Data de início"><AppIcon name="calendar" :size="15" /><input type="date" :value="task.start || ''" :max="task.due || undefined" aria-label="Data de início" @change="set({ start: $event.target.value || null })" /></label>
          <label class="cell" title="Prazo"><AppIcon name="calendar" :size="15" /><input type="date" :value="task.due || ''" :min="task.start || undefined" aria-label="Prazo" @change="set({ due: $event.target.value || null })" /></label>
        </div>

        <textarea class="desc sec" :value="task.description" rows="4" placeholder="Adicione detalhes, links ou critérios de pronto…" aria-label="Descrição" @change="set({ description: $event.target.value })" />

        <section v-if="saved" class="sec">
          <h3>Subitens <span>{{ subitems.filter((s) => s.status === 'done').length }}/{{ subitems.length }}</span>
            <button type="button" class="mini" @click="addingSub = !addingSub"><AppIcon name="plus" :size="13" />Adicionar subitem</button>
          </h3>
          <ul v-if="subitems.length" class="subs">
            <li v-for="s in subitems" :key="s.id">
              <StatusBadge :status="s.status" compact />
              <span class="subs__code">{{ code(s) }}</span>
              <button type="button" class="subs__title" @click="openTask(s)">{{ s.title }}</button>
              <Avatars :ids="s.assignees" :size="20" />
            </li>
          </ul>
          <form v-if="addingSub" class="add" @submit.prevent="addSub"><input v-model="newSub" placeholder="Título do subitem e Enter" aria-label="Novo subitem" /></form>
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
          <h3 class="big">Propriedades</h3>
          <button type="button" class="fold" :aria-expanded="open.details" @click="open.details = !open.details">Detalhes <AppIcon name="chevron" :size="12" /></button>
          <dl v-if="open.details" class="props">
            <dt><AppIcon name="parent" :size="15" />Pai</dt>
            <dd>
              <select v-if="saved" :value="task.parent || ''" aria-label="Tarefa pai" @change="set({ parent: Number($event.target.value) || null })">
                <option value="">Adicionar pai</option>
                <option v-for="t in parentOptions" :key="t.id" :value="t.id">{{ code(t) }} · {{ t.title }}</option>
              </select>
              <span v-else class="none">Publique para escolher</span>
            </dd>
            <dt><AppIcon name="tag" :size="15" />Etiquetas</dt>
            <dd class="chips">
              <span v-for="t in task.tags" :key="t" class="ntag">{{ t }}<button type="button" :aria-label="`Remover ${t}`" @click="set({ tags: task.tags.filter((x) => x !== t) })">×</button></span>
              <input v-model="newTag" class="tag-input" placeholder="Adicionar etiquetas" aria-label="Nova etiqueta" @keydown.enter.prevent="addTag" @blur="addTag" />
            </dd>
          </dl>
          <button type="button" class="fold" :aria-expanded="open.structure" @click="open.structure = !open.structure">Estrutura do projeto <AppIcon name="chevron" :size="12" /></button>
          <dl v-if="open.structure" class="props">
            <dt><AppIcon name="folder" :size="15" />Projeto</dt>
            <dd><select :value="task.projectId || ''" aria-label="Projeto" @change="set({ projectId: Number($event.target.value) || null })"><option value="">Sem projeto</option><option v-for="p in state.projects" :key="p.id" :value="p.id">{{ p.name }}</option></select></dd>
            <template v-if="task.projectId">
              <dt><AppIcon name="cycle" :size="15" />Ciclo</dt>
              <dd><select :value="task.cycle || ''" aria-label="Ciclo" @change="set({ cycle: Number($event.target.value) || null })"><option value="">Sem ciclo</option><option v-for="c in state.cycles.filter((c) => c.project === task.projectId)" :key="c.id" :value="c.id">{{ c.name }}</option></select></dd>
              <dt><AppIcon name="module" :size="15" />Módulos</dt>
              <dd class="chips">
                <button v-for="m in state.modules.filter((m) => m.project === task.projectId)" :key="m.id" type="button" class="chip" :class="{ 'is-on': task.modules.includes(m.id) }" :aria-pressed="task.modules.includes(m.id)" @click="set({ modules: task.modules.includes(m.id) ? task.modules.filter((x) => x !== m.id) : [...task.modules, m.id] })"><AppIcon name="module" :size="12" />{{ m.name }}</button>
                <span v-if="!state.modules.some((m) => m.project === task.projectId)" class="none">Nenhum módulo neste projeto</span>
              </dd>
            </template>
          </dl>
          <ul class="meta">
            <li v-if="task.creator"><AppIcon name="user" :size="13" />Criada por {{ member(task.creator)?.name || 'alguém' }}</li>
            <li><AppIcon name="pulse" :size="13" />Criada em {{ when(task.createdAt) }}</li>
            <li><AppIcon name="pulse" :size="13" />Atualizada em {{ when(task.updatedAt) }}</li>
            <li v-if="task.completionNote"><AppIcon name="check" :size="13" />Nota de conclusão: {{ task.completionNote }}</li>
          </ul>
        </section>

        <section v-if="saved" class="sec">
          <div class="tabs" role="tablist">
            <button v-for="t in [['all', 'Tudo'], ['activity', 'Atividade'], ['comments', 'Comentários']]" :key="t[0]" type="button" role="tab" :aria-selected="tab === t[0]" @click="tab = t[0]">{{ t[1] }}</button>
          </div>
          <form v-if="tab !== 'activity'" class="comment" @submit.prevent="sendComment">
            <textarea v-model="comment" rows="2" placeholder="Escreva um comentário (use @usuario para mencionar)" aria-label="Comentário" @keydown.ctrl.enter="sendComment" />
            <button type="submit" class="done-btn" :disabled="!comment.trim() || sending">Comentar</button>
          </form>
          <ol class="log">
            <li v-for="f in feed" :key="f.key" :class="{ 'is-comment': f.body }">
              <template v-if="f.body"><strong>{{ member(f.author)?.name || 'Alguém' }}</strong><p>{{ f.body }}</p></template>
              <span v-else>{{ f.text }}</span>
              <time>{{ ago(f.at) }}</time>
            </li>
            <li v-if="!feed.length" class="muted">{{ tab === 'comments' ? 'Nenhum comentário ainda.' : 'Sem atividade ainda.' }}</li>
          </ol>
        </section>
        <p v-else class="none sec">Rascunhos são só seus: publique a tarefa para ter subitens, comentários e histórico.</p>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.veil { position: fixed; inset: 0; z-index: 70; display: flex; justify-content: flex-end; background: rgb(0 0 0 / 0.4); }
.veil.is-wide { justify-content: center; align-items: center; padding: 2rem 1rem; }
.drawer { display: flex; flex-direction: column; width: min(100%, 38rem); height: 100%; border-left: 1px solid var(--line-strong); background: var(--surface); box-shadow: -20px 0 50px rgb(0 0 0 / 0.4); }
.is-wide .drawer { width: min(100%, 60rem); height: min(100%, 52rem); border: 1px solid var(--line-strong); border-radius: 12px; }
.head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; height: 52px; padding: 0 0.75rem; border-bottom: 1px solid var(--line); }
.head__group { display: flex; align-items: center; gap: 0.35rem; }
.code { font: 500 12px/1 'Geist Mono', monospace; color: var(--muted); }
.done-btn { display: inline-flex; align-items: center; gap: 0.4rem; height: 30px; padding: 0 0.7rem; border: 1px solid var(--line-strong); border-radius: 6px; background: none; font-size: 12.5px; font-weight: 500; cursor: pointer; transition: background 0.2s var(--ease), border-color 0.2s var(--ease); }
.done-btn:hover:not(:disabled) { border-color: var(--accent); }
.done-btn.is-done { border-color: var(--accent); background: var(--accent); color: #000; }
.done-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.icon { display: grid; place-items: center; width: 30px; height: 30px; padding: 0; border: 0; border-radius: 6px; background: none; color: var(--muted); cursor: pointer; }
.icon:hover, .icon[aria-pressed='true'] { background: var(--surface-2); color: var(--text); }
.menu-wrap { position: relative; }
.menu { position: absolute; top: calc(100% + 4px); right: 0; z-index: 5; display: flex; flex-direction: column; min-width: 13rem; max-height: 18rem; padding: 0.3rem; overflow-y: auto; border: 1px solid var(--line-strong); border-radius: 8px; background: var(--surface); box-shadow: 0 16px 40px rgb(0 0 0 / 0.45); }
.bar .menu { left: 0; right: auto; }
.menu button { display: flex; align-items: center; gap: 0.5rem; padding: 0.45rem 0.55rem; border: 0; border-radius: 5px; background: none; font-size: 13px; text-align: left; color: var(--text); cursor: pointer; }
.menu button:hover { background: var(--surface-2); }
.menu .danger { color: #ff8a80; }
.menu .tick { margin-left: auto; color: var(--accent-soft); }
.body { flex: 1; display: flex; flex-direction: column; gap: 1.4rem; padding: 1.25rem 1.5rem 2rem; overflow-y: auto; }
.parent-link { display: inline-flex; align-items: center; gap: 0.35rem; margin-left: 0.6rem; padding: 0; border: 0; background: none; font-size: 12px; color: var(--muted); cursor: pointer; }
.parent-link:hover { color: var(--accent-soft); }
.title { display: block; width: 100%; margin-top: 0.5rem; padding: 0; border: 0; background: none; font: 600 1.375rem/1.3 'Geist', system-ui, sans-serif; color: var(--text); resize: none; field-sizing: content; outline: none; }
.bar { display: grid; grid-template-columns: repeat(auto-fit, minmax(7.5rem, 1fr)); border-block: 1px solid var(--line); }
.cell { display: flex; align-items: center; gap: 0.3rem; min-width: 0; padding: 0.35rem 0.5rem; color: var(--muted); }
.cell + .cell { border-left: 1px solid var(--line); }
.cell select, .cell input { flex: 1; min-width: 0; padding: 0 0.2rem; }
.cell__btn { display: flex; flex: 1; align-items: center; gap: 0.4rem; min-width: 0; height: 30px; padding: 0 0.2rem; border: 0; border-radius: 6px; background: none; font-size: 13px; color: var(--text); cursor: pointer; }
.cell__btn span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cell__btn:hover { background: var(--surface-2); }
.prio { width: 9px; height: 9px; flex-shrink: 0; border-radius: 2px; }
.props { display: grid; grid-template-columns: 9rem minmax(0, 1fr); gap: 0.45rem 0.75rem; align-items: center; margin: 0 0 1rem; }
dt { display: flex; align-items: center; gap: 0.5rem; font-size: 13px; color: var(--muted); }
dd { display: flex; align-items: center; gap: 0.4rem; margin: 0; min-width: 0; }
select, input[type='date'], .desc, .add input, .tag-input, .comment textarea { border: 1px solid transparent; border-radius: 6px; background: none; font: inherit; color: var(--text); outline: none; transition: border-color 0.2s var(--ease), background 0.2s var(--ease); }
select, input[type='date'] { height: 30px; padding: 0 0.4rem; font-size: 13px; }
dd select { max-width: 100%; }
select:hover, input[type='date']:hover, .desc:hover { background: var(--surface-2); }
select:focus, input[type='date']:focus, .desc:focus, .add input:focus, .tag-input:focus, .comment textarea:focus { border-color: var(--accent); }
select option { background: var(--surface); }
.chips { flex-wrap: wrap; }
.chip { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.2rem 0.55rem; border: 1px solid var(--line-strong); border-radius: 6px; background: none; font-size: 12px; cursor: pointer; }
.chip.is-on { border-color: var(--accent); background: rgb(229 101 21 / 0.14); }
.dot { width: 8px; height: 8px; border-radius: 50%; }
.none { font-size: 12.5px; color: var(--muted); }
.ntag { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.15rem 0.2rem 0.15rem 0.5rem; border-radius: 4px; background: var(--surface-2); font-size: 12px; }
.ntag button { border: 0; background: none; color: var(--muted); cursor: pointer; }
.tag-input { width: 9rem; height: 28px; padding: 0 0.4rem; font-size: 13px; }
.tag-input:hover { background: var(--surface-2); }
h3 { display: flex; align-items: center; gap: 0.4rem; margin: 0 0 0.5rem; font: 600 13px/1.2 'Geist', system-ui, sans-serif; color: var(--text); }
h3 span { font-weight: 400; color: var(--muted); }
h3.big { margin-bottom: 0.8rem; font-size: 14px; }
.mini { display: inline-flex; align-items: center; gap: 0.3rem; margin-left: auto; padding: 0.25rem 0.5rem; border: 1px solid var(--line); border-radius: 6px; background: none; font-size: 12px; font-weight: 500; color: var(--muted); cursor: pointer; }
.mini:hover { border-color: var(--line-strong); color: var(--text); }
.desc { width: 100%; padding: 0.5rem; resize: vertical; }
.subs { display: flex; flex-direction: column; margin: 0 0 0.4rem; padding: 0; border: 1px solid var(--line); border-radius: 8px; list-style: none; }
.subs li { display: flex; align-items: center; gap: 0.6rem; padding: 0.4rem 0.6rem; }
.subs li + li { border-top: 1px solid var(--line); }
.subs__code { font: 500 11.5px/1 'Geist Mono', monospace; color: var(--muted); }
.subs__title { flex: 1; min-width: 0; padding: 0; border: 0; background: none; font-size: 13px; text-align: left; color: var(--text); cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.subs__title:hover { color: var(--accent-soft); }
.fold { display: inline-flex; align-items: center; gap: 0.35rem; margin-bottom: 0.6rem; padding: 0; border: 0; background: none; font-size: 12.5px; font-weight: 600; color: var(--text); cursor: pointer; }
.fold .app-icon { transition: transform 0.2s var(--ease); }
.fold[aria-expanded='true'] .app-icon { transform: rotate(90deg); }
.meta { display: flex; flex-direction: column; gap: 0.45rem; margin: 0.5rem 0 0; padding: 1rem 0 0; border-top: 1px solid var(--line); list-style: none; font-size: 12.5px; color: var(--muted); }
.meta li { display: flex; align-items: center; gap: 0.5rem; }
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
.tabs { display: flex; gap: 0.2rem; margin-bottom: 0.8rem; border-bottom: 1px solid var(--line); }
.tabs button { margin-bottom: -1px; padding: 0.45rem 0.6rem; border: 0; border-bottom: 2px solid transparent; background: none; font-size: 13px; font-weight: 500; color: var(--muted); cursor: pointer; }
.tabs button:hover { color: var(--text); }
.tabs button[aria-selected='true'] { border-color: var(--accent); color: var(--text); }
.comment { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; padding: 0.6rem; border: 1px solid var(--line-strong); border-radius: 10px; background: var(--bg); }
.comment textarea { width: 100%; padding: 0.2rem; resize: vertical; border: 0; }
.comment .done-btn { align-self: flex-end; }
.log { display: flex; flex-direction: column; gap: 0.7rem; margin: 0; padding: 0 0 0 0.9rem; border-left: 1px solid var(--line); list-style: none; }
.log li { display: flex; flex-direction: column; gap: 0.15rem; font-size: 12.5px; }
.log li.is-comment { padding: 0.55rem 0.7rem; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); }
.log strong { font-size: 12.5px; }
.log p { margin: 0; font-size: 13px; white-space: pre-wrap; }
.log time { font-size: 11.5px; color: var(--muted); }
.log .muted { color: var(--muted); }
.note { display: flex; flex-direction: column; gap: 0.5rem; padding: 0.9rem 1.25rem; border-bottom: 1px solid var(--line); background: rgb(229 101 21 / 0.08); }
.note label { font-size: 13px; font-weight: 500; }
.note label span { font-weight: 400; color: var(--muted); }
.note textarea { width: 100%; padding: 0.5rem; border: 1px solid var(--line-strong); border-radius: 6px; background: var(--bg); font: inherit; color: var(--text); outline: none; resize: vertical; }
.note textarea:focus { border-color: var(--accent); }
.note div { display: flex; justify-content: flex-end; gap: 0.5rem; }
.ghost { padding: 0 0.7rem; border: 0; border-radius: 6px; background: none; color: var(--muted); cursor: pointer; }
.ghost:hover { background: var(--surface-2); color: var(--text); }
:is(.done-btn, .icon, .chip, .box, .rm, .ntag button, .mini, .fold, .tabs button, .menu button, .cell__btn, .subs__title, .parent-link):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
</style>
