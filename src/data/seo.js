import { BLOG_POSTS } from './blog.js'

export const SITE_NAME = 'Novexo'
export const SITE_ORIGIN = 'https://www.novexo.cloud'
export const DEFAULT_IMAGE = `${SITE_ORIGIN}/motion/projetos-poster.jpg`

export const HOME_SEO = {
  path: '/',
  title: 'Novexo',
  ogTitle: 'Novexo — Gestão de projetos, tarefas, wiki e IA para times',
  description:
    'Organize projetos, tarefas, quadros Kanban, calendário, chat em tempo real, documentos e IA em um só lugar. Comece grátis no Novexo e cresça com seu time.',
  heading: 'Novexo: tarefas que crescem com seu time',
}

// Principais páginas candidatas a Sitelinks no Google (título curto + descrição objetiva)
export const SITELINK_PAGES = [
  {
    path: '/precos',
    name: 'Planos e Preços',
    title: 'Planos e Preços | Novexo',
    description:
      'Comece grátis com seu time ou teste o plano Business por 14 dias. Planos transparentes que crescem junto com seus projetos.',
  },
  {
    path: '/produto/ia',
    name: 'IA',
    title: 'IA | Novexo',
    description:
      'Crie tarefas, estruture projetos e resuma conversas com inteligência artificial integrada ao seu workspace. Menos trabalho manual, mais entrega.',
  },
  {
    path: '/login',
    name: 'Entrar',
    title: 'Entrar | Novexo',
    description:
      'Acesse sua conta Novexo ou crie seu workspace grátis em segundos. Gerencie tarefas, projetos, chat em tempo real e documentos em um só lugar.',
  },
  {
    path: '/blog/como-funciona',
    name: 'Como funciona',
    title: 'Como funciona | Novexo',
    description:
      'Veja na prática como tarefas, quadros Kanban, ciclos, calendário, wiki e chat trabalham juntos para manter todo o time alinhado.',
  },
  {
    path: '/casos-de-uso',
    name: 'Casos de uso',
    title: 'Casos de uso | Novexo',
    description:
      'Descubra como times de engenharia, agências, operações e educação organizam demandas e entregam mais rápido com o Novexo.',
  },
  {
    path: '/blog',
    name: 'Blog',
    title: 'Blog | Novexo',
    description:
      'Guias práticos sobre produtividade, planejamento semanal, rituais de equipe e gestão de projetos sem burocracia.',
  },
]

export const OTHER_PUBLIC_PAGES = [
  {
    path: '/sobre',
    name: 'Sobre o Novexo',
    title: 'Sobre | Novexo',
    description:
      'Conheça a história e a proposta do Novexo: uma plataforma feita para acompanhar o ritmo do seu time, do primeiro projeto à escala.',
  },
  {
    path: '/docs',
    name: 'Documentação',
    title: 'Documentação | Novexo',
    description:
      'Documentação oficial do Novexo: API pública, webhooks, integrações com Google Meet e WhatsApp e guias do workspace.',
  },
  {
    path: '/seguranca',
    name: 'Segurança',
    title: 'Segurança | Novexo',
    description:
      'Saiba como o Novexo protege os dados do seu time com isolamento por workspace, controle de acesso por função e criptografia.',
  },
  {
    path: '/contato',
    name: 'Contato',
    title: 'Contato | Novexo',
    description:
      'Fale com o time do Novexo para tirar dúvidas, agendar uma demonstração ou montar um plano Enterprise sob medida.',
  },
  {
    path: '/status',
    name: 'Status',
    title: 'Status | Novexo',
    description:
      'Acompanhe a disponibilidade em tempo real da plataforma, da API e dos serviços do Novexo.',
  },
  {
    path: '/produto/tarefas',
    name: 'Tarefas',
    title: 'Tarefas | Novexo',
    description:
      'Organize tarefas, subtarefas, prioridades, checklists e prazos com clareza para todo o time no Novexo.',
  },
  {
    path: '/produto/quadros',
    name: 'Quadros Kanban',
    title: 'Quadros Kanban | Novexo',
    description:
      'Visualize o fluxo do time em quadros Kanban, lista, calendário e cronograma Gantt dentro do Novexo.',
  },
  {
    path: '/produto/calendario',
    name: 'Calendário',
    title: 'Calendário | Novexo',
    description:
      'Planeje entregas, prazos e ciclos semanais da equipe no calendário integrado às tarefas do Novexo.',
  },
  {
    path: '/produto/chat',
    name: 'Chat de Projetos',
    title: 'Chat de Projetos | Novexo',
    description:
      'Converse em tempo real por projeto, envie mensagens diretas e mencione a @novexo IA dentro da própria conversa.',
  },
  {
    path: '/produto/documentos',
    name: 'Documentos e Wiki',
    title: 'Documentos e Wiki | Novexo',
    description:
      'Centralize briefings, processos e decisões da equipe em páginas colaborativas conectadas aos projetos do Novexo.',
  },
  {
    path: '/produto/automacoes',
    name: 'Automações',
    title: 'Automações | Novexo',
    description:
      'Automatize lembretes, ciclos e fluxos repetitivos para o time focar no que realmente importa.',
  },
  {
    path: '/produto/integracoes',
    name: 'Integrações',
    title: 'Integrações | Novexo',
    description:
      'Conecte o Novexo às ferramentas do seu time com API pública, webhooks, Google Meet e WhatsApp.',
  },
  {
    path: '/precos/personalizado',
    name: 'Plano personalizado',
    title: 'Plano personalizado | Novexo',
    description:
      'Monte um plano sob medida para a sua empresa com SSO, auditoria, automações ilimitadas, gerente de conta dedicado e SLA de 99,9%.',
  },
  {
    path: '/solucoes/engenharia',
    name: 'Engenharia',
    title: 'Engenharia | Novexo',
    description:
      'Ciclos, módulos, quadros, documentação técnica e IA integrados para times de engenharia e desenvolvimento de software.',
  },
  {
    path: '/solucoes/agencias',
    name: 'Agências',
    title: 'Agências | Novexo',
    description:
      'Gerencie projetos de clientes, briefings, entregas e aprovações em um único lugar com o Novexo.',
  },
  {
    path: '/solucoes/operacoes',
    name: 'Operações',
    title: 'Operações | Novexo',
    description:
      'Padronize processos, acompanhe prazos e mantenha toda a operação sincronizada com o Novexo.',
  },
  {
    path: '/solucoes/educacao',
    name: 'Educação',
    title: 'Educação | Novexo',
    description:
      'Organize turmas, projetos acadêmicos, tarefas e materiais colaborativos com simplicidade no Novexo.',
  },
]

export const BLOG_SEO_PAGES = BLOG_POSTS.map((post) => ({
  path: `/blog/${post.slug}`,
  name: post.title,
  title: `${post.title} | Novexo`,
  description: post.excerpt,
  type: 'article',
  datePublished: post.date,
}))

export const ALL_PUBLIC_SEO_PAGES = [
  ...SITELINK_PAGES,
  ...OTHER_PUBLIC_PAGES,
  ...BLOG_SEO_PAGES,
]

export const SEO_BY_PATH = Object.fromEntries([
  ['/', HOME_SEO],
  ...ALL_PUBLIC_SEO_PAGES.map((p) => [p.path, p]),
])
