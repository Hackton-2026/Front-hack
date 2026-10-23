<script setup>
// Chat do projeto: todo mundo que participa conversa aqui. Escrever @novexo chama a Novexo IA, que responde no chat
// agindo como quem chamou (com as permissões dessa pessoa). Mensagens novas chegam a cada poucos segundos.
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { api } from '../services/api'
import { useWorkspace } from '../composables/useWorkspace'
import { useUi } from '../composables/useUi'
import { gsap, prefersReducedMotion } from '../utils/motion'
import AppIcon from '../components/app/AppIcon.vue'
import AiItems from '../components/app/AiItems.vue'
import AiMarkdown from '../components/app/AiMarkdown.vue'

const POLL_MS = 3000
const props = defineProps({ id: { type: [String, Number], required: true } })
const { state, project, projectMessages, sendProjectMessage, load } = useWorkspace()
const ui = useUi()

const pid = computed(() => Number(props.id))
const p = computed(() => project(pid.value))
const messages = ref([])
const text = ref('')
const sending = ref(false)
const thinking = ref(false) // a IA está respondendo
const error = ref('')
const pending = ref([]) // ações sensíveis que a IA pediu para quem chamou
const list = ref(null)
const input = ref(null)
let timer
let generation = 0 // trocou de projeto: respostas atrasadas do projeto anterior são ignoradas

const lastId = () => messages.value.at(-1)?.id
const callsAi = computed(() => /@novexo\b/i.test(text.value))

function add(items) {
  const known = new Set(messages.value.map((m) => m.id))
  const fresh = items.filter((m) => !known.has(m.id))
  if (!fresh.length) return
  const atBottom = !list.value || list.value.scrollHeight - list.value.scrollTop - list.value.clientHeight < 80
  messages.value = [...messages.value, ...fresh].sort((a, b) => a.id - b.id)
  if (atBottom) scrollDown(fresh.length < messages.value.length)
}
async function scrollDown(animate) {
  await nextTick()
  if (!list.value) return
  list.value.scrollTo({ top: list.value.scrollHeight, behavior: animate ? 'smooth' : 'auto' })
  const last = list.value.querySelector('.msg:last-of-type')
  if (animate && last && !prefersReducedMotion()) gsap.from(last, { y: 8, autoAlpha: 0, duration: 0.3, ease: 'power2.out' })
}

async function poll() {
  const gen = generation
  if (document.hidden) return
  try {
    const items = await projectMessages(pid.value, lastId())
    if (gen === generation) add(items)
  } catch { /* tenta de novo no próximo ciclo */ }
}
async function start() {
  generation++
  const gen = generation
  clearInterval(timer)
  messages.value = []
  pending.value = []
  error.value = ''
  try {
    const items = await projectMessages(pid.value)
    if (gen !== generation) return
    messages.value = items
    scrollDown(false)
  } catch (e) {
    error.value = e.status === 404 ? 'Projeto não encontrado ou você não participa mais dele.' : e.message
    return
  }
  timer = setInterval(poll, POLL_MS)
}
watch(pid, start)
onMounted(() => { start(); document.addEventListener('visibilitychange', poll) })
onUnmounted(() => { generation++; clearInterval(timer); document.removeEventListener('visibilitychange', poll) })
watch(p, (v) => (ui.ui.crumb = v ? `${v.name} › Chat` : 'Chat'), { immediate: true })

async function send() {
  const body = text.value.trim()
  if (!body || sending.value) return
  sending.value = true
  thinking.value = /@novexo\b/i.test(body)
  error.value = ''
  pending.value = []
  const gen = generation
  try {
    const res = await sendProjectMessage(pid.value, body)
    text.value = ''
    if (gen !== generation) return
    add(res.messages)
    pending.value = res.pending || []
    if (res.ai_error) error.value = `A Novexo IA não respondeu: ${res.ai_error}`
    if (res.changed) load() // a IA mudou tarefas: o resto do app atualiza
  } catch (e) {
    error.value = e.message // a mensagem continua na caixa para tentar de novo
  } finally {
    sending.value = false
    thinking.value = false
    input.value?.focus()
  }
}
function mentionAi() {
  if (!callsAi.value) text.value = `@novexo ${text.value}`.trimEnd() + ' '
  input.value?.focus()
}
async function decide(action, ok) {
  pending.value = pending.value.filter((x) => x !== action)
  if (!ok) return
  try {
    await api('/api/ai/confirm/', { method: 'POST', body: { token: action.token } })
    ui.toast(`Feito: ${action.summary}`)
    load()
  } catch (e) {
    error.value = e.message
  }
}

