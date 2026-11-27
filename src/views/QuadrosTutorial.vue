<script setup>
import TutorialGuidePage from '../components/landing/TutorialGuidePage.vue'

const steps = [
  {
    title: 'Abra a visualização Quadro',
    text: 'Entre em um projeto e abra Itens de trabalho. Clique na aba Quadro, ao lado de Lista. As tarefas aparecem em colunas de acordo com o status.',
    caption: 'Abrir o quadro de um projeto',
    video: '/tutoriais/quadros/passo-1.mp4',
  },
  {
    title: 'Crie e confira os cards',
    text: 'Digite um título no campo + Nova tarefa, no final de uma coluna, e pressione Enter. A tarefa será criada com o status dessa coluna. Clique no card para preencher a descrição, definir responsáveis, prazo e prioridade.',
    caption: 'Criar uma tarefa no quadro e abrir seus detalhes',
    video: '/tutoriais/quadros/passo-2.mp4',
  },
  {
    title: 'Mova as tarefas entre as colunas',
    text: 'Arraste um card para outra coluna para atualizar seu status. Você também pode selecionar o card com Tab e usar as setas esquerda e direita. Se precisar informar uma nota para concluir a tarefa, abra os detalhes e use Marcar como concluída.',
    caption: 'Mover os cards e atualizar o status das tarefas',
    video: '/tutoriais/quadros/passo-3.mp4',
  },
]
</script>

<template>
  <TutorialGuidePage
    guide-class="boards-guide"
    id-prefix="quadrostutorial-step"
    page-title="Quadros | Novexo"
    title="Como usar os"
    emphasis="quadros"
    lead="Visualize as tarefas por status e mova os cards conforme o trabalho avança."
    :steps="steps"
    end-note="As alterações de status dependem das suas permissões. Você pode voltar para Lista ou Calendário para ver as mesmas tarefas em outro formato."
  />
</template>
