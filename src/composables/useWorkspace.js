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
  prefs: {
    weekStart: 0, theme: 'dark', density: 'comfortable',
    accent: '#e56515', contrast: false, calm: false, showIds: true, handCursor: true, shortcuts: true, defaultView: 'list', defaultPriority: '', assignMe: true,
    notify: { assigned: true, mention: true, due: true, status: true, done: false, digest: false, followOwn: true },
    // barra lateral (pessoal, como no Plane): o que aparece, o que está fixado do "Mais" e o que tem estrela
    nav: { drafts: true, mine: true, notes: true },
    pinned: [],
    features: { cycles: true, modules: true, views: true, pages: true },
    // Wiki (como no Plane): coleções de páginas e etiquetas das páginas
    wiki: { collections: [{ id: 'geral', name: 'Minhas páginas' }], labels: [] },
    stars: [],
    open: { workspace: true, projects: true, try: true },
    // Home: links rápidos e o que a pessoa abriu por último (kind:id)
    quicklinks: [
      { id: 'q1', title: 'Guia de início', url: '/comecar', at: new Date().toISOString() },
      { id: 'q2', title: 'Sua wiki', url: '/wiki', at: new Date().toISOString() },
      { id: 'q3', title: 'Planos do Novexo', url: '/#planos', at: new Date().toISOString() },
    ],
    recents: [],
  },
})
export const MODULE_STATES = [
  { id: 'backlog', name: 'Backlog', color: '#919599' },
  { id: 'planned', name: 'Planejado', color: '#cdcdcb' },
  { id: 'in_progress', name: 'Em andamento', color: '#fba45c' },
  { id: 'paused', name: 'Pausado', color: '#f2c46d' },
  { id: 'completed', name: 'Concluído', color: '#e56515' },
  { id: 'cancelled', name: 'Cancelado', color: '#6f6a63' },
]
export const UPDATE_STATES = [
  { id: 'on_track', name: 'No prazo', color: '#7fc47a' },
  { id: 'at_risk', name: 'Em risco', color: '#f2c46d' },
  { id: 'off_track', name: 'Atrasado', color: '#ff5b4d' },
]
// capas da visão geral do projeto (gradientes na paleta do Novexo)
export const COVERS = [
  'radial-gradient(120% 140% at 15% 20%, #e56515 0%, #5a1d05 45%, #0f0e0d 100%)',
  'linear-gradient(120deg, #fba45c 0%, #e56515 40%, #2a1408 100%)',
  'radial-gradient(90% 120% at 80% 30%, #f2c46d 0%, #e56515 35%, #181614 100%)',
  'linear-gradient(160deg, #3d3934 0%, #919599 50%, #181614 100%)',
  'conic-gradient(from 210deg at 30% 60%, #e56515, #fba45c, #cdcdcb, #0f0e0d, #e56515)',
  'linear-gradient(90deg, #0f0e0d 0%, #5a1d05 40%, #fba45c 100%)',
]
function readLocal() {
  try {
    const data = JSON.parse(localStorage.getItem(LOCAL_KEY))
    const d = localDefaults()
    if (data) return { ...d, ...data, prefs: { ...d.prefs, ...data.prefs, notify: { ...d.prefs.notify, ...data.prefs?.notify } } }
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
  slug: '',
  settings: {}, // seções de Workspace.settings (general, governance, products, identity, schedule, integrations)
  members: [], // do workspace (que é pessoal: normalmente só você)
  people: [], // todo mundo dos seus projetos (os seus e os compartilhados com você): nomes, cores e fotos
  invites: [], // convites para projetos que você recebeu e ainda não respondeu
  projects: [],
  tasks: [...local.drafts], // rascunhos locais + tarefas da API
  activity: [],
  inbox: [],
  cycles: [],
  modules: [],
  pages: [],
  views: [],
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
  priority: t.priority, assignees: t.assignees, due: t.due, start: t.start, parent: t.parent, creator: t.creator, tags: t.tags, checklist: t.checklist, completionNote: t.completion_note,
  cycle: t.cycle, modules: t.modules, completedAt: t.completed_at, createdAt: t.created_at, updatedAt: t.updated_at, draft: false,
})
function toApi(fields) {
  const body = {}
  for (const [k, v] of Object.entries(fields)) {
    if (k === 'projectId') body.project = v
    else if (k === 'checklist') body.checklist = v.map((i) => (typeof i.id === 'number' ? i : { title: i.title, done: i.done }))
    else if (['title', 'description', 'status', 'priority', 'assignees', 'due', 'start', 'parent', 'tags', 'note', 'cycle', 'modules'].includes(k)) body[k] = v
  }
  return body
}
const fromActivity = (a) => ({ id: a.id, taskId: a.task, text: a.text, at: a.at, details: a.details || {} })
const KINDS = { cycle: 'cycles', module: 'modules', page: 'pages', view: 'views' }

