<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useWorkspace } from '../../../composables/useWorkspace'
import { useUi } from '../../../composables/useUi'
import Avatars from '../Avatars.vue'
import AppSelect from '../AppSelect.vue'
import AppIcon from '../AppIcon.vue'

const props = defineProps({ tasks: { type: Array, required: true } })
const { STATUSES, PRIORITIES, code, updateTask, isOverdue, peopleOf, rolesOf } = useWorkspace()
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

const pop = ref(null)
const popEl = ref(null)
const newTag = ref('')
const popTask = computed(() => props.tasks.find((t) => t.id === pop.value?.id))
const popRoles = computed(() => (popTask.value?.projectId ? rolesOf(popTask.value.projectId) : []))
const tagSuggestions = computed(() => {
  const typed = newTag.value.trim().toLowerCase()
  const used = popTask.value?.tags || []
  return [...new Set(props.tasks.flatMap((t) => t.tags))].filter((t) => !used.includes(t) && t.includes(typed)).sort()
})
async function togglePop(kind, t, e) {
  if (pop.value?.kind === kind && pop.value.id === t.id) return closePop()
  const btn = e.currentTarget
  const r = btn.getBoundingClientRect()
  const below = innerHeight - r.bottom > 300 || r.top < 300
  pop.value = {
    kind, id: t.id, btn, target: btn.closest('.app') || 'body',
    style: { left: `${Math.max(8, Math.min(r.left, innerWidth - 248))}px`, ...(below ? { top: `${r.bottom + 4}px` } : { bottom: `${innerHeight - r.top + 4}px` }) },
  }
  newTag.value = ''
  await nextTick()
  popEl.value?.querySelector('input, button')?.focus()
}
function closePop(focus = false) {
  if (focus) pop.value?.btn.focus()
  pop.value = null
}
function toggleMember(id) {
  const a = popTask.value.assignees
  updateTask(popTask.value, { assignees: a.includes(id) ? a.filter((x) => x !== id) : [...a, id] })
}
const roleOn = (r) => r.ids.every((id) => popTask.value.assignees.includes(id))
function toggleRole(r) {
  const a = popTask.value.assignees
  updateTask(popTask.value, { assignees: roleOn(r) ? a.filter((id) => !r.ids.includes(id)) : [...new Set([...a, ...r.ids])] })
}
function addTag(value = newTag.value) {
  const tag = value.trim().toLowerCase()
  if (tag && !popTask.value.tags.includes(tag)) updateTask(popTask.value, { tags: [...popTask.value.tags, tag] })
  newTag.value = ''
}
const removeTag = (tag) => updateTask(popTask.value, { tags: popTask.value.tags.filter((x) => x !== tag) })
const outside = (e) => { if (!pop.value?.btn.contains(e.target) && !popEl.value?.contains(e.target)) closePop() }
const onScroll = (e) => { if (!(e.target instanceof Node && popEl.value?.contains(e.target))) closePop() }
const onResize = () => closePop()
watch(() => !!pop.value, (open) => {
  const method = open ? 'addEventListener' : 'removeEventListener'
  document[method]('pointerdown', outside, true)
  window[method]('scroll', onScroll, true)
  window[method]('resize', onResize)
})
watch(popTask, (t) => { if (!t) pop.value = null })
onBeforeUnmount(() => { pop.value = null })
</script>

