<script setup>
import { computed, markRaw, onUnmounted, reactive, ref } from 'vue'
import { api, wsUrl } from '../../services/api'
import { useWorkspace } from '../../composables/useWorkspace'
import AppIcon from './AppIcon.vue'

const props = defineProps({ projectId: { type: Number, required: true } })
const { member, state } = useWorkspace()

const SLOTS = ['audio', 'video', 'video']
const joined = ref(false)
const busy = ref(false)
const error = ref('')
const me = reactive({ mic: true, cam: false, screen: false, rec: false })
const local = reactive({ cam: null, screen: null })
const peers = reactive({})
const pcs = {}
let ws = null
let ice = []
let tracks = [null, null, null]

const speaking = reactive({})
const meters = {}
let audioCtx = null
let meterTimer = null
function meter(id, stream) {
  const analyser = audioCtx.createAnalyser()
  analyser.fftSize = 512
  const source = audioCtx.createMediaStreamSource(stream)
  source.connect(analyser)
  if (recMix) source.connect(recMix)
  meters[id] = { analyser, source, data: new Uint8Array(analyser.fftSize) }
}
function measure() {
  for (const [id, m] of Object.entries(meters)) {
    m.analyser.getByteTimeDomainData(m.data)
    let sum = 0
    for (const v of m.data) sum += ((v - 128) / 128) ** 2
    speaking[id] = Math.sqrt(sum / m.data.length) > 0.03 && (id !== 'me' || me.mic)
  }
}

const SEGMENT_MS = 120000
const anyoneRec = computed(() => me.rec || Object.values(peers).some((p) => p.state.rec))
const minutes = reactive({ busy: false, page: null })
let recMix = null
let recorder = null
let segmentTimer = null
let transcript = []
let uploads = Promise.resolve()
const mime = () => ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((t) => MediaRecorder.isTypeSupported(t))
function upload(blob) {
  const body = new FormData()
  body.append('projeto_id', props.projectId)
  body.append('audio', blob, `trecho.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`)
  uploads = uploads.then(() => api('/api/ai/transcribe/', { method: 'POST', body }))
    .then(({ text }) => text && transcript.push(text))
    .catch((e) => { error.value = e.message })
}
function segment() {
  const chunks = []
  recorder = new MediaRecorder(recMix.stream, { mimeType: mime() })
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)
  recorder.onstop = () => {
    if (chunks.length) upload(new Blob(chunks, { type: recorder.mimeType }))
    if (me.rec) segment()
  }
  recorder.start()
  segmentTimer = setTimeout(() => recorder.state === 'recording' && recorder.stop(), SEGMENT_MS)
}
function startRec() {
  recMix = audioCtx.createMediaStreamDestination()
  Object.values(meters).forEach((m) => m.source.connect(recMix))
  transcript = []
  minutes.page = null
  me.rec = true
  shareState()
  segment()
}
async function stopRec() {
  me.rec = false
  shareState()
  clearTimeout(segmentTimer)
  await new Promise((done) => { recorder.addEventListener('stop', done, { once: true }); recorder.state === 'recording' ? recorder.stop() : done() })
  recMix = null
  minutes.busy = true
  await uploads
  try {
    const { items } = await api('/api/ai/minutes/', { method: 'POST', body: { projeto_id: props.projectId, transcricao: transcript.join('\n') } })
    minutes.page = items[0]
  } catch (e) {
    error.value = e.message
  } finally {
    minutes.busy = false
  }
}

