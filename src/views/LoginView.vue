<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { APP_NAME } from '../config'
import { useAuth } from '../composables/useAuth'
import AppLogo from '../components/AppLogo.vue'
import BaseInput from '../components/BaseInput.vue'
import BaseButton from '../components/BaseButton.vue'
import GoogleButton from '../components/GoogleButton.vue'
import SquiggleLine from '../components/SquiggleLine.vue'

const { login, register, loginWithGoogle } = useAuth()
const route = useRoute()
const router = useRouter()

// /login?modo=cadastro abre direto no cadastro
const isRegister = computed(() => route.query.modo === 'cadastro')
const toggleMode = () => router.replace({ query: { ...route.query, modo: isRegister.value ? undefined : 'cadastro' } })

const form = reactive({ username: '', password: '', email: '', first_name: '', last_name: '' })
const error = ref('')
const loading = ref(false)

// Roda a ação e, dando certo, vai pra página que o usuário tentou abrir
async function run(action) {
  error.value = ''
  loading.value = true
  try {
    await action()
    router.push(route.query.next || '/explorar')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

const submit = () => run(() => (isRegister.value ? register({ ...form }) : login(form.username, form.password)))
</script>

<template>
  <div class="auth">
    <SquiggleLine class="line" :delay="0.6" :duration="2.8" />

    <main class="content">
      <header v-reveal.stagger.now class="head">
        <AppLogo :show-name="false" :size="30" />
        <h1 class="serif">{{ isRegister ? 'Comece em um minuto.' : 'Que bom te ver de novo.' }}</h1>
        <p class="muted">
          {{ isRegister ? `Crie sua conta no ${APP_NAME} e publique o que quiser.` : `Entre na sua conta do ${APP_NAME}.` }}
        </p>
        <p class="muted small">
          {{ isRegister ? 'Já tem conta?' : 'Ainda não tem conta?' }}
          <a href="#" @click.prevent="toggleMode">{{ isRegister ? 'Entrar' : 'Cadastre-se' }}</a>
        </p>
      </header>

      <form :key="isRegister" v-reveal.stagger.now="0.15" class="form" @submit.prevent="submit">
        <template v-if="isRegister">
          <div class="two-cols">
            <BaseInput v-model="form.first_name" label="Nome" placeholder="Nome" autocomplete="given-name" />
            <BaseInput v-model="form.last_name" label="Sobrenome" placeholder="Sobrenome" autocomplete="family-name" />
          </div>
          <BaseInput v-model="form.email" label="E-mail" type="email" placeholder="voce@email.com" autocomplete="email" />
        </template>
        <BaseInput v-model="form.username" label="Usuário *" placeholder="Seu usuário" required autocomplete="username" />
        <BaseInput
          v-model="form.password"
          label="Senha *"
          type="password"
          placeholder="••••••••"
          required
          :autocomplete="isRegister ? 'new-password' : 'current-password'"
        />
        <p v-if="error" class="alert alert-error">{{ error }}</p>
        <BaseButton type="submit" block :loading="loading">{{ isRegister ? 'Criar conta' : 'Entrar' }}</BaseButton>

        <div class="divider"><span>ou</span></div>
        <GoogleButton @credential="(c) => run(() => loginWithGoogle(c))" />
      </form>
    </main>

    <footer class="foot small muted">
      <span>© {{ new Date().getFullYear() }} {{ APP_NAME }}</span>
      <RouterLink to="/">Voltar ao início</RouterLink>
    </footer>
  </div>
</template>

<style scoped>
.auth {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
/* A linha passa POR TRÁS do formulário, como na referência */
.line { position: absolute; left: 50%; top: 44%; width: 100%; min-width: 900px; transform: translateX(-50%); z-index: 0; }
.content {
  position: relative;
  z-index: 1;
  flex: 1;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-4) var(--space-5);
}
.head { display: flex; flex-direction: column; align-items: center; text-align: center; gap: var(--space-2); margin-bottom: var(--space-5); }
.head h1 { font-size: clamp(2rem, 5vw, 2.6rem); margin: var(--space-3) 0 0; }
.head p { margin: 0; }
.form { display: flex; flex-direction: column; gap: var(--space-3); }
.divider { display: flex; justify-content: center; color: var(--color-muted); font-size: var(--font-size-xs); }
.divider span { background: var(--color-bg); padding: 0 var(--space-2); } /* a linha passa por trás do "ou" */
.foot {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  padding: var(--space-4);
  max-width: var(--container);
  width: 100%;
  margin: 0 auto;
}
.foot a { color: var(--color-muted); }
@media (max-width: 760px) {
  .line { transform: translateX(-28%); } /* traz um laço para dentro da tela */
}
</style>
