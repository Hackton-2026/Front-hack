<script setup>
import TutorialGuidePage from '../components/landing/TutorialGuidePage.vue'

const steps = [
  {
    title: 'Abra o calendário do projeto',
    text: 'Entre em um projeto, abra Itens de trabalho e clique na aba Calendário. Use as setas para trocar de mês e o botão Hoje para voltar ao mês atual.',
    caption: 'Abrir o calendário e navegar entre os meses',
    video: '/tutoriais/calendario/passo-1.mp4',
  },
  {
    title: 'Crie uma tarefa com prazo',
    text: 'Clique em um espaço vazio no dia desejado para abrir o formulário de nova tarefa. O prazo já vem preenchido com essa data. Informe o título, confira o projeto e os demais campos e clique em Criar tarefa.',
    caption: 'Criar uma tarefa a partir de um dia do calendário',
    video: '/tutoriais/calendario/passo-2.mp4',
  },
  {
    title: 'Altere as datas das tarefas',
    text: 'Arraste uma tarefa para outro dia para mudar o prazo. As tarefas sem prazo ficam no painel Sem data: arraste uma delas para o calendário para definir uma data. Você também pode clicar na tarefa e editar o prazo nos detalhes.',
    caption: 'Reagendar uma tarefa e definir prazos para itens sem data',
    video: '/tutoriais/calendario/passo-3.mp4',
  },
]
</script>

<template>
  <TutorialGuidePage
    guide-class="calendar-guide"
    id-prefix="calendariotutorial-step"
    page-title="Calendário | Novexo"
    title="Como usar o"
    emphasis="calendário"
    lead="Veja os prazos das tarefas por dia e ajuste as datas dentro do projeto."
    :steps="steps"
    end-note="Para remover o prazo de uma tarefa, arraste-a para o painel Sem data ou limpe o prazo nos detalhes. As alterações dependem das suas permissões."
  />
</template>
