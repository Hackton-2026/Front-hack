<script setup>
import TutorialGuidePage from '../components/landing/TutorialGuidePage.vue'

const steps = [
  {
    title: 'Crie um projeto para o curso',
    text: 'Organize cada curso, turma ou programa em um projeto. Cadastre aulas e atividades como tarefas e indique os responsáveis pela preparação.',
    caption: 'Organizar um programa de aulas em um projeto',
    video: '/tutoriais/educacao/passo-1.mp4',
  },
  {
    title: 'Reúna os materiais e as datas',
    text: 'Inclua links de materiais na descrição das tarefas e registre orientações nos Documentos do projeto. Defina os prazos das atividades e consulte o Calendário.',
    caption: 'Reunir materiais e datas das atividades',
    video: '/tutoriais/educacao/passo-2.mp4',
  },
  {
    title: 'Acompanhe as atividades',
    text: 'Use o Quadro para acompanhar a preparação das aulas e a execução das atividades. Combine dúvidas e avisos no chat do projeto.',
    caption: 'Acompanhar aulas e atividades do programa',
    video: '/tutoriais/educacao/passo-3.mp4',
  },
]
</script>

<template>
  <TutorialGuidePage
    guide-class="educacao-guide"
    id-prefix="educacao-step"
    page-title="Educação"
    title="Como organizar"
    emphasis="aulas e cursos"
    lead="Um exemplo de uso do Novexo por programas externos de ensino para organizar aulas, materiais e atividades."
    :steps="steps"
    end-note="O Novexo ajuda a organizar o programa. As aulas podem acontecer nas ferramentas externas escolhidas pela instituição; esta página não oferece cursos nem uma conexão automática com essas ferramentas."
  />
</template>
