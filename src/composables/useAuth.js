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
    user.value = await Promise.race([api('/api/auth/me/'), new Promise((_, no) => setTimeout(no, 10000, new Error('Servidor sem resposta.')))])
    offline.value = false
  } catch (e) {
    user.value = null
    offline.value = !e.status
  }
}

async function init() {
  if (tokens.access) await loadMe()
  ready.value = !offline.value
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
  // queima o refresh no servidor; sem rede, ao menos o navegador esquece
  if (refresh) api('/api/auth/logout/', { method: 'POST', body: { refresh }, auth: false }).catch(() => {})
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

export function useAuth() {
  return { user, ready, offline, init, loadMe, login, loginWithGoogle, register, updateMe, logout }
}
