<script setup>
import { computed, ref, watch } from 'vue'
import { useUi } from '../../composables/useUi'
import { creditedTo, dayKey, doneTasks } from '../../utils/completions'

// Em Membros, só para o dono do projeto: todas as tarefas concluídas, com quem concluiu, quando e se foi no prazo.
const PAGE = 10
const props = defineProps({ tasks: { type: Array, required: true }, members: { type: Array, required: true } })
const { openTask } = useUi()

const tab = ref('all')
const q = ref('')
const page = ref(0)
const all = computed(() => doneTasks(props.tasks).sort((a, b) => b.completedAt.localeCompare(a.completedAt)))
const count = (id) => all.value.filter((t) => creditedTo(t).includes(id)).length
const tabs = computed(() => [{ id: 'all', name: 'Todas', n: all.value.length }, ...props.members.map((m) => ({ id: m.id, name: m.name.split(' ')[0], n: count(m.id) }))])
const rows = computed(() => {
  const term = q.value.trim().toLowerCase()
  return all.value.filter((t) => (tab.value === 'all' || creditedTo(t).includes(tab.value))
    && (!term || `${t.code} ${t.title}`.toLowerCase().includes(term)))
})
const pages = computed(() => Math.max(1, Math.ceil(rows.value.length / PAGE)))
const shown = computed(() => rows.value.slice(page.value * PAGE, (page.value + 1) * PAGE))
watch([tab, q], () => (page.value = 0))

