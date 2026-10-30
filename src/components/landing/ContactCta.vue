<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { EASE, DUR, gsap, prefersReducedMotion } from '../../utils/motion'
import GooeyButton from '../GooeyButton.vue'

const root = ref(null)
let tween
onMounted(() => {
  if (prefersReducedMotion()) return
  tween = gsap.from(root.value.querySelector('.cta__card'), { y: 60, opacity: 0, duration: DUR.enter, ease: EASE.expo, scrollTrigger: { trigger: root.value, start: 'top 75%', once: true } })
})
onUnmounted(() => { tween?.scrollTrigger?.kill(); tween?.kill() })
</script>

<template>
  <section id="contato" ref="root" class="cta">
    <div class="cta__card">
      <div class="cta__content">
        <h2 class="cta__title">Fale com a gente antes do próximo sprint.</h2>
        <div class="cta__btns">
          <GooeyButton variant="primary" size="lg" to="/contato?assunto=comercial">
            Agendar demo
            <svg class="cta__arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.47 19.53a.75.75 0 0 1 0-1.06l5.72-5.72H4a.75.75 0 0 1 0-1.5h14.19l-5.72-5.72a.75.75 0 0 1 1.06-1.06l7 7a.75.75 0 0 1 0 1.06l-7 7c-.3.3-.77.3-1.06 0Z" /></svg>
          </GooeyButton>
          <GooeyButton variant="secondary" size="lg" to="/login">Começar agora</GooeyButton>
        </div>
      </div>
      <svg class="cta__media" viewBox="0 0 500 420" aria-hidden="true">
        <defs>
          <linearGradient id="glass1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.85" /><stop offset="0.5" stop-color="#FBA45C" stop-opacity="0.55" /><stop offset="1" stop-color="#E56515" stop-opacity="0.15" /></linearGradient>
          <linearGradient id="glass2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBA45C" stop-opacity="0.7" /><stop offset="1" stop-color="#7a3008" stop-opacity="0.2" /></linearGradient>
        </defs>
        <g class="cta__ribbon r1"><path d="M190 -10 L250 -10 L290 300 L230 300 Z" fill="url(#glass1)" /></g>
        <g class="cta__ribbon r2"><path d="M400 20 L460 60 L300 360 L250 320 Z" fill="url(#glass2)" /></g>
        <g fill="none" stroke="#2a1306" stroke-width="1.6" stroke-linejoin="round">
          <path d="M120 120 L300 90 L430 140 L250 175 Z" /><path d="M120 120 L120 320 L250 370 L250 175" /><path d="M250 370 L430 330 L430 140" />
          <path d="M120 320 L300 290 L430 330" stroke-dasharray="4 5" opacity="0.6" /><path d="M300 90 L300 290" stroke-dasharray="4 5" opacity="0.6" />
        </g>
        <g class="cta__ribbon r3"><path d="M150 330 L330 300 L360 360 L180 400 Z" fill="url(#glass1)" /></g>
      </svg>
    </div>
  </section>
</template>

<style scoped>
.cta { padding: clamp(4rem, 9vw, 7rem) clamp(1rem, 3vw, 2rem); background: linear-gradient(180deg, var(--lp-orange-soft) 0%, var(--lp-orange) 100%); }
.cta__card {
  --inset: clamp(1.5rem, 5vw, 5rem);
  --media: calc((100% - var(--inset)) / 2);
  position: relative;
  display: flex;
  flex-direction: column;
  max-width: 80rem;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 16px;
  background: linear-gradient(180deg, #c4520d 0%, #7a3008 100%);
  color: var(--lp-white);
}
.cta__content { display: flex; flex-direction: column; align-items: flex-start; gap: 2rem; padding: 2.5rem 1.5rem 1.5rem; }
.cta__title { margin: 0; max-width: 40rem; color: var(--lp-white); font: 700 clamp(2rem, 4vw, 3.5rem)/1 var(--lp-display); letter-spacing: -0.02em; text-wrap: balance; }
.cta__btns { display: flex; flex-wrap: wrap; gap: 1rem; }
.cta__media { width: 100%; height: auto; max-height: 320px; }
@media (min-width: 1024px) {
  .cta__card { flex-direction: row; min-height: 23.5rem; }
  .cta__content { flex: 1; justify-content: center; padding: 4rem calc(var(--media) + 3rem) 4rem var(--inset); }
  .cta__media { position: absolute; right: 0; top: 50%; width: var(--media); max-height: none; translate: 0 -50%; }
}
.cta__ribbon { animation: float 7s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: center; }
.cta__ribbon.r2 { animation-duration: 9s; animation-delay: -3s; }
.cta__ribbon.r3 { animation-duration: 8s; animation-delay: -5s; }
@keyframes float { from { transform: translateY(-6px) rotate(-1deg); } to { transform: translateY(8px) rotate(1.5deg); } }

.cta__arrow { width: 16px; height: 16px; fill: currentColor; }

@media (prefers-reduced-motion: reduce) {
  .cta__ribbon { animation: none; }
}
</style>
