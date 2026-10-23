import { reactive } from 'vue'

// Estado das camadas globais da área logada: painel da tarefa, modal de nova tarefa, busca, título do topo e aviso
const ui = reactive({
  taskId: null, // tarefa aberta no painel lateral
  creating: null, // null = fechado; objeto = campos pré-preenchidos (projeto, status, prazo...)
  palette: false, // busca Ctrl K
  crumb: '', // título dinâmico (ex.: nome do projeto); vazio = usa o meta.title da rota
  message: '', // aviso rápido (erro ao salvar etc.)
})

let timer
export function useUi() {
  return {
    ui,
    openTask: (task) => (ui.taskId = task.id),
    closeTask: () => (ui.taskId = null),
    newTask: (defaults = {}) => (ui.creating = defaults),
    closeNew: () => (ui.creating = null),
    toast: (message) => {
      ui.message = message
      clearTimeout(timer)
      timer = setTimeout(() => (ui.message = ''), 4500)
    },
  }
}
