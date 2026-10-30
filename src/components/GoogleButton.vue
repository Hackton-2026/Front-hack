<script setup>
import { onMounted, ref } from 'vue'
import { GOOGLE_CLIENT_ID } from '../config'
import { loadGoogle } from '../utils/google'

const props = defineProps({ theme: { type: String, default: 'outline' } })
const emit = defineEmits(['credential'])
const el = ref()
const failed = ref(false)

onMounted(async () => {
  if (!GOOGLE_CLIENT_ID) return
  try {
    await loadGoogle()
  } catch {
    // bloqueador ou rede: sem aviso, o botão só sumia
    failed.value = true
    return
  }
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: ({ credential }) => emit('credential', credential),
  })
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
  <p v-if="GOOGLE_CLIENT_ID && failed" class="google-off">O login com Google não carregou. Confira a conexão ou o bloqueador de anúncios e recarregue a página.</p>
  <div v-else-if="GOOGLE_CLIENT_ID" ref="el" class="google-btn" />
</template>

<style scoped>
.google-btn { display: flex; justify-content: center; min-height: 44px; }
.google-off { margin: 0; font-size: 0.8125rem; text-align: center; opacity: 0.75; }
</style>
