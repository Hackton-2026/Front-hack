<script setup>
// Arquivados (Plane → Archives): projetos arquivados, itens na lixeira e páginas arquivadas, com restaurar
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { staggerIn } from '../utils/motion'
import { useWorkspace } from '../composables/useWorkspace'
import { useUi } from '../composables/useUi'
import AppIcon from '../components/app/AppIcon.vue'

const { state, project, archivedProjects, trashedTasks, restoreProject, restoreTask, updateItem } = useWorkspace()
const { toast } = useUi()
const TABS = [
  { id: 'projects', label: 'Projetos' },
  { id: 'tasks', label: 'Itens apagados' },
  { id: 'pages', label: 'Páginas' },
]
const tab = ref('projects')
const projects = ref([])
const trash = ref([])
const loading = ref(true)
const root = ref(null)
const pages = computed(() => state.pages.filter((p) => p.archived))
const rows = computed(() => ({ projects: projects.value, tasks: trash.value, pages: pages.value })[tab.value])
const when = (iso) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

async function fetchAll() {
  loading.value = true
  try { [projects.value, trash.value] = await Promise.all([archivedProjects(), trashedTasks()]) } catch { toast('Não foi possível carregar os arquivados.') } finally { loading.value = false }
}
async function restore(kind, item) {
  const ok = kind === 'projects' ? await restoreProject(item) : kind === 'tasks' ? await restoreTask(item) : await updateItem('page', item, { archived: false })
  if (!ok) return
  if (kind === 'projects') projects.value = projects.value.filter((p) => p.id !== item.id)
  if (kind === 'tasks') trash.value = trash.value.filter((t) => t.id !== item.id)
  toast(`${item.name || item.title || 'Item'} foi restaurado.`)
}
async function animate() {
  await nextTick()
  staggerIn(root.value?.querySelectorAll('.pg-row'))
}
watch([tab, loading], animate)
onMounted(fetchAll)
</script>

<template>
  <div ref="root" class="pg">
    <div class="pg-bar">
      <div class="pg-tabs" role="tablist" aria-label="Arquivados">
        <button v-for="t in TABS" :key="t.id" type="button" role="tab" :aria-selected="tab === t.id" @click="tab = t.id">{{ t.label }}<span class="n">{{ { projects: projects.length, tasks: trash.length, pages: pages.length }[t.id] }}</span></button>
      </div>
      <button type="button" class="pg-btn" :disabled="loading" @click="fetchAll"><AppIcon name="undo" :size="14" />Atualizar</button>
    </div>
    <p v-if="loading" class="pg-muted pad">Carregando…</p>
    <div v-else-if="rows.length" class="pg-rows">
      <div v-for="r in rows" :key="r.id" class="pg-row">
        <AppIcon :name="tab === 'projects' ? 'folder' : tab === 'tasks' ? 'items' : 'page'" :size="17" class="ico" />
        <div class="pg-row__main">
          <span v-if="tab === 'tasks'" class="code">{{ r.code }}</span>
          <span>{{ r.name || r.title || 'Sem título' }}</span>
          <span v-if="tab !== 'projects'" class="pg-tag">{{ project(r.projectId || r.project)?.name }}</span>
        </div>
        <div class="pg-row__side">
          <span class="pg-muted pg-hide-sm">{{ tab === 'pages' ? `editada em ${when(r.updated_at)}` : tab === 'tasks' ? `criada em ${when(r.createdAt)}` : `criado em ${when(r.created_at)}` }}</span>
          <button v-if="tab !== 'projects' || state.isAdmin" type="button" class="pg-btn" @click="restore(tab, r)"><AppIcon name="undo" :size="14" />Restaurar</button>
        </div>
      </div>
    </div>
    <div v-else class="pg-empty">
      <span class="pg-empty__art"><AppIcon name="archive" :size="36" /></span>
      <h2>{{ tab === 'projects' ? 'Nenhum projeto arquivado' : tab === 'tasks' ? 'A lixeira está vazia' : 'Nenhuma página arquivada' }}</h2>
      <p>O que você arquivar ou apagar aparece aqui e pode voltar com um clique.</p>
    </div>
  </div>
</template>

<style scoped>
.pad { padding: 1.25rem; }
.ico { color: var(--muted); }
.code { flex: 0 0 auto; font: 500 12px/1 'Geist Mono', monospace; color: var(--muted); }
.pg-btn:disabled { opacity: 0.5; }
</style>
