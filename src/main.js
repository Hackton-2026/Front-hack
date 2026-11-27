import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/theme.css'
import './assets/tutorials.css'
import { vReveal } from './utils/motion'
import ArcLoader from './components/ArcLoader.vue'

// Se um novo deploy invalidar chunks JS/CSS antigos enquanto a aba estava aberta/AFK,
// recarrega no máximo uma vez dentro da janela de 15s para buscar o index.html novo.
const RELOAD_KEY = 'nvx:chunk-reload'
window.addEventListener('vite:preloadError', (event) => {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0)
    if (Date.now() - last > 15000) {
      sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
      event.preventDefault()
      location.reload()
    }
  } catch { }
})

// global: o carregando aparece em dezenas de botões e avisos
const app = createApp(App).use(router).directive('reveal', vReveal).component('ArcLoader', ArcLoader)
router.isReady().then(() => app.mount('#app'))