// @menções destacadas e **negrito** (a IA às vezes usa). O texto continua escapado pelo Vue: só separamos em pedaços.
const parts = (body) => body.split(/(\*\*[^*\n]+\*\*|@[\wÀ-ÿ.-]+)/g).filter(Boolean)
  .map((t) => (t.startsWith('**') && t.endsWith('**') && t.length > 4 ? { t: t.slice(2, -2), bold: true } : { t, at: t.startsWith('@') }))
const mine = (m) => m.author?.id === state.me
const initials = (name) => (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
const time = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
const sameAuthor = (i) => i > 0 && messages.value[i - 1].is_ai === messages.value[i].is_ai && messages.value[i - 1].author?.id === messages.value[i].author?.id
</script>

<template>
  <div class="pg chat">
    <div class="pg-bar">
      <strong class="title"><AppIcon name="chat" :size="16" />Chat do projeto</strong>
      <RouterLink :to="`/projetos/${pid}/membros`" class="pg-btn"><AppIcon name="user" :size="14" />{{ p?.members?.length || 1 }} {{ (p?.members?.length || 1) === 1 ? 'pessoa' : 'pessoas' }}</RouterLink>
    </div>

    <div ref="list" class="msgs" aria-live="polite">
      <div v-if="!messages.length && !error" class="empty">
        <span class="spark"><AppIcon name="chat" :size="22" /></span>
        <strong>Comece a conversa de {{ p?.name || 'projeto' }}</strong>
        <p>Todo mundo do projeto vê estas mensagens. Escreva <code>@novexo</code> para pedir algo à IA, como "@novexo o que está atrasado?".</p>
      </div>
      <article v-for="(m, i) in messages" :key="m.id" class="msg" :class="{ me: mine(m), ai: m.is_ai, cont: sameAuthor(i) }">
        <span v-if="!sameAuthor(i)" class="ava" :style="{ background: m.is_ai ? 'var(--accent)' : m.author?.color }">
          <AppIcon v-if="m.is_ai" name="ai" :size="14" />
          <img v-else-if="m.author?.avatar" :src="m.author.avatar" alt="" />
          <template v-else>{{ initials(m.author?.name) }}</template>
        </span>
        <div class="bubble">
          <header v-if="!sameAuthor(i)"><strong>{{ m.is_ai ? 'Novexo IA' : m.author?.name || 'Alguém que saiu' }}</strong><time :datetime="m.created_at">{{ time(m.created_at) }}</time></header>
          <template v-if="m.is_ai"><AiMarkdown :text="m.body" /><AiItems :items="m.items || []" /></template>
          <p v-else><template v-for="(x, k) in parts(m.body)" :key="k"><strong v-if="x.bold">{{ x.t }}</strong><mark v-else-if="x.at" :class="{ nvx: x.t.toLowerCase().startsWith('@novexo') }">{{ x.t }}</mark><template v-else>{{ x.t }}</template></template></p>
        </div>
      </article>
      <div v-for="a in pending" :key="a.token" class="confirm">
        <p>A Novexo IA quer: <strong>{{ a.summary }}</strong>. Só você vê este pedido.</p>
        <div><button type="button" class="pg-btn primary" @click="decide(a, true)">Confirmar</button><button type="button" class="pg-btn" @click="decide(a, false)">Cancelar</button></div>
      </div>
      <p v-if="thinking" class="thinking"><span class="ava ai-ava"><AppIcon name="ai" :size="14" /></span>Novexo IA está pensando<span class="dots"><i /><i /><i /></span></p>
    </div>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <form class="composer" @submit.prevent="send">
      <textarea ref="input" v-model="text" rows="1" maxlength="4000" placeholder="Mensagem para o projeto… (@novexo chama a IA)" aria-label="Mensagem para o chat do projeto" @keydown.enter.exact.prevent="send" />
      <div class="bar">
        <button type="button" class="mention" :class="{ on: callsAi }" :aria-pressed="callsAi" title="Chamar a Novexo IA" @click="mentionAi"><AppIcon name="ai" :size="14" />@novexo</button>
        <span class="hint"><kbd>↵</kbd> enviar · <kbd>⇧</kbd><kbd>↵</kbd> nova linha</span>
        <button type="submit" class="send" :disabled="sending || !text.trim()" aria-label="Enviar"><AppIcon name="arrow" :size="16" /></button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.chat { height: 100%; min-height: 0; }
.title { display: inline-flex; align-items: center; gap: 0.45rem; font-weight: 600; }
.msgs { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 0.15rem; padding: 1.25rem max(1.25rem, calc((100% - 52rem) / 2)); }
.empty { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; margin: auto; max-width: 26rem; text-align: center; color: var(--muted); }
.empty strong { color: var(--text); font-size: 15px; }
.empty p { margin: 0; line-height: 1.55; }
.empty code { padding: 0.05rem 0.3rem; border-radius: 4px; background: var(--surface-2); color: var(--accent-soft); }
.spark { display: grid; place-items: center; width: 46px; height: 46px; border-radius: 12px; background: rgb(229 101 21 / 0.16); color: var(--accent-soft); }
.msg { display: flex; align-items: flex-start; gap: 0.6rem; margin-top: 0.7rem; }
.msg.cont { margin-top: 0; padding-left: calc(30px + 0.6rem); }
.ava { display: grid; place-items: center; flex-shrink: 0; width: 30px; height: 30px; overflow: hidden; border-radius: 50%; font: 700 11px/1 'Lexend', system-ui, sans-serif; color: #000; }
.ava img { width: 100%; height: 100%; object-fit: cover; }
.bubble { min-width: 0; max-width: min(40rem, 100%); }
.bubble header { display: flex; align-items: baseline; gap: 0.5rem; }
.bubble header strong { font-weight: 600; font-size: 13.5px; }
.bubble time { font-size: 11.5px; color: var(--muted); }
.bubble p { margin: 0.1rem 0 0; white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.5; }
.msg.ai .bubble { padding: 0.5rem 0.75rem; border: 1px solid rgb(229 101 21 / 0.35); border-radius: 10px; background: rgb(229 101 21 / 0.07); }
.msg.ai.cont .bubble { margin-top: 0.3rem; }
.msg.ai header strong { color: var(--accent-soft); }
mark { padding: 0 0.15rem; border-radius: 4px; background: var(--surface-2); color: var(--text); }
mark.nvx { background: rgb(229 101 21 / 0.18); color: var(--accent-soft); }
.confirm { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.6rem; margin: 0.8rem 0 0 calc(30px + 0.6rem); padding: 0.6rem 0.8rem; border: 1px solid rgb(229 101 21 / 0.5); border-radius: 10px; background: var(--surface); }
.confirm p { margin: 0; }
.confirm div { display: flex; gap: 0.4rem; }
.thinking { display: flex; align-items: center; gap: 0.6rem; margin: 0.8rem 0 0; color: var(--muted); }
.ai-ava { background: var(--accent); }
.dots { display: inline-flex; gap: 3px; margin-left: 0.2rem; }
.dots i { width: 5px; height: 5px; border-radius: 50%; background: var(--muted); animation: dot 1s infinite ease-in-out; }
.dots i:nth-child(2) { animation-delay: 0.15s; }
.dots i:nth-child(3) { animation-delay: 0.3s; }
@keyframes dot { 0%, 80%, 100% { opacity: 0.3; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }
.error { margin: 0 max(1.25rem, calc((100% - 52rem) / 2)) 0.5rem; padding: 0.55rem 0.8rem; border: 1px solid rgb(229 101 21 / 0.45); border-radius: 8px; background: rgb(229 101 21 / 0.1); font-size: 13px; color: #ffd2b3; }
.composer { display: flex; flex-direction: column; gap: 0.35rem; margin: 0 max(1.25rem, calc((100% - 52rem) / 2)) 1.1rem; padding: 0.65rem 0.65rem 0.5rem 0.85rem; border: 1px solid var(--line-strong); border-radius: 12px; background: var(--surface); }
.composer:focus-within { border-color: var(--accent); }
.composer textarea { min-height: 1.5rem; max-height: 10rem; border: 0; background: none; font: inherit; color: var(--text); resize: none; outline: none; field-sizing: content; }
.bar { display: flex; align-items: center; gap: 0.6rem; }
.mention { display: inline-flex; align-items: center; gap: 0.3rem; height: 26px; padding: 0 0.55rem; border: 1px solid var(--line); border-radius: 999px; background: none; font-size: 12.5px; color: var(--muted); cursor: pointer; transition: color 0.2s var(--ease), border-color 0.2s var(--ease); }
.mention:hover, .mention.on { border-color: var(--accent); color: var(--accent-soft); }
.hint { margin-left: auto; font-size: 12px; color: var(--muted); }
.send { display: grid; place-items: center; width: 32px; height: 32px; padding: 0; border: 0; border-radius: 9px; background: var(--accent); color: #000; cursor: pointer; }
.send:disabled { background: var(--surface-2); color: var(--muted); cursor: default; }
:is(.mention, .send):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
@media (max-width: 560px) { .hint { display: none; } }
@media (prefers-reduced-motion: reduce) { .dots i { animation: none; } }
</style>
