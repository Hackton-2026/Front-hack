<script setup>
// Módulos do Plane: lista (ou grade) com progresso, datas, situação, líder e estrela; abre os itens do módulo
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { staggerIn } from '../utils/motion'
import { MODULE_STATES, useWorkspace } from '../composables/useWorkspace'
import { useUi } from '../composables/useUi'
import AppIcon from '../components/app/AppIcon.vue'
import AppModal from '../components/app/AppModal.vue'
import Avatars from '../components/app/Avatars.vue'
import ProgressRing from '../components/app/ProgressRing.vue'

const props = defineProps({ id: { type: String, required: true } })
const router = useRouter()
const { state, project, today, day, doneRatio, createItem, updateItem, removeItem, starred, toggleStar, member } = useWorkspace()
const { ui } = useUi()
const pid = computed(() => Number(props.id))
const p = computed(() => project(pid.value))
const layout = ref('list')
const sort = ref('name')
const q = ref('')
const menu = ref(null)
const root = ref(null)

const tasksOf = (m) => state.tasks.filter((t) => t.modules?.includes(m.id) && !t.draft)
const stateOf = (id) => MODULE_STATES.find((s) => s.id === id) || MODULE_STATES[0]
const fmt = (d) => new Date(`${d}T12:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
const range = (m) => (m.start_date && m.due_date ? `${fmt(m.start_date)} – ${fmt(m.due_date)}` : m.due_date ? `até ${fmt(m.due_date)}` : 'Sem datas')
const list = computed(() => {
  const all = state.modules.filter((m) => m.project === pid.value && (!q.value || m.name.toLowerCase().includes(q.value.toLowerCase())))
  const by = { name: (a, b) => a.name.localeCompare(b.name), progress: (a, b) => doneRatio(tasksOf(b)) - doneRatio(tasksOf(a)), due: (a, b) => (a.due_date || '9').localeCompare(b.due_date || '9'), created: (a, b) => b.created_at.localeCompare(a.created_at) }
  // com estrela primeiro, como no Plane
  return all.sort((a, b) => Number(starred('module', b.id)) - Number(starred('module', a.id)) || by[sort.value](a, b))
})

const editing = ref(null)
const form = reactive({ name: '', description: '', state: 'planned', lead: null, start_date: '', due_date: '' })
const err = ref('')
function openForm(m = null) {
  menu.value = null
  editing.value = m || 'new'
  err.value = ''
  Object.assign(form, m ? { name: m.name, description: m.description, state: m.state, lead: m.lead, start_date: m.start_date || '', due_date: m.due_date || '' } : { name: '', description: '', state: 'planned', lead: state.me, start_date: today(), due_date: day(14) })
}
async function save() {
  if (!form.name.trim()) return (err.value = 'Dê um nome ao módulo.')
  if (form.start_date && form.due_date && form.due_date < form.start_date) return (err.value = 'A data final vem antes do início.')
  const body = { ...form, name: form.name.trim(), start_date: form.start_date || null, due_date: form.due_date || null, project: pid.value }
  if (await (editing.value === 'new' ? createItem('module', body) : updateItem('module', editing.value, body))) editing.value = null
}
async function remove(m) {
  menu.value = null
  await removeItem('module', m)
}
const open = (m) => router.push(`/projetos/${pid.value}/modulos/${m.id}`)

async function animate() {
  await nextTick()
  staggerIn(root.value?.querySelectorAll('.pg-row, .card'))
}
watch([layout, () => props.id], animate)
watch(p, (v) => (ui.crumb = v ? `${v.name} › Módulos` : 'Projeto não encontrado'), { immediate: true })
const onDoc = (e) => !e.target.closest('.menu-wrap') && (menu.value = null)
onMounted(() => { animate(); addEventListener('click', onDoc) })
onUnmounted(() => removeEventListener('click', onDoc))
</script>

<template>
  <div v-if="p" ref="root" class="pg">
    <div class="pg-bar">
      <strong>{{ list.length }} {{ list.length === 1 ? 'módulo' : 'módulos' }}</strong>
      <div class="pg-bar__right">
        <label class="pg-search"><AppIcon name="search" :size="14" /><input v-model="q" placeholder="Buscar módulos" aria-label="Buscar módulos" /></label>
        <div class="pg-seg" role="group" aria-label="Layout">
          <button type="button" :aria-pressed="layout === 'list'" aria-label="Lista" @click="layout = 'list'"><AppIcon name="list" :size="15" /></button>
          <button type="button" :aria-pressed="layout === 'grid'" aria-label="Galeria" @click="layout = 'grid'"><AppIcon name="grid" :size="15" /></button>
        </div>
        <select v-model="sort" class="pg-select" aria-label="Ordenar">
          <option value="name">Nome</option><option value="progress">Progresso</option><option value="due">Data final</option><option value="created">Mais novos</option>
        </select>
        <button type="button" class="pg-btn primary" @click="openForm()"><AppIcon name="plus" :size="14" />Adicionar módulo</button>
      </div>
    </div>

    <div v-if="!list.length" class="pg-empty">
      <span class="pg-empty__art"><AppIcon name="module" :size="36" /></span>
      <h2>{{ q ? 'Nenhum módulo com esse nome' : 'Divida o projeto em módulos' }}</h2>
      <p>Módulos são partes menores do projeto (uma funcionalidade, uma área) com líder, prazo e progresso próprios.</p>
      <button v-if="!q" type="button" class="pg-btn primary" @click="openForm()"><AppIcon name="plus" :size="14" />Criar módulo</button>
    </div>

    <div v-else-if="layout === 'list'" class="pg-rows">
      <div v-for="m in list" :key="m.id" class="pg-row">
        <ProgressRing :value="doneRatio(tasksOf(m))" :size="32" />
        <a class="pg-row__main" href="#" @click.prevent="open(m)"><span>{{ m.name }}</span></a>
        <div class="pg-row__side">
          <span class="pg-pill pg-hide-sm">{{ range(m) }}</span>
          <select class="pg-pill" :value="m.state" aria-label="Situação do módulo" :style="{ color: stateOf(m.state).color }" @change="updateItem('module', m, { state: $event.target.value })">
            <option v-for="s in MODULE_STATES" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
          <span :title="m.lead ? `Líder: ${member(m.lead)?.name}` : 'Sem líder'" class="lead"><Avatars v-if="m.lead" :ids="[m.lead]" :size="24" /><AppIcon v-else name="user" :size="16" /></span>
          <button type="button" class="pg-icon" :class="{ 'is-on': starred('module', m.id) }" :aria-pressed="starred('module', m.id)" :aria-label="starred('module', m.id) ? 'Tirar estrela' : 'Dar estrela'" @click="toggleStar('module', m.id)"><AppIcon name="star" :size="15" /></button>
          <div class="menu-wrap">
            <button type="button" class="pg-icon" :aria-expanded="menu === m.id" aria-label="Opções do módulo" @click="menu = menu === m.id ? null : m.id"><AppIcon name="more" :size="16" /></button>
            <div v-if="menu === m.id" class="pg-menu" role="menu">
              <button type="button" role="menuitem" @click="openForm(m)"><AppIcon name="draft" :size="14" />Editar</button>
              <button type="button" role="menuitem" class="danger" @click="remove(m)"><AppIcon name="trash" :size="14" />Apagar</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="grid">
      <article v-for="m in list" :key="m.id" class="card">
        <header>
          <a href="#" class="card__name" @click.prevent="open(m)">{{ m.name }}</a>
          <span class="pg-pill" :style="{ color: stateOf(m.state).color }">{{ stateOf(m.state).name }}</span>
        </header>
        <p v-if="m.description" class="card__desc">{{ m.description }}</p>
        <div class="card__meta"><AppIcon name="items" :size="14" />{{ tasksOf(m).filter((t) => t.status === 'done').length }}/{{ tasksOf(m).length }} itens<Avatars v-if="m.lead" :ids="[m.lead]" :size="22" class="card__lead" /></div>
        <div class="bar" aria-hidden="true"><span :style="{ transform: `scaleX(${doneRatio(tasksOf(m))})` }" /></div>
        <footer>
          <span class="pg-muted"><AppIcon name="calendar" :size="13" /> {{ range(m) }}</span>
          <button type="button" class="pg-icon" :class="{ 'is-on': starred('module', m.id) }" :aria-pressed="starred('module', m.id)" :aria-label="starred('module', m.id) ? 'Tirar estrela' : 'Dar estrela'" @click="toggleStar('module', m.id)"><AppIcon name="star" :size="15" /></button>
          <button type="button" class="pg-icon" aria-label="Editar módulo" @click="openForm(m)"><AppIcon name="draft" :size="15" /></button>
        </footer>
      </article>
    </div>

    <AppModal :open="!!editing" :title="editing === 'new' ? 'Novo módulo' : 'Editar módulo'" @close="editing = null" @submit="save">
      <label class="f"><span>Nome</span><input v-model="form.name" placeholder="Ex.: Onboarding" maxlength="120" /></label>
      <label class="f"><span>Descrição</span><textarea v-model="form.description" rows="2" placeholder="O que entra neste módulo (opcional)" /></label>
      <div class="row2">
        <label class="f"><span>Início</span><input v-model="form.start_date" type="date" /></label>
        <label class="f"><span>Data final</span><input v-model="form.due_date" type="date" /></label>
      </div>
      <div class="row2">
        <label class="f"><span>Situação</span><select v-model="form.state"><option v-for="s in MODULE_STATES" :key="s.id" :value="s.id">{{ s.name }}</option></select></label>
        <label class="f"><span>Líder</span><select v-model="form.lead"><option :value="null">Sem líder</option><option v-for="x in state.members" :key="x.id" :value="x.id">{{ x.name }}</option></select></label>
      </div>
      <p v-if="err" class="err" role="alert">{{ err }}</p>
      <template #footer>
        <button type="button" class="btn" @click="editing = null">Cancelar</button>
        <button type="submit" class="btn primary">{{ editing === 'new' ? 'Criar módulo' : 'Salvar' }}</button>
      </template>
    </AppModal>
  </div>
  <div v-else class="pg-empty"><h2>Esse projeto não existe mais.</h2><RouterLink to="/projetos" class="pg-btn">Ver projetos</RouterLink></div>
</template>

<style scoped>
.menu-wrap { position: relative; }
.lead { display: grid; place-items: center; width: 30px; height: 30px; color: var(--muted); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr)); gap: 0.9rem; padding: 1.25rem; }
.card { display: flex; flex-direction: column; gap: 0.75rem; padding: 1rem; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); transition: border-color 0.2s var(--ease), translate 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.card:hover { border-color: var(--line-strong); translate: 0 -2px; }
.card header { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; }
.card__name { font-weight: 600; color: var(--text); text-decoration: none; }
.card__name:hover { color: var(--accent-soft); }
.card__desc { margin: 0; font-size: 13px; color: var(--muted); display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.card__meta { display: flex; align-items: center; gap: 0.4rem; font-size: 12.5px; color: var(--muted); }
.card__lead { margin-left: auto; }
.bar { height: 5px; overflow: hidden; border-radius: 999px; background: var(--surface-2); }
.bar span { display: block; height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent-soft)); transform-origin: left; transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1); }
.card footer { display: flex; align-items: center; gap: 0.25rem; }
.card footer .pg-muted { display: inline-flex; flex: 1; align-items: center; gap: 0.3rem; }
</style>
