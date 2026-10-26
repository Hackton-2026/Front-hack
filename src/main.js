import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/theme.css'
import './assets/tutorials.css'
import { vReveal } from './utils/motion'

const app = createApp(App).use(router).directive('reveal', vReveal)
router.isReady().then(() => app.mount('#app'))
