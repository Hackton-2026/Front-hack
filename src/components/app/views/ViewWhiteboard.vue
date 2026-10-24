<script setup>
// Whiteboard: notas soltas que dá para arrastar. Ficam salvas na própria visão (config.notes).
import { ref } from 'vue'
import { useWorkspace } from '../../../composables/useWorkspace'

const props = defineProps({ view: { type: Object, required: true } })
const { updateItem, createTask } = useWorkspace()
const COLORS = ['#f2c46d', '#fba45c', '#7fc47a', '#7cc4f2', '#e9a0d8']
const notes = ref(JSON.parse(JSON.stringify(props.view.config?.notes || []))) // cópia: structuredClone não aceita o proxy do Vue
let timer
const save = () => { clearTimeout(timer); timer = setTimeout(() => updateItem('view', props.view, { config: { ...props.view.config, notes: notes.value } }), 500) }
function add() {
  notes.value.push({ id: Date.now().toString(36), text: '', x: 20 + (notes.value.length % 6) * 30, y: 20 + (notes.value.length % 6) * 30, color: COLORS[notes.value.length % COLORS.length] })
  save()
}
const remove = (n) => { notes.value.splice(notes.value.indexOf(n), 1); save() }
const recolor = (n) => { n.color = COLORS[(COLORS.indexOf(n.color) + 1) % COLORS.length]; save() }
function toTask(n) {
  if (!n.text.trim()) return
  createTask({ projectId: props.view.project, title: n.text.trim().split('\n')[0].slice(0, 200), description: n.text.trim() })
  remove(n)
}
function drag(n, e) {
  if (e.target.closest('textarea, button')) return
  const sx = e.clientX - n.x, sy = e.clientY - n.y
  const move = (ev) => { n.x = Math.max(0, ev.clientX - sx); n.y = Math.max(0, ev.clientY - sy) }
  const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); save() }
  addEventListener('pointermove', move)
  addEventListener('pointerup', up)
}
</script>

<template>
  <div class="wb">
    <div class="bar"><button type="button" class="add" @click="add">+ Nota</button><small>Arraste as notas. "Virar tarefa" manda a nota para o projeto.</small></div>
    <div class="canvas">
      <div v-for="n in notes" :key="n.id" class="note" :style="{ left: `${n.x}px`, top: `${n.y}px`, background: n.color }" @pointerdown="drag(n, $event)">
        <textarea v-model="n.text" rows="4" placeholder="Escreva uma ideia…" aria-label="Texto da nota" @input="save" />
        <div class="actions">
          <button type="button" title="Trocar cor" aria-label="Trocar cor" @click="recolor(n)">●</button>
          <button type="button" title="Virar tarefa" @click="toTask(n)">→ tarefa</button>
          <button type="button" title="Apagar nota" aria-label="Apagar nota" @click="remove(n)">×</button>
        </div>
      </div>
      <p v-if="!notes.length" class="empty">Quadro vazio. Clique em "+ Nota" para começar.</p>
    </div>
  </div>
</template>

<style scoped>
.wb { display: flex; flex-direction: column; gap: 0.6rem; }
.bar { display: flex; align-items: center; gap: 0.75rem; }
.bar small { color: var(--muted); }
.add { height: 30px; padding: 0 0.8rem; border: 1px solid var(--accent); border-radius: 6px; background: color-mix(in srgb, var(--accent) 14%, transparent); color: var(--text); cursor: pointer; }
.canvas { position: relative; min-height: 32rem; overflow: auto; border: 1px dashed var(--line-strong); border-radius: 10px; background-image: radial-gradient(var(--line) 1px, transparent 1px); background-size: 18px 18px; }
.note { position: absolute; display: flex; flex-direction: column; width: 11rem; padding: 0.5rem; border-radius: 8px; box-shadow: 0 6px 18px rgb(0 0 0 / 0.3); cursor: grab; touch-action: none; }
.note:active { cursor: grabbing; }
textarea { border: 0; background: none; font: 500 13px/1.4 'Geist', system-ui, sans-serif; color: #1c1a17; resize: none; outline: none; }
.actions { display: flex; justify-content: flex-end; gap: 0.25rem; }
.actions button { padding: 0.1rem 0.35rem; border: 0; border-radius: 4px; background: rgb(0 0 0 / 0.08); font-size: 11.5px; color: #1c1a17; cursor: pointer; }
.empty { position: absolute; inset: 0; display: grid; place-items: center; margin: 0; color: var(--muted); pointer-events: none; }
:is(.add, .actions button):focus-visible { outline: 2px solid var(--accent-soft); }
</style>
