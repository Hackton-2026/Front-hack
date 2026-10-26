<script setup>
import { nextTick, ref } from 'vue'
import { gsap, prefersReducedMotion } from '../../utils/motion'
import { useWorkspace } from '../../composables/useWorkspace'

defineProps({ reactions: { type: Array, default: () => [] } })
const emit = defineEmits(['toggle'])
const EMOJIS = ['👍', '👎', '❤️', '🎉', '😄', '🚀', '👀', '🔥', '✅', '🙏', '😕', '💡']
const { state, member } = useWorkspace()
const picking = ref(false)
const names = (users) => users.map((id) => member(id)?.name || '?').join(', ')
const root = ref(null)
const pop = (el) => !prefersReducedMotion() && el && gsap.fromTo(el, { scale: 0.7 }, { scale: 1, duration: 0.45, ease: 'back.out(3.2)' })
const pick = (e) => { emit('toggle', e); picking.value = false; nextTick(() => setTimeout(() => pop([...(root.value?.querySelectorAll('.r') || [])].find((b) => b.textContent.startsWith(e))), 250)) }
async function openPicker() {
  picking.value = !picking.value
  await nextTick()
  if (picking.value && !prefersReducedMotion()) gsap.from(root.value.querySelectorAll('.pick button'), { scale: 0.4, autoAlpha: 0, duration: 0.25, stagger: 0.015, ease: 'back.out(2.5)' })
}
</script>

<template>
  <div ref="root" class="reactions">
    <button v-for="r in reactions" :key="r.emoji" type="button" class="r" :aria-pressed="r.users.includes(state.me)" :title="names(r.users)" @click="emit('toggle', r.emoji); pop($event.currentTarget)">{{ r.emoji }} {{ r.users.length }}</button>
    <span class="add">
      <button type="button" class="r plus" aria-label="Adicionar reação" title="Adicionar reação" :aria-expanded="picking" @click="openPicker">☺+</button>
      <span v-if="picking" class="pick" role="menu"><button v-for="e in EMOJIS" :key="e" type="button" role="menuitem" @click="pick(e)">{{ e }}</button></span>
    </span>
  </div>
</template>

<style scoped>
.reactions { display: flex; flex-wrap: wrap; align-items: center; gap: 0.3rem; }
.r { height: 24px; padding: 0 0.45rem; border: 1px solid var(--line); border-radius: 999px; background: none; font-size: 12px; color: var(--text); cursor: pointer; }
.r[aria-pressed='true'] { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 16%, transparent); }
.plus { color: var(--muted); }
.add { position: relative; }
.pick { position: absolute; bottom: calc(100% + 4px); left: 0; z-index: 10; display: grid; grid-template-columns: repeat(6, 2rem); gap: 2px; padding: 0.3rem; border: 1px solid var(--line-strong); border-radius: 8px; background: var(--surface); box-shadow: 0 10px 30px rgb(0 0 0 / 0.4); }
.pick button { height: 2rem; border: 0; border-radius: 5px; background: none; font-size: 1.05rem; cursor: pointer; }
.pick button:hover { background: var(--surface-2); }
:is(.r, .pick button):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 1px; }
</style>
