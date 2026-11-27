import { computed, reactive, watch } from 'vue'
import { api } from '../services/api'
import { useUi } from './useUi'
import { PROJECT_ICONS } from '../components/app/projectIcons'
import { createOptimisticQueue, deepMerge, restoreFields, snapshotFields } from '../utils/optimisticQueue'


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
    nav: { drafts: true, mine: true, notes: true },
    pinned: [],
    features: { cycles: true, modules: true, views: true, pages: true },
    wiki: { collections: [{ id: 'geral', name: 'Minhas páginas' }], labels: [] },
    stars: [],
    open: { workspace: true, projects: true, try: true },
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
  } catch { }
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
  settings: {},
  members: [],
  people: [],
  invites: [],
  projects: [],
  tasks: [...local.drafts],
  activity: [],
  inbox: [],
  cycles: [],
  modules: [],
  pages: [],
  views: [],
  docs: local.docs,
  prefs: local.prefs,
})

// persiste prefs, docs e rascunhos com debounce (nunca roda JSON.stringify/localStorage ao arrastar tarefas normais)
let persistTimer
function schedulePersist() {
  clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    try {
      const drafts = state.tasks.filter((t) => t.draft)
      localStorage.setItem(LOCAL_KEY, JSON.stringify({ drafts, docs: state.docs, prefs: state.prefs }))
    } catch { }
  }, 500)
}
watch(() => [state.docs, state.prefs], schedulePersist, { deep: true })

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
const fromActivity = (a) => ({ id: a.id, taskId: a.task, actor: a.actor, type: a.event_type, text: a.text, at: a.at, details: a.details || {} })
const KINDS = { cycle: 'cycles', module: 'modules', page: 'pages', view: 'views' }

const optimistic = createOptimisticQueue()

