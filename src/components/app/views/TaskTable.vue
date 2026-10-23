<script setup>
// Tabela: uma planilha das tarefas, ordenável pelo cabeçalho e editável na própria célula
import { computed, ref } from 'vue'
import { useWorkspace } from '../../../composables/useWorkspace'
import { useUi } from '../../../composables/useUi'
import Avatars from '../Avatars.vue'
import AppSelect from '../AppSelect.vue'

const props = defineProps({ tasks: { type: Array, required: true } })
const { STATUSES, PRIORITIES, code, updateTask, isOverdue } = useWorkspace()
const { openTask } = useUi()
const COLS = [['code', 'ID'], ['title', 'Título'], ['status', 'Status'], ['priority', 'Prioridade'], ['assignees', 'Responsáveis'], ['due', 'Prazo'], ['tags', 'Etiquetas']]
const RANK = { status: STATUSES.map((s) => s.id), priority: PRIORITIES.map((p) => p.id) }
const statusOptions = STATUSES.map((s) => ({ value: s.id, label: s.name }))
const priorityOptions = [{ value: '', label: '—' }, ...PRIORITIES.map((p) => ({ value: p.id, label: p.name }))]
const sortBy = ref('code')
const asc = ref(true)
const key = (t, k) => (k === 'code' ? t.number ?? 0 : k in RANK ? RANK[k].indexOf(t[k]) : k === 'assignees' || k === 'tags' ? t[k].length : t[k] || '')
const rows = computed(() => [...props.tasks].sort((a, b) => {
  const x = key(a, sortBy.value), y = key(b, sortBy.value)
  return (x > y ? 1 : x < y ? -1 : 0) * (asc.value ? 1 : -1)
}))
function sort(k) {
  asc.value = sortBy.value === k ? !asc.value : true
  sortBy.value = k
}
</script>

<template>
  <div class="wrap">
    <table>
      <thead>
        <tr>
          <th v-for="[k, label] in COLS" :key="k" :aria-sort="sortBy === k ? (asc ? 'ascending' : 'descending') : 'none'">
            <button type="button" @click="sort(k)">{{ label }} <span v-if="sortBy === k">{{ asc ? '↑' : '↓' }}</span></button>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="t in rows" :key="t.id">
          <td class="muted">{{ code(t) }}</td>
          <td><button type="button" class="title" @click="openTask(t)">{{ t.title }}</button></td>
          <td><AppSelect :model-value="t.status" :options="statusOptions" size="sm" aria-label="Status" @change="(v) => updateTask(t, { status: v })" /></td>
          <td><AppSelect :model-value="t.priority" :options="priorityOptions" size="sm" aria-label="Prioridade" @change="(v) => updateTask(t, { priority: v })" /></td>
          <td><Avatars :ids="t.assignees" /></td>
          <td><input type="date" :value="t.due || ''" :class="{ late: isOverdue(t) }" aria-label="Prazo" @change="updateTask(t, { due: $event.target.value || null })" /></td>
          <td class="muted">{{ t.tags.join(', ') || '—' }}</td>
        </tr>
        <tr v-if="!rows.length"><td :colspan="COLS.length" class="muted empty">Nenhuma tarefa.</td></tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: 8px; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { position: sticky; top: 0; background: var(--surface); text-align: left; }
th button { width: 100%; padding: 0.5rem 0.6rem; border: 0; background: none; font: 600 12px/1 'Geist', system-ui, sans-serif; color: var(--muted); text-align: left; cursor: pointer; white-space: nowrap; }
td { padding: 0.3rem 0.6rem; border-top: 1px solid var(--line); white-space: nowrap; }
.title { max-width: 22rem; overflow: hidden; padding: 0; border: 0; background: none; font: inherit; color: var(--text); text-align: left; text-overflow: ellipsis; cursor: pointer; }
.title:hover { color: var(--accent-soft); }
input { height: 28px; padding: 0 0.35rem; border: 1px solid transparent; border-radius: 5px; background: none; font: inherit; color: var(--text); }
input:hover, input:focus { border-color: var(--line-strong); outline: none; }
.late { color: #ff8a80; }
.muted { color: var(--muted); }
.empty { padding: 1.5rem; text-align: center; }
:is(th button, .title):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
</style>
