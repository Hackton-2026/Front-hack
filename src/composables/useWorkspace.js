import { computed, reactive, toRaw, watch } from 'vue'
import { api } from '../services/api'
import { useUi } from './useUi'

// Dados da área logada. Projetos, tarefas (com checklist e etiquetas), membros, atividade e caixa de entrada
// vêm da API do Back-hack (/api/...). Rascunhos, wiki e preferências são pessoais e ficam no navegador.
// As mudanças aparecem na hora (otimista) e são enviadas em seguida; se o servidor recusar, voltam atrás.

export const STATUSES = [
  { id: 'todo', name: 'Pendente', group: 'not_started', color: '#919599' },
  { id: 'doing', name: 'Em andamento', group: 'active', color: '#fba45c' },
  { id: 'review', name: 'Em revisão', group: 'active', color: '#f2c46d' },
  { id: 'done', name: 'Concluída', group: 'done', color: '#e56515' },
]
export const PRIORITIES = [
  { id: 'urgent', name: 'Urgente', color: '#ff5b4d' },
  { id: 'high', name: 'Alta', color: '#fba45c' },
  { id: 'normal', name: 'Normal', color: '#cdcdcb' },
  { id: 'low', name: 'Baixa', color: '#919599' },
]

const LOCAL_KEY = 'novexo:local:v1'
const day = (offset = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const uid = () => `tmp-${Math.random().toString(36).slice(2, 9)}`

const localDefaults = () => ({
  drafts: [],
  docs: [
    { id: 'doc-1', title: 'Como o time trabalha', body: 'Toda tarefa tem um responsável e um prazo.\nO que está em revisão é aprovado em até um dia útil.', updatedAt: new Date().toISOString(), example: true },
  ],
  prefs: { weekStart: 0, theme: 'dark', density: 'comfortable', notify: { assigned: true, mention: true, due: true, digest: false } },
})
function readLocal() {
  try {
    const data = JSON.parse(localStorage.getItem(LOCAL_KEY))
    if (data) return { ...localDefaults(), ...data }
  } catch { /* nada salvo */ }
  return localDefaults()
}
const local = readLocal()

const state = reactive({
  loaded: false,
  loading: false,
  error: '',
  me: null,
  isAdmin: false,
  workspaceName: '',
  members: [],
  projects: [],
  tasks: [...local.drafts], // rascunhos locais + tarefas da API
  activity: [],
  inbox: [],
  docs: local.docs,
  prefs: local.prefs,
})

// Só a parte pessoal vai para o navegador
watch(() => [state.tasks.filter((t) => t.draft), state.docs, state.prefs], ([drafts, docs, prefs]) => {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify({ drafts, docs, prefs })) } catch { /* modo privado */ }
}, { deep: true })

// ---- tradução entre o formato da API e o do front
const fromApi = (t) => ({
  id: t.id, number: t.number, code: t.code, projectId: t.project, title: t.title, description: t.description, status: t.status,
  priority: t.priority, assignees: t.assignees, due: t.due, tags: t.tags, checklist: t.checklist, completionNote: t.completion_note,
  createdAt: t.created_at, updatedAt: t.updated_at, draft: false,
})
function toApi(fields) {
  const body = {}
  for (const [k, v] of Object.entries(fields)) {
    if (k === 'projectId') body.project = v
    else if (k === 'checklist') body.checklist = v.map((i) => (typeof i.id === 'number' ? i : { title: i.title, done: i.done }))
    else if (['title', 'description', 'status', 'priority', 'assignees', 'due', 'tags', 'note'].includes(k)) body[k] = v
  }
  return body
}
const fromActivity = (a) => ({ id: a.id, taskId: a.task, text: a.text, at: a.at })

async function load() {
  if (state.loading) return
  state.loading = true
  state.error = ''
  try {
    // o workspace vem antes: no primeiro acesso é essa chamada que cria ele (as outras em paralelo disputariam a criação)
    const ws = await api('/api/workspace/')
    const [projects, tasks, activity, inbox] = await Promise.all([api('/api/projects/'), api('/api/tasks/'), api('/api/activity/'), api('/api/inbox/')])
    Object.assign(state, { me: ws.me, isAdmin: ws.is_admin, workspaceName: ws.name, members: ws.members, projects, activity: activity.map(fromActivity), inbox, loaded: true })
    state.tasks = [...state.tasks.filter((t) => t.draft), ...tasks.map(fromApi)]
  } catch (e) {
    state.error = e.message
  } finally {
    state.loading = false
  }
}

// Depois de mudar algo, o histórico e a caixa de entrada vêm de novo (os signals do backend escrevem neles)
let refreshTimer
function refreshFeed() {
  clearTimeout(refreshTimer)
  refreshTimer = setTimeout(async () => {
    try {
      const [activity, inbox] = await Promise.all([api('/api/activity/'), api('/api/inbox/')])
      state.activity = activity.map(fromActivity)
      state.inbox = inbox
    } catch { /* tenta de novo na próxima mudança */ }
  }, 300)
}

const fail = (e) => useUi().toast(e.message || 'Não foi possível salvar. Tente de novo.')
const queues = new Map() // fila de PATCHes por tarefa

