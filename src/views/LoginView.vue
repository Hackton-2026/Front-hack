<script setup>
// Login e cadastro na estrutura da tela de login do remote.com: formulário escuro à esquerda,
// painel com arte e headline à direita (some no celular).
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useUi } from '../composables/useUi'
import { api } from '../services/api'
import GooeyButton from '../components/GooeyButton.vue'
import GoogleButton from '../components/GoogleButton.vue'

const { login, register, loginWithGoogle } = useAuth()
const { toast } = useUi()
const route = useRoute()
const router = useRouter()

// /login?modo=cadastro abre direto no cadastro
const isRegister = computed(() => route.query.modo === 'cadastro')
const toggleMode = () => {
  error.value = ''
  router.replace({ query: { ...route.query, modo: isRegister.value ? undefined : 'cadastro' } })
}

// o e-mail digitado no rodapé do site chega pelo estado da navegação (não pela URL)
const form = reactive({ first_name: '', email: String(history.state?.email || ''), password: '', whatsapp: '' })
const showPassword = ref(false)
const error = ref('')
const loading = ref(false)

// Roda a ação e, dando certo, vai pra página que o usuário tentou abrir
async function run(action) {
  error.value = ''
  loading.value = true
  try {
    const to = await action()
    router.push(to || route.query.next || '/comecar')
  } catch (e) {
    // erros de campo do DRF ({password: [...]}) sem o nome técnico do campo na frente
    const fields = e.data && !e.data.detail && typeof e.data === 'object' ? Object.values(e.data).flat() : null
    error.value = fields ? fields.join('\n') : e.message
  } finally {
    loading.value = false
  }
}

// WhatsApp é opcional: a conta é criada mesmo se o código não puder ser enviado; a confirmação fica em Ajustes › WhatsApp
async function signUp() {
  const { whatsapp, ...data } = form
  await register(data)
  if (!whatsapp.trim()) return null
  try {
    await api('/api/whatsapp/me/', { method: 'POST', body: { phone: whatsapp } })
    toast('Mandamos um código no seu WhatsApp. Digite ele aqui para confirmar o número.')
  } catch (e) {
    toast(`Conta criada, mas o WhatsApp não foi cadastrado: ${e.message}`)
  }
  return '/ajustes?tab=whatsapp'
}
const submit = () => run(() => (isRegister.value ? signUp() : login(form.email, form.password)))
</script>

