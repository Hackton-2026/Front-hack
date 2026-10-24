// Fonte compartilhada da página de preços e da seção de planos da página inicial.
// Os valores anuais são equivalentes mensais, cobrados por 12 meses de uma vez.
export const PRICING_PLANS = [
  {
    id: 'gratis',
    icon: 'leaf',
    name: 'Grátis',
    desc: 'Para organizar a vida e projetos pessoais.',
    month: 0,
    year: 0,
    limits: { boards: 3, automationRuns: 0, storageMB: 100, storagePerMember: false },
    cta: 'Começar grátis',
    features: ['Tarefas e listas ilimitadas', 'Até 3 quadros', '100 MB de armazenamento', 'Apps web e celular'],
    detail: {
      title: 'Seu primeiro espaço para organizar o dia.',
      description: 'Reúna tarefas e listas sem limite e acompanhe projetos em até 3 quadros. É um ponto de partida para manter compromissos e próximos passos no mesmo lugar, pela web ou pelo celular.',
      bullets: ['Tarefas e listas ilimitadas para a rotina.', 'Até 3 quadros para separar seus projetos.', '100 MB para armazenar arquivos.'],
    },
  },
  {
    id: 'essencial',
    icon: 'users-alt',
    name: 'Essencial',
    desc: 'Para times pequenos que querem ritmo.',
    month: 29,
    year: 23,
    limits: { boards: Infinity, automationRuns: 100, storageMB: 5000, storagePerMember: true },
    cta: 'Testar 14 dias',
    features: ['Tudo do Grátis', 'Quadros e calendário ilimitados', 'Comentários e menções', '5 GB por membro', '100 automações/mês'],
    detail: {
      title: 'Mais espaço para trabalhar em equipe.',
      description: 'O Essencial mantém os recursos do Grátis e libera quadros e calendário ilimitados. Comentários e menções aproximam as conversas do trabalho, enquanto as automações ajudam a executar ações recorrentes.',
      bullets: ['Quadros e calendário ilimitados para organizar o time.', 'Comentários e menções para conversar no contexto.', '5 GB por membro e 100 automações por mês.'],
    },
  },
  {
    id: 'business',
    icon: 'chart-line-up',
    name: 'Business',
    desc: 'Para times que crescem e precisam medir.',
    month: 59,
    year: 47,
    limits: { boards: Infinity, automationRuns: 10000, storageMB: 5000, storagePerMember: true },
    cta: 'Testar 14 dias',
    popular: true,
    features: ['Tudo do Essencial', 'Metas e painéis', 'Controle de tempo', 'Permissões por espaço', '10 mil automações/mês', 'Novexo IA incluída'],
    detail: {
      title: 'Acompanhe resultados com mais contexto.',
      description: 'Além de tudo do Essencial, o Business reúne metas, painéis e controle de tempo para acompanhar o trabalho. Permissões por espaço ajudam a organizar acessos, e a Novexo IA já faz parte do plano.',
      bullets: ['Metas, painéis e controle de tempo para acompanhar entregas.', 'Permissões por espaço e Novexo IA incluída.', '10 mil automações por mês: 100 vezes o limite do Essencial.'],
    },
  },
  {
    id: 'enterprise',
    icon: 'building',
    name: 'Enterprise',
    desc: 'Para empresas com segurança e escala.',
    limits: { boards: Infinity, automationRuns: Infinity, storageMB: 5000, storagePerMember: true },
    cta: 'Falar com vendas',
    features: ['Tudo do Business', 'SSO e auditoria', 'Automações ilimitadas', 'Gerente de conta dedicado', 'SLA de 99,9%'],
    detail: {
      title: 'Um plano alinhado à sua empresa.',
      description: 'O Enterprise parte dos recursos do Business e acrescenta SSO, auditoria e automações ilimitadas. A contratação é anual, com proposta sob medida, gerente de conta dedicado e SLA de 99,9%.',
      bullets: ['SSO e auditoria para os requisitos da empresa.', 'Automações ilimitadas para operações em escala.', 'Gerente de conta dedicado e SLA de 99,9%.'],
    },
  },
]

// A ordem dos valores acompanha PRICING_PLANS. Recursos herdados pelas linhas
// “Tudo do …” também aparecem nas colunas dos planos seguintes.
export const COMPARISON_GROUPS = [
  {
    title: 'Organização e colaboração',
    rows: [
      { label: 'Tarefas e listas', values: ['Ilimitadas', 'Ilimitadas', 'Ilimitadas', 'Ilimitadas'] },
      { label: 'Quadros', values: PRICING_PLANS.map(({ limits }) => limits.boards === Infinity ? 'Ilimitados' : `Até ${limits.boards}`) },
      { label: 'Calendário ilimitado', values: [false, true, true, true] },
      { label: 'Comentários e menções', values: [false, true, true, true] },
      { label: 'Apps web e celular', values: [true, true, true, true] },
      { label: 'Armazenamento', values: PRICING_PLANS.map(({ limits }) => `${limits.storageMB >= 1000 ? `${limits.storageMB / 1000} GB` : `${limits.storageMB} MB`}${limits.storagePerMember ? '/membro' : ''}`) },
    ],
  },
  {
    title: 'Automação e acompanhamento',
    rows: [
      { label: 'Automações por mês', values: PRICING_PLANS.map(({ limits }) => limits.automationRuns === Infinity ? 'Ilimitadas' : limits.automationRuns === 0 ? 'Não incluídas' : limits.automationRuns >= 1000 ? `${limits.automationRuns / 1000} mil` : String(limits.automationRuns)) },
      { label: 'Metas e painéis', values: [false, false, true, true] },
      { label: 'Controle de tempo', values: [false, false, true, true] },
      { label: 'Permissões por espaço', values: [false, false, true, true] },
      { label: 'Novexo IA', values: [false, false, true, true] },
    ],
  },
  {
    title: 'Segurança e atendimento',
    rows: [
      { label: 'SSO e auditoria', values: [false, false, false, true] },
      { label: 'Gerente de conta dedicado', values: [false, false, false, true] },
      { label: 'SLA de 99,9%', values: [false, false, false, true] },
    ],
  },
]

export const formatBRL = (value) => new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
}).format(value)

export const annualTotal = (plan) => typeof plan.year === 'number' ? plan.year * 12 : null

export const annualSavings = (plan) => typeof plan.month === 'number' && typeof plan.year === 'number'
  ? (plan.month - plan.year) * 12
  : null

export const annualDiscount = (plan) => plan.month > 0 && typeof plan.year === 'number'
  ? ((plan.month - plan.year) / plan.month) * 100
  : 0
