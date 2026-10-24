<script setup>
// Um recurso da landing: texto de um lado e o motion design do outro (como os blocos do leonardo.ai).
// O motion é um vídeo exportado do projeto video-intro (1100×948, fundo preto, cartão com cantos redondos já no vídeo),
// então aqui ele não ganha borda nem fundo: encosta no preto da página. Até o bloco aparecer inteiro na tela ele fica
// parado no primeiro quadro (preload="auto" já carrega esse quadro); aí toca mudo e, ao terminar, espera 2 s e recomeça.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import GooeyButton from '../GooeyButton.vue'
import { prefersReducedMotion } from '../../utils/motion'
import { useAuth } from '../../composables/useAuth'

const { user } = useAuth() // logado: "Começar agora" vai direto para o workspace, como o botão da nav

const props = defineProps({
  feature: { type: Object, required: true }, // { id, title, text, more, motion, poster }
  reverse: Boolean, // motion à esquerda e texto à direita
})

const video = ref(null)
const parado = prefersReducedMotion() // quem desligou animações no sistema vê só o primeiro quadro

// Só começa depois de o motion ficar 0,5 s seguido inteiro na tela (≥ 95% dele visível, ou ocupando quase a altura
// toda da janela quando ele é maior que ela). Confere a posição a cada 150 ms em vez de esperar avisos do
// IntersectionObserver, que só chegam quando ele cruza uma marca (rolando devagar dá para ficar inteiro sem aviso).
const ESPERA = 500
const PAUSA_FIM = 2000 // terminou: fica no último quadro esse tempo e recomeça do início
let checagem = 0
let recomeco = 0
let inteiroDesde = 0
let jaComecou = false // já começou desde que apareceu: daqui em diante quem manda é o recomeço depois do fim
let naTela = false

const play = () => video.value?.play().catch(() => {}) // autoplay bloqueado: fica no primeiro quadro
function sair() {
  clearTimeout(recomeco)
  naTela = false
  jaComecou = false
  inteiroDesde = 0
  if (!video.value) return
  video.value.pause()
  video.value.currentTime = 0
}
function terminou() {
  clearTimeout(recomeco)
  recomeco = setTimeout(() => {
    if (!naTela || !video.value) return
    video.value.currentTime = 0
    play()
  }, PAUSA_FIM)
}
function conferir() {
  const el = video.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const visivel = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)
  if (visivel <= 0) { // saiu da tela: volta para o 1º quadro e espera aparecer de novo
    if (naTela) sair()
    return
  }
  naTela = true
  if (parado || jaComecou) return
  const inteiro = visivel >= r.height * 0.95 || visivel >= innerHeight * 0.9
  if (!inteiro) { inteiroDesde = 0; return }
  inteiroDesde ||= performance.now()
  if (performance.now() - inteiroDesde >= ESPERA) { jaComecou = true; play() }
}
onMounted(() => {
  if (!video.value) return
  video.value.muted = true // garante o autoplay mudo mesmo se o atributo não chegar no elemento
  checagem = setInterval(conferir, 150)
})
onBeforeUnmount(() => { clearInterval(checagem); clearTimeout(recomeco) })
</script>

<template>
  <article class="feat" :class="{ 'feat--reverse': reverse }" :aria-labelledby="`feat-${feature.id}`">
    <div v-reveal.stagger class="feat__copy">
      <h2 :id="`feat-${feature.id}`" class="feat__title">{{ feature.title }}</h2>
      <p class="feat__text">{{ feature.text }}</p>
      <div class="feat__actions">
        <GooeyButton variant="primary" size="lg" :to="user ? '/inicio' : '/login'">Começar agora</GooeyButton>
        <GooeyButton variant="secondary" size="lg" :to="feature.more">Saiba mais</GooeyButton>
      </div>
    </div>

    <div v-reveal class="feat__media">
      <template v-if="feature.motion">
        <video
          ref="video"
          class="feat__video"
          :src="feature.motion"
          :poster="feature.poster || undefined"
          muted
          playsinline
          preload="auto"
          aria-hidden="true"
          @ended="terminou"
        />
      </template>
      <div v-else class="feat__slot" aria-hidden="true" />
    </div>
  </article>
</template>

<style scoped>
/* proporção do leonardo.ai: o texto ocupa ~1/3 numa borda, o motion ~metade na outra e sobra um vão grande no meio */
.feat {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
  align-items: center;
  gap: clamp(2.5rem, 9vw, 12rem);
}
.feat--reverse { grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); }
.feat--reverse .feat__copy { order: 2; justify-self: end; }
.feat__copy { display: flex; flex-direction: column; align-items: flex-start; gap: clamp(1rem, 1.4vw, 1.5rem); max-width: 38rem; }
.feat__title {
  margin: 0;
  font: 900 clamp(2.25rem, 3.6vw, 4.25rem)/0.94 var(--lp-display);
  text-transform: uppercase;
  letter-spacing: -0.025em;
  color: var(--lp-white);
  text-wrap: balance;
}
.feat__text { margin: 0; max-width: 36rem; font: 400 clamp(1.0625rem, 1.3vw, 1.4rem)/1.45 var(--lp-sans); color: rgb(248 248 248 / 0.8); text-wrap: pretty; }
.feat__actions { display: flex; flex-wrap: wrap; gap: 0.875rem; margin-top: clamp(1rem, 2vw, 2rem); }
.feat__actions :deep(.gb__btn) { min-height: clamp(3.25rem, 3.6vw, 3.75rem); padding-inline: clamp(1.5rem, 1.8vw, 2rem); font-size: clamp(1rem, 1.05vw, 1.125rem); }

/* o motion: mesma proporção do vídeo do video-intro, sem borda (o cartão redondo já vem desenhado no vídeo) */
/* 5% menor que a coluna, encostado na borda de fora (direita; esquerda nos blocos invertidos) */
.feat__media { position: relative; width: 95%; justify-self: end; aspect-ratio: 1100 / 948; }
.feat--reverse .feat__media { justify-self: start; }
.feat__video { display: block; width: 100%; height: 100%; object-fit: cover; background: #000; }
.feat__slot { width: 100%; height: 100%; border-radius: clamp(16px, 2.6vw, 28px); background: #0f0f0f; border: 1px solid rgb(255 255 255 / 0.06); }

@media (max-width: 860px) {
  .feat, .feat--reverse { grid-template-columns: 1fr; gap: 2rem; }
  .feat--reverse .feat__copy { order: 0; justify-self: start; }
  .feat__media, .feat--reverse .feat__media { justify-self: center; }
}
</style>
