<script setup>
// Ajustes (a área de "Settings" do ClickUp/Plane): perfil, workspace, preferências, notificações e dados
import { nextTick, reactive, ref, watch } from 'vue'
import { gsap, prefersReducedMotion } from '../utils/motion'
import { useAuth } from '../composables/useAuth'
import { useWorkspace } from '../composables/useWorkspace'
import GooeyButton from '../components/GooeyButton.vue'

const TABS = [
  { id: 'profile', label: 'Perfil' },
  { id: 'workspace', label: 'Workspace' },
  { id: 'prefs', label: 'Preferências' },
  { id: 'notify', label: 'Notificações' },
  { id: 'data', label: 'Dados' },
]
const NOTIFY = [
  { id: 'assigned', label: 'Quando me atribuírem uma tarefa' },
  { id: 'mention', label: 'Quando me mencionarem num comentário' },
  { id: 'due', label: 'Lembretes de prazo e de tarefa parada' },
  { id: 'digest', label: 'Resumo da semana por e-mail' },
]
const { user, updateMe, logout } = useAuth()
const { state, clearLocal, load, renameWorkspace } = useWorkspace()
const tab = ref('profile')
const panel = ref(null)
const profile = reactive({ first_name: user.value?.first_name || '', email: user.value?.email || '' })
const status = ref('')
const confirmReset = ref(false)

watch(tab, async () => {
  status.value = ''
  confirmReset.value = false
  await nextTick()
  if (!prefersReducedMotion()) gsap.fromTo(panel.value, { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, ease: 'power2.out' })
})
async function saveProfile() {
  if (!user.value) { status.value = 'Entre na sua conta para editar o perfil.'; return }
  try {
    await updateMe({ first_name: profile.first_name.trim(), email: profile.email.trim() })
    status.value = 'Perfil salvo.'
  } catch (e) {
    status.value = e.message
  }
}
function doReset() {
  if (!confirmReset.value) { confirmReset.value = true; return }
  clearLocal()
  confirmReset.value = false
  status.value = 'Rascunhos e documentos deste navegador foram limpos.'
}
</script>

<template>
  <div class="page">
    <h1>Ajustes</h1>
    <div class="layout">
      <nav class="tabs" aria-label="Seções dos ajustes">
        <button v-for="t in TABS" :key="t.id" type="button" :aria-current="tab === t.id ? 'page' : undefined" @click="tab = t.id">{{ t.label }}</button>
      </nav>

      <section ref="panel" class="panel">
        <template v-if="tab === 'profile'">
          <h2>Perfil</h2>
          <form class="form" @submit.prevent="saveProfile">
            <label>Nome <input v-model="profile.first_name" autocomplete="given-name" /></label>
            <label>E-mail <input v-model="profile.email" type="email" autocomplete="email" /></label>
            <p class="hint">{{ user ? `Usuário: ${user.username}` : 'Você está como visitante. Entre para salvar o perfil.' }}</p>
            <div class="actions">
              <GooeyButton type="submit" variant="primary">Salvar perfil</GooeyButton>
              <RouterLink v-if="!user" to="/login?next=/ajustes" class="link">Entrar</RouterLink>
              <button v-else type="button" class="link" @click="logout">Sair da conta</button>
            </div>
          </form>
        </template>

        <template v-else-if="tab === 'workspace'">
          <h2>Workspace</h2>
          <div class="form">
            <label>Nome do workspace <input :value="state.workspaceName" :disabled="!state.isAdmin" @change="renameWorkspace($event.target.value)" /></label>
          </div>
          <h3>Membros</h3>
          <ul class="members">
            <li v-for="m in state.members" :key="m.id"><span class="av" :style="{ background: m.color }">{{ m.name.slice(0, 2).toUpperCase() }}</span>{{ m.name }}<small>{{ m.id === state.me ? 'Você · ' : '' }}{{ { owner: 'Dono', admin: 'Admin', member: 'Membro', limited: 'Limitado', guest: 'Convidado' }[m.role] }}</small></li>
          </ul>
          <RouterLink to="/comecar" class="link">Convidar pessoas</RouterLink>
        </template>

        <template v-else-if="tab === 'prefs'">
          <h2>Preferências</h2>
          <div class="form">
            <label>Início da semana
              <select v-model.number="state.prefs.weekStart"><option :value="0">Domingo</option><option :value="1">Segunda-feira</option></select>
            </label>
            <label>Densidade das listas
              <select v-model="state.prefs.density"><option value="comfortable">Confortável</option><option value="compact">Compacta</option></select>
            </label>
          </div>
          <p class="hint">O calendário dos projetos já usa o início da semana escolhido.</p>
        </template>

        <template v-else-if="tab === 'notify'">
          <h2>Notificações</h2>
          <ul class="toggles">
            <li v-for="n in NOTIFY" :key="n.id">
              <span>{{ n.label }}</span>
              <button type="button" role="switch" class="switch" :aria-checked="state.prefs.notify[n.id]" :aria-label="n.label" @click="state.prefs.notify[n.id] = !state.prefs.notify[n.id]"><span /></button>
            </li>
          </ul>
        </template>

        <template v-else>
          <h2>Dados</h2>
          <p class="hint">Projetos, tarefas, checklist e atividade ficam salvos no servidor. Rascunhos, documentos da wiki, notas e preferências ficam só neste navegador.</p>
          <div class="actions">
            <button type="button" class="link" @click="load().then(() => (status = 'Dados recarregados do servidor.'))">Recarregar do servidor</button>
            <button type="button" class="danger" @click="doReset">{{ confirmReset ? 'Clique de novo para confirmar' : 'Limpar rascunhos e documentos locais' }}</button>
          </div>
        </template>
        <p v-if="status" class="status" role="status">{{ status }}</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 1.25rem; max-width: 60rem; padding: 1.5rem; }
