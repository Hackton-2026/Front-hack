<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { api } from '../services/api'
import { useWorkspace } from '../composables/useWorkspace'
import { useUi } from '../composables/useUi'
import { gsap, prefersReducedMotion } from '../utils/motion'
import AppIcon from '../components/app/AppIcon.vue'
import AiItems from '../components/app/AiItems.vue'
import AiMarkdown from '../components/app/AiMarkdown.vue'
import AiQuestions from '../components/app/AiQuestions.vue'
import MeetButton from '../components/app/MeetButton.vue'
import VoiceRoom from '../components/app/VoiceRoom.vue'

const POLL_MS = 3000
const props = defineProps({ id: { type: [String, Number], required: true }, page: Boolean })
const { state, project, projectMessages, sendProjectMessage, load } = useWorkspace()
const ui = useUi()

const pid = computed(() => Number(props.id))
const p = computed(() => project(pid.value))
const messages = ref([])
const peer = ref(null)
const text = ref('')
const sending = ref(false)
const thinking = ref(false)
const error = ref('')
const pending = ref([])
const form = ref(null)
let asked = 0
const list = ref(null)
const input = ref(null)
let timer
let generation = 0

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
    const items = await projectMessages(pid.value, lastId(), peer.value?.id)
    if (gen === generation) add(items)
  } catch { }
}
async function start() {
  generation++
  const gen = generation
  clearInterval(timer)
  messages.value = []
  pending.value = []
  form.value = null
  error.value = ''
  try {
    const items = await projectMessages(pid.value, null, peer.value?.id)
    if (gen !== generation) return
    messages.value = items
    scrollDown(false)
  } catch (e) {
    error.value = e.status === 404 ? 'Projeto não encontrado ou você não participa mais dele.' : e.message
    return
  }
  timer = setInterval(poll, POLL_MS)
}
watch(pid, () => { peer.value = null; start() })
watch(peer, start)
onMounted(() => { start(); document.addEventListener('visibilitychange', poll) })
onUnmounted(() => { generation++; clearInterval(timer); document.removeEventListener('visibilitychange', poll) })

const mention = ref(null)
const pick = ref(0)
const members = computed(() => state.people.filter((x) => p.value?.members?.includes(x.id) && x.id !== state.me))
const people = computed(() => [{ id: 'novexo', username: 'novexo', name: 'Novexo IA', ai: true }, ...members.value])
const matches = computed(() => {
  if (!mention.value || peer.value) return []
  const q = mention.value.query.toLowerCase()
  return people.value.filter((x) => x.username.toLowerCase().startsWith(q) || x.name.toLowerCase().split(' ').some((w) => w.startsWith(q))).slice(0, 6)
})
function track() {
  const el = input.value
  const m = el && /(^|\s)@([\wÀ-ÿ.-]*)$/.exec(text.value.slice(0, el.selectionStart))
  mention.value = m ? { query: m[2], start: el.selectionStart - m[2].length - 1 } : null
  pick.value = 0
}
async function choose(person) {
  const { start, query } = mention.value
  const end = start + query.length + 1
  text.value = `${text.value.slice(0, start)}@${person.username} ${text.value.slice(end)}`
  mention.value = null
  await nextTick()
  const caret = start + person.username.length + 2
  input.value?.focus()
  input.value?.setSelectionRange(caret, caret)
}
function onKey(e) {
  if (matches.value.length) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); pick.value = (pick.value + (e.key === 'ArrowDown' ? 1 : -1) + matches.value.length) % matches.value.length; return }
    if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); choose(matches.value[pick.value]); return }
    if (e.key === 'Escape') { e.stopPropagation(); mention.value = null; return }
  }
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
}

