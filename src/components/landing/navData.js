// Conteúdo dos megamenus (mesma estrutura do nav do leonardo.ai: grupos com ícone + título + descrição, e um card em destaque)
// Ícones: traço 24x24, desenhados com stroke="currentColor"
export const ICONS = {
  tasks: 'M4 4h16v16H4z M8 12l3 3 5-6',
  board: 'M4 4h4v16H4z M10 4h4v10h-4z M16 4h4v7h-4z',
  calendar: 'M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4',
  goals: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18 M12 7a5 5 0 1 0 0 10a5 5 0 1 0 0-10 M12 11.5v1',
  chat: 'M4 5h16v11H9l-5 4z',
  docs: 'M6 3h9l4 4v14H6z M14 3v5h5 M9 13h7 M9 17h7',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  plug: 'M9 2v6 M15 2v6 M6 8h12v4a6 6 0 0 1-12 0z M12 18v4',
  marketing: 'M3 10v4h4l8 5V5L7 10z M18 9a3 3 0 0 1 0 6',
  code: 'M8 7l-5 5 5 5 M16 7l5 5-5 5 M14 4l-4 16',
  pen: 'M4 20l4-1 11-11-3-3L5 16z M14 6l3 3',
  briefcase: 'M3 7h18v13H3z M9 7V4h6v3 M3 12h18',
  sliders: 'M4 6h10 M18 6h2 M4 12h4 M12 12h8 M4 18h12 M16 4v4 M10 10v4 M16 16v4',
  cap: 'M2 9l10-5 10 5-10 5z M6 11v5c3 2 9 2 12 0v-5',
  users: 'M9 11a3 3 0 1 0 0-6a3 3 0 1 0 0 6 M3 20c0-3 3-5 6-5s6 2 6 5 M16 5a3 3 0 0 1 0 6 M18 15c2 .5 3 2 3 5',
  terminal: 'M3 4h18v16H3z M7 9l3 3-3 3 M12 15h5',
  book: 'M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1z M12 6v14',
  news: 'M4 5h13v14H6a2 2 0 0 1-2-2z M17 9h3v8a2 2 0 0 1-2 2 M8 9h5 M8 13h5',
  play: 'M3 5h18v12H3z M10 8.5v5l4-2.5z M8 21h8',
}

export const MENU = [
  {
    id: 'produto',
    label: 'Produto',
    columns: [
      [
        { group: 'Planejar', items: [
          { icon: 'tasks', title: 'Tarefas', desc: 'Listas, subtarefas e prioridades' },
          { icon: 'board', title: 'Quadros', desc: 'Kanban para cada fluxo do time' },
          { icon: 'calendar', title: 'Calendário', desc: 'Prazos e entregas lado a lado' },
          { icon: 'goals', title: 'Metas', desc: 'Objetivos ligados ao trabalho real' },
        ] },
      ],
      [
        { group: 'Colaborar', items: [
          { icon: 'chat', title: 'Chat', desc: 'Conversas dentro de cada tarefa' },
          { icon: 'docs', title: 'Documentos', desc: 'Wikis e specs junto das tarefas' },
        ] },
        { group: 'Automatizar', items: [
          { icon: 'bolt', title: 'Automações', desc: 'Regras que fazem o repetitivo' },
          { icon: 'plug', title: 'Integrações', desc: 'Conecte as ferramentas que já usa' },
        ] },
      ],
      [
        { group: 'Destaques', links: ['Novexo IA', 'Modelos prontos', 'Painéis', 'Controle de tempo'], more: 'Ver todos os recursos' },
      ],
    ],
    feature: { title: 'Novo no Novexo? Aprenda o básico.', cta: 'Começar', art: 'a', to: '/blog/como-funciona' },
  },
  {
    id: 'solucoes',
    label: 'Soluções',
    columns: [
      [{ items: [
        { icon: 'marketing', title: 'Marketing', desc: 'Campanhas do briefing à entrega' },
        { icon: 'code', title: 'Engenharia', desc: 'Sprints, bugs e roadmap' },
        { icon: 'pen', title: 'Design', desc: 'Revisões e aprovações sem ruído' },
      ], more: 'Ver todas as soluções' }],
      [{ items: [
        { icon: 'briefcase', title: 'Agências', desc: 'Projetos de vários clientes' },
        { icon: 'sliders', title: 'Operações', desc: 'Processos padronizados e medidos' },
        { icon: 'cap', title: 'Educação', desc: 'Turmas, trabalhos e cronogramas' },
      ] }],
    ],
    feature: { title: 'Dá para usar o Novexo com clientes?', cta: 'Veja como', art: 'b' },
  },
  {
    id: 'empresas',
    label: 'Empresas',
    columns: [
      [{ items: [
        { icon: 'users', title: 'Times e workspaces', desc: 'Espaços compartilhados com permissões' },
        { icon: 'terminal', title: 'API e integrações', desc: 'Construa fluxos sob medida' },
      ] }],
    ],
    feature: { title: 'Como um time de 40 pessoas cortou 30% das reuniões', cta: 'Ler o case', art: 'c' },
  },
  {
    id: 'aprender',
    label: 'Aprender',
    columns: [
      [{ items: [
        { icon: 'book', title: 'Como funciona', desc: 'Seu primeiro projeto, passo a passo.', to: '/blog/como-funciona' },
        { icon: 'news', title: 'Blog', desc: 'Produtividade e gestão de times.', to: '/blog' },
        { icon: 'play', title: 'Webinars', desc: 'Sessões ao vivo e gravadas.' },
      ] }],
    ],
    feature: { title: 'Como funciona o Novexo', cta: 'Veja o passo a passo', art: 'd', to: '/blog/como-funciona' },
  },
  { id: 'planos', label: 'Preços', href: '/#planos' },
  { id: 'contato', label: 'Contato', href: '/contato' },
]
