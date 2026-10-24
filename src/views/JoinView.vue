<script setup>
// Link de convite (/entrar/<código>): qualquer pessoa abre, vê o projeto e entra. Sem conta, cria (ou entra) e volta
// para cá com ?entrar=1, que já faz a entrada sozinha e abre o projeto.
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../services/api'
import { useAuth } from '../composables/useAuth'
import { useWorkspace } from '../composables/useWorkspace'
import { useUi } from '../composables/useUi'
import ProjectIcon from '../components/app/ProjectIcon.vue'

const props = defineProps({ token: { type: String, required: true } })
const route = useRoute()
const router = useRouter()
const { user, ready, init } = useAuth()
const { load } = useWorkspace()
const { toast } = useUi()

const PERM = { view: 'ver as tarefas, páginas e o chat', comment: 'ver e comentar', edit: 'criar e editar tarefas, ciclos e páginas', full: 'editar e também convidar pessoas' }
const info = ref(null)
const error = ref('')
const busy = ref(false)
const back = `/entrar/${props.token}?entrar=1` // volta do login/cadastro já entrando

async function join() {
  busy.value = true
  error.value = ''
  try {
    const r = await api(`/api/invite-links/${encodeURIComponent(props.token)}/`, { method: 'POST' })
    await load() // o projeto novo aparece na barra lateral
    toast(r.joined ? `Você entrou no projeto ${r.project_name}.` : `Você já participa de ${r.project_name}.`)
    router.replace(`/projetos/${r.project}/visao-geral`)
  } catch (e) {
    error.value = e.message
    busy.value = false
  }
}

onMounted(async () => {
  if (!ready.value) await init()
  try {
    info.value = await api(`/api/invite-links/${encodeURIComponent(props.token)}/`, { auth: !!user.value })
  } catch (e) {
    error.value = e.status === 404 ? 'Este link de convite não vale mais. Peça um novo para quem mandou.' : e.message
    return
  }
  if (user.value && (route.query.entrar || info.value.already_member)) join()
})
</script>

<template>
  <div class="join">
    <header class="bar"><RouterLink to="/" class="logo" aria-label="Novexo, início">NOVEXO</RouterLink></header>
    <main class="wrap">
      <section class="card" aria-live="polite">
        <template v-if="info">
          <span class="proj" :style="{ '--c': info.color }"><ProjectIcon :icon="info.icon" :color="info.color" :size="22" /></span>
          <p class="kicker">{{ info.invited_by }} convidou você</p>
          <h1>{{ info.project_name }}</h1>
          <p class="sub">Você entra só neste projeto, com permissão para {{ PERM[info.permission] || info.permission }}. {{ info.people }} {{ info.people === 1 ? 'pessoa já participa' : 'pessoas já participam' }}.</p>

          <div v-if="user" class="actions">
            <button type="button" class="btn primary" :disabled="busy" @click="join">{{ busy ? 'Entrando…' : 'Entrar no projeto' }}</button>
            <p class="who">Você está como <strong>{{ user.first_name || user.username }}</strong> ({{ user.email }}).</p>
          </div>
          <div v-else class="actions">
            <RouterLink class="btn primary" :to="{ path: '/login', query: { modo: 'cadastro', next: back } }">Criar conta e entrar</RouterLink>
            <RouterLink class="btn" :to="{ path: '/login', query: { next: back } }">Já tenho conta</RouterLink>
            <p class="who">Leva menos de um minuto. Depois do cadastro você cai direto no projeto.</p>
          </div>
        </template>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <p v-if="!info && !error" class="sub">Carregando convite…</p>
        <RouterLink v-if="error" class="btn" to="/">Ir para o site</RouterLink>
      </section>
    </main>
  </div>
</template>

<style scoped>
.join {
  --white: #f8f8f8;
  --muted: rgb(248 248 248 / 0.62);
  --line: rgb(255 255 255 / 0.1);
  min-height: 100vh;
  min-height: 100svh;
  background: #000;
  color: var(--white);
  font: 400 15px/1.5 'Geist', 'Helvetica Neue', system-ui, sans-serif;
}
.bar { display: flex; align-items: center; height: 64px; padding: 0 clamp(1rem, 4vw, 2.5rem); }
.logo { font: 900 1.25rem/1 'Lexend', 'Geist', system-ui, sans-serif; letter-spacing: -0.02em; color: var(--white); text-decoration: none; }
.wrap { display: grid; place-items: center; min-height: calc(100svh - 64px); padding: 1rem 1rem 4rem; }
.card { display: flex; flex-direction: column; align-items: flex-start; gap: 1rem; width: min(100%, 28rem); padding: clamp(1.5rem, 4vw, 2.25rem); border: 1px solid var(--line); border-radius: 18px; background: #111; }
.proj { display: grid; place-items: center; width: 48px; height: 48px; border: 1px solid var(--line); border-radius: 12px; background: #181818; }
.kicker { margin: 0; font-size: 0.875rem; color: var(--muted); }
h1 { margin: -0.4rem 0 0; color: var(--white); font: 900 clamp(2rem, 6vw, 2.75rem)/0.98 'Lexend', 'Geist', system-ui, sans-serif; text-transform: uppercase; letter-spacing: -0.03em; overflow-wrap: anywhere; }
.sub { margin: 0; color: var(--muted); }
.actions { display: flex; flex-direction: column; gap: 0.6rem; width: 100%; margin-top: 0.4rem; }
.btn { display: grid; place-items: center; height: 48px; padding: 0 1.25rem; border: 1px solid var(--line); border-radius: 999px; background: none; font: 600 0.9375rem/1 'Geist', system-ui, sans-serif; color: var(--white); text-decoration: none; cursor: pointer; transition: transform 0.15s ease, background 0.15s ease; }
.btn:hover { background: #1b1b1b; }
.btn.primary { border-color: var(--white); background: var(--white); color: #000; }
.btn.primary:hover { background: var(--white); transform: translateY(-1px); }
.btn:active { transform: scale(0.98); }
.btn:disabled { opacity: 0.6; cursor: default; }
.who { margin: 0.2rem 0 0; font-size: 0.8125rem; color: var(--muted); text-align: center; }
.who strong { color: var(--white); font-weight: 500; }
.error { margin: 0; padding: 0.7rem 0.85rem; border: 1px solid rgb(255 91 77 / 0.4); border-radius: 10px; background: rgb(255 91 77 / 0.08); font-size: 0.875rem; }
:is(.btn, .logo):focus-visible { outline: 2px solid #fba45c; outline-offset: 3px; }
</style>
