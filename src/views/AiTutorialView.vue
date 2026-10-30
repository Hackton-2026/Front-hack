<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { prefersReducedMotion } from '../utils/motion'
import { vTutorialMotion } from '../utils/tutorialMotion'
import SiteNav from '../components/landing/SiteNav.vue'
import SiteFooter from '../components/landing/SiteFooter.vue'
import GooeyButton from '../components/GooeyButton.vue'
import FlaticonIcon from '../components/FlaticonIcon.vue'
import workspaceImage from '../assets/product/novexo-ia-workspace.png'

const screenshot = ref(null)
const cursorVisible = ref(false)
const replay = ref(0)
let observer
onMounted(() => {
  if (prefersReducedMotion()) return
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        cursorVisible.value = true
        observer.disconnect()
      }
    },
    { threshold: 0.45 }
  )
  observer.observe(screenshot.value)
})
onUnmounted(() => observer?.disconnect())

const prompts = [
  'Resuma minhas tarefas desta semana',
  'O que está atrasado e quem é o responsável?',
  'Crie uma tarefa para revisar o contrato amanhã',
]
const selectedPrompt = ref(prompts[0])
</script>

<template>
  <div id="topo" v-tutorial-motion class="tutorial-page ai-guide">
    <SiteNav />
    <main class="guide">
      <header class="intro">
        <h1>Como usar a<br /><em>Novexo IA</em></h1>
        <p>
          Use a IA para consultar suas tarefas, pedir um resumo ou atualizar o trabalho pelo chat.
        </p>
      </header>

      <section aria-labelledby="open-heading">
        <div class="step-heading">
          <span class="step-number">01</span>
          <div>
            <h2 id="open-heading">Abra a página da IA</h2>
            <p>
              Entre no workspace e clique em <strong>IA</strong> na barra lateral. Você vai
              encontrar o campo de mensagem e algumas sugestões de pedidos.
            </p>
          </div>
        </div>
        <figure class="workspace-figure">
          <div ref="screenshot" class="screenshot">
            <img
              :src="workspaceImage"
              alt="Página da Novexo IA: o botão IA fica na barra lateral esquerda e o campo de mensagem fica no centro."
              width="1920"
              height="1047"
              fetchpriority="high"
            />
            <div
              :key="replay"
              class="cursor-demo"
              :class="{ 'is-playing': cursorVisible }"
              aria-hidden="true"
            >
              <span class="ia-highlight" />
              <span class="click-ring" />
              <svg class="demo-cursor" viewBox="0 0 28 34">
                <path
                  d="M3 2v26l7-7 5 10 5-3-5-10h10Z"
                  fill="#fff"
                  stroke="#21170f"
                  stroke-width="1.7"
                  stroke-linejoin="round"
                />
              </svg>
              <span class="cursor-label">Clique em IA</span>
            </div>
          </div>
          <div class="shot-caption">
            <button v-if="cursorVisible" type="button" @click="replay++">
              Rever animação <FlaticonIcon name="rotate-right" :size="13" />
            </button>
          </div>
        </figure>
      </section>

      <section aria-labelledby="prompt-heading">
        <div class="step-heading">
          <span class="step-number">02</span>
          <div>
            <h2 id="prompt-heading">Escreva o que você precisa</h2>
            <p>
              Digite um pedido no campo de mensagem e pressione <kbd>Enter</kbd> para enviar. Para
              pular uma linha, use <kbd>Shift</kbd> + <kbd>Enter</kbd>.
            </p>
          </div>
        </div>
        <figure class="prompt-figure">
          <div class="prompt-preview">
            <div class="composer">
              <Transition name="prompt" mode="out-in"
                ><p :key="selectedPrompt">{{ selectedPrompt }}</p></Transition
              >
              <div class="composer-bottom">
                <span>↵ enviar, ⇧ ↵ nova linha</span
                ><span class="send-icon" aria-hidden="true"
                  ><FlaticonIcon name="arrow-up-right" :size="16"
                /></span>
              </div>
            </div>
          </div>
        </figure>
        <div class="examples">
          <p>Outros pedidos que você pode testar:</p>
          <div class="prompt-options">
            <button
              v-for="prompt in prompts"
              :key="prompt"
              type="button"
              :aria-pressed="selectedPrompt === prompt"
              @click="selectedPrompt = prompt"
            >
              {{ prompt }}
            </button>
          </div>
        </div>
        <p class="note">
          Para criar ou alterar uma tarefa, informe o nome e os detalhes necessários, como projeto e
          prazo. Se aparecer uma confirmação, revise o pedido e escolha
          <strong>Confirmar</strong> ou <strong>Cancelar</strong>.
        </p>
      </section>

      <div class="guide-end">
        <p>Você pode continuar a conversa para fazer outra pergunta ou detalhar o pedido.</p>
        <GooeyButton to="/ia" size="lg"
          >Abrir a Novexo IA <FlaticonIcon name="arrow-up-right" :size="14" /></GooeyButton
        >
      </div>
    </main>
    <SiteFooter blend-from-black />
  </div>
</template>

