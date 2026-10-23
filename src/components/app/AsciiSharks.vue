<script setup>
// Fundo da Novexo IA: o oceano em ASCII do stackedlol/ascii-sharks (tubarões, cardumes, reage ao mouse e a cliques).
// A biblioteca só desenha em tons de cinza sobre preto, então a cor da marca vem de um filtro CSS (--ai-shark-filter).
// shortcut: o repositório não tem licença; antes de publicar o site, pedir uma licença ao autor ou trocar o fundo.
import { onMounted, onUnmounted, ref } from 'vue'
import { OceanEngine, paintGrid } from 'ascii-sharks'

// A biblioteca usa células de no mínimo 8px. Ela simula um canvas SCALE vezes maior e o desenho
// é reduzido na mesma proporção: células de ~5px, com o mesmo número de pixels no canvas.
const SCALE = 2.5
// O tamanho dos tubarões é contado em células: com células menores, SIZE compensa para não encolherem.
// O primeiro é o maior; os outros vêm menores (como no demo da biblioteca)
const SIZE = 2.35
const SHARKS = [
  { kind: 'hammerhead', size: 1 * SIZE },
  { kind: 'thresher', size: 0.9 * SIZE },
  { kind: 'mako', size: 0.85 * SIZE },
  { kind: 'tiger', size: 0.8 * SIZE },
  { kind: 'classic', size: 0.75 * SIZE },
]
const SPEED = 0.55 // 1 = velocidade original da biblioteca
const WAKE = 0.09 // energia extra que a cauda deixa na água (ondas mais fortes)
const WAKE_FADE = 0.55 // 1 = ondas somem no tempo original; menor = duram mais
const GRID_ALPHA = 0.35 // grade de fundo mais apagada que a original

const canvas = ref(null)
let engine
onMounted(() => {
  engine = new OceanEngine(canvas.value, SHARKS)
  // shortcut: sobrescreve métodos internos (resize, toLocal, paintBackground, step, depositWake, diffuse) do commit fixado no package.json;
  // ao atualizar a biblioteca, conferir se esses nomes ainda existem
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
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    g.fillStyle = '#000'
    g.fillRect(0, 0, this.width, this.height)
    g.globalAlpha = GRID_ALPHA
    paintGrid(g, this.width, this.height, this.cw, this.ch, this.dpr)
    g.globalAlpha = 1
  }
  // O mundo é SCALE vezes maior, então tudo andaria SCALE vezes mais devagar na tela enquanto a cauda bate
  // no ritmo normal (fica "balançando" no lugar). O tempo roda SCALE vezes mais rápido e a batida
  // da cauda (phase) volta ao ritmo original.
  const step = world.step.bind(world)
  world.step = (dt) => {
    const sharkPhase = world.sharks.map((s) => s.phase)
    const fishPhase = world.fish.map((f) => f.phase)
    step(dt * SCALE * SPEED)
    world.sharks.forEach((s, i) => { s.phase = sharkPhase[i] + (s.phase - sharkPhase[i]) / SCALE })
    if (world.fish.length === fishPhase.length) world.fish.forEach((f, i) => { f.phase = fishPhase[i] + (f.phase - fishPhase[i]) / SCALE })
  }
  // Ondas: além do rastro da biblioteca, a cauda (últimos pontos do corpo) deixa mais energia num raio maior
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
  // a biblioteca só espalha os bichos na primeira medida (ainda no tamanho normal); sem isso todos ficam
  // nadando em volta do centro antigo, no canto de cima à esquerda
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
  pointer-events: none; /* a biblioteca escuta o mouse na janela, então o chat continua clicável */
  font-family: 'Geist Mono', ui-monospace, monospace;
  filter: var(--ai-shark-filter, none);
}
</style>
