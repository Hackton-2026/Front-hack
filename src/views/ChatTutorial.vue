<script setup>
import TutorialGuidePage from '../components/landing/TutorialGuidePage.vue'

const steps = [
  {
    title: 'Abra o chat do projeto',
    text: 'Entre em um projeto e clique em Chat, no topo da página. Você também pode acessar Chat no menu do projeto, na barra lateral. A conversa abre em um painel à direita, sem sair dos itens de trabalho.',
    caption: 'Abrir o chat pelo botão do projeto ou pela barra lateral',
    video: '/tutoriais/chat/passo-1.mp4',
  },
  {
    title: 'Envie uma mensagem',
    text: 'Digite no campo de mensagem, na parte inferior do painel, e pressione Enter ou clique na seta para enviar. Use Shift + Enter para pular uma linha. As mensagens aparecem na conversa com o nome de quem enviou e o horário.',
    caption: 'Escrever e enviar uma mensagem no chat do projeto',
    video: '/tutoriais/chat/passo-2.mp4',
  },
  {
    title: 'Use menções na conversa',
    text: 'Use @ no texto para fazer uma menção. Para incluir a IA, clique no botão @novexo abaixo do campo de mensagem e escreva seu pedido junto da menção.',
    caption: 'Incluir uma menção à Novexo IA em uma mensagem',
    video: '/tutoriais/chat/passo-3.mp4',
  },
]
</script>

<template>
  <TutorialGuidePage
    guide-class="chat-guide"
    id-prefix="chat-step"
    page-title="Chat"
    title="Como usar o"
    emphasis="chat do projeto"
    lead="Converse com as pessoas do projeto e consulte as mensagens enquanto acompanha as tarefas."
    :steps="steps"
    end-note="Para fechar o painel, clique no botão de fechar, no canto superior direito. Abra o Chat novamente quando quiser voltar à conversa."
  />
</template>
