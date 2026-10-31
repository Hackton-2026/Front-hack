<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { api } from '../../services/api'
import { useWorkspace } from '../../composables/useWorkspace'
import { useUi } from '../../composables/useUi'
import { useOnboarding } from '../../composables/useOnboarding'
import AppIcon from './AppIcon.vue'
import AppSelect from './AppSelect.vue'
import BrandIcon from './BrandIcon.vue'

const IMPORTS = [
  { id: 'gitlab', name: 'GitLab', text: 'Cada issue aberta de um projeto do GitLab.com vira tarefa, com as etiquetas.', hint: 'Projeto público funciona sem token. Para privado, use um token com permissão read_api.', fields: [{ key: 'repo', label: 'grupo/projeto ou link do GitLab' }, { key: 'token', label: 'Token (só para projeto privado)', secret: true, optional: true }] },
  { id: 'jira', name: 'Jira', text: 'Cada item não concluído de um projeto do Jira Cloud vira tarefa.', hint: 'Crie o token em id.atlassian.com, em Segurança > Tokens de API.', fields: [{ key: 'site', label: 'empresa.atlassian.net' }, { key: 'key', label: 'Chave do projeto, como NVX' }, { key: 'email', label: 'Seu e-mail do Jira' }, { key: 'token', label: 'Token da API', secret: true }] },
  { id: 'sentry', name: 'Sentry', text: 'Cada erro não resolvido vira tarefa, com o link para o Sentry.', hint: 'Crie o token em Settings > Auth Tokens, com permissão event:read.', fields: [{ key: 'org', label: 'Organização' }, { key: 'project_slug', label: 'Projeto no Sentry' }, { key: 'token', label: 'Token', secret: true }] },
  { id: 'notion', name: 'Notion', text: 'Cada página de um banco de dados do Notion vira tarefa, com o link para a página.', hint: 'Crie a integração em notion.so/my-integrations e conecte-a ao banco de dados (Conexões).', fields: [{ key: 'database', label: 'Link do banco de dados' }, { key: 'token', label: 'Token da integração', secret: true }] },
  { id: 'figma', name: 'Figma', text: 'Cada comentário aberto de um arquivo do Figma vira tarefa.', hint: 'Crie o token em Settings > Security no Figma, com leitura de arquivos e comentários.', fields: [{ key: 'file', label: 'Link do arquivo' }, { key: 'token', label: 'Token', secret: true }] },
]
const { state, load } = useWorkspace()
const { toast } = useUi()
const { complete } = useOnboarding()

const repo = ref('')
const token = ref('')
const target = ref(null)
const importing = ref(false)
const ghMsg = ref(null)
const targets = computed(() => [{ value: null, label: 'Criar um projeto novo' }, ...state.projects.filter((p) => ['edit', 'full'].includes(p.my_permission)).map((p) => ({ value: p.id, label: `Completar ${p.name}`, color: p.color }))])
async function importRepo() {
  if (!repo.value.trim()) return
  importing.value = true
  ghMsg.value = null
  try {
    const r = await api('/api/integrations/github/import/', { method: 'POST', body: { repo: repo.value.trim(), token: token.value.trim() || undefined, project: target.value || undefined } })
    ghMsg.value = { ok: true, project: r.project, text: `${r.created} ${r.created === 1 ? 'issue virou tarefa' : 'issues viraram tarefas'} em ${r.project_name}${r.skipped ? ` (${r.skipped} já tinham vindo antes)` : ''}.${r.more ? ' Ainda há mais issues: importe de novo para trazer as próximas.' : ''}` }
    complete('integration')
    if (!r.more) repo.value = ''
    token.value = ''
    await load()
    target.value = r.more ? r.project : null  // importar de novo tem de completar este projeto, não criar outro igual
  } catch (e) {
    ghMsg.value = { ok: false, text: e.message }
  } finally {
    importing.value = false
  }
}

const forms = reactive(Object.fromEntries(IMPORTS.map((i) => [i.id, { values: {}, target: null, busy: false, msg: null }])))
const ready = (i) => i.fields.every((f) => f.optional || forms[i.id].values[f.key]?.trim())
async function importFrom(i) {
  const form = forms[i.id]
  form.busy = true
  form.msg = null
  try {
    const r = await api(`/api/integrations/${i.id}/import/`, { method: 'POST', body: { ...form.values, project: form.target || undefined } })
    form.msg = { ok: true, project: r.project, text: `${r.created} ${r.created === 1 ? 'item virou tarefa' : 'itens viraram tarefas'} em ${r.project_name}${r.skipped ? ` (${r.skipped} já tinham vindo antes)` : ''}.${r.more ? ' Ainda há mais: importe de novo para trazer os próximos.' : ''}` }
    complete('integration')
    const { token: _token, ...rest } = form.values
    form.values = r.more ? rest : {}
    await load()
    form.target = r.more ? r.project : null  // importar de novo tem de completar este projeto, não criar outro igual
  } catch (e) {
    form.msg = { ok: false, text: e.message }
  } finally {
    form.busy = false
  }
}

