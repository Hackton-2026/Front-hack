<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { api } from '../../services/api'

const st = ref(null)
const phone = ref('')
const code = ref('')
const busy = ref(false)
const error = ref('')
const note = ref('')
const qr = ref(null)
let poll

async function load() {
  try { st.value = await api('/api/whatsapp/status/') } catch (e) { error.value = e.message }
}
onMounted(load)
onUnmounted(() => clearInterval(poll))

async function run(fn, done) {
  busy.value = true
  error.value = ''
  note.value = ''
  try { await fn(); if (done) note.value = done; await load() } catch (e) { error.value = e.message } finally { busy.value = false }
}
const sendCode = () => run(() => api('/api/whatsapp/me/', { method: 'POST', body: { phone: phone.value } }), 'Código enviado. Confira o WhatsApp.')
const verify = () => run(async () => { await api('/api/whatsapp/me/verify/', { method: 'POST', body: { code: code.value } }); code.value = '' }, 'Número confirmado. Você vai receber o /whatsapp dos seus projetos.')
const remove = () => run(() => api('/api/whatsapp/me/', { method: 'DELETE' }), 'Número removido.')

const STATUS = { ready: 'Conectado', qr_ready: 'Esperando ler o QR', initializing: 'Iniciando…', authenticating: 'Entrando…', created: 'Desconectado',
  disconnected: 'Desconectado', failed: 'Falhou', action_required: 'Precisa de ação no celular', not_created: 'Nunca conectado', unreachable: 'OpenWA fora do ar' }
async function connect() {
  await run(async () => { qr.value = await api('/api/whatsapp/admin/connect/', { method: 'POST' }) })
  clearInterval(poll)
  poll = setInterval(async () => {
    try {
      qr.value = await api('/api/whatsapp/admin/qr/')
      if (qr.value.status === 'ready') { clearInterval(poll); qr.value = null; note.value = 'WhatsApp do Novexo conectado.'; load() }
    } catch { }
  }, 3000)
}
const disconnect = () => run(() => api('/api/whatsapp/admin/logout/', { method: 'POST' }), 'Número do Novexo desconectado.')
</script>

<template>
  <div class="wa">
    <p v-if="!st && !error" class="hint">Carregando…</p>
    <template v-else-if="st">
      <p v-if="!st.configured" class="hint">A integração com WhatsApp não está ligada neste servidor. Quem cuida do backend precisa subir o OpenWA e preencher <code>OPENWA_URL</code> e <code>OPENWA_API_KEY</code> (passo a passo no README do Back-hack).</p>

      <section class="card">
        <h3>Seu WhatsApp</h3>
        <p class="hint">Com o número confirmado, você recebe as mensagens que alguém do projeto mandar com <code>/whatsapp</code> no chat.</p>
        <template v-if="st.me.verified">
          <p class="ok">✓ {{ st.me.masked }} confirmado</p>
          <button type="button" class="link rm" :disabled="busy" @click="remove">Remover número</button>
        </template>
        <form v-else-if="st.me.pending" class="row" @submit.prevent="verify">
          <label class="grow"><span>Código que chegou no WhatsApp de {{ st.me.masked }}</span>
            <input v-model="code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="000000" /></label>
          <button type="submit" class="btn" :disabled="busy || code.length !== 6">Confirmar</button>
          <button type="button" class="link" :disabled="busy" @click="remove">Trocar número</button>
        </form>
        <form v-else class="row" @submit.prevent="sendCode">
          <label class="grow"><span>Número com DDD</span><input v-model="phone" type="tel" autocomplete="tel" placeholder="(47) 99999-8888" /></label>
          <button type="submit" class="btn" :disabled="busy || !phone.trim() || !st.connected">Enviar código</button>
        </form>
        <p v-if="st.configured && !st.connected && !st.me.verified" class="hint">O WhatsApp do Novexo está desconectado agora, então o código não pode ser enviado.</p>
      </section>

      <section v-if="st.is_admin && st.configured" class="card">
        <h3>Número do Novexo <small>(admin do site)</small></h3>
        <p class="hint">Status: <strong>{{ STATUS[st.status] || st.status }}</strong><template v-if="st.bot_phone"> · {{ st.bot_phone }}</template>. Use um número só para isso: o WhatsApp pode bloquear números que mandam mensagens automáticas.</p>
        <div v-if="qr?.qr" class="qr"><img :src="qr.qr" alt="QR Code para conectar o WhatsApp do Novexo" width="220" height="220" /><p class="hint">No celular do número do Novexo: WhatsApp › Aparelhos conectados › Conectar aparelho, e leia este QR.</p></div>
        <p v-else-if="qr" class="hint">{{ STATUS[qr.status] || qr.status }}…</p>
        <div class="row">
          <button v-if="!st.connected" type="button" class="btn" :disabled="busy" @click="connect">{{ qr ? 'Gerar QR de novo' : 'Conectar' }}</button>
          <button v-else type="button" class="link rm" :disabled="busy" @click="disconnect">Desconectar</button>
        </div>
      </section>
    </template>
    <p v-if="note" class="ok" role="status">{{ note }}</p>
    <p v-if="error" class="err" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.wa { display: flex; flex-direction: column; gap: 1rem; }
.card { display: flex; flex-direction: column; gap: 0.6rem; padding: 1rem 1.1rem; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
h3 { margin: 0; font-size: 14px; font-weight: 600; color: var(--text); }
h3 small { font-weight: 400; color: var(--muted); }
.hint { margin: 0; font-size: 13px; line-height: 1.5; color: var(--muted); }
.hint code { padding: 0 0.25rem; border-radius: 4px; background: var(--surface-2); color: var(--accent-soft); }
.row { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 0.6rem; }
.grow { display: flex; flex: 1 1 14rem; flex-direction: column; gap: 0.3rem; font-size: 12.5px; color: var(--muted); }
.grow input { height: 32px; padding: 0 0.6rem; border: 1px solid var(--line); border-radius: 6px; background: var(--bg); font: inherit; font-size: 14px; color: var(--text); outline: none; }
.grow input:focus { border-color: var(--accent); }
.btn { height: 32px; padding: 0 0.9rem; border: 1px solid var(--accent); border-radius: 6px; background: var(--accent); font: inherit; font-weight: 500; color: #140700; cursor: pointer; }
.btn:disabled { opacity: 0.5; cursor: default; }
.link { border: 0; background: none; font: inherit; font-size: 13px; color: var(--muted); text-decoration: underline; cursor: pointer; }
.link.rm { align-self: flex-start; color: #ff8a7f; }
.ok { margin: 0; font-size: 13px; color: #7fc47a; }
.err { margin: 0; padding: 0.55rem 0.75rem; border: 1px solid rgb(255 91 77 / 0.45); border-radius: 8px; background: rgb(255 91 77 / 0.1); font-size: 13px; color: #ffb4ab; }
.qr { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; }
.qr img { padding: 8px; border-radius: 10px; background: #fff; }
</style>
