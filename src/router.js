import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from './composables/useAuth'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, top: 110 }
    return { top: 0 }
  },
  routes: [
    // meta.bare = página sem a navbar do app (o login tem layout próprio)
    { path: '/', component: () => import('./views/LandingView.vue'), meta: { bare: true } },
    { path: '/contato', alias: '/contact-us', component: () => import('./views/ContactView.vue'), meta: { bare: true } },
    { path: '/blog', alias: '/news', component: () => import('./views/BlogView.vue'), meta: { bare: true } },
    { path: '/blog/como-funciona', alias: '/como-funciona', component: () => import('./views/HowItWorksView.vue'), meta: { bare: true } },
    { path: '/blog/:slug', component: () => import('./views/BlogArticleView.vue'), meta: { bare: true } },
    { path: '/login', component: () => import('./views/LoginView.vue'), meta: { guest: true, bare: true } },
    // Área logada do Novexo: meta.app = renderiza dentro da AppShell (App.vue); area marca o item do trilho
    { path: '/comecar', component: () => import('./views/GetStartedView.vue'), meta: { app: true, auth: true, area: 'work', title: 'Começar', icon: 'rocket' } },
    { path: '/inicio', component: () => import('./views/HomeView.vue'), meta: { app: true, auth: true, area: 'work', title: 'Início', icon: 'home' } },
    { path: '/meu-trabalho', component: () => import('./views/MyWorkView.vue'), meta: { app: true, auth: true, area: 'work', title: 'Seu trabalho', icon: 'mine' } },
    { path: '/rascunhos', component: () => import('./views/DraftsView.vue'), meta: { app: true, auth: true, area: 'work', title: 'Rascunhos', icon: 'draft' } },
    { path: '/notas', component: () => import('./views/NotesView.vue'), meta: { app: true, auth: true, area: 'work', title: 'Notas', icon: 'note' } },
    { path: '/projetos', component: () => import('./views/ProjectsView.vue'), meta: { app: true, auth: true, area: 'work', title: 'Projetos', icon: 'folder' } },
    { path: '/projetos/:id', component: () => import('./views/ProjectView.vue'), props: true, meta: { app: true, auth: true, area: 'work', title: 'Projeto', icon: 'folder' } },
    { path: '/wiki', component: () => import('./views/WikiView.vue'), meta: { app: true, auth: true, area: 'wiki', title: 'Wiki', icon: 'wiki' } },
    { path: '/ia', component: () => import('./views/AiView.vue'), meta: { app: true, auth: true, area: 'ai', title: 'Novexo IA', icon: 'ai' } },
    { path: '/ajustes', component: () => import('./views/SettingsView.vue'), meta: { app: true, auth: true, area: 'settings', title: 'Ajustes', icon: 'settings' } },
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
  if (to.meta.guest && user.value) return '/comecar'
})

export default router
