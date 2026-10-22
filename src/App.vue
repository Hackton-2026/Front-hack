<script setup>
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import AppNav from './components/AppNav.vue'
import ChatBot from './components/ChatBot.vue'
import { useAuth } from './composables/useAuth'

const { user } = useAuth()
const router = useRouter()
// Deslogou (botão Sair ou token expirado) em página privada → volta pro login
watch(user, (u) => {
  if (!u && router.currentRoute.value.meta.auth) router.push('/login')
})
</script>

<template>
  <RouterView v-if="$route.meta.bare" />
  <template v-else>
    <AppNav />
    <main class="container">
      <RouterView />
    </main>
    <ChatBot v-if="user" />
  </template>
</template>
