import { computed, ref, watch } from 'vue'

// Checklist de "Começar" (o Get started do Plane). Estado global, salvo no navegador.
// shortcut: só no front; quando a API existir, guardar por usuário no backend
export const STEPS = [
  { id: 'project', title: 'Criar um projeto', hint: 'Um espaço para as tarefas de uma área ou cliente.' },
  { id: 'task', title: 'Criar uma tarefa', hint: 'Dê um título, um responsável e um prazo.' },
  { id: 'invite', title: 'Convidar alguém para um projeto', hint: 'Quem entra vê só aquele projeto: tarefas, páginas e chat.' },
  { id: 'doc', title: 'Escrever um documento', hint: 'Specs e atas ao lado das tarefas.' },
  { id: 'ai', title: 'Conversar com a Novexo IA', hint: 'Peça um resumo do que está atrasado.' },
  { id: 'integration', title: 'Conectar uma integração', hint: 'GitHub, Notion, Discord e outras.' },
  { id: 'view', title: 'Criar uma visualização', hint: 'Lista, quadro ou calendário com seus filtros.' },
  { id: 'sticky', title: 'Criar uma nota', hint: 'Anote uma ideia rápida no botão de notas.' },
]

const KEY = 'novexo:onboarding'
const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}
const save = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* modo privado: segue só na memória */ }
}

const done = ref(read(KEY, []))
watch(done, (v) => save(KEY, v), { deep: true })

// Notas rápidas (os Stickies do Plane)
const NOTES_KEY = 'novexo:notes'
const notes = ref(read(NOTES_KEY, []))
watch(notes, (v) => save(NOTES_KEY, v), { deep: true })

export function useOnboarding() {
  const isDone = (id) => done.value.includes(id)
  const toggle = (id) => {
    done.value = isDone(id) ? done.value.filter((d) => d !== id) : [...done.value, id]
  }
  const complete = (id) => { if (!isDone(id)) done.value = [...done.value, id] }
  const count = computed(() => STEPS.filter((s) => done.value.includes(s.id)).length)
  return { STEPS, isDone, toggle, complete, count, total: STEPS.length }
}

export function useNotes() {
  const add = (color) => {
    const note = { id: Date.now().toString(36), text: '', color, at: new Date().toISOString() }
    notes.value = [note, ...notes.value]
    useOnboarding().complete('sticky')
    return note
  }
  const remove = (id) => { notes.value = notes.value.filter((n) => n.id !== id) }
  return { notes, add, remove }
}
