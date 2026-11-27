import { API_URL } from '../config'
import { syncRealtimeAuth } from './supabase'

export const tokens = {
  get access() { return localStorage.getItem('access') },
  get refresh() { return localStorage.getItem('refresh') },
  set({ access, refresh }) {
    localStorage.setItem('access', access)
    if (refresh) localStorage.setItem('refresh', refresh)
    syncRealtimeAuth(access)
  },
  clear() {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    syncRealtimeAuth(null)
  },
}

if (tokens.access) syncRealtimeAuth(tokens.access)

function errorText(data) {
  if (!data) return 'Não foi possível falar com o servidor.'
  if (typeof data === 'string') return data
  if (data.detail) return data.detail
  return Object.entries(data).map(([field, msgs]) => `${field}: ${[].concat(msgs).join(' ')}`).join('\n')
}

// o refresh agora é de uso único: dois 401 ao mesmo tempo gastavam o mesmo refresh e o segundo deslogava.
// Todos esperam a mesma renovação; com AbortController ela nunca trava para sempre após AFK/rede morta.
const SLOW_PATH = /\/(ai|chat|automations\/draft)\b|\/attachments\//

async function fetchWithTimeout(url, options, ms) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  const ext = options.signal
  const onExtAbort = () => ctrl.abort()
  if (ext) {
    if (ext.aborted) ctrl.abort()
    else ext.addEventListener('abort', onExtAbort, { once: true })
  }
  try {
    return await fetch(url, { ...options, signal: ctrl.signal })
  } finally {
    clearTimeout(timer)
    ext?.removeEventListener('abort', onExtAbort)
  }
}

let refreshing = null
export function refreshAccess() {
  refreshing ||= renew().finally(() => { refreshing = null })
  return refreshing
}

async function renew() {
  const sent = tokens.refresh
  if (!sent) return false
  let res
  try {
    res = await fetchWithTimeout(
      `${API_URL}/api/auth/login/refresh/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: sent }),
      },
      10000,
    )
  } catch {
    // sem rede ou timeout: erro sem status, e os tokens ficam (não é sessão vencida)
    throw new Error(errorText(null))
  }
  // outra aba renovou primeiro e já salvou o refresh novo: o nosso foi queimado, mas a sessão continua
  // 5xx: servidor instável não é sessão vencida; os tokens ficam
  if (res.status >= 500) throw new Error(errorText(null))
  if (!res.ok) return Boolean(tokens.refresh && tokens.refresh !== sent)
  const data = await res.json().catch(() => null)
  if (!data?.access) throw new Error(errorText(null))
  tokens.set(data)
  return true
}

export async function api(path, { method = 'GET', body, auth = true, headers: extra = {}, timeout, signal } = {}, retry = true) {
  const headers = { ...extra }
  if (auth && tokens.access) headers.Authorization = `Bearer ${tokens.access}`
  const isForm = body instanceof FormData
  if (body && !isForm) headers['Content-Type'] = 'application/json'
  const ms = timeout ?? (isForm || SLOW_PATH.test(path) ? 60000 : 15000)

  let res
  try {
    res = await fetchWithTimeout(API_URL + path, { method, headers, body: isForm ? body : body && JSON.stringify(body), signal }, ms)
  } catch {
    throw new Error(errorText(null))
  }

  if (res.status === 401 && auth && retry && tokens.refresh) {
    if (await refreshAccess()) return api(path, { method, body, auth, headers: extra, timeout, signal }, false)
    tokens.clear()
    window.dispatchEvent(new Event('auth:logout'))
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) {
    const err = new Error(errorText(data))
    Object.assign(err, { data, status: res.status })
    throw err
  }
  return data
}

export function toFormData(obj) {
  const fd = new FormData()
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) fd.append(key, value ?? '')
  }
  return fd
}

export const imageField = (value) => (typeof value === 'string' ? undefined : value)

export function wsUrl(path) {
  const base = API_URL ? API_URL.replace(/^http/, 'ws') : `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`
  return `${base}${path}?token=${tokens.access}`
}
