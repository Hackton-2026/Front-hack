<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { EASE, DUR, gsap, prefersReducedMotion } from '../utils/motion'
import { parseCsv, toCsv } from '../utils/csv'
import { API_URL } from '../config'
import { api, toFormData } from '../services/api'
import { compressImage } from '../utils/image'
import { disablePush, enablePush, pushConfigured, pushSupported, savedToken } from '../services/push'
import { useAuth } from '../composables/useAuth'
import { useWorkspace } from '../composables/useWorkspace'
import GooeyButton from '../components/GooeyButton.vue'
import SettingsList from '../components/app/SettingsList.vue'
import WhatsAppSettings from '../components/app/WhatsAppSettings.vue'
import AppSelect from '../components/app/AppSelect.vue'
import AppIcon from '../components/app/AppIcon.vue'
import AppDateInput from '../components/app/AppDateInput.vue'
import AppColorPicker from '../components/app/AppColorPicker.vue'
import IntegrationsPanel from '../components/app/IntegrationsPanel.vue'
import DeleteProjectDialog from '../components/app/DeleteProjectDialog.vue'

const GROUPS = [
  { label: 'Minha conta', icon: 'user', tabs: [['profile', 'Perfil'], ['prefs', 'Preferências'], ['notify', 'Notificações'], ['whatsapp', 'WhatsApp']] },
  { label: 'Administração', icon: 'settings', tabs: [['general', 'Geral'], ['members', 'Pessoas'], ['billing', 'Planos e cobrança'], ['import', 'Importar'], ['export', 'Exportar'], ['worklogs', 'Registros de horas'], ['identity', 'Identidade'], ['governance', 'Governança'], ['schedule', 'Cronograma de trabalho']] },
  { label: 'Produtos', icon: 'ai', tabs: [['wiki', 'Documentos'], ['ai', 'Novexo IA']] },
  { label: 'Recursos', icon: 'layers', tabs: [['projects', 'Projetos'], ['teams', 'Times'], ['initiatives', 'Iniciativas'], ['customers', 'Clientes'], ['templates', 'Modelos'], ['tags', 'Etiquetas'], ['integrations', 'Integrações'], ['releases', 'Lançamentos']] },
  { label: 'Desenvolvedores', icon: 'bolt', tabs: [['webhooks', 'Webhooks'], ['tokens', 'Tokens de API']] },
]
const TITLES = Object.fromEntries(GROUPS.flatMap((g) => g.tabs))
const THEMES = [['light', 'Claro'], ['dark', 'Escuro'], ['auto', 'Auto']]
const ACCENTS = [
  ['Laranja', '#e56515'], ['Roxo', '#7b68ee'], ['Azul', '#3b82f6'], ['Rosa', '#ec4899'], ['Violeta', '#a855f7'],
  ['Rubi', '#ef4444'], ['Azul-petróleo', '#0d9488'], ['Bronze', '#b7791f'], ['Menta', '#34d399'],
]
const PREF_TOGGLES = [
  ['contrast', 'Alto contraste', 'Texto e bordas mais fortes.'],
  ['calm', 'Modo de desempenho', 'Desliga animações e transições.'],
  ['showIds', 'Mostrar IDs das tarefas', 'Código (ex.: APP-3) nas listas e no quadro.'],
  ['handCursor', 'Cursor de mão', 'Mãozinha ao passar em botões e links.'],
  ['shortcuts', 'Atalhos do teclado', 'Ctrl K para buscar, C/N para nova tarefa e G + tecla para navegar.'],
  ['assignMe', 'Me atribuir novas tarefas', 'Nova tarefa já vem com você como responsável.'],
  ['hideAi', 'Ocultar recursos de IA', 'Esconde a aba IA, atalhos e sugestões de IA só para você.'],
]
const NOTIFY = [
  ['assigned', 'Me atribuírem uma tarefa'], ['mention', 'Me mencionarem'], ['status', 'O status de uma tarefa minha mudar'],
  ['done', 'Uma tarefa minha for concluída'], ['due', 'Prazo chegando ou tarefa parada'], ['digest', 'Resumo da semana por e-mail'],
  ['followOwn', 'Seguir as tarefas que eu criar ou editar'],
]
const VIEWS = [['list', 'Lista'], ['board', 'Kanban'], ['calendar', 'Calendário'], ['gantt', 'Gantt']]
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const FEATURES = [['cycles', 'Ciclos'], ['modules', 'Módulos'], ['pages', 'Documentos do projeto']]

const opts = (pairs) => pairs.map(([value, label]) => ({ value, label }))
const LISTS = {
  teams: { path: '/api/teams/', noun: 'time', admin: true, fields: [
    { key: 'name', label: 'Nome', required: true },
    { key: 'color', label: 'Cor', type: 'select', options: ACCENTS.map(([label, value]) => ({ value, label })) },
    { key: 'members', label: 'Membros', type: 'members' },
  ] },
  initiatives: { path: '/api/items/', kind: 'initiative', noun: 'iniciativa', fields: [
    { key: 'name', label: 'Nome', required: true },
    { key: 'status', label: 'Situação', type: 'select', data: true, options: opts([['planned', 'Planejada'], ['active', 'Em andamento'], ['done', 'Concluída']]) },
    { key: 'target', label: 'Meta para', type: 'date', data: true },
    { key: 'description', label: 'Descrição', type: 'textarea', data: true },
  ] },
  customers: { path: '/api/items/', kind: 'customer', noun: 'cliente', fields: [
    { key: 'name', label: 'Nome', required: true },
    { key: 'email', label: 'E-mail', type: 'email', data: true },
    { key: 'website', label: 'Site', type: 'url', data: true },
    { key: 'stage', label: 'Etapa', type: 'select', data: true, options: opts([['lead', 'Lead'], ['active', 'Ativo'], ['churned', 'Inativo']]) },
  ] },
  templates: { path: '/api/items/', kind: 'template', noun: 'modelo', fields: [
    { key: 'name', label: 'Título da tarefa', required: true },
    { key: 'priority', label: 'Prioridade', type: 'select', data: true, options: opts([['urgent', 'Urgente'], ['high', 'Alta'], ['normal', 'Normal'], ['low', 'Baixa']]) },
    { key: 'description', label: 'Descrição', type: 'textarea', data: true },
  ] },
  releases: { path: '/api/items/', kind: 'release', noun: 'lançamento', fields: [
    { key: 'name', label: 'Versão', required: true },
    { key: 'date', label: 'Data', type: 'date', data: true },
    { key: 'status', label: 'Situação', type: 'select', data: true, options: opts([['planned', 'Planejado'], ['released', 'Lançado']]) },
    { key: 'notes', label: 'Notas', type: 'textarea', data: true },
  ] },
  worklogs: { path: '/api/worklogs/', noun: 'registro', editable: false, fields: [
    { key: 'task', label: 'Tarefa', type: 'task', required: true },
    { key: 'minutes', label: 'Horas', type: 'hours', required: true },
    { key: 'date', label: 'Dia', type: 'date' },
    { key: 'note', label: 'Nota' },
  ] },
  webhooks: { path: '/api/webhooks/', noun: 'webhook', admin: true, fields: [
    { key: 'url', label: 'URL', type: 'url', required: true },
    { key: 'events', label: 'Eventos', type: 'multi', options: opts([['task', 'Tarefas'], ['project', 'Projetos'], ['comment', 'Comentários'], ['member', 'Membros']]) },
    { key: 'is_active', label: 'Ativo', type: 'check' },
    { key: 'secret', label: 'Segredo', type: 'secret' },
  ] },
  tokens: { path: '/api/tokens/', noun: 'token', editable: false, fields: [
    { key: 'name', label: 'Nome', required: true },
    { key: 'expires_at', label: 'Expira em', type: 'date' },
    { key: 'prefix', label: 'Começa com', type: 'readonly' },
  ] },
}

