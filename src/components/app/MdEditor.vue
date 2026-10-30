<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { EASE, DUR, gsap, prefersReducedMotion } from '../../utils/motion'
import { render, toggleCheck } from '../../utils/markdown'
import FlaticonIcon from '../FlaticonIcon.vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  rows: { type: Number, default: 4 },
  upload: { type: Function, default: null },
  view: Boolean,
  collapsible: Boolean,
})
const emit = defineEmits(['update:modelValue', 'commit'])
const TOOLS = [
  ['H', 'Título', '## ', ''], ['B', 'Negrito', '**', '**'], ['I', 'Itálico', '*', '*'], ['U', 'Sublinhado', '++', '++'], ['S', 'Riscado', '~~', '~~'],
  ['1.', 'Lista numerada', '1. ', ''], ['fi:list', 'Lista', '- ', ''], ['fi:checkbox', 'Lista de tarefas', '- [ ] ', ''], ['fi:quote-right', 'Citação', '> ', ''],
  ['</>', 'Código', '`', '`'], ['fi:link-alt', 'Link', '[', '](https://)'],
]
const mode = ref(props.view && props.modelValue ? 'view' : 'edit')
const area = ref(null)
const expanded = ref(false)
const busy = ref(false)
const long = computed(() => props.collapsible && props.modelValue.length > 600)
const html = computed(() => render(props.modelValue))
const root = ref(null)
watch(mode, async () => {
  await nextTick()
  if (!prefersReducedMotion()) gsap.fromTo(root.value?.querySelector('textarea, .md-ed__view'), { autoAlpha: 0, y: 4 }, { autoAlpha: 1, y: 0, duration: DUR.press, ease: EASE.soft })
})
watch(expanded, async (open) => {
  await nextTick()
  const el = root.value?.querySelector('.md-ed__view')
  if (el && !prefersReducedMotion()) gsap.from(el, { height: open ? '14rem' : el.scrollHeight, duration: DUR.fast, ease: EASE.out, clearProps: 'height' })
})

function put(text) {
  emit('update:modelValue', text)
  nextTick(() => emit('commit'))
}
function format([, , before, after]) {
  const el = area.value
  const { selectionStart: a, selectionEnd: b, value } = el
  const lineStart = value.lastIndexOf('\n', a - 1) + 1
  const block = !after
  emit('update:modelValue', block ? value.slice(0, lineStart) + before + value.slice(lineStart) : value.slice(0, a) + before + value.slice(a, b) + after + value.slice(b))
  nextTick(() => { el.focus(); const pos = b + before.length; el.setSelectionRange(pos, pos) })
}
async function attach(e, asImage) {
  const file = e.target.files[0]
  e.target.value = ''
  if (!file || !props.upload) return
  busy.value = true
  try {
    const a = await props.upload(file)
    if (a) emit('update:modelValue', `${props.modelValue}${props.modelValue && !props.modelValue.endsWith('\n') ? '\n' : ''}${asImage && a.kind === 'image' ? '!' : ''}[${a.name}](${a.url})\n`)
  } finally {
    busy.value = false
  }
}
function onPreviewClick(e) {
  const line = e.target.dataset?.line
  if (line !== undefined) put(toggleCheck(props.modelValue, Number(line)))
}
defineExpose({ edit: () => { mode.value = 'edit'; nextTick(() => area.value?.focus()) } })
</script>

