// Tipos de visualização do "+ Visualização" (como no ClickUp). type = View.type no backend.
// soon: aparece no menu, mas ainda não dá para criar.
export const LAYOUTS = [
  { type: 'list', label: 'Lista', desc: 'Tarefas em linhas, com status e prazo', icon: 'list', group: 'popular' },
  { type: 'gantt', label: 'Gantt', desc: 'Duração e prazos numa linha do tempo', icon: 'chart', group: 'popular' },
  { type: 'calendar', label: 'Calendário', desc: 'Planeje e distribua por data', icon: 'calendar', group: 'popular' },
  { type: 'doc', label: 'Documento', desc: 'Uma página do projeto ao lado das tarefas', icon: 'page', group: 'popular' },
  { type: 'board', label: 'Quadro – Kanban', desc: 'Mova tarefas entre colunas', icon: 'grid', group: 'popular' },
  { type: 'form', label: 'Formulário', desc: 'Pedidos que viram tarefas', icon: 'check', group: 'popular' },
  { type: 'artifact', label: 'Artifact', desc: 'Criar com IA', icon: 'bolt', group: 'popular', soon: true },
  { type: 'dashboard', label: 'Painel', desc: 'Números e gráficos do projeto', icon: 'dashboard', group: 'popular' },
  { type: 'gallery', label: 'Galeria', desc: 'Tarefas em cartões', icon: 'image', group: 'popular' },
  { type: 'table', label: 'Tabela', desc: 'Planilha editável e ordenável', icon: 'items', group: 'more' },
  { type: 'whiteboard', label: 'Whiteboard', desc: 'Notas soltas para brainstorm', icon: 'note', group: 'more' },
  { type: 'timeline', label: 'Linha do tempo', desc: 'Prazos de cada pessoa', icon: 'layers', group: 'more' },
  { type: 'activity', label: 'Atividade', desc: 'O que mudou no projeto', icon: 'pulse', group: 'more' },
  { type: 'workload', label: 'Carga de trabalho', desc: 'Quanto cada pessoa tem na semana', icon: 'sliders', group: 'more' },
  { type: 'mindmap', label: 'Mapa mental', desc: 'Projeto, status e tarefas em árvore', icon: 'module', group: 'more' },
  { type: 'team', label: 'Equipe', desc: 'O que cada pessoa está fazendo', icon: 'user', group: 'more' },
  { type: 'map', label: 'Mapa', desc: 'Tarefas por endereço', icon: 'globe', group: 'more', soon: true },
]
export const layout = (type) => LAYOUTS.find((l) => l.type === type) || LAYOUTS[0]
