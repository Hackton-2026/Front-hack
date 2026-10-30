import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/theme.css'
import './assets/tutorials.css'
import { vReveal } from './utils/motion'
import ArcLoader from './components/ArcLoader.vue'

// global: o carregando aparece em dezenas de botões e avisos
const app = createApp(App).use(router).directive('reveal', vReveal).component('ArcLoader', ArcLoader)
router.isReady().then(() => app.mount('#app'))
