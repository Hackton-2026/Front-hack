import { computed, reactive, watch } from 'vue'

// Dados da área logada no formato das tabelas do backend (tasks/models.py), guardados no navegador.
// shortcut: só no front; trocar load/save por chamadas à API quando os endpoints existirem
const KEY = 'novexo:workspace:v1'

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
export const ME = 'me'

const uid = () => Math.random().toString(36).slice(2, 9)
const day = (offset) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

// Dados de exemplo para a área não abrir vazia (marcados com example: true)
function seed() {
  const members = [
    { id: ME, name: 'Você', color: '#e56515' },
    { id: 'ana', name: 'Ana Souza', color: '#fba45c' },
    { id: 'caio', name: 'Caio Lima', color: '#cdcdcb' },
    { id: 'bia', name: 'Bia Rocha', color: '#f2c46d' },
  ]
  const projects = [
    { id: 'p1', name: 'Lançamento do app', prefix: 'APP', color: '#e56515', example: true },
    { id: 'p2', name: 'Site institucional', prefix: 'SIT', color: '#fba45c', example: true },
    { id: 'p3', name: 'Marketing Q4', prefix: 'MKT', color: '#919599', example: true },
  ]
  const t = (projectId, title, status, priority, assignees, due, extra = {}) => ({
    id: uid(), projectId, title, status, priority, assignees, due, tags: [], description: '', checklist: [],
    draft: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), example: true, ...extra,
  })
  const tasks = [
    t('p1', 'Definir o escopo do MVP', 'done', 'high', [ME], day(-6), { tags: ['produto'] }),
    t('p1', 'Tela de login e cadastro', 'done', 'normal', ['ana'], day(-3), { tags: ['front'] }),
    t('p1', 'Quadro kanban com arrastar e soltar', 'doing', 'urgent', [ME, 'caio'], day(1), {
      tags: ['front'], description: 'Arrastar cards entre colunas e salvar a nova ordem.',
      checklist: [{ id: uid(), title: 'Colunas por status', done: true }, { id: uid(), title: 'Arrastar entre colunas', done: false }, { id: uid(), title: 'Animação ao soltar', done: false }],
    }),
    t('p1', 'Notificações de prazo', 'review', 'high', ['bia'], day(0), { tags: ['back'] }),
    t('p1', 'Publicar na loja de apps', 'todo', 'normal', [ME], day(9)),
    t('p1', 'Corrigir bug no upload de anexos', 'todo', 'urgent', ['caio'], day(-1), { tags: ['bug'] }),
    t('p2', 'Nova página de preços', 'doing', 'normal', [ME], day(3), { tags: ['site'] }),
    t('p2', 'Revisar textos da home', 'todo', 'low', ['ana'], day(5)),
    t('p2', 'Otimizar imagens do hero', 'done', 'low', [ME], day(-2)),
    t('p3', 'Campanha de Black Friday', 'todo', 'high', ['bia', ME], day(12), { tags: ['campanha'] }),
    t('p3', 'Calendário de posts de novembro', 'doing', 'normal', ['ana'], day(2)),
    t('p3', 'Relatório de resultados de outubro', 'todo', 'normal', [ME], null),
    t(null, 'Ideia: modo foco com timer', 'todo', '', [ME], null, { draft: true }),
  ]
  tasks.forEach((task, i) => (task.number = i + 1))
  const docs = [
    { id: uid(), title: 'Como o time trabalha', body: 'Toda tarefa tem um responsável e um prazo.\nO que está em revisão é aprovado em até um dia útil.', updatedAt: new Date().toISOString(), example: true },
    { id: uid(), title: 'Ata da reunião de segunda', body: '- Priorizar o kanban\n- Bia cuida das notificações\n- Próxima revisão na sexta', updatedAt: new Date().toISOString(), example: true },
  ]
  return { members, projects, tasks, docs, activity: [], seq: tasks.length, workspaceName: 'Área de trabalho', prefs: { weekStart: 0, theme: 'dark', density: 'comfortable', notify: { assigned: true, mention: true, due: true, digest: false } } }
}

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY))
    if (data?.tasks) return data
  } catch { /* sem dados salvos: usa os exemplos */ }
  return seed()
}

const state = reactive(load())
watch(state, (v) => {
  try { localStorage.setItem(KEY, JSON.stringify(v)) } catch { /* modo privado: fica só na memória */ }
}, { deep: true })

function log(task, text) {
  state.activity.unshift({ id: uid(), taskId: task?.id || null, text, at: new Date().toISOString(), read: false })
  state.activity.splice(80)
}

export function useWorkspace() {
  const project = (id) => state.projects.find((p) => p.id === id)
  const member = (id) => state.members.find((m) => m.id === id)
  const status = (id) => STATUSES.find((s) => s.id === id)
  const priority = (id) => PRIORITIES.find((p) => p.id === id)
  const code = (task) => `${project(task.projectId)?.prefix || 'NVX'}-${task.number}`
  const tasksOf = (projectId) => state.tasks.filter((t) => t.projectId === projectId && !t.draft)
  const mine = computed(() => state.tasks.filter((t) => !t.draft && t.assignees.includes(ME)))
  const drafts = computed(() => state.tasks.filter((t) => t.draft))
  const isOverdue = (t) => t.due && t.status !== 'done' && t.due < day(0)
  const unread = computed(() => state.activity.filter((a) => !a.read).length)

  function createTask(fields) {
    state.seq += 1
    const task = {
      id: uid(), number: state.seq, projectId: null, title: '', status: 'todo', priority: '', assignees: [ME], due: null, tags: [],
      description: '', checklist: [], draft: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...fields,
    }
    state.tasks.push(task)
    log(task, `Você criou ${task.draft ? 'o rascunho' : code(task)} “${task.title}”`)
    return task
  }
  function updateTask(task, fields) {
    if (fields.status && fields.status !== task.status) {
      log(task, `Você moveu ${code(task)} de ${status(task.status).name} para ${status(fields.status).name}`)
    }
    if (fields.draft === false && task.draft) log(task, `Você publicou “${task.title}” como ${code({ ...task, ...fields })}`)
    Object.assign(task, fields, { updatedAt: new Date().toISOString() })
  }
  function removeTask(task) {
    state.tasks.splice(state.tasks.indexOf(task), 1)
    log(null, `Você apagou “${task.title}”`)
  }
  function createProject(name, color = '#e56515') {
    const letters = name.toUpperCase().replace(/[^A-Z]/g, '')
    const p = { id: uid(), name, prefix: letters.slice(0, 3) || 'NVX', color }
    state.projects.push(p)
    log(null, `Você criou o projeto ${name}`)
    return p
  }
  function createDoc() {
    const d = { id: uid(), title: 'Sem título', body: '', updatedAt: new Date().toISOString() }
    state.docs.unshift(d)
    return d
  }
  const progress = (projectId) => {
    const list = tasksOf(projectId)
    return list.length ? list.filter((t) => t.status === 'done').length / list.length : 0
  }
  const reset = () => Object.assign(state, seed())

  return {
    state, STATUSES, PRIORITIES, ME, project, member, status, priority, code, tasksOf, mine, drafts, isOverdue, unread,
    createTask, updateTask, removeTask, createProject, createDoc, progress, reset, today: () => day(0), day,
  }
}