h1 { margin: 0; font: 650 1.5rem/1.2 'Geist', system-ui, sans-serif; letter-spacing: -0.02em; color: var(--text); }
.layout { display: grid; grid-template-columns: 12rem minmax(0, 1fr); gap: 1.5rem; align-items: start; }
@media (max-width: 760px) { .layout { grid-template-columns: minmax(0, 1fr); } .tabs { flex-direction: row; flex-wrap: wrap; } }
.tabs { display: flex; flex-direction: column; gap: 2px; }
.tabs button { padding: 0.45rem 0.65rem; border: 0; border-radius: 6px; background: none; text-align: left; color: var(--muted); cursor: pointer; }
.tabs button:hover { color: var(--text); }
.tabs button[aria-current='page'] { background: var(--surface-2); color: var(--text); }
.panel { display: flex; flex-direction: column; gap: 1rem; padding: 1.25rem; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
h2 { margin: 0; font: 600 1.0625rem/1.2 'Geist', system-ui, sans-serif; color: var(--text); }
h3 { margin: 0.5rem 0 0; font-size: 13px; color: var(--muted); }
.form { display: flex; flex-direction: column; gap: 0.85rem; max-width: 26rem; }
.form label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 12.5px; font-weight: 500; color: var(--muted); }
.form input, .form select { height: 36px; padding: 0 0.65rem; border: 1px solid var(--line-strong); border-radius: 6px; background: var(--bg); font: inherit; font-size: 14px; color: var(--text); outline: none; color-scheme: dark; }
.form input:focus, .form select:focus { border-color: var(--accent); }
.hint { margin: 0; font-size: 12.5px; color: var(--muted); }
.actions { display: flex; align-items: center; gap: 1rem; }
.link { border: 0; background: none; font-size: 13px; color: var(--accent-soft); text-decoration: none; cursor: pointer; }
.members { display: flex; flex-direction: column; gap: 0.5rem; margin: 0; padding: 0; list-style: none; }
.members li { display: flex; align-items: center; gap: 0.6rem; }
.members small { margin-left: auto; color: var(--muted); }
.av { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; font: 700 10.5px/1 'Lexend', system-ui, sans-serif; color: #000; }
.toggles { display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none; }
.toggles li { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.7rem 0; }
.toggles li + li { border-top: 1px solid var(--line); }
.switch { position: relative; flex-shrink: 0; width: 36px; height: 20px; padding: 0; border: 0; border-radius: 999px; background: var(--line-strong); cursor: pointer; transition: background 0.2s var(--ease); }
.switch span { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: var(--text); transition: translate 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
.switch[aria-checked='true'] { background: var(--accent); }
.switch[aria-checked='true'] span { translate: 16px 0; }
.danger { align-self: flex-start; padding: 0.5rem 0.85rem; border: 1px solid rgb(255 91 77 / 0.4); border-radius: 6px; background: none; color: #ff8a80; cursor: pointer; }
.danger:hover { background: rgb(255 91 77 / 0.1); }
.status { margin: 0; font-size: 13px; color: var(--accent-soft); }
:is(.tabs button, .link, .switch, .danger):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
</style>
