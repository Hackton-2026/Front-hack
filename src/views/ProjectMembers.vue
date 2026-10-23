<script setup>
// Pessoas do projeto: quem participa, com qual permissão, e convites pendentes. Convites são para o PROJETO:
// quem entra vê as tarefas, páginas e o chat deste projeto, e nunca o resto do seu workspace.
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkspace } from '../composables/useWorkspace'
import { useUi } from '../composables/useUi'
import AppIcon from '../components/app/AppIcon.vue'

const PERMISSIONS = [
  ['view', 'Ver', 'Vê tarefas, páginas e o chat'],
  ['comment', 'Comentar', 'Vê e comenta'],
  ['edit', 'Editar', 'Cria e edita tarefas, ciclos e páginas'],
  ['full', 'Total', 'Edita e também convida e remove pessoas'],
]
const label = (perm) => PERMISSIONS.find((x) => x[0] === perm)?.[1] || perm

const props = defineProps({ id: { type: [String, Number], required: true } })
const router = useRouter()
const { state, project, member, projectMembers, inviteToProject, cancelInvite, setProjectPermission, removeProjectMember, load } = useWorkspace()
const ui = useUi()

const pid = computed(() => Number(props.id))
const p = computed(() => project(pid.value))
const data = ref(null) // { members, invitations, can_manage, my_permission }
const email = ref('')
const permission = ref('edit')
const sending = ref(false)
const error = ref('')
const confirming = ref(null) // id de quem está para ser removido (ou 'me' para sair)
const busy = ref(null)

async function refresh() {
  error.value = ''
  try {
    data.value = await projectMembers(pid.value)
  } catch (e) {
    data.value = null
    error.value = e.status === 404 ? 'Projeto não encontrado ou você não participa mais dele.' : e.message
  }
}
watch(pid, () => { confirming.value = null; refresh() }, { immediate: true })
watch(p, (v) => (ui.ui.crumb = v ? `${v.name} › Membros` : 'Membros'), { immediate: true })

const valid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))
const inviteLink = (inv) => `${location.origin}/convite/${inv.token}`

async function invite() {
  if (!valid.value) { error.value = 'Digite um e-mail válido.'; return }
  sending.value = true
  error.value = ''
  try {
    const inv = await inviteToProject(pid.value, email.value.trim(), permission.value)
    ui.toast(`Convite enviado para ${inv.email}. Copie o link para mandar para a pessoa.`)
    email.value = ''
    await refresh()
  } catch (e) {
    error.value = e.message
  } finally {
    sending.value = false
  }
}

async function copy(inv) {
  try {
    await navigator.clipboard.writeText(inviteLink(inv))
    ui.toast('Link do convite copiado.')
  } catch {
    ui.toast('Não foi possível copiar. Selecione o link e copie manualmente.')
  }
}