const send = (msg) => ws?.readyState === 1 && ws.send(JSON.stringify(msg))
const shareState = () => send({ type: 'state', ...me })
const person = (user) => ({ ...user, ...(member(user.id) || {}) })
const initials = (name) => (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

function connection(id) {
  if (pcs[id]) return pcs[id]
  const pc = new RTCPeerConnection({ iceServers: ice })
  pc.onicecandidate = (e) => e.candidate && send({ type: 'signal', to: id, data: { candidate: e.candidate } })
  pc.ontrack = (e) => {
    const slot = pc.getTransceivers().indexOf(e.transceiver)
    if (!peers[id] || slot < 0) return
    peers[id].media[slot] = markRaw(new MediaStream([e.track]))
    if (slot === 0) meter(id, peers[id].media[0])
  }
  return (pcs[id] = { pc, queue: [] })
}
const attach = (pc) => pc.getTransceivers().forEach((t, i) => { t.direction = 'sendrecv'; t.sender.replaceTrack(tracks[i]) })
const everyone = (fn) => Object.values(pcs).forEach(({ pc }) => fn(pc))
async function flush(c) {
  for (const candidate of c.queue.splice(0)) await c.pc.addIceCandidate(candidate).catch(() => {})
}

async function call(id) {
  const { pc } = connection(id)
  SLOTS.forEach((kind) => pc.addTransceiver(kind, { direction: 'sendrecv' }))
  attach(pc)
  await pc.setLocalDescription(await pc.createOffer())
  send({ type: 'signal', to: id, data: { sdp: pc.localDescription } })
}

async function onSignal(from, data) {
  const c = connection(from)
  if (data.sdp?.type === 'offer') {
    await c.pc.setRemoteDescription(data.sdp)
    attach(c.pc)
    await c.pc.setLocalDescription(await c.pc.createAnswer())
    send({ type: 'signal', to: from, data: { sdp: c.pc.localDescription } })
    await flush(c)
  } else if (data.sdp?.type === 'answer') {
    await c.pc.setRemoteDescription(data.sdp)
    await flush(c)
  } else if (data.candidate) {
    if (c.pc.remoteDescription) await c.pc.addIceCandidate(data.candidate).catch(() => {})
    else c.queue.push(data.candidate)
  }
}

const addPeer = (id, user, state) => { peers[id] = { user: person(user), state, media: [null, null, null] } }
function dropPeer(id) {
  pcs[id]?.pc.close()
  delete pcs[id]
  delete peers[id]
  delete meters[id]
  delete speaking[id]
}

async function join() {
  if (busy.value || joined.value) return
  busy.value = true
  error.value = ''
  audioCtx = new AudioContext()
  try {
    tracks[0] = (await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })).getAudioTracks()[0]
    meter('me', new MediaStream([tracks[0]]))
    meterTimer = setInterval(measure, 150)
  } catch (e) {
    leave()
    error.value = e.name === 'NotAllowedError' ? 'Permita o microfone no navegador para entrar na sala.' : 'Nenhum microfone encontrado (ou ele está em uso por outro programa).'
    busy.value = false
    return
  }
  ws = new WebSocket(wsUrl(`/ws/projects/${props.projectId}/voice/`))
  ws.onmessage = async (e) => {
    const msg = JSON.parse(e.data)
    if (msg.type === 'room') {
      ice = msg.ice
      joined.value = true
      busy.value = false
      for (const p of msg.peers) {
        addPeer(p.id, p.user, p.state)
        call(p.id)
      }
    } else if (msg.type === 'joined') addPeer(msg.id, msg.user, msg.state)
    else if (msg.type === 'left') dropPeer(msg.id)
    else if (msg.type === 'state' && peers[msg.id]) peers[msg.id].state = msg.state
    else if (msg.type === 'signal') onSignal(msg.from, msg.data)
  }
  ws.onclose = (e) => {
    if (!joined.value) error.value = e.code === 4003 ? 'Você não participa deste projeto.' : 'Não foi possível entrar na sala. Tente de novo.'
    else if (ws) error.value = 'A conexão caiu e você saiu da sala.'
    leave(false)
  }
}

function leave(closeSocket = true) {
  if (me.rec) stopRec()
  const socket = ws
  ws = null
  if (closeSocket && socket) {
    socket.onclose = null
    socket.close()
  }
  Object.keys(pcs).forEach(dropPeer)
  clearInterval(meterTimer)
  Object.keys(meters).forEach((id) => { delete meters[id]; delete speaking[id] })
  audioCtx?.close()
  audioCtx = null
  tracks.forEach((t) => t?.stop())
  tracks = [null, null, null]
  Object.assign(local, { cam: null, screen: null })
  Object.assign(me, { mic: true, cam: false, screen: false, rec: false })
  joined.value = false
  busy.value = false
}

