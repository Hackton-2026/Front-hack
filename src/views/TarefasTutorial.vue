<script setup>
import TutorialGuidePage from '../components/landing/TutorialGuidePage.vue'

const steps = [
  {
    title: 'Abra um projeto',
    text: 'Na barra lateral, clique em Projetos e escolha o projeto em que você vai trabalhar. Abra Itens de trabalho para ver as tarefas.',
    caption: 'Abrir um projeto e acessar os itens de trabalho',
    video: '/tutoriais/tarefas/passo-1.mp4',
  },
  {
    title: 'Crie uma tarefa',
    text: 'Clique em Novo item de trabalho. Preencha o título, selecione o projeto e defina os responsáveis, o prazo e a prioridade. Adicione uma descrição se precisar explicar o que deve ser feito e clique em Criar tarefa.',
    caption: 'Preencher os dados e criar uma tarefa',
    video: '/tutoriais/tarefas/passo-2.mp4',
  },
  {
    title: 'Atualize o andamento',
    text: 'Clique no nome de uma tarefa para abrir os detalhes. Você pode alterar o status, ajustar os campos e adicionar etapas ao checklist. Ao terminar, use Marcar como concluída. Se for solicitada uma nota de conclusão, descreva o que foi entregue.',
    caption: 'Editar uma tarefa, usar o checklist e concluir',
    video: '/tutoriais/tarefas/passo-3.mp4',
  },
]
</script>

<template>
  <TutorialGuidePage
    guide-class="tasks-guide"
    id-prefix="task-step"
    page-title="Tarefas | Novexo"
    title="Como organizar"
    emphasis="suas tarefas"
    lead="Crie tarefas dentro de um projeto, defina quem vai fazer cada uma e acompanhe o andamento."
    :steps="steps"
  >
    <template #end-note>
      Para encontrar apenas as suas tarefas, use o filtro <strong>Só minhas</strong> no projeto ou
      abra <strong>Seu trabalho</strong> na barra lateral.
    </template>
  </TutorialGuidePage>
</template>
