<script setup>
// Abrir o link de um convite (/convite/<token>): mostra o projeto e quem convidou, e a pessoa aceita ou recusa.
// Só aceita quem está logado com o e-mail do convite; com outra conta, oferece trocar de conta.
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useWorkspace } from '../composables/useWorkspace'
import { useUi } from '../composables/useUi'
import AppIcon from '../components/app/AppIcon.vue'

const props = defineProps({ token: { type: String, required: true } })
const router = useRouter()
const { user, logout } = useAuth()
const { inviteInfo, acceptInvite, declineInvite } = useWorkspace()
const ui = useUi()
ui.crumb = 'Convite para projeto'

const PERM = { view: 'ver', comment: 'comentar', edit: 'editar', full: 'acesso total' }
const inv = ref(null)
const error = ref('')
const busy = ref(false)
const done = ref('') // declined

async function fetchInvite() {
  error.value = ''
  inv.value = null
  try {
    inv.value = await inviteInfo(props.token)
  } catch (e) {
    error.value = e.status === 404 ? 'Este convite não existe ou foi cancelado por quem convidou.' : e.message
  }
}
watch(() => props.token, fetchInvite, { immediate: true })

const message = computed(() => {
  if (!inv.value) return ''
  if (inv.value.state === 'accepted') return 'Este convite já foi aceito.'
  if (inv.value.state === 'declined') return 'Este convite foi recusado.'
  if (inv.value.state === 'expired') return 'Este convite venceu. Peça um novo para quem convidou você.'
  return ''
})

async function accept() {
  busy.value = true
  error.value = ''
  try {
    const res = await acceptInvite(props.token)
    ui.toast(`Você entrou no projeto ${res.project_name}.`)
    router.replace(`/projetos/${res.project}/visao-geral`)
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}
async function decline() {
  busy.value = true
  error.value = ''
  try {
    await declineInvite(props.token)
    done.value = 'declined'
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}
async function switchAccount() {
  await logout()
  router.push({ path: '/login', query: { next: `/convite/${props.token}` } })
}
</script>

<template>
  <div class="invite-page">
    <section class="card" aria-live="polite">
      <span class="icon"><AppIcon name="user" :size="22" /></span>
      <template v-if="inv">
        <h1>{{ inv.invited_by || 'Alguém' }} convidou você para <strong>{{ inv.project_name }}</strong></h1>
        <p class="sub">Convite para {{ inv.email }} · permissão para {{ PERM[inv.permission] || inv.permission }}. Você entra só neste projeto: vê as tarefas, as páginas e o chat dele.</p>

        <p v-if="done === 'declined'" class="note">Convite recusado. Você pode fechar esta página.</p>
        <p v-else-if="message" class="note">{{ message }}</p>
        <template v-else-if="!inv.for_me">
          <p class="note">Você entrou como <strong>{{ user?.email || user?.username }}</strong>, mas o convite é para <strong>{{ inv.email }}</strong>.</p>
          <div class="actions"><button type="button" class="pg-btn primary" @click="switchAccount">Entrar com {{ inv.email }}</button></div>
        </template>
        <div v-else class="actions">
          <button type="button" class="pg-btn primary" :disabled="busy" @click="accept">{{ busy ? 'Entrando…' : 'Aceitar e abrir o projeto' }}</button>
          <button type="button" class="pg-btn" :disabled="busy" @click="decline">Recusar</button>
        </div>
      </template>
      <p v-else-if="!error" class="sub">Carregando o convite…</p>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <RouterLink v-if="error || message || done" to="/inicio" class="back">Ir para o início</RouterLink>
    </section>
  </div>
</template>

<style scoped>
.invite-page { display: grid; place-items: center; min-height: 100%; padding: 2rem 1.25rem; }
.card { display: flex; flex-direction: column; align-items: flex-start; gap: 0.8rem; width: 100%; max-width: 30rem; padding: 1.6rem; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); }
.icon { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 12px; background: rgb(229 101 21 / 0.16); color: var(--accent-soft); }
h1 { margin: 0; font: 600 1.25rem/1.3 'Geist', system-ui, sans-serif; color: var(--text); text-wrap: balance; }
h1 strong { color: var(--accent-soft); }
.sub { margin: 0; color: var(--muted); line-height: 1.55; }
.note { margin: 0; line-height: 1.5; }
.actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.pg-btn:disabled { opacity: 0.6; cursor: default; }
.error { margin: 0; padding: 0.6rem 0.8rem; border: 1px solid rgb(229 101 21 / 0.45); border-radius: 8px; background: rgb(229 101 21 / 0.1); font-size: 13px; color: #ffd2b3; }
.back { font-size: 13px; color: var(--accent-soft); }
</style>
