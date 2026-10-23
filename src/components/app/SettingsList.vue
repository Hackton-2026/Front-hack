<script setup>
// Lista com criar, editar e apagar ligada a um endpoint da API (times, clientes, webhooks, tokens...).
// `fields`: [{ key, label, type, options?, required?, data? }]. data: true = o campo vai dentro de `data` (WorkspaceItem).
// Tipos: text, email, url, date, textarea, select, task, hours (a API guarda minutos), members, multi, check; secret e readonly só aparecem na lista.
import { computed, onMounted, reactive, ref } from 'vue'
import { api } from '../../services/api'
import { useWorkspace } from '../../composables/useWorkspace'

const props = defineProps({
  path: { type: String, required: true }, // ex.: /api/items/
  query: { type: String, default: '' }, // ex.: ?kind=customer
  extra: { type: Object, default: () => ({}) }, // vai junto no POST (ex.: { kind: 'customer' })
  fields: { type: Array, required: true },
  noun: { type: String, default: 'item' },
  canWrite: { type: Boolean, default: true },
  editable: { type: Boolean, default: true },
})

const { state, member } = useWorkspace()
const rows = ref([])
const error = ref('')
const loading = ref(true)
const editing = ref(null) // id da linha em edição; null = criando
const revealed = ref('') // token recém-criado: aparece uma única vez
const form = reactive({})
const inputs = computed(() => props.fields.filter((f) => !['secret', 'readonly'].includes(f.type)))

const get = (row, f) => (f.data ? row.data?.[f.key] : row[f.key])
function blank() {
  for (const f of inputs.value) form[f.key] = ['members', 'multi'].includes(f.type) ? [] : f.type === 'check' ? true : ''
}
function show(row, f) {
  const v = get(row, f)
  if (v === '' || v == null || (Array.isArray(v) && !v.length)) return '—'
  if (f.type === 'select') return f.options.find((o) => o.value === v)?.label ?? v
  if (f.type === 'hours') return `${Math.round((v / 60) * 100) / 100}h`
  if (f.type === 'date') return new Date(String(v).slice(0, 10) + 'T12:00').toLocaleDateString('pt-BR')
  if (f.type === 'members') return v.map((id) => member(id)?.name || '?').join(', ')
  if (f.type === 'multi') return v.map((x) => f.options.find((o) => o.value === x)?.label ?? x).join(', ')
  if (f.type === 'check') return v ? 'Sim' : 'Não'
  if (f.type === 'secret') return `${v.slice(0, 8)}…`
  if (f.type === 'task') return state.tasks.find((t) => t.id === v)?.title || `#${v}`
  return v
}

