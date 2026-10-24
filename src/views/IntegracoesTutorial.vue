<script setup>
import { vTutorialMotion } from '../utils/tutorialMotion'
import SiteNav from '../components/landing/SiteNav.vue'
import SiteFooter from '../components/landing/SiteFooter.vue'
import GooeyButton from '../components/GooeyButton.vue'

// Adicione o caminho do vídeo em `video` quando a gravação estiver pronta.
// Os vídeos são exibidos com controles, sem reprodução automática.
const steps = [
  {
    title: 'Escolha a ferramenta',
    text: 'A proposta é reunir as conexões em Ajustes → Integrações. Google Meet e Discord são exemplos de ferramentas previstas para esse espaço.',
    caption: 'Escolher uma ferramenta para conectar',
    video: '',
  },
  {
    title: 'Conecte a conta',
    text: 'No fluxo previsto, você autoriza a conexão na ferramenta escolhida e revisa as permissões solicitadas. A conexão deve ser feita com a conta que você pretende usar no trabalho.',
    caption: 'Autorizar a conexão com uma conta externa',
    video: '',
  },
  {
    title: 'Defina como usar no projeto',
    text: 'Exemplos de uso a configurar são vincular reuniões do Google Meet ao projeto ou enviar avisos para um canal do Discord. Cada ferramenta terá suas próprias opções.',
    caption: 'Configurar o uso da integração no projeto',
    video: '',
  },
]
</script>

<template>
  <div id="topo" v-tutorial-motion class="tutorial-page integracoestutorial-guide">
    <SiteNav />
    <main class="guide">
      <header class="intro">
        <p class="label">PRODUTO / INTEGRAÇÕES</p>
        <h1>Como funcionam as<br /><em>integrações</em></h1>
        <p>
          Conexões com ferramentas externas, como Google Meet e Discord, para usar junto dos seus
          projetos.
        </p>
      </header>

      <p class="availability">Em preparação · Exemplos do fluxo previsto</p>

      <section
        v-for="(step, index) in steps"
        :key="step.title"
        :aria-labelledby="`integracoestutorial-step-${index}`"
      >
        <div class="step-heading">
          <span class="step-number">{{ String(index + 1).padStart(2, '0') }}</span>
          <div>
            <h2 :id="`integracoestutorial-step-${index}`">{{ step.title }}</h2>
            <p>{{ step.text }}</p>
          </div>
        </div>
        <figure>
          <video
            v-if="step.video"
            :src="step.video"
            controls
            preload="metadata"
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
          As conexões externas ainda não estão disponíveis nesta versão. Esta página apresenta os
          usos previstos; não realiza a conexão com Google Meet ou Discord.
        </p>
        <GooeyButton to="/ajustes" size="lg"
          >Abrir ajustes <span aria-hidden="true">↗</span></GooeyButton
        >
      </div>
    </main>
    <SiteFooter />
  </div>
</template>

<style scoped>
.integracoestutorial-guide {
  --lp-orange: #e56515;
  --lp-orange-soft: #fba45c;
  --lp-grey: #919599;
  --lp-grey-light: #cdcdcb;
  --lp-white: #f8f8f8;
  --lp-display: 'Lexend', 'Geist', system-ui, sans-serif;
  --lp-sans: 'Geist', 'Helvetica Neue', system-ui, sans-serif;
  background: #100e0c;
  color: #f8f8f8;
  font-family: var(--lp-sans);
}
:global(html:has(.integracoestutorial-guide)),
:global(html:has(.integracoestutorial-guide) body) {
  background: #100e0c;
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
.label {
  color: #fba45c;
  font-size: 11px;
  letter-spacing: 0.1em;
  margin-bottom: 18px;
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
figcaption {
  font-size: 12px;
  line-height: 1.5;
  color: #91867c;
  margin-top: 12px;
}
.views-note {
  margin-top: 42px;
  padding: 26px;
  border: 1px solid #e5651530;
  border-radius: 12px;
  background: #e5651509;
}
.views-note h2 {
  font-size: 20px;
}
.views-note p,
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
    font-size: 11px;
  }
  .views-note {
    padding: 20px;
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