const CHATS = [
  { id: 'slack', name: 'Slack', placeholder: 'https://hooks.slack.com/services/…', hint: 'No Slack, crie um app em api.slack.com/apps, ative Incoming Webhooks e copie o endereço do canal.' },
  { id: 'discord', name: 'Discord', placeholder: 'https://discord.com/api/webhooks/…', hint: 'No Discord, abra as configurações do canal, vá em Integrações > Webhooks, crie um e copie o URL.' },
]
const CHAT_URL = { slack: /^https:\/\/hooks\.slack\.com\//, discord: /^https:\/\/(discord|discordapp)\.com\/api\/webhooks\// }
const chats = reactive(Object.fromEntries(CHATS.map((c) => [c.id, { url: '', hooks: [], msg: null, busy: false }])))
async function loadChats() {
  if (!state.isAdmin) return
  try {
    const hooks = await api('/api/webhooks/')
    for (const c of CHATS) chats[c.id].hooks = hooks.filter((w) => CHAT_URL[c.id].test(w.url))
  } catch { /* quem não é admin não lista */ }
}
async function connectChat(c) {
  const chat = chats[c.id]
  chat.busy = true
  chat.msg = null
  try {
    await api(`/api/integrations/${c.id}/test/`, { method: 'POST', body: { url: chat.url.trim() } })
    await api('/api/webhooks/', { method: 'POST', body: { url: chat.url.trim(), events: [] } })
    complete('integration')
    chat.url = ''
    chat.msg = { ok: true, text: 'Conectado. Mandamos uma mensagem de teste para o canal.' }
    await loadChats()
  } catch (e) {
    chat.msg = { ok: false, text: e.message }
  } finally {
    chat.busy = false
  }
}
async function removeChat(w) {
  try {
    await api(`/api/webhooks/${w.id}/`, { method: 'DELETE' })
    await loadChats()
  } catch (e) { toast(e.message) }
}

const driveUrl = ref('')
const driveName = ref('')
const driveTarget = ref(null)
const driveMsg = ref(null)
const driveProjects = computed(() => targets.value.filter((t) => t.value))
const isDrive = (url) => /^https:\/\/(drive|docs)\.google\.com\//.test(url)
async function saveDrive() {
  driveMsg.value = null
  if (!isDrive(driveUrl.value.trim())) { driveMsg.value = { ok: false, text: 'Cole um link do Google Drive ou do Google Docs.' }; return }
  try {
    await api(`/api/projects/${driveTarget.value}/links/`, { method: 'POST', body: { url: driveUrl.value.trim(), name: driveName.value.trim() } })
    driveMsg.value = { ok: true, project: driveTarget.value, text: 'Link salvo nos materiais de apoio do projeto.' }
    driveUrl.value = ''
    driveName.value = ''
  } catch (e) {
    driveMsg.value = { ok: false, text: e.message }
  }
}

const cal = ref(null)
const local = computed(() => cal.value && /\/\/(localhost|127\.0\.0\.1)[:/]/.test(cal.value.url))
const googleUrl = computed(() => cal.value && `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(cal.value.webcal)}`)
async function loadCal(reset = false) {
  try { cal.value = await api('/api/calendar/', reset ? { method: 'POST' } : {}) } catch (e) { toast(e.message) }
  if (reset) toast('Link novo gerado. Quem tinha o antigo para de ver suas tarefas.')
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast('Link copiado.') } catch { toast('Não deu para copiar. Selecione o link e copie.') }
}
onMounted(() => { loadCal(); loadChats() })
</script>