async function load() {
  if (state.loading) return
  state.loading = true
  state.error = ''
  try {
    // o workspace vem antes: no primeiro acesso é essa chamada que cria ele (as outras em paralelo disputariam a criação)
    const ws = await api('/api/workspace/')
    const [projects, tasks, activity, inbox, cycles, modules, pages, views, invites] = await Promise.all(
      ['projects', 'tasks', 'activity', 'inbox', 'cycles', 'modules', 'pages', 'views', 'invites'].map((r) => api(`/api/${r}/`)),
    )
    Object.assign(state, {
      me: ws.me, isAdmin: ws.is_admin, workspaceName: ws.name, slug: ws.slug, settings: ws.settings || {}, members: ws.members, people: ws.people || [],
      projects, activity: activity.map(fromActivity), inbox, cycles, modules, pages, views, invites, loaded: true,
    })
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
      const [activity, inbox, invites] = await Promise.all([api('/api/activity/'), api('/api/inbox/'), api('/api/invites/')])
      state.activity = activity.map(fromActivity)
      state.inbox = inbox
      state.invites = invites
    } catch { /* tenta de novo na próxima mudança */ }
  }, 300)
}

const fail = (e) => useUi().toast(e.message || 'Não foi possível salvar. Tente de novo.')
const queues = new Map() // fila de PATCHes por tarefa

