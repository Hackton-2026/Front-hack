<script setup>
// Novexo IA: conversa com /api/ai/chat/. A IA age pelo usuário (tarefas, comentários, perfil...)
// com as permissões dele; ações sensíveis voltam em "pending" e só rodam se a pessoa clicar em Confirmar.
import { nextTick, ref } from 'vue'
import { gsap, prefersReducedMotion } from '../utils/motion'
import { api } from '../services/api'
import { useAuth } from '../composables/useAuth'
import { useWorkspace } from '../composables/useWorkspace'
import { useOnboarding } from '../composables/useOnboarding'
import AppIcon from '../components/app/AppIcon.vue'
import AsciiSharks from '../components/app/AsciiSharks.vue'
import AiItems from '../components/app/AiItems.vue'
import AiMarkdown from '../components/app/AiMarkdown.vue'
import AiQuestions from '../components/app/AiQuestions.vue'

const SUGGESTIONS = ['O que está atrasado e quem é o responsável?', 'Resuma minhas tarefas desta semana', 'Crie uma tarefa para revisar o contrato amanhã', 'Coloque minha próxima tarefa em andamento']
const { user, loadMe } = useAuth()
const { load, state, createDoc } = useWorkspace()
// A wiki é pessoal e fica neste navegador: vai junto como contexto para a IA poder consultar (o servidor trata como dados)
const wikiContext = () => state.docs.filter((d) => !d.archived).map((d) => ({ title: d.title, body: d.body }))
// Páginas de wiki que a IA criou: quem cria de verdade é o front (a wiki mora aqui)
function applyItems(items = []) {
  for (const it of items) {
    if (it.type === 'wiki' && !it.docId) it.docId = createDoc({ title: it.title, body: it.body || '' }).id
  }
  return items
}
const { complete } = useOnboarding()
const messages = ref([])
const pending = ref([])
const form = ref(null) // formulário da IA (abaixo da resposta dela); as respostas viram a próxima mensagem
let asked = 0 // muda a cada formulário: ele começa limpo
const text = ref('')
const loading = ref(false)
const error = ref('')
const list = ref(null)

const scroll = () => nextTick(() => list.value?.scrollTo({ top: list.value.scrollHeight, behavior: 'smooth' }))
async function animateLast() {
  await nextTick()
  const el = list.value?.lastElementChild
  if (el && !prefersReducedMotion()) gsap.from(el, { y: 10, autoAlpha: 0, duration: 0.35, ease: 'power2.out' })
}
// A IA mudou algo: recarrega tarefas e perfil para as outras telas já mostrarem
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
    const history = messages.value.filter((m) => m.content?.trim()).map(({ role, content }) => ({ role, content }))
    const { reply, changed, pending: toConfirm = [], items = [], form: toAsk = null } = await api('/api/ai/chat/', { method: 'POST', body: { messages: history, wiki: wikiContext() } })
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

async function decide(action, ok) {
  pending.value = pending.value.filter((p) => p !== action)
  error.value = ''
  if (!ok) {
    messages.value.push({ role: 'user', content: `Cancelei: ${action.summary}` })
  } else {
    try {
      const res = await api('/api/ai/confirm/', { method: 'POST', body: { token: action.token } })
      messages.value.push({ role: 'assistant', content: `Feito: ${action.summary}`, items: applyItems(res.items) })
      refresh()
    } catch (e) {
      error.value = describe(e)
    }
  }
  animateLast(); scroll()
}
</script>

