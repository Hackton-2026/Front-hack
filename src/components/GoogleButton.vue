<script setup>
import { onMounted, ref } from 'vue'
import { GOOGLE_CLIENT_ID } from '../config'
import { loadGoogle } from '../utils/google'

// Botão oficial do Google Identity Services. Emite "credential" (ID token) para mandar ao backend.
const props = defineProps({ theme: { type: String, default: 'outline' } }) // outline | filled_black | filled_blue
const emit = defineEmits(['credential'])
const el = ref()

onMounted(async () => {
  if (!GOOGLE_CLIENT_ID) return
  await loadGoogle()
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: ({ credential }) => emit('credential', credential),
  })
  // Largura igual à do formulário (o Google limita a 400px)
  window.google.accounts.id.renderButton(el.value, {
    theme: props.theme,
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
