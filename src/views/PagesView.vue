<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { staggerIn } from '../utils/motion'
import { useWorkspace } from '../composables/useWorkspace'
import { useUi } from '../composables/useUi'
import AppIcon from '../components/app/AppIcon.vue'
import AppSelect from '../components/app/AppSelect.vue'

const props = defineProps({ id: { type: String, required: true } })
const router = useRouter()
const { state, project, createItem, updateItem, removeItem, starred, toggleStar, member } = useWorkspace()
const { ui, confirmAsk } = useUi()
const pid = computed(() => Number(props.id))
const p = computed(() => project(pid.value))
const TABS = [
  { id: 'public', label: 'Públicas' },
  { id: 'private', label: 'Privadas' },
  { id: 'archived', label: 'Arquivadas' },
]
const tab = ref('public')
const q = ref('')
const sort = ref('updated')
const menu = ref(null)
const root = ref(null)

const inTab = (pg, t) => (t === 'archived' ? pg.archived : !pg.archived && (t === 'private') === pg.is_private)
const mine = computed(() => state.pages.filter((pg) => pg.project === pid.value))
const list = computed(() => {
  const all = mine.value.filter((pg) => inTab(pg, tab.value) && (!q.value || (pg.title || 'Sem título').toLowerCase().includes(q.value.toLowerCase())))
  const by = { updated: (a, b) => b.updated_at.localeCompare(a.updated_at), created: (a, b) => b.created_at.localeCompare(a.created_at), name: (a, b) => (a.title || '').localeCompare(b.title || '') }
  return all.sort((a, b) => Number(starred('page', b.id)) - Number(starred('page', a.id)) || by[sort.value](a, b))
})
const when = (iso) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

async function add() {
  const pg = await createItem('page', { project: pid.value, title: '', body: '', is_private: tab.value === 'private' })
  if (pg) router.push(`/projetos/${pid.value}/paginas/${pg.id}`)
}
async function set(pg, fields) {
  menu.value = null
  await updateItem('page', pg, fields)
}
async function remove(pg) {
  menu.value = null
  if (!(await confirmAsk(`Apagar a página "${pg.title || 'Sem título'}"?`, { message: 'Não dá para desfazer.' }))) return
  await removeItem('page', pg)
}

async function animate() {
  await nextTick()
  staggerIn(root.value?.querySelectorAll('.pg-row'))
}
watch([tab, () => props.id], animate)
watch(p, (v) => (ui.crumb = v ? `${v.name} › Documentos do projeto` : 'Projeto não encontrado'), { immediate: true })
const onDoc = (e) => !e.target.closest('.menu-wrap') && (menu.value = null)
onMounted(() => { animate(); addEventListener('click', onDoc) })
onUnmounted(() => removeEventListener('click', onDoc))
</script>

<template>
  <div v-if="p" ref="root" class="pg">
    <div class="pg-bar">
      <div class="pg-tabs" role="tablist" aria-label="Documentos do projeto">
        <button v-for="t in TABS" :key="t.id" type="button" role="tab" :aria-selected="tab === t.id" @click="tab = t.id">{{ t.label }}<span class="n">{{ mine.filter((pg) => inTab(pg, t.id)).length }}</span></button>
      </div>
      <div class="pg-bar__right">
        <label class="pg-search"><AppIcon name="search" :size="14" /><input v-model="q" placeholder="Buscar páginas" aria-label="Buscar páginas" /></label>
        <AppSelect v-model="sort" :options="[{ value: 'updated', label: 'Modificadas' }, { value: 'created', label: 'Criadas' }, { value: 'name', label: 'Nome' }]" size="sm" aria-label="Ordenar" />
        <button type="button" class="pg-btn primary" @click="add"><AppIcon name="plus" :size="14" />Adicionar página</button>
      </div>
    </div>

    <div v-if="list.length" class="pg-rows">
      <div v-for="pg in list" :key="pg.id" class="pg-row">
        <AppIcon name="page" :size="17" class="ico" />
        <RouterLink class="pg-row__main" :to="`/projetos/${pid}/paginas/${pg.id}`"><span>{{ pg.title || 'Sem título' }}</span></RouterLink>
        <div class="pg-row__side">
          <span class="pg-muted pg-hide-sm">{{ member(pg.owner)?.name.split(' ')[0] }}, {{ when(pg.updated_at) }}</span>
          <span class="pg-icon" :title="pg.is_private ? 'Privada: só você vê' : 'Pública: o time todo vê'"><AppIcon :name="pg.is_private ? 'lock' : 'globe'" :size="15" /></span>
          <button type="button" class="pg-icon" :class="{ 'is-on': starred('page', pg.id) }" :aria-pressed="starred('page', pg.id)" :aria-label="starred('page', pg.id) ? 'Tirar estrela' : 'Dar estrela'" @click="toggleStar('page', pg.id)"><AppIcon name="star" :size="15" /></button>
          <div class="menu-wrap">
            <button type="button" class="pg-icon" :aria-expanded="menu === pg.id" aria-label="Opções da página" @click="menu = menu === pg.id ? null : pg.id"><AppIcon name="more" :size="16" /></button>
            <div v-if="menu === pg.id" class="pg-menu" role="menu">
              <template v-if="!pg.archived">
                <button v-if="pg.owner === state.me" type="button" role="menuitem" @click="set(pg, { is_private: !pg.is_private })"><AppIcon :name="pg.is_private ? 'globe' : 'lock'" :size="14" />{{ pg.is_private ? 'Tornar pública' : 'Tornar privada' }}</button>
                <button type="button" role="menuitem" @click="set(pg, { archived: true })"><AppIcon name="archive" :size="14" />Arquivar</button>
              </template>
              <template v-else>
                <button type="button" role="menuitem" @click="set(pg, { archived: false })"><AppIcon name="undo" :size="14" />Restaurar</button>
                <button type="button" role="menuitem" class="danger" @click="remove(pg)"><AppIcon name="trash" :size="14" />Apagar de vez</button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="pg-empty">
      <span class="pg-empty__art"><AppIcon name="page" :size="36" /></span>
      <h2>{{ q ? 'Nenhuma página com esse nome' : tab === 'archived' ? 'Nada arquivado' : tab === 'private' ? 'Nenhuma página privada' : 'Documente o projeto em páginas' }}</h2>
      <p>Páginas guardam especificações, atas e decisões junto das tarefas. As privadas só você vê.</p>
      <button v-if="!q && tab !== 'archived'" type="button" class="pg-btn primary" @click="add"><AppIcon name="plus" :size="14" />Criar página</button>
    </div>
  </div>
  <div v-else class="pg-empty"><h2>Esse projeto não existe mais.</h2><RouterLink to="/projetos" class="pg-btn">Ver projetos</RouterLink></div>
</template>

<style scoped>
.ico { color: var(--muted); }
.menu-wrap { position: relative; }
</style>
