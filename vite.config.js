import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Em dev o Vite repassa /api, /media e /ws para o Django: sem CORS e sem URL fixa no código
const backend = 'http://127.0.0.1:8000'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': backend,
      '/media': backend,
      '/ws': { target: backend, ws: true },
    },
  },
})
