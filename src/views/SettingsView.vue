<script setup>
// Ajustes no molde das settings do Plane e do ClickUp. Preferências pessoais ficam no navegador;
// o resto é do workspace e vai para a API (/api/workspace/ settings, membros, times, itens, horas, webhooks e tokens).
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { gsap, prefersReducedMotion } from '../utils/motion'
import { parseCsv, toCsv } from '../utils/csv'
import { api } from '../services/api'
import { disablePush, enablePush, pushConfigured, pushSupported, savedToken } from '../services/push'
import { useAuth } from '../composables/useAuth'
import { useWorkspace } from '../composables/useWorkspace'
import GooeyButton from '../components/GooeyButton.vue'
import SettingsList from '../components/app/SettingsList.vue'

const GROUPS = [
  { label: 'Minha conta', tabs: [['profile', 'Perfil'], ['prefs', 'Preferências'], ['notify', 'Notificações']] },
  { label: 'Administração', tabs: [['general', 'Geral'], ['members', 'Pessoas'], ['billing', 'Planos e cobrança'], ['import', 'Importar'], ['export', 'Exportar'], ['worklogs', 'Registros de horas'], ['identity', 'Identidade'], ['governance', 'Governança'], ['schedule', 'Cronograma de trabalho']] },
  { label: 'Produtos', tabs: [['wiki', 'Wiki'], ['ai', 'Novexo IA']] },
  { label: 'Recursos', tabs: [['projects', 'Projetos'], ['teams', 'Times'], ['initiatives', 'Iniciativas'], ['customers', 'Clientes'], ['templates', 'Modelos'], ['tags', 'Etiquetas'], ['integrations', 'Integrações'], ['releases', 'Lançamentos']] },
  { label: 'Desenvolvedores', tabs: [['webhooks', 'Webhooks'], ['tokens', 'Tokens de API']] },
]
const TITLES = Object.fromEntries(GROUPS.flatMap((g) => g.tabs))
const THEMES = [['light', 'Claro'], ['dark', 'Escuro'], ['auto', 'Auto']]
const ACCENTS = [
  ['Laranja', '#e56515'], ['Roxo', '#7b68ee'], ['Azul', '#3b82f6'], ['Rosa', '#ec4899'], ['Violeta', '#a855f7'],
  ['Anil', '#6366f1'], ['Azul-petróleo', '#0d9488'], ['Bronze', '#b7791f'], ['Menta', '#34d399'],
]
const PREF_TOGGLES = [
  ['contrast', 'Alto contraste', 'Texto e bordas mais fortes.'],
  ['calm', 'Modo de desempenho', 'Desliga animações e transições.'],
  ['showIds', 'Mostrar IDs das tarefas', 'Código (ex.: APP-3) nas listas e no quadro.'],
  ['handCursor', 'Cursor de mão', 'Mãozinha ao passar em botões e links.'],
  ['shortcuts', 'Atalhos do teclado', 'Ctrl K para buscar e N para nova tarefa.'],
  ['assignMe', 'Me atribuir novas tarefas', 'Nova tarefa já vem com você como responsável.'],
]
const NOTIFY = [
  ['assigned', 'Me atribuírem uma tarefa'], ['mention', 'Me mencionarem'], ['status', 'O status de uma tarefa minha mudar'],
  ['done', 'Uma tarefa minha for concluída'], ['due', 'Prazo chegando ou tarefa parada'], ['digest', 'Resumo da semana por e-mail'],
  ['followOwn', 'Seguir as tarefas que eu criar ou editar'],
]
const VIEWS = [['list', 'Lista'], ['board', 'Quadro'], ['calendar', 'Calendário']]
const ROLES = [['admin', 'Admin'], ['member', 'Membro'], ['limited', 'Membro limitado'], ['guest', 'Convidado']]
const ROLE_NAMES = { owner: 'Dono', ...Object.fromEntries(ROLES) }
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const FEATURES = [['cycles', 'Ciclos'], ['modules', 'Módulos'], ['views', 'Visões'], ['pages', 'Páginas']]
const INTEGRATIONS = ['GitHub', 'GitLab', 'Slack', 'Google Drive', 'Figma', 'Notion', 'Jira', 'Sentry']

