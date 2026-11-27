<script setup>
import TutorialGuidePage from '../components/landing/TutorialGuidePage.vue'

const steps = [
  {
    title: 'Registre o processo da equipe',
    text: 'Descreva as etapas e os critérios de conclusão nos Documentos do projeto. Por exemplo: recebimento de um pedido, conferência, execução e revisão.',
    caption: 'Documentar um processo da empresa',
    video: '/tutoriais/operacoes/passo-1.mp4',
  },
  {
    title: 'Transforme as etapas em tarefas',
    text: 'Crie tarefas para o trabalho que precisa ser executado. Defina responsáveis e prazos e use checklists para as verificações que fazem parte da rotina.',
    caption: 'Organizar a execução de um processo',
    video: '/tutoriais/operacoes/passo-2.mp4',
  },
  {
    title: 'Revise o andamento com o time',
    text: 'Confira o Quadro para identificar o que está parado ou aguardando revisão. Use o chat do projeto para tirar dúvidas e atualize a documentação quando o processo mudar.',
    caption: 'Acompanhar pendências e revisar os processos',
    video: '/tutoriais/operacoes/passo-3.mp4',
  },
]
</script>

<template>
  <TutorialGuidePage
    guide-class="operacoes-guide"
    id-prefix="operacoes-step"
    page-title="Para operações | Novexo"
    title="Como organizar"
    emphasis="as operações"
    lead="Use projetos, tarefas e documentos para registrar os processos da empresa e acompanhar a execução."
    :steps="steps"
    end-note="Os processos variam entre empresas. Os exemplos desta página são sugestões de organização dentro do Novexo."
  />
</template>
