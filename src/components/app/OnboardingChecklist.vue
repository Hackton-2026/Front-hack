<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'
import { EASE, DUR, gsap, prefersReducedMotion } from '../../utils/motion'
import { useOnboarding } from '../../composables/useOnboarding'

const { STEPS, isDone, toggle, count, total } = useOnboarding()
const root = ref(null)
const shown = ref(count.value)
const reduced = prefersReducedMotion()

function animateCheck(id, done) {
  const row = root.value.querySelector(`[data-step="${id}"]`)
  if (!row || reduced) return
  const box = row.querySelector('.box'), path = row.querySelector('.box path')
  if (done) {
    gsap.timeline()
      .fromTo(box, { scale: 0.7 }, { scale: 1, duration: DUR.base, ease: EASE.pop })
      .fromTo(path, { strokeDashoffset: 20 }, { strokeDashoffset: 0, duration: DUR.fast, ease: EASE.soft }, 0.05)
      .fromTo(row, { '--flash': 1 }, { '--flash': 0, duration: DUR.slow, ease: EASE.soft }, 0)
      .set(path, { clearProps: 'strokeDashoffset' })
  } else {
    gsap.set(path, { clearProps: 'strokeDashoffset' })
    gsap.fromTo(box, { scale: 0.85 }, { scale: 1, duration: DUR.fast, ease: EASE.soft })
  }
}

function onToggle(id) {
  toggle(id)
  animateCheck(id, isDone(id))
}

watch(count, async (n, old) => {
  const bar = root.value?.querySelector('.bar__fill')
  if (reduced || !bar) { shown.value = n; return }
  gsap.to(bar, { scaleX: n / total, duration: DUR.mid, ease: EASE.expo })
  gsap.to(shown, { value: n, duration: DUR.base, ease: EASE.soft, snap: { value: 1 } })
  if (n === total && old < total) { await nextTick(); celebrate() }
})

function celebrate() {
  const banner = root.value.querySelector('.done')
  if (!banner) return
  gsap.fromTo(banner, { y: 10, autoAlpha: 0, scale: 0.97 }, { y: 0, autoAlpha: 1, scale: 1, duration: DUR.base, ease: EASE.out })
  const burst = root.value.querySelector('.burst')
  for (let i = 0; i < 28; i++) {
    const s = document.createElement('i')
    s.style.background = ['#e56515', '#fba45c', '#f2efea', '#cdcdcb'][i % 4]
    burst.append(s)
    gsap.fromTo(s, { x: 0, y: 0, rotation: 0, autoAlpha: 1 }, {
      x: gsap.utils.random(-220, 220), y: gsap.utils.random(-140, 40), rotation: gsap.utils.random(-260, 260),
      autoAlpha: 0, duration: gsap.utils.random(0.9, 1.5), ease: EASE.out, onComplete: () => s.remove(),
    })
  }
}

onMounted(() => {
  const bar = root.value.querySelector('.bar__fill')
  gsap.set(bar, { scaleX: count.value / total })
  if (reduced) return
  gsap.from(root.value.querySelectorAll('.step'), { y: 10, autoAlpha: 0, duration: DUR.base, stagger: 0.05, ease: EASE.soft, delay: 0.35 })
  gsap.from(bar, { scaleX: 0, duration: DUR.long, ease: EASE.expo, delay: 0.5 })
})
</script>

<template>
  <section ref="root" class="check" aria-labelledby="check-title">
    <div class="check__head">
      <div>
        <h2 id="check-title">Começar</h2>
        <p>Configure o essencial e veja suas ideias ganharem forma mais rápido.</p>
      </div>
      <span class="check__count" aria-live="polite"><b>{{ shown }}</b> de {{ total }}</span>
    </div>
    <div class="bar" aria-hidden="true"><span class="bar__fill" /></div>

    <div v-if="count === total" class="done" role="status">
      <span class="burst" aria-hidden="true" />
      <strong>Tudo pronto!</strong> Seu workspace está configurado. Bom trabalho para o time.
    </div>

    <ul class="steps">
      <li v-for="s in STEPS" :key="s.id" :data-step="s.id" class="step" :class="{ 'is-done': isDone(s.id) }">
        <button type="button" class="step__btn" :aria-pressed="isDone(s.id)" @click="onToggle(s.id)">
          <span class="box"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
          <span class="step__text">
            <span class="step__title">{{ s.title }}</span>
            <span class="step__hint">{{ s.hint }}</span>
          </span>
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.check { position: relative; display: flex; flex-direction: column; gap: 0.9rem; }
.check__head { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; }
h2 { margin: 0 0 0.25rem; font: 600 1.25rem/1.2 'Geist', system-ui, sans-serif; color: var(--text); }
.check__head p { margin: 0; color: var(--muted); }
.check__count { flex-shrink: 0; color: var(--muted); font-variant-numeric: tabular-nums; }
.check__count b { color: var(--text); font-weight: 600; }
.bar { height: 4px; overflow: hidden; border-radius: 999px; background: var(--surface-2); }
.bar__fill { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--accent), var(--accent-soft)); transform-origin: left; }

.done { position: relative; padding: 0.8rem 1rem; border: 1px solid rgb(229 101 21 / 0.45); border-radius: 10px; background: rgb(229 101 21 / 0.1); color: var(--text); }
.done strong { color: var(--accent-soft); margin-right: 0.35rem; }
.burst { position: absolute; left: 50%; top: 50%; pointer-events: none; }
.burst :deep(i) { position: absolute; width: 7px; height: 11px; border-radius: 2px; }

.steps { margin: 0; padding: 0; list-style: none; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); overflow: hidden; }
.step { --flash: 0; background: rgb(229 101 21 / calc(var(--flash) * 0.16)); }
.step + .step { border-top: 1px solid var(--line); }
.step__btn { display: flex; align-items: center; gap: 0.85rem; width: 100%; padding: 0.85rem 1rem; border: 0; background: none; text-align: left; cursor: pointer; transition: background 0.2s var(--ease); }
.step__btn:hover { background: var(--surface-2); }
.step__btn:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: -2px; }
.box { display: grid; place-items: center; flex-shrink: 0; width: 18px; height: 18px; border: 1.5px solid var(--line-strong); border-radius: 5px; transition: background 0.2s var(--ease), border-color 0.2s var(--ease); }
.box svg { width: 14px; height: 14px; fill: none; stroke: #000; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 20; stroke-dashoffset: 20; }
.step.is-done .box { border-color: var(--accent); background: var(--accent); }
.step.is-done .box svg { stroke-dashoffset: 0; }
.step__text { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.step__title { font-weight: 500; color: var(--text); transition: color 0.3s var(--ease); }
.step.is-done .step__title { color: var(--muted); text-decoration: line-through; text-decoration-color: var(--line-strong); }
.step__hint { font-size: 12.5px; color: var(--muted); }
</style>
