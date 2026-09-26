import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/theme.css'
import { vReveal } from './utils/motion'

createApp(App).use(router).directive('reveal', vReveal).mount('#app')