<template>
  <div class="integrations">
    <section class="card">
      <header><span class="logo"><BrandIcon name="github" :size="18" /></span><div><h3>GitHub</h3><p>Traga um repositório como projeto: cada issue aberta vira uma tarefa, com as etiquetas e o link de volta para o GitHub.</p></div></header>
      <form class="gh" @submit.prevent="importRepo">
        <input v-model="repo" placeholder="dono/repositório ou link do GitHub" aria-label="Repositório do GitHub" autocomplete="off" spellcheck="false" />
        <AppSelect v-model="target" :options="targets" aria-label="Para onde vão as tarefas" />
        <input v-model="token" type="password" placeholder="Token (só para repositório privado)" aria-label="Token do GitHub" autocomplete="off" />
        <button type="submit" class="pg-btn primary" :disabled="importing || !repo.trim()"><ArcLoader v-if="importing" />{{ importing ? 'Importando…' : 'Importar issues' }}</button>
      </form>
      <p v-if="ghMsg" class="msg" :class="{ bad: !ghMsg.ok }" role="status">
        {{ ghMsg.text }} <RouterLink v-if="ghMsg.project" :to="`/projetos/${ghMsg.project}`">Abrir projeto</RouterLink>
      </p>
      <p class="hint">Repositório público funciona sem token (o GitHub deixa 60 consultas por hora). Para atualizar depois, escolha o mesmo projeto: só vêm as issues novas. O token não fica salvo.</p>
    </section>

    <section class="card">
      <header><span class="logo"><BrandIcon name="googlecalendar" :size="18" /></span><div><h3>Google Agenda</h3><p>Suas tarefas com prazo aparecem no Google Agenda (ou Apple e Outlook) e atualizam sozinhas.</p></div></header>
      <template v-if="cal">
        <div class="link">
          <code>{{ cal.url }}</code>
          <button type="button" class="pg-btn" @click="copy(cal.url)">Copiar</button>
        </div>
        <div class="row">
          <a class="pg-btn primary" :href="googleUrl" target="_blank" rel="noopener">Adicionar ao Google Agenda</a>
          <a class="pg-btn" :href="cal.url" download="novexo.ics">Baixar .ics</a>
          <button type="button" class="link-btn" @click="loadCal(true)">Gerar link novo</button>
        </div>
        <p v-if="local" class="msg bad">Este link aponta para o seu computador (localhost): o Google não consegue buscar daqui. Use "Baixar .ics" e importe no Google Agenda, ou assine quando o site estiver no ar.</p>
        <p class="hint">O Google atualiza agendas assinadas por link a cada algumas horas. Em cada tarefa também tem "Adicionar ao Google Agenda" no menu ⋯. Não compartilhe o link: quem tiver ele vê suas tarefas.</p>
      </template>
      <p v-else class="hint"><ArcLoader />Carregando…</p>
    </section>

    <section class="card">
      <header><span class="logo"><BrandIcon name="googlemeet" :size="18" /></span><div><h3>Google Meet</h3><p>No chat de cada projeto tem o botão de chamada: cria uma sala do Meet e manda o link para o time entrar com um clique.</p></div></header>
    </section>

    <section v-for="i in IMPORTS" :key="i.id" class="card">
      <header><span class="logo"><BrandIcon :name="i.id" :size="18" /></span><div><h3>{{ i.name }}</h3><p>{{ i.text }}</p></div></header>
      <form class="gh" @submit.prevent="importFrom(i)">
        <input v-for="f in i.fields" :key="f.key" v-model="forms[i.id].values[f.key]" :type="f.secret ? 'password' : 'text'" :placeholder="f.label" :aria-label="f.label" autocomplete="off" spellcheck="false" />
        <AppSelect v-model="forms[i.id].target" :options="targets" aria-label="Para onde vão as tarefas" />
        <button type="submit" class="pg-btn primary" :disabled="forms[i.id].busy || !ready(i)"><ArcLoader v-if="forms[i.id].busy" />{{ forms[i.id].busy ? 'Importando…' : 'Importar' }}</button>
      </form>
      <p v-if="forms[i.id].msg" class="msg" :class="{ bad: !forms[i.id].msg.ok }" role="status">
        {{ forms[i.id].msg.text }} <RouterLink v-if="forms[i.id].msg.project" :to="`/projetos/${forms[i.id].msg.project}`">Abrir projeto</RouterLink>
      </p>
      <p class="hint">{{ i.hint }} O token não fica salvo. Para atualizar depois, escolha o mesmo projeto: só vem o que é novo.</p>
    </section>

    <section v-for="c in CHATS" :key="c.id" class="card">
      <header><span class="logo"><BrandIcon :name="c.id" :size="18" /></span><div><h3>{{ c.name }}</h3><p>As novidades do workspace aparecem em um canal: tarefas, projetos e membros.</p></div></header>
      <template v-if="state.isAdmin">
        <div v-for="w in chats[c.id].hooks" :key="w.id" class="link">
          <code>Canal conectado (…{{ w.url.slice(-6) }})</code>
          <button type="button" class="pg-btn" @click="removeChat(w)">Desconectar</button>
        </div>
        <form class="gh" @submit.prevent="connectChat(c)">
          <input v-model="chats[c.id].url" type="password" :placeholder="c.placeholder" :aria-label="`Endereço do webhook do ${c.name}`" autocomplete="off" />
          <button type="submit" class="pg-btn primary" :disabled="chats[c.id].busy || !chats[c.id].url.trim()"><ArcLoader v-if="chats[c.id].busy" />{{ chats[c.id].busy ? 'Testando…' : 'Conectar' }}</button>
        </form>
        <p v-if="chats[c.id].msg" class="msg" :class="{ bad: !chats[c.id].msg.ok }" role="status">{{ chats[c.id].msg.text }}</p>
        <p class="hint">{{ c.hint }} Só administradores veem e mudam este endereço.</p>
      </template>
      <p v-else class="hint">Só quem administra o workspace conecta o {{ c.name }}.</p>
    </section>

    <section class="card">
      <header><span class="logo"><BrandIcon name="googledrive" :size="18" /></span><div><h3>Google Drive</h3><p>Guarde pastas e arquivos do Drive nos materiais de apoio do projeto.</p></div></header>
      <form class="gh" @submit.prevent="saveDrive">
        <input v-model="driveUrl" placeholder="Link da pasta ou do arquivo" aria-label="Link do Google Drive" autocomplete="off" spellcheck="false" />
        <input v-model="driveName" placeholder="Nome (opcional)" aria-label="Nome do link" autocomplete="off" />
        <AppSelect v-model="driveTarget" :options="driveProjects" placeholder="Escolher projeto" aria-label="Projeto" />
        <button type="submit" class="pg-btn primary" :disabled="!driveUrl.trim() || !driveTarget">Salvar link</button>
      </form>
      <p v-if="driveMsg" class="msg" :class="{ bad: !driveMsg.ok }" role="status">
        {{ driveMsg.text }} <RouterLink v-if="driveMsg.project" :to="`/projetos/${driveMsg.project}/visao-geral`">Abrir projeto</RouterLink>
      </p>
      <p class="hint">O Novexo guarda o link: quem abre precisa ter acesso ao arquivo no Drive.</p>
    </section>
  </div>
