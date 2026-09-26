import { ref } from 'vue'
import { api, tokens } from '../services/api'

// Estado global (fora da função = compartilhado por todos os componentes)
const user = ref(null)
const ready = ref(false) // true depois da 1ª checagem do token

async function loadMe() {
  try {
    user.value = await api('/api/auth/me/')
  } catch {
    user.value = null
  }
}

async function init() {
  if (tokens.access) await loadMe()
  ready.value = true
}

async function login(username, password) {
  tokens.set(await api('/api/auth/login/', { method: 'POST', body: { username, password }, auth: false }))
  await loadMe()
}

async function loginWithGoogle(credential) {
  tokens.set(await api('/api/auth/google/', { method: 'POST', body: { credential }, auth: false }))
  await loadMe()
}

async function register(data) {
  await api('/api/auth/register/', { method: 'POST', body: data, auth: false })
  await login(data.username, data.password)
}

// Recebe um FormData (para mandar foto junto) ou objeto
async function updateMe(body) {
  user.value = await api('/api/auth/me/', { method: 'PATCH', body })
}

function logout() {
  tokens.clear()
  user.value = null
}

window.addEventListener('auth:logout', logout)

export function useAuth() {
  return { user, ready, init, login, loginWithGoogle, register, updateMe, logout }
}
