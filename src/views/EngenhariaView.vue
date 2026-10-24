<script setup>
import { vTutorialMotion } from '../utils/tutorialMotion'
import SiteNav from '../components/landing/SiteNav.vue'
import SiteFooter from '../components/landing/SiteFooter.vue'
import GooeyButton from '../components/GooeyButton.vue'

// Datas das atualizações obtidas no histórico de integração da dev.
const formatDate = (date) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(date))

const updates = [
  {
    category: 'Novidades',
    title: 'Visualizações e organização',
    text: 'Novo Gantt, seleção por dropdown, cargos e ícones da Flaticon.',
    date: '2026-10-23T19:56:14-03:00',
  },
  {
    category: 'Melhorias',
    title: 'Painel da tarefa',
    text: 'Painel completo da tarefa e barra de visualizações.',
    date: '2026-10-23T19:15:25-03:00',
  },
  {
    category: 'Correções',
    title: 'Kanban',
    text: 'Correções no funcionamento do Kanban.',
    date: '2026-10-23T19:56:14-03:00',
  },
]
</script>

<template>
  <div id="topo" v-tutorial-motion class="tutorial-page engineering-guide">
    <SiteNav />
    <main class="guide">
      <header class="intro">
        <p class="label">ENGENHARIA / ATUALIZAÇÕES</p>
        <h1>Atualizações<br /><em>do Novexo</em></h1>
        <p>Novidades, melhorias e bugs corrigidos. Confira as atualizações mais recentes.</p>
      </header>

      <section v-for="update in updates" :key="update.title" class="update-entry">
        <p class="label">{{ update.category }}</p>
        <h2>{{ update.title }}</h2>
        <p>{{ update.text }}</p>
        <small
          ><time :datetime="update.date">{{ formatDate(update.date) }}</time></small
        >
      </section>

      <div class="guide-end">
        <p>
          A disponibilidade depende da versão do Novexo em uso. Novas notas podem ser adicionadas
          conforme as atualizações forem publicadas.
        </p>
        <GooeyButton to="/inicio" size="lg"
          >Abrir o Novexo <span aria-hidden="true">↗</span></GooeyButton
        >
      </div>
    </main>
    <SiteFooter />
  </div>
</template>

<style scoped>
.engineering-guide {
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
:global(html:has(.engineering-guide)),
:global(html:has(.engineering-guide) body) {
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
.update-entry {
  padding: 28px 0;
  border-top: 1px solid #ffffff20;
}
.update-entry + .update-entry {
  margin-top: 0;
}
.update-entry small {
  display: block;
  margin-top: 16px;
  color: #91867c;
}
</style>
