// Script do Google Identity Services (login com Google e permissões para Meet). Carrega uma vez só.
let loading
export function loadGoogle() {
  if (window.google?.accounts) return Promise.resolve()
  loading ||= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.onload = resolve
    s.onerror = () => { loading = null; reject(new Error('Não foi possível carregar o Google.')) }
    document.head.appendChild(s)
  })
  return loading
}
