import { ref } from 'vue'
import { api, tokens } from '../services/api'
import { disablePush, savedToken } from '../services/push'
import { resetWorkspace } from './useWorkspace'

const user = ref(null)
const ready = ref(false)
// servidor fora não é sessão vencida: os tokens ficam e a próxima navegação tenta de novo
const offline = ref(false)

async function loadMe() {
  try {
    user.value = await api('/api/auth/me/', { timeout: 8000 })
    offline.value = false
  } catch (e) {
    const transient = !e.status || e.status >= 500
    offline.value = transient
    // Só derruba a sessão se o servidor realmente rejeitou o token (401/403);
    // oscilação de rede ao voltar do AFK não deve chutar o usuário para /login.
    if (!transient) user.value = null
  }
}

let initializing = null
function init() {
  if (!tokens.access) {
    offline.value = false
    ready.value = true
    return Promise.resolve()
  }
  initializing ||= (async () => {
    await loadMe()
    ready.value = !offline.value
  })().finally(() => { initializing = null })
  return initializing
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
  try {
    await login(data.email, data.password)
  } catch (e) {
    throw Object.assign(e, { registered: true })
  }
}

async function updateMe(body) {
  const { tokens: fresh, ...me } = await api('/api/auth/me/', { method: 'PATCH', body })
  // trocar e-mail/senha derruba as sessões; o servidor devolve tokens novos para esta continuar
  if (fresh) tokens.set(fresh)
  user.value = me
}

function logout() {
  const refresh = tokens.refresh
  // revoga a sessão autenticada no servidor antes de limpar os tokens locais
  if (tokens.access || refresh) {
    api('/api/auth/logout/', { method: 'POST', body: refresh ? { refresh } : {}, auth: true }).catch(() => {})
  }
  // o DELETE do device usa o access atual: dispara antes de limpar; o token local sai já para não repetir em loop
  if (savedToken()) {
    disablePush().catch(() => {})
    try { localStorage.removeItem('novexo:push-token') } catch { }
  }
  tokens.clear()
  user.value = null
  resetWorkspace()
}

window.addEventListener('auth:logout', logout)
window.addEventListener('online', () => { if (offline.value && tokens.access) init() })

export function useAuth() {
  return { user, ready, offline, init, loadMe, login, loginWithGoogle, register, updateMe, logout }
}
