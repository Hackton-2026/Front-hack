<script setup>
import { vReveal } from '../utils/motion'
import SiteNav from '../components/landing/SiteNav.vue'
import SiteFooter from '../components/landing/SiteFooter.vue'
import GooeyButton from '../components/GooeyButton.vue'

// Adicione o caminho do vídeo em `video` quando a gravação estiver pronta.
// Os vídeos são exibidos com controles, sem reprodução automática.
const steps = [
  {
    title: 'Abra o calendário do projeto',
    text: 'Entre em um projeto, abra Itens de trabalho e clique na aba Calendário. Use as setas para trocar de mês e o botão Hoje para voltar ao mês atual.',
    caption: 'Abrir o calendário e navegar entre os meses',
    video: '',
  },
  {
    title: 'Crie uma tarefa com prazo',
    text: 'Clique em um espaço vazio no dia desejado para abrir o formulário de nova tarefa. O prazo já vem preenchido com essa data. Informe o título, confira o projeto e os demais campos e clique em Criar tarefa.',
    caption: 'Criar uma tarefa a partir de um dia do calendário',
    video: '',
  },
  {
    title: 'Altere as datas das tarefas',
    text: 'Arraste uma tarefa para outro dia para mudar o prazo. As tarefas sem prazo ficam no painel Sem data: arraste uma delas para o calendário para definir uma data. Você também pode clicar na tarefa e editar o prazo nos detalhes.',
    caption: 'Reagendar uma tarefa e definir prazos para itens sem data',
    video: '',
  },
]
</script>

<template>
  <div id="topo" class="calendar-guide">
    <SiteNav />
    <main class="guide">
      <header v-reveal.now.stagger class="intro">
        <p class="label">PRODUTO / CALENDÁRIO</p>
        <h1>Como usar o<br /><em>calendário</em></h1>
        <p>Veja os prazos das tarefas por dia e ajuste as datas dentro do projeto.</p>
      </header>

      <section
        v-for="(step, index) in steps"
        :key="step.title"
        :aria-labelledby="`calendariotutorial-step-${index}`"
      >
        <div v-reveal class="step-heading">
          <span class="step-number">{{ index + 1 }}</span>
          <div>
            <h2 :id="`calendariotutorial-step-${index}`">{{ step.title }}</h2>
            <p>{{ step.text }}</p>
          </div>
        </div>
        <figure v-reveal>
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
          <figcaption>{{ step.caption }}.</figcaption>
        </figure>
      </section>

      <div v-reveal class="guide-end">
        <p>
          Para remover o prazo de uma tarefa, arraste-a para o painel Sem data ou limpe o prazo nos
          detalhes. As alterações dependem das suas permissões.
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
.calendar-guide {
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
:global(html:has(.calendar-guide)),
:global(html:has(.calendar-guide) body) {
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
.step-number {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  background: #e5651520;
  border: 1px solid #e5651550;
  color: #fba45c;
  border-radius: 50%;
  font-size: 14px;
  margin-top: 2px;
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
</style>
