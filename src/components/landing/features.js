// Blocos de recurso da landing (texto + motion design ao lado, no estilo do leonardo.ai).
// motion: caminho do vídeo em /public (ex.: '/motion/tarefas.mp4'), exportado do projeto video-intro (1100×948).
// Vazio = mostra o espaço reservado no mesmo formato. poster: primeiro quadro, para não piscar preto ao carregar.
export const FEATURES = [
  {
    id: 'tarefas',
    title: 'Cada tarefa no seu lugar',
    text: 'Crie tarefas com responsável, prioridade e prazo, quebre em checklist e veja o que está atrasado antes de virar problema.',
    more: '/produto/tarefas',
    motion: '/motion/tarefas.mp4', // video-intro: MotionTarefas
    poster: '/motion/tarefas-poster.jpg',
  },
  {
    id: 'projetos',
    title: 'O projeto do jeito que o time vê',
    text: 'Lista, quadro, calendário e Gantt mostram as mesmas tarefas. Cada pessoa escolhe a visualização e o trabalho continua um só.',
    more: '/produto/quadros',
    motion: '/motion/projetos.mp4', // video-intro: MotionProjetos
    poster: '/motion/projetos-poster.jpg',
  },
  {
    id: 'ia',
    title: 'Uma IA que conhece seus projetos',
    text: 'A Novexo IA lê as tarefas do workspace, cria itens a partir de uma conversa e pergunta antes de mudar qualquer coisa.',
    more: '/produto/ia',
    motion: '/motion/ia.mp4', // video-intro: MotionIA
    poster: '/motion/ia-poster.jpg',
  },
  {
    id: 'agenda',
    title: 'Os prazos na agenda do time',
    text: 'As datas das tarefas aparecem no calendário e no Google Agenda, e a reunião do Meet começa direto do chat do projeto.',
    more: '/produto/calendario',
    motion: '/motion/agenda.mp4', // video-intro: MotionAgenda
    poster: '/motion/agenda-poster.jpg',
  },
]
