<script setup>
import { nextTick, ref } from 'vue'
import { GOOGLE_CLIENT_ID } from '../../config'
import { loadGoogle } from '../../utils/google'
import AppIcon from './AppIcon.vue'

const emit = defineEmits(['link'])
const SCOPE = 'https://www.googleapis.com/auth/meetings.space.created'
const MEET_LINK = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(\?.*)?$/

const open = ref(false)
const busy = ref(false)
const note = ref('')
const pasted = ref('')
const pasteInput = ref(null)
let token = null

function toggle() {
  open.value = !open.value
  note.value = ''
  if (open.value && GOOGLE_CLIENT_ID) loadGoogle().catch(() => {})
}

async function createSpace(accessToken) {
  const r = await fetch('https://meet.googleapis.com/v2/spaces', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: '{}' })
  if (!r.ok) throw new Error(r.status === 403 ? 'api' : 'google')
  return (await r.json()).meetingUri
}
function fail(reason) {
  busy.value = false
  note.value = reason === 'api'
    ? 'O Google não deixou criar a sala: a Google Meet API precisa estar ativada no projeto do Google Cloud do site. Abra o Meet e cole o link aqui.'
    : 'Não deu para criar a sala pelo Google. Abra o Meet e cole o link aqui.'
  nextTick(() => pasteInput.value?.focus())
}
async function finish(accessToken) {
  try {
    const uri = await createSpace(accessToken)
    busy.value = false
    open.value = false
    emit('link', uri)
  } catch (e) {
    if (e.message !== 'api') token = null
    fail(e.message)
  }
}
function createRoom() {
  if (!window.google?.accounts?.oauth2) return fail('google')
  busy.value = true
  note.value = ''
  if (token && token.until > Date.now()) return finish(token.value)
  window.google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: SCOPE,
    callback: (resp) => {
      if (resp.error || !resp.access_token) return fail('google')
      token = { value: resp.access_token, until: Date.now() + (Number(resp.expires_in) - 60) * 1000 }
      finish(resp.access_token)
    },
    error_callback: () => fail('google'),
  }).requestAccessToken()
}
function sendPasted() {
  const link = pasted.value.trim()
  if (!MEET_LINK.test(link)) { note.value = 'Cole um link do Meet, ex.: https://meet.google.com/abc-defg-hij'; return }
  pasted.value = ''
  open.value = false
  emit('link', link)
}
</script>

<template>
  <div class="meet">
    <button type="button" class="meet__btn" :aria-expanded="open" title="Chamada no Google Meet" @click="toggle"><AppIcon name="video" :size="15" />Chamada</button>
    <div v-if="open" class="meet__pop" role="dialog" aria-label="Chamada no Google Meet" @keydown.esc.stop="open = false">
      <strong>Chamada no Google Meet</strong>
      <p>O link vai para o chat e todo mundo do projeto entra com um clique.</p>
      <button v-if="GOOGLE_CLIENT_ID" type="button" class="pg-btn primary" :disabled="busy" @click="createRoom">{{ busy ? 'Criando sala…' : 'Criar sala agora' }}</button>
      <div class="meet__or"><span>ou</span></div>
      <a class="meet__open" href="https://meet.google.com/new" target="_blank" rel="noopener">Abrir o Meet numa aba nova</a>
      <form class="meet__paste" @submit.prevent="sendPasted">
        <input ref="pasteInput" v-model="pasted" placeholder="Cole o link da chamada" aria-label="Link da chamada do Meet" autocomplete="off" />
        <button type="submit" class="pg-btn" :disabled="!pasted.trim()">Enviar</button>
      </form>
      <p v-if="note" class="meet__note" role="status">{{ note }}</p>
    </div>
  </div>
</template>

<style scoped>
.meet { position: static; } .meet__btn { flex: none; white-space: nowrap; display: inline-flex; align-items: center; gap: 0.35rem; height: 26px; padding: 0 0.6rem; border: 1px solid var(--line); border-radius: 999px; background: none; font-size: 12.5px; color: var(--muted); cursor: pointer; transition: color 0.2s ease, border-color 0.2s ease; }
.meet__btn:hover, .meet__btn[aria-expanded='true'] { border-color: var(--line-strong); color: var(--text); }
.meet__pop { position: absolute; left: 0; right: 0; bottom: calc(100% + 8px); z-index: 5; display: flex; flex-direction: column; gap: 0.55rem; padding: 0.85rem; border: 1px solid var(--line-strong); border-radius: 10px; background: var(--surface); box-shadow: 0 14px 34px rgb(0 0 0 / 0.42); }
.meet__pop strong { font-size: 13.5px; color: var(--text); }
.meet__pop p { margin: 0; font-size: 12.5px; line-height: 1.45; color: var(--muted); }
.meet__pop .pg-btn { justify-content: center; }
.meet__or { display: flex; align-items: center; gap: 0.5rem; font-size: 11.5px; color: var(--muted); }
.meet__or::before, .meet__or::after { content: ''; flex: 1; height: 1px; background: var(--line); }
.meet__open { font-size: 12.5px; color: var(--text); }
.meet__paste { display: flex; gap: 0.4rem; }
.meet__paste input { flex: 1; min-width: 0; height: 30px; padding: 0 0.55rem; border: 1px solid var(--line-strong); border-radius: 7px; background: var(--bg); font: inherit; font-size: 12.5px; color: var(--text); outline: none; }
.meet__paste input:focus { border-color: var(--text); }
.meet__pop .meet__note { padding: 0.45rem 0.6rem; border: 1px solid var(--line-strong); border-radius: 7px; color: var(--text); }
:is(.meet__btn, .meet__open):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
</style>
