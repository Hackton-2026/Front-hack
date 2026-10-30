<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { TURNSTILE_SITE_KEY } from '../config'

const token = defineModel({ type: String, default: '' })
const el = ref()
const failed = ref(false)
let widgetId = null

let loading
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve()
  loading ||= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.onload = resolve
    s.onerror = () => { loading = null; reject(new Error('Turnstile indisponível')) }
    document.head.appendChild(s)
  })
  return loading
}

onMounted(async () => {
  if (!TURNSTILE_SITE_KEY) return
  try {
    await loadTurnstile()
  } catch {
    failed.value = true
    return
  }
  widgetId = window.turnstile.render(el.value, {
    sitekey: TURNSTILE_SITE_KEY,
    language: 'pt-br',
    theme: 'dark',
    // só aparece quando o Cloudflare precisa de um clique: a maioria das pessoas nem vê, e o cadastro cabe sem rolar
    appearance: 'interaction-only',
    callback: (t) => { token.value = t },
    'expired-callback': () => { token.value = '' },
    'error-callback': () => { token.value = '' },
  })
})
onUnmounted(() => { if (widgetId != null) window.turnstile?.remove(widgetId) })

// cada token vale uma vez: depois de um envio recusado, pede outro
defineExpose({ reset: () => { token.value = ''; if (widgetId != null) window.turnstile?.reset(widgetId) } })
</script>

<template>
  <p v-if="TURNSTILE_SITE_KEY && failed" class="turnstile-off">A verificação anti-robô não carregou. Confira a conexão ou o bloqueador de anúncios e recarregue a página.</p>
  <div v-else-if="TURNSTILE_SITE_KEY" ref="el" class="turnstile" />
</template>

<style scoped>
.turnstile:empty { display: none; }
.turnstile-off { margin: 0; font-size: 0.8125rem; opacity: 0.75; }
</style>
