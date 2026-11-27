import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from './composables/useAuth'
import { useUi } from './composables/useUi'
import { tokens } from './services/api'
import { CUSTOM_PLAN_PATH } from './utils/customPlanEntry'
import { formatPageTitle } from './composables/usePageTitle'
import { HOME_SEO, SEO_BY_PATH, SITE_NAME, SITE_ORIGIN } from './data/seo'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, top: 110 }
    return { top: 0 }
  },
  routes: [
    {
      path: '/solucoes/engenharia',
      component: () => import('./views/EngenhariaView.vue'),
      meta: { bare: true },
    },
    {
      path: '/solucoes/agencias',
      component: () => import('./views/AgenciasView.vue'),
      meta: { bare: true },
    },
    {
      path: '/solucoes/operacoes',
      component: () => import('./views/OperacoesView.vue'),
      meta: { bare: true },
    },
    {
      path: '/solucoes/educacao',
      component: () => import('./views/EducacaoView.vue'),
      meta: { bare: true },
    },

    {
      path: '/produto/documentos',
      component: () => import('./views/DocumentosTutorial.vue'),
      meta: { bare: true },
    },
    {
      path: '/produto/automacoes',
      component: () => import('./views/AutomacoesTutorial.vue'),
      meta: { bare: true },
    },
    {
      path: '/produto/integracoes',
      component: () => import('./views/IntegracoesTutorial.vue'),
      meta: { bare: true },
    },
    { path: '/', component: () => import('./views/LandingView.vue'), meta: { bare: true } },
    { path: '/produto/quadros', component: () => import('./views/QuadrosTutorial.vue'), meta: { bare: true } },
    { path: '/produto/calendario', component: () => import('./views/CalendarioTutorial.vue'), meta: { bare: true } },
    { path: '/produto/chat', component: () => import('./views/ChatTutorial.vue'), meta: { bare: true } },
    { path: '/produto/tarefas', component: () => import('./views/TarefasTutorial.vue'), meta: { bare: true } },
    { path: '/produto/ia', component: () => import('./views/AiTutorialView.vue'), meta: { bare: true } },
    { path: '/precos', alias: '/pricing', component: () => import('./views/PricingView.vue'), meta: { bare: true } },
    { path: CUSTOM_PLAN_PATH, component: () => import('./views/CustomPlanView.vue'), meta: { bare: true } },
    { path: '/contato', alias: '/contact-us', component: () => import('./views/ContactView.vue'), meta: { bare: true } },
    { path: '/casos-de-uso', component: () => import('./views/UseCasesView.vue'), meta: { bare: true } },
    { path: '/seguranca', alias: '/security', component: () => import('./views/SecurityView.vue'), meta: { bare: true } },
    { path: '/docs', alias: '/documentacao', component: () => import('./views/DocsView.vue'), meta: { bare: true } },
    { path: '/status', component: () => import('./views/StatusView.vue'), meta: { bare: true } },
    { path: '/sobre', alias: '/about', component: () => import('./views/AboutView.vue'), meta: { bare: true } },
    { path: '/blog', alias: '/news', component: () => import('./views/BlogView.vue'), meta: { bare: true } },
    { path: '/blog/como-funciona', alias: '/como-funciona', component: () => import('./views/HowItWorksView.vue'), meta: { bare: true } },
    { path: '/blog/:slug', component: () => import('./views/BlogArticleView.vue'), meta: { bare: true } },
    { path: '/login', component: () => import('./views/LoginView.vue'), meta: { guest: true, bare: true, title: 'Entrar' } },
    { path: '/checkout', component: () => import('./views/CheckoutView.vue'), meta: { auth: true, bare: true, title: 'Checkout' } },
    { path: '/entrar/:token', component: () => import('./views/JoinView.vue'), props: true, meta: { bare: true, title: 'Convite' } },
    { path: '/f/:token', component: () => import('./views/PublicFormView.vue'), props: true, meta: { bare: true, title: 'Solicitação' } },
    { path: '/portal/:token', component: () => import('./views/ClientPortalView.vue'), props: true, meta: { bare: true, title: 'Portal do cliente' } },
    { path: '/verificar-email', component: () => import('./views/VerifyEmailView.vue'), meta: { bare: true, title: 'Verificar e-mail' } },
    { path: '/comecar', component: () => import('./views/GetStartedView.vue'), meta: { app: true, auth: true, area: 'work', title: 'Começar', icon: 'rocket' } },
    { path: '/inicio', redirect: '/projetos' },
    { path: '/meu-trabalho', component: () => import('./views/MyWorkView.vue'), meta: { app: true, auth: true, area: 'work', ownTitle: true, title: 'Seu trabalho', icon: 'mine' } },
    { path: '/caixa-de-entrada', component: () => import('./views/InboxView.vue'), meta: { app: true, auth: true, area: 'inbox', ownTitle: true, title: 'Caixa de entrada', icon: 'inbox' } },
    { path: '/rascunhos', redirect: '/projetos' },
    { path: '/favoritos', component: () => import('./views/FavoritesView.vue'), meta: { app: true, auth: true, area: 'work', ownTitle: true, title: 'Favoritos', icon: 'star' } },
    { path: '/notas', component: () => import('./views/NotesView.vue'), meta: { app: true, auth: true, area: 'work', ownTitle: true, title: 'Notas', icon: 'note' } },
    { path: '/projetos', component: () => import('./views/ProjectsView.vue'), meta: { app: true, auth: true, area: 'work', ownTitle: true, title: 'Projetos', icon: 'folder' } },
    { path: '/projetos/:id', component: () => import('./views/ProjectView.vue'), props: true, meta: { app: true, auth: true, area: 'work', title: 'Itens de trabalho', icon: 'items' } },
    { path: '/projetos/:id/visao-geral', component: () => import('./views/ProjectOverview.vue'), props: true, meta: { app: true, auth: true, area: 'work', title: 'Visão geral', icon: 'overview' } },
    { path: '/projetos/:id/ciclos', component: () => import('./views/CyclesView.vue'), props: true, meta: { app: true, auth: true, area: 'work', title: 'Ciclos', icon: 'cycle' } },
    { path: '/projetos/:id/ciclos/:cycle', component: () => import('./views/ProjectView.vue'), props: true, meta: { app: true, auth: true, area: 'work', title: 'Ciclo', icon: 'cycle' } },
    { path: '/projetos/:id/modulos', component: () => import('./views/ModulesView.vue'), props: true, meta: { app: true, auth: true, area: 'work', title: 'Módulos', icon: 'module' } },
    { path: '/projetos/:id/modulos/:module', component: () => import('./views/ProjectView.vue'), props: true, meta: { app: true, auth: true, area: 'work', title: 'Módulo', icon: 'module' } },
    { path: '/projetos/:id/visoes/:view', component: () => import('./views/ProjectView.vue'), props: true, meta: { app: true, auth: true, area: 'work', title: 'Visão', icon: 'layers' } },
    { path: '/projetos/:id/paginas', component: () => import('./views/PagesView.vue'), props: true, meta: { app: true, auth: true, area: 'work', title: 'Documentos do projeto', icon: 'page' } },
    { path: '/projetos/:id/paginas/:page', component: () => import('./views/PageEditor.vue'), props: true, meta: { app: true, auth: true, area: 'work', title: 'Página', icon: 'page' } },
    { path: '/projetos/:id/membros', component: () => import('./views/ProjectMembers.vue'), props: true, meta: { app: true, auth: true, area: 'work', title: 'Membros', icon: 'user' } },
    { path: '/projetos/:id/chat', component: () => import('./views/ProjectChat.vue'), props: (to) => ({ id: to.params.id, page: true }), meta: { app: true, auth: true, area: 'work', title: 'Chat', icon: 'chat' } },
    { path: '/convite/:token', component: () => import('./views/InviteView.vue'), props: true, meta: { app: true, auth: true, area: 'work', title: 'Convite', icon: 'user' } },
    { path: '/ciclos', component: () => import('./views/CyclesView.vue'), meta: { app: true, auth: true, area: 'work', title: 'Ciclos ativos', icon: 'cycle' } },
    { path: '/analises', component: () => import('./views/AnalyticsView.vue'), meta: { app: true, auth: true, area: 'work', ownTitle: true, title: 'Análises', icon: 'chart' } },
    { path: '/arquivados', component: () => import('./views/ArchivesView.vue'), meta: { app: true, auth: true, area: 'work', title: 'Arquivados', icon: 'archive' } },
    { path: '/paineis', component: () => import('./views/DashboardsView.vue'), meta: { app: true, auth: true, area: 'work', title: 'Painéis', icon: 'dashboard' } },
    { path: '/wiki', component: () => import('./views/WikiView.vue'), meta: { app: true, auth: true, area: 'wiki', title: 'Documentos', icon: 'wiki' } },
    { path: '/ia', component: () => import('./views/AiView.vue'), meta: { app: true, auth: true, area: 'ai', title: 'IA', icon: 'ai' } },
    { path: '/ajustes', component: () => import('./views/SettingsView.vue'), meta: { app: true, auth: true, area: 'settings', ownTitle: true, title: 'Ajustes', icon: 'settings' } },
    { path: '/explorar', component: () => import('./views/ProductsView.vue'), meta: { title: 'Explorar' } },
    {
      path: '/meus',
      component: () => import('./views/ProductsView.vue'),
      props: { mine: true },
      meta: { auth: true, title: 'Meus itens' },
    },
    { path: '/novo', component: () => import('./views/ProductFormView.vue'), meta: { auth: true, title: 'Novo item' } },
    {
      path: '/editar/:id',
      component: () => import('./views/ProductFormView.vue'),
      props: true,
      meta: { auth: true, title: 'Editar item' },
    },
    { path: '/perfil', component: () => import('./views/ProfileView.vue'), meta: { auth: true, title: 'Perfil' } },
    {
      path: '/chat/:id?',
      component: () => import('./views/ChatView.vue'),
      props: true,
      meta: { auth: true, title: 'Chat' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  const { user, ready, offline, init } = useAuth()
  // páginas públicas e /login sem token não travam esperando /me
  if (!ready.value && !user.value) {
    if (to.meta.auth) {
      await init()
    } else if (to.meta.guest && tokens.access && !offline.value) {
      await init()
    } else if (tokens.access) {
      init()
    } else {
      ready.value = true
    }
  }
  // conta nova só entra no app depois de confirmar o e-mail (o servidor também recusa): o login mostra esse passo
  const pending = user.value?.must_confirm_email
  if (to.meta.auth && (!user.value || pending)) return { path: '/login', query: { next: to.fullPath } }
  if (to.meta.guest && user.value && !pending) return '/comecar'
})

const CHUNK_ERR = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading (?:CSS )?chunk|Unable to preload CSS/i
const RELOAD_KEY = 'nvx:chunk-reload'
router.onError((err, to) => {
  if (!CHUNK_ERR.test(err?.message || '')) return
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0)
    if (Date.now() - last > 15000) {
      sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
      location.assign(to?.fullPath || location.href)
      return
    }
  } catch { }
  useUi().toast('Não foi possível abrir esta página agora. Verifique sua conexão e tente novamente.')
})

