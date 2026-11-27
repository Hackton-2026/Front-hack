<script setup>
import { computed, nextTick, ref } from 'vue'
import { EASE, DUR, gsap, prefersReducedMotion } from '../utils/motion'
import { api } from '../services/api'
import { useAuth } from '../composables/useAuth'
import { useWorkspace } from '../composables/useWorkspace'
import { useOnboarding } from '../composables/useOnboarding'
import AppIcon from '../components/app/AppIcon.vue'
import AppSelect from '../components/app/AppSelect.vue'
import AsciiSharks from '../components/app/AsciiSharks.vue'
import AiItems from '../components/app/AiItems.vue'
import AiMarkdown from '../components/app/AiMarkdown.vue'
import AiQuestions from '../components/app/AiQuestions.vue'

const SUGGESTIONS = ['O que está atrasado e quem é o responsável?', 'Resuma minhas tarefas desta semana', 'Crie uma tarefa para revisar o contrato amanhã', 'Coloque minha próxima tarefa em andamento']
const { user, loadMe } = useAuth()
const { load, state, aiEnabled, project, createDoc } = useWorkspace()
const sharkFilter = computed(() => {
  const hex = (state.prefs.accent || '#e56515').replace('#', '')
  if (hex.length !== 6) return 'grayscale(1) sepia(1) saturate(9) hue-rotate(-24deg) brightness(1.15)'
  const r = parseInt(hex.slice(0, 2), 16) / 255
  const g = parseInt(hex.slice(2, 4), 16) / 255
  const b = parseInt(hex.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let h = 0
  if (d) h = ((max === r ? ((g - b) / d + (g < b ? 6 : 0)) : max === g ? ((b - r) / d + 2) : ((r - g) / d + 4)) * 60)
  return `grayscale(1) sepia(1) saturate(8) hue-rotate(${Math.round(h - 46)}deg) brightness(1.1)`
})
const wikiContext = () => state.docs.filter((d) => !d.archived).map((d) => ({ title: d.title, body: d.body }))
function applyItems(items = []) {
  for (const it of items) {
    if (it.type === 'wiki' && !it.docId) it.docId = createDoc({ title: it.title, body: it.body || '' }).id
  }
  return items
}
const { complete } = useOnboarding()
const messages = ref([])
const pending = ref([])
const form = ref(null)
let asked = 0
const text = ref('')
const loading = ref(false)
const error = ref('')
const list = ref(null)

// Explicit project scope selector (Notion-inspired context control)
const scopeProjectId = ref('')
const projectOptions = computed(() => [
  { value: '', label: 'Todo o workspace' },
  ...state.projects.map((p) => ({ value: p.id, label: p.name, color: p.color })),
])
const scopedProject = computed(() => (scopeProjectId.value ? project(Number(scopeProjectId.value)) : null))

const scroll = () => nextTick(() => list.value?.scrollTo({ top: list.value.scrollHeight, behavior: 'smooth' }))
async function animateLast() {
  await nextTick()
  const el = list.value?.lastElementChild
  if (el && !prefersReducedMotion()) gsap.from(el, { y: 10, autoAlpha: 0, duration: DUR.fast, ease: EASE.soft })
}
const refresh = () => { load(); loadMe() }
const describe = (e) => (e.status === 401 ? 'Entre na sua conta para usar a IA.' : e.status === 503 ? 'A IA não está configurada no servidor (falta a GROQ_API_KEY no backend).' : e.message)

async function send(content = text.value.trim()) {
  if (!content || loading.value) return
  messages.value.push({ role: 'user', content })
  text.value = ''
  error.value = ''
  pending.value = []
  form.value = null
  loading.value = true
  complete('ai')
  animateLast(); scroll()
  try {
    const history = messages.value.filter((m) => m.content?.trim()).map(({ role, content }) => ({ role, content: content.slice(0, 4000) })) // o backend recusa mensagem acima de 4000, inclusive a da IA
    const payload = { messages: history, wiki: wikiContext(), ...(scopeProjectId.value ? { project_id: Number(scopeProjectId.value) } : {}) }
    const { reply, changed, pending: toConfirm = [], items = [], form: toAsk = null } = await api('/api/ai/chat/', { method: 'POST', body: payload })
    messages.value.push({ role: 'assistant', content: reply, items: applyItems(items) })
    pending.value = toConfirm
    form.value = toAsk
    asked++
    if (changed) refresh()
  } catch (e) {
    error.value = describe(e)
  } finally {
    loading.value = false
    animateLast(); scroll()
  }
}

const fileInput = ref(null)
async function analyze(e) {
  const file = e.target.files[0]
  e.target.value = ''
  if (!file || loading.value) return
  const prompt = text.value.trim()
  messages.value.push({ role: 'user', content: `Arquivo anexado: ${file.name}${prompt ? `. ${prompt}` : ''}` })
  text.value = ''
  error.value = ''
  loading.value = true
  animateLast(); scroll()
  try {
    const body = new FormData()
    body.append('file', file)
    body.append('prompt', prompt)
    const { reply, items = [] } = await api('/api/ai/analyze/', { method: 'POST', body })
    messages.value.push({ role: 'assistant', content: reply, items: applyItems(items) })
  } catch (err) {
    error.value = describe(err)
  } finally {
    loading.value = false
    animateLast(); scroll()
  }
}

async function decide(action, ok) {
  pending.value = pending.value.filter((p) => p !== action)
  error.value = ''
  if (!ok) {
    messages.value.push({ role: 'user', content: `Cancelei: ${action.summary}` })
  } else {
    try {
      const res = await api('/api/ai/confirm/', { method: 'POST', body: { token: action.token, summary: action.summary } })
      messages.value.push({
        role: 'assistant',
        content: `Feito: ${action.summary}`,
        items: applyItems(res.items),
        undoId: res.undo_id || null,
        undone: false,
        undoing: false,
      })
      refresh()
    } catch (e) {
      error.value = describe(e)
    }
  }
  animateLast(); scroll()
}

async function undoAction(msg) {
  if (!msg.undoId || msg.undone || msg.undoing) return
  msg.undoing = true
  error.value = ''
  try {
    await api('/api/ai/undo/', { method: 'POST', body: { undo_id: msg.undoId } })
    msg.undone = true
    refresh()
  } catch (e) {
    error.value = describe(e)
  } finally {
    msg.undoing = false
  }
}
</script>

<template>
  <div v-if="!aiEnabled" class="ai-off">
    <div class="ai-off__card">
      <span class="ai-off__ic"><AppIcon name="ai" :size="20" /></span>
      <h1>Novexo IA está desligada</h1>
      <p v-if="state.prefs.hideAi">Você ocultou os recursos de IA nas suas preferências pessoais. O restante do workspace continua funcionando normalmente.</p>
      <p v-else>Um administrador desativou a Novexo IA para este workspace em Ajustes → Novexo IA.</p>
      <div class="ai-off__acts">
        <button v-if="state.prefs.hideAi" type="button" class="btn btn--primary" @click="state.prefs.hideAi = false">Reativar IA para mim</button>
        <RouterLink to="/ajustes?tab=prefs" class="btn">Abrir preferências</RouterLink>
      </div>
    </div>
  </div>

  <div v-else class="ai is-viewport" :class="{ 'has-chat': messages.length }" :style="{ '--ai-shark-filter': sharkFilter }">
    <AsciiSharks />
    <div class="veil" aria-hidden="true" />

    <div ref="list" class="msgs" aria-live="polite">
      <template v-if="messages.length">
        <template v-for="(m, i) in messages" :key="i">
          <p v-if="m.role === 'user'" class="msg user">{{ m.content }}</p>
          <div v-else class="msg assistant">
            <AiMarkdown :text="m.content" />
            <AiItems :items="m.items" />
            <div v-if="m.undoId" class="undo-bar">
              <span v-if="m.undone" class="undone-tag"><AppIcon name="check" :size="12" />Ação desfeita</span>
              <button v-else type="button" class="undo-btn" :disabled="m.undoing" @click="undoAction(m)">
                <AppIcon name="undo" :size="12" />{{ m.undoing ? 'Desfazendo…' : 'Desfazer ação' }}
              </button>
            </div>
          </div>
        </template>
        <div v-for="p in pending" :key="p.token" class="confirm">
          <p>{{ p.summary.includes('\n') ? p.summary : `${p.summary}?` }}</p>
          <div class="confirm__actions">
            <button type="button" class="btn btn--primary" @click="decide(p, true)">Confirmar</button>
            <button type="button" class="btn" @click="decide(p, false)">Cancelar</button>
          </div>
        </div>
        <AiQuestions v-if="form" :key="asked" class="asks" :form="form" :disabled="loading" @answer="send" />
        <p v-if="loading" class="msg assistant typing" aria-label="A IA está escrevendo"><span /><span /><span /></p>
      </template>
    </div>

    <div class="dock">
      <h1 v-if="!messages.length" class="title">No que você está pensando?</h1>
      <p v-if="error" class="error" role="alert">{{ error }} <RouterLink v-if="!user" to="/login?next=/ia">Entrar</RouterLink></p>
      <form class="composer" @submit.prevent="send()">
        <div v-if="scopedProject" class="scope-chip">
          <span class="scope-dot" :style="{ background: scopedProject.color || 'var(--accent)' }" />
          <span>Contexto: <strong>{{ scopedProject.name }}</strong></span>
          <button type="button" aria-label="Remover filtro de projeto" @click="scopeProjectId = ''"><AppIcon name="close" :size="12" /></button>
        </div>
        <textarea v-model="text" rows="2" :placeholder="scopedProject ? `Pergunte ou peça algo sobre ${scopedProject.name}…` : 'Pergunte ou peça qualquer coisa à Novexo IA…'" aria-label="Mensagem para a IA" maxlength="4000" @keydown.enter.exact.prevent="send()" />
        <div class="composer__bar">
          <input ref="fileInput" type="file" accept=".pdf,.txt,.md" hidden @change="analyze" />
          <button type="button" class="attach" :disabled="loading" title="Anexar PDF, .txt ou .md para gerar um relatório na wiki" aria-label="Anexar arquivo para relatório" @click="fileInput.click()"><AppIcon name="upload" :size="16" /></button>
          <div v-if="state.projects.length" class="scope-pick">
            <AppSelect v-model="scopeProjectId" size="sm" :options="projectOptions" aria-label="Escopo do projeto" />
          </div>
          <span class="hint"><kbd>↵</kbd> enviar, <kbd>⇧</kbd><kbd>↵</kbd> nova linha</span>
          <button type="submit" class="send" :disabled="loading || !text.trim()" aria-label="Enviar"><AppIcon name="arrow" :size="16" /></button>
        </div>
      </form>
      <div v-if="!messages.length" class="sugs">
        <button v-for="s in SUGGESTIONS" :key="s" type="button" class="sug" @click="send(s)">{{ s }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-off { display: grid; place-items: center; height: 100%; padding: 2rem; }
.ai-off__card { display: flex; flex-direction: column; align-items: flex-start; gap: 0.75rem; max-width: 28rem; padding: 1.75rem; border: 1px solid var(--line); border-radius: 14px; background: var(--surface); }
.ai-off__ic { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 10px; background: var(--surface-2); color: var(--muted); }
.ai-off__card h1 { margin: 0; font: 650 1.25rem/1.25 'Geist', system-ui, sans-serif; color: var(--text); }
.ai-off__card p { margin: 0; font-size: 13.5px; line-height: 1.55; color: var(--muted); }
.ai-off__acts { display: flex; flex-wrap: wrap; gap: 0.55rem; margin-top: 0.3rem; }
.ai-off__acts a { text-decoration: none; color: var(--text); }

.ai {
  --ai-bg: var(--bg);
  --ai-shark-filter: grayscale(1) sepia(1) saturate(9) hue-rotate(-24deg) brightness(1.15);
  --ai-text: var(--text);
  --ai-muted: var(--muted);
  --ai-glass: rgb(24 22 20 / 0.62);
  --ai-glass-line: rgb(255 255 255 / 0.09);
  --ai-shark: var(--accent);
  --ai-shark-soft: var(--accent-soft);
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--ai-bg);
  color: var(--ai-text);
}
:global(.app.is-light .ai) { --ai-glass: rgb(255 255 255 / 0.72); --ai-glass-line: rgb(0 0 0 / 0.1); }
:global(.app.is-light .ai .error) { color: #9a3d06; }
.veil { position: absolute; inset: 0; z-index: 0; pointer-events: none; background: radial-gradient(ellipse 42% 38% at 50% 50%, color-mix(in srgb, var(--ai-bg) 88%, transparent), transparent 100%); }
.has-chat .veil { background: linear-gradient(transparent 0%, color-mix(in srgb, var(--ai-bg) 70%, transparent) 40%, color-mix(in srgb, var(--ai-bg) 70%, transparent) 70%, var(--ai-bg) 100%); }

.msgs, .dock { position: relative; z-index: 1; width: 100%; max-width: 46rem; margin: 0 auto; padding: 0 1.5rem; }
.msgs { flex: 0 0 0; display: flex; flex-direction: column; gap: 0.6rem; overflow-y: auto; scrollbar-width: none; }
.msgs::-webkit-scrollbar { display: none; }
.has-chat .msgs { flex: 1; padding-top: 2rem; padding-bottom: 1rem; }
.dock { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 1.25rem; padding-bottom: 1.25rem; }
.has-chat .dock { flex: 0 0 auto; }

.title { margin: 0 0 0.5rem; text-align: center; text-wrap: balance; font: 300 clamp(2rem, 4.5vw, 3.25rem)/1.1 'Geist', system-ui, sans-serif; letter-spacing: -0.035em; color: var(--ai-text); }

.composer { display: flex; flex-direction: column; gap: 0.35rem; padding: 0.75rem 0.75rem 0.6rem 1rem; border: 1px solid var(--ai-glass-line); border-radius: 16px; background: var(--ai-glass); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); box-shadow: 0 20px 60px -20px rgb(0 0 0 / 0.8); transition: border-color 0.2s var(--ease); }
.composer:focus-within { border-color: color-mix(in srgb, var(--ai-shark) 60%, transparent); }
.scope-chip { display: inline-flex; align-items: center; align-self: flex-start; gap: 0.4rem; padding: 0.2rem 0.45rem 0.2rem 0.55rem; border: 1px solid color-mix(in srgb, var(--ai-shark) 40%, var(--ai-glass-line)); border-radius: 999px; background: color-mix(in srgb, var(--ai-shark) 12%, transparent); font-size: 12px; color: var(--ai-text); }
.scope-chip strong { font-weight: 600; }
.scope-chip button { display: grid; place-items: center; padding: 0.1rem; border: 0; border-radius: 50%; background: none; color: var(--ai-muted); cursor: pointer; }
.scope-chip button:hover { color: var(--ai-text); }
.scope-dot { width: 7px; height: 7px; border-radius: 50%; }
.composer textarea { min-height: 2.6rem; max-height: 12rem; padding: 0.2rem 0; border: 0; background: none; font: inherit; font-size: 15px; color: var(--ai-text); resize: none; outline: none; field-sizing: content; }
.composer textarea::placeholder { color: var(--ai-muted); }
.composer__bar { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem; }
.scope-pick { margin-right: auto; }
.hint { font-size: 12px; color: var(--ai-muted); }
.attach { display: grid; place-items: center; width: 34px; height: 34px; padding: 0; border: 1px solid var(--ai-glass-line); border-radius: 10px; background: none; color: var(--ai-muted); cursor: pointer; transition: color 0.16s var(--ease), border-color 0.16s var(--ease), transform 0.12s var(--ease); }
.attach:hover:not(:disabled) { border-color: var(--ai-shark); color: var(--ai-text); }
.attach:focus-visible { outline: 2px solid var(--ai-shark); outline-offset: 2px; }
.hint kbd { margin: 0 1px; }
.send { display: grid; place-items: center; width: 34px; height: 34px; padding: 0; border: 0; border-radius: 10px; background: var(--ai-shark); color: #000; cursor: pointer; transition: background 0.16s var(--ease), transform 0.12s var(--ease); }
.send:hover:not(:disabled) { background: var(--ai-shark-soft); }
.send:active:not(:disabled), .attach:active:not(:disabled), .btn:active, .sug:active, .undo-btn:active { transform: scale(0.97); }
.send:disabled { background: var(--ai-glass-line); color: var(--ai-muted); cursor: default; }

.sugs { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem; }
.sug { padding: 0.45rem 0.8rem; border: 1px solid var(--ai-glass-line); border-radius: 999px; background: var(--ai-glass); font-size: 13px; color: var(--ai-muted); cursor: pointer; transition: color 0.16s var(--ease), border-color 0.16s var(--ease), transform 0.12s var(--ease); }
.sug:hover { color: var(--ai-text); border-color: color-mix(in srgb, var(--ai-shark) 60%, transparent); }

.msg { max-width: 80%; margin: 0; padding: 0.6rem 0.85rem; border-radius: 14px; white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.5; }
.msg.user { align-self: flex-end; background: var(--ai-shark); color: #000; border-bottom-right-radius: 4px; }
.msg.assistant { align-self: flex-start; max-width: 88%; white-space: normal; border: 1px solid var(--ai-glass-line); background: var(--ai-glass); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-bottom-left-radius: 4px; }
.undo-bar { display: flex; align-items: center; margin-top: 0.55rem; padding-top: 0.45rem; border-top: 1px solid var(--ai-glass-line); }
.undo-btn { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.25rem 0.6rem; border: 1px solid var(--ai-glass-line); border-radius: 6px; background: none; font-size: 12px; font-weight: 500; color: var(--ai-muted); cursor: pointer; transition: color 0.15s var(--ease), border-color 0.15s var(--ease), transform 0.12s var(--ease); }
.undo-btn:hover:not(:disabled) { border-color: var(--ai-shark); color: var(--ai-text); }
.undo-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.undone-tag { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 12px; color: var(--ai-muted); }

.typing { display: flex; gap: 4px; }
.typing span { width: 6px; height: 6px; border-radius: 50%; background: var(--ai-muted); animation: dot 1s infinite ease-in-out; }
.typing span:nth-child(2) { animation-delay: 0.15s; }
.typing span:nth-child(3) { animation-delay: 0.3s; }
@keyframes dot { 0%, 80%, 100% { opacity: 0.3; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }

.confirm { align-self: flex-start; max-width: 80%; padding: 0.75rem 0.85rem; border: 1px solid color-mix(in srgb, var(--ai-shark) 50%, transparent); border-radius: 14px; background: var(--ai-glass); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.confirm p { margin: 0 0 0.6rem; overflow-wrap: anywhere; white-space: pre-line; }
.confirm__actions { display: flex; gap: 0.5rem; }
.btn { padding: 0.4rem 0.9rem; border: 1px solid var(--line-strong); border-radius: 8px; background: none; font-size: 13px; color: var(--text); cursor: pointer; transition: transform 0.12s var(--ease), border-color 0.15s var(--ease); }
.btn--primary { border-color: var(--accent); background: var(--accent); color: #000 !important; font-weight: 600; }

.error { margin: 0; padding: 0.6rem 0.8rem; border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent); border-radius: 8px; background: color-mix(in srgb, var(--accent) 10%, transparent); font-size: 13px; color: var(--accent-soft); }
.error a { margin-left: 0.4rem; color: var(--ai-shark-soft); }
:is(.sug, .send, .btn, .undo-btn):focus-visible { outline: 2px solid var(--ai-shark-soft); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  .typing span { animation: none; }
  .send:active, .attach:active, .btn:active, .sug:active, .undo-btn:active { transform: none; }
}
.asks { align-self: flex-start; width: min(100%, 36rem); }
</style>
