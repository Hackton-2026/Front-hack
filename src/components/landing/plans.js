// Planos da landing e do checkout (os preços e códigos batem com os Plan do backend; o servidor recalcula o valor cobrado).
// shortcut: planos fixos no front; quando o backend expuser /api/billing/ sem login, buscar de lá
export const PLANS = [
  { code: 'free', name: 'Grátis', desc: 'Para organizar a vida e projetos pessoais.', month: 0, year: 0, cta: 'Começar grátis',
    features: ['Tarefas e listas ilimitadas', 'Até 3 quadros', '100 MB de armazenamento', 'Apps web e celular'] },
  { code: 'essential', name: 'Essencial', desc: 'Para times pequenos que querem ritmo.', month: 29, year: 23, cta: 'Testar 14 dias',
    features: ['Tudo do Grátis', 'Quadros e calendário ilimitados', 'Comentários e menções', '5 GB por membro', '100 automações/mês'] },
  { code: 'business', name: 'Business', desc: 'Para times que crescem e precisam medir.', month: 59, year: 47, cta: 'Testar 14 dias', popular: true,
    features: ['Tudo do Essencial', 'Metas e painéis', 'Controle de tempo', 'Permissões por espaço', '10 mil automações/mês', 'Novexo IA incluída'] },
  { code: 'enterprise', name: 'Enterprise', desc: 'Para empresas com segurança e escala.', cta: 'Falar com vendas',
    features: ['Tudo do Business', 'SSO e auditoria', 'Automações ilimitadas', 'Gerente de conta dedicado', 'SLA de 99,9%'] },
]