<style scoped>
.ai-guide {
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
:global(html:has(.ai-guide)),
:global(html:has(.ai-guide) body) {
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
  max-width: 760px;
}
strong {
  font-weight: 500;
  color: #f8f8f8;
}
.screenshot {
  position: relative;
  overflow: hidden;
  aspect-ratio: 1920 / 926;
  border: 1px solid #ffffff25;
  border-radius: 12px;
  background: #000;
}
.screenshot img {
  display: block;
  width: 100%;
  height: auto;
  max-width: none;
  margin-top: -6.3021%;
}
kbd {
  padding: 2px 5px;
  border: 1px solid #ffffff26;
  border-radius: 4px;
  font:
    12px 'Geist Mono',
    monospace;
  color: #e4dcd4;
  white-space: nowrap;
}
.prompt-preview {
  padding: 42px clamp(20px, 6vw, 90px);
  border: 1px solid #ffffff20;
  border-radius: 12px;
  background: #060504;
}
.composer {
  padding: 20px;
  border: 1px solid #fba45c50;
  border-radius: 16px;
  background: #181613;
}
.composer p {
  min-height: 54px;
  color: #eee7df;
  font-size: 15px;
}
.composer-bottom {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
  color: #9e948a;
  font-size: 11px;
}
.send-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #e56515;
  color: #000;
  font-size: 18px;
}
.examples {
  margin-top: 24px;
}
.examples > p {
  font-size: 14px;
  margin-bottom: 12px;
}
.prompt-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.prompt-options button {
  border: 1px solid #ffffff25;
  border-radius: 20px;
  background: transparent;
  color: #c9bfb5;
  padding: 9px 14px;
  font: inherit;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  line-height: 1.5;
}
.prompt-options button[aria-pressed='true'],
.prompt-options button:hover {
  border-color: #e5651580;
  color: #fba45c;
  background: #e565150d;
}
button:focus-visible,
a:focus-visible {
  outline: 2px solid #fba45c;
  outline-offset: 4px;
}
.note {
  font-size: 14px;
  margin-top: 24px;
  max-width: 790px;
}
.guide-end {
  border-top: 1px solid #ffffff20;
  margin-top: 42px;
  padding-top: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
}
.guide-end p {
  max-width: 540px;
  font-size: 14px;
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
  .prompt-preview {
    padding: 26px 16px;
  }
  .composer {
    padding: 16px;
  }
  .composer-bottom {
    gap: 10px;
  }
  .guide-end {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
}

.cursor-demo {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.demo-cursor {
  position: absolute;
  left: 65%;
  top: 62%;
  width: clamp(19px, 2.7vw, 30px);
  height: auto;
  opacity: 0;
  filter: drop-shadow(0 3px 5px #0009);
}
.ia-highlight {
  position: absolute;
  left: 0.68%;
  top: 21.7%;
  width: 2.1%;
  height: 4.5%;
  border: 1.5px solid #fba45c;
  border-radius: 5px;
  opacity: 0;
}
.click-ring {
  position: absolute;
  left: 1.67%;
  top: 23.9%;
  width: 32px;
  aspect-ratio: 1;
  border: 2px solid #fba45c;
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0.3);
  opacity: 0;
}
.cursor-label {
  position: absolute;
  left: 5%;
  top: 23%;
  padding: 7px 11px;
  border: 1px solid #fba45c60;
  border-radius: 7px;
  background: #20160eee;
  color: #ffcfaa;
  font-size: clamp(11px, 1.1vw, 13px);
  opacity: 0;
}
.is-playing .demo-cursor {
  animation: cursor-travel 4.8s cubic-bezier(0.22, 1, 0.36, 1) 0.5s both;
}
.is-playing .ia-highlight {
  animation: target-reveal 4.8s ease 0.5s both;
}
.is-playing .click-ring {
  animation: click-pulse 1s ease-out 2.5s both;
}
.is-playing .cursor-label {
  animation: target-reveal 4.8s ease 0.5s both;
}
@keyframes cursor-travel {
  0% {
    opacity: 0;
    left: 65%;
    top: 62%;
  }
  10% {
    opacity: 1;
  }
  50%,
  62% {
    opacity: 1;
    left: 1.67%;
    top: 23.9%;
    transform: scale(1);
  }
  56% {
    transform: scale(0.83);
  }
  78%,
  100% {
    opacity: 0;
    left: 1.67%;
    top: 23.9%;
  }
}
@keyframes target-reveal {
  0%,
  37% {
    opacity: 0;
  }
  48%,
  84% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
@keyframes click-pulse {
  0% {
    opacity: 0.9;
    transform: translate(-50%, -50%) scale(0.3);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(2);
  }
}
.shot-caption {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.shot-caption button {
  background: transparent;
  border: 0;
  padding: 5px 0;
  font: inherit;
  color: #e1aa7b;
  cursor: pointer;
}
.shot-caption button:hover {
  color: #ffd0a9;
}
.prompt-enter-active,
.prompt-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.3s ease;
}
.prompt-enter-from {
  opacity: 0;
  transform: translateY(7px);
  filter: blur(3px);
}
.prompt-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
.prompt-options button {
  transition:
    border-color 0.25s,
    background 0.25s,
    color 0.25s,
    transform 0.25s;
}
.prompt-options button:hover {
  transform: translateY(-2px);
}
@media (prefers-reduced-motion: reduce) {
  .cursor-demo {
    display: none;
  }
  .shot-caption button {
    display: none;
  }
  .prompt-enter-active,
  .prompt-leave-active,
  .prompt-options button {
    transition: none;
  }
  .prompt-options button:hover {
    transform: none;
  }
}
</style>
