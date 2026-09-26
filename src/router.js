import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from './composables/useAuth'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: (to) => (to.hash ? { el: to.hash, behavior: 'smooth' } : { top: 0 }),
  routes: [
    // meta.bare = página sem a navbar do app (o login tem layout próprio)
    { path: '/', redirect: '/explorar' },
    { path: '/login', component: () => import('./views/LoginView.vue'), meta: { guest: true, bare: true } },
    { path: '/explorar', component: () => import('./views/ProductsView.vue') },
    { path: '/meus', component: () => import('./views/ProductsView.vue'), props: { mine: true }, meta: { auth: true } },
    { path: '/novo', component: () => import('./views/ProductFormView.vue'), meta: { auth: true } },
    { path: '/editar/:id', component: () => import('./views/ProductFormView.vue'), props: true, meta: { auth: true } },
    { path: '/perfil', component: () => import('./views/ProfileView.vue'), meta: { auth: true } },
    { path: '/chat/:id?', component: () => import('./views/ChatView.vue'), props: true, meta: { auth: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

// meta.auth = só logado; meta.guest = só deslogado (ex.: tela de login)
router.beforeEach(async (to) => {
  const { user, ready, init } = useAuth()
  if (!ready.value) await init()
  if (to.meta.auth && !user.value) return { path: '/login', query: { next: to.fullPath } }
  if (to.meta.guest && user.value) return '/explorar'
})

export default router
