import { formatBRL } from './plans.js'

export const CUSTOM_PLAN_RESOURCES = [
  { id: 'automation', icon: 'bolt', name: 'Automações', from: 100, detail: 'Planejamento dos fluxos e das ações recorrentes do time.' },
  { id: 'dashboards', icon: 'chart-pie-alt', name: 'Metas e painéis', from: 150, detail: 'Visão dos projetos, indicadores e objetivos da equipe.' },
  { id: 'time', icon: 'clock', name: 'Controle de tempo', from: 150, detail: 'Acompanhamento do tempo dedicado ao trabalho.' },
  { id: 'ai', icon: 'brain', name: 'Novexo IA', from: 200, detail: 'Recursos de IA considerados no escopo da proposta.' },
  { id: 'permissions', icon: 'users-alt', name: 'Permissões por espaço', from: 250, detail: 'Organização dos acessos de cada equipe.' },
  { id: 'security', icon: 'lock', name: 'SSO e auditoria', from: 300, detail: 'Requisitos de acesso corporativo e registros de atividade.' },
  { id: 'manager', icon: 'headset', name: 'Gerente de conta', from: 400, detail: 'Relacionamento e acompanhamento dedicado da empresa.' },
  { id: 'sla', icon: 'shield-check', name: 'SLA de 99,9%', from: 450, detail: 'Acordo de disponibilidade a confirmar no contrato.' },
]

export const CUSTOM_PLAN_BANDS = [
  { from: 100, title: 'Rotinas do time', description: 'Uma base colaborativa, com foco em organizar o trabalho e planejar as primeiras automações.' },
  { from: 150, title: 'Gestão dos projetos', description: 'O escopo passa a considerar metas, painéis e controle de tempo, junto das automações.' },
  { from: 200, title: 'Produtividade com IA', description: 'Inclua a Novexo IA na conversa, além dos recursos de gestão e automação.' },
  { from: 250, title: 'Acesso por equipe', description: 'A proposta também considera permissões por espaço para organizar quem acessa cada área.' },
  { from: 300, title: 'Segurança da empresa', description: 'SSO e auditoria entram no escopo sugerido para avaliar os requisitos da sua operação.' },
  { from: 400, title: 'Acompanhamento próximo', description: 'O relacionamento com um gerente de conta passa a fazer parte da configuração sugerida.' },
  { from: 450, title: 'Operação assistida', description: 'A configuração contempla a discussão do SLA, junto dos recursos e do atendimento dedicado.' },
]

export function normalizeCustomBudget(value) {
  const amount = Number(value)
  return Number.isFinite(amount) ? Math.min(500, Math.max(0, Math.round(amount))) : 0
}

export function getCustomPlanPreview(value) {
  const budget = normalizeCustomBudget(value)
  const band = [...CUSTOM_PLAN_BANDS].reverse().find(item => budget >= item.from) || null
  const resources = CUSTOM_PLAN_RESOURCES.map(resource => {
    const included = budget >= resource.from
    return {
      ...resource,
      included,
      level: included ? Math.round(20 + 80 * (budget - resource.from) / (500 - resource.from)) : 0,
    }
  })
  return { budget, band, resources, suggested: resources.filter(item => item.included) }
}

