export const APP_NAME = 'Novexo'
export const ITEM = { singular: 'Produto', plural: 'Produtos' }

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
export const API_URL = import.meta.env.VITE_API_URL || ''
// Cloudflare Turnstile no cadastro; sem a chave o widget não aparece (o servidor só exige com TURNSTILE_SECRET_KEY)
export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || ''
