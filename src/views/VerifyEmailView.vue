<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../services/api'
import { useAuth } from '../composables/useAuth'
import FlaticonIcon from '../components/FlaticonIcon.vue'

const route = useRoute()
const { user, init, loadMe } = useAuth()
const state = ref('loading')
const message = ref('')
const email = ref('')
const sent = ref(false)
const sending = ref(false)

async function resend() {
  if (sending.value) return
  sending.value = true
  try {
    await api('/api/auth/verify-email/resend/', { method: 'POST' })
    sent.value = true
  } catch (e) {
    message.value = e.message
  } finally {
    sending.value = false
  }
}

async function confirm() {
  state.value = 'loading'
  await init()
  try {
    const r = await api('/api/auth/verify-email/', { method: 'POST', body: { token: route.query.token || '' }, auth: false })
    email.value = r.email
    state.value = 'ok'
    if (user.value) await loadMe()
  } catch (e) {
    message.value = e.message
    // sem status é rede: o link pode estar bom, então não chamamos de inválido
    state.value = e.status ? 'error' : 'offline'
  }
}

onMounted(confirm)
</script>

<template>
  <div class="verify">
    <header class="bar"><RouterLink to="/" class="logo" aria-label="Novexo, ir para o site">NOVEXO</RouterLink></header>
    <main class="wrap">
      <section class="card" aria-live="polite">
        <template v-if="state === 'loading'"><p class="sub">Confirmando seu e-mail…</p></template>
        <template v-else-if="state === 'ok'">
          <span class="mark ok" aria-hidden="true"><FlaticonIcon name="check" /></span>
          <h1>E-mail confirmado</h1>
          <p class="sub"><strong>{{ email }}</strong> está confirmado. Pode fechar esta aba ou seguir para o Novexo.</p>
          <RouterLink class="btn primary" :to="user ? '/comecar' : '/login'">{{ user ? 'Ir para o Novexo' : 'Entrar' }}</RouterLink>
        </template>
        <template v-else-if="state === 'offline'">
          <span class="mark" aria-hidden="true"><FlaticonIcon name="wifi-slash" /></span>
          <h1>Sem conexão</h1>
          <p class="sub">Não conseguimos falar com o servidor para confirmar seu e-mail. O link continua valendo.</p>
          <button type="button" class="btn primary" @click="confirm">Tentar de novo</button>
        </template>
        <template v-else>
          <span class="mark" aria-hidden="true"><FlaticonIcon name="exclamation" /></span>
          <h1>Link inválido</h1>
          <p class="error" role="alert">{{ message }}</p>
          <button v-if="user && !sent" type="button" class="btn primary" :disabled="sending" @click="resend">Mandar um link novo para {{ user.email }}</button>
          <p v-else-if="sent" class="sub">Pronto, mandamos um link novo. Confira sua caixa de entrada (e o spam).</p>
          <RouterLink v-else class="btn primary" to="/login">Entrar para pedir um link novo</RouterLink>
        </template>
      </section>
    </main>
  </div>
</template>

<style scoped>
.verify { --white: #f8f8f8; --muted: rgb(248 248 248 / 0.62); --line: rgb(255 255 255 / 0.1); min-height: 100vh; min-height: 100svh; background: #000; color: var(--white); font: 400 15px/1.5 'Geist', 'Helvetica Neue', system-ui, sans-serif; }
.bar { display: flex; align-items: center; height: 64px; padding: 0 clamp(1rem, 4vw, 2.5rem); }
.logo { font: 900 1.25rem/1 'Lexend', 'Geist', system-ui, sans-serif; letter-spacing: -0.02em; color: var(--white); text-decoration: none; }
.wrap { display: grid; place-items: center; min-height: calc(100svh - 64px); padding: 1rem 1rem 4rem; }
.card { display: flex; flex-direction: column; align-items: flex-start; gap: 1rem; width: min(100%, 28rem); padding: clamp(1.5rem, 4vw, 2.25rem); border: 1px solid var(--line); border-radius: 18px; background: #111; }
.mark { display: grid; place-items: center; width: 48px; height: 48px; border: 1px solid var(--line); border-radius: 50%; background: #181818; font: 700 1.3rem/1 'Geist', system-ui, sans-serif; color: #ff8a7a; }
.mark.ok { color: #7fc47a; }
h1 { margin: 0; color: var(--white); font: 900 clamp(1.8rem, 5vw, 2.4rem)/1 'Lexend', 'Geist', system-ui, sans-serif; text-transform: uppercase; letter-spacing: -0.03em; }
.sub { margin: 0; color: var(--muted); }
.sub strong { color: var(--white); font-weight: 500; overflow-wrap: anywhere; }
.btn { display: grid; place-items: center; width: 100%; min-height: 48px; padding: 0.6rem 1.25rem; border: 1px solid var(--white); border-radius: 999px; background: var(--white); font: 600 0.9375rem/1.2 'Geist', system-ui, sans-serif; color: #000; text-align: center; text-decoration: none; cursor: pointer; }
.btn:active { transform: scale(0.98); }
.error { margin: 0; width: 100%; padding: 0.7rem 0.85rem; border: 1px solid rgb(255 91 77 / 0.4); border-radius: 10px; background: rgb(255 91 77 / 0.08); font-size: 0.875rem; }
:is(.btn, .logo):focus-visible { outline: 2px solid #fba45c; outline-offset: 3px; }
</style>
