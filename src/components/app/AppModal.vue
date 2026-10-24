<script setup>
// Janela de formulário da área logada (criar ciclo, módulo, visão…). Fecha com Esc ou clicando fora.
import { nextTick, onUnmounted, ref, watch } from 'vue'
import { gsap, prefersReducedMotion } from '../../utils/motion'
import AppIcon from './AppIcon.vue'

const props = defineProps({ open: Boolean, title: { type: String, required: true } })
const emit = defineEmits(['close', 'submit'])
const box = ref(null)
const onKey = (e) => e.key === 'Escape' && emit('close')

watch(() => props.open, async (v) => {
  if (!v) return removeEventListener('keydown', onKey)
  addEventListener('keydown', onKey)
  await nextTick()
  box.value?.querySelector('input, textarea, select')?.focus()
  if (!prefersReducedMotion()) {
    gsap.timeline()
      .fromTo(box.value, { y: 14, scale: 0.97, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.32, ease: 'power3.out' })
      .from(box.value.querySelectorAll('.f, footer'), { y: 6, autoAlpha: 0, duration: 0.25, stagger: 0.04, ease: 'power2.out' }, '-=0.18')
  }
}, { immediate: true })
onUnmounted(() => removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="ov" @click.self="emit('close')">
      <form ref="box" class="box" role="dialog" aria-modal="true" :aria-label="title" @submit.prevent="emit('submit')">
        <header>
          <h2>{{ title }}</h2>
          <button type="button" class="x" aria-label="Fechar" @click="emit('close')"><AppIcon name="close" :size="16" /></button>
        </header>
        <slot />
        <footer><slot name="footer" /></footer>
      </form>
    </div>
  </Teleport>
</template>

<style scoped>
.ov { position: fixed; inset: 0; z-index: 85; display: grid; place-items: center; padding: 1rem; background: rgb(0 0 0 / 0.55); }
.box {
  --surface: #181614; --surface-2: #211f1c; --line: #2e2b27; --line-strong: #3d3934; --text: #f2efea; --muted: #a29d95; --accent: #e56515; --accent-soft: #fba45c;
  display: flex; flex-direction: column; gap: 0.9rem; width: min(32rem, 100%); max-height: calc(100vh - 2rem); overflow-y: auto; padding: 1.2rem 1.3rem;
  border: 1px solid var(--line-strong); border-radius: 12px; background: var(--surface); box-shadow: 0 30px 70px rgb(0 0 0 / 0.55);
  font: 400 14px/1.45 'Geist', 'Helvetica Neue', system-ui, sans-serif; color: var(--text);
}
header { display: flex; align-items: center; justify-content: space-between; }
h2 { margin: 0; font: 600 1.1rem/1.2 'Geist', system-ui, sans-serif; color: var(--text); }
.x { display: grid; place-items: center; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 6px; background: none; color: var(--muted); cursor: pointer; }
.x:hover { background: var(--surface-2); color: var(--text); }
footer { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.25rem; }
.box :deep(.f) { display: flex; flex-direction: column; gap: 0.35rem; }
.box :deep(.f > span) { font-size: 12.5px; font-weight: 500; color: var(--muted); }
.box :deep(.row2) { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.box :deep(:is(input:not([type='checkbox']), textarea, select)) { width: 100%; padding: 0.5rem 0.65rem; border: 1px solid var(--line-strong); border-radius: 7px; background: #0f0e0d; font: inherit; color: var(--text); outline: none; }
.box :deep(:is(input, textarea, select):focus) { border-color: var(--accent); }
.box :deep(.btn) { padding: 0.5rem 0.95rem; border: 1px solid var(--line-strong); border-radius: 7px; background: var(--surface-2); font-weight: 500; color: var(--text); cursor: pointer; }
.box :deep(.btn.primary) { border-color: var(--accent); background: var(--accent); color: #140700; }
.box :deep(.btn.danger) { border-color: #d9483b; background: #d9483b; color: #fff; }
.box :deep(.btn:disabled) { opacity: 0.5; cursor: not-allowed; }
.box :deep(.chips) { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.box :deep(.chip) { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.25rem 0.6rem; border: 1px solid var(--line-strong); border-radius: 999px; background: none; font-size: 12.5px; color: var(--muted); cursor: pointer; }
.box :deep(.chip.is-on) { border-color: var(--accent); background: rgb(229 101 21 / 0.14); color: var(--text); }
.box :deep(.err) { margin: 0; font-size: 12.5px; color: #ff8a7a; }
.box :deep(:focus-visible) { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
</style>
