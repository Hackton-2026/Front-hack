<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { EASE, DUR, gsap, prefersReducedMotion } from '../utils/motion'
import { useWorkspace } from '../composables/useWorkspace'
import { useUi } from '../composables/useUi'
import AppIcon from '../components/app/AppIcon.vue'

const { state, unread, markRead, markAllRead, acceptInvite, declineInvite } = useWorkspace()
const { openTask, openChat, toast } = useUi()
const router = useRouter()
const PERM = { view: 'ver', comment: 'comentar', edit: 'editar', full: 'acesso total' }
const answering = ref(null)
async function answer(inv, ok) {
  answering.value = inv.token
  try {
    if (ok) {
      const res = await acceptInvite(inv.token)
      toast(`Você entrou no projeto ${res.project_name}.`)
      router.push(`/projetos/${res.project}/visao-geral`)
    } else {
      await declineInvite(inv.token)
    }
  } catch (e) {
    toast(e.message)
  } finally {
    answering.value = null
  }
}
const tab = ref('all')
const root = ref(null)
const items = computed(() => state.inbox.filter((n) => tab.value === 'all' || !n.read))
const ago = (iso) => {
  const min = Math.round((Date.now() - new Date(iso)) / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min} min`
  if (min < 1440) return `${Math.round(min / 60)} h`
  return `${Math.round(min / 1440)} d`
}
function go(n) {
  markRead(n)
  if (n.kind === 'chat_mention' && n.project) return openChat(n.project)
  if (n.kind === 'chat_dm' && n.project) return router.push(`/projetos/${n.project}/chat`)
  const task = state.tasks.find((t) => t.id === n.task)
  if (task) openTask(task)
}

async function reveal() {
  if (prefersReducedMotion()) return
  await nextTick()
  const rows = root.value?.querySelectorAll('.invite, .item')
  if (rows?.length) gsap.from(rows, { y: 6, autoAlpha: 0, duration: DUR.fast, stagger: 0.03, ease: EASE.soft })
}
onMounted(reveal)
watch(tab, reveal)
</script>

<template>
  <div ref="root" class="pg inbox">
    <div class="pg-bar">
      <h1>Caixa de entrada</h1>
      <div class="pg-tabs" role="tablist">
        <button type="button" role="tab" :aria-selected="tab === 'all'" @click="tab = 'all'">Tudo<span v-if="state.inbox.length" class="n">{{ state.inbox.length }}</span></button>
        <button type="button" role="tab" :aria-selected="tab === 'unread'" @click="tab = 'unread'">Não lidas<span v-if="unread" class="n">{{ unread }}</span></button>
      </div>
      <button type="button" class="pg-btn" :disabled="!unread" @click="markAllRead"><AppIcon name="check" :size="14" />Marcar tudo como lido</button>
    </div>

    <section v-if="state.invites.length" class="invites" aria-label="Convites para projetos">
      <div v-for="inv in state.invites" :key="inv.token" class="invite">
        <AppIcon name="user" :size="16" class="invite__ico" />
        <p><strong>{{ inv.invited_by || 'Alguém' }}</strong> convidou você para <strong>{{ inv.project_name }}</strong> ({{ PERM[inv.permission] }})</p>
        <span class="btns">
          <button type="button" class="pg-btn" :disabled="answering === inv.token" @click="answer(inv, false)">Recusar</button>
          <button type="button" class="pg-btn primary" :disabled="answering === inv.token" @click="answer(inv, true)">Aceitar</button>
        </span>
      </div>
    </section>

    <div v-if="!items.length" class="pg-empty">
      <span class="pg-empty__art"><AppIcon name="inbox" :size="36" /></span>
      <h2>{{ tab === 'all' ? 'Nada por aqui ainda' : 'Tudo lido' }}</h2>
      <p>{{ tab === 'all' ? 'Quando alguém te atribuir uma tarefa, te mencionar no chat ou mudar o status de uma que você segue, aparece aqui.' : 'Você leu todas as notificações. Bom trabalho!' }}</p>
    </div>
    <ul v-else class="list">
      <li v-for="a in items" :key="a.id">
        <button type="button" class="item" :class="{ unread: !a.read }" @click="go(a)">
          <span class="dot" aria-hidden="true" />
          <span class="text">{{ a.text }}</span>
          <time :datetime="a.at">{{ ago(a.at) }}</time>
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.inbox .pg-tabs { margin-inline-end: auto; }
.inbox .pg-btn:disabled { opacity: 0.55; cursor: default; }
.invites { display: flex; flex-direction: column; gap: 0.5rem; padding: 1rem 1.25rem 0; }
.invite { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--line)); border-radius: 10px; background: color-mix(in srgb, var(--accent) 6%, var(--surface)); }
.invite__ico { flex: none; color: var(--accent-soft); }
.invite p { flex: 1; min-width: 14rem; margin: 0; font-size: 13.5px; color: var(--muted); }
.invite strong { color: var(--text); }
.btns { display: flex; gap: 0.4rem; }
.list { display: flex; flex-direction: column; gap: 1px; margin: 0; padding: 0.75rem 1.25rem 2rem; list-style: none; }
.item { display: flex; align-items: center; gap: 0.75rem; width: 100%; padding: 0.7rem 0.85rem; border: 0; border-radius: 8px; background: none; text-align: start; cursor: pointer; transition: background 0.2s var(--ease); }
.item:hover { background: var(--surface-2); }
.dot { flex: none; width: 7px; height: 7px; border-radius: 50%; }
.item.unread .dot { background: var(--accent); }
.text { flex: 1; min-width: 0; font-size: 14px; color: var(--muted); }
.item.unread .text { color: var(--text); }
time { flex: none; font-size: 12px; font-variant-numeric: tabular-nums; color: var(--muted); }
.item:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: -2px; }
</style>
