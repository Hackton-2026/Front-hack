import { api } from './api'

// Push no celular e no computador pelo Firebase Cloud Messaging. Este aparelho pede permissão, ganha um token do
// Firebase e manda para o backend (/api/devices/); dali em diante todo aviso da caixa de entrada vira notificação.
// Sem as variáveis VITE_FIREBASE_* no .env, o recurso aparece como "não configurado".
const env = import.meta.env
const CONFIG = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}
const VAPID_KEY = env.VITE_FIREBASE_VAPID_KEY
const TOKEN_KEY = 'novexo:push-token'

export const pushConfigured = Boolean(CONFIG.apiKey && CONFIG.projectId && CONFIG.appId && VAPID_KEY)
export const pushSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window && 'PushManager' in window

let messaging
async function firebase() {
  if (!messaging) {
    const [{ initializeApp }, fcm] = await Promise.all([import('firebase/app'), import('firebase/messaging')])
    messaging = { fcm, instance: fcm.getMessaging(initializeApp(CONFIG)) }
  }
  return messaging
}

function platform() {
  const ua = navigator.userAgent
  const os = /Android/i.test(ua) ? 'Android' : /iPhone|iPad/i.test(ua) ? 'iPhone' : /Windows/i.test(ua) ? 'Windows' : /Mac/i.test(ua) ? 'Mac' : 'Linux'
  const browser = /Edg\//.test(ua) ? 'Edge' : /Firefox/.test(ua) ? 'Firefox' : /Chrome/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : 'Navegador'
  return `${os} · ${browser}`
}

export const savedToken = () => { try { return localStorage.getItem(TOKEN_KEY) } catch { return null } }

// Liga o push neste aparelho. Devolve o token (ou lança um erro com mensagem para mostrar)
export async function enablePush() {
  if (!pushSupported) throw new Error('Este navegador não recebe notificações push. No iPhone, adicione o Novexo à Tela de Início primeiro.')
  if (!pushConfigured) throw new Error('Push não configurado: faltam as variáveis VITE_FIREBASE_* no .env do front.')
  if ((await Notification.requestPermission()) !== 'granted') throw new Error('Permissão negada. Libere as notificações nas configurações do site.')
  const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${new URLSearchParams(CONFIG)}`)
  const { fcm, instance } = await firebase()
  const token = await fcm.getToken(instance, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration })
  await api('/api/devices/', { method: 'POST', body: { token, platform: platform() } })
  try { localStorage.setItem(TOKEN_KEY, token) } catch { /* modo privado */ }
  return token
}

export async function disablePush() {
  const token = savedToken()
  if (!token) return
  await api('/api/devices/', { method: 'DELETE', body: { token } })
  try { localStorage.removeItem(TOKEN_KEY) } catch { /* modo privado */ }
  if (pushConfigured) {
    const { fcm, instance } = await firebase()
    await fcm.deleteToken(instance).catch(() => {})
  }
}

// Com o Novexo aberto o Firebase não mostra notificação: entrega aqui (o app mostra como aviso rápido)
export async function onForegroundPush(handler) {
  if (!pushConfigured || !pushSupported || !savedToken()) return
  const { fcm, instance } = await firebase()
  fcm.onMessage(instance, ({ data = {} }) => handler(data))
}
