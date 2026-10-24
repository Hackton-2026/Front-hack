import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/theme.css'
import './assets/tutorials.css'
import { vReveal } from './utils/motion'

// monta só depois do router saber a página: antes disso $route.meta vem vazio e o App.vue desenharia o layout antigo
const app = createApp(App).use(router).directive('reveal', vReveal)
router.isReady().then(() => app.mount('#app'))
