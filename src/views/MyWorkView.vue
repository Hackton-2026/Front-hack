<script setup>
// Seu trabalho: todas as tarefas atribuídas a você, de todos os projetos, em lista ou quadro
import { ref } from 'vue'
import { useWorkspace } from '../composables/useWorkspace'
import TaskListView from '../components/app/TaskListView.vue'
import TaskBoard from '../components/app/TaskBoard.vue'

const { mine } = useWorkspace()
const view = ref('list')
</script>

<template>
  <div class="page">
    <header class="head">
      <div>
        <h1>Seu trabalho</h1>
        <p>{{ mine.filter((t) => t.status !== 'done').length }} tarefas abertas atribuídas a você.</p>
      </div>
      <div class="seg" role="tablist" aria-label="Visualização">
        <button type="button" role="tab" :aria-selected="view === 'list'" @click="view = 'list'">Lista</button>
        <button type="button" role="tab" :aria-selected="view === 'board'" @click="view = 'board'">Quadro</button>
      </div>
    </header>
    <TaskListView v-if="view === 'list'" :tasks="mine" show-project />
    <TaskBoard v-else :tasks="mine" />
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 1.25rem; padding: 1.5rem; }
.head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 1rem; }
h1 { margin: 0 0 0.25rem; font: 650 1.5rem/1.2 'Geist', system-ui, sans-serif; letter-spacing: -0.02em; color: var(--text); }
.head p { margin: 0; color: var(--muted); }
.seg { display: inline-flex; padding: 3px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); }
.seg button { padding: 0.35rem 0.8rem; border: 0; border-radius: 6px; background: none; font-size: 13px; color: var(--muted); cursor: pointer; transition: background 0.2s var(--ease), color 0.2s var(--ease); }
.seg button[aria-selected='true'] { background: var(--surface-2); color: var(--text); }
.seg button:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 1px; }
</style>
