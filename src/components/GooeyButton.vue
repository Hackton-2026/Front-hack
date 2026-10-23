<script setup>
// Botão universal do Novexo: porte do GooeyCanvas + borda animada do leonardo.ai (mesma base do portfolio).
// No hover, um canvas 2D desenha uma elipse que sobe de baixo, se achata e cobre o botão;
// o progresso vai de 0→1 em 1.2s (entrada) e 1→0 em 1.08s (saída), easing cúbico de saída.
// Uso: <GooeyButton to="/login">, <GooeyButton href="#planos">, <GooeyButton type="submit">.
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from 'vue'
import { RouterLink } from 'vue-router'

defineOptions({ inheritAttrs: false })
const props = defineProps({
  variant: { type: String, default: 'primary' }, // primary | secondary | dark
  size: { type: String, default: 'md' }, // md | lg
  to: { type: [String, Object], default: null },
  type: { type: String, default: 'button' },
  disabled: Boolean,
  block: Boolean, // largura total
})

// class e style ficam no wrapper; href, aria-*, eventos... vão para o botão
const attrs = useAttrs()
const btnAttrs = computed(() => {
  const { class: _c, style: _s, ...rest } = attrs
  if (props.to) return { ...rest, to: props.to }
  if (rest.href) return rest
  return { ...rest, type: props.type, disabled: props.disabled }
})
const tag = computed(() => (props.to ? RouterLink : attrs.href ? 'a' : 'button'))

// fill = elipse; bg = fundo pintado no canvas (null = transparente, só a elipse aparece)
const COLORS = {
  primary: { fill: '#e56515', bg: '#f8f8f8' },
  secondary: { fill: '#f8f8f8', bg: null },
  dark: { fill: '#e56515', bg: '#000000' },
}

const canvas = ref(null)
const ring = ref(null)
const active = ref(false)
let progress = 0, tween = 0, ringRaf = 0, angle = 140
const canHover = matchMedia('(hover: hover)').matches
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

function draw() {
  const el = canvas.value
  const parent = el?.parentElement
  if (!parent || parent.offsetWidth < 1) return
  const dpr = Math.min(2, devicePixelRatio || 1)
  const cw = parent.offsetWidth + 2, ch = parent.offsetHeight + 2
  const W = Math.max(1, Math.floor(cw * dpr)), H = Math.max(1, Math.floor(ch * dpr))
  if (el.width !== W || el.height !== H) { el.width = W; el.height = H; el.style.width = `${cw}px`; el.style.height = `${ch}px` }

  const ctx = el.getContext('2d'), c = COLORS[props.variant] || COLORS.primary, a = progress
  const bump = 4 * a * (1 - a)
  const cy = -0.35 + 0.85 * a
  const size = 0.12 + 1.5 * a
  const squash = 0.5 + 0.5 * (1 - (1 - a) * (1 - a)) + 0.4 * bump
  const rx = (size / (3.2 - a * a * 2.42 - 0.25 * bump)) * W
  const ry = size * squash * H
  if (c.bg) { ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H) } else ctx.clearRect(0, 0, W, H)
  if (!c.bg && a < 0.01) return
  ctx.beginPath()
  ctx.ellipse(0.5 * W, (1 - cy) * H, rx, ry, 0, 0, Math.PI * 2)
  ctx.fillStyle = c.fill
  ctx.fill()
}

function animateTo(target) {
  cancelAnimationFrame(tween)
  if (reduced) { progress = target; return draw() }
  const from = progress, dur = target ? 1200 : 1080, start = performance.now()
  const step = (now) => {
    const t = Math.min(1, (now - start) / dur)
    progress = from + (target - from) * (1 - (1 - t) ** 3)
    draw()
    if (t < 1) tween = requestAnimationFrame(step)
  }
  tween = requestAnimationFrame(step)
}

const enter = () => { if (props.disabled) return; active.value = true; animateTo(1) }
const leave = () => { active.value = false; animateTo(0) }
const pointerEnter = () => canHover && enter()
const pointerLeave = () => canHover && leave()

let resizeObs
onMounted(() => {
  draw()
  resizeObs = new ResizeObserver(draw) // o botão muda de tamanho (block, texto que troca)
  resizeObs.observe(canvas.value.parentElement)
  if (props.variant === 'secondary' && ring.value && !reduced) {
    const spin = () => {
      angle = (angle + 0.5) % 360
      ring.value?.style.setProperty('--angle', `${angle}deg`)
      ringRaf = requestAnimationFrame(spin)
    }
    ringRaf = requestAnimationFrame(spin)
  }
})
watch(() => props.disabled, (d) => d && leave())
onBeforeUnmount(() => {
  cancelAnimationFrame(tween)
  cancelAnimationFrame(ringRaf)
  resizeObs?.disconnect()
})
</script>

<template>
  <span class="gb" :class="[`gb--${variant}`, `gb--${size}`, { 'gb--block': block, 'gb--disabled': disabled }, attrs.class]" :style="attrs.style">
    <span v-if="variant === 'secondary'" ref="ring" class="gb__ring" aria-hidden="true" />
    <component
      :is="tag"
      v-bind="btnAttrs"
      class="gb__btn"
      :class="{ 'is-active': active }"
      @pointerenter="pointerEnter"
      @pointerleave="pointerLeave"
      @focus="enter"
      @blur="leave"
    >
      <canvas ref="canvas" class="gb__canvas" aria-hidden="true" />
      <span class="gb__label"><slot /></span>
    </component>
  </span>
</template>

<style scoped>
.gb { position: relative; display: inline-flex; width: fit-content; transition: transform 0.3s ease-out; }
.gb:active { transform: scale(0.95); }
.gb--block, .gb--block .gb__btn { width: 100%; }
.gb--disabled { opacity: 0.5; pointer-events: none; }

.gb__ring {
  --angle: 140deg;
  position: absolute;
  inset: 0;
  z-index: 3;
  padding: 2px;
  border-radius: 999px;
  pointer-events: none;
  background: conic-gradient(from var(--angle) at 50% 50%, rgb(255 255 255 / 0.35) 0deg, rgb(255 255 255 / 0.05) 90deg, rgb(255 255 255 / 0.35) 180deg, rgb(255 255 255 / 0.05) 270deg, rgb(255 255 255 / 0.35) 360deg);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}

.gb__btn {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  overflow: hidden;
  isolation: isolate;
  padding: 0.42rem 1.25rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  font: 500 1rem/1.33 'Geist', 'Helvetica Neue', system-ui, sans-serif;
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
}
.gb--lg .gb__btn { padding: 0.95rem 1.6rem; font-size: clamp(1rem, 1.15vw, 1.125rem); }
.gb--primary .gb__btn { background: #f8f8f8; color: #000; }
.gb--secondary .gb__btn { color: #f8f8f8; }
.gb--dark .gb__btn { background: #000; color: #fff; }
.gb__btn:focus-visible { outline: 2px solid #fba45c; outline-offset: 3px; }

.gb__canvas { position: absolute; top: -1px; left: -1px; z-index: 0; display: block; width: calc(100% + 2px); height: calc(100% + 2px); border-radius: inherit; pointer-events: none; }
.gb__label { position: relative; z-index: 1; display: inline-flex; align-items: center; gap: 0.5rem; transition: color 0.4s ease-out 0.15s; }
.gb__btn.is-active .gb__label { color: #000; }
</style>
