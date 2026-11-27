<script setup>
import TutorialGuidePage from '../components/landing/TutorialGuidePage.vue'

const steps = [
  {
    title: 'Defina quando a ação deve acontecer',
    text: 'Escolha uma data e um horário ou um evento, como a conclusão de uma tarefa. Informe também o projeto em que a nova tarefa deve ser criada.',
    caption: 'Definir a data ou o evento que inicia a automação',
    video: '/tutoriais/automacoes/passo-1.mp4',
  },
  {
    title: 'Descreva a tarefa para a IA',
    text: 'Exemplo de agendamento: “Amanhã às 9h, crie a tarefa Revisar contrato no projeto Comercial”. Para uma sequência: “Quando Revisar contrato for concluída, crie Enviar contrato para assinatura no mesmo projeto”.',
    caption: 'Exemplos de pedidos de automação para a Novexo IA',
    video: '/tutoriais/automacoes/passo-2.mp4',
  },
  {
    title: 'Revise a regra antes de ativar',
    text: 'No fluxo previsto, você confere o evento, a ação e os dados da tarefa antes de ativar a regra. Criar uma tarefa com prazo amanhã é diferente de agendar a criação dela para amanhã.',
    caption: 'Revisar o evento e a ação da automação',
    video: '/tutoriais/automacoes/passo-3.mp4',
  },
]
</script>

<template>
  <TutorialGuidePage
    guide-class="automacoestutorial-guide"
    id-prefix="automacoestutorial-step"
    page-title="Automações | Novexo"
    title="Como funcionam as"
    emphasis="automações"
    lead="Exemplos de rotinas com a Novexo IA: programar a criação de uma tarefa ou iniciar outra quando uma etapa terminar."
    availability="Em preparação. Exemplos do fluxo previsto."
    :steps="steps"
    end-note="Esses exemplos mostram o fluxo planejado. O agendamento e a criação por evento ainda não estão disponíveis nesta versão."
    cta-label="Abrir a Novexo IA"
    cta-to="/ia"
  />
</template>
