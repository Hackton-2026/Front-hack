<script setup>
import { computed, ref } from 'vue'
import { useWorkspace } from '../../../composables/useWorkspace'
import AppSelect from '../AppSelect.vue'

const props = defineProps({ view: { type: Object, required: true } })
const { state, createItem, updateItem } = useWorkspace()
const pages = computed(() => state.pages.filter((p) => p.project === props.view.project && !p.archived))
const page = computed(() => state.pages.find((p) => p.id === props.view.config?.page))
const pick = (id) => updateItem('view', props.view, { config: { ...props.view.config, page: Number(id) } })
async function create() {
  const p = await createItem('page', { project: props.view.project, title: props.view.name || 'Documento' })
  if (p) pick(p.id)
}
const saved = ref('')
let timer
function edit(field, value) {
  page.value[field] = value
  saved.value = 'Salvando…'
  clearTimeout(timer)
  timer = setTimeout(async () => { await updateItem('page', page.value, { [field]: value }); saved.value = 'Salvo' }, 600)
}
</script>

<template>
  <div class="doc">
    <div class="bar">
      <label>Página
        <AppSelect :model-value="page?.id" :options="pages.map((p) => ({ value: p.id, label: p.title || 'Sem título' }))" placeholder="Escolher página" size="sm" @change="pick" />
      </label>
      <button type="button" class="link" @click="create">+ Nova página</button>
      <RouterLink v-if="page" :to="`/projetos/${view.project}/paginas/${page.id}`" class="link">Abrir no editor completo</RouterLink>
      <small>{{ saved }}</small>
    </div>
    <article v-if="page" class="paper">
      <input :value="page.title" class="title" placeholder="Sem título" aria-label="Título da página" @input="edit('title', $event.target.value)" />
      <textarea :value="page.body" class="body" placeholder="Escreva aqui. Fica salvo nas páginas do projeto." aria-label="Conteúdo da página" @input="edit('body', $event.target.value)" />
    </article>
    <p v-else class="empty">Escolha uma página do projeto ou crie uma nova.</p>
  </div>
</template>

<style scoped>
.doc { display: flex; flex-direction: column; gap: 0.8rem; }
.bar { display: flex; flex-wrap: wrap; align-items: center; gap: 0.9rem; font-size: 12.5px; color: var(--muted); }
.bar label { display: flex; align-items: center; gap: 0.4rem; }
.link { padding: 0; border: 0; background: none; font-size: 12.5px; color: var(--accent-soft); text-decoration: none; cursor: pointer; }
.paper { display: flex; flex-direction: column; gap: 0.6rem; max-width: 46rem; padding: 1.5rem 1.75rem; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
.title { border: 0; background: none; font: 700 1.6rem/1.2 'Geist', system-ui, sans-serif; color: var(--text); outline: none; }
.body { min-height: 40vh; border: 0; background: none; font: 400 15px/1.7 'Geist', system-ui, sans-serif; color: var(--text); resize: vertical; outline: none; field-sizing: content; }
.empty { margin: 0; padding: 2rem; text-align: center; color: var(--muted); }
.link:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
</style>