</template>

<style scoped>
.integrations { display: flex; flex-direction: column; gap: 0.9rem; max-width: 46rem; }
.card { display: flex; flex-direction: column; gap: 0.75rem; padding: 1rem 1.1rem; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
header { display: flex; align-items: flex-start; gap: 0.8rem; }
.logo { display: grid; place-items: center; flex-shrink: 0; width: 36px; height: 36px; border-radius: 8px; background: var(--surface-2); color: var(--text); }
h3 { margin: 0 0 0.15rem; font-size: 14px; font-weight: 600; color: var(--text); }
header p { margin: 0; font-size: 13px; line-height: 1.5; color: var(--muted); }
.gh { display: grid; grid-template-columns: 1fr auto; gap: 0.5rem; }
.gh input { min-width: 0; height: 32px; padding: 0 0.65rem; border: 1px solid var(--line-strong); border-radius: 7px; background: var(--bg); font: inherit; font-size: 13px; color: var(--text); outline: none; }
.gh input:focus { border-color: var(--text); }
.gh .pg-btn { justify-content: center; height: 32px; }
.link { display: flex; align-items: center; gap: 0.5rem; }
.link code { flex: 1; min-width: 0; overflow: hidden; padding: 0.4rem 0.6rem; border: 1px solid var(--line); border-radius: 7px; background: var(--bg); font: 12px/1.4 'Geist Mono', monospace; color: var(--muted); text-overflow: ellipsis; white-space: nowrap; }
.row { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
.row .pg-btn { text-decoration: none; }
.link-btn { margin-left: auto; padding: 0; border: 0; background: none; font-size: 12.5px; color: var(--muted); cursor: pointer; }
.link-btn:hover { color: var(--text); }
.msg { margin: 0; padding: 0.5rem 0.7rem; border: 1px solid var(--line-strong); border-radius: 7px; font-size: 12.5px; color: var(--text); }
.msg.bad { border-color: rgb(255 91 77 / 0.4); background: rgb(255 91 77 / 0.07); }
.msg a { margin-left: 0.3rem; color: var(--text); }
.hint { margin: 0; font-size: 12px; line-height: 1.5; color: var(--muted); }
:is(.link-btn):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
@media (max-width: 560px) { .gh { grid-template-columns: 1fr; } }
</style>
