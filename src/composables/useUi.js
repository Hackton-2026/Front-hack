import { reactive } from 'vue'

const ui = reactive({
  taskId: null,
  creating: null,
  chat: null,
  palette: false,
  crumb: '',
  message: '',
  ask: null,
})

let timer
let resolveAsk
// confirm()/prompt() nativos são bloqueados em alguns navegadores (respondem "não" sem mostrar nada)
function openAsk(options) {
  resolveAsk?.(ui.ask?.value === null ? false : null)
  ui.ask = options
  return new Promise((resolve) => (resolveAsk = resolve))
}
function answerAsk(result) {
  const resolve = resolveAsk
  resolveAsk = null
  ui.ask = null
  resolve?.(result)
}

export function useUi() {
  return {
    confirmAsk: (title, { message = '', confirmLabel = 'Apagar', danger = true } = {}) => openAsk({ title, message, confirmLabel, danger, value: null }),
    promptAsk: (title, value = '', { confirmLabel = 'Salvar', placeholder = '' } = {}) => openAsk({ title, message: '', confirmLabel, danger: false, value, placeholder }),
    answerAsk,
    ui,
    openTask: (task) => (ui.taskId = task.id),
    closeTask: () => (ui.taskId = null),
    newTask: (defaults = {}) => (ui.creating = defaults),
    closeNew: () => (ui.creating = null),
    openChat: (projectId) => (ui.chat = Number(projectId)),
    closeChat: () => (ui.chat = null),
    toast: (message) => {
      ui.message = message
      clearTimeout(timer)
      timer = setTimeout(() => (ui.message = ''), 4500)
    },
  }
}
