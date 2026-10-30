<script setup>
import { useWorkspace } from '../../composables/useWorkspace'
import { useUi } from '../../composables/useUi'
import AppIcon from './AppIcon.vue'
import Avatars from './Avatars.vue'

defineProps({ items: { type: Array, default: () => [] } })
const { state, status, load } = useWorkspace()
const { openTask, toast } = useUi()

const taskOf = (it) => state.tasks.find((t) => t.id === it.id)
async function open(it) {
  let task = taskOf(it)
  if (!task) {
    await load()
    task = taskOf(it)
  }
  if (task) openTask(task)
  else toast('Não encontrei essa tarefa. Talvez ela tenha sido apagada.')
}
const due = (d) => d && new Date(`${d}T12:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
</script>

<template>
  <ul v-if="items.length" class="cards">
    <li v-for="(it, i) in items" :key="`${it.type}-${it.id || i}`">
      <button v-if="it.type === 'task'" type="button" class="card" :title="`Abrir ${it.code}`" @click="open(it)">
        <span class="ic"><AppIcon name="check" :size="15" /></span>
        <span class="txt">
          <small>{{ it.code }}<template v-if="taskOf(it)">, <span :style="{ color: status(taskOf(it).status).color }">{{ status(taskOf(it).status).name }}</span><template v-if="taskOf(it).due">, prazo {{ due(taskOf(it).due) }}</template></template></small>
          <strong>{{ taskOf(it)?.title || it.title }}</strong>
        </span>
        <Avatars v-if="taskOf(it)" :ids="taskOf(it).assignees" :size="22" />
        <AppIcon name="arrow" :size="14" class="go" />
      </button>
      <RouterLink v-else-if="it.type === 'page'" :to="`/projetos/${it.project}/paginas/${it.id}`" class="card">
        <span class="ic"><AppIcon name="page" :size="15" /></span>
        <span class="txt"><small>Página do projeto</small><strong>{{ it.title }}</strong></span>
        <AppIcon name="arrow" :size="14" class="go" />
      </RouterLink>
      <RouterLink v-else-if="it.type === 'project'" :to="`/projetos/${it.id}/visao-geral`" class="card" @click="load()">
        <span class="ic"><AppIcon name="folder" :size="15" /></span>
        <span class="txt"><small>Projeto</small><strong>{{ it.title }}</strong></span>
        <AppIcon name="arrow" :size="14" class="go" />
      </RouterLink>
      <RouterLink v-else-if="it.type === 'cycle' || it.type === 'module'" :to="`/projetos/${it.project}/${it.type === 'cycle' ? 'ciclos' : 'modulos'}/${it.id}`" class="card">
        <span class="ic"><AppIcon :name="it.type" :size="15" /></span>
        <span class="txt"><small>{{ it.type === 'cycle' ? 'Ciclo' : 'Módulo' }}</small><strong>{{ it.title }}</strong></span>
        <AppIcon name="arrow" :size="14" class="go" />
      </RouterLink>
      <RouterLink v-else-if="it.type === 'wiki' && it.docId" :to="{ path: '/wiki', query: { doc: it.docId } }" class="card">
        <span class="ic"><AppIcon name="wiki" :size="15" /></span>
        <span class="txt"><small>Salvo na sua wiki</small><strong>{{ it.title }}</strong></span>
        <AppIcon name="arrow" :size="14" class="go" />
      </RouterLink>
    </li>
  </ul>
</template>

<style scoped>
.cards { display: flex; flex-direction: column; gap: 0.4rem; margin: 0.5rem 0 0; padding: 0; list-style: none; }
.card { display: flex; align-items: center; gap: 0.65rem; width: 100%; padding: 0.55rem 0.7rem; border: 1px solid var(--line-strong); border-radius: 10px; background: var(--surface); font: inherit; color: var(--text); text-align: left; text-decoration: none; cursor: pointer; transition: border-color 0.2s var(--ease), translate 0.2s var(--ease); }
.card:hover { border-color: var(--accent); translate: 0 -1px; }
.card:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
.ic { display: grid; place-items: center; flex-shrink: 0; width: 28px; height: 28px; border-radius: 7px; background: rgb(229 101 21 / 0.14); color: var(--accent-soft); }
.txt { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.txt small { font-size: 11.5px; color: var(--muted); }
.txt strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
.go { flex-shrink: 0; color: var(--muted); }
</style>
