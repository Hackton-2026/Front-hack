<script setup>
// Painel da tarefa (o "peek" do item de trabalho do Plane): propriedades em linha, subitens, detalhes,
// estrutura do projeto, votos, inscrição, reações, relações, links/anexos e as abas de atividade/comentários. Tudo editável na hora.
import { computed, nextTick, ref, watch } from 'vue'
import { gsap, prefersReducedMotion } from '../../utils/motion'
import { useWorkspace } from '../../composables/useWorkspace'
import { useUi } from '../../composables/useUi'
import AppIcon from './AppIcon.vue'
import Avatars from './Avatars.vue'
import StatusBadge from './StatusBadge.vue'
import MdEditor from './MdEditor.vue'
import ReactionBar from './ReactionBar.vue'
import { api } from '../../services/api'
import { render, slug } from '../../utils/markdown'

const { state, STATUSES, PRIORITIES, code, member, status, createTask, updateTask, removeTask, taskActivity, taskComments, peopleOf } = useWorkspace()
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
// ---- animações (GSAP); nada anima com "reduzir movimento" ou o Modo de desempenho
const motion = () => !prefersReducedMotion()
const pop = (el) => motion() && el && gsap.fromTo(el, { scale: 0.82 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' })
const enter = (els, opts = {}) => motion() && els?.length && gsap.fromTo(els, { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, stagger: 0.035, ease: 'power2.out', clearProps: 'transform', ...opts })
const q = (sel) => panel.value?.querySelectorAll(sel)

// Histórico e comentários vêm da API (os signals do backend registram cada mudança)
const activity = ref([])
const comments = ref([])
const tab = ref('all')
const comment = ref('')
const sending = ref(false)
const needNote = ref(false)
const note = ref('')
const EMPTY_PANEL = () => ({ upvotes: [], downvotes: [], watchers: [], reactions: [], relations: [], attachments: [], last_editor: null, last_edited_at: null })
const panelData = ref(EMPTY_PANEL())
async function loadFeed() {
  if (!saved.value) { activity.value = []; comments.value = []; panelData.value = EMPTY_PANEL(); return }
  const id = task.value.id
  try {
    const [a, c, p] = await Promise.all([taskActivity(id), taskComments(id), api(`/api/tasks/${id}/panel/`)])
    if (task.value?.id === id) { activity.value = a; comments.value = c; panelData.value = p }
  } catch { /* mantém o que tinha */ }
}
watch(() => [ui.taskId, task.value?.updatedAt], loadFeed)

// abas como no Plane: Tudo, Atividade, Comentários, Atualizações, Transição (mudanças de estado) e Histórico (campos alterados)
const TABS = [['all', 'Tudo'], ['activity', 'Atividade'], ['comments', 'Comentários'], ['updates', 'Atualizações'], ['transition', 'Transição'], ['history', 'Histórico']]
const UPDATE_STATES = [['on_track', 'No prazo', '#7fc47a'], ['at_risk', 'Em risco', '#f2c46d'], ['off_track', 'Atrasada', '#ff5b4d']]
const newest = ref(false)
const showActivity = (a) => ({ all: true, activity: true, transition: ['status', 'task_completed'].includes(a.type), history: !['comment', 'task_created'].includes(a.type) }[tab.value])
const showComment = (c) => ({ all: true, comments: !c.is_update, updates: c.is_update }[tab.value])
const feed = computed(() => [
  ...activity.value.filter(showActivity).map((a) => ({ key: `a${a.id}`, at: a.at, text: a.text, actor: a.actor, details: tab.value === 'history' ? a.details : null })),
  ...comments.value.filter(showComment).map((c) => ({ key: `c${c.id}`, at: c.created_at, comment: c })),
].sort((x, y) => (newest.value ? -1 : 1) * x.at.localeCompare(y.at)))

// votos, inscrição, reações, relações e anexos: cada ação devolve o painel atualizado
async function act(path, body, method = 'POST') {
  try {
    panelData.value = await api(`/api/tasks/${task.value.id}/${path}`, { method, body })
    return true
  } catch (e) {
    toast(e.message || 'Não foi possível salvar.')
    return false
  }
}
const myVote = computed(() => (panelData.value.upvotes.includes(state.me) ? 1 : panelData.value.downvotes.includes(state.me) ? -1 : 0))
const vote = async (v, el) => { await act('vote/', { value: myVote.value === v ? 0 : v }); pop(el) }
const watching = computed(() => panelData.value.watchers.includes(state.me))
const names = (ids) => ids.map((id) => member(id)?.name || '?').join(', ') || 'Ninguém ainda'
const RELATIONS = { blocks: 'Bloqueia', blocked_by: 'Bloqueada por', relates: 'Relacionada a', duplicate: 'Duplicada de' }
const relationGroups = computed(() => {
  const groups = {}
  for (const r of panelData.value.relations) {
    const key = r.kind === 'blocks' && r.direction === 'in' ? 'blocked_by' : r.kind
    ;(groups[key] ||= []).push({ ...r, other: state.tasks.find((t) => t.id === r.task) })
  }
  return Object.entries(groups)
})
const adding = ref('') // sub | dep | rel | link | page
const rel = ref({ kind: 'blocks', task: '' })
const link = ref({ url: '', name: '' })
const relationOptions = computed(() => state.tasks.filter((t) => !t.draft && typeof t.id === 'number' && t.id !== task.value.id))
function openAdd(kind) {
  adding.value = adding.value === kind ? '' : kind
  rel.value = { kind: kind === 'dep' ? 'blocks' : 'relates', task: '' }
  link.value = { url: '', name: '' }
  addingSub.value = kind === 'sub'
}
async function addRelation() {
  if (rel.value.task && (await act('relations/', { kind: rel.value.kind, task: Number(rel.value.task) }))) adding.value = ''
}
async function addLink() {
  const url = /^https?:\/\//.test(link.value.url) ? link.value.url : `https://${link.value.url}`
  if (link.value.url.trim() && (await act('attachments/', { url, name: link.value.name.trim() }))) adding.value = ''
}
async function linkPage(id) {
  const pg = state.pages.find((p) => p.id === Number(id))
  if (pg && (await act('attachments/', { url: `${location.origin}/projetos/${pg.project}/paginas/${pg.id}`, name: `Página: ${pg.title || 'Sem título'}` }))) adding.value = ''
}
async function uploadFile(file) {
  const fd = new FormData()
  fd.append('file', file)
  if (!(await act('attachments/', fd))) return null
  return panelData.value.attachments[0] // a mais nova vem primeiro
}
async function onAttach(e) {
  const file = e.target.files[0]
  e.target.value = ''
  if (file && (await uploadFile(file))) toast('Arquivo anexado.')
}
const size = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : b > 1024 ? `${Math.round(b / 1024)} KB` : b ? `${b} B` : '')
const ICON_OF = { image: 'image', video: 'image', link: 'link', file: 'doc' }

// título com contador e indicador de salvamento, como no Plane
const saving = ref('')
const titleLen = ref(0)
watch(() => task.value?.title, (t) => (titleLen.value = t?.length || 0), { immediate: true })
watch([tab, newest], async () => { await nextTick(); enter(q('.log li')) })
watch(adding, async (v) => {
  await nextTick()
  if (v && motion()) gsap.from(q('.inline, form.add'), { height: 0, autoAlpha: 0, duration: 0.3, ease: 'power2.out', clearProps: 'height' })
})
// entra só o que é novo (relação, anexo, comentário); a primeira carga já vem com a abertura do painel
watch(() => [panelData.value.relations.length, panelData.value.attachments.length, comments.value.length], async (now, before) => {
  if (!before || now.every((n, i) => n <= before[i])) return
  await nextTick()
  if (now[0] > before[0]) enter([...(q('.rel__item') || [])].slice(-1))
  if (now[1] > before[1]) enter([...(q('.files li') || [])].slice(0, 1))
  if (now[2] > before[2]) enter(newest.value ? [...(q('.log li') || [])].slice(0, 1) : [...(q('.log li') || [])].slice(-1))
})
watch(saving, async (v) => { await nextTick(); if (v === 'Salvo' && motion()) gsap.fromTo(q('.saving'), { autoAlpha: 0, x: -6 }, { autoAlpha: 1, x: 0, duration: 0.3 }) })
const desc = ref('')
watch(() => [ui.taskId, task.value?.description], () => (desc.value = task.value?.description || ''), { immediate: true })
const saveDesc = () => desc.value !== task.value.description && set({ description: desc.value })

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

async function set(fields) {
  saving.value = 'Salvando…'
  const ok = await updateTask(task.value, fields)
  saving.value = ok === false ? '' : 'Salvo'
  return ok
}
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
const updateState = ref('on_track')
const editingId = ref(null)
const editBody = ref('')
async function sendComment() {
  if (!comment.value.trim() || sending.value) return
  sending.value = true
  try {
    const isUpdate = tab.value === 'updates'
    comments.value.push(await api(`/api/tasks/${task.value.id}/comments/`, { method: 'POST', body: { body: comment.value.trim(), is_update: isUpdate, update_state: isUpdate ? updateState.value : '' } }))
    comment.value = ''
    tab.value = ['activity', 'transition', 'history'].includes(tab.value) ? 'all' : tab.value
  } catch (e) {
    toast(e.message || 'Não foi possível comentar.')
  } finally {
    sending.value = false
  }
}
async function commentAction(c, path, body, method = 'POST') {
  try {
    const r = await api(`/api/tasks/${task.value.id}/comments/${c.id}/${path}`, { method, body })
    if (method === 'DELETE') comments.value = comments.value.filter((x) => x !== c)
    else Object.assign(c, r)
    return true
  } catch (e) {
    toast(e.message || 'Não foi possível salvar.')
    return false
  }
}
async function saveEdit(c) {
  if (editBody.value.trim() && (await commentAction(c, '', { body: editBody.value.trim() }, 'PATCH'))) editingId.value = null
}
async function copy(text, done) {
  try {
    await navigator.clipboard.writeText(text)
    toast(done)
  } catch { toast('Não deu para copiar.') }
}
const copyBranch = () => copy(`${code(task.value).toLowerCase()}-${slug(task.value.title).slice(0, 50)}`, 'Nome da branch copiado.')
const copyLink = () => copy(`${location.origin}${location.pathname}?task=${task.value.id}`, 'Link da tarefa copiado.')
function duplicate() {
  const t = task.value
  menu.value = false
  const copyOf = createTask({ title: `${t.title} (cópia)`.slice(0, 200), projectId: t.projectId, description: t.description, priority: t.priority, due: t.due, start: t.start, tags: [...t.tags], assignees: [...t.assignees], checklist: t.checklist.map((i) => ({ title: i.title, done: false })) })
  openTask(copyOf)
  toast('Tarefa duplicada.')
}
async function copyCode() {
  try {
    await navigator.clipboard.writeText(`${code(task.value)} · ${task.value.title}`)
    toast('Código copiado.')
  } catch { toast('Não deu para copiar.') }
}
// mudou de projeto: só ficam como responsáveis as pessoas que participam do projeto novo
function moveTo(projectId) {
  const allowed = new Set(peopleOf(projectId).map((m) => m.id))
  set({ projectId, assignees: task.value.assignees.filter((id) => !projectId || allowed.has(id)) })
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
          <template v-if="saved">
            <span class="votes" role="group" aria-label="Votos">
              <button type="button" class="vote" :aria-pressed="myVote === 1" :title="`A favor: ${names(panelData.upvotes)}`" aria-label="Votar a favor" @click="vote(1, $event.currentTarget)">▲ {{ panelData.upvotes.length }}</button>
              <button type="button" class="vote" :aria-pressed="myVote === -1" :title="`Contra: ${names(panelData.downvotes)}`" aria-label="Votar contra" @click="vote(-1, $event.currentTarget)">▼ {{ panelData.downvotes.length }}</button>
            </span>
            <button type="button" class="sub-btn" :aria-pressed="watching" :title="`Inscritos: ${names(panelData.watchers)}`" @click="act('subscribe/', { on: !watching }).then(() => pop($event.currentTarget))"><AppIcon name="user" :size="13" />{{ watching ? 'Inscrito' : 'Inscrever-se' }}<span>{{ panelData.watchers.length }}</span></button>
            <button type="button" class="icon" title="Copiar nome da branch" aria-label="Copiar nome da branch" @click="copyBranch"><AppIcon name="github" :size="15" /></button>
            <button type="button" class="icon" title="Copiar link" aria-label="Copiar link da tarefa" @click="copyLink"><AppIcon name="link" :size="16" /></button>
          </template>
          <div class="menu-wrap">
            <button type="button" class="icon" :aria-expanded="menu" aria-label="Mais opções" @click="menu = !menu; confirmDelete = false"><AppIcon name="more" :size="16" /></button>
            <div v-if="menu" class="menu" role="menu">
              <button v-if="saved" type="button" role="menuitem" @click="duplicate"><AppIcon name="doc" :size="14" />Duplicar</button>
              <button v-if="saved" type="button" role="menuitem" @click="copyCode(); menu = false"><AppIcon name="pin" :size="14" />Copiar código</button>
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
          <span v-if="saving" class="saving">{{ saving }}</span>
          <textarea class="title" :value="task.title" rows="1" maxlength="200" aria-label="Título" @input="titleLen = $event.target.value.length" @change="set({ title: $event.target.value.trim() || task.title })" />
          <span class="count" :class="{ full: titleLen >= 200 }">{{ titleLen }}/200</span>
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
              <button v-for="m in peopleOf(task.projectId)" :key="m.id" type="button" role="menuitemcheckbox" :aria-checked="task.assignees.includes(m.id)" @click="toggleMember(m.id)">
                <span class="dot" :style="{ background: m.color }" />{{ m.name }}<AppIcon v-if="task.assignees.includes(m.id)" name="check" :size="13" class="tick" />
              </button>
            </div>
          </div>
          <label class="cell" title="Data de início"><AppIcon name="calendar" :size="15" /><input type="date" :value="task.start || ''" :max="task.due || undefined" aria-label="Data de início" @change="set({ start: $event.target.value || null })" /></label>
          <label class="cell" title="Prazo"><AppIcon name="calendar" :size="15" /><input type="date" :value="task.due || ''" :min="task.start || undefined" aria-label="Prazo" @change="set({ due: $event.target.value || null })" /></label>
        </div>

        <div class="sec">
          <MdEditor :key="task.id" v-model="desc" view collapsible :rows="5" placeholder="Adicione detalhes, links ou critérios de pronto…" :upload="saved ? uploadFile : null" @commit="saveDesc" />
          <div v-if="saved" class="under">
            <ReactionBar :reactions="panelData.reactions" @toggle="(e) => act('react/', { emoji: e })" />
            <small v-if="panelData.last_edited_at">Editada por {{ member(panelData.last_editor)?.name || 'alguém' }} {{ ago(panelData.last_edited_at) }}</small>
          </div>
        </div>

        <!-- ações do Plane: subitem, dependência, relação, link, anexo e página -->
        <div v-if="saved" class="actions sec" role="toolbar" aria-label="Ações">
          <button type="button" :aria-pressed="adding === 'sub'" @click="openAdd('sub')"><AppIcon name="plus" :size="13" />Subitem</button>
          <button type="button" :aria-pressed="adding === 'dep'" @click="openAdd('dep')"><AppIcon name="layers" :size="13" />Dependência</button>
          <button type="button" :aria-pressed="adding === 'rel'" @click="openAdd('rel')"><AppIcon name="module" :size="13" />Relação</button>
          <button type="button" :aria-pressed="adding === 'link'" @click="openAdd('link')"><AppIcon name="link" :size="13" />Link</button>
          <label class="attach"><AppIcon name="archive" :size="13" />Anexar<input type="file" @change="onAttach" /></label>
          <button type="button" :aria-pressed="adding === 'page'" @click="openAdd('page')"><AppIcon name="page" :size="13" />Página</button>
        </div>
        <form v-if="adding === 'dep' || adding === 'rel'" class="inline sec" @submit.prevent="addRelation">
          <select v-model="rel.kind" aria-label="Tipo">
            <template v-if="adding === 'dep'"><option value="blocks">Esta bloqueia…</option><option value="blocked_by">Esta é bloqueada por…</option></template>
            <template v-else><option value="relates">Relacionada a…</option><option value="duplicate">Duplicada de…</option></template>
          </select>
          <select v-model="rel.task" aria-label="Tarefa" required><option value="" disabled>Escolher tarefa</option><option v-for="t in relationOptions" :key="t.id" :value="t.id">{{ code(t) }} · {{ t.title }}</option></select>
          <button type="submit" class="done-btn">Adicionar</button>
        </form>
        <form v-if="adding === 'link'" class="inline sec" @submit.prevent="addLink">
          <input v-model="link.url" type="text" placeholder="https://…" aria-label="Endereço do link" required />
          <input v-model="link.name" type="text" placeholder="Nome (opcional)" aria-label="Nome do link" />
          <button type="submit" class="done-btn">Adicionar</button>
        </form>
        <div v-if="adding === 'page'" class="inline sec">
          <select aria-label="Página" @change="linkPage($event.target.value)"><option value="">Escolher página do projeto</option><option v-for="pg in state.pages.filter((p) => p.project === task.projectId)" :key="pg.id" :value="pg.id">{{ pg.title || 'Sem título' }}</option></select>
          <span v-if="!state.pages.some((p) => p.project === task.projectId)" class="none">Este projeto ainda não tem páginas.</span>
        </div>

        <section v-if="relationGroups.length" class="sec">
          <h3>Relações</h3>
          <div v-for="[kind, items] in relationGroups" :key="kind" class="rel">
            <span class="rel__kind">{{ RELATIONS[kind] }}</span>
            <span v-for="r in items" :key="r.id" class="rel__item">
              <button type="button" class="subs__title" @click="r.other && openTask(r.other)">{{ r.other ? `${code(r.other)} · ${r.other.title}` : `#${r.task}` }}</button>
              <button type="button" class="x" :aria-label="`Remover relação com ${r.other?.title || r.task}`" @click="act(`relations/${r.id}/`, undefined, 'DELETE')">×</button>
            </span>
          </div>
        </section>
        <section v-if="panelData.attachments.length" class="sec">
          <h3>Links e anexos <span>{{ panelData.attachments.length }}</span></h3>
          <ul class="files">
            <li v-for="a in panelData.attachments" :key="a.id">
              <img v-if="a.kind === 'image'" :src="a.url" alt="" class="thumb" />
              <AppIcon v-else :name="ICON_OF[a.kind] || 'doc'" :size="15" />
              <a :href="a.url" target="_blank" rel="noopener">{{ a.name || a.url }}</a>
              <small>{{ size(a.size) }}</small>
              <button type="button" class="x" :aria-label="`Remover ${a.name}`" @click="act(`attachments/${a.id}/`, undefined, 'DELETE')">×</button>
            </li>
          </ul>
        </section>

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
            <dd><select :value="task.projectId || ''" aria-label="Projeto" @change="moveTo(Number($event.target.value) || null)"><option value="">Sem projeto</option><option v-for="p in state.projects" :key="p.id" :value="p.id">{{ p.name }}</option></select></dd>
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
            <button v-for="t in TABS" :key="t[0]" type="button" role="tab" :aria-selected="tab === t[0]" @click="tab = t[0]">{{ t[1] }}</button>
            <button type="button" class="sort" :title="newest ? 'Mais recentes primeiro' : 'Mais antigos primeiro'" @click="newest = !newest">{{ newest ? '↓ Recentes' : '↑ Antigos' }}</button>
          </div>
          <form v-if="['all', 'comments', 'updates'].includes(tab)" class="comment" @submit.prevent="sendComment">
            <div v-if="tab === 'updates'" class="states" role="radiogroup" aria-label="Situação">
              <label v-for="[id, label, color] in UPDATE_STATES" :key="id" :style="{ '--c': color }"><input v-model="updateState" type="radio" name="update-state" :value="id" />{{ label }}</label>
            </div>
            <MdEditor v-model="comment" :rows="2" :upload="uploadFile" :placeholder="tab === 'updates' ? 'Como está a tarefa? Conte o que avançou e o que falta.' : 'Escreva um comentário (Ctrl+Enter envia)'" @commit="(how) => how === 'submit' && sendComment()" />
            <button type="submit" class="done-btn" :disabled="!comment.trim() || sending">{{ tab === 'updates' ? 'Publicar atualização' : 'Comentar' }}</button>
          </form>
          <ol class="log">
            <li v-for="f in feed" :key="f.key" :class="{ 'is-comment': f.comment }">
              <template v-if="f.comment">
                <div class="c-head">
                  <strong>{{ member(f.comment.author)?.name || 'Alguém' }}</strong>
                  <span v-if="f.comment.is_update" class="upd" :style="{ '--c': UPDATE_STATES.find((s) => s[0] === f.comment.update_state)?.[2] }">{{ UPDATE_STATES.find((s) => s[0] === f.comment.update_state)?.[1] || 'Atualização' }}</span>
                  <time>{{ ago(f.at) }}{{ f.comment.edited_at ? ' · editado' : '' }}</time>
                  <span v-if="f.comment.author === state.me" class="c-actions">
                    <button type="button" @click="editingId = f.comment.id; editBody = f.comment.body">Editar</button>
                    <button type="button" @click="commentAction(f.comment, '', undefined, 'DELETE')">Apagar</button>
                  </span>
                </div>
                <form v-if="editingId === f.comment.id" class="c-edit" @submit.prevent="saveEdit(f.comment)">
                  <MdEditor v-model="editBody" :rows="2" :upload="uploadFile" @commit="(how) => how === 'submit' && saveEdit(f.comment)" />
                  <div><button type="button" class="ghost" @click="editingId = null">Cancelar</button><button type="submit" class="done-btn">Salvar</button></div>
                </form>
                <!-- eslint-disable-next-line vue/no-v-html -- render() escapa o texto antes de montar o HTML -->
                <div v-else class="c-body" v-html="render(f.comment.body)" />
                <ReactionBar :reactions="f.comment.reactions || []" @toggle="(e) => commentAction(f.comment, 'react/', { emoji: e })" />
              </template>
              <template v-else>
                <span><strong v-if="f.actor">{{ member(f.actor)?.name || 'Alguém' }}</strong> {{ f.text }}</span>
                <small v-if="f.details && Object.keys(f.details).length" class="det">{{ Object.entries(f.details).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' · ') }}</small>
                <time>{{ ago(f.at) }}</time>
              </template>
            </li>
            <li v-if="!feed.length" class="muted">{{ { comments: 'Nenhum comentário ainda.', updates: 'Nenhuma atualização ainda.', transition: 'O estado ainda não mudou.', history: 'Nenhuma alteração registrada.' }[tab] || 'Sem atividade ainda.' }}</li>
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
.drawer { display: flex; flex-direction: column; width: min(92vw, 58rem); height: 100%; border-left: 1px solid var(--line-strong); background: var(--surface); box-shadow: -20px 0 50px rgb(0 0 0 / 0.4); }
.is-wide .drawer { width: min(100%, 76rem); height: min(100%, 52rem); border: 1px solid var(--line-strong); border-radius: 12px; }
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
.votes { display: inline-flex; border: 1px solid var(--line); border-radius: 6px; }
.vote { height: 28px; padding: 0 0.5rem; border: 0; background: none; font-size: 12px; color: var(--muted); cursor: pointer; }
.vote + .vote { border-left: 1px solid var(--line); }
.vote[aria-pressed='true'] { color: var(--accent-soft); }
.sub-btn { display: inline-flex; align-items: center; gap: 0.35rem; height: 30px; padding: 0 0.6rem; border: 1px solid var(--line); border-radius: 6px; background: none; font-size: 12.5px; color: var(--text); cursor: pointer; }
.sub-btn span { color: var(--muted); }
.sub-btn[aria-pressed='true'] { border-color: var(--accent); }
.saving { margin-left: 0.6rem; font-size: 11.5px; color: var(--accent-soft); }
.count { display: block; text-align: right; font-size: 11px; color: var(--muted); }
.count.full { color: #ff8a80; }
.under { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem; margin-top: 0.6rem; }
.under small { font-size: 11.5px; color: var(--muted); }
.actions { display: flex; flex-wrap: wrap; gap: 0.3rem; padding: 0.35rem; border: 1px solid var(--line); border-radius: 8px; }
.actions button, .attach { position: relative; display: inline-flex; align-items: center; gap: 0.3rem; height: 28px; padding: 0 0.55rem; border: 0; border-radius: 6px; background: none; font-size: 12.5px; color: var(--muted); cursor: pointer; }
.actions button:hover, .actions button[aria-pressed='true'], .attach:hover { background: var(--surface-2); color: var(--text); }
.attach input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.attach:focus-within { outline: 2px solid var(--accent-soft); }
.inline { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
.inline select, .inline input { flex: 1; min-width: 9rem; height: 32px; padding: 0 0.5rem; border: 1px solid var(--line-strong); border-radius: 6px; background: var(--bg); font: inherit; font-size: 13px; color: var(--text); }
.rel { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; margin-bottom: 0.4rem; font-size: 13px; }
.rel__kind { min-width: 7.5rem; font-size: 12px; color: var(--muted); }
.rel__item { display: inline-flex; align-items: center; gap: 0.2rem; max-width: 100%; padding: 0.15rem 0.2rem 0.15rem 0.5rem; border: 1px solid var(--line); border-radius: 6px; }
.x { padding: 0 0.3rem; border: 0; background: none; color: var(--muted); cursor: pointer; }
.x:hover { color: #ff8a80; }
.files { display: flex; flex-direction: column; margin: 0; padding: 0; border: 1px solid var(--line); border-radius: 8px; list-style: none; }
.files li { display: flex; align-items: center; gap: 0.55rem; padding: 0.4rem 0.6rem; font-size: 13px; color: var(--muted); }
.files li + li { border-top: 1px solid var(--line); }
.files a { flex: 1; min-width: 0; overflow: hidden; color: var(--text); text-overflow: ellipsis; white-space: nowrap; text-decoration: none; }
.files a:hover { color: var(--accent-soft); }
.files small { font-size: 11.5px; }
.thumb { width: 28px; height: 28px; border-radius: 4px; object-fit: cover; }
.tabs { flex-wrap: wrap; align-items: center; }
.sort { margin-left: auto; padding: 0.25rem 0.5rem; border: 0; background: none; font-size: 12px; color: var(--muted); cursor: pointer; }
.states { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.states label { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.2rem 0.55rem; border: 1px solid color-mix(in srgb, var(--c) 60%, transparent); border-radius: 999px; font-size: 12px; cursor: pointer; }
.states label:has(input:checked) { background: color-mix(in srgb, var(--c) 22%, transparent); }
.states input { position: absolute; opacity: 0; }
.c-head { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
.c-head time { font-size: 11.5px; color: var(--muted); }
.upd { padding: 0.05rem 0.45rem; border-radius: 999px; background: color-mix(in srgb, var(--c, var(--accent)) 22%, transparent); font-size: 11px; }
.c-actions { display: flex; gap: 0.3rem; margin-left: auto; }
.c-actions button { padding: 0; border: 0; background: none; font-size: 11.5px; color: var(--muted); cursor: pointer; }
.c-actions button:hover { color: var(--text); }
.c-body { font-size: 13px; line-height: 1.55; overflow-wrap: anywhere; }
.c-body :deep(p) { margin: 0.2em 0; }
.c-body :deep(img) { max-width: 100%; border-radius: 6px; }
.c-body :deep(a) { color: var(--accent-soft); }
.c-body :deep(code) { padding: 0.1em 0.3em; border-radius: 4px; background: var(--surface-2); }
.c-body :deep(blockquote) { margin: 0.3em 0; padding-left: 0.7rem; border-left: 3px solid var(--accent); color: var(--muted); }
.c-edit div { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.4rem; }
.det { font-size: 11.5px; color: var(--muted); }
:is(.vote, .sub-btn, .actions button, .x, .sort, .c-actions button):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
:is(.done-btn, .icon, .chip, .box, .rm, .ntag button, .mini, .fold, .tabs button, .menu button, .cell__btn, .subs__title, .parent-link):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
</style>
