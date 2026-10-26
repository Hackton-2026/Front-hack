<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { OceanEngine, paintGrid } from 'ascii-sharks'

const SCALE = 2.5
const SIZE = 2.35
const SHARKS = [
  { kind: 'hammerhead', size: 1 * SIZE },
  { kind: 'thresher', size: 0.9 * SIZE },
  { kind: 'mako', size: 0.85 * SIZE },
  { kind: 'tiger', size: 0.8 * SIZE },
  { kind: 'classic', size: 0.75 * SIZE },
]
const SPEED = 0.55
const WAKE = 0.09
const WAKE_FADE = 0.55
const GRID_ALPHA = 0.35
const DARKEN = 0.4
const SPREAD = 0.4
const MARGIN = 0.1
const NUDGE = 1.6

const canvas = ref(null)
let engine
let light = false
onMounted(() => {
  canvas.value.getContext('2d')
  engine = new OceanEngine(canvas.value, SHARKS)
  const { renderer, world } = engine
  engine.resize = function () {
    const rect = canvas.value.getBoundingClientRect()
    if (rect.width < 1 || rect.height < 1) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    renderer.resize(rect.width * SCALE, rect.height * SCALE, dpr / SCALE)
    world.resize(rect.width * SCALE, rect.height * SCALE, renderer.cellWidth, renderer.cellHeight)
    if (engine.reducedMotion.matches) engine.drawStill()
  }
  const toLocal = engine.toLocal.bind(engine)
  engine.toLocal = (e) => {
    const p = toLocal(e)
    return { ...p, x: p.x * SCALE, y: p.y * SCALE }
  }
  renderer.paintBackground = function () {
    const g = this.bg.getContext('2d')
    g.setTransform(1, 0, 0, 1, 0, 0)
    g.clearRect(0, 0, this.bg.width, this.bg.height)
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    g.globalAlpha = GRID_ALPHA
    paintGrid(g, this.width, this.height, this.cw, this.ch, this.dpr)
    g.globalAlpha = 1
    if (light) {
      g.setTransform(1, 0, 0, 1, 0, 0)
      g.globalCompositeOperation = 'source-in'
      g.fillStyle = '#000'
      g.fillRect(0, 0, this.bg.width, this.bg.height)
      g.globalCompositeOperation = 'source-over'
    }
  }
  const darken = (c) => c.replace(/rgba\((\d+),(\d+),(\d+),/, (_, r, g, b) => `rgba(${[r, g, b].map((v) => Math.round(v * DARKEN)).join(',')},`)
  const palettes = {
    dark: { dotStyles: renderer.dotStyles, fishStyles: renderer.fishStyles },
    light: { dotStyles: renderer.dotStyles.map(darken), fishStyles: renderer.fishStyles.map(darken) },
  }
  const render = renderer.render.bind(renderer)
  renderer.render = (w, dt) => {
    const now = !!canvas.value.closest('.is-light')
    if (now !== light) {
      light = now
      Object.assign(renderer, palettes[light ? 'light' : 'dark'])
      renderer.paintBackground()
    }
    renderer.ctx.setTransform(1, 0, 0, 1, 0, 0)
    renderer.ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
    render(w, dt)
  }
  const spread = (dt) => {
    const { sharks, width: W, height: H } = world
    const side = Math.min(W, H)
    const range = side * SPREAD
    const margin = side * MARGIN
    for (const sh of sharks) {
      const hx = sh.nodes[0]
      const hy = sh.nodes[1]
      let px = 0
      let py = 0
      for (const o of sharks) {
        if (o === sh) continue
        const ox = hx - o.nodes[0]
        const oy = hy - o.nodes[1]
        const d = Math.hypot(ox, oy)
        if (d < range && d > 1e-3) {
          px += (ox / d) * (1 - d / range)
          py += (oy / d) * (1 - d / range)
        }
      }
      px += Math.max(0, margin - hx) / margin - Math.max(0, hx - (W - margin)) / margin
      py += Math.max(0, margin - hy) / margin - Math.max(0, hy - (H - margin)) / margin
      const strength = Math.min(1, Math.hypot(px, py))
      if (strength < 1e-3) continue
      let diff = Math.atan2(py, px) - sh.heading
      diff = Math.atan2(Math.sin(diff), Math.cos(diff))
      const max = NUDGE * strength * dt
      sh.heading += Math.max(-max, Math.min(max, diff))
    }
  }
  const step = world.step.bind(world)
  world.step = (dt) => {
    spread(dt * SPEED)
    const sharkPhase = world.sharks.map((s) => s.phase)
    const fishPhase = world.fish.map((f) => f.phase)
    step(dt * SCALE * SPEED)
    world.sharks.forEach((s, i) => { s.phase = sharkPhase[i] + (s.phase - sharkPhase[i]) / SCALE })
    if (world.fish.length === fishPhase.length) world.fish.forEach((f, i) => { f.phase = fishPhase[i] + (f.phase - fishPhase[i]) / SCALE })
  }
  const deposit = renderer.depositWake.bind(renderer)
  renderer.depositWake = (w) => {
    deposit(w)
    for (const sh of w.sharks) {
      const n = sh.nodes.length / 2
      for (let k = n - 8; k < n; k++) renderer.stamp(renderer.energy, sh.nodes[k * 2], sh.nodes[k * 2 + 1], 2, WAKE)
    }
  }
  const diffuse = renderer.diffuse.bind(renderer)
  renderer.diffuse = (dt) => diffuse(dt * WAKE_FADE)
  engine.resize()
  world.seed()
})
onUnmounted(() => engine?.destroy())
</script>

<template>
  <canvas ref="canvas" class="sharks" aria-hidden="true" />
</template>

<style scoped>
.sharks {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; font-family: 'Geist Mono', ui-monospace, monospace;
  filter: var(--ai-shark-filter, none);
}
</style>
