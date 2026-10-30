<script setup>
import { nextTick, onUnmounted, ref } from 'vue'
import { EASE, DUR, gsap, prefersReducedMotion } from '../../utils/motion'
import { useNotes } from '../../composables/useOnboarding'
import AppIcon from './AppIcon.vue'

const COLORS = ['#fba45c', '#e56515', '#cdcdcb', '#919599', '#f2c46d']
const { notes, add, remove } = useNotes()
const dial = ref(false)
const panel = ref(false)
const root = ref(null)
const reduced = prefersReducedMotion()

async function openDial() {
  dial.value = !dial.value
  await nextTick()
  if (dial.value && !reduced) {
    gsap.fromTo(root.value.querySelectorAll('.dial__item'), { y: 10, scale: 0.8, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: DUR.fast, stagger: 0.05, ease: EASE.out })
  }
}
async function openPanel() {
  panel.value = true
  dial.value = false
  await nextTick()
  if (!reduced) {
    gsap.fromTo(root.value.querySelector('.notes'), { scale: 0.95, y: 10, autoAlpha: 0 }, { scale: 1, y: 0, autoAlpha: 1, duration: DUR.fast, ease: EASE.out })
    gsap.from(root.value.querySelectorAll('.note'), { y: 10, autoAlpha: 0, duration: DUR.fast, stagger: 0.04, ease: EASE.soft, delay: 0.1 })
  }
}
function closePanel() {
  if (reduced) return (panel.value = false)
  gsap.to(root.value.querySelector('.notes'), { scale: 0.97, y: 8, autoAlpha: 0, duration: DUR.press, ease: EASE.in, onComplete: () => (panel.value = false) })
}
async function newNote() {
  const note = add(COLORS[notes.value.length % COLORS.length])
  if (!panel.value) await openPanel()
  await nextTick()
  const el = root.value.querySelector(`[data-note="${note.id}"]`)
  el?.querySelector('textarea')?.focus()
  if (el && !reduced) gsap.from(el, { scale: 0.9, autoAlpha: 0, duration: DUR.fast, ease: EASE.popSoft })
}
function deleteNote(id) {
  const el = root.value.querySelector(`[data-note="${id}"]`)
  if (!el || reduced) return remove(id)
  gsap.to(el, { scale: 0.9, autoAlpha: 0, duration: DUR.press, ease: EASE.in, onComplete: () => remove(id) })
}
const onKey = (e) => { if (e.key === 'Escape') { dial.value = false; if (panel.value) closePanel() } }
addEventListener('keydown', onKey)
onUnmounted(() => removeEventListener('keydown', onKey))
</script>

<template>
  <div ref="root" class="dock">
    <div v-if="dial" class="dial">
      <button type="button" class="dial__item" aria-label="Ver notas" @click="openPanel"><AppIcon name="note" /></button>
      <button type="button" class="dial__item" aria-label="Nova nota" @click="newNote"><AppIcon name="plus" /></button>
    </div>
    <button type="button" class="dock__btn" :class="{ 'is-open': dial }" :aria-expanded="dial" :aria-label="dial ? 'Fechar notas' : 'Suas notas'" @click="openDial">
      <AppIcon :name="dial ? 'close' : 'note'" />
    </button>

    <section v-if="panel" class="notes" aria-label="Suas notas">
      <header class="notes__head">
        <strong>Suas notas <span>{{ notes.length }}</span></strong>
        <div>
          <button type="button" class="notes__icon" aria-label="Nova nota" @click="newNote"><AppIcon name="plus" :size="16" /></button>
          <button type="button" class="notes__icon" aria-label="Fechar" @click="closePanel"><AppIcon name="close" :size="16" /></button>
        </div>
      </header>
      <p v-if="!notes.length" class="notes__empty">Nenhuma nota ainda. Use o + para anotar uma ideia rápida, um link ou um lembrete.</p>
      <div class="notes__grid">
        <article v-for="n in notes" :key="n.id" :data-note="n.id" class="note" :style="{ '--note': n.color }">
          <textarea v-model="n.text" rows="4" placeholder="Escreva algo…" aria-label="Texto da nota" />
          <footer>
            <span class="note__colors">
              <button v-for="c in COLORS" :key="c" type="button" class="note__color" :class="{ 'is-on': c === n.color }" :style="{ background: c }" :aria-label="`Cor ${c}`" @click="n.color = c" />
            </span>
            <button type="button" class="note__del" aria-label="Apagar nota" @click="deleteNote(n.id)"><AppIcon name="close" :size="14" /></button>
          </footer>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dock { position: relative; display: flex; flex-direction: column; align-items: center; gap: 0.35rem; }
.dial { display: flex; flex-direction: column; gap: 0.35rem; padding: 0.35rem; border: 1px solid var(--line); border-radius: 999px; background: var(--surface); }
.dial__item, .dock__btn { display: grid; place-items: center; width: 34px; height: 34px; padding: 0; border: 0; border-radius: 50%; background: none; color: var(--muted); cursor: pointer; transition: background 0.2s var(--ease), color 0.2s var(--ease); }
.dial__item:hover, .dock__btn:hover, .dock__btn.is-open { background: var(--surface-2); color: var(--text); }
.dock__btn :deep(.app-icon) { transition: rotate 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.dock__btn.is-open :deep(.app-icon) { rotate: 90deg; }
:is(.dial__item, .dock__btn, .notes__icon, .note__color, .note__del):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }

.notes {
  position: fixed;
  left: calc(var(--rail-w, 64px) + 12px);
  bottom: 16px;
  z-index: 40;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: min(380px, calc(100vw - 92px));
  max-height: min(70vh, 640px);
  padding: 1rem;
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  background: var(--surface);
  box-shadow: 0 20px 40px rgb(0 0 0 / 0.45);
  transform-origin: bottom left;
}
.notes__head { display: flex; align-items: center; justify-content: space-between; }
.notes__head span { margin-left: 0.35rem; font-weight: 400; color: var(--muted); }
.notes__icon { display: inline-grid; place-items: center; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 6px; background: none; color: var(--muted); cursor: pointer; }
.notes__icon:hover { background: var(--surface-2); color: var(--text); }
.notes__empty { margin: 0; color: var(--muted); font-size: 13px; }
.notes__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; overflow-y: auto; }
.note { display: flex; flex-direction: column; min-width: 0; border-radius: 8px; background: var(--note); color: #1a1208; }
.note textarea { flex: 1; min-height: 6.5rem; padding: 0.65rem 0.7rem 0; border: 0; background: none; font: 500 13px/1.4 'Geist', system-ui, sans-serif; color: inherit; resize: none; outline: none; }
.note textarea::placeholder { color: rgb(26 18 8 / 0.5); }
.note footer { display: flex; align-items: center; justify-content: space-between; padding: 0.4rem 0.5rem; }
.note__colors { display: flex; gap: 0.25rem; }
.note__color { width: 12px; height: 12px; padding: 0; border: 1.5px solid rgb(26 18 8 / 0.35); border-radius: 50%; cursor: pointer; }
.note__color.is-on { border-color: #1a1208; box-shadow: 0 0 0 1.5px var(--note), 0 0 0 3px #1a1208; }
.note__del { display: grid; place-items: center; width: 22px; height: 22px; padding: 0; border: 0; border-radius: 5px; background: none; color: rgb(26 18 8 / 0.7); cursor: pointer; }
.note__del:hover { background: rgb(26 18 8 / 0.12); }
</style>
