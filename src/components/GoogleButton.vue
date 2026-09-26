<script setup>
import { onMounted, ref } from 'vue'
import { GOOGLE_CLIENT_ID } from '../config'

// Botão oficial do Google Identity Services. Emite "credential" (ID token) para mandar ao backend.
const emit = defineEmits(['credential'])
const el = ref()

function loadScript() {
  if (window.google?.accounts) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
}

onMounted(async () => {
  if (!GOOGLE_CLIENT_ID) return
  await loadScript()
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: ({ credential }) => emit('credential', credential),
  })
  // Largura igual à do formulário (o Google limita a 400px)
  window.google.accounts.id.renderButton(el.value, {
    theme: 'outline',
    size: 'large',
    shape: 'rectangular',
    text: 'continue_with',
    locale: 'pt-BR',
    width: Math.min(400, el.value.offsetWidth),
  })
})
</script>

<template>
  <div v-if="GOOGLE_CLIENT_ID" ref="el" class="google-btn" />
</template>

<style scoped>
.google-btn { display: flex; justify-content: center; min-height: 44px; }
</style>
