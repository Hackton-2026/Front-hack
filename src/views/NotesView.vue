<script setup>
// Notas em página inteira (os mesmos Stickies do botão do canto, com mais espaço)
import { nextTick, onMounted, ref } from 'vue'
import { gsap, prefersReducedMotion } from '../utils/motion'
import { useNotes } from '../composables/useOnboarding'
import AppIcon from '../components/app/AppIcon.vue'
import GooeyButton from '../components/GooeyButton.vue'

const COLORS = ['#fba45c', '#e56515', '#cdcdcb', '#919599', '#f2c46d']
const { notes, add, remove } = useNotes()
const root = ref(null)
const reduced = prefersReducedMotion()

async function create() {
  const n = add(COLORS[notes.value.length % COLORS.length])
  await nextTick()
  const el = root.value.querySelector(`[data-note="${n.id}"]`)
  el?.querySelector('textarea')?.focus()
  if (el && !reduced) gsap.from(el, { scale: 0.85, rotation: -3, autoAlpha: 0, duration: 0.5, ease: 'back.out(1.7)' })
}
function del(id) {
  const el = root.value.querySelector(`[data-note="${id}"]`)
  if (!el || reduced) return remove(id)
  gsap.to(el, { scale: 0.85, autoAlpha: 0, duration: 0.25, ease: 'power2.in', onComplete: () => remove(id) })
}
onMounted(() => {
  if (!reduced) gsap.from(root.value.querySelectorAll('.note'), { y: 16, rotation: () => gsap.utils.random(-3, 3), autoAlpha: 0, duration: 0.5, stagger: 0.05, ease: 'power3.out' })
})
</script>

<template>
  <div ref="root" class="page">
    <header class="head">
      <div>
        <h1>Notas</h1>
        <p>Ideias rápidas, links e lembretes. Ficam só para você.</p>
      </div>
      <GooeyButton variant="primary" @click="create"><AppIcon name="plus" :size="15" /> Nova nota</GooeyButton>
    </header>
    <div class="grid">
      <article v-for="n in notes" :key="n.id" :data-note="n.id" class="note" :style="{ '--note': n.color }">
        <textarea v-model="n.text" placeholder="Escreva algo…" aria-label="Texto da nota" />
        <footer>
          <span class="colors">
            <button v-for="c in COLORS" :key="c" type="button" :class="{ on: c === n.color }" :style="{ background: c }" :aria-label="`Cor ${c}`" @click="n.color = c" />
          </span>
          <time>{{ new Date(n.at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) }}</time>
          <button type="button" class="del" aria-label="Apagar nota" @click="del(n.id)"><AppIcon name="close" :size="14" /></button>
        </footer>
      </article>
    </div>
    <p v-if="!notes.length" class="empty">Nenhuma nota ainda. Crie a primeira com o botão “Nova nota”.</p>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 1.25rem; padding: 1.5rem; }
.head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 1rem; }
h1 { margin: 0 0 0.25rem; font: 650 1.5rem/1.2 'Geist', system-ui, sans-serif; letter-spacing: -0.02em; color: var(--text); }
.head p { margin: 0; color: var(--muted); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr)); gap: 0.85rem; }
.note { display: flex; flex-direction: column; min-height: 12rem; border-radius: 10px; background: var(--note); color: #1a1208; box-shadow: 0 8px 20px rgb(0 0 0 / 0.25); transition: translate 0.25s var(--ease), rotate 0.25s var(--ease); }
.note:hover { translate: 0 -3px; rotate: -0.6deg; }
textarea { flex: 1; padding: 0.85rem 0.9rem 0; border: 0; background: none; font: 500 14px/1.45 'Geist', system-ui, sans-serif; color: inherit; resize: none; outline: none; }
textarea::placeholder { color: rgb(26 18 8 / 0.5); }
footer { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.6rem; }
.colors { display: flex; gap: 0.25rem; }
.colors button { width: 13px; height: 13px; padding: 0; border: 1.5px solid rgb(26 18 8 / 0.35); border-radius: 50%; cursor: pointer; }
.colors button.on { border-color: #1a1208; box-shadow: 0 0 0 1.5px var(--note), 0 0 0 3px #1a1208; }
time { margin-left: auto; font-size: 11.5px; color: rgb(26 18 8 / 0.6); }
.del { display: grid; place-items: center; width: 24px; height: 24px; padding: 0; border: 0; border-radius: 5px; background: none; color: rgb(26 18 8 / 0.7); cursor: pointer; }
.del:hover { background: rgb(26 18 8 / 0.12); }
.empty { color: var(--muted); }
:is(.colors button, .del):focus-visible { outline: 2px solid #1a1208; outline-offset: 2px; }
</style>
