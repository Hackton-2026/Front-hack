import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backend = (env.VITE_API_URL || 'http://127.0.0.1:54321/functions/v1').replace(/\/+$/, '')
  return {
    plugins: [vue()],
    server: {
      port: 5173,
      proxy: {
        '/api': { target: backend, changeOrigin: true },
      },
    },
  }
})
