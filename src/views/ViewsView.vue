<script setup>
// Visões do Plane: filtros salvos com nome (status, prioridade, responsáveis, etiquetas). Sem projeto na rota
// (/visoes) lista as visões de todos os projetos.
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { staggerIn } from '../utils/motion'
import { useWorkspace } from '../composables/useWorkspace'
import { useUi } from '../composables/useUi'
import AppIcon from '../components/app/AppIcon.vue'
import AppModal from '../components/app/AppModal.vue'

const props = defineProps({ id: { type: String, default: '' } })
const router = useRouter()
const { state, project, STATUSES, PRIORITIES, createItem, updateItem, removeItem, starred, toggleStar, member, peopleOf } = useWorkspace()
const { ui } = useUi()
const pid = computed(() => Number(props.id) || null)
const p = computed(() => pid.value && project(pid.value))
const q = ref('')
const sort = ref('updated')
const root = ref(null)

const tags = computed(() => [...new Set(state.tasks.filter((t) => !pid.value || t.projectId === pid.value).flatMap((t) => t.tags))].sort())
const list = computed(() => {
  const all = state.views.filter((v) => (!pid.value || v.project === pid.value) && (!q.value || v.name.toLowerCase().includes(q.value.toLowerCase())))
  const by = sort.value === 'name' ? (a, b) => a.name.localeCompare(b.name) : (a, b) => (b.config.updated_at || '').localeCompare(a.config.updated_at || '')
  return all.sort((a, b) => Number(starred('view', b.id)) - Number(starred('view', a.id)) || by(a, b))
})
const summary = (v) => {
  const f = v.config || {}
  const parts = [
    ...(f.status || []).map((s) => STATUSES.find((x) => x.id === s)?.name),
    ...(f.priority || []).map((s) => PRIORITIES.find((x) => x.id === s)?.name),
    ...(f.assignees || []).map((id) => member(id)?.name.split(' ')[0]),
    ...(f.tags || []).map((t) => `#${t}`),
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'Todos os itens'
}
const matches = (v) => {
  const f = v.config || {}
  const has = (k, val) => !f[k]?.length || f[k].includes(val)
  return state.tasks.filter((t) => t.projectId === v.project && !t.draft && has('status', t.status) && has('priority', t.priority) && (!f.assignees?.length || t.assignees.some((a) => f.assignees.includes(a))) && (!f.tags?.length || t.tags.some((g) => f.tags.includes(g)))).length
}

const editing = ref(null)
const form = reactive({ name: '', project: null, is_private: false, status: [], priority: [], assignees: [], tags: [] })
const err = ref('')
function openForm(v = null) {
  editing.value = v || 'new'
  err.value = ''
  const f = v?.config || {}
  Object.assign(form, { name: v?.name || '', project: v?.project || pid.value || state.projects[0]?.id, is_private: !!v?.is_private, status: [...(f.status || [])], priority: [...(f.priority || [])], assignees: [...(f.assignees || [])], tags: [...(f.tags || [])] })
}
const toggle = (k, val) => (form[k] = form[k].includes(val) ? form[k].filter((x) => x !== val) : [...form[k], val])
async function save() {
  if (!form.name.trim()) return (err.value = 'Dê um nome à visão.')
  const body = { name: form.name.trim(), project: form.project, is_private: form.is_private, config: { status: form.status, priority: form.priority, assignees: form.assignees, tags: form.tags } }
  const v = await (editing.value === 'new' ? createItem('view', body) : updateItem('view', editing.value, body))
  if (!v) return
  const isNew = editing.value === 'new'
  editing.value = null
  if (isNew) router.push(`/projetos/${v.project}/visoes/${v.id}`)
}
const open = (v) => router.push(`/projetos/${v.project}/visoes/${v.id}`)

async function animate() {
  await nextTick()
  staggerIn(root.value?.querySelectorAll('.pg-row'))
}
watch(() => props.id, animate)
watch(p, (v) => (ui.crumb = v ? `${v.name} › Visões` : ''), { immediate: true })
onMounted(animate)
</script>

<template>
  <div ref="root" class="pg">
    <div class="pg-bar">
      <strong>{{ pid ? `${list.length} ${list.length === 1 ? 'visão' : 'visões'}` : 'Visões de todos os projetos' }}</strong>
      <div class="pg-bar__right">
        <label class="pg-search"><AppIcon name="search" :size="14" /><input v-model="q" placeholder="Buscar visões" aria-label="Buscar visões" /></label>
        <select v-model="sort" class="pg-select" aria-label="Ordenar"><option value="updated">Atualizadas</option><option value="name">Nome</option></select>
        <button v-if="state.projects.length" type="button" class="pg-btn primary" @click="openForm()"><AppIcon name="plus" :size="14" />Adicionar visão</button>
      </div>
    </div>

    <div v-if="list.length" class="pg-rows">
      <div v-for="v in list" :key="v.id" class="pg-row">
        <AppIcon name="layers" :size="17" class="ico" />
        <a class="pg-row__main" href="#" @click.prevent="open(v)"><span>{{ v.name }}</span><span class="pg-muted pg-hide-sm">{{ summary(v) }}</span></a>
        <div class="pg-row__side">
          <span v-if="!pid" class="pg-tag">{{ project(v.project)?.name }}</span>
          <span class="pg-muted">{{ matches(v) }} {{ matches(v) === 1 ? 'item' : 'itens' }}</span>
          <span class="pg-icon" :title="v.is_private ? 'Privada: só você vê' : 'Pública: o time todo vê'"><AppIcon :name="v.is_private ? 'lock' : 'globe'" :size="15" /></span>
          <button type="button" class="pg-icon" :class="{ 'is-on': starred('view', v.id) }" :aria-pressed="starred('view', v.id)" :aria-label="starred('view', v.id) ? 'Tirar estrela' : 'Dar estrela'" @click="toggleStar('view', v.id)"><AppIcon name="star" :size="15" /></button>
          <button type="button" class="pg-icon" aria-label="Editar visão" @click="openForm(v)"><AppIcon name="draft" :size="15" /></button>
          <button type="button" class="pg-icon" aria-label="Apagar visão" @click="removeItem('view', v)"><AppIcon name="trash" :size="15" /></button>
        </div>
      </div>
    </div>
    <div v-else class="pg-empty">
      <span class="pg-empty__art"><AppIcon name="layers" :size="36" /></span>
      <h2>{{ q ? 'Nenhuma visão com esse nome' : 'Salve filtros como visões' }}</h2>
      <p>Uma visão guarda um recorte das tarefas (por exemplo, "urgentes da Ana") para abrir de novo com um clique.</p>
      <button v-if="!q && state.projects.length" type="button" class="pg-btn primary" @click="openForm()"><AppIcon name="plus" :size="14" />Criar visão</button>
    </div>

    <AppModal :open="!!editing" :title="editing === 'new' ? 'Nova visão' : 'Editar visão'" @close="editing = null" @submit="save">
      <label class="f"><span>Nome</span><input v-model="form.name" placeholder="Ex.: Urgentes do time" maxlength="80" /></label>
      <label v-if="!pid && editing === 'new'" class="f"><span>Projeto</span><select v-model="form.project"><option v-for="x in state.projects" :key="x.id" :value="x.id">{{ x.name }}</option></select></label>
      <div class="f"><span>Status</span><div class="chips"><button v-for="s in STATUSES" :key="s.id" type="button" class="chip" :class="{ 'is-on': form.status.includes(s.id) }" :aria-pressed="form.status.includes(s.id)" @click="toggle('status', s.id)">{{ s.name }}</button></div></div>
      <div class="f"><span>Prioridade</span><div class="chips"><button v-for="s in PRIORITIES" :key="s.id" type="button" class="chip" :class="{ 'is-on': form.priority.includes(s.id) }" :aria-pressed="form.priority.includes(s.id)" @click="toggle('priority', s.id)">{{ s.name }}</button></div></div>
      <div class="f"><span>Responsáveis</span><div class="chips"><button v-for="m in peopleOf(form.project || pid)" :key="m.id" type="button" class="chip" :class="{ 'is-on': form.assignees.includes(m.id) }" :aria-pressed="form.assignees.includes(m.id)" @click="toggle('assignees', m.id)">{{ m.name }}</button></div></div>
      <div v-if="tags.length" class="f"><span>Etiquetas</span><div class="chips"><button v-for="t in tags" :key="t" type="button" class="chip" :class="{ 'is-on': form.tags.includes(t) }" :aria-pressed="form.tags.includes(t)" @click="toggle('tags', t)">#{{ t }}</button></div></div>
      <label class="check"><input v-model="form.is_private" type="checkbox" /> Privada (só eu vejo)</label>
      <p v-if="err" class="err" role="alert">{{ err }}</p>
      <template #footer>
        <button type="button" class="btn" @click="editing = null">Cancelar</button>
        <button type="submit" class="btn primary">{{ editing === 'new' ? 'Criar visão' : 'Salvar' }}</button>
      </template>
    </AppModal>
  </div>
</template>

<style scoped>
.ico { color: var(--muted); }
.pg-row__main { gap: 1rem; }
.check { display: flex; align-items: center; gap: 0.5rem; font-size: 13px; cursor: pointer; }
.check input { accent-color: var(--accent); }
</style>
