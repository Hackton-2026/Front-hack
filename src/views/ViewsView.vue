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
import { LAYOUTS, layout } from '../components/app/views/layouts'

const props = defineProps({ id: { type: String, default: '' } })
const router = useRouter()
const { state, project, STATUSES, PRIORITIES, createItem, updateItem, removeItem, starred, toggleStar, member, peopleOf } = useWorkspace()
const { ui } = useUi()
const pid = computed(() => Number(props.id) || null)
const p = computed(() => pid.value && project(pid.value))
const q = ref('')
const sort = ref('updated')
const root = ref(null)
const cards = ref(true)
const projFilter = ref('')
// visões prontas: um clique cria no projeto aberto (ou no primeiro) e já abre
const PRESETS = [
  { name: 'Minhas abertas', type: 'list', config: () => ({ assignees: [state.me], status: ['todo', 'doing', 'review'] }), hint: 'Atribuídas a mim e ainda não concluídas' },
  { name: 'Urgentes', type: 'board', config: () => ({ priority: ['urgent', 'high'] }), hint: 'Prioridade urgente e alta, em quadro' },
  { name: 'Em revisão', type: 'table', config: () => ({ status: ['review'] }), hint: 'O que espera aprovação, em tabela' },
  { name: 'Prazos do projeto', type: 'gantt', config: () => ({ status: ['todo', 'doing', 'review'] }), hint: 'Abertas numa linha do tempo' },
]
async function usePreset(pr) {
  const projectId = pid.value || Number(projFilter.value) || state.projects[0]?.id
  if (!projectId) return
  const v = await createItem('view', { name: pr.name, project: projectId, type: pr.type, is_pinned: true, config: pr.config() })
  if (v) router.push(`/projetos/${v.project}/visoes/${v.id}`)
}
const togglePin = (v) => updateItem('view', v, { is_pinned: !v.is_pinned })
// distribuição por status das tarefas que a visão pega (barrinha colorida do cartão)
const spread = (v) => {
  const f = v.config || {}
  const has = (k, val) => !f[k]?.length || f[k].includes(val)
  const list = state.tasks.filter((t) => t.projectId === v.project && !t.draft && has('status', t.status) && has('priority', t.priority) && (!f.assignees?.length || t.assignees.some((a) => f.assignees.includes(a))) && (!f.tags?.length || t.tags.some((g) => f.tags.includes(g))))
  return STATUSES.map((s) => ({ ...s, n: list.filter((t) => t.status === s.id).length, total: list.length })).filter((s) => s.n)
}

