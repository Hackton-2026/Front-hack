<script setup>
import { vTutorialMotion } from '../utils/tutorialMotion'
import SiteNav from '../components/landing/SiteNav.vue'
import SiteFooter from '../components/landing/SiteFooter.vue'
import GooeyButton from '../components/GooeyButton.vue'
import FlaticonIcon from '../components/FlaticonIcon.vue'

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
  <div id="topo" v-tutorial-motion class="tutorial-page automacoestutorial-guide">
    <SiteNav />
    <main class="guide">
      <header class="intro">
        <h1>Como funcionam as<br /><em>automações</em></h1>
        <p>
          Exemplos de rotinas com a Novexo IA: programar a criação de uma tarefa ou iniciar outra
          quando uma etapa terminar.
        </p>
      </header>

      <p class="availability">Em preparação. Exemplos do fluxo previsto.</p>

      <section
        v-for="(step, index) in steps"
        :key="step.title"
        :aria-labelledby="`automacoestutorial-step-${index}`"
      >
        <div class="step-heading">
          <span class="step-number">{{ String(index + 1).padStart(2, '0') }}</span>
          <div>
            <h2 :id="`automacoestutorial-step-${index}`">{{ step.title }}</h2>
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
          Esses exemplos mostram o fluxo planejado. O agendamento e a criação por evento ainda não
          estão disponíveis nesta versão.
        </p>
        <GooeyButton to="/ia" size="lg"
          >Abrir a Novexo IA <FlaticonIcon name="arrow-up-right" :size="14" /></GooeyButton
        >
      </div>
    </main>
    <SiteFooter blend-from-black />
  </div>
</template>

<style scoped>
.automacoestutorial-guide {
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
:global(html:has(.automacoestutorial-guide)),
:global(html:has(.automacoestutorial-guide) body) {
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
.availability {
  margin-bottom: 28px;
  padding: 12px 16px;
  border: 1px solid #e5651540;
  border-radius: 8px;
  font-size: 13px;
  color: #fba45c;
}
</style>
