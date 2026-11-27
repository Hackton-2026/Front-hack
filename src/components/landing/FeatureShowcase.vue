<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import GooeyButton from '../GooeyButton.vue'
import { prefersReducedMotion } from '../../utils/motion'
import { useAuth } from '../../composables/useAuth'

const { user } = useAuth()

defineProps({
  feature: { type: Object, required: true },
  reverse: Boolean,
})

const video = ref(null)
const parado = prefersReducedMotion()

const ESPERA = 400
const PAUSA_FIM = 2000
let esperaTimer = 0
let recomeco = 0
let jaComecou = false
let naTela = false
let observer

const play = () => video.value?.play().catch(() => {})
function sair() {
  clearTimeout(esperaTimer)
  clearTimeout(recomeco)
  naTela = false
  jaComecou = false
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
onMounted(() => {
  const el = video.value
  if (!el) return
  el.muted = true
  if (parado || !('IntersectionObserver' in window)) return
  observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) {
        if (naTela) sair()
        return
      }
      naTela = true
      if (jaComecou) return
      if (entry.intersectionRatio >= 0.6) {
        clearTimeout(esperaTimer)
        esperaTimer = setTimeout(() => {
          if (!naTela) return
          jaComecou = true
          play()
        }, ESPERA)
      }
    },
    { threshold: [0, 0.6] },
  )
  observer.observe(el)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  clearTimeout(esperaTimer)
  clearTimeout(recomeco)
})
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
          preload="metadata"
          aria-hidden="true"
          @ended="terminou"
        />
      </template>
      <div v-else class="feat__slot" aria-hidden="true" />
    </div>
  </article>
</template>

<style scoped>
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
