<script setup>
// Formulário: um pedido preenchido aqui vira tarefa no projeto
import { reactive, ref } from 'vue'
import { useWorkspace } from '../../../composables/useWorkspace'

const props = defineProps({ projectId: { type: [String, Number], required: true }, defaults: { type: Object, default: () => ({}) } })
const { state, PRIORITIES, createTask } = useWorkspace()
const blank = () => ({ title: '', description: '', priority: '', due: '', assignee: '' })
const form = reactive(blank())
const sent = ref([])
function submit() {
  const title = form.title.trim()
  if (!title) return
  createTask({ projectId: props.projectId, ...props.defaults, title, description: form.description.trim(), priority: form.priority, due: form.due || null, assignees: form.assignee ? [Number(form.assignee)] : [] })
  sent.value.unshift(title)
  Object.assign(form, blank())
}
</script>

<template>
  <div class="form-view">
    <form class="card" @submit.prevent="submit">
      <h2>Novo pedido</h2>
      <p class="muted">Preencha e o pedido entra como tarefa neste projeto.</p>
      <label>O que precisa ser feito? *<input v-model="form.title" required placeholder="Ex.: Corrigir o login no celular" /></label>
      <label>Detalhes<textarea v-model="form.description" rows="4" placeholder="Contexto, links, passos para reproduzir…" /></label>
      <div class="row">
        <label>Prioridade<select v-model="form.priority"><option value="">Sem prioridade</option><option v-for="p in PRIORITIES" :key="p.id" :value="p.id">{{ p.name }}</option></select></label>
        <label>Para quando<input v-model="form.due" type="date" /></label>
        <label>Responsável<select v-model="form.assignee"><option value="">Ninguém ainda</option><option v-for="m in state.members" :key="m.id" :value="m.id">{{ m.name }}</option></select></label>
      </div>
      <button type="submit" class="send">Enviar pedido</button>
      <p v-if="sent.length" class="ok" role="status">Enviado: {{ sent[0] }}{{ sent.length > 1 ? ` (+${sent.length - 1} nesta sessão)` : '' }}</p>
    </form>
  </div>
</template>

<style scoped>
.form-view { display: flex; justify-content: center; }
.card { display: flex; flex-direction: column; gap: 0.8rem; width: 100%; max-width: 36rem; padding: 1.4rem; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); }
h2 { margin: 0; font-size: 1.15rem; color: var(--text); }
.muted { margin: 0; font-size: 12.5px; color: var(--muted); }
label { display: flex; flex-direction: column; gap: 0.3rem; font-size: 12px; font-weight: 500; color: var(--muted); }
.row { display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: 0.7rem; }
input, select, textarea { min-height: 34px; padding: 0.4rem 0.6rem; border: 1px solid var(--line-strong); border-radius: 6px; background: var(--bg); font: inherit; font-size: 13.5px; color: var(--text); outline: none; }
:is(input, select, textarea):focus { border-color: var(--accent); }
.send { align-self: flex-start; height: 34px; padding: 0 1rem; border: 0; border-radius: 7px; background: var(--accent); font-weight: 600; color: #fff; cursor: pointer; }
.send:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
.ok { margin: 0; font-size: 12.5px; color: var(--accent-soft); }
</style>
