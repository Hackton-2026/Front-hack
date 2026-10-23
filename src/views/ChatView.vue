<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api, wsUrl } from '../services/api'
import { useAuth } from '../composables/useAuth'
import UserAvatar from '../components/UserAvatar.vue'
import BaseButton from '../components/BaseButton.vue'
import AppSelect from '../components/app/AppSelect.vue'

const props = defineProps({ id: String })
const { user } = useAuth()
const router = useRouter()

const conversations = ref([])
const users = ref([])
const messages = ref([])
const text = ref('')
const online = ref(false)
const error = ref('')
const list = ref()
let socket = null

// username -> usuário (para mostrar foto/nome na lista)
const byUsername = computed(() => Object.fromEntries(users.value.map((u) => [u.username, u])))
const others = computed(() => users.value.filter((u) => u.id !== user.value.id))
const otherIn = (conv) => conv.participants.find((p) => p !== user.value.username) || user.value.username
const current = computed(() => conversations.value.find((c) => String(c.id) === props.id))

async function loadSidebar() {
  try {
    ;[conversations.value, users.value] = await Promise.all([api('/api/chat/conversations/'), api('/api/auth/users/')])
  } catch (e) {
    error.value = e.message
  }
}
loadSidebar()

async function startWith(userId) {
  if (!userId) return
  try {
    const conv = await api('/api/chat/conversations/', { method: 'POST', body: { participant_id: Number(userId) } })
    await loadSidebar()
    router.push(`/chat/${conv.id}`)
  } catch (e) {
    error.value = e.message
  }
}

const scrollDown = () => nextTick(() => list.value?.scrollTo({ top: list.value.scrollHeight, behavior: 'smooth' }))

watch(() => props.id, async (id) => {
  socket?.close()
  socket = null
  messages.value = []
  if (!id) return
  try {
    // Histórico primeiro (isso também renova o token se precisar), depois o WebSocket
    messages.value = await api(`/api/chat/conversations/${id}/messages/`)
  } catch (e) {
    return (error.value = e.message)
  }
  if (id !== props.id) return // trocou de conversa enquanto carregava
  scrollDown()
  const ws = new WebSocket(wsUrl(`/ws/chat/${id}/`))
  ws.onopen = () => (online.value = true)
  ws.onclose = () => socket === ws && (online.value = false)
  ws.onmessage = (e) => {
    const data = JSON.parse(e.data)
    if (data.type === 'message') {
      messages.value.push(data)
      scrollDown()
    } else if (data.type === 'error') error.value = data.detail
  }
  socket = ws
}, { immediate: true })

onBeforeUnmount(() => socket?.close())

function send() {
  if (!text.value.trim() || !online.value) return
  socket.send(JSON.stringify({ content: text.value }))
  text.value = ''
}
</script>

<template>
  <div class="chat card">
    <aside class="sidebar">
      <AppSelect :model-value="null" :options="others.map((u) => ({ value: u.id, label: `${u.first_name || u.username} (@${u.username})` }))" placeholder="+ Nova conversa…" aria-label="Nova conversa" block @change="startWith" />
      <RouterLink v-for="c in conversations" :key="c.id" :to="`/chat/${c.id}`" class="conv" :class="{ active: String(c.id) === id }">
        <UserAvatar :user="byUsername[otherIn(c)] || { username: otherIn(c) }" :size="26" />
        <span>{{ otherIn(c) }}</span>
      </RouterLink>
      <p v-if="!conversations.length" class="muted small">Nenhuma conversa ainda.</p>
    </aside>

    <section class="room">
      <template v-if="id">
        <header class="room-head">
          <strong>{{ current ? otherIn(current) : '…' }}</strong>
          <span class="small" :class="online ? 'on' : 'muted'">{{ online ? '● conectado' : '○ desconectado' }}</span>
        </header>
        <div ref="list" class="messages">
          <div v-for="m in messages" :key="m.id" class="msg" :class="{ mine: m.sender === user.username }">
            <p>{{ m.content }}</p>
            <time class="small">{{ new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }}</time>
          </div>
        </div>
        <p v-if="error" class="alert alert-error">{{ error }}</p>
        <form class="composer" @submit.prevent="send">
          <input v-model="text" placeholder="Escreva uma mensagem…" aria-label="Mensagem" />
          <BaseButton type="submit" small :disabled="!online">Enviar</BaseButton>
        </form>
      </template>
      <div v-else class="empty">Escolha uma conversa ou comece uma nova.</div>
    </section>
  </div>
</template>

<style scoped>
.chat {
  display: grid;
  grid-template-columns: 220px 1fr;
  padding: 0;
  height: min(600px, calc(100vh - var(--nav-height) - var(--space-5) * 2));
  min-height: 380px;
  overflow: hidden;
  font-size: var(--font-size-sm);
}
.sidebar { border-right: 1px solid var(--color-border); padding: var(--space-2); display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
.sidebar :deep(.sel) { flex-shrink: 0; margin-bottom: var(--space-2); }
.conv { display: flex; align-items: center; gap: var(--space-2); padding: 6px var(--space-2); border-radius: var(--radius-sm); color: var(--color-text); text-decoration: none; }
.conv:hover { background: var(--color-surface-2); }
.conv.active { background: var(--color-surface-2); color: var(--color-heading); font-weight: 500; }
.room { display: flex; flex-direction: column; min-width: 0; }
.room .empty { margin: auto; border: 0; }
.room-head { display: flex; justify-content: space-between; align-items: center; padding: var(--space-3); border-bottom: 1px solid var(--color-border); }
.on { color: var(--color-success); }
.messages { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding: var(--space-3); }
.msg { max-width: 70%; align-self: flex-start; background: var(--color-surface-2); padding: 6px 10px; border-radius: var(--radius-lg); border-bottom-left-radius: 4px; line-height: 1.4; }
.msg.mine { align-self: flex-end; background: var(--color-primary); color: var(--color-on-primary); border-radius: var(--radius-lg); border-bottom-right-radius: 4px; }
.msg p { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.msg time { display: block; margin-top: 2px; font-size: 0.6875rem; opacity: 0.6; }
.room .alert { margin: 0 var(--space-3); }
.composer { display: flex; gap: var(--space-2); padding: var(--space-3); border-top: 1px solid var(--color-border); }
.composer input { flex: 1; min-width: 0; }

@media (max-width: 760px) {
  .chat { grid-template-columns: 1fr; height: auto; }
  .sidebar { border-right: 0; border-bottom: 1px solid var(--color-border); max-height: 160px; }
  .messages { min-height: 300px; }
}
</style>
