<script setup>
// Hero do Novexo (estrutura do supaste.com): céu → montanhas distantes → texto → montanha de trás → montanha da frente.
// Parallax: cada camada sobe numa velocidade (céu/fundo 0.08, montanha de trás 0.22, da frente 0.42) enquanto o
// hero está preso na tela; o texto desce e some atrás do cume.
import { ref, onMounted, onUnmounted } from 'vue'
import { gsap, prefersReducedMotion } from '../../utils/motion'
import GooeyButton from '../GooeyButton.vue'
import hillFar from '../../assets/landing/hero-fundo.webp'
import hillBack from '../../assets/landing/hero-tras.webp'
import hillFront from '../../assets/landing/hero-frente.webp'

// Título: linha sans pesada + linha serif itálica, animadas letra a letra
const HERO_LINES = [
  { text: 'Planeje uma vez.', serif: false },
  { text: 'Entregue sempre.', serif: true },
]
const words = (t) => t.split(' ').map((w) => [...w])

const hero = ref(null)
let frame = 0
function parallax() {
  frame = 0
  const el = hero.value
  if (!el) return
  const s = Math.min(Math.max(-el.getBoundingClientRect().top, 0), el.offsetHeight - innerHeight)
  el.querySelectorAll('[data-speed]').forEach((layer) => {
    layer.style.transform = `translate3d(0, ${(-s * layer.dataset.speed).toFixed(1)}px, 0)`
  })
  el.style.setProperty('--text-fade', Math.max(0, 1 - s / (innerHeight * 0.55)).toFixed(3))
}
const onScroll = () => { frame ||= requestAnimationFrame(parallax) }

let ctx
onMounted(() => {
  if (prefersReducedMotion()) return
  parallax()
  addEventListener('scroll', onScroll, { passive: true })
  addEventListener('resize', onScroll)
  ctx = gsap.context(() => {
    // cada letra sobe 10px saindo de blur(10px); depois texto, botão e notas descem de -30px
    gsap.from('.hero__char', { y: 10, opacity: 0, filter: 'blur(10px)', duration: 1, ease: 'expo.out', stagger: 0.045, delay: 0.15 })
    gsap.from('.hero__lead, .hero__cta, .hero__notes', { y: -30, opacity: 0, duration: 0.8, ease: 'expo.out', stagger: 0.08, delay: 1.6 })
  }, hero.value)
})
onUnmounted(() => {
  ctx?.revert()
  removeEventListener('scroll', onScroll)
  removeEventListener('resize', onScroll)
  cancelAnimationFrame(frame)
})
</script>

<template>
  <section ref="hero" class="hero">
    <div class="hero__stick">
      <div class="hero__sky" data-speed="0.08" aria-hidden="true" />
      <div class="hero__hill far" data-speed="0.08" aria-hidden="true"><img :src="hillFar" alt="" /></div>
      <div class="hero__inner" data-speed="-0.18">
        <h1 class="hero__title" :aria-label="HERO_LINES.map((l) => l.text).join(' ')">
          <span v-for="l in HERO_LINES" :key="l.text" class="hero__line" :class="{ serif: l.serif }" aria-hidden="true">
            <span v-for="(w, wi) in words(l.text)" :key="wi" class="hero__word"><span v-for="(c, ci) in w" :key="ci" class="hero__char">{{ c }}</span></span>
          </span>
        </h1>
        <p class="hero__lead">O Novexo reúne tarefas, quadros, metas e conversas do seu time num só lugar, organizados por projeto, responsável e prioridade, para todo mundo saber o que fazer agora.</p>
        <GooeyButton variant="dark" size="lg" to="/login" class="hero__cta">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></svg>
          Começar grátis
        </GooeyButton>
        <ul class="hero__notes">
          <li>Grátis para sempre</li>
          <li>Sem cartão de crédito</li>
          <li>Web, iOS e Android</li>
        </ul>
      </div>
      <div class="hero__hill back" data-speed="0.22" aria-hidden="true"><img :src="hillBack" alt="" /></div>
      <div class="hero__hill front" data-speed="0.42" aria-hidden="true"><img :src="hillFront" alt="" /></div>
    </div>
  </section>
</template>

<style scoped>
.hero { position: relative; height: 200vh; height: 200svh; }
.hero__stick { position: sticky; top: 0; height: 100vh; height: 100svh; overflow: hidden; background: #000; }
.hero__sky, .hero__hill, .hero__inner { will-change: transform; }
/* Céu de fim de tarde no tom da grama dourada: escuro no topo, laranja no meio, luz difusa no horizonte */
.hero__sky {
  position: absolute;
  inset: 0 0 -12%;
  background:
    radial-gradient(ellipse 55% 32% at 62% 74%, rgb(255 222 160 / 0.8), transparent 70%),
    radial-gradient(ellipse 90% 40% at 50% 80%, rgb(251 164 92 / 0.55), transparent 75%),
    linear-gradient(180deg, #140803 0%, #3a1505 20%, #82310a 40%, #d2600f 56%, #f39243 68%, #ffc07a 78%, #ffdcaa 86%);
}
.hero__hill { position: absolute; left: 50%; top: 76vh; top: 76svh; width: max(100%, 165vh); aspect-ratio: 1024 / 341; translate: -50% 0; }
.hero__hill img { display: block; width: 100%; height: 100%; }
.hero__hill.far { z-index: 1; mask-image: linear-gradient(180deg, transparent 0%, #000 55%); }
.hero__hill.back { z-index: 3; }
.hero__hill.front { z-index: 4; }
.hero__hill.front img { translate: 0 -0.7%; } /* a crista fica ~3px acima da emenda da camada de trás */
/* Base da montanha da frente funde com o preto do site; o chão preto embaixo cobre o espaço quando ela sobe */
.hero__hill.front::after { content: ''; position: absolute; inset: 50% 0 0; background: linear-gradient(180deg, transparent, #000); }
.hero__hill.front::before { content: ''; position: absolute; top: calc(100% - 1px); left: 0; right: 0; height: 120vh; background: #000; }
@media (max-width: 640px) { .hero__hill { top: 82svh; } }

.hero__inner { position: absolute; inset: 0 0 auto; z-index: 2; display: flex; flex-direction: column; align-items: center; max-width: 52rem; margin: 0 auto; padding: 8.75rem 1.25rem 0; text-align: center; opacity: var(--text-fade, 1); }
.hero__title { display: flex; flex-direction: column; margin: 0 0 1.75rem; color: #fff; }
.hero__line { font: 700 clamp(3rem, 8vw, 5rem)/1 var(--lp-hero); letter-spacing: -0.05em; }
.hero__line.serif { font: italic 400 clamp(3.1rem, 8.4vw, 5.3rem)/1 'Instrument Serif', Georgia, serif; letter-spacing: -0.05em; }
.hero__word { display: inline-block; white-space: nowrap; }
.hero__word + .hero__word { margin-left: 0.25em; }
.hero__char { display: inline-block; will-change: transform, filter, opacity; }
.hero__lead { max-width: 38rem; margin: 0 0 2.25rem; font: 400 clamp(1.05rem, 1.6vw, 1.25rem)/1.4 var(--lp-hero); letter-spacing: -0.01em; color: #fff; text-wrap: balance; }
.hero__cta svg { width: 18px; height: 18px; fill: currentColor; }
.hero__notes { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem 1.25rem; margin: 1.75rem 0 0; padding: 0; list-style: none; font: 400 0.8125rem/1 var(--lp-hero); color: rgb(255 255 255 / 0.7); }
</style>
