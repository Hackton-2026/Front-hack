import { API_URL } from '../config'

// Tokens JWT ficam no localStorage para sobreviver ao F5
export const tokens = {
  get access() { return localStorage.getItem('access') },
  get refresh() { return localStorage.getItem('refresh') },
  set({ access, refresh }) {
    localStorage.setItem('access', access)
    if (refresh) localStorage.setItem('refresh', refresh)
  },
  clear() {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
  },
}

// Transforma o erro do DRF ({detail} ou {campo: [msgs]}) em texto legível
function errorText(data) {
  if (!data) return 'Não foi possível falar com o servidor.'
  if (typeof data === 'string') return data
  if (data.detail) return data.detail
  return Object.entries(data).map(([field, msgs]) => `${field}: ${[].concat(msgs).join(' ')}`).join('\n')
}

async function refreshAccess() {
  const res = await fetch(`${API_URL}/api/auth/login/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: tokens.refresh }),
  })
  if (!res.ok) return false
  tokens.set(await res.json())
  return true
}

/**
 * Chamada à API. `body` pode ser objeto (vira JSON) ou FormData (upload de arquivo).
 * Em 401 tenta renovar o token uma vez; se não der, desloga.
 * Erros viram `throw new Error(mensagem legível)` com `.data` e `.status`.
 */
export async function api(path, { method = 'GET', body, auth = true } = {}, retry = true) {
  const headers = {}
  if (auth && tokens.access) headers.Authorization = `Bearer ${tokens.access}`
  const isForm = body instanceof FormData
  if (body && !isForm) headers['Content-Type'] = 'application/json'

  let res
  try {
    res = await fetch(API_URL + path, { method, headers, body: isForm ? body : body && JSON.stringify(body) })
  } catch {
    throw new Error(errorText(null))
  }

  if (res.status === 401 && auth && retry && tokens.refresh) {
    if (await refreshAccess()) return api(path, { method, body, auth }, false)
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

// Monta um FormData ignorando undefined; null vira "" (o DRF entende como "remover" em campos de imagem)
export function toFormData(obj) {
  const fd = new FormData()
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) fd.append(key, value ?? '')
  }
  return fd
}

// Valor de um campo de imagem para envio: File = nova foto, null = remover, URL atual = não envia
export const imageField = (value) => (typeof value === 'string' ? undefined : value)

export function wsUrl(path) {
  const base = API_URL ? API_URL.replace(/^http/, 'ws') : `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`
  return `${base}${path}?token=${tokens.access}`
}