export function useWorkspace() {
  const project = (id) => state.projects.find((p) => p.id === id)
  const member = (id) => state.people.find((m) => m.id === id) || state.members.find((m) => m.id === id)
  // quem participa do projeto (pode ser responsável). Sem projeto: todo mundo dos seus projetos
  const peopleOf = (projectId) => {
    const ids = project(projectId)?.members
    return ids ? ids.map(member).filter(Boolean) : state.people
  }
  const status = (id) => STATUSES.find((s) => s.id === id) || STATUSES[0]
  const priority = (id) => PRIORITIES.find((p) => p.id === id)
  const code = (task) => task.code || (task.draft ? 'Rascunho' : '…')
  const tasksOf = (projectId) => state.tasks.filter((t) => t.projectId === projectId && !t.draft)
  const mine = computed(() => state.tasks.filter((t) => !t.draft && t.assignees.includes(state.me)))
  const drafts = computed(() => state.tasks.filter((t) => t.draft))
  const isOverdue = (t) => t.due && t.status !== 'done' && t.due < day(0)
  const unread = computed(() => state.inbox.filter((n) => !n.read).length + state.invites.length) // convites pendentes também contam

  // Cria na hora com id temporário; quando a API responde, a mesma tarefa ganha o id e o código reais
  function createTask(fields) {
    const task = reactive({
      id: uid(), number: null, code: '', projectId: null, title: '', status: 'todo', priority: '', assignees: [state.me], due: null, start: null, parent: null, creator: state.me, tags: [], cycle: null, modules: [],
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
  // Projeto: edição otimista (nome, descrição, ícone, capa); volta atrás se o servidor recusar
  async function updateProject(p, fields) {
    const before = Object.fromEntries(Object.keys(fields).map((k) => [k, p[k]]))
    Object.assign(p, fields)
    try {
      Object.assign(p, await api(`/api/projects/${p.id}/`, { method: 'PATCH', body: fields }))
      refreshFeed()
      return true
    } catch (e) {
      Object.assign(p, before)
      fail(e)
      return false
    }
  }
  async function postUpdate(p, body) {
    try {
      const a = fromActivity(await api(`/api/projects/${p.id}/updates/`, { method: 'POST', body }))
      state.activity.unshift(a)
      return a
    } catch (e) {
      fail(e)
      return null
    }
  }
  const projectActivity = async (id) => (await api(`/api/activity/?project=${id}`)).map(fromActivity)

  // Ciclos, módulos, páginas e visões: mesma receita (cria, edita otimista, apaga)
  async function createItem(kind, body) {
    try {
      const item = await api(`/api/${KINDS[kind]}/`, { method: 'POST', body })
      state[KINDS[kind]].push(item)
      return state[KINDS[kind]].at(-1)
    } catch (e) {
      fail(e)
      return null
    }
  }
  async function updateItem(kind, item, fields) {
    const before = Object.fromEntries(Object.keys(fields).map((k) => [k, structuredClone(toRaw(item[k]) ?? null)]))
    Object.assign(item, fields)
    try {
      Object.assign(item, await api(`/api/${KINDS[kind]}/${item.id}/`, { method: 'PATCH', body: fields }))
      return true
    } catch (e) {
      Object.assign(item, before)
      fail(e)
      return false
    }
  }
  async function removeItem(kind, item) {
    const list = state[KINDS[kind]]
    const i = list.indexOf(item)
    list.splice(i, 1)
    try {
      await api(`/api/${KINDS[kind]}/${item.id}/`, { method: 'DELETE' })
      // o servidor tira a tarefa do ciclo / módulo apagado; aqui também
      if (kind === 'cycle') state.tasks.forEach((t) => t.cycle === item.id && (t.cycle = null))
      if (kind === 'module') state.tasks.forEach((t) => t.modules?.includes(item.id) && (t.modules = t.modules.filter((m) => m !== item.id)))
    } catch (e) {
      list.splice(i, 0, item)
      fail(e)
    }
  }
  // Arquivados e lixeira
  const archivedProjects = () => api('/api/projects/?archived=1')
  const trashedTasks = async () => (await api('/api/tasks/?trash=1')).map(fromApi)
  async function restoreProject(p) {
    try {
      state.projects.push(await api(`/api/projects/${p.id}/`, { method: 'PATCH', body: { archived: false } }))
      const [tasks, cycles, modules, pages, views] = await Promise.all(['tasks', 'cycles', 'modules', 'pages', 'views'].map((r) => api(`/api/${r}/?project=${p.id}`)))
      state.tasks.push(...tasks.map(fromApi))
      Object.entries({ cycles, modules, pages, views }).forEach(([k, v]) => state[k].push(...v))
      return true
    } catch (e) {
      fail(e)
      return false
    }
  }
  async function archiveProject(p) {
    try {
      await api(`/api/projects/${p.id}/`, { method: 'DELETE' })
      state.projects.splice(state.projects.indexOf(p), 1)
      for (const k of ['cycles', 'modules', 'pages', 'views']) state[k] = state[k].filter((x) => x.project !== p.id)
      state.tasks = state.tasks.filter((t) => t.projectId !== p.id)
      return true
    } catch (e) {
      fail(e)
      return false
    }
  }
  async function restoreTask(t) {
    try {
      state.tasks.push(fromApi(await api(`/api/tasks/${t.id}/restore/`, { method: 'POST' })))
      refreshFeed()
      return true
    } catch (e) {
      fail(e)
      return false
    }
  }
  // estrela pessoal (fica no navegador): kind:id
  const starred = (kind, id) => state.prefs.stars.includes(`${kind}:${id}`)
  function toggleStar(kind, id) {
    const key = `${kind}:${id}`
    state.prefs.stars = starred(kind, id) ? state.prefs.stars.filter((s) => s !== key) : [...state.prefs.stars, key]
  }
  // recentes da Home: o último aberto vai para o topo (máx. 20)
  function touchRecent(kind, id) {
    const key = `${kind}:${id}`
    state.prefs.recents = [{ key, at: new Date().toISOString() }, ...state.prefs.recents.filter((r) => r.key !== key)].slice(0, 20)
  }
  // progresso de um grupo de tarefas (ciclo, módulo)
  const doneRatio = (list) => (list.length ? list.filter((t) => t.status === 'done').length / list.length : 0)

  // PATCH {name?, slug?, settings?: {seção: {...}}} (só admin). Devolve true se salvou.
  async function saveWorkspace(body) {
    try {
      const ws = await api('/api/workspace/', { method: 'PATCH', body })
      Object.assign(state, { workspaceName: ws.name, slug: ws.slug, settings: ws.settings, members: ws.members })
      return true
    } catch (e) {
      fail(e)
      return false
    }
  }
  const renameWorkspace = (name) => saveWorkspace({ name })
  async function setMemberRole(m, role) {
    try {
      m.role = (await api(`/api/workspace/members/${m.id}/`, { method: 'PATCH', body: { role } })).role
    } catch (e) {
      fail(e)
    }
  }
  async function removeMember(m) {
    try {
      await api(`/api/workspace/members/${m.id}/`, { method: 'DELETE' })
      state.members = state.members.filter((x) => x.id !== m.id)
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
  const taskComments = (id) => api(`/api/tasks/${id}/comments/`)
  const addComment = (id, body) => api(`/api/tasks/${id}/comments/`, { method: 'POST', body: { body } })
  function createDoc(fields = {}) {
    const now = new Date().toISOString()
    const d = reactive({ id: `doc-${Date.now().toString(36)}`, title: 'Sem título', body: '', createdAt: now, updatedAt: now, ...fields })
    state.docs.unshift(d)
    return d
  }
  const progress = (projectId) => {
    const list = tasksOf(projectId)
    return list.length ? list.filter((t) => t.status === 'done').length / list.length : 0
  }
  // ---- pessoas do projeto e convites (o workspace é seu; convites são para projetos)
  const projectMembers = (pid) => api(`/api/projects/${pid}/members/`)
  const inviteToProject = (pid, email, permission) => api(`/api/projects/${pid}/invitations/`, { method: 'POST', body: { email, permission } })
  const cancelInvite = (pid, inviteId) => api(`/api/projects/${pid}/invitations/${inviteId}/`, { method: 'DELETE' })
  const setProjectPermission = (pid, userId, permission) => api(`/api/projects/${pid}/members/${userId}/`, { method: 'PATCH', body: { permission } })
  async function removeProjectMember(pid, userId) {
    await api(`/api/projects/${pid}/members/${userId}/`, { method: 'DELETE' })
    if (userId === state.me) {
      // saiu do projeto: ele e as tarefas dele somem daqui
      state.projects = state.projects.filter((p) => p.id !== pid)
      state.tasks = state.tasks.filter((t) => t.draft || t.projectId !== pid)
    } else {
      const p = project(pid)
      if (p?.members) p.members = p.members.filter((id) => id !== userId)
    }
  }
  const inviteInfo = (token) => api(`/api/invites/${encodeURIComponent(token)}/`)
  async function acceptInvite(token) {
    const res = await api(`/api/invites/${encodeURIComponent(token)}/accept/`, { method: 'POST' })
    state.invites = state.invites.filter((i) => i.token !== token)
    state.loaded = false
    await load() // o projeto novo, as tarefas dele e as pessoas entram de uma vez
    return res
  }
  async function declineInvite(token) {
    await api(`/api/invites/${encodeURIComponent(token)}/decline/`, { method: 'POST' })
    state.invites = state.invites.filter((i) => i.token !== token)
  }
  // ---- chat do projeto
  const projectMessages = (pid, after) => api(`/api/projects/${pid}/messages/${after ? `?after=${after}` : ''}`)
  const sendProjectMessage = (pid, body) => api(`/api/projects/${pid}/messages/`, { method: 'POST', body: { body } })

  function clearLocal() {
    state.tasks = state.tasks.filter((t) => !t.draft)
    state.docs = localDefaults().docs
  }

  return {
    state, STATUSES, PRIORITIES, project, member, status, priority, code, tasksOf, mine, drafts, isOverdue, unread,
    load, createTask, updateTask, removeTask, createProject, renameWorkspace, saveWorkspace, setMemberRole, removeMember, markRead, markAllRead, taskActivity, taskComments, addComment, createDoc, progress, clearLocal,
    updateProject, postUpdate, projectActivity, createItem, updateItem, removeItem, archivedProjects, trashedTasks, restoreProject, archiveProject, restoreTask,
    starred, toggleStar, doneRatio, touchRecent, peopleOf,
    projectMembers, inviteToProject, cancelInvite, setProjectPermission, removeProjectMember, inviteInfo, acceptInvite, declineInvite,
    projectMessages, sendProjectMessage,
    today: () => day(0), day,
  }
}