const tags = computed(() => [...new Set(state.tasks.filter((t) => !pid.value || t.projectId === pid.value).flatMap((t) => t.tags))].sort())
const list = computed(() => {
  const all = state.views.filter((v) => (!pid.value || v.project === pid.value) && (!projFilter.value || v.project === Number(projFilter.value)) && (!q.value || v.name.toLowerCase().includes(q.value.toLowerCase())))
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
const form = reactive({ name: '', type: 'list', project: null, is_private: false, status: [], priority: [], assignees: [], tags: [] })
const err = ref('')
function openForm(v = null) {
  editing.value = v || 'new'
  err.value = ''
  const f = v?.config || {}
  Object.assign(form, { type: v?.type || 'list', name: v?.name || '', project: v?.project || pid.value || state.projects[0]?.id, is_private: !!v?.is_private, status: [...(f.status || [])], priority: [...(f.priority || [])], assignees: [...(f.assignees || [])], tags: [...(f.tags || [])] })
}
const toggle = (k, val) => (form[k] = form[k].includes(val) ? form[k].filter((x) => x !== val) : [...form[k], val])
async function save() {
  if (!form.name.trim()) return (err.value = 'Dê um nome à visão.')
  const body = { name: form.name.trim(), type: form.type, project: form.project, is_private: form.is_private, config: { status: form.status, priority: form.priority, assignees: form.assignees, tags: form.tags } }
  const v = await (editing.value === 'new' ? createItem('view', body) : updateItem('view', editing.value, body))
  if (!v) return
  const isNew = editing.value === 'new'
  editing.value = null
  if (isNew) router.push(`/projetos/${v.project}/visoes/${v.id}`)
}
const open = (v) => router.push(`/projetos/${v.project}/visoes/${v.id}`)

async function animate() {
  await nextTick()
  staggerIn(root.value?.querySelectorAll('.pg-row, .vcard, .preset'))
}
watch([() => props.id, cards, projFilter], animate)
watch(p, (v) => (ui.crumb = v ? `${v.name} › Visões` : ''), { immediate: true })
onMounted(animate)
</script>

<template>
  <div ref="root" class="pg">
    <div class="pg-bar">
      <strong>{{ pid ? `${list.length} ${list.length === 1 ? 'visão' : 'visões'}` : 'Visões de todos os projetos' }}</strong>
      <div class="pg-bar__right">
        <label class="pg-search"><AppIcon name="search" :size="14" /><input v-model="q" placeholder="Buscar visões" aria-label="Buscar visões" /></label>
        <select v-if="!pid" v-model="projFilter" class="pg-select" aria-label="Projeto"><option value="">Todos os projetos</option><option v-for="x in state.projects" :key="x.id" :value="x.id">{{ x.name }}</option></select>
        <select v-model="sort" class="pg-select" aria-label="Ordenar"><option value="updated">Atualizadas</option><option value="name">Nome</option></select>
        <div class="pg-seg" role="group" aria-label="Visualização">
          <button type="button" :aria-pressed="cards" aria-label="Cartões" title="Cartões" @click="cards = true"><AppIcon name="grid" :size="14" /></button>
          <button type="button" :aria-pressed="!cards" aria-label="Lista" title="Lista" @click="cards = false"><AppIcon name="list" :size="14" /></button>
        </div>
        <button v-if="state.projects.length" type="button" class="pg-btn primary" @click="openForm()"><AppIcon name="plus" :size="14" />Adicionar visão</button>
      </div>
    </div>

    <div v-if="list.length && cards" class="vgrid">
      <article v-for="v in list" :key="v.id" class="vcard">
        <header>
          <span class="vico"><AppIcon :name="layout(v.type).icon" :size="15" /></span>
          <button type="button" class="vname" @click="open(v)">{{ v.name }}</button>
          <button type="button" class="pg-icon" :class="{ 'is-on': starred('view', v.id) }" :aria-pressed="starred('view', v.id)" :aria-label="starred('view', v.id) ? 'Tirar estrela' : 'Dar estrela'" @click="toggleStar('view', v.id)"><AppIcon name="star" :size="14" /></button>
        </header>
        <p class="pg-muted">{{ summary(v) }}</p>
        <div class="spread" :title="spread(v).map((s) => `${s.name}: ${s.n}`).join(' · ')"><i v-for="s in spread(v)" :key="s.id" :style="{ flex: s.n, background: s.color }" /></div>
        <footer>
          <span class="big">{{ matches(v) }}</span><span class="pg-muted">{{ matches(v) === 1 ? 'item' : 'itens' }} · {{ layout(v.type).label }}</span>
          <span v-if="!pid" class="pg-tag">{{ project(v.project)?.name }}</span>
          <button type="button" class="pg-icon" :class="{ 'is-on': v.is_pinned }" :aria-pressed="!!v.is_pinned" :title="v.is_pinned ? 'Fixada na barra do projeto' : 'Fixar na barra do projeto'" :aria-label="v.is_pinned ? 'Desafixar da barra do projeto' : 'Fixar na barra do projeto'" @click="togglePin(v)"><AppIcon name="pin" :size="14" /></button>
          <span class="pg-icon" :title="v.is_private ? 'Privada: só você vê' : 'Pública: o time todo vê'"><AppIcon :name="v.is_private ? 'lock' : 'globe'" :size="14" /></span>
          <button type="button" class="pg-icon" aria-label="Editar visão" @click="openForm(v)"><AppIcon name="draft" :size="14" /></button>
          <button type="button" class="pg-icon" aria-label="Apagar visão" @click="removeItem('view', v)"><AppIcon name="trash" :size="14" /></button>
        </footer>
      </article>
    </div>
    <div v-else-if="list.length" class="pg-rows">
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

    <section v-if="state.projects.length" class="presets">
      <h2>Visões prontas</h2>
      <div class="pgrid">
        <button v-for="pr in PRESETS" :key="pr.name" type="button" class="preset" @click="usePreset(pr)">
          <AppIcon :name="layout(pr.type).icon" :size="15" /><span><strong>{{ pr.name }}</strong><small>{{ pr.hint }}</small></span><AppIcon name="plus" :size="14" />
        </button>
      </div>
    </section>
    <AppModal :open="!!editing" :title="editing === 'new' ? 'Nova visão' : 'Editar visão'" @close="editing = null" @submit="save">
      <label class="f"><span>Nome</span><input v-model="form.name" placeholder="Ex.: Urgentes do time" maxlength="80" /></label>
      <label class="f"><span>Layout</span><select v-model="form.type"><option v-for="l in LAYOUTS.filter((x) => !x.soon)" :key="l.type" :value="l.type">{{ l.label }}</option></select></label>
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
.vgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr)); gap: 0.8rem; padding: 0 1.25rem; }
.vcard { display: flex; flex-direction: column; gap: 0.6rem; padding: 0.9rem 1rem; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); }
.vcard:hover { border-color: var(--line-strong); }
.vcard header, .vcard footer { display: flex; align-items: center; gap: 0.5rem; }
.vcard p { margin: 0; }
.vico { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 7px; background: color-mix(in srgb, var(--accent) 16%, transparent); color: var(--accent-soft); }
.vname { flex: 1; min-width: 0; padding: 0; border: 0; background: none; font: inherit; font-size: 14.5px; font-weight: 600; color: var(--text); text-align: left; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vname:hover { color: var(--accent-soft); }
.spread { display: flex; gap: 2px; height: 6px; overflow: hidden; border-radius: 999px; background: var(--surface-2); }
.spread i { display: block; }
.big { font: 650 1.25rem/1 'Geist', system-ui, sans-serif; color: var(--text); }
.vcard footer .pg-tag { margin-left: auto; }
.vcard footer .pg-tag + .pg-icon, .vcard footer > .pg-muted + .pg-icon { margin-left: auto; }
.pg-icon.is-on { color: #f2c46d; }
.presets { padding: 1.2rem 1.25rem 0; }
.presets h2 { margin: 0 0 0.6rem; font-size: 12.5px; font-weight: 600; color: var(--muted); }
.pgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); gap: 0.6rem; }
.preset { display: flex; align-items: center; gap: 0.6rem; padding: 0.6rem 0.75rem; border: 1px dashed var(--line-strong); border-radius: 10px; background: none; color: var(--muted); text-align: left; cursor: pointer; }
.preset:hover { border-color: var(--accent); color: var(--text); }
.preset span { display: flex; flex: 1; flex-direction: column; }
.preset strong { font-size: 13px; color: var(--text); }
.preset small { font-size: 11.5px; }
:is(.vname, .preset):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
</style>
