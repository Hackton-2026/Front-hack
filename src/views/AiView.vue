<script setup>
// Novexo IA (o "Ask AI" do ClickUp / "Plane AI" do Plane): chat com o endpoint de IA do backend (/api/ai/chat/).
// Cada conversa leva um resumo das tarefas do workspace para a IA responder sobre elas.
import { computed, nextTick, ref } from 'vue'
import { gsap, prefersReducedMotion } from '../utils/motion'
import { api } from '../services/api'
import { useAuth } from '../composables/useAuth'
import { useWorkspace } from '../composables/useWorkspace'
import { useOnboarding } from '../composables/useOnboarding'
import AppIcon from '../components/app/AppIcon.vue'

const SUGGESTIONS = ['O que está atrasado e quem é o responsável?', 'Resuma minhas tarefas desta semana', 'Qual projeto está mais perto de terminar?', 'Sugira a ordem das minhas tarefas de hoje']
const { user } = useAuth()
const { state, code, status, member, project } = useWorkspace()
const { complete } = useOnboarding()
const messages = ref([])
const text = ref('')
const loading = ref(false)
const error = ref('')
const list = ref(null)

// Resumo das tarefas que vai junto da conversa (a IA do template não conhece o Novexo sozinha)
const context = computed(() => 'Contexto do workspace Novexo (use para responder; datas no formato AAAA-MM-DD, hoje é ' + new Date().toISOString().slice(0, 10) + '):\n'
  + state.tasks.filter((t) => !t.draft).map((t) => `- ${code(t)} "${t.title}" | projeto: ${project(t.projectId)?.name} | status: ${status(t.status).name} | prazo: ${t.due || 'sem'} | responsáveis: ${t.assignees.map((a) => member(a)?.name).join(', ')}`).join('\n'))

const scroll = () => nextTick(() => list.value?.scrollTo({ top: list.value.scrollHeight, behavior: 'smooth' }))
async function animateLast() {
  await nextTick()
  const el = list.value?.lastElementChild
  if (el && !prefersReducedMotion()) gsap.from(el, { y: 10, autoAlpha: 0, duration: 0.35, ease: 'power2.out' })
}

async function send(content = text.value.trim()) {
  if (!content || loading.value) return
  messages.value.push({ role: 'user', content })
  text.value = ''
  error.value = ''
  loading.value = true
  complete('ai')
  animateLast(); scroll()
  try {
    const history = [{ role: 'user', content: context.value }, { role: 'assistant', content: 'Entendido, vou usar esse contexto.' }, ...messages.value]
    const { reply } = await api('/api/ai/chat/', { method: 'POST', body: { messages: history } })
    messages.value.push({ role: 'assistant', content: reply })
  } catch (e) {
    error.value = e.status === 401 ? 'Entre na sua conta para usar a IA.' : e.status === 503 ? 'A IA não está configurada no servidor (falta a GROQ_API_KEY no backend).' : e.message
  } finally {
    loading.value = false
    animateLast(); scroll()
  }
}
</script>

<template>
  <div class="ai">
    <div ref="list" class="msgs" aria-live="polite">
      <div v-if="!messages.length" class="hero">
        <span class="spark"><AppIcon name="ai" :size="26" /></span>
        <h1>Como posso ajudar o time hoje?</h1>
        <p>A Novexo IA conhece as tarefas, projetos e prazos do workspace.</p>
        <div class="sugs">
          <button v-for="s in SUGGESTIONS" :key="s" type="button" class="sug" @click="send(s)">{{ s }}</button>
        </div>
      </div>
      <p v-for="(m, i) in messages" :key="i" class="msg" :class="m.role">{{ m.content }}</p>
      <p v-if="loading" class="msg assistant typing" aria-label="A IA está escrevendo"><span /><span /><span /></p>
    </div>
    <p v-if="error" class="error" role="alert">{{ error }} <RouterLink v-if="!user" to="/login?next=/ia">Entrar</RouterLink></p>
    <form class="composer" @submit.prevent="send()">
      <textarea v-model="text" rows="1" placeholder="Pergunte sobre tarefas, prazos ou peça um resumo…" aria-label="Mensagem para a IA" maxlength="4000" @keydown.enter.exact.prevent="send()" />
      <button type="submit" class="send" :disabled="loading || !text.trim()" aria-label="Enviar"><AppIcon name="arrow" :size="16" /></button>
    </form>
  </div>
</template>

<style scoped>
.ai { display: flex; flex-direction: column; height: 100%; max-width: 50rem; margin: 0 auto; padding: 0 1.5rem 1.25rem; }
.msgs { flex: 1; display: flex; flex-direction: column; gap: 0.6rem; overflow-y: auto; padding: 2rem 0 1rem; }
.hero { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; margin: auto 0; text-align: center; }
.spark { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 14px; background: linear-gradient(135deg, rgb(251 164 92 / 0.25), rgb(229 101 21 / 0.25)); color: var(--accent-soft); animation: glow 3s ease-in-out infinite alternate; }
@keyframes glow { to { box-shadow: 0 0 30px rgb(229 101 21 / 0.35); } }
h1 { margin: 0.4rem 0 0; font: 700 1.5rem/1.2 'Geist', system-ui, sans-serif; letter-spacing: -0.02em; color: var(--text); }
.hero p { margin: 0; color: var(--muted); }
.sugs { display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: 0.5rem; width: 100%; margin-top: 1rem; }
.sug { padding: 0.75rem 0.9rem; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); text-align: left; font-size: 13px; color: var(--text); cursor: pointer; transition: border-color 0.2s var(--ease), translate 0.2s var(--ease); }
.sug:hover { border-color: var(--accent); translate: 0 -2px; }
.msg { max-width: 80%; margin: 0; padding: 0.6rem 0.85rem; border-radius: 12px; white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.5; }
.msg.user { align-self: flex-end; background: var(--accent); color: #000; border-bottom-right-radius: 4px; }
.msg.assistant { align-self: flex-start; background: var(--surface-2); border-bottom-left-radius: 4px; }
.typing { display: flex; gap: 4px; }
.typing span { width: 6px; height: 6px; border-radius: 50%; background: var(--muted); animation: dot 1s infinite ease-in-out; }
.typing span:nth-child(2) { animation-delay: 0.15s; }
.typing span:nth-child(3) { animation-delay: 0.3s; }
@keyframes dot { 0%, 80%, 100% { opacity: 0.3; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }
.error { margin: 0 0 0.6rem; padding: 0.6rem 0.8rem; border: 1px solid rgb(229 101 21 / 0.4); border-radius: 8px; background: rgb(229 101 21 / 0.1); font-size: 13px; color: #ffd2b3; }
.error a { margin-left: 0.4rem; color: var(--accent-soft); }
.composer { display: flex; align-items: flex-end; gap: 0.5rem; padding: 0.5rem; border: 1px solid var(--line-strong); border-radius: 12px; background: var(--surface); }
.composer:focus-within { border-color: var(--accent); }
.composer textarea { flex: 1; max-height: 10rem; padding: 0.45rem 0.5rem; border: 0; background: none; font: inherit; color: var(--text); resize: none; outline: none; field-sizing: content; }
.send { display: grid; place-items: center; width: 34px; height: 34px; padding: 0; border: 0; border-radius: 8px; background: var(--accent); color: #000; cursor: pointer; }
.send:disabled { background: var(--surface-2); color: var(--muted); cursor: default; }
:is(.sug, .send):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .spark, .typing span { animation: none; } }
</style>
