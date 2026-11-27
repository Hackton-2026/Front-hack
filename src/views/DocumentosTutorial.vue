<script setup>
import TutorialGuidePage from '../components/landing/TutorialGuidePage.vue'

const steps = [
  {
    title: 'Abra Documentos',
    text: 'Clique em Documentos na barra lateral. Na tela inicial, use Nova página para criar um documento ou selecione uma página existente.',
    caption: 'Abrir Documentos e criar uma página',
    video: '/tutoriais/documentos/passo-1.mp4',
  },
  {
    title: 'Escreva e formate o conteúdo',
    text: 'Dê um título à página e escreva o conteúdo no editor. Use a barra de ferramentas para inserir títulos, listas, links e outros formatos. Alterne entre Editar e Visualizar para conferir a leitura.',
    caption: 'Editar o título, escrever e visualizar o documento',
    video: '/tutoriais/documentos/passo-2.mp4',
  },
  {
    title: 'Organize e encontre suas páginas',
    text: 'Use Buscar páginas para localizar um documento. Você pode organizar suas páginas em coleções e adicionar etiquetas para identificar os assuntos.',
    caption: 'Buscar páginas e organizar os documentos',
    video: '/tutoriais/documentos/passo-3.mp4',
  },
]
</script>

<template>
  <TutorialGuidePage
    guide-class="documentostutorial-guide"
    id-prefix="documentostutorial-step"
    page-title="Documentos | Novexo"
    title="Como criar"
    emphasis="documentos"
    lead="Use Documentos para guardar anotações e referências pessoais. Para escrever com o time, use os Documentos do projeto."
    :steps="steps"
    end-note="Documentos é pessoal. Para compartilhar o conteúdo com o time, abra um projeto e acesse Documentos do projeto no menu dele."
    cta-label="Abrir Documentos"
    cta-to="/wiki"
  />
</template>
