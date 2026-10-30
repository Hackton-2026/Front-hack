<script setup>
import { vTutorialMotion } from '../utils/tutorialMotion'
import SiteNav from '../components/landing/SiteNav.vue'
import SiteFooter from '../components/landing/SiteFooter.vue'
import GooeyButton from '../components/GooeyButton.vue'
import FlaticonIcon from '../components/FlaticonIcon.vue'

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
  <div id="topo" v-tutorial-motion class="tutorial-page chat-guide">
    <SiteNav />
    <main class="guide">
      <header class="intro">
        <h1>Como usar o<br /><em>chat do projeto</em></h1>
        <p>
          Converse com as pessoas do projeto e consulte as mensagens enquanto acompanha as tarefas.
        </p>
      </header>

      <section
        v-for="(step, index) in steps"
        :key="step.title"
        :aria-labelledby="`chat-step-${index}`"
      >
        <div class="step-heading">
          <span class="step-number">{{ String(index + 1).padStart(2, '0') }}</span>
          <div>
            <h2 :id="`chat-step-${index}`">{{ step.title }}</h2>
            <p>{{ step.text }}</p>
          </div>
        </div>
        <figure>
          <video
            v-if="step.video"
            :src="step.video"
            :poster="step.video.replace('.mp4', '.jpg')"
            autoplay
            muted
            loop
            preload="auto"
            playsinline
            :aria-label="step.caption"
          />
          <div
            v-else
            class="video-placeholder"
            role="img"
            :aria-label="`Espaço reservado para vídeo: ${step.caption}`"
          >
            <svg viewBox="0 0 48 48" aria-hidden="true">
              <rect x="3" y="7" width="42" height="34" rx="7" />
              <path d="m20 17 12 7-12 7Z" /></svg
            ><span>Vídeo em breve</span>
            <p>{{ step.caption }}</p>
          </div>
        </figure>
      </section>

      <div class="guide-end">
        <p>
          Para fechar o painel, clique no botão de fechar, no canto superior direito. Abra o Chat
          novamente quando quiser voltar à conversa.
        </p>
        <GooeyButton to="/projetos" size="lg"
          >Abrir meus projetos <FlaticonIcon name="arrow-up-right" :size="14" /></GooeyButton
        >
      </div>
    </main>
    <SiteFooter blend-from-black />
  </div>
</template>

<style scoped>
.chat-guide {
  --lp-orange: #e56515;
  --lp-orange-soft: #fba45c;
  --lp-grey: #919599;
  --lp-grey-light: #cdcdcb;
  --lp-white: #f8f8f8;
  --lp-display: 'Lexend', 'Geist', system-ui, sans-serif;
  --lp-sans: 'Geist', 'Helvetica Neue', system-ui, sans-serif;
  background: #000;
  color: #f8f8f8;
  font-family: var(--lp-sans);
}
:global(html:has(.chat-guide)),
:global(html:has(.chat-guide) body) {
  background: #000;
}
h1,
h2,
p,
figure {
  margin: 0;
}
h1,
h2 {
  color: inherit;
}
.guide {
  width: min(1040px, calc(100% - 48px));
  margin: auto;
  padding: 150px 0 70px;
}
.intro {
  max-width: 700px;
  margin-bottom: 52px;
}
h1 {
  font:
    700 clamp(42px, 6vw, 72px)/1.04 'Inter',
    'Geist',
    system-ui,
    sans-serif;
  letter-spacing: -0.05em;
  margin-bottom: 24px;
}
h1 em {
  font:
    italic 400 1.06em/1.05 'Instrument Serif',
    Georgia,
    serif;
  letter-spacing: -0.05em;
}
p {
  color: #bfb5ac;
  line-height: 1.7;
  font-size: 16px;
}
section + section {
  margin-top: 54px;
}
.step-heading {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  margin-bottom: 24px;
}
h2 {
  font-size: 24px;
  line-height: 1.3;
  font-weight: 500;
  letter-spacing: -0.025em;
  margin-bottom: 10px;
}
.step-heading p {
  max-width: 800px;
}
strong {
  font-weight: 500;
  color: #f8f8f8;
}
.video-placeholder,
video {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  border: 1px solid #ffffff20;
  border-radius: 12px;
  background: #080706;
}
.video-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 24px;
  text-align: center;
  border-style: dashed;
}
.video-placeholder svg {
  width: 48px;
  fill: none;
  stroke: #a8754d;
  stroke-width: 1.2;
}
.video-placeholder > span {
  color: #cdb29d;
  font-size: 15px;
}
.video-placeholder p {
  color: #897d73;
  font-size: 13px;
  max-width: 340px;
}
.guide-end p {
  font-size: 14px;
}
.guide-end {
  border-top: 1px solid #ffffff20;
  margin-top: 32px;
  padding-top: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
}
.guide-end p {
  max-width: 590px;
}
.guide-end > :last-child {
  flex-shrink: 0;
}
@media (max-width: 640px) {
  .guide {
    width: calc(100% - 32px);
    padding-top: 110px;
    padding-bottom: 42px;
  }
  .intro {
    margin-bottom: 36px;
  }
  .step-heading {
    gap: 12px;
  }
  h2 {
    font-size: 21px;
  }
  p {
    font-size: 15px;
  }
  .video-placeholder {
    gap: 8px;
    padding: 16px;
  }
  .video-placeholder svg {
    width: 32px;
  }
  .video-placeholder p {
    font-size: 12px;
  }
  .guide-end {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
}
</style>