async function load() {
  if (state.loading) return
  state.loading = true
  state.error = ''
  try {
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

// logout/troca de conta: o singleton não pode mostrar o workspace e os rascunhos da conta anterior
export function resetWorkspace() {
  optimistic.clear()
  Object.assign(state, {
    loaded: false, loading: false, error: '', me: null, isAdmin: false, workspaceName: '', slug: '', settings: {},
    members: [], people: [], invites: [], projects: [], tasks: [], activity: [], inbox: [], cycles: [], modules: [], pages: [], views: [], docs: localDefaults().docs,
  })
}

let refreshTimer
function refreshFeed() {
  clearTimeout(refreshTimer)
  refreshTimer = setTimeout(async () => {
    try {
      const [activity, inbox, invites] = await Promise.all([api('/api/activity/'), api('/api/inbox/'), api('/api/invites/')])
      state.activity = activity.map(fromActivity)
      state.inbox = inbox
      state.invites = invites
    } catch { }
  }, 2500)
}

const fail = (e) => useUi().toast(e.message || 'Não foi possível salvar. Tente de novo.')
// clique duplo: um pedido igual em andamento é reaproveitado em vez de criar o item duas vezes
const inflight = new Map()
const once = (key, run) => { if (!inflight.has(key)) inflight.set(key, run().finally(() => inflight.delete(key))); return inflight.get(key) }

const saving = new WeakMap()

export function useWorkspace() {
  const project = (id) => state.projects.find((p) => p.id === id)
  const member = (id) => state.people.find((m) => m.id === id) || state.members.find((m) => m.id === id)
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
  const unread = computed(() => state.inbox.filter((n) => !n.read).length + state.invites.length)

  function createTask(fields) {
    const task = reactive({
      id: uid(), number: null, code: '', projectId: null, title: '', status: 'todo', priority: '', assignees: [state.me], due: null, start: null, parent: null, creator: state.me, tags: [], cycle: null, modules: [],
      description: '', checklist: [], draft: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...fields,
    })
    if (!task.projectId) task.draft = true
    state.tasks.push(task)
    if (task.draft) schedulePersist()
    else saving.set(task, save(task))
    return task
  }
  // resolve true/false quando o POST da tarefa termina (quem precisa saber se a criação deu certo)
  const taskSaved = (task) => saving.get(task) ?? Promise.resolve(true)
  async function save(task) {
    const tmp = task.id
    try {
      const data = await api('/api/tasks/', { method: 'POST', body: toApi({ ...task }) })
      Object.assign(task, fromApi(data))
      const ui = useUi().ui
      if (ui.taskId === tmp) ui.taskId = task.id
      schedulePersist()
      refreshFeed()
      return true
    } catch (e) {
      const idx = state.tasks.indexOf(task)
      if (idx >= 0) state.tasks.splice(idx, 1)
      fail(e)
      return false
    }
  }
  async function updateTask(task, fields) {
    if (task.draft) {
      Object.assign(task, fields, { updatedAt: new Date().toISOString() })
      schedulePersist()
      if (fields.draft === false && task.projectId) save(task)
      return true
    }
    const id = task.id
    if (typeof id !== 'number') {
      Object.assign(task, fields, { updatedAt: new Date().toISOString() })
      return true
    }
    return optimistic.enqueue(`task:${id}`, {
      patch: fields,
      captureBefore: (p) => snapshotFields(task, p),
      apply: (p) => Object.assign(task, p, { updatedAt: new Date().toISOString() }),
      revert: (before) => restoreFields(task, before),
      send: (batch) => api(`/api/tasks/${id}/`, { method: 'PATCH', body: toApi(batch) }),
      onSuccess: (data) => {
        Object.assign(task, fromApi(data))
        refreshFeed()
      },
      onError: fail,
    })
  }
  async function removeTask(task) {
    const idx = state.tasks.indexOf(task)
    if (idx < 0) return
    state.tasks.splice(idx, 1)
    if (task.draft) { schedulePersist(); return }
    if (typeof task.id !== 'number') return
    try {
      await api(`/api/tasks/${task.id}/`, { method: 'DELETE' })
      refreshFeed()
    } catch (e) {
      state.tasks.splice(idx, 0, task)
      fail(e)
    }
  }
  function createProject(name, color = '#e56515') {
    return once(`project:${name}`, async () => {
      try {
        const icon = PROJECT_ICONS[Math.floor(Math.random() * PROJECT_ICONS.length)]
        const p = await api('/api/projects/', { method: 'POST', body: { name, color, icon } })
        state.projects.push(p)
        refreshFeed()
        return p
      } catch (e) {
        fail(e)
        return null
      }
    })
  }
  async function updateProject(p, fields) {
    const res = await optimistic.enqueue(`project:${p.id}`, {
      patch: fields,
      captureBefore: (patch) => snapshotFields(p, patch),
      apply: (patch) => Object.assign(p, patch),
      revert: (before) => restoreFields(p, before),
      send: (batch) => api(`/api/projects/${p.id}/`, { method: 'PATCH', body: batch }),
      onSuccess: (data) => {
        Object.assign(p, data)
        refreshFeed()
      },
      onError: fail,
    })
    return res === true
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

  function createItem(kind, body) {
    return once(`${kind}:${JSON.stringify(body)}`, async () => {
      try {
        const item = await api(`/api/${KINDS[kind]}/`, { method: 'POST', body })
        state[KINDS[kind]].push(item)
        return state[KINDS[kind]].at(-1)
      } catch (e) {
        fail(e)
        return null
      }
    })
  }
  async function updateItem(kind, item, fields) {
    const res = await optimistic.enqueue(`${kind}:${item.id}`, {
      patch: fields,
      captureBefore: (patch) => snapshotFields(item, patch),
      apply: (patch) => Object.assign(item, patch),
      revert: (before) => restoreFields(item, before),
      send: (batch) => api(`/api/${KINDS[kind]}/${item.id}/`, { method: 'PATCH', body: batch }),
      onSuccess: (data) => Object.assign(item, data),
      onError: fail,
    })
    return res === true
  }
  async function removeItem(kind, item) {
    const list = state[KINDS[kind]]
    const i = list.indexOf(item)
    if (i < 0) return
    list.splice(i, 1)
    try {
      await api(`/api/${KINDS[kind]}/${item.id}/`, { method: 'DELETE' })
      if (kind === 'cycle') state.tasks.forEach((t) => t.cycle === item.id && (t.cycle = null))
      if (kind === 'module') state.tasks.forEach((t) => t.modules?.includes(item.id) && (t.modules = t.modules.filter((m) => m !== item.id)))
    } catch (e) {
      list.splice(i, 0, item)
      fail(e)
    }
  }
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
  async function archiveProject(p, hard = false) {
    const idx = state.projects.indexOf(p)
    const snapTasks = state.tasks.filter((t) => t.projectId === p.id)
    const snapLists = Object.fromEntries(['cycles', 'modules', 'pages', 'views'].map((k) => [k, state[k].filter((x) => x.project === p.id)]))
    if (idx >= 0) state.projects.splice(idx, 1)
    for (const k of ['cycles', 'modules', 'pages', 'views']) state[k] = state[k].filter((x) => x.project !== p.id)
    state.tasks = state.tasks.filter((t) => t.projectId !== p.id)
    try {
      await api(`/api/projects/${p.id}/${hard ? '?hard=1' : ''}`, { method: 'DELETE' })
      return true
    } catch (e) {
      if (idx >= 0) state.projects.splice(idx, 0, p)
      state.tasks.push(...snapTasks)
      for (const [k, items] of Object.entries(snapLists)) state[k].push(...items)
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
  const starred = (kind, id) => state.prefs.stars.includes(`${kind}:${id}`)
  function toggleStar(kind, id) {
    const key = `${kind}:${id}`
    state.prefs.stars = starred(kind, id) ? state.prefs.stars.filter((s) => s !== key) : [...state.prefs.stars, key]
  }
  function touchRecent(kind, id) {
    const key = `${kind}:${id}`
    state.prefs.recents = [{ key, at: new Date().toISOString() }, ...state.prefs.recents.filter((r) => r.key !== key)].slice(0, 20)
  }
  const doneRatio = (list) => (list.length ? list.filter((t) => t.status === 'done').length / list.length : 0)

  async function saveWorkspace(body) {
    const res = await optimistic.enqueue('workspace', {
      patch: body,
      deep: true,
      captureBefore: (patch) => {
        const snap = {}
        if ('name' in patch) snap.name = state.workspaceName
        if ('slug' in patch) snap.slug = state.slug
        if ('settings' in patch) snap.settings = snapshotFields(state.settings, patch.settings)
        return snap
      },
      apply: (patch) => {
        if ('name' in patch) state.workspaceName = patch.name
        if ('slug' in patch) state.slug = patch.slug
        if ('settings' in patch) {
          if (!state.settings || typeof state.settings !== 'object') state.settings = {}
          deepMerge(state.settings, patch.settings)
        }
      },
      revert: (before) => {
        if ('name' in before) state.workspaceName = before.name
        if ('slug' in before) state.slug = before.slug
        if ('settings' in before) restoreFields(state.settings, before.settings)
      },
      send: (batch) => api('/api/workspace/', { method: 'PATCH', body: batch }),
      onSuccess: (ws) => {
        Object.assign(state, { workspaceName: ws.name, slug: ws.slug, settings: ws.settings || {}, members: ws.members })
      },
      onError: fail,
    })
    return res === true
  }
  const renameWorkspace = (name) => saveWorkspace({ name })
  async function setMemberRole(m, role) {
    await optimistic.enqueue(`member:${m.id}`, {
      patch: { role },
      captureBefore: (patch) => snapshotFields(m, patch),
      apply: (patch) => Object.assign(m, patch),
      revert: (before) => restoreFields(m, before),
      send: (batch) => api(`/api/workspace/members/${m.id}/`, { method: 'PATCH', body: batch }),
      onSuccess: (data) => { m.role = data.role },
      onError: fail,
    })
  }
  async function removeMember(m) {
    const idx = state.members.findIndex((x) => x.id === m.id)
    if (idx < 0) return
    state.members.splice(idx, 1)
    try {
      await api(`/api/workspace/members/${m.id}/`, { method: 'DELETE' })
    } catch (e) {
      state.members.splice(idx, 0, m)
      fail(e)
    }
  }
  async function markRead(n) {
    n.read = true
    try { await api(`/api/inbox/${n.id}/`, { method: 'PATCH', body: { read: true } }) } catch { }
  }
  async function markAllRead() {
    state.inbox.forEach((n) => (n.read = true))
    try { await api('/api/inbox/read-all/', { method: 'POST' }) } catch { }
  }
  const taskActivity = async (id) => (await api(`/api/activity/?task=${id}`)).map(fromActivity)
  const taskComments = (id) => api(`/api/tasks/${id}/comments/`)
  function createDoc(fields = {}) {
    const now = new Date().toISOString()
    const d = reactive({ id: `doc-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, title: 'Sem título', body: '', createdAt: now, updatedAt: now, ...fields })
    state.docs.unshift(d)
    return d
  }
  const progress = (projectId) => {
    const list = tasksOf(projectId)
    return list.length ? list.filter((t) => t.status === 'done').length / list.length : 0
  }
  const projectMembers = (pid) => api(`/api/projects/${pid}/members/`)
  const inviteToProject = (pid, email, permission) => api(`/api/projects/${pid}/invitations/`, { method: 'POST', body: { email, permission } })
  const cancelInvite = (pid, inviteId) => api(`/api/projects/${pid}/invitations/${inviteId}/`, { method: 'DELETE' })
  const setProjectPermission = (pid, userId, permission) => api(`/api/projects/${pid}/members/${userId}/`, { method: 'PATCH', body: { permission } })
  async function setProjectRole(pid, userId, title) {
    const p = project(pid)
    let latestTitle = title
    const res = await optimistic.enqueue(`proj-role:${pid}:${userId}`, {
      patch: { title },
      captureBefore: () => ({ title: p?.titles?.[userId] ?? '' }),
      apply: (patch) => {
        if (!p) return
        const titles = { ...(p.titles || {}) }
        if (patch.title) titles[userId] = patch.title
        else delete titles[userId]
        p.titles = titles
      },
      revert: (before) => {
        if (!p) return
        const titles = { ...(p.titles || {}) }
        if (before.title) titles[userId] = before.title
        else delete titles[userId]
        p.titles = titles
      },
      send: (batch) => api(`/api/projects/${pid}/members/${userId}/`, { method: 'PATCH', body: batch }),
      onSuccess: (data) => {
        latestTitle = data.title
        if (!p) return
        const titles = { ...(p.titles || {}) }
        if (data.title) titles[userId] = data.title
        else delete titles[userId]
        p.titles = titles
      },
    })
    if (res !== true) throw new Error(typeof res === 'string' ? res : 'Não foi possível salvar o cargo.')
    return latestTitle
  }
  const rolesOf = (pid) => {
    const groups = {}
    for (const [id, title] of Object.entries(project(pid)?.titles || {})) (groups[title] ||= []).push(id)
    return Object.entries(groups).map(([title, ids]) => ({ title, ids })).sort((a, b) => a.title.localeCompare(b.title))
  }
  async function removeProjectMember(pid, userId) {
    const p = project(pid)
    const prevMembers = p?.members ? [...p.members] : null
    const prevProjIdx = userId === state.me ? state.projects.findIndex((x) => x.id === pid) : -1
    const prevProj = prevProjIdx >= 0 ? state.projects[prevProjIdx] : null
    const prevTasks = userId === state.me ? state.tasks.filter((t) => !t.draft && t.projectId === pid) : []
    if (userId === state.me) {
      state.projects = state.projects.filter((x) => x.id !== pid)
      state.tasks = state.tasks.filter((t) => t.draft || t.projectId !== pid)
    } else if (p?.members) {
      p.members = p.members.filter((id) => id !== userId)
    }
    try {
      await api(`/api/projects/${pid}/members/${userId}/`, { method: 'DELETE' })
    } catch (e) {
      if (userId === state.me && prevProj) {
        state.projects.splice(prevProjIdx, 0, prevProj)
        state.tasks.push(...prevTasks)
      } else if (p && prevMembers) {
        p.members = prevMembers
      }
      throw e
    }
  }
  const inviteInfo = (token) => api(`/api/invites/${encodeURIComponent(token)}/`)
  async function acceptInvite(token) {
    const res = await api(`/api/invites/${encodeURIComponent(token)}/accept/`, { method: 'POST' })
    state.invites = state.invites.filter((i) => i.token !== token)
    state.loaded = false
    await load()
    return res
  }
  async function declineInvite(token) {
    await api(`/api/invites/${encodeURIComponent(token)}/decline/`, { method: 'POST' })
    state.invites = state.invites.filter((i) => i.token !== token)
  }
  // peer = id de quem participa do projeto: conversa individual; vazio = chat geral
  const projectMessages = (pid, after, peer) => api(`/api/projects/${pid}/messages/?${new URLSearchParams({ ...(after && { after }), ...(peer && { with: peer }) })}`)
  const sendProjectMessage = (pid, body, peer) => api(`/api/projects/${pid}/messages/`, { method: 'POST', body: peer ? { body, to: peer } : { body } })

  function clearLocal() {
    state.tasks = state.tasks.filter((t) => !t.draft)
    state.docs = localDefaults().docs
    schedulePersist()
  }

  return {
    state, STATUSES, PRIORITIES, project, member, status, priority, code, tasksOf, mine, drafts, isOverdue, unread,
    load, refreshFeed, createTask, taskSaved, updateTask, removeTask, createProject, renameWorkspace, saveWorkspace, setMemberRole, removeMember, markRead, markAllRead, taskActivity, taskComments, createDoc, progress, clearLocal,
    updateProject, postUpdate, projectActivity, createItem, updateItem, removeItem, archivedProjects, trashedTasks, restoreProject, archiveProject, restoreTask,
    starred, toggleStar, doneRatio, touchRecent, peopleOf,
    projectMembers, inviteToProject, cancelInvite, setProjectPermission, setProjectRole, rolesOf, removeProjectMember, inviteInfo, acceptInvite, declineInvite,
    projectMessages, sendProjectMessage,
    today: () => day(0), day,
  }
}