function toggleMic() {
  me.mic = !me.mic
  if (tracks[0]) tracks[0].enabled = me.mic
  shareState()
}

async function setSlot(slot, track) {
  tracks[slot]?.stop()
  tracks[slot] = track
  everyone((pc) => pc.getTransceivers()[slot]?.sender.replaceTrack(track))
}

async function toggleCam() {
  if (me.cam) {
    await setSlot(1, null)
    local.cam = null
  } else {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 360 } })
      await setSlot(1, stream.getVideoTracks()[0])
      local.cam = markRaw(stream)
    } catch {
      error.value = 'Não deu para ligar a câmera (permissão negada ou em uso).'
      return
    }
  }
  me.cam = !me.cam
  shareState()
}

async function stopScreen() {
  await setSlot(2, null)
  local.screen = null
  me.screen = false
  shareState()
}
async function toggleScreen() {
  if (me.screen) return stopScreen()
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
    const track = stream.getVideoTracks()[0]
    track.onended = stopScreen
    await setSlot(2, track)
    local.screen = markRaw(stream)
    me.screen = true
    shareState()
  } catch { }
}

const fullscreen = (e) => e.currentTarget.requestFullscreen?.()
onUnmounted(() => leave())
</script>

<template>
  <section class="voice" aria-label="Sala de voz do projeto">
    <div class="bar">
      <span class="label"><AppIcon name="video" :size="14" />Sala de voz<small v-if="joined">{{ Object.keys(peers).length + 1 }} na sala</small></span>
      <button v-if="!joined" type="button" class="join" :disabled="busy" @click="join"><ArcLoader v-if="busy" />{{ busy ? 'Entrando…' : 'Entrar' }}</button>
      <template v-else>
        <button type="button" class="ctl" :class="{ off: !me.mic }" :aria-pressed="!me.mic" :title="me.mic ? 'Silenciar microfone' : 'Ativar microfone'" aria-label="Microfone" @click="toggleMic">{{ me.mic ? '🎙️' : '🔇' }}</button>
        <button type="button" class="ctl" :class="{ on: me.cam }" :aria-pressed="me.cam" :title="me.cam ? 'Desligar câmera' : 'Ligar câmera'" aria-label="Câmera" @click="toggleCam">📷</button>
        <button type="button" class="ctl" :class="{ on: me.screen }" :aria-pressed="me.screen" :title="me.screen ? 'Parar de compartilhar' : 'Compartilhar tela'" aria-label="Compartilhar tela" @click="toggleScreen">🖥️</button>
        <button type="button" class="ctl" :class="{ rec: me.rec }" :disabled="minutes.busy || (anyoneRec && !me.rec)" :aria-pressed="me.rec" aria-label="Gravar ata da reunião" :title="me.rec ? 'Parar e gerar a ata' : 'Gravar a reunião e gerar a ata'" @click="me.rec ? stopRec() : startRec()">{{ me.rec ? '⏹ Ata' : '⏺ Ata' }}</button>
        <button type="button" class="leave" @click="leave()">Sair</button>
      </template>
    </div>
    <p v-if="error" class="err" role="alert">{{ error }}</p>
    <p v-if="anyoneRec" class="recnote" role="status"><span class="rec-dot" aria-hidden="true" />Esta reunião está sendo gravada para gerar a ata do projeto.</p>
    <p v-if="minutes.busy" class="recnote" role="status">Escrevendo a ata da reunião…</p>
    <RouterLink v-if="minutes.page" class="recnote ok" :to="`/projetos/${minutes.page.project}/paginas/${minutes.page.id}`"><AppIcon name="doc" :size="13" />Ata salva: {{ minutes.page.title }}</RouterLink>
    <div v-if="joined" class="tiles">
      <figure class="tile me" :class="{ speaking: speaking.me }" title="Duplo clique: tela cheia" @dblclick="fullscreen">
        <video v-if="local.screen || local.cam" :srcObject.prop="local.screen || local.cam" autoplay muted playsinline />
        <span v-else class="ava" :class="{ pic: member(state.me)?.avatar }"><img v-if="member(state.me)?.avatar" :src="member(state.me).avatar" alt="" referrerpolicy="no-referrer" /><template v-else>Você</template></span>
        <figcaption>Você<AppIcon v-if="!me.mic" name="microphone-slash" :size="12" /></figcaption>
      </figure>
      <figure v-for="(p, id) in peers" :key="id" class="tile" :class="{ speaking: speaking[id] }" title="Duplo clique: tela cheia" @dblclick="fullscreen">
        <video v-if="(p.state.screen && p.media[2]) || (p.state.cam && p.media[1])" :srcObject.prop="p.state.screen && p.media[2] ? p.media[2] : p.media[1]" autoplay playsinline />
        <span v-else class="ava" :style="{ background: p.user.color }"><img v-if="p.user.avatar" :src="p.user.avatar" alt="" referrerpolicy="no-referrer" /><template v-else>{{ initials(p.user.name) }}</template></span>
        <audio v-if="p.media[0]" :srcObject.prop="p.media[0]" autoplay />
        <figcaption>{{ p.user.name }}<AppIcon v-if="!p.state.mic" name="microphone-slash" :size="12" /></figcaption>
      </figure>
    </div>
  </section>