export const CUSTOM_PLAN_STEPS = [
  { title: 'Sua empresa', intro: 'Vamos começar por quem está montando o plano.', questions: [
    { id: 'name', number: 1, label: 'Qual é o seu nome?', type: 'text', autocomplete: 'name', placeholder: 'Seu nome completo', max: 100 },
    { id: 'email', number: 2, label: 'Qual é o seu e-mail de trabalho?', type: 'email', autocomplete: 'email', placeholder: 'voce@empresa.com', max: 180 },
    { id: 'company', number: 3, label: 'Qual é o nome da empresa?', type: 'text', autocomplete: 'organization', placeholder: 'Nome da sua empresa', max: 100 },
    { id: 'role', number: 4, label: 'Qual é o seu cargo ou função?', type: 'text', autocomplete: 'organization-title', placeholder: 'Ex.: gestão de projetos', max: 100 },
  ] },
  { title: 'Seu trabalho', intro: 'Conte um pouco sobre o dia a dia da equipe.', questions: [
    { id: 'industry', number: 5, label: 'Qual é o segmento de atuação da empresa?', type: 'select', options: ['Tecnologia', 'Comércio e varejo', 'Serviços', 'Indústria', 'Educação', 'Saúde', 'Logística', 'Outro segmento'] },
    { id: 'area', number: 6, label: 'Qual é a principal área do time?', type: 'select', options: ['Operações', 'Marketing', 'Design', 'Tecnologia', 'Comercial', 'Várias áreas', 'Outra área'] },
    { id: 'projects', number: 7, label: 'Quantos projetos vocês tocam ao mesmo tempo?', type: 'number', placeholder: 'Ex.: 5', min: 1, max: 1000 },
    { id: 'tools', number: 8, label: 'Quais ferramentas vocês usam hoje?', type: 'text', placeholder: 'Ex.: planilhas, Trello, Notion ou nenhuma', max: 160 },
  ] },
  { title: 'Suas prioridades', intro: 'Agora, o que o plano precisa ajudar a resolver?', questions: [
    { id: 'challenge', number: 9, label: 'Qual é o principal desafio da equipe?', type: 'textarea', placeholder: 'Conte o que vocês querem melhorar na organização do trabalho.', max: 500 },
    { id: 'priorities', number: 10, label: 'Quais recursos são prioridade?', type: 'choices', hint: 'Selecione pelo menos um recurso.' },
    { id: 'sso', number: 11, label: 'A empresa precisa de login corporativo (SSO)?', type: 'select', options: ['Sim, é um requisito', 'Não precisamos agora', 'Precisamos avaliar'] },
    { id: 'timing', number: 12, label: 'Quando vocês pretendem começar?', type: 'select', options: ['O quanto antes', 'Nos próximos 30 dias', 'Nos próximos 3 meses', 'Estamos só avaliando'] },
  ] },
]

export const CUSTOM_PLAN_QUESTIONS = CUSTOM_PLAN_STEPS.flatMap(step => step.questions)

export const createCustomPlanAnswers = () => Object.fromEntries(CUSTOM_PLAN_QUESTIONS.map(question => [question.id, question.type === 'choices' ? [] : '']))

export function isCustomAnswerValid(question, value) {
  if (question.type === 'choices') return Array.isArray(value) && value.length > 0
    && value.every(id => CUSTOM_PLAN_RESOURCES.some(resource => resource.id === id))
  const text = String(value ?? '').trim()
  if (!text) return false
  if (question.type === 'select') return question.options.includes(text)
  if (question.type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) && text.length <= question.max
  if (question.type === 'number') return Number.isInteger(Number(text)) && Number(text) >= question.min && Number(text) <= question.max
  return text.length <= question.max
}

export function getCustomPlanAnswerLabel(question, value) {
  return question.type === 'choices'
    ? CUSTOM_PLAN_RESOURCES.filter(resource => value.includes(resource.id)).map(resource => resource.name).join(', ')
    : String(value ?? '').trim()
}

export function buildCustomPlanRequest(answers, value) {
  const preview = getCustomPlanPreview(value)
  return [
    'Solicitação de plano personalizado — Novexo',
    `Orçamento total mensal da empresa: ${formatBRL(preview.budget)}`,
    `Configuração ilustrativa: ${preview.band?.title || 'Ainda sem faixa sugerida'}`,
    '',
    ...CUSTOM_PLAN_QUESTIONS.flatMap(question => [
      `${question.number}. ${question.label}`,
      getCustomPlanAnswerLabel(question, answers[question.id]), '',
    ]),
    'Recursos considerados na simulação:',
    preview.suggested.length ? preview.suggested.map(resource => `• ${resource.name}`).join('\n') : 'Nenhum; prévia disponível a partir de R$ 100.',
    '', 'Simulação de escopo. Valores, capacidade por equipe e condições dependem da proposta comercial.',
  ].join('\n')
}
