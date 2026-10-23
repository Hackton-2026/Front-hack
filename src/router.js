import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from './composables/useAuth'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    // meta.bare = página sem a navbar do app (o login tem layout próprio)
    { path: '/', component: () => import('./views/LandingView.vue'), meta: { bare: true } },
    {
      path: '/produto/quadros',
      component: () => import('./views/QuadrosTutorial.vue'),
      meta: { bare: true },
    },
    {
      path: '/produto/calendario',
      component: () => import('./views/CalendarioTutorial.vue'),
      meta: { bare: true },
    },
    {
      path: '/produto/chat',
      component: () => import('./views/ChatTutorial.vue'),
      meta: { bare: true },
    },
    {
      path: '/produto/tarefas',
      component: () => import('./views/TarefasTutorial.vue'),
      meta: { bare: true },
    },
    {
      path: '/produto/ia',
      component: () => import('./views/AiTutorialView.vue'),
      meta: { bare: true },
    },
    {
      path: '/login',
      component: () => import('./views/LoginView.vue'),
      meta: { guest: true, bare: true },
    },
    // Área logada do Novexo: meta.app = renderiza dentro da AppShell (App.vue); area marca o item do trilho
    {
      path: '/comecar',
      component: () => import('./views/GetStartedView.vue'),
      meta: { app: true, auth: true, area: 'work', title: 'Começar', icon: 'rocket' },
    },
    {
      path: '/inicio',
      component: () => import('./views/HomeView.vue'),
      meta: { app: true, auth: true, area: 'work', title: 'Início', icon: 'home' },
    },
    {
      path: '/meu-trabalho',
      component: () => import('./views/MyWorkView.vue'),
      meta: { app: true, auth: true, area: 'work', title: 'Seu trabalho', icon: 'mine' },
    },
    {
      path: '/rascunhos',
      component: () => import('./views/DraftsView.vue'),
      meta: { app: true, auth: true, area: 'work', title: 'Rascunhos', icon: 'draft' },
    },
    {
      path: '/notas',
      component: () => import('./views/NotesView.vue'),
      meta: { app: true, auth: true, area: 'work', title: 'Notas', icon: 'note' },
    },
    {
      path: '/projetos',
      component: () => import('./views/ProjectsView.vue'),
      meta: { app: true, auth: true, area: 'work', title: 'Projetos', icon: 'folder' },
    },
    {
      path: '/projetos/:id',
      component: () => import('./views/ProjectView.vue'),
      props: true,
      meta: { app: true, auth: true, area: 'work', title: 'Itens de trabalho', icon: 'items' },
    },
    // Menu do projeto do Plane: visão geral, itens, ciclos, módulos, visões e páginas
    {
      path: '/projetos/:id/visao-geral',
      component: () => import('./views/ProjectOverview.vue'),
      props: true,
      meta: { app: true, auth: true, area: 'work', title: 'Visão geral', icon: 'overview' },
    },
    {
      path: '/projetos/:id/ciclos',
      component: () => import('./views/CyclesView.vue'),
      props: true,
      meta: { app: true, auth: true, area: 'work', title: 'Ciclos', icon: 'cycle' },
    },
    {
      path: '/projetos/:id/ciclos/:cycle',
      component: () => import('./views/ProjectView.vue'),
      props: true,
      meta: { app: true, auth: true, area: 'work', title: 'Ciclo', icon: 'cycle' },
    },
    {
      path: '/projetos/:id/modulos',
      component: () => import('./views/ModulesView.vue'),
      props: true,
      meta: { app: true, auth: true, area: 'work', title: 'Módulos', icon: 'module' },
    },
    {
      path: '/projetos/:id/modulos/:module',
      component: () => import('./views/ProjectView.vue'),
      props: true,
      meta: { app: true, auth: true, area: 'work', title: 'Módulo', icon: 'module' },
    },
    {
      path: '/projetos/:id/visoes',
      component: () => import('./views/ViewsView.vue'),
      props: true,
      meta: { app: true, auth: true, area: 'work', title: 'Visões', icon: 'layers' },
    },
    {
      path: '/projetos/:id/visoes/:view',
      component: () => import('./views/ProjectView.vue'),
      props: true,
      meta: { app: true, auth: true, area: 'work', title: 'Visão', icon: 'layers' },
    },
    {
      path: '/projetos/:id/paginas',
      component: () => import('./views/PagesView.vue'),
      props: true,
      meta: { app: true, auth: true, area: 'work', title: 'Páginas', icon: 'page' },
    },
    {
      path: '/projetos/:id/paginas/:page',
      component: () => import('./views/PageEditor.vue'),
      props: true,
      meta: { app: true, auth: true, area: 'work', title: 'Página', icon: 'page' },
    },
    // "Mais" do workspace
    {
      path: '/visoes',
      component: () => import('./views/ViewsView.vue'),
      meta: { app: true, auth: true, area: 'work', title: 'Visões', icon: 'layers' },
    },
    {
      path: '/ciclos',
      component: () => import('./views/CyclesView.vue'),
      meta: { app: true, auth: true, area: 'work', title: 'Ciclos ativos', icon: 'cycle' },
    },
    {
      path: '/analises',
      component: () => import('./views/AnalyticsView.vue'),
      meta: { app: true, auth: true, area: 'work', title: 'Análises', icon: 'chart' },
    },
    {
      path: '/arquivados',
      component: () => import('./views/ArchivesView.vue'),
      meta: { app: true, auth: true, area: 'work', title: 'Arquivados', icon: 'archive' },
    },
    {
      path: '/paineis',
      component: () => import('./views/DashboardsView.vue'),
      meta: { app: true, auth: true, area: 'work', title: 'Painéis', icon: 'dashboard' },
    },
    {
      path: '/wiki',
      component: () => import('./views/WikiView.vue'),
      meta: { app: true, auth: true, area: 'wiki', title: 'Wiki', icon: 'wiki' },
    },
    {
      path: '/ia',
      component: () => import('./views/AiView.vue'),
      meta: { app: true, auth: true, area: 'ai', title: 'Novexo IA', icon: 'ai' },
    },
    {
      path: '/ajustes',
      component: () => import('./views/SettingsView.vue'),
      meta: { app: true, auth: true, area: 'settings', title: 'Ajustes', icon: 'settings' },
    },
    { path: '/explorar', component: () => import('./views/ProductsView.vue') },
    {
      path: '/meus',
      component: () => import('./views/ProductsView.vue'),
      props: { mine: true },
      meta: { auth: true },
    },
    { path: '/novo', component: () => import('./views/ProductFormView.vue'), meta: { auth: true } },
    {
      path: '/editar/:id',
      component: () => import('./views/ProductFormView.vue'),
      props: true,
      meta: { auth: true },
    },
    { path: '/perfil', component: () => import('./views/ProfileView.vue'), meta: { auth: true } },
    {
      path: '/chat/:id?',
      component: () => import('./views/ChatView.vue'),
      props: true,
      meta: { auth: true },
    },
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