const byId = computed(() => Object.fromEntries(props.members.map((m) => [m.id, m])))
const initials = (name) => (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
const when = (iso) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
const hour = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
// prazo é o dia inteiro: concluir no próprio dia ainda conta como no prazo
function deadline(t) {
  if (!t.due) return { cls: 'none', text: 'Sem prazo' }
  const late = Math.round((new Date(`${dayKey(t.completedAt)}T12:00`) - new Date(`${t.due}T12:00`)) / 86400000)
  return late > 0 ? { cls: 'late', text: `${late} ${late === 1 ? 'dia' : 'dias'} atrasada` } : { cls: 'ok', text: 'No prazo' }
}
</script>

<template>
  <section class="dt card" aria-labelledby="dt-title">
    <div class="dt__head">
      <div>
        <h2 id="dt-title">Tarefas concluídas <span class="n">{{ all.length }}</span></h2>
        <p class="hint">Só você, dono do projeto, vê esta lista.</p>
      </div>
      <label class="dt__search"><i class="fi-rr-search" aria-hidden="true" /><span class="sr-only">Buscar tarefa</span><input v-model="q" type="search" placeholder="Buscar tarefa" /></label>
    </div>

    <div class="dt__tabs" role="tablist" aria-label="Filtrar por pessoa">
      <button v-for="t in tabs" :key="t.id" type="button" role="tab" :aria-selected="tab === t.id" @click="tab = t.id">{{ t.name }}<span>{{ t.n }}</span></button>
    </div>

    <div class="dt__scroll">
      <table>
        <thead>
          <tr><th scope="col">Tarefa</th><th scope="col">Quem concluiu</th><th scope="col">Concluída</th><th scope="col">Prazo</th></tr>
        </thead>
        <tbody>
          <tr v-for="t in shown" :key="t.id" tabindex="0" @click="openTask(t)" @keydown.enter="openTask(t)">
            <td class="task"><strong>{{ t.title }}</strong><small>{{ t.code }}</small></td>
            <td>
              <span class="people">
                <span v-for="id in creditedTo(t).slice(0, 3)" :key="id" class="ava" :title="byId[id]?.name" :style="{ background: byId[id]?.color }"><img v-if="byId[id]?.avatar" referrerpolicy="no-referrer" :src="byId[id].avatar" alt="" /><template v-else>{{ initials(byId[id]?.name) }}</template></span>
                <span class="who">{{ creditedTo(t).map((id) => byId[id]?.name.split(' ')[0] || 'Ex-membro').join(', ') }}</span>
              </span>
            </td>
            <td class="date">{{ when(t.completedAt) }}<small>{{ hour(t.completedAt) }}</small></td>
            <td><span class="chip" :class="deadline(t).cls"><i />{{ deadline(t).text }}</span></td>
          </tr>
        </tbody>
      </table>
      <p v-if="!rows.length" class="hint empty">{{ q ? 'Nenhuma tarefa concluída com esse nome.' : 'Nenhuma tarefa concluída ainda.' }}</p>
    </div>

    <div v-if="rows.length > PAGE" class="dt__foot">
      <span class="hint">Mostrando {{ page * PAGE + 1 }}–{{ Math.min((page + 1) * PAGE, rows.length) }} de {{ rows.length }}</span>
      <span class="pager">
        <button type="button" class="pg-btn ghost" :disabled="page === 0" @click="page--">Anterior</button>
        <button type="button" class="pg-btn ghost" :disabled="page >= pages - 1" @click="page++">Próxima</button>
      </span>
    </div>
  </section>
</template>

<style scoped>
.card { display: flex; flex-direction: column; gap: 0.75rem; padding: 1.1rem 1.2rem; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
h2 { margin: 0; font-size: 14px; font-weight: 600; color: var(--text); }
.n { margin-left: 0.35rem; font-size: 12px; font-weight: 500; color: var(--muted); }
.hint { margin: 0.15rem 0 0; font-size: 12.5px; color: var(--muted); }
.dt__head { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 0.6rem; }
.dt__search { display: flex; align-items: center; gap: 0.4rem; height: 30px; padding: 0 0.6rem; border: 1px solid var(--line); border-radius: 6px; background: var(--bg); font-size: 13px; color: var(--muted); }
.dt__search:focus-within { border-color: var(--accent); }
.dt__search input { width: 10rem; border: 0; background: none; font: inherit; color: var(--text); outline: none; }
.dt__tabs { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.dt__tabs button { display: inline-flex; align-items: center; gap: 0.35rem; height: 26px; padding: 0 0.6rem; border: 1px solid transparent; border-radius: 6px; background: none; font-size: 12.5px; color: var(--muted); cursor: pointer; }
.dt__tabs button span { font-variant-numeric: tabular-nums; opacity: 0.7; }
.dt__tabs button:hover { color: var(--text); }
.dt__tabs button[aria-selected='true'] { border-color: var(--line-strong); background: var(--surface-2); color: var(--text); }
.dt__scroll { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { padding: 0.45rem 0.5rem; border-bottom: 1px solid var(--line); font-size: 12px; font-weight: 500; color: var(--muted); text-align: left; white-space: nowrap; }
td { padding: 0.55rem 0.5rem; border-bottom: 1px solid var(--line); vertical-align: middle; }
tbody tr { cursor: pointer; transition: background 0.15s ease; }
tbody tr:hover { background: var(--surface-2); }
tbody tr:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: -2px; }
.task { max-width: 18rem; }
.task strong, .task small, .date small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.task strong { font-weight: 500; }
.task small, .date small { font-size: 11.5px; color: var(--muted); }
.date { white-space: nowrap; }
.people { display: flex; align-items: center; gap: 0.45rem; min-width: 0; }
.ava { display: grid; place-items: center; flex-shrink: 0; width: 22px; height: 22px; margin-right: -0.55rem; overflow: hidden; border: 2px solid var(--surface); border-radius: 50%; font: 700 9px/1 'Lexend', system-ui, sans-serif; color: #000; }
.ava:last-of-type { margin-right: 0; }
.ava img { width: 100%; height: 100%; object-fit: cover; }
.who { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--muted); }
.chip { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.15rem 0.5rem; border: 1px solid var(--line-strong); border-radius: 999px; font-size: 12px; white-space: nowrap; }
.chip i { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.chip.ok { color: var(--success, #7fc47a); }
.chip.late { color: #ffb36b; }
.chip.none { color: var(--muted); }
.empty { padding: 1rem 0; text-align: center; }
.dt__foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem; }
.pager { display: flex; gap: 0.4rem; }
.pg-btn.ghost { background: none; }
.pg-btn:disabled { opacity: 0.5; cursor: default; }
:is(.dt__tabs button):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
</style>