export function useWorkspace() {
  const project = (id) => state.projects.find((p) => p.id === id)
  const member = (id) => state.members.find((m) => m.id === id)
  const status = (id) => STATUSES.find((s) => s.id === id) || STATUSES[0]
  const priority = (id) => PRIORITIES.find((p) => p.id === id)
  const code = (task) => task.code || (task.draft ? 'Rascunho' : '…')
  const tasksOf = (projectId) => state.tasks.filter((t) => t.projectId === projectId && !t.draft)
  const mine = computed(() => state.tasks.filter((t) => !t.draft && t.assignees.includes(state.me)))
  const drafts = computed(() => state.tasks.filter((t) => t.draft))
  const isOverdue = (t) => t.due && t.status !== 'done' && t.due < day(0)
  const unread = computed(() => state.inbox.filter((n) => !n.read).length)

  // Cria na hora com id temporário; quando a API responde, a mesma tarefa ganha o id e o código reais
  function createTask(fields) {
    const task = reactive({
      id: uid(), number: null, code: '', projectId: null, title: '', status: 'todo', priority: '', assignees: [state.me], due: null, tags: [],
      description: '', checklist: [], draft: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...fields,
    })
    if (!task.projectId) task.draft = true
    state.tasks.push(task)
    if (!task.draft) save(task)
    return task
  }
  async function save(task) {
    const tmp = task.id
    try {
      const data = await api('/api/tasks/', { method: 'POST', body: toApi({ ...task }) })
      Object.assign(task, fromApi(data))
      const ui = useUi().ui
      if (ui.taskId === tmp) ui.taskId = task.id
      refreshFeed()
    } catch (e) {
      state.tasks.splice(state.tasks.indexOf(task), 1)
      fail(e)
    }
  }
  // Devolve true se salvou; em erro desfaz a mudança, mostra o aviso e devolve a mensagem
  async function updateTask(task, fields) {
    // rascunho publicado = cria a tarefa de verdade na API
    if (task.draft) {
      Object.assign(task, fields, { updatedAt: new Date().toISOString() })
      if (fields.draft === false && task.projectId) save(task)
      return true
    }
    const before = Object.fromEntries(Object.keys(fields).map((k) => [k, structuredClone(toRaw(task[k]) ?? null)]))
    Object.assign(task, fields, { updatedAt: new Date().toISOString() })
    if (typeof task.id !== 'number') return true // ainda criando: a criação leva os campos atuais
    // as mudanças de uma mesma tarefa vão uma de cada vez, na ordem (senão a resposta antiga sobrescreve a nova)
    const run = async () => {
      try {
        const data = await api(`/api/tasks/${task.id}/`, { method: 'PATCH', body: toApi(fields) })
        Object.assign(task, fromApi(data))
        refreshFeed()
        return true
      } catch (e) {
        Object.assign(task, before)
        fail(e)
        return e.message
      }
    }
    const next = (queues.get(task.id) || Promise.resolve()).then(run)
    queues.set(task.id, next)
    return next
  }
  async function removeTask(task) {
    state.tasks.splice(state.tasks.indexOf(task), 1)
    if (task.draft || typeof task.id !== 'number') return
    try {
      await api(`/api/tasks/${task.id}/`, { method: 'DELETE' })
      refreshFeed()
    } catch (e) {
      state.tasks.push(task)
      fail(e)
    }
  }
  async function createProject(name, color = '#e56515') {
    try {
      const p = await api('/api/projects/', { method: 'POST', body: { name, color } })
      state.projects.push(p)
      refreshFeed()
      return p
    } catch (e) {
      fail(e)
      return null
    }
  }
  async function renameWorkspace(name) {
    try {
      const ws = await api('/api/workspace/', { method: 'PATCH', body: { name } })
      state.workspaceName = ws.name
    } catch (e) {
      fail(e)
    }
  }
  async function markRead(n) {
    n.read = true
    try { await api(`/api/inbox/${n.id}/`, { method: 'PATCH', body: { read: true } }) } catch { /* fica lida só aqui */ }
  }
  async function markAllRead() {
    state.inbox.forEach((n) => (n.read = true))
    try { await api('/api/inbox/read-all/', { method: 'POST' }) } catch { /* fica lida só aqui */ }
  }
  const taskActivity = async (id) => (await api(`/api/activity/?task=${id}`)).map(fromActivity)
  function createDoc() {
    const d = { id: `doc-${Date.now().toString(36)}`, title: 'Sem título', body: '', updatedAt: new Date().toISOString() }
    state.docs.unshift(d)
    return d
  }
  const progress = (projectId) => {
    const list = tasksOf(projectId)
    return list.length ? list.filter((t) => t.status === 'done').length / list.length : 0
  }
  function clearLocal() {
    state.tasks = state.tasks.filter((t) => !t.draft)
    state.docs = localDefaults().docs
  }

  return {
    state, STATUSES, PRIORITIES, project, member, status, priority, code, tasksOf, mine, drafts, isOverdue, unread,
    load, createTask, updateTask, removeTask, createProject, renameWorkspace, markRead, markAllRead, taskActivity, createDoc, progress, clearLocal,
    today: () => day(0), day,
  }
}