<template>
  <div class="wrap">
    <table>
      <thead>
        <tr>
          <th v-for="[k, label] in COLS" :key="k" :aria-sort="sortBy === k ? (asc ? 'ascending' : 'descending') : 'none'">
            <button type="button" @click="sort(k)">{{ label }} <AppIcon v-if="sortBy === k" name="chevron" :size="12" :style="asc ? { transform: 'rotate(180deg)' } : null" /></button>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="t in rows" :key="t.id">
          <td class="muted">{{ code(t) }}</td>
          <td><button type="button" class="title" @click="openTask(t)">{{ t.title }}</button></td>
          <td><AppSelect :model-value="t.status" :options="statusOptions" size="sm" aria-label="Status" @change="(v) => updateTask(t, { status: v })" /></td>
          <td><AppSelect :model-value="t.priority" :options="priorityOptions" size="sm" aria-label="Prioridade" @change="(v) => updateTask(t, { priority: v })" /></td>
          <td>
            <button type="button" class="pick" aria-haspopup="menu" :aria-expanded="pop?.kind === 'people' && pop.id === t.id" :aria-label="`Responsáveis de ${t.title}`" @click="togglePop('people', t, $event)">
              <Avatars v-if="t.assignees.length" :ids="t.assignees" /><AppIcon v-else name="user" :size="15" class="muted" />
            </button>
          </td>
          <td><input type="date" :value="t.due || ''" :class="{ late: isOverdue(t) }" aria-label="Prazo" @change="updateTask(t, { due: $event.target.value || null })" /></td>
          <td>
            <button type="button" class="pick pick--tags" aria-haspopup="dialog" :aria-expanded="pop?.kind === 'tags' && pop.id === t.id" :aria-label="`Etiquetas de ${t.title}`" @click="togglePop('tags', t, $event)">
              <template v-if="t.tags.length"><span v-for="tag in t.tags" :key="tag" class="etq">{{ tag }}</span></template>
              <span v-else class="muted">—</span>
            </button>
          </td>
        </tr>
        <tr v-if="!rows.length"><td :colspan="COLS.length" class="muted empty">Nenhuma tarefa.</td></tr>
      </tbody>
    </table>
    <Teleport v-if="pop && popTask" :to="pop.target">
      <div ref="popEl" class="pop" :style="pop.style" :role="pop.kind === 'people' ? 'menu' : 'dialog'" :aria-label="pop.kind === 'people' ? 'Responsáveis' : 'Etiquetas'" @keydown.esc.stop.prevent="closePop(true)">
        <template v-if="pop.kind === 'people'">
          <template v-if="popRoles.length">
            <span class="pop__label">Por cargo</span>
            <button v-for="r in popRoles" :key="r.title" type="button" role="menuitemcheckbox" :aria-checked="roleOn(r)" @click="toggleRole(r)">
              <AppIcon name="user" :size="13" />{{ r.title }}<small>{{ r.ids.length }}</small><AppIcon v-if="roleOn(r)" name="check" :size="13" class="tick" />
            </button>
            <span class="pop__label">Pessoas</span>
          </template>
          <button v-for="m in peopleOf(popTask.projectId)" :key="m.id" type="button" role="menuitemcheckbox" :aria-checked="popTask.assignees.includes(m.id)" @click="toggleMember(m.id)">
            <Avatars :ids="[m.id]" :size="20" /><span class="pop__name">{{ m.name }}</span><AppIcon v-if="popTask.assignees.includes(m.id)" name="check" :size="13" class="tick" />
          </button>
        </template>
        <template v-else>
          <input v-model="newTag" type="text" placeholder="Adicionar etiqueta" aria-label="Nova etiqueta" maxlength="40" @keydown.enter.prevent="addTag()" />
          <div v-if="popTask.tags.length" class="pop__tags">
            <span v-for="tag in popTask.tags" :key="tag" class="etq">{{ tag }}<button type="button" :aria-label="`Remover ${tag}`" @click="removeTag(tag)"><AppIcon name="close" :size="11" /></button></span>
          </div>
          <button v-for="tag in tagSuggestions" :key="tag" type="button" @click="addTag(tag)">{{ tag }}</button>
        </template>
      </div>
    </Teleport>
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
.late { color: var(--danger, #ff8a80); }
.muted { color: var(--muted); }
.empty { padding: 1.5rem; text-align: center; }
.pick { display: inline-flex; align-items: center; gap: 0.25rem; min-width: 2rem; min-height: 28px; max-width: 14rem; padding: 0 0.35rem; overflow: hidden; border: 1px solid transparent; border-radius: 5px; background: none; font: inherit; color: var(--text); cursor: pointer; }
.pick:hover, .pick[aria-expanded='true'] { border-color: var(--line-strong); }
.etq { display: inline-flex; align-items: center; gap: 0.2rem; padding: 0.1rem 0.4rem; border-radius: 4px; background: var(--surface-2); font-size: 12px; color: var(--text); }
.etq button { display: inline-flex; padding: 0; border: 0; background: none; color: var(--muted); cursor: pointer; }
.pop { position: fixed; z-index: 1000; display: flex; flex-direction: column; width: 240px; max-height: 290px; padding: 0.3rem; overflow-y: auto; border: 1px solid var(--line-strong); border-radius: 8px; background: var(--surface); box-shadow: 0 12px 32px rgb(0 0 0 / 0.35); font-size: 13px; color: var(--text); }
.pop > button { display: flex; flex-shrink: 0; align-items: center; gap: 0.5rem; padding: 0.4rem 0.5rem; border: 0; border-radius: 5px; background: none; font: inherit; color: var(--text); text-align: left; cursor: pointer; }
.pop > button:hover { background: var(--surface-2); }
.pop small { font-size: 11.5px; color: var(--muted); }
.pop input { flex-shrink: 0; height: 30px; margin-bottom: 0.25rem; border-color: var(--line-strong); }
.pop__label { padding: 0.4rem 0.5rem 0.2rem; font-size: 11px; font-weight: 600; color: var(--muted); }
.pop__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pop__tags { display: flex; flex-wrap: wrap; gap: 0.25rem; padding: 0.25rem; }
.tick { margin-left: auto; color: var(--accent-soft); }
:is(th button, .title, .pick, .pop button):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
</style>