const { user, updateMe, logout } = useAuth()
const { state, PRIORITIES, STATUSES, project, member, saveWorkspace, updateProject, archiveProject, createTask, updateTask, clearLocal, load } = useWorkspace()
const route = useRoute()
const tab = ref(route.query.tab || 'profile')
watch(() => route.query.tab, (t) => { if (t) tab.value = t })
const activeGroup = computed(() => GROUPS.find((g) => g.tabs.some(([id]) => id === tab.value))?.label || 'Ajustes')
const panel = ref(null)
const panelBody = ref(null)
const status = ref('')
const deleting = ref(null)
const confirm2 = ref('')
const isAdmin = computed(() => state.isAdmin)
const myRole = computed(() => state.members.find((m) => m.id === state.me)?.role)
const canWrite = computed(() => !['guest', 'limited'].includes(myRole.value))

watch(tab, async (t) => {
  status.value = ''
  confirm2.value = ''
  if (t === 'billing' && !billing.value) loadBilling()
  if (t === 'notify') loadDevices()
  await nextTick()
  if (panelBody.value) panelBody.value.scrollTop = 0
  if (!prefersReducedMotion()) gsap.fromTo(panel.value, { y: 6, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: DUR.press, ease: EASE.soft })
})
const twice = (key, run) => {
  if (confirm2.value !== key) { confirm2.value = key; return }
  confirm2.value = ''
  run()
}

