<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { draw, prefersReducedMotion } from '../utils/motion'

/**
 * Traço contínuo "feito à mão" que se desenha sozinho (GSAP).
 * scrub = desenha acompanhando o scroll; sem scrub = desenha ao aparecer na tela.
 * Posicione com CSS no pai (ex.: position:absolute; inset:auto 0 0 0).
 */
const props = defineProps({
  scrub: Boolean,
  delay: { type: Number, default: 0 },
  duration: { type: Number, default: 2.4 },
  strokeWidth: { type: Number, default: 1.6 },
})

const path = ref()
let tween

onMounted(() => {
  if (prefersReducedMotion()) return
  tween = draw(path.value, {
    ease: props.scrub ? 'none' : 'power2.inOut',
    duration: props.duration,
    delay: props.delay,
    scrollTrigger: props.scrub
      ? { trigger: path.value, start: 'top 95%', end: 'bottom bottom', scrub: 1 }
      : { trigger: path.value, start: 'top 95%', once: true },
  })
})

defineExpose({ path }) // o pai pode ler a geometria do traço (ex.: para emendar outro traço nele)

onBeforeUnmount(() => {
  tween?.scrollTrigger?.kill()
  tween?.kill()
})
</script>

<template>
  <svg class="squiggle" viewBox="0 0 1440 320" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true">
    <path
      ref="path"
      d="M-40 200 C120 150 240 140 330 175 C506 303 234 303 410 175 C470 132 600 250 800 240 C960 232 1060 160 1120 120 C1252 24 1048 24 1180 120 C1250 170 1350 200 1480 190"
      stroke="var(--color-line)"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      vector-effect="non-scaling-stroke"
    />
  </svg>
</template>

<style scoped>
.squiggle { display: block; width: 100%; height: auto; pointer-events: none; overflow: visible; }
</style>
