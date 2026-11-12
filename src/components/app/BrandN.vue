<script setup>
// N do Novexo Inc (mesmas peças e mesma animação "escrevendo o N" do portfolio, src/components/ui/logoWrite.ts)
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap, prefersReducedMotion } from '../../utils/motion'

defineProps({ size: { type: Number, default: 34 } })
const svg = ref(null)
let tl

// coluna de baixo sobe, coluna de cima sobe, diagonal desce; cada traço: peça, borda parada, borda final
const STROKES = [
  [1, [[170, 621], [287, 621]], [[170, 400], [287, 400]]],
  [0, [[170, 400], [287, 400]], [[170, 179], [287, 179]]],
  [2, [[287, 361], [287, 179]], [[437, 491], [437, 309]]],
  [3, [[463, 504], [463, 335]], [[600, 621], [600, 452]]],
]
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
const path = ([, [a, b], front], t) => { const c = lerp(b, front[1], t), d = lerp(a, front[0], t); return `M${a}L${b}L${c}L${d}Z` }

onMounted(() => {
  if (prefersReducedMotion()) return
  const pieces = [...svg.value.querySelectorAll('path')]
  const lens = STROKES.map(([, back, front]) => Math.hypot(front[0][0] - back[0][0], front[0][1] - back[0][1]))
  const total = lens.reduce((x, y) => x + y, 0)
  const overlap = 0.85, dur = 0.8
  const raw = []; lens.reduce((acc, l, i) => ((raw[i] = acc), acc + (l / total) * (1 - overlap)), 0)
  const k = dur / Math.max(...raw.map((s, i) => s + lens[i] / total))
  const starts = raw.map((s) => s * k), durs = lens.map((l) => (l / total) * k)
  const ease = gsap.parseEase('power2.inOut'), pen = { t: 0 }
  const draw = () => STROKES.forEach((s, i) => pieces[s[0]].setAttribute('d', path(s, ease(gsap.utils.clamp(0, 1, (pen.t - starts[i]) / durs[i])))))
  tl = gsap.timeline()
    .fromTo(pen, { t: 0 }, { t: dur, duration: dur, ease: 'none', onUpdate: draw, immediateRender: true })
    .fromTo(pieces[5], { scaleX: 1.5, scaleY: 0, y: -30, transformOrigin: '50% 100%' }, { scaleX: 1, scaleY: 1, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)', immediateRender: true }, starts[2] + durs[2] * 0.35)
    .fromTo(pieces[4], { scale: 0, y: -60, transformOrigin: '50% 50%' }, { scale: 1, y: 0, duration: 0.8, ease: 'bounce.out', immediateRender: true }, dur - 0.1)
})
onBeforeUnmount(() => tl?.kill())
</script>

<template>
  <svg ref="svg" class="brand-n" :width="size" :height="size" viewBox="150 159 470 482" aria-hidden="true">
    <path d="M170 179H287V400H170Z" fill="#F0B680" />
    <path d="M170 400H287V621H170Z" fill="#DB7032" />
    <path d="M287 179L437 309V491L287 361Z" fill="#DB7032" />
    <path d="M463 335L600 452V621L463 504Z" fill="#A04417" />
    <path d="M313.5 556a52 52 0 1 0 104 0a52 52 0 1 0 -104 0Z" fill="#F0B680" />
    <path d="M469.5 250.5a58.5 58.5 0 1 0 117 0a58.5 58.5 0 1 0 -117 0Z" fill="#F0B680" />
  </svg>
</template>

<style scoped>
.brand-n { display: block; flex: none; overflow: visible; filter: drop-shadow(0 2px 3px rgb(0 0 0 / 0.35)); }
</style>