<template>
  <div class="ai" :class="{ 'has-chat': messages.length }">
    <AsciiSharks />
    <div class="veil" aria-hidden="true" />

    <div ref="list" class="msgs" aria-live="polite">
      <template v-if="messages.length">
        <template v-for="(m, i) in messages" :key="i">
          <p v-if="m.role === 'user'" class="msg user">{{ m.content }}</p>
          <div v-else class="msg assistant"><AiMarkdown :text="m.content" /><AiItems :items="m.items" /></div>
        </template>
        <div v-for="p in pending" :key="p.token" class="confirm">
          <p>{{ p.summary }}?</p>
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
        <textarea v-model="text" rows="2" placeholder="Pergunte ou peça qualquer coisa à Novexo IA…" aria-label="Mensagem para a IA" maxlength="4000" @keydown.enter.exact.prevent="send()" />
        <div class="composer__bar">
          <span class="hint"><kbd>↵</kbd> enviar · <kbd>⇧</kbd><kbd>↵</kbd> nova linha</span>
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
.ai {
  /* Tokens da página: fundo igual ao das outras telas (--bg). Quando o tema claro existir, é só trocar
     --ai-bg/--ai-text e --ai-shark-filter (os tubarões saem em cinza; o filtro pinta de laranja). */
  --ai-bg: var(--bg);
  /* tira as cores da biblioteca e pinta tudo num laranja só, bem alaranjado */
  --ai-shark-filter: grayscale(1) sepia(1) saturate(5) hue-rotate(-18deg) brightness(1.1);
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
/* Escurece o centro para o texto ficar legível por cima dos tubarões */
.veil { position: absolute; inset: 0; z-index: 0; pointer-events: none; background: radial-gradient(ellipse 42% 38% at 50% 50%, color-mix(in srgb, var(--ai-bg) 88%, transparent), transparent 100%); }
.has-chat .veil { background: linear-gradient(transparent 0%, color-mix(in srgb, var(--ai-bg) 70%, transparent) 40%, color-mix(in srgb, var(--ai-bg) 70%, transparent) 70%, var(--ai-bg) 100%); }

.msgs, .dock { position: relative; z-index: 1; width: 100%; max-width: 46rem; margin: 0 auto; padding: 0 1.5rem; }
.msgs { flex: 0 0 0; display: flex; flex-direction: column; gap: 0.6rem; overflow-y: auto; scrollbar-width: none; }
.msgs::-webkit-scrollbar { display: none; } /* rola com a roda/dedo, sem a barra */
.has-chat .msgs { flex: 1; padding-top: 2rem; padding-bottom: 1rem; }
.dock { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 1.25rem; padding-bottom: 1.25rem; }
.has-chat .dock { flex: 0 0 auto; }

.title { margin: 0 0 0.5rem; text-align: center; text-wrap: balance; font: 300 clamp(2rem, 4.5vw, 3.25rem)/1.1 'Geist', system-ui, sans-serif; letter-spacing: -0.035em; color: var(--ai-text); }

.composer { display: flex; flex-direction: column; gap: 0.25rem; padding: 0.75rem 0.75rem 0.6rem 1rem; border: 1px solid var(--ai-glass-line); border-radius: 16px; background: var(--ai-glass); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); box-shadow: 0 20px 60px -20px rgb(0 0 0 / 0.8); transition: border-color 0.2s var(--ease); }
.composer:focus-within { border-color: color-mix(in srgb, var(--ai-shark) 60%, transparent); }
.composer textarea { min-height: 2.6rem; max-height: 12rem; padding: 0.2rem 0; border: 0; background: none; font: inherit; font-size: 15px; color: var(--ai-text); resize: none; outline: none; field-sizing: content; }
.composer textarea::placeholder { color: var(--ai-muted); }
.composer__bar { display: flex; align-items: center; justify-content: flex-end; gap: 0.75rem; }
.hint { font-size: 12px; color: var(--ai-muted); }
.hint kbd { margin: 0 1px; }
.send { display: grid; place-items: center; width: 34px; height: 34px; padding: 0; border: 0; border-radius: 10px; background: var(--ai-shark); color: #000; cursor: pointer; transition: background 0.2s var(--ease); }
.send:hover:not(:disabled) { background: var(--ai-shark-soft); }
.send:disabled { background: rgb(255 255 255 / 0.08); color: var(--ai-muted); cursor: default; }

.sugs { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem; }
.sug { padding: 0.45rem 0.8rem; border: 1px solid var(--ai-glass-line); border-radius: 999px; background: var(--ai-glass); font-size: 13px; color: var(--ai-muted); cursor: pointer; transition: color 0.2s var(--ease), border-color 0.2s var(--ease); }
.sug:hover { color: var(--ai-text); border-color: color-mix(in srgb, var(--ai-shark) 60%, transparent); }

.msg { max-width: 80%; margin: 0; padding: 0.6rem 0.85rem; border-radius: 14px; white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.5; }
.msg.user { align-self: flex-end; background: var(--ai-shark); color: #000; border-bottom-right-radius: 4px; }
.msg.assistant { align-self: flex-start; border: 1px solid var(--ai-glass-line); background: var(--ai-glass); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-bottom-left-radius: 4px; }
.typing { display: flex; gap: 4px; }
.typing span { width: 6px; height: 6px; border-radius: 50%; background: var(--ai-muted); animation: dot 1s infinite ease-in-out; }
.typing span:nth-child(2) { animation-delay: 0.15s; }
.typing span:nth-child(3) { animation-delay: 0.3s; }
@keyframes dot { 0%, 80%, 100% { opacity: 0.3; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }

.confirm { align-self: flex-start; max-width: 80%; padding: 0.75rem 0.85rem; border: 1px solid color-mix(in srgb, var(--ai-shark) 50%, transparent); border-radius: 14px; background: var(--ai-glass); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.confirm p { margin: 0 0 0.6rem; overflow-wrap: anywhere; }
.confirm__actions { display: flex; gap: 0.5rem; }
.btn { padding: 0.4rem 0.9rem; border: 1px solid var(--ai-glass-line); border-radius: 8px; background: none; font-size: 13px; cursor: pointer; }
.btn--primary { border-color: var(--ai-shark); background: var(--ai-shark); color: #000 !important; }

.error { margin: 0; padding: 0.6rem 0.8rem; border: 1px solid rgb(229 101 21 / 0.4); border-radius: 8px; background: rgb(229 101 21 / 0.1); font-size: 13px; color: #ffd2b3; }
.error a { margin-left: 0.4rem; color: var(--ai-shark-soft); }
:is(.sug, .send, .btn):focus-visible { outline: 2px solid var(--ai-shark-soft); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .typing span { animation: none; } }
.msg.assistant { max-width: 88%; white-space: normal; }
.asks { align-self: flex-start; width: min(100%, 36rem); }
</style>
