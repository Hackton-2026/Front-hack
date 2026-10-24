<script setup>
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import AppNav from './components/AppNav.vue'
import AppShell from './components/app/AppShell.vue'
import ChatBot from './components/ChatBot.vue'
import { useAuth } from './composables/useAuth'
import { useSmoothScroll } from './composables/useSmoothScroll'

const { user } = useAuth()
useSmoothScroll()
const router = useRouter()
// Deslogou (botão Sair ou token expirado) em página privada → volta pro login
watch(user, (u) => {
  if (!u && router.currentRoute.value.meta.auth) router.push('/login')
})
</script>

<template>
  <RouterView v-if="$route.meta.bare" />
  <!-- Área logada do Novexo: a casca fica montada e só o conteúdo troca entre as rotas -->
  <AppShell v-else-if="$route.meta.app"><RouterView /></AppShell>
  <template v-else>
    <AppNav />
    <main class="container">
      <RouterView />
    </main>
    <ChatBot v-if="user" />
  </template>
</template>