async function fetchRows() {
  loading.value = true
  try {
    rows.value = await api(props.path + props.query)
    error.value = ''
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
blank() // antes do primeiro render: os chips leem form[key].includes
onMounted(fetchRows)

function edit(row) {
  editing.value = row.id
  for (const f of inputs.value) {
    const v = get(row, f)
    form[f.key] = f.type === 'hours' ? v / 60 : f.type === 'date' ? String(v ?? '').slice(0, 10) : Array.isArray(v) ? [...v] : v ?? ''
  }
}
function cancel() {
  editing.value = null
  blank()
}
function body() {
  const out = { ...props.extra }
  const data = {}
  for (const f of inputs.value) {
    let v = form[f.key]
    if (f.type === 'hours') v = Math.round(Number(v) * 60)
    if (f.type === 'date' && !v) v = null
    if ((v === '' || v === null) && !f.data) continue // opcional vazio: o backend usa o padrão do campo
    ;(f.data ? data : out)[f.key] = v
  }
  if (props.fields.some((f) => f.data)) {
    const row = rows.value.find((r) => r.id === editing.value)
    out.data = { ...(row?.data || {}), ...data }
  }
  return out
}
async function submit() {
  error.value = ''
  try {
    if (editing.value) {
      const updated = await api(`${props.path}${editing.value}/`, { method: 'PATCH', body: body() })
      Object.assign(rows.value.find((r) => r.id === editing.value), updated)
    } else {
      const created = await api(props.path, { method: 'POST', body: body() })
      revealed.value = created.token || ''
      rows.value.unshift(created)
    }
    cancel()
  } catch (e) {
    error.value = e.data && typeof e.data === 'object' && !e.data.detail ? Object.values(e.data).flat().join(' ') : e.message
  }
}
async function remove(row) {
  if (!confirm(`Apagar este ${props.noun}?`)) return
  try {
    await api(`${props.path}${row.id}/`, { method: 'DELETE' })
    rows.value = rows.value.filter((r) => r !== row)
  } catch (e) {
    error.value = e.message
  }
}
const toggleIn = (list, value) => (list.includes(value) ? list.splice(list.indexOf(value), 1) : list.push(value))
const copy = (text) => navigator.clipboard?.writeText(text)

defineExpose({ rows })
</script>

<template>
  <div class="sl">
    <p v-if="revealed" class="sl__token" role="status">
      Copie agora, ele não aparece de novo: <code>{{ revealed }}</code>
      <button type="button" class="link" @click="copy(revealed)">Copiar</button>
      <button type="button" class="link" @click="revealed = ''">Ok</button>
    </p>

    <form v-if="canWrite" class="sl__form" @submit.prevent="submit">
      <label v-for="f in inputs" :key="f.key" :class="{ wide: ['textarea', 'members', 'multi'].includes(f.type) }">
        {{ f.label }}
        <textarea v-if="f.type === 'textarea'" v-model="form[f.key]" rows="2" :required="f.required" />
        <select v-else-if="f.type === 'select'" v-model="form[f.key]" :required="f.required">
          <option value="" disabled>Escolher</option>
          <option v-for="o in f.options" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
        <select v-else-if="f.type === 'task'" v-model="form[f.key]" :required="f.required">
          <option value="" disabled>Escolher tarefa</option>
          <option v-for="t in state.tasks.filter((x) => !x.draft)" :key="t.id" :value="t.id">{{ t.code ? `${t.code} · ` : '' }}{{ t.title }}</option>
        </select>
        <span v-else-if="f.type === 'members' || f.type === 'multi'" class="sl__chips">
          <button v-for="o in f.type === 'members' ? state.members.map((m) => ({ value: m.id, label: m.name })) : f.options" :key="o.value" type="button" :aria-pressed="form[f.key].includes(o.value)" @click="toggleIn(form[f.key], o.value)">{{ o.label }}</button>
        </span>
        <input v-else-if="f.type === 'check'" v-model="form[f.key]" type="checkbox" class="sl__check" />
        <input v-else-if="f.type === 'hours'" v-model="form[f.key]" type="number" min="0.25" max="24" step="0.25" :required="f.required" />
        <input v-else v-model="form[f.key]" :type="f.type || 'text'" :required="f.required" />
      </label>
      <div class="sl__actions">
        <button type="submit" class="sl__save">{{ editing ? 'Salvar' : `Adicionar ${noun}` }}</button>
        <button v-if="editing" type="button" class="link" @click="cancel">Cancelar</button>
      </div>
    </form>

    <p v-if="error" class="sl__error" role="alert">{{ error }}</p>
    <p v-if="loading" class="hint">Carregando…</p>
    <p v-else-if="!rows.length" class="hint">Nenhum {{ noun }} ainda.</p>
    <div v-else class="sl__table" role="table">
      <div class="sl__row sl__head" role="row">
        <span v-for="f in fields" :key="f.key" role="columnheader">{{ f.label }}</span><span v-if="canWrite" />
      </div>
      <div v-for="row in rows" :key="row.id" class="sl__row" :class="{ on: editing === row.id }" role="row">
        <span v-for="f in fields" :key="f.key" role="cell">
          {{ show(row, f) }}
          <button v-if="f.type === 'secret'" type="button" class="link" @click="copy(get(row, f))">copiar</button>
        </span>
        <span v-if="canWrite" class="sl__row-actions" role="cell">
          <button v-if="editable" type="button" class="link" @click="edit(row)">Editar</button>
          <button type="button" class="link rm" @click="remove(row)">Apagar</button>
        </span>
      </div>
    </div>
    <slot name="footer" :rows="rows" />
  </div>
</template>

<style scoped>
.sl { display: flex; flex-direction: column; gap: 0.75rem; }
.sl__form { display: grid; grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr)); gap: 0.6rem 0.8rem; align-items: end; padding: 0.75rem; border: 1px solid var(--line); border-radius: 8px; }
.sl__form label { display: flex; flex-direction: column; gap: 0.3rem; min-width: 0; font-size: 12px; font-weight: 500; color: var(--muted); }
.sl__form label.wide { grid-column: 1 / -1; }
.sl__form :is(input:not(.sl__check), select, textarea) { min-height: 32px; padding: 0.35rem 0.6rem; border: 1px solid var(--line-strong); border-radius: 6px; background: var(--bg); font: inherit; font-size: 13.5px; color: var(--text); outline: none; }
.sl__form :is(input, select, textarea):focus { border-color: var(--accent); }
.sl__check { width: 16px; height: 16px; accent-color: var(--accent); }
.sl__chips { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.sl__chips button { padding: 0.2rem 0.55rem; border: 1px solid var(--line-strong); border-radius: 999px; background: none; font-size: 12.5px; color: var(--muted); cursor: pointer; }
.sl__chips button[aria-pressed='true'] { border-color: var(--accent); color: var(--text); background: color-mix(in srgb, var(--accent) 18%, transparent); }
.sl__actions { display: flex; align-items: center; gap: 0.75rem; }
.sl__save { height: 32px; padding: 0 0.85rem; border: 0; border-radius: 6px; background: var(--accent); font-size: 13px; font-weight: 500; color: #fff; cursor: pointer; }
.sl__table { display: flex; flex-direction: column; overflow-x: auto; font-size: 13px; }
.sl__row { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(7rem, 1fr); gap: 0.75rem; align-items: center; padding: 0.45rem 0.25rem; border-top: 1px solid var(--line); }
.sl__row > span { min-width: 0; overflow-wrap: anywhere; }
.sl__row.on { background: var(--surface-2); }
.sl__head { border-top: 0; font-size: 11.5px; font-weight: 600; color: var(--muted); }
.sl__row-actions { display: flex; justify-content: flex-end; gap: 0.75rem; }
.sl__token { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem; margin: 0; padding: 0.6rem 0.75rem; border: 1px solid var(--accent); border-radius: 8px; font-size: 13px; }
.sl__token code { padding: 0.15rem 0.4rem; border-radius: 4px; background: var(--bg); font-size: 12px; overflow-wrap: anywhere; }
.sl__error { margin: 0; font-size: 12.5px; color: #ff8a80; }
.hint { margin: 0; font-size: 12px; color: var(--muted); }
.link { padding: 0; border: 0; background: none; font-size: 12.5px; color: var(--accent-soft); cursor: pointer; }
.rm { color: var(--muted); }
.rm:hover { color: #ff8a80; }
:is(.link, .sl__save, .sl__chips button):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
</style>
