/* Service worker do push (Firebase Cloud Messaging). Mostra os avisos da caixa de entrada quando o Novexo
   está fechado ou em segundo plano, inclusive no celular. A configuração do Firebase chega pela URL do registro
   (src/services/push.js), porque o service worker não lê as variáveis VITE_. */
importScripts('https://www.gstatic.com/firebasejs/13.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/13.0.0/firebase-messaging-compat.js')

firebase.initializeApp(Object.fromEntries(new URL(self.location).searchParams))

// O backend manda só "data" (title, body, link): quem desenha a notificação é este arquivo
firebase.messaging().onBackgroundMessage(({ data = {} }) => {
  self.registration.showNotification(data.title || 'Novexo', {
    body: data.body || '',
    icon: '/novexo-icon.png',
    badge: '/novexo-icon.png',
    data: { link: data.link || '/inicio' },
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL(event.notification.data?.link || '/inicio', self.location.origin).href
  event.waitUntil((async () => {
    const tabs = await clients.matchAll({ type: 'window', includeUncontrolled: true })
    const open = tabs.find((t) => new URL(t.url).origin === self.location.origin)
    if (open) return open.focus().then((t) => t.navigate(url))
    return clients.openWindow(url)
  })())
})