function setMeta(selector, attr, value) {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    const [k, v] = attr
    el.setAttribute(k, v)
    document.head.appendChild(el)
  }
  el.setAttribute('content', value)
}

function setCanonical(url) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', url)
}

router.afterEach((to) => {
  const isPrivate = Boolean(
    to.meta?.auth ||
    to.path.startsWith('/convite/') ||
    to.path.startsWith('/entrar/') ||
    to.path.startsWith('/f/') ||
    to.path.startsWith('/portal/') ||
    to.path === '/verificar-email'
  )
  const seo = SEO_BY_PATH[to.path]
  const rawTitle = to.path === '/' ? SITE_NAME : (seo?.title || to.meta?.title || SITE_NAME)
  const pageTitle = formatPageTitle(rawTitle)
  const ogTitle = seo?.ogTitle || seo?.title || HOME_SEO.ogTitle
  const desc = seo?.description || HOME_SEO.description
  const canonical = `${SITE_ORIGIN}${to.path === '/' ? '/' : to.path}`

  document.title = pageTitle
  setMeta('meta[name="description"]', ['name', 'description'], desc)
  setMeta(
    'meta[name="robots"]',
    ['name', 'robots'],
    isPrivate ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
  )
  setMeta('meta[property="og:title"]', ['property', 'og:title'], ogTitle)
  setMeta('meta[property="og:description"]', ['property', 'og:description'], desc)
  setMeta('meta[property="og:url"]', ['property', 'og:url'], canonical)
  setMeta('meta[name="twitter:title"]', ['name', 'twitter:title'], ogTitle)
  setMeta('meta[name="twitter:description"]', ['name', 'twitter:description'], desc)
  setCanonical(canonical)
})

export default router