<template>
  <div class="auth">
    <main class="side">
      <div class="box">
        <RouterLink to="/" class="logo" aria-label="Novexo, voltar ao início">NOVEXO</RouterLink>
        <h1>{{ isRegister ? 'Crie sua conta' : 'Que bom te ver de novo!' }}</h1>
        <p class="switch">
          {{ isRegister ? 'Já tem uma conta?' : 'Ainda não tem conta?' }}
          <button type="button" class="link" @click="toggleMode">{{ isRegister ? 'Entrar' : 'Cadastre-se agora' }}</button>
        </p>

        <form class="form" novalidate @submit.prevent="submit">
          <label v-if="isRegister" class="field">
            <span>Nome</span>
            <input v-model="form.first_name" autocomplete="given-name" />
          </label>
          <label class="field">
            <span>{{ isRegister ? 'E-mail' : 'E-mail ou usuário' }}</span>
            <input v-model="form.email" :type="isRegister ? 'email' : 'text'" required :autocomplete="isRegister ? 'email' : 'username'" />
          </label>
          <label v-if="isRegister" class="field">
            <span>WhatsApp <small class="opt">(opcional)</small></span>
            <input v-model="form.whatsapp" type="tel" inputmode="tel" autocomplete="tel" placeholder="(11) 91234-5678" aria-describedby="wa-hint" />
            <small id="wa-hint" class="opt">Para receber os avisos dos seus projetos. Confirmamos com um código no WhatsApp.</small>
          </label>
          <label class="field">
            <span>Senha</span>
            <span class="pass">
              <input v-model="form.password" :type="showPassword ? 'text' : 'password'" required :autocomplete="isRegister ? 'new-password' : 'current-password'" />
              <button type="button" class="eye" :aria-label="showPassword ? 'Esconder senha' : 'Mostrar senha'" :aria-pressed="showPassword" @click="showPassword = !showPassword">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                  <path v-if="showPassword" d="M4 4l16 16" />
                </svg>
              </button>
            </span>
          </label>
          <p v-if="isRegister" class="hint">Use pelo menos 8 caracteres, misturando letras e números.</p>

          <p v-if="error" class="error" role="alert">{{ error }}</p>
          <GooeyButton type="submit" variant="primary" :disabled="loading" class="submit">
            {{ loading ? 'Aguarde…' : isRegister ? 'Criar conta' : 'Entrar' }}
          </GooeyButton>
        </form>

        <div class="divider"><span>ou</span></div>
        <GoogleButton theme="filled_black" @credential="(c) => run(() => loginWithGoogle(c))" />
      </div>
    </main>

    <aside class="art" aria-hidden="true">
      <div class="art__shapes" />
      <div class="art__glow" />
      <div class="art__copy">
        <p class="art__title">Organize o trabalho que seu time sempre precisou.</p>
        <p class="art__sub">Tarefas, quadros e metas num só lugar, do primeiro sprint ao centésimo.</p>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.auth {
  --bg: #111111;
  --field: #0b0b0b;
  --line: #2b2b2b;
  --text: #f8f8f8;
  --muted: #a3a3a0;
  --orange: #e56515;
  --orange-soft: #fba45c;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  min-height: 100vh;
  min-height: 100svh;
  background: var(--bg);
  color: var(--text);
  font-family: 'Geist', 'Helvetica Neue', system-ui, sans-serif;
}
:global(html:has(.auth)), :global(html:has(.auth) body) { background: #111111; }
@media (max-width: 900px) { .auth { grid-template-columns: minmax(0, 1fr); } .art { display: none; } }

.side { display: grid; place-items: center; padding: 3rem 1.25rem; }
.box { display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 27rem; }
.logo { font: 800 2rem/1 'Lexend', system-ui, sans-serif; letter-spacing: -0.02em; color: var(--text); text-decoration: none; }
h1 { margin: 1.75rem 0 0.75rem; font: 800 clamp(1.6rem, 2.4vw, 2rem)/1.1 'Lexend', system-ui, sans-serif; letter-spacing: -0.02em; color: var(--text); text-align: center; }
.switch { margin: 0 0 2.25rem; font-size: 0.875rem; color: var(--text); }
.link { padding: 0; border: 0; background: none; font: 600 0.875rem/1 inherit; color: var(--text); text-decoration: underline; text-underline-offset: 4px; cursor: pointer; }
.link:hover { color: var(--orange-soft); }
.link:focus-visible, .eye:focus-visible { outline: 2px solid var(--orange-soft); outline-offset: 2px; border-radius: 4px; }

.form { display: flex; flex-direction: column; gap: 1.25rem; width: 100%; }
.field { display: flex; flex-direction: column; gap: 0.5rem; }
.field > span:first-child { font-size: 0.875rem; font-weight: 600; }
.opt { font-size: 0.78rem; font-weight: 400; color: var(--muted); }
.field input {
  width: 100%;
  height: 2.75rem;
  padding: 0 0.9rem;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--field);
  font: 400 1rem/1 inherit;
  color: var(--text);
  outline: none;
  transition: border-color 0.2s;
}
.field input:focus { border-color: var(--orange); }
.pass { position: relative; display: block; }
.pass input { padding-right: 3rem; }
.eye { position: absolute; top: 50%; right: 0.5rem; display: grid; place-items: center; width: 2rem; height: 2rem; padding: 0; border: 0; background: none; color: var(--muted); cursor: pointer; translate: 0 -50%; }
.eye svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; }
.eye:hover { color: var(--text); }
.hint { margin: -0.5rem 0 0; font-size: 0.8125rem; color: var(--muted); }
.error { margin: 0; padding: 0.75rem 0.9rem; border-radius: 6px; background: rgb(229 101 21 / 0.12); border: 1px solid rgb(229 101 21 / 0.4); font-size: 0.875rem; white-space: pre-line; color: #ffd2b3; }
.submit { align-self: center; margin-top: 0.5rem; }

.divider { display: flex; align-items: center; gap: 1rem; width: 100%; margin: 1.75rem 0 1.25rem; font-size: 0.8125rem; color: var(--muted); }
.divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--line); }

