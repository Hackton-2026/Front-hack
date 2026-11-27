import { computed, ref, watch } from 'vue'

export const STEPS = [
  { id: 'project', title: 'Criar ou abrir um projeto', hint: 'Use o projeto de exemplo ou crie um espaço para sua equipe ou cliente.' },
  { id: 'task', title: 'Criar sua primeira tarefa', hint: 'Dê um título, responsável e prazo — ou aperte C de qualquer tela.' },
  { id: 'view', title: 'Escolher sua visualização', hint: 'Alterne entre Lista, Kanban, Calendário ou Gantt.' },
  { id: 'invite', title: 'Convidar equipe ou explorar a IA', hint: 'Convide alguém para um projeto ou peça um resumo na Novexo IA.' },
]

const KEY = 'novexo:onboarding'
const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}
const save = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { }
}

const done = ref(read(KEY, []))
watch(done, (v) => save(KEY, v), { deep: true })

const NOTES_KEY = 'novexo:notes'
const notes = ref(read(NOTES_KEY, []))
let notesTimer
watch(notes, (v) => {
  clearTimeout(notesTimer)
  notesTimer = setTimeout(() => save(NOTES_KEY, v), 300)
}, { deep: true })

export function useOnboarding() {
  const isDone = (id) => done.value.includes(id)
  const toggle = (id) => {
    done.value = isDone(id) ? done.value.filter((d) => d !== id) : [...done.value, id]
  }
  const complete = (id) => {
    const mapped = id === 'ai' ? 'invite' : id
    if (!isDone(mapped)) done.value = [...done.value, mapped]
  }
  const count = computed(() => STEPS.filter((s) => done.value.includes(s.id)).length)
  return { STEPS, isDone, toggle, complete, count, total: STEPS.length }
}

export function useNotes() {
  const add = (color) => {
    const note = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text: '', color, at: new Date().toISOString() }
    notes.value = [note, ...notes.value]
    return note
  }
  const remove = (id) => { notes.value = notes.value.filter((n) => n.id !== id) }
  return { notes, add, remove }
}
