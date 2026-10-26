<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap, prefersReducedMotion } from '../utils/motion'

const props = defineProps({
  delay: { type: Number, default: 0 },
  duration: { type: Number, default: 2.4 },
})

const path = ref()
let tween

onMounted(() => {
  if (prefersReducedMotion()) return
  tween = gsap.fromTo(path.value, { drawSVG: '0%' }, {
    drawSVG: '100%',
    ease: 'power2.inOut',
    duration: props.duration,
    delay: props.delay,
    scrollTrigger: { trigger: path.value, start: 'top 95%', once: true },
  })
})

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
      stroke-width="1.6"
      stroke-linecap="round"
      vector-effect="non-scaling-stroke"
    />
  </svg>
</template>

<style scoped>
.squiggle { display: block; width: 100%; height: auto; pointer-events: none; overflow: visible; }
</style>
