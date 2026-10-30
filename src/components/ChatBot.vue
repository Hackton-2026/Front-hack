<script setup>
import { nextTick, ref } from 'vue'
import { api } from '../services/api'
import { useAuth } from '../composables/useAuth'
import BaseButton from './BaseButton.vue'
import FlaticonIcon from './FlaticonIcon.vue'

const { loadMe } = useAuth()
const open = ref(false)
const messages = ref([])
const pending = ref([])
const text = ref('')
const loading = ref(false)
const error = ref('')
const list = ref()

const scrollDown = () => nextTick(() => list.value?.scrollTo({ top: list.value.scrollHeight }))

async function send() {
  const content = text.value.trim()
  if (!content || loading.value) return
  messages.value.push({ role: 'user', content })
  text.value = ''
  error.value = ''
  loading.value = true
  scrollDown()
  try {
    const { reply, changed, pending: asked = [] } = await api('/api/ai/chat/', { method: 'POST', body: { messages: messages.value } })
    messages.value.push({ role: 'assistant', content: reply })
    pending.value = asked
    if (changed) refresh()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
    scrollDown()
  }
}

function refresh() {
  loadMe()
  window.dispatchEvent(new Event('products:changed'))
}

async function decide(action, ok) {
  pending.value = pending.value.filter((p) => p !== action)
  error.value = ''
  if (!ok) {
    messages.value.push({ role: 'user', content: `Cancelei: ${action.summary}` })
    return scrollDown()
  }
  try {
    await api('/api/ai/confirm/', { method: 'POST', body: { token: action.token } })
    messages.value.push({ role: 'assistant', content: `Feito: ${action.summary}` })
    refresh()
  } catch (e) {
    error.value = e.message
  }
  scrollDown()
}
</script>

<template>
  <div class="bot">
    <section v-if="open" class="panel card" aria-label="Assistente">
      <header class="head">
        <strong>Assistente</strong>
        <button class="close" aria-label="Fechar assistente" @click="open = false"><FlaticonIcon name="cross-small" :size="18" /></button>
      </header>
      <div ref="list" class="messages" aria-live="polite">
        <p v-if="!messages.length" class="muted small">Oi! Posso fazer por você o que você faria no site: produtos, perfil, conversas e tarefas, sempre dentro das suas permissões.</p>
        <p v-for="(m, i) in messages" :key="i" class="msg" :class="m.role">{{ m.content }}</p>
        <div v-for="p in pending" :key="p.token" class="confirm">
          <p>{{ p.summary.includes('\n') ? p.summary : `${p.summary}?` }}</p>
          <div class="confirm-actions">
            <BaseButton small @click="decide(p, true)">Confirmar</BaseButton>
            <BaseButton small variant="ghost" @click="decide(p, false)">Cancelar</BaseButton>
          </div>
        </div>
        <p v-if="loading" class="msg assistant muted">Pensando…</p>
      </div>
      <p v-if="error" class="alert alert-error">{{ error }}</p>
      <form class="composer" @submit.prevent="send">
        <input v-model="text" placeholder="Escreva sua pergunta…" aria-label="Pergunta para o assistente" maxlength="4000" />
        <BaseButton type="submit" small :disabled="loading || !text.trim()">Enviar</BaseButton>
      </form>
    </section>
    <button class="toggle" :aria-expanded="open" aria-label="Abrir assistente" @click="open = !open">
      <FlaticonIcon v-if="open" name="cross-small" :size="20" /><template v-else>IA</template>
    </button>
  </div>
</template>

<style scoped>
.bot { position: fixed; right: var(--space-4); bottom: var(--space-4); z-index: 20; display: flex; flex-direction: column; align-items: flex-end; gap: var(--space-2); }
.toggle { width: 52px; height: 52px; border: 0; border-radius: 50%; background: var(--color-primary); color: var(--color-on-primary); font: inherit; font-weight: 600; cursor: pointer; box-shadow: var(--shadow-hover); }
.toggle:hover { background: var(--color-primary-hover); }
.panel { width: min(360px, calc(100vw - 2 * var(--space-4))); height: min(480px, 70vh); padding: 0; display: flex; flex-direction: column; overflow: hidden; font-size: var(--font-size-sm); }
.head { display: flex; justify-content: space-between; align-items: center; padding: var(--space-3); border-bottom: 1px solid var(--color-border); }
.close { background: none; border: 0; font-size: 1.25rem; line-height: 1; color: var(--color-muted); cursor: pointer; }
.messages { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding: var(--space-3); }
.msg { margin: 0; max-width: 85%; padding: 6px 10px; border-radius: var(--radius-lg); white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.45; }
.msg.user { align-self: flex-end; background: var(--color-primary); color: var(--color-on-primary); border-bottom-right-radius: 4px; }
.msg.assistant { align-self: flex-start; background: var(--color-surface-2); border-bottom-left-radius: 4px; }
.confirm { align-self: stretch; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-2) var(--space-3); }
.confirm p { margin: 0 0 var(--space-2); overflow-wrap: anywhere; white-space: pre-line; }
.confirm-actions { display: flex; gap: var(--space-2); }
.panel .alert { margin: 0 var(--space-3); }
.composer { display: flex; gap: var(--space-2); padding: var(--space-3); border-top: 1px solid var(--color-border); }
.composer input { flex: 1; min-width: 0; }
</style>
