export const LAYOUTS = [
  { type: 'list', label: 'Lista', desc: 'Tarefas em linhas, com status e prazo', icon: 'list', group: 'popular' },
  { type: 'gantt', label: 'Gantt', desc: 'Duração e prazos num cronograma', icon: 'chart', group: 'popular' },
  { type: 'calendar', label: 'Calendário', desc: 'Planeje e distribua por data', icon: 'calendar', group: 'popular' },
  { type: 'doc', label: 'Documento', desc: 'Uma página do projeto ao lado das tarefas', icon: 'page', group: 'popular' },
  { type: 'board', label: 'Quadro (Kanban)', desc: 'Mova tarefas entre colunas', icon: 'grid', group: 'popular' },
  { type: 'dashboard', label: 'Painel', desc: 'Números e gráficos do projeto', icon: 'dashboard', group: 'popular' },
  { type: 'gallery', label: 'Galeria', desc: 'Tarefas em cartões', icon: 'image', group: 'popular' },
  { type: 'table', label: 'Tabela', desc: 'Planilha editável e ordenável', icon: 'items', group: 'more' },
  { type: 'whiteboard', label: 'Whiteboard', desc: 'Notas soltas para brainstorm', icon: 'note', group: 'more' },
  { type: 'activity', label: 'Atividade', desc: 'O que mudou no projeto', icon: 'pulse', group: 'more' },
  { type: 'workload', label: 'Carga de trabalho', desc: 'Quanto cada pessoa tem na semana', icon: 'sliders', group: 'more' },
  { type: 'mindmap', label: 'Mapa mental', desc: 'Projeto, status e tarefas em árvore', icon: 'module', group: 'more' },
  { type: 'team', label: 'Equipe', desc: 'O que cada pessoa está fazendo', icon: 'user', group: 'more' },
  { type: 'cycles', label: 'Ciclos', desc: 'Sprints com os itens de trabalho de cada um', icon: 'cycle', group: 'more' },
]
export const layout = (type) => LAYOUTS.find((l) => l.type === type) || LAYOUTS[0]