const section = (name, defaults) => computed(() => ({ ...defaults, ...(state.settings[name] || {}) }))
const general = section('general', { size: '', timezone: 'America/Sao_Paulo' })
const governance = section('governance', { createProjects: 'member', membersInvite: true, guestsSeeAll: false, deleteTasks: 'admin', publicPages: false })
const products = section('products', { wiki: true, ai: true, aiContext: true, wikiPublic: false })
const identity = section('identity', { googleOnly: false, autoJoin: false, domains: [] })
const schedule = section('schedule', { days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00', holidays: [] })
const setSetting = (name, key, value) => saveWorkspace({ settings: { [name]: { [key]: value } } })
const SECTION_TOGGLES = {
  governance: [
    ['publicPages', 'Permitir páginas públicas', 'Documentos e documentos do projeto com link aberto.'],
  ],
  identity: [
    ['googleOnly', 'Exigir login com Google', 'Desliga o login com senha para este workspace.'],
  ],
}

const profile = reactive({ first_name: user.value?.first_name || '', email: user.value?.email || '', current_password: '' })
// trocar o e-mail pede a senha atual no servidor
const emailChanged = computed(() => !!user.value && profile.email.trim().toLowerCase() !== (user.value.email || '').toLowerCase())
const savingProfile = ref(false)
async function saveProfile() {
  if (!user.value) { status.value = 'Entre na sua conta para editar o perfil.'; return }
  savingProfile.value = true
  try {
    await updateMe({ first_name: profile.first_name.trim(), email: profile.email.trim(), ...(emailChanged.value && { current_password: profile.current_password }) })
    profile.current_password = ''
    status.value = 'Perfil salvo.'
  } catch (e) {
    status.value = e.message
  } finally {
    savingProfile.value = false
  }
}
const photoInput = ref(null)
const photoBusy = ref(false)
const initials = computed(() => (user.value?.first_name || user.value?.username || '?').slice(0, 2).toUpperCase())
async function setPhoto(file) {
  if (file && !file.type.startsWith('image/')) { status.value = 'Escolha um arquivo de imagem (JPG, PNG ou WebP).'; return }
  photoBusy.value = true
  try {
    await updateMe(toFormData({ avatar: file ? await compressImage(file, 512) : null }))
    load()
    status.value = file ? 'Foto atualizada.' : 'Foto removida.'
  } catch (e) {
    status.value = e.message
  } finally {
    photoBusy.value = false
  }
}

const permission = ref(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported')
const enableBrowser = async () => (permission.value = await Notification.requestPermission())
const testBrowser = () => new Notification('Novexo', { body: 'Notificação de teste: está tudo certo por aqui.' })

const push = reactive({ on: !!savedToken(), server: null, devices: [], busy: false, msg: '' })
async function loadDevices() {
  try { Object.assign(push, (({ enabled, devices }) => ({ server: enabled, devices }))(await api('/api/devices/'))) } catch { }
}
async function pushAction(fn, done) {
  push.busy = true
  push.msg = ''
  try {
    await fn()
    push.msg = done
    await loadDevices()
  } catch (e) {
    push.msg = e.message
  } finally {
    push.busy = false
    push.on = !!savedToken()
  }
}
const turnPushOn = () => pushAction(enablePush, 'Ativado neste aparelho.')
const turnPushOff = () => pushAction(disablePush, 'Desativado neste aparelho.')
const testPush = () => pushAction(() => api('/api/devices/test/', { method: 'POST' }), 'Teste enviado. Deve chegar em alguns segundos.')

const slugInput = ref('')
watch(() => state.slug, (s) => (slugInput.value = s), { immediate: true })
const origin = location.origin
const mcpEndpoint = `${(API_URL || origin).replace(/\/$/, '')}/api/mcp`
const mcpConfigJson = computed(() => JSON.stringify({
  mcpServers: {
    novexo: {
      url: mcpEndpoint,
      headers: { Authorization: 'Bearer nvx_SEU_TOKEN_AQUI' },
    },
  },
}, null, 2))
async function copyMcpConfig() {
  try {
    await navigator.clipboard.writeText(mcpConfigJson.value)
    status.value = 'Configuração MCP copiada.'
  } catch {
    status.value = 'Não foi possível copiar.'
  }
}

const billing = ref(null)
const payments = ref([])
const paymentsError = ref('')
const yearly = ref(true)
async function loadBilling() {
  try {
    // a lista vazia por erro parecia "nenhum pagamento", justo onde o checkout manda procurar o recibo
    const [b, list] = await Promise.all([api('/api/billing/'), api('/api/payments/').catch((e) => { paymentsError.value = `Não deu para carregar os pagamentos: ${e.message}`; return [] })])
    billing.value = b
    payments.value = list
  } catch (e) { status.value = e.message }
}
if (tab.value === 'billing') loadBilling()
if (tab.value === 'notify') loadDevices()
const price = (cents) => (cents == null ? 'Sob consulta' : cents === 0 ? 'Grátis' : `R$ ${(cents / 100).toLocaleString('pt-BR')}/membro/mês`)
const planPrice = (p) => (yearly.value && p.price_year_cents ? price(p.price_year_cents) : price(p.price_month_cents))
const SUB_STATUS = { active: 'Ativa', trialing: 'Em teste', past_due: 'Pagamento pendente', canceled: 'Cancelada' }
const current = computed(() => billing.value?.subscription)
const isCurrent = (p) => current.value?.plan === p.code && current.value?.status !== 'canceled'
const checkoutLink = (p) => `/checkout?plano=${p.code}&ciclo=${yearly.value ? 'anual' : 'mensal'}`
const brl = (cents) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const PAY_STATUS = { approved: 'ok', pending: 'wait', rejected: 'bad', expired: 'bad', canceled: 'bad' }

const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
const dailyHours = computed(() => Math.max(0, (toMin(schedule.value.end) - toMin(schedule.value.start)) / 60))
const fmtHours = (h) => `${Number.isInteger(h) ? h : h.toFixed(1)}h`
const holiday = reactive({ date: '', name: '' })
const toggleDay = (d) => setSetting('schedule', 'days', schedule.value.days.includes(d) ? schedule.value.days.filter((x) => x !== d) : [...schedule.value.days, d].sort())
function addHoliday() {
  if (!holiday.date) return
  setSetting('schedule', 'holidays', [...schedule.value.holidays, { date: holiday.date, name: holiday.name.trim() || 'Folga' }].sort((a, b) => a.date.localeCompare(b.date)))
  Object.assign(holiday, { date: '', name: '' })
}
const fmtDate = (d) => new Date(`${String(d).slice(0, 10)}T12:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

const newDomain = ref('')
function addDomain() {
  const d = newDomain.value.trim().toLowerCase().replace(/^@/, '')
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d)) { status.value = 'Domínio inválido (ex.: empresa.com.br).'; return }
  if (!identity.value.domains.includes(d)) setSetting('identity', 'domains', [...identity.value.domains, d])
  newDomain.value = ''
}

const projectId = ref(null)
const proj = computed(() => project(projectId.value) || state.projects[0])
const setFeature = (key) => (state.prefs.features[key] = !state.prefs.features[key])

const tags = computed(() => {
  const counts = {}
  state.tasks.filter((t) => !t.draft).forEach((t) => t.tags.forEach((tag) => (counts[tag] = (counts[tag] || 0) + 1)))
  return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b))
})
function renameTag(from, e) {
  const to = e.target.value.trim().toLowerCase()
  if (!to || to === from) { e.target.value = from; return }
  state.tasks.filter((t) => !t.draft && t.tags.includes(from)).forEach((t) => updateTask(t, { tags: [...new Set(t.tags.map((x) => (x === from ? to : x)))] }))
}
const removeTag = (tag) => state.tasks.filter((t) => !t.draft && t.tags.includes(tag)).forEach((t) => updateTask(t, { tags: t.tags.filter((x) => x !== tag) }))

function download(name, text, type) {
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([text], { type })), download: name })
  a.click()
  URL.revokeObjectURL(a.href)
}
const stamp = () => new Date().toISOString().slice(0, 10)
function exportJson() {
  const { workspaceName: name, slug, settings, members, projects, cycles, modules, pages, views, docs } = state
  download(`novexo-${slug || 'workspace'}-${stamp()}.json`, JSON.stringify({ name, slug, settings, members, projects, tasks: state.tasks.filter((t) => !t.draft), cycles, modules, pages, views, docs }, null, 2), 'application/json')
  status.value = 'Backup baixado.'
}
function exportCsv() {
  const rows = state.tasks.filter((t) => !t.draft).map((t) => [
    t.code, t.title, project(t.projectId)?.name, STATUSES.find((s) => s.id === t.status)?.name, PRIORITIES.find((p) => p.id === t.priority)?.name,
    t.assignees.map((a) => member(a)?.name).join(', '), t.due, t.tags.join(', '),
  ])
  download(`novexo-tarefas-${stamp()}.csv`, toCsv([['ID', 'Título', 'Projeto', 'Status', 'Prioridade', 'Responsáveis', 'Prazo', 'Etiquetas'], ...rows]), 'text/csv')
  status.value = 'Planilha baixada.'
}

const importProject = ref('')
const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
function mapStatus(raw) {
  const v = norm(raw)
  if (!v) return 'todo'
  const direct = STATUSES.find((x) => norm(x.name) === v || x.id === v)
  if (direct) return direct.id
  if (/done|conclu|feit|complet|closed|resolv|entreg/.test(v)) return 'done'
  if (/revis|review|qa|aprov|homolog/.test(v)) return 'review'
  if (/doing|progress|andamento|fazendo|active|working|exec/.test(v)) return 'doing'
  return 'todo'
}
function mapPriority(raw) {
  const v = norm(raw)
  if (!v) return ''
  const direct = PRIORITIES.find((x) => norm(x.name) === v || x.id === v)
  if (direct) return direct.id
  if (/urgen|crit|p1|highest/.test(v)) return 'urgent'
  if (/high|alta|p2/.test(v)) return 'high'
  if (/norm|med|p3/.test(v)) return 'normal'
  if (/low|baix|p4|lowest/.test(v)) return 'low'
  return ''
}
const toDate = (v) => (/^\d{2}\/\d{2}\/\d{4}$/.test(v) ? v.split('/').reverse().join('-') : /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null)

async function onImport(e) {
  const file = e.target.files[0]
  e.target.value = ''
  if (!file) return
  const pid = importProject.value || state.projects[0]?.id
  if (!pid) { status.value = 'Crie um projeto antes de importar.'; return }

  const rawText = await file.text()
  // Trello JSON export support
  if (file.name.toLowerCase().endsWith('.json') || rawText.trim().startsWith('{')) {
    try {
      const json = JSON.parse(rawText)
      if (Array.isArray(json.cards)) {
        const listMap = new Map((json.lists || []).map((l) => [l.id, l.name]))
        const checklistMap = new Map((json.checklists || []).map((cl) => [cl.id, cl.checkItems || []]))
        let n = 0
        for (const card of json.cards) {
          if (card.closed || !card.name?.trim()) continue
          const listName = listMap.get(card.idList) || ''
          const tags = (card.labels || []).map((lb) => (lb.name || lb.color || '').trim().toLowerCase()).filter(Boolean)
          const checklist = (card.idChecklists || [])
            .flatMap((cid) => checklistMap.get(cid) || [])
            .map((ci) => ({ title: String(ci.name || '').slice(0, 200), done: ci.state === 'complete' }))
            .filter((ci) => ci.title)
          createTask({
            projectId: pid,
            title: card.name.trim().slice(0, 200),
            description: String(card.desc || '').slice(0, 4000),
            status: mapStatus(listName),
            due: card.due ? toDate(String(card.due)) : null,
            tags: [...new Set(tags)].slice(0, 10),
            checklist,
          })
          n++
        }
        status.value = `${n} cartões do Trello importados para ${project(pid)?.name}.`
        return
      }
      if (Array.isArray(json.tasks)) {
        let n = 0
        for (const t of json.tasks) {
          if (!t.title?.trim()) continue
          createTask({
            projectId: pid,
            title: String(t.title).trim().slice(0, 200),
            description: String(t.description || ''),
            status: mapStatus(t.status),
            priority: mapPriority(t.priority),
            due: t.due ? toDate(String(t.due)) : null,
            tags: Array.isArray(t.tags) ? t.tags : [],
          })
          n++
        }
        status.value = `${n} tarefas JSON importadas para ${project(pid)?.name}.`
        return
      }
      status.value = 'JSON não reconhecido. Envie um export de quadro do Trello ou backup do Novexo.'
      return
    } catch {
      status.value = 'Arquivo JSON inválido.'
      return
    }
  }

  // CSV importer (Asana, ClickUp, Notion, Jira, Excel, Novexo)
  const [header, ...lines] = parseCsv(rawText)
  if (!header?.length) { status.value = 'Planilha vazia.'; return }
  const col = (...names) => header.findIndex((h) => names.includes(norm(h)))
  const c = {
    title: col('titulo', 'title', 'nome', 'name', 'task name', 'summary', 'assunto', 'tarefa', 'card name'),
    description: col('descricao', 'description', 'notes', 'notas', 'detalhes', 'body'),
    status: col('status', 'situacao', 'section/column', 'section', 'column', 'coluna', 'list', 'lista', 'stage', 'etapa'),
    priority: col('prioridade', 'priority', 'urgencia'),
    due: col('prazo', 'due', 'due date', 'data', 'data de entrega', 'deadline', 'vencimento'),
    tags: col('etiquetas', 'tags', 'labels', 'marcadores'),
  }
  if (c.title < 0) { status.value = 'A planilha precisa de uma coluna "Título" (ou "Name" / "Task Name" / "Summary").'; return }
  let n = 0
  for (const r of lines) {
    const title = r[c.title]?.trim()
    if (!title) continue
    createTask({
      projectId: pid,
      title: title.slice(0, 200),
      description: c.description >= 0 ? (r[c.description]?.trim() || '') : '',
      status: c.status >= 0 ? mapStatus(r[c.status] || '') : 'todo',
      priority: c.priority >= 0 ? mapPriority(r[c.priority] || '') : '',
      due: c.due >= 0 ? toDate(r[c.due]?.trim() || '') : null,
      tags: c.tags >= 0 ? (r[c.tags] || '').split(/[,;]/).map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
    })
    n++
  }
  status.value = `${n} tarefas importadas para ${project(pid)?.name}.`
}
</script>

<template>
  <div class="page">
    <header class="page__head">
      <h1>Ajustes</h1>
      <span class="page__sub">Gerencie sua conta, preferências, planos e configurações do workspace.</span>
    </header>
    <div class="layout">
      <nav class="tabs" aria-label="Seções dos ajustes">
        <div v-for="g in GROUPS" :key="g.label" class="tabs__group">
          <div class="tabs__label">
            <AppIcon :name="g.icon" :size="13" />
            <span>{{ g.label }}</span>
          </div>
          <div class="tabs__list">
            <button v-for="[id, label] in g.tabs" :key="id" type="button" :aria-current="tab === id ? 'page' : undefined" @click="tab = id">{{ label }}</button>
          </div>
        </div>
      </nav>

      <section ref="panel" class="panel">
        <div class="panel__head">
          <span class="panel__eyebrow">{{ activeGroup }}</span>
          <h2>{{ TITLES[tab] }}</h2>
        </div>
        <div ref="panelBody" class="panel__body">
        <p v-if="!isAdmin && ['general', 'billing', 'identity', 'governance', 'schedule', 'wiki', 'ai', 'webhooks'].includes(tab)" class="hint">Só administradores mudam esta seção.</p>

        <template v-if="tab === 'profile'">
          <form class="form" @submit.prevent="saveProfile">
            <div v-if="user" class="photo">
              <span class="photo__av" :class="{ busy: photoBusy }"><img referrerpolicy="no-referrer" v-if="user.avatar" :src="user.avatar" alt="Sua foto de perfil" /><template v-else>{{ initials }}</template></span>
              <div class="photo__txt">
                <strong>Foto de perfil</strong>
                <small>Aparece nas tarefas, no chat e para quem participa dos seus projetos. JPG, PNG ou WebP.</small>
                <span class="photo__btns">
                  <button type="button" class="pg-btn" :disabled="photoBusy" @click="photoInput.click()"><ArcLoader v-if="photoBusy" />{{ photoBusy ? 'Enviando…' : user.avatar ? 'Trocar foto' : 'Enviar foto' }}</button>
                  <button v-if="user.avatar" type="button" class="link" :disabled="photoBusy" @click="setPhoto(null)">Remover</button>
                </span>
              </div>
              <input ref="photoInput" type="file" accept="image/*" hidden @change="setPhoto($event.target.files[0]); $event.target.value = ''" />
            </div>
            <div class="cols">
              <label>Nome <input v-model="profile.first_name" autocomplete="given-name" /></label>
              <label>E-mail <input v-model="profile.email" type="email" autocomplete="email" /></label>
              <label v-if="emailChanged">Senha atual <input v-model="profile.current_password" type="password" autocomplete="current-password" /></label>
            </div>
            <p class="hint">{{ user ? `Usuário: ${user.username}` : 'Você está como visitante. Entre para salvar o perfil.' }}</p>
            <div class="actions">
              <GooeyButton type="submit" variant="primary" :disabled="savingProfile"><ArcLoader v-if="savingProfile" />{{ savingProfile ? 'Salvando…' : 'Salvar perfil' }}</GooeyButton>
              <RouterLink v-if="!user" to="/login?next=/ajustes" class="link">Entrar</RouterLink>
              <button v-else type="button" class="logout-btn" @click="logout">Sair da conta</button>
            </div>
          </form>
        </template>

        <template v-else-if="tab === 'prefs'">
          <div class="cols">
            <fieldset class="group card-sub">
              <legend>Aparência</legend>
              <div class="seg">
                <label v-for="[id, label] in THEMES" :key="id"><input v-model="state.prefs.theme" type="radio" name="theme" :value="id" />{{ label }}</label>
              </div>
            </fieldset>
            <fieldset class="group card-sub">
              <legend>Cor do tema</legend>
              <AppColorPicker v-model="state.prefs.accent" />
            </fieldset>
          </div>
          <div class="form cols">
            <label>Início da semana
              <AppSelect v-model="state.prefs.weekStart" :options="[{ value: 0, label: 'Domingo' }, { value: 1, label: 'Segunda-feira' }]" block />
            </label>
            <label>Densidade das listas
              <AppSelect v-model="state.prefs.density" :options="[{ value: 'comfortable', label: 'Confortável' }, { value: 'compact', label: 'Compacta' }]" block />
            </label>
            <label>Visão padrão dos projetos
              <AppSelect v-model="state.prefs.defaultView" :options="VIEWS.map(([value, label]) => ({ value, label }))" block />
            </label>
            <label>Prioridade padrão da nova tarefa
              <AppSelect v-model="state.prefs.defaultPriority" :options="[{ value: '', label: 'Sem prioridade' }, ...PRIORITIES.map((p) => ({ value: p.id, label: p.name }))]" block />
            </label>
          </div>
          <ul class="toggles">
            <li v-for="[id, label, hint] in PREF_TOGGLES" :key="id">
              <span>{{ label }}<small>{{ hint }}</small></span>
              <button type="button" role="switch" class="switch" :aria-checked="state.prefs[id]" :aria-label="label" @click="state.prefs[id] = !state.prefs[id]"><span /></button>
            </li>
          </ul>
        </template>

        <WhatsAppSettings v-else-if="tab === 'whatsapp'" />
        <template v-else-if="tab === 'notify'">
          <div class="bar">
            <strong>Navegador</strong>
            <span v-if="permission === 'unsupported'" class="hint">Este navegador não suporta notificações.</span>
            <template v-else>
              <span class="hint">{{ { granted: 'Habilitadas.', denied: 'Bloqueadas nas configurações do site.', default: 'Desabilitadas.' }[permission] }}</span>
              <button v-if="permission === 'default'" type="button" class="link" @click="enableBrowser">Habilitar</button>
              <button v-if="permission === 'granted'" type="button" class="link" @click="testBrowser">Enviar teste</button>
            </template>
          </div>
          <div class="bar push">
            <strong>Celular e computador (push)</strong>
            <span v-if="!pushSupported" class="hint">Este navegador não recebe push. No iPhone, adicione o Novexo à Tela de Início e abra por lá.</span>
            <span v-else-if="!pushConfigured || push.server === false" class="hint">Não configurado: falta {{ !pushConfigured ? 'VITE_FIREBASE_* no .env do front' : 'FIREBASE_CREDENTIALS no .env do backend' }}.</span>
            <template v-else>
              <span class="hint">{{ push.on ? 'Ativado neste aparelho.' : 'Receba menções, tarefas atribuídas e prazos mesmo com o site fechado.' }}</span>
              <button v-if="!push.on" type="button" class="link" :disabled="push.busy" @click="turnPushOn">Ativar neste aparelho</button>
              <template v-else>
                <button type="button" class="link" :disabled="push.busy" @click="testPush">Enviar teste</button>
                <button type="button" class="link" :disabled="push.busy" @click="turnPushOff">Desativar</button>
              </template>
            </template>
            <p v-if="push.msg" class="hint push__msg" role="status">{{ push.msg }}</p>
            <ul v-if="push.devices.length" class="rows push__devices" aria-label="Aparelhos com push">
              <li v-for="d in push.devices" :key="d.id">{{ d.platform || 'Aparelho' }}<span class="hint">desde {{ new Date(d.created_at).toLocaleDateString('pt-BR') }}</span></li>
            </ul>
          </div>
          <h3>Avisar quando</h3>
          <ul class="toggles">
            <li v-for="[id, label] in NOTIFY" :key="id">
              <span>{{ label }}</span>
              <button type="button" role="switch" class="switch" :aria-checked="state.prefs.notify[id]" :aria-label="label" @click="state.prefs.notify[id] = !state.prefs.notify[id]"><span /></button>
            </li>
          </ul>
        </template>

        <template v-else-if="tab === 'general'">
          <div class="form cols">
            <label>Nome do workspace <input :value="state.workspaceName" :disabled="!isAdmin" @change="saveWorkspace({ name: $event.target.value })" /></label>
            <label>Endereço
              <span class="prefix-input"><span>{{ origin }}/</span><input v-model="slugInput" :disabled="!isAdmin" @change="saveWorkspace({ slug: slugInput }).then((ok) => ok || (slugInput = state.slug))" /></span>
            </label>
            <label>Tamanho da empresa
              <AppSelect :model-value="general.size" :options="[{ value: '', label: 'Escolher' }, 'Só eu', '2-10', '11-50', '51-200', '201-500', '500+']" :disabled="!isAdmin" block @change="(v) => setSetting('general', 'size', v)" />
            </label>
            <label>Fuso horário
              <AppSelect :model-value="general.timezone" :options="['America/Sao_Paulo', 'America/Manaus', 'America/Fortaleza', 'America/Noronha', 'America/Rio_Branco', 'UTC', 'Europe/Lisbon']" :disabled="!isAdmin" block @change="(v) => setSetting('general', 'timezone', v)" />
            </label>
          </div>
        </template>

        <template v-else-if="tab === 'members'">
          <p class="hint">Seu workspace é só seu: notas, wiki e rascunhos ficam com você. Para trabalhar junto, convide pessoas para um <strong>projeto</strong>; elas veem só aquele projeto.</p>
          <ul class="rows">
            <li v-for="m in state.people" :key="m.id">
              <span class="av" :style="{ background: m.color }"><img referrerpolicy="no-referrer" v-if="m.avatar" :src="m.avatar" alt="" class="av-img" /><template v-else>{{ m.name.slice(0, 2).toUpperCase() }}</template></span>
              <span class="grow">{{ m.name }}<small v-if="m.id === state.me" class="muted"> (você)</small>
                <small class="muted block">{{ state.projects.filter((p) => p.members?.includes(m.id)).map((p) => p.name).join(', ') || 'Nenhum projeto em comum' }}</small>
              </span>
            </li>
          </ul>
          <h3>Membros por projeto</h3>
          <ul class="rows">
            <li v-for="p in state.projects" :key="p.id">
              <span class="grow">{{ p.name }}<small class="muted">, {{ p.members?.length || 1 }} {{ (p.members?.length || 1) === 1 ? 'pessoa' : 'pessoas' }}<template v-if="p.shared">, de {{ p.owner_name }}</template></small></span>
              <RouterLink :to="`/projetos/${p.id}/membros`" class="link">{{ p.my_permission === 'full' ? 'Convidar e gerenciar' : 'Ver membros' }}</RouterLink>
            </li>
          </ul>
        </template>

        <template v-else-if="tab === 'billing'">
          <p v-if="!billing" class="hint"><ArcLoader />Carregando planos…</p>
          <template v-else>
            <div class="bar">
              <strong>Plano atual</strong>
              <span>{{ current ? billing.plans.find((p) => p.code === current.plan)?.name || current.plan : 'Grátis' }}</span>
              <span v-if="current?.status && current.status !== 'active'" class="hint">{{ SUB_STATUS[current.status] }}</span>
              <span v-if="current?.trial_ends_at" class="hint">teste até {{ fmtDate(current.trial_ends_at) }}</span>
              <span v-if="current?.current_period_end && current.plan !== 'free'" class="hint">vale até {{ fmtDate(current.current_period_end) }}</span>
            </div>
            <div class="seg billing-seg" role="group" aria-label="Período">
              <label><input v-model="yearly" type="radio" name="period" :value="false" />Mensal</label>
              <label><input v-model="yearly" type="radio" name="period" :value="true" />Anual <small>20% off</small></label>
            </div>
            <ul class="plans">
              <li v-for="p in billing.plans" :key="p.code" :class="{ on: isCurrent(p) }">
                <strong>{{ p.name }}</strong><span class="hint">{{ planPrice(p) }}</span>
                <span v-if="isCurrent(p) && !(p.price_month_cents && (current?.current_period_end || current?.status === 'trialing'))" class="hint">Seu plano</span>
                <RouterLink v-else-if="isAdmin && p.price_month_cents" :to="checkoutLink(p)" class="pg-btn" :class="{ primary: !isCurrent(p) || current?.status === 'trialing' }">{{ isCurrent(p) && current?.status !== 'trialing' ? 'Renovar' : 'Assinar' }}</RouterLink>
              </li>
            </ul>
            <p class="hint">Pagamento por Pix ou cartão (até 12x no anual), com o valor calculado pelas pessoas do workspace. <RouterLink to="/#planos" class="link">Comparar planos</RouterLink></p>
            <p v-if="paymentsError" class="hint" role="alert">{{ paymentsError }}</p>
            <template v-if="payments.length">
              <h3 class="pay-title">Pagamentos</h3>
              <ul class="rows pays">
                <li v-for="p in payments" :key="p.id">
                  <span class="pay-when">{{ fmtDate(p.paid_at || p.created_at) }}</span>
                  <span class="pay-what">{{ p.plan_name }}, {{ p.interval === 'year' ? 'anual' : 'mensal' }}, {{ p.seats }} {{ p.seats === 1 ? 'pessoa' : 'pessoas' }}</span>
                  <span class="pay-how">{{ p.method === 'pix' ? 'Pix' : `Cartão ${p.card_brand} •••• ${p.card_last4}`.trim() }}<template v-if="p.installments > 1"> em {{ p.installments }}x</template></span>
                  <strong>{{ brl(p.amount_cents) }}</strong>
                  <span class="pay-status" :class="PAY_STATUS[p.status]">{{ p.status_label }}</span>
                </li>
              </ul>
            </template>
          </template>
        </template>

        <template v-else-if="tab === 'import'">
          <div class="card-sub">
            <h3>Migre sem retrabalho</h3>
            <p class="hint">Aceita <strong>Trello (.json)</strong> com listas, etiquetas e checklists, ou planilhas <strong>CSV</strong> do <strong>Asana, ClickUp, Notion, Jira, Excel</strong> e do próprio Novexo. Colunas como <code>Task Name</code>, <code>Section/Column</code>, <code>Priority</code>, <code>Due Date</code> e <code>Tags</code> são reconhecidas automaticamente.</p>
            <div class="form cols">
              <label>Projeto de destino
                <AppSelect v-model="importProject" :options="[{ value: '', label: state.projects[0]?.name || 'Nenhum projeto' }, ...state.projects.slice(1).map((p) => ({ value: p.id, label: p.name }))]" block />
              </label>
            </div>
            <label v-if="canWrite" class="pg-btn primary file">Escolher arquivo (.csv ou .json)<input type="file" accept=".csv,text/csv,.json,application/json" @change="onImport" /></label>
          </div>
        </template>

        <template v-else-if="tab === 'export'">
          <div class="card-sub">
            <h3>Exportar workspace</h3>
            <p class="hint">Baixe os dados do workspace para análise ou backup off-line.</p>
            <div class="actions">
              <GooeyButton variant="primary" @click="exportCsv">Tarefas em planilha (CSV)</GooeyButton>
              <button type="button" class="pg-btn" @click="exportJson">Tudo em JSON</button>
            </div>
          </div>
          <div class="card-sub">
            <h3>Dados deste navegador</h3>
            <p class="hint">Rascunhos, documentos da wiki, notas e preferências ficam só neste navegador.</p>
            <div class="actions">
              <button type="button" class="pg-btn" @click="load().then(() => (status = 'Dados recarregados do servidor.'))">Recarregar do servidor</button>
              <button type="button" class="danger" @click="twice('local', () => { clearLocal(); status = 'Rascunhos e documentos locais limpos.' })">{{ confirm2 === 'local' ? 'Clique de novo para confirmar' : 'Limpar rascunhos e documentos locais' }}</button>
            </div>
          </div>
        </template>

        <template v-else-if="tab === 'worklogs'">
          <SettingsList v-bind="LISTS.worklogs" :can-write="canWrite">
            <template #footer="{ rows }">
              <p v-if="rows.length" class="hint">Total: <strong>{{ fmtHours(rows.reduce((s, r) => s + r.minutes, 0) / 60) }}</strong> em {{ rows.length }} registros</p>
            </template>
          </SettingsList>
        </template>

        <template v-else-if="tab === 'identity' || tab === 'governance'">
          <ul class="toggles">
            <li v-for="[key, label, hint] in SECTION_TOGGLES[tab]" :key="key">
              <span>{{ label }}<small>{{ hint }}</small></span>
              <button type="button" role="switch" class="switch" :aria-checked="(tab === 'identity' ? identity : governance)[key]" :aria-label="label" :disabled="!isAdmin" @click="setSetting(tab, key, !(tab === 'identity' ? identity : governance)[key])"><span /></button>
            </li>
          </ul>
          <template v-if="tab === 'governance'">
            <div class="form cols">
              <label>Quem cria projetos
                <AppSelect :model-value="governance.createProjects" :options="[{ value: 'admin', label: 'Só administradores' }, { value: 'member', label: 'Administradores e membros' }]" :disabled="!isAdmin" block @change="(v) => setSetting('governance', 'createProjects', v)" />
              </label>
              <label>Quem apaga tarefas
                <AppSelect :model-value="governance.deleteTasks" :options="[{ value: 'admin', label: 'Só administradores' }, { value: 'member', label: 'Quem criou a tarefa e administradores' }]" :disabled="!isAdmin" block @change="(v) => setSetting('governance', 'deleteTasks', v)" />
              </label>
            </div>
          </template>
          <template v-else>
            <h3>Domínios verificados</h3>
            <ul v-if="identity.domains.length" class="rows">
              <li v-for="d in identity.domains" :key="d"><span class="grow">@{{ d }}</span><button v-if="isAdmin" type="button" class="link rm" @click="setSetting('identity', 'domains', identity.domains.filter((x) => x !== d))">Remover</button></li>
            </ul>
            <p v-else class="hint">Nenhum domínio ainda.</p>
            <form v-if="isAdmin" class="row" @submit.prevent="addDomain">
              <input v-model="newDomain" placeholder="empresa.com.br" aria-label="Novo domínio" />
              <button type="submit" class="pg-btn">Adicionar domínio</button>
            </form>
          </template>
        </template>

        <template v-else-if="tab === 'schedule'">
          <div class="cols">
            <fieldset class="group card-sub">
              <legend>Dias úteis</legend>
              <div class="days">
                <button v-for="(d, i) in WEEKDAYS" :key="d" type="button" :aria-pressed="schedule.days.includes(i)" :disabled="!isAdmin" @click="toggleDay(i)">{{ d }}</button>
              </div>
            </fieldset>
            <fieldset class="group card-sub">
              <legend>Horário de trabalho</legend>
              <div class="row">
                <input :value="schedule.start" type="time" aria-label="Início do expediente" :disabled="!isAdmin" @change="setSetting('schedule', 'start', $event.target.value)" />
                <span class="hint">até</span>
                <input :value="schedule.end" type="time" aria-label="Fim do expediente" :disabled="!isAdmin" @change="setSetting('schedule', 'end', $event.target.value)" />
                <span class="hint">{{ fmtHours(dailyHours) }} por dia, {{ fmtHours(dailyHours * schedule.days.length) }} por semana</span>
              </div>
            </fieldset>
          </div>
          <fieldset class="group card-sub">
            <legend>Dias não úteis</legend>
            <form v-if="isAdmin" class="row" @submit.prevent="addHoliday">
              <AppDateInput v-model="holiday.date" placeholder="Data da folga" aria-label="Data da folga" />
              <input v-model="holiday.name" placeholder="Nome (ex.: Natal)" aria-label="Nome da folga" />
              <button type="submit" class="pg-btn primary">Adicionar</button>
            </form>
            <ul v-if="schedule.holidays.length" class="rows">
              <li v-for="h in schedule.holidays" :key="h.date + h.name"><span class="grow">{{ fmtDate(h.date) }}, {{ h.name }}</span><button v-if="isAdmin" type="button" class="link rm" @click="setSetting('schedule', 'holidays', schedule.holidays.filter((x) => x !== h))">Remover</button></li>
            </ul>
            <p v-else class="hint">Nenhum feriado ou folga ainda.</p>
          </fieldset>
        </template>

        <template v-else-if="tab === 'wiki' || tab === 'ai'">
          <ul class="toggles">
            <template v-if="tab === 'wiki'">
              <li><span>Documentos ligados<small>Seus documentos no trilho da esquerda.</small></span><button type="button" role="switch" class="switch" :aria-checked="products.wiki" aria-label="Wiki ligada" :disabled="!isAdmin" @click="setSetting('products', 'wiki', !products.wiki)"><span /></button></li>
              <li><span>Links públicos de documentos<small>Permite compartilhar um documento com quem não está no workspace.</small></span><button type="button" role="switch" class="switch" :aria-checked="products.wikiPublic" aria-label="Links públicos" :disabled="!isAdmin" @click="setSetting('products', 'wikiPublic', !products.wikiPublic)"><span /></button></li>
            </template>
            <template v-else>
              <li><span>Novexo IA ligada<small>Chat com IA no trilho e no assistente.</small></span><button type="button" role="switch" class="switch" :aria-checked="products.ai" aria-label="Novexo IA ligada" :disabled="!isAdmin" @click="setSetting('products', 'ai', !products.ai)"><span /></button></li>
              <li><span>Usar dados do workspace<small>A IA lê tarefas, projetos e prazos para responder.</small></span><button type="button" role="switch" class="switch" :aria-checked="products.aiContext" aria-label="Usar dados do workspace" :disabled="!isAdmin" @click="setSetting('products', 'aiContext', !products.aiContext)"><span /></button></li>
            </template>
          </ul>
        </template>

        <template v-else-if="tab === 'projects'">
          <p v-if="!proj" class="hint">Nenhum projeto ainda. <RouterLink to="/projetos" class="link">Criar projeto</RouterLink></p>
          <template v-else>
            <div class="form cols">
              <label>Projeto
                <AppSelect :model-value="proj.id" :options="state.projects.map((p) => ({ value: p.id, label: p.name }))" block @change="(v) => { projectId = v; confirm2 = '' }" />
              </label>
              <label>Nome <input :key="proj.id" :value="proj.name" @change="updateProject(proj, { name: $event.target.value.trim() || proj.name })" /></label>
              <label>Identificador <input :key="`p${proj.id}`" :value="proj.prefix" maxlength="8" @change="updateProject(proj, { prefix: $event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })" /></label>
            </div>
            <fieldset class="group card-sub">
              <legend>Cor do projeto</legend>
              <AppColorPicker
                :model-value="proj.color"
                :show-reset="false"
                @update:model-value="proj.color = $event"
                @commit="updateProject(proj, { color: $event })"
              />
            </fieldset>
            <h3>Recursos dos projetos (para você)</h3>
            <ul class="toggles">
              <li v-for="[key, label] in FEATURES" :key="key"><span>{{ label }}</span><button type="button" role="switch" class="switch" :aria-checked="state.prefs.features[key]" :aria-label="label" @click="setFeature(key)"><span /></button></li>
            </ul>
            <div class="card-sub danger-zone">
              <h3>Zona de perigo</h3>
              <div class="actions">
                <button type="button" class="danger" @click="twice('archive', () => archiveProject(proj).then((ok) => ok && (status = 'Projeto arquivado. Ele fica em Arquivados.')))">{{ confirm2 === 'archive' ? 'Clique de novo para arquivar' : 'Arquivar projeto' }}</button>
                <button v-if="state.isAdmin" type="button" class="danger" @click="deleting = proj">Excluir projeto</button>
              </div>
            </div>
            <DeleteProjectDialog :project="deleting" @close="deleting = null" />
          </template>
        </template>

        <template v-else-if="tab === 'tags'">
          <p class="hint">Renomeie ou apague uma etiqueta em todas as tarefas de uma vez. Para criar, adicione na própria tarefa.</p>
          <ul v-if="tags.length" class="rows">
            <li v-for="[tag, n] in tags" :key="tag">
              <input class="grow" :value="tag" :aria-label="`Renomear etiqueta ${tag}`" @change="renameTag(tag, $event)" @keydown.enter="$event.target.blur()" />
              <small class="muted">{{ n }} {{ n === 1 ? 'tarefa' : 'tarefas' }}</small>
              <button type="button" class="link rm" @click="twice(`t${tag}`, () => removeTag(tag))">{{ confirm2 === `t${tag}` ? 'Confirmar' : 'Apagar' }}</button>
            </li>
          </ul>
          <p v-else class="hint">Nenhuma etiqueta nas tarefas ainda.</p>
        </template>

        <template v-else-if="tab === 'integrations'">
          <IntegrationsPanel />
        </template>

        <template v-else-if="LISTS[tab]">
          <SettingsList :key="tab" v-bind="LISTS[tab]" :query="LISTS[tab].kind ? `?kind=${LISTS[tab].kind}` : ''" :extra="LISTS[tab].kind ? { kind: LISTS[tab].kind } : {}" :can-write="LISTS[tab].admin ? isAdmin : canWrite" />
          <template v-if="tab === 'tokens'">
            <p class="hint">Use no cabeçalho <code>Authorization: Bearer nvx_…</code> ou <code>Token nvx_…</code>. O token completo aparece uma única vez, ao criar.</p>
            <div class="card-sub mcp-card">
              <div class="mcp-head">
                <div>
                  <h3>Servidor MCP oficial (Claude, Cursor, ChatGPT)</h3>
                  <p class="hint">Conecte seu agente externo ao Novexo via Streamable HTTP — sem anúncios injetados, respeitando exatamente suas permissões.</p>
                </div>
                <button type="button" class="pg-btn" @click="copyMcpConfig"><AppIcon name="copy" :size="13" />Copiar JSON</button>
              </div>
              <pre class="mcp-code"><code>{{ mcpConfigJson }}</code></pre>
              <p class="hint">Ferramentas expostas: <code>list_projects</code>, <code>list_tasks</code>, <code>create_task</code>, <code>update_task</code>, <code>add_comment</code> e <code>list_docs</code>.</p>
            </div>
          </template>
          <p v-if="tab === 'webhooks'" class="hint">O Novexo vai mandar um POST para a URL a cada evento, assinado com o segredo. O envio ainda está sendo construído; a configuração já fica salva.</p>
        </template>

        <p v-if="status" class="status" role="status">{{ status }}</p>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: none;
  height: 100%;
  overflow: hidden;
  padding: 1.25rem 1.85rem;
}
.page__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  flex-shrink: 0;
  gap: 0.35rem 1rem;
}
h1 { margin: 0; font: 650 1.55rem/1.2 'Geist', system-ui, sans-serif; letter-spacing: -0.025em; color: var(--text); }
.page__sub { font-size: 13px; color: var(--muted); }

.layout {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: grid;
  grid-template-columns: 15.5rem minmax(0, 1fr);
  gap: 1.5rem;
  align-items: stretch;
}
.tabs {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  height: 100%;
  max-height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 0.35rem;
}
.tabs::-webkit-scrollbar, .panel__body::-webkit-scrollbar { width: 12px; }
.tabs::-webkit-scrollbar-track, .panel__body::-webkit-scrollbar-track { background: transparent; margin-block: 10px; }
.tabs::-webkit-scrollbar-thumb, .panel__body::-webkit-scrollbar-thumb {
  border-radius: 999px;
  border: 4px solid transparent;
  background: color-mix(in srgb, var(--muted) 36%, transparent);
  background-clip: content-box;
}
.tabs::-webkit-scrollbar-thumb:hover, .panel__body::-webkit-scrollbar-thumb:hover {
  border: 3px solid transparent;
  background: color-mix(in srgb, var(--muted) 68%, transparent);
  background-clip: content-box;
}
.tabs::-webkit-scrollbar-button, .panel__body::-webkit-scrollbar-button { display: none; width: 0; height: 0; }
@supports not selector(::-webkit-scrollbar) {
  .tabs, .panel__body { scrollbar-width: thin; scrollbar-color: var(--line-strong) transparent; }
}
.tabs__group { display: flex; flex-direction: column; gap: 0.2rem; }
.tabs__label {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0 0.65rem 0.4rem;
  margin-bottom: 0.15rem;
  border-bottom: 1px solid var(--line);
  font: 700 11.5px/1.2 'Geist', system-ui, sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text);
}
.tabs__label :deep(.app-icon) { color: var(--accent); }
.tabs__list { display: flex; flex-direction: column; gap: 2px; }
.tabs button {
  padding: 0.44rem 0.7rem;
  border: 0;
  border-radius: 7px;
  background: none;
  font-size: 13.5px;
  text-align: left;
  color: var(--muted);
  cursor: pointer;
  transition: background 0.14s ease, color 0.14s ease;
}
.tabs button:hover { background: color-mix(in srgb, var(--surface-2) 70%, transparent); color: var(--text); }
.tabs button[aria-current='page'] {
  background: var(--surface-2);
  color: var(--text);
  font-weight: 550;
  box-shadow: inset 2px 0 0 var(--accent);
}

.panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
}
.panel__head {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1.55rem 2.15rem 1.05rem;
  border-bottom: 1px solid var(--line);
}
.panel__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 1.35rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 1.45rem 2.15rem 1.85rem;
}
.panel__eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent-soft);
}
h2 { margin: 0; font: 650 1.4rem/1.2 'Geist', system-ui, sans-serif; letter-spacing: -0.02em; color: var(--text); }
h3 { margin: 0.35rem 0 0; font-size: 13px; font-weight: 600; color: var(--text); }

.form { display: flex; flex-direction: column; gap: 1.1rem; width: 100%; max-width: none; }
.cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr)); gap: 1rem 1.35rem; width: 100%; max-width: none; }
.form label { display: flex; flex-direction: column; gap: 0.4rem; font-size: 12.5px; font-weight: 500; color: var(--muted); }
:is(.form input, .row input, .rows input) { height: 38px; padding: 0 0.75rem; border: 1px solid var(--line-strong); border-radius: 8px; background: var(--bg); font: inherit; font-size: 14px; color: var(--text); outline: none; }
.form :deep(.sel) { height: 38px; border-radius: 8px; font-size: 13.5px; }
:is(.form input, .row input, .rows input):focus { border-color: var(--accent); }
:is(input, button):disabled { opacity: 0.55; cursor: not-allowed; }
.prefix-input { display: flex; align-items: center; height: 38px; border: 1px solid var(--line-strong); border-radius: 8px; background: var(--bg); }
.prefix-input span { padding-left: 0.75rem; font-size: 13px; color: var(--muted); white-space: nowrap; }
.form .prefix-input input { flex: 1; min-width: 0; height: 100%; border: 0; padding-left: 0.15rem; background: none; }
.hint { margin: 0; font-size: 13px; line-height: 1.55; color: var(--muted); }
.hint code { padding: 0.1rem 0.35rem; border-radius: 5px; background: var(--bg); font-family: 'Geist Mono', monospace; font-size: 12px; }
.muted { color: var(--muted); }
.actions { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; }
.logout-btn { margin-left: auto; padding: 0.45rem 0.9rem; border: 1px solid var(--line-strong); border-radius: 8px; background: none; font: 500 13px/1.2 inherit; color: var(--muted); cursor: pointer; transition: border-color 0.16s ease, color 0.16s ease, background 0.16s ease; }
.logout-btn:hover { border-color: rgb(255 91 77 / 0.55); background: rgb(255 91 77 / 0.1); color: var(--danger, #ff8a80); }
.link { padding: 0; border: 0; background: none; font-size: 13.5px; color: var(--accent-soft); text-decoration: none; cursor: pointer; }
.link:hover { text-decoration: underline; }

.card-sub {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.15rem 1.25rem;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: color-mix(in srgb, var(--bg) 50%, var(--surface));
}
.mcp-head { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 0.75rem; }
.mcp-head h3 { margin: 0 0 0.2rem; font-size: 14px; }
.mcp-code { margin: 0; padding: 0.8rem 0.95rem; overflow-x: auto; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); font: 400 12.5px/1.55 'Geist Mono', monospace; color: var(--text); }
.danger-zone { border-color: rgb(255 91 77 / 0.3); }

.group { display: flex; flex-direction: column; gap: 0.65rem; margin: 0; min-width: 0; }
.group:not(.card-sub) { padding: 0; border: 0; }
.group legend { padding: 0; font-size: 12.5px; font-weight: 600; color: var(--text); }
.group.card-sub legend { float: left; margin-bottom: 0.4rem; }
.seg { display: inline-flex; align-self: flex-start; padding: 3px; border: 1px solid var(--line-strong); border-radius: 8px; background: var(--bg); }
.seg label { position: relative; padding: 0.35rem 0.9rem; border-radius: 6px; font-size: 13.5px; color: var(--muted); cursor: pointer; }
.seg label:has(input:checked) { background: var(--surface-2); color: var(--text); font-weight: 500; }
.seg label:has(input:focus-visible) { outline: 2px solid var(--accent-soft); }
.seg input { position: absolute; opacity: 0; pointer-events: none; }

.toggles { display: grid; grid-template-columns: repeat(auto-fit, minmax(21rem, 1fr)); gap: 0.85rem; margin: 0; padding: 0; list-style: none; }
.toggles li { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.15rem; border: 1px solid var(--line); border-radius: 10px; background: color-mix(in srgb, var(--bg) 50%, var(--surface)); font-size: 13.5px; }
.toggles small { display: block; margin-top: 0.2rem; font-size: 12px; color: var(--muted); }
.switch { position: relative; flex-shrink: 0; width: 36px; height: 20px; padding: 0; border: 0; border-radius: 999px; background: var(--line-strong); cursor: pointer; transition: background 0.2s var(--ease); }
.switch span { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: var(--text); transition: translate 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
.switch[aria-checked='true'] { background: var(--accent); }
.switch[aria-checked='true'] span { translate: 16px 0; background: #fff; }

.bar { display: flex; flex-wrap: wrap; align-items: center; gap: 0.85rem; padding: 1rem 1.25rem; border: 1px solid var(--line); border-radius: 10px; background: color-mix(in srgb, var(--bg) 50%, var(--surface)); font-size: 13.5px; }
.bar.push { margin-top: 0; }
.push__msg, .push__devices { flex-basis: 100%; }
.push__devices li { justify-content: space-between; }
.rows { display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none; }
.rows li { display: flex; align-items: center; gap: 0.75rem; padding: 0.7rem 0.25rem; font-size: 13.5px; }
.rows li + li { border-top: 1px solid var(--line); }
.grow { flex: 1; min-width: 0; }
.rm { margin-left: auto; color: var(--muted); }
.rm:hover { color: var(--danger, #ff8a80); }
.av { display: grid; place-items: center; flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%; font: 700 11px/1 'Lexend', system-ui, sans-serif; color: #000; }

.plans { display: grid; grid-template-columns: repeat(auto-fit, minmax(13.5rem, 1fr)); gap: 0.9rem; margin: 0; padding: 0; list-style: none; }
.plans li { display: flex; flex-direction: column; gap: 0.45rem; padding: 1.25rem 1.35rem; border: 1px solid var(--line); border-radius: 12px; background: color-mix(in srgb, var(--bg) 50%, var(--surface)); font-size: 14px; }
.plans li strong { font-size: 15px; }
.plans li.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, var(--surface)); }
.plans li .pg-btn { justify-content: center; margin-top: auto; padding-top: 0.45rem; padding-bottom: 0.45rem; text-decoration: none; }
.billing-seg { margin: 0.25rem 0; }
.billing-seg small { margin-left: 0.3rem; color: var(--accent-soft); }
.pay-title { margin: 0.5rem 0 0; font-size: 14px; font-weight: 600; color: var(--text); }
.pays li { flex-wrap: wrap; }
.pay-when { width: 8.5rem; color: var(--muted); white-space: nowrap; }
.pay-what { flex: 1; min-width: 10rem; }
.pay-how { color: var(--muted); }
.pay-status { padding: 0.15rem 0.55rem; border-radius: 6px; background: var(--surface-2); font-size: 12px; }
.pay-status.ok { color: var(--success, #7fc47a); }
.pay-status.wait { color: #f2c46d; }
.pay-status.bad { color: var(--danger, #ff8a80); }

.days { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.days button { min-width: 3.1rem; padding: 0.4rem 0.6rem; border: 1px solid var(--line-strong); border-radius: 7px; background: var(--bg); font-size: 13px; color: var(--muted); cursor: pointer; }
.days button[aria-pressed='true'] { border-color: var(--accent); background: var(--accent); color: #fff; }
.row { display: flex; flex-wrap: wrap; align-items: center; gap: 0.65rem; }
.file { position: relative; align-self: flex-start; cursor: pointer; }
.file input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.file:focus-within { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
.danger { align-self: flex-start; padding: 0.5rem 0.9rem; border: 1px solid rgb(255 91 77 / 0.45); border-radius: 8px; background: none; font-size: 13.5px; color: var(--danger, #ff8a80); cursor: pointer; }
.danger:hover { background: rgb(255 91 77 / 0.12); }
.status { margin: 0; font-size: 13px; color: var(--accent-soft); }
:is(.tabs button, .link, .switch, .danger, .days button):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
.av-img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
.block { display: block; }
.photo { display: flex; align-items: center; gap: 1.25rem; padding: 1.25rem; border: 1px solid var(--line); border-radius: 12px; background: color-mix(in srgb, var(--bg) 50%, var(--surface)); }
.photo__av { display: grid; place-items: center; flex-shrink: 0; width: 72px; height: 72px; overflow: hidden; border-radius: 50%; background: var(--surface-2); font: 600 22px/1 'Geist', system-ui, sans-serif; color: var(--text); transition: opacity 0.2s ease; }
.photo__av.busy { opacity: 0.5; }
.photo__av img { width: 100%; height: 100%; object-fit: cover; }
.photo__txt { display: flex; flex-direction: column; gap: 0.3rem; min-width: 0; }
.photo__txt small { font-size: 13px; color: var(--muted); }
.photo__btns { display: flex; align-items: center; gap: 0.85rem; margin-top: 0.4rem; }

@media (max-width: 900px) {
  .page { height: auto; overflow: visible; padding: 1.25rem; }
  .layout { grid-template-columns: minmax(0, 1fr); overflow: visible; }
  .tabs { height: auto; max-height: none; overflow: visible; padding-right: 0; }
  .tabs__list { flex-direction: row; flex-wrap: wrap; gap: 4px; }
  .panel { height: auto; max-height: none; overflow: visible; }
  .panel__head { padding: 1.15rem 1.25rem 0.9rem; }
  .panel__body { overflow: visible; padding: 1.15rem 1.25rem 1.25rem; }
  .toggles { grid-template-columns: 1fr; }
}
</style>
