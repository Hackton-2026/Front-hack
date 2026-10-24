<script setup>
import { vTutorialMotion } from '../utils/tutorialMotion'
import SiteNav from '../components/landing/SiteNav.vue'
import SiteFooter from '../components/landing/SiteFooter.vue'
import GooeyButton from '../components/GooeyButton.vue'

// Preencha com o caminho da gravação quando o vídeo estiver pronto.
const video = ''
</script>

<template>
  <div id="topo" v-tutorial-motion class="tutorial-page design-guide">
    <SiteNav />
    <main class="guide">
      <header class="intro">
        <p class="label">SOLUÇÕES / DESIGN</p>
        <h1>Novexo para<br /><em>designers</em></h1>
        <p>
          Reúna o briefing, as referências visuais e os arquivos de uma entrega na mesma tarefa.
          Você pode adicionar imagens para mostrar uma proposta, registrar uma versão ou explicar um
          ajuste, junto dos responsáveis e do prazo.
        </p>
      </header>

      <section aria-labelledby="images-heading">
        <div class="image-description">
          <h2 id="images-heading">Referências e arquivos do projeto</h2>
          <p>
            Uma referência ou uma prévia do layout ajuda a explicar o que precisa ser feito. O vídeo
            abaixo vai mostrar como adicionar imagens a uma tarefa e consultar esse material durante
            o trabalho.
          </p>
        </div>
        <figure>
          <video
            v-if="video"
            :src="video"
            controls
            preload="metadata"
            playsinline
            aria-label="Adicionar imagens a uma tarefa"
          />
          <div
            v-else
            class="video-placeholder"
            role="img"
            aria-label="Espaço reservado para o vídeo de imagens nas tarefas"
          >
            <svg viewBox="0 0 48 48" aria-hidden="true">
              <rect x="3" y="7" width="42" height="34" rx="7" />
              <path d="m20 17 12 7-12 7Z" />
            </svg>
            <span>Vídeo em breve</span>
            <p>Adicionar e visualizar imagens em uma tarefa</p>
          </div>
        </figure>
      </section>

      <div class="guide-end">
        <p>
          Use o projeto para reunir as entregas de design e acompanhar o que está em criação, em
          revisão ou concluído.
        </p>
        <GooeyButton to="/projetos" size="lg"
          >Abrir meus projetos <span aria-hidden="true">↗</span></GooeyButton
        >
      </div>
    </main>
    <SiteFooter />
  </div>
</template>

<style scoped>
.design-guide {
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
:global(html:has(.design-guide)),
:global(html:has(.design-guide) body) {
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

h2 {
  font-size: 24px;
  line-height: 1.3;
  font-weight: 500;
  letter-spacing: -0.025em;
  margin-bottom: 10px;
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

  .guide-end {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
}

.image-description {
  margin-bottom: 24px;
}
.image-description p {
  max-width: 800px;
}
</style>