<template>
  <div ref="root" class="md-ed" :class="{ 'is-view': mode === 'view' }">
    <div class="md-ed__bar" role="toolbar" aria-label="Formatação">
      <template v-if="mode === 'edit'">
        <button v-for="t in TOOLS" :key="t[1]" type="button" :title="t[1]" :aria-label="t[1]" @mousedown.prevent @click="format(t)"><FlaticonIcon v-if="t[0].startsWith('fi:')" :name="t[0].slice(3)" :size="14" /><template v-else>{{ t[0] }}</template></button>
        <template v-if="upload">
          <label class="md-ed__file" title="Imagem" aria-label="Enviar imagem"><FlaticonIcon name="picture" :size="14" /><input type="file" accept="image/*" @change="attach($event, true)" /></label>
          <label class="md-ed__file" title="Anexo" aria-label="Enviar anexo"><FlaticonIcon name="clip" :size="14" /><input type="file" @change="attach($event, false)" /></label>
        </template>
        <span v-if="busy" class="md-ed__busy">Enviando…</span>
      </template>
      <span class="md-ed__mode" role="group" aria-label="Modo">
        <button type="button" :aria-pressed="mode === 'edit'" @click="mode = 'edit'">Editar</button>
        <button type="button" :aria-pressed="mode === 'view'" @click="mode = 'view'; emit('commit')">Visualizar</button>
      </span>
    </div>
    <textarea v-if="mode === 'edit'" ref="area" :value="modelValue" :rows="rows" :placeholder="placeholder" aria-label="Texto" @input="emit('update:modelValue', $event.target.value)" @blur="emit('commit')" @keydown.ctrl.enter="emit('commit', 'submit')" @keydown.meta.enter="emit('commit', 'submit')" />
    <template v-else>
      <div class="md-ed__view" :class="{ clamp: long && !expanded }" @click="onPreviewClick" @dblclick="mode = 'edit'" v-html="html || `<p class='md-ed__empty'>${placeholder}</p>`" />
      <button v-if="long" type="button" class="md-ed__more" @click="expanded = !expanded">{{ expanded ? 'Mostrar menos' : 'Mostrar tudo' }}</button>
    </template>
  </div>
</template>

<style scoped>
.md-ed { display: flex; flex-direction: column; gap: 0.35rem; }
.md-ed__bar { display: flex; flex-wrap: wrap; align-items: center; gap: 2px; }
.md-ed__bar > button, .md-ed__file { display: grid; place-items: center; min-width: 26px; height: 26px; padding: 0 0.3rem; border: 0; border-radius: 5px; background: none; font: 600 12px/1 'Geist', system-ui, sans-serif; color: var(--muted); cursor: pointer; }
.md-ed__bar > button:hover, .md-ed__file:hover { background: var(--surface-2); color: var(--text); }
.md-ed__file { position: relative; }
.md-ed__file input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.md-ed__busy { font-size: 11.5px; color: var(--accent-soft); }
.md-ed__mode { display: inline-flex; margin-left: auto; padding: 2px; border: 1px solid var(--line); border-radius: 6px; }
.md-ed__mode button { padding: 0.15rem 0.5rem; border: 0; border-radius: 4px; background: none; font-size: 11.5px; color: var(--muted); cursor: pointer; }
.md-ed__mode button[aria-pressed='true'] { background: var(--surface-2); color: var(--text); }
textarea { width: 100%; padding: 0.5rem; border: 1px solid var(--line); border-radius: 6px; background: var(--bg); font: 400 13.5px/1.6 'Geist', system-ui, sans-serif; color: var(--text); resize: vertical; outline: none; field-sizing: content; min-height: 4.5rem; }
textarea:focus { border-color: var(--accent); }
.md-ed__view { font-size: 14px; line-height: 1.65; color: var(--text); overflow-wrap: anywhere; cursor: text; }
.md-ed__view.clamp { max-height: 14rem; overflow: hidden; mask-image: linear-gradient(#000 70%, transparent); }
.md-ed__view :deep(h1), .md-ed__view :deep(h2), .md-ed__view :deep(h3) { margin: 0.8em 0 0.3em; font-size: 1.15rem; color: var(--text); }
.md-ed__view :deep(p) { margin: 0.3em 0; }
.md-ed__view :deep(code) { padding: 0.1em 0.35em; border-radius: 4px; background: var(--surface-2); font-size: 0.9em; }
.md-ed__view :deep(pre) { padding: 0.7rem; border-radius: 7px; background: var(--surface-2); overflow-x: auto; }
.md-ed__view :deep(blockquote) { margin: 0.4em 0; padding-left: 0.8rem; border-left: 3px solid var(--accent); color: var(--muted); }
.md-ed__view :deep(a) { color: var(--accent-soft); }
.md-ed__view :deep(img) { max-width: 100%; border-radius: 6px; }
.md-ed__view :deep(.md-check) { padding-left: 0.2rem; list-style: none; }
.md-ed__view :deep(.md-check input) { accent-color: var(--accent); cursor: pointer; }
.md-ed__view :deep(.md-ed__empty) { color: var(--muted); }
.md-ed__more { align-self: flex-start; padding: 0; border: 0; background: none; font-size: 12.5px; color: var(--accent-soft); cursor: pointer; }
:is(.md-ed__bar button, .md-ed__file, .md-ed__more):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
.md-ed__file:focus-within { outline: 2px solid var(--accent-soft); }
</style>
