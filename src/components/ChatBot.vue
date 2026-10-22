<script setup>
import { nextTick, ref } from 'vue'
import { api } from '../services/api'
import { useAuth } from '../composables/useAuth'
import BaseButton from './BaseButton.vue'

// Mini chatbot flutuante: manda o histórico para /api/ai/chat/ e mostra a resposta da IA
const { loadMe } = useAuth()
const open = ref(false)
const messages = ref([]) // { role: 'user' | 'assistant', content }
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
    const { reply, changed } = await api('/api/ai/chat/', { method: 'POST', body: { messages: messages.value } })
    messages.value.push({ role: 'assistant', content: reply })
    // A IA mudou algo: recarrega o usuário logado e avisa as telas de produtos
    if (changed) {
      loadMe()
      window.dispatchEvent(new Event('products:changed'))
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
    scrollDown()
  }
}
</script>

<template>
  <div class="bot">
    <section v-if="open" class="panel card" aria-label="Assistente">
      <header class="head">
        <strong>Assistente</strong>
        <button class="close" aria-label="Fechar assistente" @click="open = false">×</button>
      </header>
      <div ref="list" class="messages" aria-live="polite">
        <p v-if="!messages.length" class="muted small">Oi! Pergunte o que quiser, procure produtos ou peça para editar seus produtos e seu perfil.</p>
        <p v-for="(m, i) in messages" :key="i" class="msg" :class="m.role">{{ m.content }}</p>
        <p v-if="loading" class="msg assistant muted">Pensando…</p>
      </div>
      <p v-if="error" class="alert alert-error">{{ error }}</p>
      <form class="composer" @submit.prevent="send">
        <input v-model="text" placeholder="Escreva sua pergunta…" aria-label="Pergunta para o assistente" maxlength="4000" />
        <BaseButton type="submit" small :disabled="loading || !text.trim()">Enviar</BaseButton>
      </form>
    </section>
    <button class="toggle" :aria-expanded="open" aria-label="Abrir assistente" @click="open = !open">
      {{ open ? '×' : 'IA' }}
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
.panel .alert { margin: 0 var(--space-3); }
.composer { display: flex; gap: var(--space-2); padding: var(--space-3); border-top: 1px solid var(--color-border); }
.composer input { flex: 1; min-width: 0; }
</style>