async function run(key, fn, done) {
  busy.value = key
  error.value = ''
  try {
    await fn()
    if (done) await done()
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = null
    confirming.value = null
  }
}
const cancel = (inv) => run(`inv-${inv.id}`, () => cancelInvite(pid.value, inv.id), refresh)
const changePerm = (m, perm) => run(`perm-${m.id}`, () => setProjectPermission(pid.value, m.id, perm), refresh)
const remove = (m) => run(`rm-${m.id}`, () => removeProjectMember(pid.value, m.id), async () => { await refresh(); load() })
async function leave() {
  const name = p.value?.name // depois de sair o projeto some da lista
  await run('me', () => removeProjectMember(pid.value, state.me))
  if (!error.value) {
    ui.toast(name ? `Você saiu do projeto ${name}.` : 'Você saiu do projeto.')
    router.push('/projetos')
  }
}
const me = computed(() => data.value?.members.find((m) => m.id === state.me))
const initials = (name) => (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
const when = (iso) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
</script>

<template>
  <div class="pg members">
    <div class="pg-bar">
      <strong class="title"><AppIcon name="user" :size="16" />Membros<span v-if="data" class="n">{{ data.members.length }}</span></strong>
      <span v-if="p?.shared" class="shared">Projeto de {{ p.owner_name }} · sua permissão: {{ label(p.my_permission) }}</span>
    </div>

    <div class="body">
      <p class="lead">Quem participa vê as tarefas, as páginas e o chat <strong>deste projeto</strong>. O seu workspace, os outros projetos, notas e wiki continuam só seus.</p>
      <p v-if="error" class="error" role="alert">{{ error }}</p>

      <form v-if="data?.can_manage" class="invite card" novalidate @submit.prevent="invite">
        <h2>Convidar para {{ p?.name }}</h2>
        <div class="row">
          <label class="sr-only" for="invite-email">E-mail de quem você quer convidar</label>
          <input id="invite-email" v-model="email" type="email" placeholder="nome@empresa.com" autocomplete="off" :aria-invalid="!!error && !valid" />
          <label class="sr-only" for="invite-perm">Permissão</label>
          <select id="invite-perm" v-model="permission" class="pg-select">
            <option v-for="[v, l, d] in PERMISSIONS" :key="v" :value="v" :title="d">{{ l }}</option>
          </select>
          <button type="submit" class="pg-btn primary" :disabled="sending || !email.trim()">{{ sending ? 'Convidando…' : 'Convidar' }}</button>
        </div>
        <p class="hint">{{ PERMISSIONS.find((x) => x[0] === permission)[2] }}. A pessoa aceita entrando com esse e-mail (se já tem conta, o convite aparece na caixa de entrada dela).</p>
      </form>

      <section v-if="data" class="card">
        <h2>Quem participa</h2>
        <ul class="list">
          <li v-for="m in data.members" :key="m.id" class="person">
            <span class="ava" :style="{ background: m.color }"><img v-if="m.avatar" :src="m.avatar" alt="" /><template v-else>{{ initials(m.name) }}</template></span>
            <span class="who">
              <strong>{{ m.name }}<span v-if="m.id === state.me" class="you"> (você)</span></strong>
              <small>@{{ m.username }}<template v-if="m.owner"> · dono do projeto</template><template v-else-if="m.invited"> · convidado</template></small>
            </span>
            <span class="actions">
              <select v-if="data.can_manage && m.invited && m.id !== state.me" class="pg-select" :value="m.permission" :disabled="busy === `perm-${m.id}`" :aria-label="`Permissão de ${m.name}`" @change="changePerm(m, $event.target.value)">
                <option v-for="[v, l] in PERMISSIONS" :key="v" :value="v">{{ l }}</option>
              </select>
              <span v-else class="perm">{{ label(m.permission) }}</span>
              <template v-if="m.invited && (data.can_manage || m.id === state.me)">
                <button v-if="confirming !== m.id" type="button" class="pg-btn ghost" @click="confirming = m.id">{{ m.id === state.me ? 'Sair' : 'Remover' }}</button>
                <button v-else type="button" class="pg-btn danger" :disabled="busy" @click="m.id === state.me ? leave() : remove(m)">{{ m.id === state.me ? 'Confirmar saída' : 'Confirmar remoção' }}</button>
              </template>
            </span>
          </li>
        </ul>
        <p v-if="me && !me.invited" class="hint">Você é {{ me.owner ? 'o dono' : 'do workspace' }} deste projeto e tem acesso por ele.</p>
      </section>

      <section v-if="data?.can_manage" class="card">
        <h2>Convites pendentes <span class="n">{{ data.invitations.length }}</span></h2>
        <p v-if="!data.invitations.length" class="hint">Nenhum convite esperando resposta.</p>
        <ul v-else class="list">
          <li v-for="inv in data.invitations" :key="inv.id" class="person">
            <span class="ava pending"><AppIcon name="inbox" :size="14" /></span>
            <span class="who">
              <strong>{{ inv.email }}</strong>
              <small>{{ label(inv.permission) }} · convidado por {{ inv.invited_by }} · vence {{ when(inv.expires_at) }}</small>
            </span>
            <span class="actions">
              <button type="button" class="pg-btn" @click="copy(inv)"><AppIcon name="arrow" :size="13" />Copiar link</button>
              <button type="button" class="pg-btn ghost" :disabled="busy === `inv-${inv.id}`" @click="cancel(inv)">Cancelar</button>
            </span>
          </li>
        </ul>
      </section>

      <p v-if="!data && !error" class="hint">Carregando…</p>
    </div>
  </div>
</template>

<style scoped>
.title { display: inline-flex; align-items: center; gap: 0.45rem; font-weight: 600; }
.n { margin-left: 0.35rem; font-size: 12px; font-weight: 500; color: var(--muted); }
.shared { font-size: 12.5px; color: var(--muted); }
.body { display: flex; flex-direction: column; gap: 1rem; width: 100%; max-width: 46rem; margin: 0 auto; padding: 1.5rem 1.25rem 3rem; }
.lead { margin: 0; color: var(--muted); line-height: 1.55; }
.lead strong { color: var(--text); }
.card { display: flex; flex-direction: column; gap: 0.75rem; padding: 1.1rem 1.2rem; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
h2 { margin: 0; font-size: 14px; font-weight: 600; color: var(--text); }
.row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.row input { flex: 1 1 14rem; min-width: 0; height: 30px; padding: 0 0.65rem; border: 1px solid var(--line); border-radius: 6px; background: var(--bg); font: inherit; color: var(--text); outline: none; }
.row input:focus { border-color: var(--accent); }
.hint { margin: 0; font-size: 12.5px; color: var(--muted); }
.error { margin: 0; padding: 0.6rem 0.8rem; border: 1px solid rgb(229 101 21 / 0.45); border-radius: 8px; background: rgb(229 101 21 / 0.1); font-size: 13px; color: #ffd2b3; }
.list { display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none; }
.person { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0; border-top: 1px solid var(--line); }
.person:first-child { border-top: 0; }
.ava { display: grid; place-items: center; flex-shrink: 0; width: 32px; height: 32px; overflow: hidden; border-radius: 50%; font: 700 12px/1 'Lexend', system-ui, sans-serif; color: #000; }
.ava img { width: 100%; height: 100%; object-fit: cover; }
.ava.pending { border: 1.5px dashed var(--line-strong); background: none; color: var(--muted); }
.who { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.who strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
.who small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: var(--muted); }
.you { font-weight: 400; color: var(--muted); }
.actions { display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0; }
.perm { font-size: 12.5px; color: var(--muted); }
.pg-btn.ghost { background: none; }
.pg-btn.danger { border-color: #ff5b4d; background: rgb(255 91 77 / 0.12); color: #ffb4ab; }
.pg-btn:disabled { opacity: 0.55; cursor: default; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (max-width: 560px) {
  .person { flex-wrap: wrap; }
  .actions { width: 100%; justify-content: flex-end; }
}
</style>