/* Painel da direita: blocos de luz em tons da paleta, no lugar dos cubos do remote */
.art { position: sticky; top: 0.5rem; height: calc(100svh - 0.5rem); margin: 0.5rem 0 0 0; overflow: hidden; border-radius: 16px 0 0 0; background: var(--orange-soft); }
.art__shapes {
  position: absolute;
  inset: -10%;
  background:
    radial-gradient(circle at 22% 18%, #ffe3ec 0 12%, transparent 30%),
    conic-gradient(from 45deg at 30% 30%, #fde2c8, #fba45c 25%, #ffd7a8 50%, #f7b27a 75%, #fde2c8),
    #fba45c;
  filter: saturate(1.1);
}
.art__shapes::before, .art__shapes::after {
  content: '';
  position: absolute;
  width: 46%;
  aspect-ratio: 1;
  border-radius: 12%;
  rotate: 45deg;
  filter: blur(2px);
}
.art__shapes::before { top: 8%; right: 6%; background: linear-gradient(135deg, #fff4d6, #ffc46b 55%, #ff8a7a); opacity: 0.9; }
.art__shapes::after { bottom: 10%; left: 18%; background: linear-gradient(135deg, #ffe0ea, #fba45c 50%, #e56515); opacity: 0.75; }
/* mini motion: os dois blocos flutuam e giram de leve em ritmos diferentes, e uma luz rosada passeia por cima */
.art__glow { position: absolute; top: -15%; left: -15%; width: 70%; aspect-ratio: 1; border-radius: 50%; background: radial-gradient(circle, rgb(255 228 238 / 0.85), transparent 65%); mix-blend-mode: soft-light; pointer-events: none; }
@media (prefers-reduced-motion: no-preference) {
  .art__shapes::before { animation: art-flutua-a 14s ease-in-out infinite alternate; }
  .art__shapes::after { animation: art-flutua-b 17s ease-in-out infinite alternate; }
  .art__glow { animation: art-luz 20s ease-in-out infinite alternate; }
}
@keyframes art-flutua-a { from { translate: 0 0; rotate: 45deg; scale: 1; } to { translate: -4% 6%; rotate: 53deg; scale: 1.06; } }
@keyframes art-flutua-b { from { translate: 0 0; rotate: 45deg; scale: 1; } to { translate: 7% -5%; rotate: 38deg; scale: 0.95; } }
@keyframes art-luz { from { translate: 0 0; } 50% { translate: 55% 25%; } to { translate: 20% 70%; } }
.art__copy { position: absolute; inset: auto 2.5rem 2.5rem; display: flex; flex-direction: column; gap: 1.25rem; color: #1a1a1a; }
.art__title { margin: 0; max-width: 12ch; font: 500 clamp(3rem, 5.4vw, 5.25rem)/0.95 'Geist', system-ui, sans-serif; letter-spacing: -0.055em; text-wrap: balance; }
.art__sub { margin: 0; max-width: 28ch; font: 400 clamp(1.25rem, 1.9vw, 1.75rem)/1.1 'Geist', system-ui, sans-serif; letter-spacing: -0.03em; }
</style>
