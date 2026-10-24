<script setup>
// Ajustes > Integrações: o que já funciona sem instalar nada (GitHub, Google Agenda, Google Meet) e o que vem depois.
import { computed, onMounted, ref } from 'vue'
import { api } from '../../services/api'
import { useWorkspace } from '../../composables/useWorkspace'
import { useUi } from '../../composables/useUi'
import AppIcon from './AppIcon.vue'
import AppSelect from './AppSelect.vue'
import BrandIcon from './BrandIcon.vue'

const SOON = [['GitLab', 'gitlab'], ['Slack', 'slack'], ['Google Drive', 'googledrive'], ['Figma', 'figma'], ['Notion', 'notion'], ['Jira', 'jira'], ['Sentry', 'sentry']]
const { state, load } = useWorkspace()
const { toast } = useUi()

// ---- GitHub: repositório vira projeto, issues abertas viram tarefas
const repo = ref('')
const token = ref('')
const target = ref(null) // null = projeto novo
const importing = ref(false)
const ghMsg = ref(null) // { ok, text, project? }
const targets = computed(() => [{ value: null, label: 'Criar um projeto novo' }, ...state.projects.filter((p) => ['edit', 'full'].includes(p.my_permission)).map((p) => ({ value: p.id, label: `Completar ${p.name}`, color: p.color }))])
async function importRepo() {
  if (!repo.value.trim()) return
  importing.value = true
  ghMsg.value = null
  try {
    const r = await api('/api/integrations/github/import/', { method: 'POST', body: { repo: repo.value.trim(), token: token.value.trim() || undefined, project: target.value || undefined } })
    ghMsg.value = { ok: true, project: r.project, text: `${r.created} ${r.created === 1 ? 'issue virou tarefa' : 'issues viraram tarefas'} em ${r.project_name}${r.skipped ? ` (${r.skipped} já tinham vindo antes)` : ''}.` }
    repo.value = ''
    token.value = ''
    load()
  } catch (e) {
    ghMsg.value = { ok: false, text: e.message }
  } finally {
    importing.value = false
  }
}

// ---- Google Agenda: link secreto (.ics) com as minhas tarefas que têm prazo
const cal = ref(null) // { url, webcal }
const local = computed(() => cal.value && /\/\/(localhost|127\.0\.0\.1)[:/]/.test(cal.value.url))
const googleUrl = computed(() => cal.value && `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(cal.value.webcal)}`)
async function loadCal(reset = false) {
  try { cal.value = await api('/api/calendar/', reset ? { method: 'POST' } : {}) } catch (e) { toast(e.message) }
  if (reset) toast('Link novo gerado. Quem tinha o antigo para de ver suas tarefas.')
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast('Link copiado.') } catch { toast('Não deu para copiar. Selecione o link e copie.') }
}
onMounted(() => loadCal())
</script>

<template>
  <div class="integrations">
    <!-- GitHub -->
    <section class="card">
      <header><span class="logo"><BrandIcon name="github" :size="18" /></span><div><h3>GitHub</h3><p>Traga um repositório como projeto: cada issue aberta vira uma tarefa, com as etiquetas e o link de volta para o GitHub.</p></div></header>
      <form class="gh" @submit.prevent="importRepo">
        <input v-model="repo" placeholder="dono/repositório ou link do GitHub" aria-label="Repositório do GitHub" autocomplete="off" spellcheck="false" />
        <AppSelect v-model="target" :options="targets" aria-label="Para onde vão as tarefas" />
        <input v-model="token" type="password" placeholder="Token (só para repositório privado)" aria-label="Token do GitHub" autocomplete="off" />
        <button type="submit" class="pg-btn primary" :disabled="importing || !repo.trim()">{{ importing ? 'Importando…' : 'Importar issues' }}</button>
      </form>
      <p v-if="ghMsg" class="msg" :class="{ bad: !ghMsg.ok }" role="status">
        {{ ghMsg.text }} <RouterLink v-if="ghMsg.project" :to="`/projetos/${ghMsg.project}`">Abrir projeto</RouterLink>
      </p>
      <p class="hint">Repositório público funciona sem token (o GitHub deixa 60 consultas por hora). Importar de novo só traz as issues novas. O token não fica salvo.</p>
    </section>

    <!-- Google Agenda -->
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
      <p v-else class="hint">Carregando…</p>
    </section>

    <!-- Google Meet -->
    <section class="card">
      <header><span class="logo"><BrandIcon name="googlemeet" :size="18" /></span><div><h3>Google Meet</h3><p>No chat de cada projeto tem o botão de chamada: cria uma sala do Meet e manda o link para o time entrar com um clique.</p></div></header>
    </section>

    <section class="card soon">
      <h3>Em breve</h3>
      <ul><li v-for="[name, slug] in SOON" :key="name"><BrandIcon :name="slug" :size="14" />{{ name }}</li></ul>
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
.soon ul { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0; padding: 0; list-style: none; }
.soon li { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.2rem 0.55rem; border: 1px solid var(--line); border-radius: 6px; font-size: 12.5px; color: var(--muted); }
:is(.link-btn):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
@media (max-width: 560px) { .gh { grid-template-columns: 1fr; } }
</style>