</template>

<style scoped>
.voice { display: flex; flex-direction: column; gap: 0.5rem; padding: 0.6rem 0.9rem; border-bottom: 1px solid var(--line); }
.bar { display: flex; align-items: center; gap: 0.4rem; }
.label { display: inline-flex; align-items: center; gap: 0.4rem; margin-right: auto; font-size: 13px; font-weight: 600; color: var(--text); }
.label small { font-weight: 400; color: var(--muted); }
.join, .leave, .ctl { padding: 0.3rem 0.7rem; border: 1px solid var(--line); border-radius: 8px; background: var(--surface-2); font: inherit; font-size: 13px; color: var(--text); cursor: pointer; }
.join { border-color: var(--accent); background: var(--accent); color: #000; font-weight: 600; }
.join:disabled { opacity: 0.6; cursor: default; }
.ctl { padding: 0.3rem 0.5rem; }
.ctl.on { border-color: var(--accent); }
.ctl.off { border-color: #f2a07a; }
.leave { border-color: #c2410c; color: #f2a07a; }
:is(.join, .leave, .ctl):focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.recnote { display: flex; align-items: center; gap: 0.4rem; margin: 0; font-size: 12.5px; color: var(--danger, #ff8a80); }
.rec-dot { flex: none; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.recnote.ok { color: var(--accent-soft, var(--accent)); text-decoration: none; }
.ctl.rec { border-color: #ef4444; color: #fca5a5; }
.ctl:disabled { opacity: 0.5; cursor: default; }
.err { margin: 0; font-size: 12.5px; color: #f2a07a; }
.tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 0.4rem; }
.tile { position: relative; display: grid; place-items: center; margin: 0; aspect-ratio: 16 / 10; overflow: hidden; border: 1px solid var(--line); border-radius: 10px; background: var(--surface-2); transition: border-color 0.15s, box-shadow 0.15s; }
.tile.speaking { border-color: #3ba55d; box-shadow: 0 0 0 2px #3ba55d; } .tile video { width: 100%; height: 100%; object-fit: contain; background: #000; }
.ava { display: grid; place-items: center; width: 44px; height: 44px; overflow: hidden; border-radius: 50%; background: var(--accent); font-weight: 700; font-size: 14px; color: #000; }
.me .ava { width: auto; padding: 0 0.6rem; border-radius: 999px; }
.me .ava.pic { width: 44px; padding: 0; border-radius: 50%; }
.ava img { width: 100%; height: 100%; object-fit: cover; }
figcaption { position: absolute; left: 6px; bottom: 4px; padding: 0 0.35rem; border-radius: 6px; background: rgb(0 0 0 / 0.6); font-size: 11.5px; color: #fff; }
</style>