async function send(answer, raw) {
  const body = raw ?? (typeof answer === 'string' ? `@novexo ${answer}` : text.value.trim())
  if (!body || sending.value) return
  sending.value = true
  thinking.value = /@novexo\b/i.test(body)
  error.value = ''
  pending.value = []
  form.value = null
  const gen = generation
  try {
    const res = await sendProjectMessage(pid.value, body, peer.value?.id)
    if (typeof answer !== 'string' && raw == null) text.value = ''
    if (gen !== generation) return
    add(res.messages)
    pending.value = res.pending || []
    form.value = res.form || null
    asked++
    if (form.value) scrollDown(true)
    if (res.ai_error) error.value = `A Novexo IA não respondeu: ${res.ai_error}`
    if (res.changed) load()
  } catch (e) {
    error.value = e.message
  } finally {
    sending.value = false
    thinking.value = false
    input.value?.focus()
  }
}
const callsWhatsapp = computed(() => /^\/(whatsapp|whatsap|whatzap|zap)\b/i.test(text.value.trim()))
function whatsapp() {
  if (!callsWhatsapp.value) text.value = `/whatsapp ${text.value.trimStart()}`
  input.value?.focus()
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

const parts = (body) => body.split(/(\*\*[^*\n]+\*\*|@[\wÀ-ÿ.-]+)/g).filter(Boolean)
  .map((t) => (t.startsWith('**') && t.endsWith('**') && t.length > 4 ? { t: t.slice(2, -2), bold: true } : { t, at: t.startsWith('@') }))
const MEET = /https:\/\/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/
const meetOf = (body) => body.match(MEET)
const startCall = (link) => send(null, `Chamada no Google Meet: ${link}`)
const mine = (m) => m.author?.id === state.me
const initials = (name) => (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
const time = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
const sameAuthor = (i) => i > 0 && messages.value[i - 1].is_ai === messages.value[i].is_ai && messages.value[i - 1].author?.id === messages.value[i].author?.id
</script>

<template>
  <aside class="chat" :class="{ page }" :role="page ? undefined : 'complementary'" :aria-label="`Chat de ${p?.name || 'projeto'}`" @keydown.esc="page || ui.closeChat()">
    <nav v-if="page" class="rooms" aria-label="Conversas">
      <p class="rooms__label">Conversas</p>
      <button type="button" class="room" :aria-current="!peer" @click="peer = null">
        <span class="ava room__ic"><AppIcon name="chat" :size="14" /></span>
        <span class="room__txt"><strong>Geral</strong><small>Todo mundo do projeto</small></span>
      </button>
      <p v-if="members.length" class="rooms__label">Participantes</p>
      <button v-for="x in members" :key="x.id" type="button" class="room" :aria-current="peer?.id === x.id" @click="peer = x">
        <span class="ava" :style="{ background: x.color }"><img referrerpolicy="no-referrer" v-if="x.avatar" :src="x.avatar" alt="" /><template v-else>{{ initials(x.name) }}</template></span>
        <span class="room__txt"><strong>{{ x.name }}</strong><small>@{{ x.username }}</small></span>
      </button>
      <p v-if="!members.length" class="rooms__alone">Só você participa. <RouterLink :to="`/projetos/${pid}/membros`">Chamar participantes</RouterLink></p>
    </nav>
    <div class="pane">
    <div class="head">
      <strong class="title"><AppIcon name="chat" :size="16" /><span>{{ peer ? peer.name : page ? 'Geral' : p?.name || 'Chat do projeto' }}</span></strong>
      <RouterLink v-if="!peer" :to="`/projetos/${pid}/membros`" class="people" :title="`Quem participa de ${p?.name || 'projeto'}`"><AppIcon name="user" :size="14" />{{ p?.members?.length || 1 }}</RouterLink>
      <RouterLink v-if="!page" :to="`/projetos/${pid}/chat`" class="x" aria-label="Abrir em página inteira" title="Abrir em página inteira"><AppIcon name="expand" :size="15" /></RouterLink>
      <button v-if="!page" type="button" class="x" aria-label="Fechar chat" @click="ui.closeChat()"><AppIcon name="close" :size="16" /></button>
    </div>
    <VoiceRoom v-if="!peer" :key="pid" :project-id="pid" />

    <div ref="list" class="msgs" aria-live="polite">
      <div v-if="!messages.length && !error" class="empty">
        <span class="spark"><AppIcon name="chat" :size="22" /></span>
        <template v-if="peer"><strong>Comece a conversa com {{ peer.name }}</strong><p>Só vocês dois veem estas mensagens.</p></template>
        <template v-else><strong>Comece a conversa de {{ p?.name || 'projeto' }}</strong>
        <p>Todo mundo do projeto vê estas mensagens. <code>@novexo</code> chama a IA, <code>@nome</code> avisa a pessoa e <code>/whatsapp</code> manda pelo WhatsApp.</p></template>
      </div>
      <article v-for="(m, i) in messages" :key="m.id" class="msg" :class="{ me: mine(m), ai: m.is_ai, sys: m.is_system, cont: sameAuthor(i) && !m.is_system }">
        <p v-if="m.is_system" class="sys__txt"><AppIcon name="chat" :size="13" />{{ m.body }}</p>
        <span v-else-if="!sameAuthor(i)" class="ava" :style="{ background: m.is_ai ? 'var(--accent)' : m.author?.color }">
          <AppIcon v-if="m.is_ai" name="ai" :size="14" />
          <img referrerpolicy="no-referrer" v-else-if="m.author?.avatar" :src="m.author.avatar" alt="" />
          <template v-else>{{ initials(m.author?.name) }}</template>
        </span>
        <div v-if="!m.is_system" class="bubble">
          <header v-if="!sameAuthor(i)"><strong>{{ m.is_ai ? 'Novexo IA' : m.author?.name || 'Alguém que saiu' }}</strong><time :datetime="m.created_at">{{ time(m.created_at) }}</time></header>
          <template v-if="m.is_ai"><AiMarkdown :text="m.body" /><AiItems :items="m.items || []" /></template>
          <p v-else><template v-for="(x, k) in parts(m.body)" :key="k"><strong v-if="x.bold">{{ x.t }}</strong><mark v-else-if="x.at" :class="{ nvx: x.t.toLowerCase().startsWith('@novexo') }">{{ x.t }}</mark><template v-else>{{ x.t }}</template></template></p>
          <a v-if="!m.is_ai && meetOf(m.body)" class="call" :href="meetOf(m.body)[0]" target="_blank" rel="noopener">
            <span class="call__ic"><AppIcon name="video" :size="16" /></span>
            <span class="call__txt"><strong>Chamada no Google Meet</strong><small>{{ meetOf(m.body)[1] }}</small></span>
            <span class="call__go">Entrar</span>
          </a>
        </div>
      </article>
      <div v-for="a in pending" :key="a.token" class="confirm">
        <p>A Novexo IA quer: <strong>{{ a.summary }}</strong>. Só você vê este pedido.</p>
        <div><button type="button" class="pg-btn primary" @click="decide(a, true)">Confirmar</button><button type="button" class="pg-btn" @click="decide(a, false)">Cancelar</button></div>
      </div>
      <AiQuestions v-if="form" :key="asked" class="asks" :form="form" :disabled="sending" @answer="send" />
      <p v-if="thinking" class="thinking"><span class="ava ai-ava"><AppIcon name="ai" :size="14" /></span>Novexo IA está pensando<span class="dots"><i /><i /><i /></span></p>
    </div>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <form class="composer" @submit.prevent="send()">
      <ul v-if="matches.length" class="mentions" role="listbox" aria-label="Mencionar">
        <li v-for="(x, k) in matches" :key="x.id" role="option" :aria-selected="k === pick" @mousedown.prevent="choose(x)" @mouseenter="pick = k">
          <span class="ava" :style="{ background: x.ai ? 'var(--accent)' : x.color }"><AppIcon v-if="x.ai" name="ai" :size="12" /><img referrerpolicy="no-referrer" v-else-if="x.avatar" :src="x.avatar" alt="" /><template v-else>{{ initials(x.name) }}</template></span>
          <strong>{{ x.name }}</strong><span>@{{ x.username }}</span>
        </li>
        <li v-if="people.length === 1" class="alone" role="presentation">
          Só você participa deste projeto.
          <RouterLink :to="`/projetos/${pid}/membros`" @mousedown.prevent @click="mention = null">Chamar participantes</RouterLink>
        </li>
      </ul>
      <textarea ref="input" v-model="text" rows="1" maxlength="4000" :placeholder="peer ? `Mensagem para ${peer.name}…` : 'Mensagem… (@ menciona, /whatsapp manda no zap)'" :aria-label="peer ? `Mensagem para ${peer.name}` : 'Mensagem para o chat do projeto'"
        role="combobox" :aria-expanded="matches.length > 0" aria-autocomplete="list" @input="track" @click="track" @keydown="onKey" @blur="mention = null" />
      <div class="bar">
        <template v-if="!peer">
        <button type="button" class="mention" :class="{ on: callsAi }" :aria-pressed="callsAi" title="Chamar a Novexo IA" @click="mentionAi"><AppIcon name="ai" :size="14" />@novexo</button>
        <button type="button" class="mention" :class="{ on: callsWhatsapp }" :aria-pressed="callsWhatsapp" title="Mandar pelo WhatsApp para quem participa" @click="whatsapp"><AppIcon name="chat" :size="14" />/whatsapp</button>
        </template>
        <MeetButton @link="startCall" />
        <span class="hint"><kbd>↵</kbd> enviar · <kbd>⇧</kbd><kbd>↵</kbd> linha</span>
        <button type="submit" class="send" :disabled="sending || !text.trim()" aria-label="Enviar"><AppIcon name="arrow" :size="16" /></button>
      </div>
    </form>
    </div>
  </aside>
</template>

<style scoped>
.chat { position: fixed; z-index: 65; top: 52px; right: 10px; bottom: 10px; display: flex; flex-direction: column; width: min(25rem, calc(100vw - 20px)); border: 1px solid var(--line-strong); border-radius: 12px; background: var(--bg); box-shadow: -20px 20px 60px rgb(0 0 0 / 0.45); overflow: hidden; }
.pane { display: flex; flex: 1; flex-direction: column; min-width: 0; min-height: 0; }
.chat.page { position: static; z-index: auto; flex-direction: row; width: auto; height: calc(100% - 3rem); margin: 1.5rem; box-shadow: none; }
.rooms { display: flex; flex-direction: column; gap: 2px; flex-shrink: 0; width: 16rem; padding: 0.6rem; overflow-y: auto; border-right: 1px solid var(--line); background: var(--surface); }
.rooms__label { margin: 0.6rem 0.4rem 0.3rem; font-size: 11.5px; font-weight: 600; color: var(--muted); }
.rooms__label:first-child { margin-top: 0.2rem; }
.room { display: flex; align-items: center; gap: 0.6rem; padding: 0.45rem 0.5rem; border: 0; border-radius: 7px; background: none; text-align: left; color: var(--text); cursor: pointer; }
.room:hover, .room[aria-current='true'] { background: var(--surface-2); }
.room:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: -2px; }
.room__ic { background: var(--surface-2); color: var(--accent-soft); }
.room[aria-current='true'] .room__ic { background: var(--bg); }
.room__txt { display: flex; flex-direction: column; min-width: 0; }
.room__txt strong { overflow: hidden; font-size: 13.5px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
.room__txt small { overflow: hidden; font-size: 11.5px; color: var(--muted); text-overflow: ellipsis; white-space: nowrap; }
.rooms__alone { margin: 0.4rem; font-size: 12.5px; line-height: 1.5; color: var(--muted); }
.rooms__alone a { color: var(--text); }
@media (max-width: 720px) {
  .chat.page { flex-direction: column; margin: 0.75rem; height: calc(100% - 1.5rem); }
  .rooms { flex-direction: row; width: auto; overflow-x: auto; border-right: 0; border-bottom: 1px solid var(--line); }
  .rooms__label, .room__txt small, .rooms__alone { display: none; }
  .room { flex-shrink: 0; }
}
.head { display: flex; align-items: center; gap: 0.4rem; height: 48px; padding: 0 0.5rem 0 0.9rem; border-bottom: 1px solid var(--line); }
.title { display: inline-flex; flex: 1; align-items: center; gap: 0.45rem; min-width: 0; font-weight: 600; }
.title span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.people { display: inline-flex; align-items: center; gap: 0.3rem; height: 28px; padding: 0 0.5rem; border-radius: 6px; font-size: 12.5px; color: var(--muted); text-decoration: none; }
.people:hover, .x:hover { background: var(--surface-2); color: var(--text); }
.x { display: grid; place-items: center; width: 30px; height: 30px; padding: 0; border: 0; border-radius: 6px; background: none; color: var(--muted); cursor: pointer; }
.msgs { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 0.15rem; padding: 1rem 0.9rem; }
.asks { margin: 0.8rem 0 0 calc(30px + 0.6rem); }
.mentions { position: absolute; left: 0; right: 0; bottom: calc(100% + 6px); z-index: 2; margin: 0; padding: 0.3rem; border: 1px solid var(--line-strong); border-radius: 10px; background: var(--surface); box-shadow: 0 12px 30px rgb(0 0 0 / 0.4); list-style: none; }
.mentions li { display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.5rem; border-radius: 6px; font-size: 13px; cursor: pointer; }
.mentions li[aria-selected='true'] { background: var(--surface-2); }
.mentions li span:last-child { color: var(--muted); font-size: 12px; }
.mentions li.alone { display: block; margin-top: 0.2rem; padding: 0.5rem; border-top: 1px solid var(--line); border-radius: 0; font-size: 12.5px; color: var(--muted); cursor: default; }
.mentions li.alone a { margin-left: 0.25rem; color: var(--text); }
.mentions .ava { width: 22px; height: 22px; font-size: 9px; }
.empty { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; margin: auto; max-width: 26rem; padding: 0; border: 0; text-align: center; color: var(--muted); } .empty strong { color: var(--text); font-size: 15px; }
.empty p { margin: 0; line-height: 1.55; }
.empty code { padding: 0.05rem 0.3rem; border-radius: 4px; background: var(--surface-2); color: var(--accent-soft); }
.spark { display: grid; place-items: center; width: 46px; height: 46px; border-radius: 12px; background: rgb(229 101 21 / 0.16); color: var(--accent-soft); }
.msg { display: flex; align-items: flex-start; gap: 0.6rem; margin-top: 0.7rem; }
.msg.cont { margin-top: 0; padding-left: calc(30px + 0.6rem); }
.ava { display: grid; place-items: center; flex-shrink: 0; width: 30px; height: 30px; overflow: hidden; border-radius: 50%; font: 700 11px/1 'Lexend', system-ui, sans-serif; color: #000; }
.ava img { width: 100%; height: 100%; object-fit: cover; }
.bubble { min-width: 0; max-width: 100%; }
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
.confirm p { margin: 0; white-space: pre-line; }
.confirm div { display: flex; gap: 0.4rem; }
.thinking { display: flex; align-items: center; gap: 0.6rem; margin: 0.8rem 0 0; color: var(--muted); }
.ai-ava { background: var(--accent); }
.dots { display: inline-flex; gap: 3px; margin-left: 0.2rem; }
.dots i { width: 5px; height: 5px; border-radius: 50%; background: var(--muted); animation: dot 1s infinite ease-in-out; }
.dots i:nth-child(2) { animation-delay: 0.15s; }
.dots i:nth-child(3) { animation-delay: 0.3s; }
@keyframes dot { 0%, 80%, 100% { opacity: 0.3; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }
.error { margin: 0 0.9rem 0.5rem; padding: 0.55rem 0.8rem; border: 1px solid rgb(229 101 21 / 0.45); border-radius: 8px; background: rgb(229 101 21 / 0.1); font-size: 13px; color: #ffd2b3; }
.composer { container-type: inline-size; position: relative; display: flex; flex-direction: column; gap: 0.35rem; margin: 0 0.75rem 0.75rem; padding: 0.65rem 0.65rem 0.5rem 0.85rem; border: 1px solid var(--line-strong); border-radius: 12px; background: var(--surface); }
.composer:focus-within { border-color: var(--accent); }
.composer textarea { min-height: 1.5rem; max-height: 10rem; border: 0; background: none; font: inherit; color: var(--text); resize: none; outline: none; field-sizing: content; }
.bar { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem 0.5rem; }
.call { display: flex; align-items: center; gap: 0.65rem; margin-top: 0.45rem; padding: 0.6rem 0.7rem; border: 1px solid var(--line-strong); border-radius: 10px; background: var(--surface); color: var(--text); text-decoration: none; transition: border-color 0.2s ease; }
.call:hover { border-color: var(--text); }
.call__ic { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 8px; background: var(--surface-2); }
.call__txt { display: flex; flex: 1; flex-direction: column; min-width: 0; }
.call__txt strong { font-size: 13px; }
.call__txt small { font: 11.5px/1.3 'Geist Mono', monospace; color: var(--muted); }
.call__go { padding: 0.3rem 0.7rem; border-radius: 6px; background: var(--text); font-size: 12.5px; font-weight: 600; color: var(--bg); }
.call:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
.mention { flex: none; white-space: nowrap; display: inline-flex; align-items: center; gap: 0.3rem; height: 26px; padding: 0 0.55rem; border: 1px solid var(--line); border-radius: 999px; background: none; font-size: 12.5px; color: var(--muted); cursor: pointer; transition: color 0.2s var(--ease), border-color 0.2s var(--ease); }
.mention:hover, .mention.on { border-color: var(--accent); color: var(--accent-soft); }
.hint { margin-left: auto; font-size: 12px; color: var(--muted); white-space: nowrap; }
.send { flex: none; display: grid; place-items: center; width: 32px; height: 32px; padding: 0; border: 0; border-radius: 9px; background: var(--accent); color: #000; cursor: pointer; }
.send:disabled { background: var(--surface-2); color: var(--muted); cursor: default; }
:is(.mention, .send, .x, .people):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
@container (max-width: 470px) { .hint { display: none; } .send { margin-left: auto; } }
@media (prefers-reduced-motion: reduce) { .dots i { animation: none; } }
.msg.sys { justify-content: center; margin: 0.7rem 0 0; padding-left: 0; }
.sys__txt { display: inline-flex; align-items: flex-start; gap: 0.4rem; max-width: 90%; margin: 0; padding: 0.4rem 0.7rem; border: 1px solid rgb(37 211 102 / 0.35); border-radius: 999px; background: rgb(37 211 102 / 0.08); font-size: 12px; line-height: 1.45; color: var(--muted); }
.sys__txt .app-icon { flex-shrink: 0; margin-top: 2px; color: #25d366; }
</style>
