import { reactive } from 'vue'

const ui = reactive({
  taskId: null,
  creating: null,
  chat: null,
  palette: false,
  crumb: '',
  message: '',
})

let timer
export function useUi() {
  return {
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
