<script setup>
import TutorialGuidePage from '../components/landing/TutorialGuidePage.vue'

const steps = [
  {
    title: 'Separe os projetos dos clientes',
    text: 'Crie um projeto para cada cliente ou contrato. Use nomes que ajudem a identificar o trabalho e cadastre as entregas como tarefas dentro do projeto correspondente.',
    caption: 'Organizar clientes e entregas por projeto',
    video: '/tutoriais/agencias/passo-1.mp4',
  },
  {
    title: 'Distribua as entregas',
    text: 'Defina responsáveis, prioridades e prazos para as tarefas. Use o checklist para registrar etapas internas, como planejamento, produção e revisão.',
    caption: 'Definir responsáveis e prazos das entregas',
    video: '/tutoriais/agencias/passo-2.mp4',
  },
  {
    title: 'Acompanhe o que falta entregar',
    text: 'Use o Quadro para acompanhar o andamento e o Calendário para conferir os prazos. Cada pessoa pode consultar Seu trabalho para encontrar as tarefas atribuídas a ela.',
    caption: 'Revisar o andamento e os prazos dos clientes',
    video: '/tutoriais/agencias/passo-3.mp4',
  },
]
</script>

<template>
  <TutorialGuidePage
    guide-class="agencias-guide"
    id-prefix="agencias-step"
    page-title="Agências"
    title="Como agências podem"
    emphasis="usar o Novexo"
    lead="Separe as entregas de cada cliente, distribua o trabalho e acompanhe os prazos da equipe."
    :steps="steps"
    end-note="Mantenha os combinados e links de referência na descrição das tarefas para facilitar a consulta do time."
  />
</template>