// Formulários das telas de lista (SettingsList)
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
const tab = ref('profile')
const panel = ref(null)
const status = ref('')
const confirm2 = ref('') // ação perigosa esperando o segundo clique
const isAdmin = computed(() => state.isAdmin)
const myRole = computed(() => state.members.find((m) => m.id === state.me)?.role)
const canWrite = computed(() => !['guest', 'limited'].includes(myRole.value))

watch(tab, async (t) => {
  status.value = ''
  confirm2.value = ''
  if (t === 'billing' && !billing.value) loadBilling()
  if (t === 'notify') loadDevices()
  await nextTick()
  if (!prefersReducedMotion()) gsap.fromTo(panel.value, { y: 6, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.25, ease: 'power2.out' })
})
const twice = (key, run) => {
  if (confirm2.value !== key) { confirm2.value = key; return }
  confirm2.value = ''
  run()
}

// ---- Seções de Workspace.settings (só admin muda; cada mudança é um PATCH mesclado no backend)
const section = (name, defaults) => computed(() => ({ ...defaults, ...(state.settings[name] || {}) }))
const general = section('general', { size: '', timezone: 'America/Sao_Paulo' })
const governance = section('governance', { createProjects: 'member', membersInvite: true, guestsSeeAll: false, deleteTasks: 'admin', publicPages: false })
const products = section('products', { wiki: true, ai: true, aiContext: true, wikiPublic: false })
const identity = section('identity', { googleOnly: false, autoJoin: false, domains: [] })
const schedule = section('schedule', { days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00', holidays: [] })
const setSetting = (name, key, value) => saveWorkspace({ settings: { [name]: { [key]: value } } })
const SECTION_TOGGLES = {
  governance: [
    ['publicPages', 'Permitir páginas públicas', 'Páginas da wiki e dos projetos com link aberto.'],
  ],
  identity: [
    ['googleOnly', 'Exigir login com Google', 'Desliga o login com senha para este workspace.'],
  ],
}

// ---- Perfil
const profile = reactive({ first_name: user.value?.first_name || '', email: user.value?.email || '' })
async function saveProfile() {
  if (!user.value) { status.value = 'Entre na sua conta para editar o perfil.'; return }
  try {
    await updateMe({ first_name: profile.first_name.trim(), email: profile.email.trim() })
    status.value = 'Perfil salvo.'
  } catch (e) {
    status.value = e.message
  }
}

// ---- Notificações do navegador (a permissão é do navegador)
const permission = ref(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported')
const enableBrowser = async () => (permission.value = await Notification.requestPermission())
const testBrowser = () => new Notification('Novexo', { body: 'Notificação de teste: está tudo certo por aqui.' })

// ---- Celular (push pelo Firebase): cada aparelho ativa o seu; os avisos da caixa de entrada chegam mesmo com o site fechado
const push = reactive({ on: !!savedToken(), server: null, devices: [], busy: false, msg: '' })
async function loadDevices() {
  try { Object.assign(push, (({ enabled, devices }) => ({ server: enabled, devices }))(await api('/api/devices/'))) } catch { /* fica sem a lista */ }
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

// ---- Geral
const slugInput = ref('')
watch(() => state.slug, (s) => (slugInput.value = s), { immediate: true })
const origin = location.origin

// ---- Planos
const billing = ref(null)
async function loadBilling() {
  try { billing.value = await api('/api/billing/') } catch (e) { status.value = e.message }
}
const price = (cents) => (cents == null ? 'Sob consulta' : cents === 0 ? 'Grátis' : `R$ ${(cents / 100).toLocaleString('pt-BR')}/membro/mês`)

// ---- Cronograma
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

// ---- Identidade
const newDomain = ref('')
function addDomain() {
  const d = newDomain.value.trim().toLowerCase().replace(/^@/, '')
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d)) { status.value = 'Domínio inválido (ex.: empresa.com.br).'; return }
  if (!identity.value.domains.includes(d)) setSetting('identity', 'domains', [...identity.value.domains, d])
  newDomain.value = ''
}

// ---- Projetos
const projectId = ref(null)
const proj = computed(() => project(projectId.value) || state.projects[0])
const setFeature = (key) => (state.prefs.features[key] = !state.prefs.features[key])

// ---- Etiquetas (renomear/apagar passa por todas as tarefas)
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

// ---- Exportar
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

// ---- Importar tarefas de CSV (o mesmo formato do Exportar; colunas pelo nome do cabeçalho)
const importProject = ref('')
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()
const byName = (list, v) => list.find((x) => norm(x.name) === norm(v) || x.id === norm(v))?.id
async function onImport(e) {
  const file = e.target.files[0]
  e.target.value = ''
  if (!file) return
  const projectId = importProject.value || state.projects[0]?.id
  if (!projectId) { status.value = 'Crie um projeto antes de importar.'; return }
  const [header, ...lines] = parseCsv(await file.text())
  const col = (...names) => header.findIndex((h) => names.includes(norm(h)))
  const c = { title: col('titulo', 'title', 'nome', 'name'), status: col('status'), priority: col('prioridade', 'priority'), due: col('prazo', 'due', 'data'), tags: col('etiquetas', 'tags') }
  if (c.title < 0) { status.value = 'O arquivo precisa de uma coluna "Título".'; return }
  const toDate = (v) => (/^\d{2}\/\d{2}\/\d{4}$/.test(v) ? v.split('/').reverse().join('-') : /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null)
  let n = 0
  for (const r of lines) {
    const title = r[c.title]?.trim()
    if (!title) continue
    createTask({
      projectId, title,
      status: (c.status >= 0 && byName(STATUSES, r[c.status] || '')) || 'todo',
      priority: (c.priority >= 0 && byName(PRIORITIES, r[c.priority] || '')) || '',
      due: c.due >= 0 ? toDate(r[c.due]?.trim() || '') : null,
      tags: c.tags >= 0 ? (r[c.tags] || '').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
    })
    n++
  }
  status.value = `${n} tarefas importadas para ${project(projectId)?.name}.`
}
</script>

<template>
  <div class="page">
    <h1>Ajustes</h1>
    <div class="layout">
      <nav class="tabs" aria-label="Seções dos ajustes">
        <div v-for="g in GROUPS" :key="g.label" class="tabs__group">
          <span class="tabs__label">{{ g.label }}</span>
          <button v-for="[id, label] in g.tabs" :key="id" type="button" :aria-current="tab === id ? 'page' : undefined" @click="tab = id">{{ label }}</button>
        </div>
      </nav>

      <section ref="panel" class="panel">
        <h2>{{ TITLES[tab] }}</h2>
        <p v-if="!isAdmin && ['general', 'billing', 'identity', 'governance', 'schedule', 'wiki', 'ai', 'webhooks'].includes(tab)" class="hint">Só administradores mudam esta seção.</p>

        <!-- ================= Minha conta ================= -->
        <template v-if="tab === 'profile'">
          <form class="form" @submit.prevent="saveProfile">
            <div class="cols">
              <label>Nome <input v-model="profile.first_name" autocomplete="given-name" /></label>
              <label>E-mail <input v-model="profile.email" type="email" autocomplete="email" /></label>
            </div>
            <p class="hint">{{ user ? `Usuário: ${user.username}` : 'Você está como visitante. Entre para salvar o perfil.' }}</p>
            <div class="actions">
              <GooeyButton type="submit" variant="primary">Salvar perfil</GooeyButton>
              <RouterLink v-if="!user" to="/login?next=/ajustes" class="link">Entrar</RouterLink>
              <button v-else type="button" class="link" @click="logout">Sair da conta</button>
            </div>
          </form>
        </template>

        <template v-else-if="tab === 'prefs'">
          <div class="cols">
            <fieldset class="group">
              <legend>Aparência</legend>
              <div class="seg">
                <label v-for="[id, label] in THEMES" :key="id"><input v-model="state.prefs.theme" type="radio" name="theme" :value="id" />{{ label }}</label>
              </div>
            </fieldset>
            <fieldset class="group">
              <legend>Cor do tema</legend>
              <div class="swatches">
                <button v-for="[name, hex] in ACCENTS" :key="hex" type="button" class="swatch" :style="{ background: hex }" :aria-pressed="state.prefs.accent === hex" :aria-label="name" :title="name" @click="state.prefs.accent = hex" />
              </div>
            </fieldset>
          </div>
          <div class="form cols">
            <label>Início da semana
              <select v-model.number="state.prefs.weekStart"><option :value="0">Domingo</option><option :value="1">Segunda-feira</option></select>
            </label>
            <label>Densidade das listas
              <select v-model="state.prefs.density"><option value="comfortable">Confortável</option><option value="compact">Compacta</option></select>
            </label>
            <label>Visão padrão dos projetos
              <select v-model="state.prefs.defaultView"><option v-for="[id, label] in VIEWS" :key="id" :value="id">{{ label }}</option></select>
            </label>
            <label>Prioridade padrão da nova tarefa
              <select v-model="state.prefs.defaultPriority"><option value="">Sem prioridade</option><option v-for="p in PRIORITIES" :key="p.id" :value="p.id">{{ p.name }}</option></select>
            </label>
          </div>
          <ul class="toggles">
            <li v-for="[id, label, hint] in PREF_TOGGLES" :key="id">
              <span>{{ label }}<small>{{ hint }}</small></span>
              <button type="button" role="switch" class="switch" :aria-checked="state.prefs[id]" :aria-label="label" @click="state.prefs[id] = !state.prefs[id]"><span /></button>
            </li>
          </ul>
        </template>

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

        <!-- ================= Administração ================= -->
        <template v-else-if="tab === 'general'">
          <div class="form cols">
            <label>Nome do workspace <input :value="state.workspaceName" :disabled="!isAdmin" @change="saveWorkspace({ name: $event.target.value })" /></label>
            <label>Endereço
              <span class="prefix-input"><span>{{ origin }}/</span><input v-model="slugInput" :disabled="!isAdmin" @change="saveWorkspace({ slug: slugInput }).then((ok) => ok || (slugInput = state.slug))" /></span>
            </label>
            <label>Tamanho da empresa
              <select :value="general.size" :disabled="!isAdmin" @change="setSetting('general', 'size', $event.target.value)">
                <option value="">Escolher</option><option v-for="s in ['Só eu', '2-10', '11-50', '51-200', '201-500', '500+']" :key="s" :value="s">{{ s }}</option>
              </select>
            </label>
            <label>Fuso horário
              <select :value="general.timezone" :disabled="!isAdmin" @change="setSetting('general', 'timezone', $event.target.value)">
                <option v-for="z in ['America/Sao_Paulo', 'America/Manaus', 'America/Fortaleza', 'America/Noronha', 'America/Rio_Branco', 'UTC', 'Europe/Lisbon']" :key="z" :value="z">{{ z }}</option>
              </select>
            </label>
          </div>
        </template>

        <template v-else-if="tab === 'members'">
          <!-- O workspace é pessoal: pessoas entram em PROJETOS, por convite, na página "Membros" de cada projeto -->
          <p class="hint">Seu workspace é só seu: notas, wiki e rascunhos ficam com você. Para trabalhar junto, convide pessoas para um <strong>projeto</strong>; elas veem só aquele projeto.</p>
          <ul class="rows">
            <li v-for="m in state.people" :key="m.id">
              <span class="av" :style="{ background: m.color }"><img v-if="m.avatar" :src="m.avatar" alt="" class="av-img" /><template v-else>{{ m.name.slice(0, 2).toUpperCase() }}</template></span>
              <span class="grow">{{ m.name }}<small v-if="m.id === state.me" class="muted"> · você</small>
                <small class="muted block">{{ state.projects.filter((p) => p.members?.includes(m.id)).map((p) => p.name).join(', ') || 'Nenhum projeto em comum' }}</small>
              </span>
            </li>
          </ul>
          <h3>Membros por projeto</h3>
          <ul class="rows">
            <li v-for="p in state.projects" :key="p.id">
              <span class="grow">{{ p.name }}<small class="muted"> · {{ p.members?.length || 1 }} {{ (p.members?.length || 1) === 1 ? 'pessoa' : 'pessoas' }}<template v-if="p.shared"> · de {{ p.owner_name }}</template></small></span>
              <RouterLink :to="`/projetos/${p.id}/membros`" class="link">{{ p.my_permission === 'full' ? 'Convidar e gerenciar' : 'Ver membros' }}</RouterLink>
            </li>
          </ul>
        </template>

        <template v-else-if="tab === 'billing'">
          <p v-if="!billing" class="hint">Carregando planos…</p>
          <template v-else>
            <div class="bar">
              <strong>Plano atual</strong>
              <span>{{ billing.subscription ? billing.plans.find((p) => p.code === billing.subscription.plan)?.name || billing.subscription.plan : 'Grátis' }}</span>
              <span v-if="billing.subscription?.trial_ends_at" class="hint">· teste até {{ fmtDate(billing.subscription.trial_ends_at) }}</span>
            </div>
            <ul class="plans">
              <li v-for="p in billing.plans" :key="p.code" :class="{ on: billing.subscription?.plan === p.code }"><strong>{{ p.name }}</strong><span class="hint">{{ price(p.price_month_cents) }}</span></li>
            </ul>
            <RouterLink to="/#planos" class="link">Comparar planos</RouterLink>
          </template>
        </template>

        <template v-else-if="tab === 'import'">
          <p class="hint">Importe tarefas de uma planilha CSV (do Novexo, Excel, Google Planilhas, Jira, Trello…). A primeira linha precisa ter os nomes das colunas: <strong>Título</strong> e, se quiser, Status, Prioridade, Prazo e Etiquetas.</p>
          <div class="form cols">
            <label>Projeto de destino
              <select v-model="importProject"><option value="">{{ state.projects[0]?.name || 'Nenhum projeto' }}</option><option v-for="p in state.projects.slice(1)" :key="p.id" :value="p.id">{{ p.name }}</option></select>
            </label>
          </div>
          <label v-if="canWrite" class="link file">Escolher arquivo CSV<input type="file" accept=".csv,text/csv" @change="onImport" /></label>
        </template>

        <template v-else-if="tab === 'export'">
          <p class="hint">Baixe os dados do workspace para análise ou backup off-line.</p>
          <div class="actions">
            <GooeyButton variant="primary" @click="exportCsv">Tarefas em planilha (CSV)</GooeyButton>
            <button type="button" class="link" @click="exportJson">Tudo em JSON</button>
          </div>
          <h3>Dados deste navegador</h3>
          <p class="hint">Rascunhos, documentos da wiki, notas e preferências ficam só neste navegador.</p>
          <div class="actions">
            <button type="button" class="link" @click="load().then(() => (status = 'Dados recarregados do servidor.'))">Recarregar do servidor</button>
            <button type="button" class="danger" @click="twice('local', () => { clearLocal(); status = 'Rascunhos e documentos locais limpos.' })">{{ confirm2 === 'local' ? 'Clique de novo para confirmar' : 'Limpar rascunhos e documentos locais' }}</button>
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
                <select :value="governance.createProjects" :disabled="!isAdmin" @change="setSetting('governance', 'createProjects', $event.target.value)"><option value="admin">Só administradores</option><option value="member">Administradores e membros</option></select>
              </label>
              <label>Quem apaga tarefas
                <select :value="governance.deleteTasks" :disabled="!isAdmin" @change="setSetting('governance', 'deleteTasks', $event.target.value)"><option value="admin">Só administradores</option><option value="member">Quem criou a tarefa e administradores</option></select>
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
              <button type="submit" class="link">Adicionar domínio</button>
            </form>
          </template>
        </template>

        <template v-else-if="tab === 'schedule'">
          <fieldset class="group">
            <legend>Dias úteis</legend>
            <div class="days">
              <button v-for="(d, i) in WEEKDAYS" :key="d" type="button" :aria-pressed="schedule.days.includes(i)" :disabled="!isAdmin" @click="toggleDay(i)">{{ d }}</button>
            </div>
          </fieldset>
          <fieldset class="group">
            <legend>Horário de trabalho</legend>
            <div class="row">
              <input :value="schedule.start" type="time" aria-label="Início do expediente" :disabled="!isAdmin" @change="setSetting('schedule', 'start', $event.target.value)" />
              <span class="hint">até</span>
              <input :value="schedule.end" type="time" aria-label="Fim do expediente" :disabled="!isAdmin" @change="setSetting('schedule', 'end', $event.target.value)" />
              <span class="hint">{{ fmtHours(dailyHours) }} por dia · {{ fmtHours(dailyHours * schedule.days.length) }} por semana</span>
            </div>
          </fieldset>
          <fieldset class="group">
            <legend>Dias não úteis</legend>
            <form v-if="isAdmin" class="row" @submit.prevent="addHoliday">
              <input v-model="holiday.date" type="date" aria-label="Data da folga" required />
              <input v-model="holiday.name" placeholder="Nome (ex.: Natal)" aria-label="Nome da folga" />
              <button type="submit" class="link">Adicionar</button>
            </form>
            <ul v-if="schedule.holidays.length" class="rows">
              <li v-for="h in schedule.holidays" :key="h.date + h.name"><span class="grow">{{ fmtDate(h.date) }} · {{ h.name }}</span><button v-if="isAdmin" type="button" class="link rm" @click="setSetting('schedule', 'holidays', schedule.holidays.filter((x) => x !== h))">Remover</button></li>
            </ul>
            <p v-else class="hint">Nenhum feriado ou folga ainda.</p>
          </fieldset>
        </template>

        <!-- ================= Produtos ================= -->
        <template v-else-if="tab === 'wiki' || tab === 'ai'">
          <ul class="toggles">
            <template v-if="tab === 'wiki'">
              <li><span>Wiki ligada<small>Documentos do time em Wiki, no trilho da esquerda.</small></span><button type="button" role="switch" class="switch" :aria-checked="products.wiki" aria-label="Wiki ligada" :disabled="!isAdmin" @click="setSetting('products', 'wiki', !products.wiki)"><span /></button></li>
              <li><span>Links públicos de documentos<small>Permite compartilhar um documento com quem não está no workspace.</small></span><button type="button" role="switch" class="switch" :aria-checked="products.wikiPublic" aria-label="Links públicos" :disabled="!isAdmin" @click="setSetting('products', 'wikiPublic', !products.wikiPublic)"><span /></button></li>
            </template>
            <template v-else>
              <li><span>Novexo IA ligada<small>Chat com IA no trilho e no assistente.</small></span><button type="button" role="switch" class="switch" :aria-checked="products.ai" aria-label="Novexo IA ligada" :disabled="!isAdmin" @click="setSetting('products', 'ai', !products.ai)"><span /></button></li>
              <li><span>Usar dados do workspace<small>A IA lê tarefas, projetos e prazos para responder.</small></span><button type="button" role="switch" class="switch" :aria-checked="products.aiContext" aria-label="Usar dados do workspace" :disabled="!isAdmin" @click="setSetting('products', 'aiContext', !products.aiContext)"><span /></button></li>
            </template>
          </ul>
        </template>

        <!-- ================= Recursos ================= -->
        <template v-else-if="tab === 'projects'">
          <p v-if="!proj" class="hint">Nenhum projeto ainda. <RouterLink to="/projetos" class="link">Criar projeto</RouterLink></p>
          <template v-else>
            <div class="form cols">
              <label>Projeto
                <select :value="proj.id" @change="projectId = state.projects.find((p) => String(p.id) === $event.target.value)?.id; confirm2 = ''"><option v-for="p in state.projects" :key="p.id" :value="p.id">{{ p.name }}</option></select>
              </label>
              <label>Nome <input :key="proj.id" :value="proj.name" @change="updateProject(proj, { name: $event.target.value.trim() || proj.name })" /></label>
              <label>Identificador <input :key="`p${proj.id}`" :value="proj.prefix" maxlength="8" @change="updateProject(proj, { prefix: $event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })" /></label>
            </div>
            <fieldset class="group">
              <legend>Cor</legend>
              <div class="swatches">
                <button v-for="[name, hex] in ACCENTS" :key="hex" type="button" class="swatch" :style="{ background: hex }" :aria-pressed="proj.color === hex" :aria-label="name" :title="name" @click="updateProject(proj, { color: hex })" />
              </div>
            </fieldset>
            <h3>Recursos dos projetos (para você)</h3>
            <ul class="toggles">
              <li v-for="[key, label] in FEATURES" :key="key"><span>{{ label }}</span><button type="button" role="switch" class="switch" :aria-checked="state.prefs.features[key]" :aria-label="label" @click="setFeature(key)"><span /></button></li>
            </ul>
            <h3>Zona de perigo</h3>
            <button type="button" class="danger" @click="twice('archive', () => archiveProject(proj).then((ok) => ok && (status = 'Projeto arquivado. Ele fica em Arquivados.')))">{{ confirm2 === 'archive' ? 'Clique de novo para arquivar' : 'Arquivar projeto' }}</button>
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
          <p class="hint">As integrações dependem de conectar contas externas no servidor e ainda não estão disponíveis.</p>
          <ul class="plans">
            <li v-for="name in INTEGRATIONS" :key="name"><strong>{{ name }}</strong><span class="hint">Em breve</span></li>
          </ul>
        </template>

        <template v-else-if="LISTS[tab]">
          <SettingsList :key="tab" v-bind="LISTS[tab]" :query="LISTS[tab].kind ? `?kind=${LISTS[tab].kind}` : ''" :extra="LISTS[tab].kind ? { kind: LISTS[tab].kind } : {}" :can-write="LISTS[tab].admin ? isAdmin : canWrite" />
          <p v-if="tab === 'tokens'" class="hint">Use no cabeçalho <code>Authorization: Token nvx_…</code>. O token completo aparece uma única vez, ao criar.</p>
          <p v-if="tab === 'webhooks'" class="hint">O Novexo vai mandar um POST para a URL a cada evento, assinado com o segredo. O envio ainda está sendo construído; a configuração já fica salva.</p>
        </template>

        <p v-if="status" class="status" role="status">{{ status }}</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page { box-sizing: border-box; display: flex; flex-direction: column; gap: 1rem; max-width: 68rem; height: 100%; padding: 1.25rem 1.5rem; }
h1 { margin: 0; font: 650 1.375rem/1.2 'Geist', system-ui, sans-serif; letter-spacing: -0.02em; color: var(--text); }
.layout { flex: 1; min-height: 0; display: grid; grid-template-columns: 12.5rem minmax(0, 1fr); gap: 1.25rem; align-items: start; }
/* categorias e conteúdo rolam cada um no seu espaço, a página fica parada */
.tabs, .panel { max-height: 100%; overflow-y: auto; overscroll-behavior: contain; }
.tabs { padding-right: 0.25rem; scrollbar-width: thin; }
@media (max-width: 760px) {
  .page { height: auto; }
  .layout { grid-template-columns: minmax(0, 1fr); }
  .tabs, .panel { max-height: none; overflow: visible; }
  .tabs__group { flex-direction: row; flex-wrap: wrap; }
}
.tabs { display: flex; flex-direction: column; gap: 0.75rem; }
.tabs__group { display: flex; flex-direction: column; gap: 1px; }
.tabs__label { padding: 0 0.6rem 0.2rem; font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); }
.tabs button { padding: 0.32rem 0.6rem; border: 0; border-radius: 6px; background: none; font-size: 13px; text-align: left; color: var(--muted); cursor: pointer; }
.tabs button:hover { color: var(--text); }
.tabs button[aria-current='page'] { background: var(--surface-2); color: var(--text); }
.panel { display: flex; flex-direction: column; gap: 0.85rem; min-width: 0; padding: 1rem 1.15rem; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
h2 { margin: 0; font: 600 1rem/1.2 'Geist', system-ui, sans-serif; color: var(--text); }
h3 { margin: 0.25rem 0 0; font-size: 12px; font-weight: 600; color: var(--muted); }
.form { display: flex; flex-direction: column; gap: 0.7rem; max-width: 26rem; }
.cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); gap: 0.7rem 1rem; max-width: none; }
.form label { display: flex; flex-direction: column; gap: 0.3rem; font-size: 12px; font-weight: 500; color: var(--muted); }
:is(.form input, .form select, .row input, .rows input, .rows select) { height: 32px; padding: 0 0.6rem; border: 1px solid var(--line-strong); border-radius: 6px; background: var(--bg); font: inherit; font-size: 13.5px; color: var(--text); outline: none; }
:is(.form input, .form select, .row input, .rows input, .rows select):focus { border-color: var(--accent); }
:is(input, select, button):disabled { opacity: 0.55; cursor: not-allowed; }
.prefix-input { display: flex; align-items: center; border: 1px solid var(--line-strong); border-radius: 6px; background: var(--bg); }
.prefix-input span { padding-left: 0.6rem; font-size: 12.5px; color: var(--muted); white-space: nowrap; }
.form .prefix-input input { flex: 1; min-width: 0; border: 0; padding-left: 0.1rem; }
.hint { margin: 0; font-size: 12px; color: var(--muted); }
.hint code { padding: 0.05rem 0.3rem; border-radius: 4px; background: var(--bg); }
.muted { color: var(--muted); }
.actions { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; }
.link { padding: 0; border: 0; background: none; font-size: 13px; color: var(--accent-soft); text-decoration: none; cursor: pointer; }
.group { display: flex; flex-direction: column; gap: 0.5rem; margin: 0; padding: 0; border: 0; min-width: 0; }
.group legend { margin-bottom: 0.45rem; padding: 0; font-size: 12px; font-weight: 500; color: var(--muted); }
.seg { display: inline-flex; align-self: flex-start; padding: 2px; border: 1px solid var(--line-strong); border-radius: 7px; }
.seg label { position: relative; padding: 0.25rem 0.75rem; border-radius: 5px; font-size: 13px; color: var(--muted); cursor: pointer; }
.seg label:has(input:checked) { background: var(--surface-2); color: var(--text); }
.seg label:has(input:focus-visible) { outline: 2px solid var(--accent-soft); }
.seg input { position: absolute; opacity: 0; pointer-events: none; }
.swatches { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.swatch { width: 22px; height: 22px; padding: 0; border: 0; border-radius: 50%; cursor: pointer; }
.swatch[aria-pressed='true'] { box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px var(--text); }
.toggles { display: grid; grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr)); gap: 0 1.5rem; margin: 0; padding: 0; list-style: none; }
.toggles li { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.5rem 0; border-top: 1px solid var(--line); font-size: 13px; }
.toggles small { display: block; margin-top: 0.1rem; font-size: 11.5px; color: var(--muted); }
.switch { position: relative; flex-shrink: 0; width: 32px; height: 18px; padding: 0; border: 0; border-radius: 999px; background: var(--line-strong); cursor: pointer; transition: background 0.2s var(--ease); }
.switch span { position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: var(--text); transition: translate 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
.switch[aria-checked='true'] { background: var(--accent); }
.switch[aria-checked='true'] span { translate: 14px 0; }
.bar { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; padding: 0.55rem 0.75rem; border: 1px solid var(--line); border-radius: 8px; font-size: 13px; }
.bar.push { margin-top: 0.6rem; }
.push__msg, .push__devices { flex-basis: 100%; }
.push__devices li { justify-content: space-between; }
.rows { display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none; }
.rows li { display: flex; align-items: center; gap: 0.6rem; padding: 0.4rem 0; font-size: 13px; }
.rows li + li { border-top: 1px solid var(--line); }
.grow { flex: 1; min-width: 0; }
.rm { margin-left: auto; color: var(--muted); }
.rm:hover { color: #ff8a80; }
.av { display: grid; place-items: center; flex-shrink: 0; width: 26px; height: 26px; border-radius: 50%; font: 700 10px/1 'Lexend', system-ui, sans-serif; color: #000; }
.plans { display: grid; grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr)); gap: 0.6rem; margin: 0; padding: 0; list-style: none; }
.plans li { display: flex; flex-direction: column; gap: 0.25rem; padding: 0.7rem 0.8rem; border: 1px solid var(--line); border-radius: 8px; font-size: 13px; }
.plans li.on { border-color: var(--accent); }
.days { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.days button { min-width: 2.75rem; padding: 0.3rem 0.5rem; border: 1px solid var(--line-strong); border-radius: 6px; background: none; font-size: 12.5px; color: var(--muted); cursor: pointer; }
.days button[aria-pressed='true'] { border-color: var(--accent); background: var(--accent); color: #fff; }
.row { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
.file { position: relative; align-self: flex-start; }
.file input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.file:focus-within { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
.danger { align-self: flex-start; padding: 0.4rem 0.75rem; border: 1px solid rgb(255 91 77 / 0.4); border-radius: 6px; background: none; font-size: 13px; color: #ff8a80; cursor: pointer; }
.danger:hover { background: rgb(255 91 77 / 0.1); }
.status { margin: 0; font-size: 12.5px; color: var(--accent-soft); }
:is(.tabs button, .link, .switch, .danger, .swatch, .days button):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
.av-img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
.block { display: block; }
</style>
