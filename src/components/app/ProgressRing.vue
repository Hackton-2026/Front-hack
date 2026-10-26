<script setup>
import { onMounted, ref, watch } from 'vue'
import { gsap, prefersReducedMotion } from '../../utils/motion'

const props = defineProps({ value: { type: Number, default: 0 }, size: { type: Number, default: 30 }, label: { type: Boolean, default: true } })
const C = 2 * Math.PI * 15
const bar = ref(null)
const shown = ref(0)

function paint(animate) {
  const to = { strokeDashoffset: C * (1 - props.value) }
  if (!animate || prefersReducedMotion()) {
    gsap.set(bar.value, to)
    shown.value = Math.round(props.value * 100)
    return
  }
  const n = { v: shown.value }
  gsap.to(bar.value, { ...to, duration: 0.9, ease: 'power3.out' })
  gsap.to(n, { v: props.value * 100, duration: 0.9, ease: 'power3.out', onUpdate: () => (shown.value = Math.round(n.v)) })
}
onMounted(() => {
  gsap.set(bar.value, { strokeDashoffset: C })
  paint(true)
})
watch(() => props.value, () => paint(true))
</script>

<template>
  <span class="ring" :style="{ width: `${size}px`, height: `${size}px` }" role="img" :aria-label="`${Math.round(value * 100)}% concluído`">
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="18" cy="18" r="15" class="track" />
      <circle ref="bar" cx="18" cy="18" r="15" class="bar" :stroke-dasharray="C" :class="{ 'is-full': value >= 1 }" />
    </svg>
    <span v-if="label" class="pct" :style="{ fontSize: `${Math.max(8, size * 0.28)}px` }">{{ shown }}%</span>
  </span>
</template>

<style scoped>
.ring { position: relative; display: inline-grid; flex-shrink: 0; place-items: center; }
svg { position: absolute; inset: 0; rotate: -90deg; }
circle { fill: none; stroke-width: 3; }
.track { stroke: var(--line-strong, #3d3934); }
.bar { stroke: var(--accent, #e56515); stroke-linecap: round; }
.bar.is-full { stroke: #7fc47a; }
.pct { position: relative; font-weight: 600; letter-spacing: -0.02em; color: var(--muted, #a29d95); font-variant-numeric: tabular-nums; }
</style>
