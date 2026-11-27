<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [String, Number, Boolean, null], default: null },
  options: { type: Array, required: true },
  placeholder: { type: String, default: 'Escolher' },
  size: { type: String, default: 'md' },
  disabled: Boolean,
  block: Boolean,
  ghost: Boolean,
})
const emit = defineEmits(['update:modelValue', 'change'])

const opts = computed(() => props.options.map((o) => (typeof o === 'object' && o !== null ? o : { value: o, label: String(o) })))
const current = computed(() => opts.value.find((o) => o.value === props.modelValue))
const open = ref(false)
const active = ref(-1)
const btn = ref(null)
const list = ref(null)
const pos = ref({})
const uid = `sel-${Math.random().toString(36).slice(2, 8)}`
const target = ref('body')

function place() {
  const r = btn.value.getBoundingClientRect()
  const height = Math.min(opts.value.length * 36 + 12, 300)
  const below = innerHeight - r.bottom > height + 8 || r.top < height + 8
  pos.value = {
    left: `${Math.min(r.left, innerWidth - Math.max(r.width, 180) - 8)}px`,
    minWidth: `${Math.max(r.width, 180)}px`,
    ...(below ? { top: `${r.bottom + 4}px` } : { bottom: `${innerHeight - r.top + 4}px` }),
  }
}
async function show() {
  if (props.disabled) return
  target.value = btn.value.closest('.app') || 'body'
  place()
  active.value = Math.max(0, opts.value.findIndex((o) => o.value === props.modelValue))
  open.value = true
  await nextTick()
  const lw = list.value?.offsetWidth || 0
  const left = parseFloat(pos.value.left)
  if (left + lw > innerWidth - 8) pos.value = { ...pos.value, left: `${Math.max(8, innerWidth - lw - 8)}px` }
  list.value?.children[active.value]?.scrollIntoView({ block: 'nearest' })
}
function hide(focus = true) {
  open.value = false
  if (focus) btn.value?.focus()
}
function choose(o) {
  if (o.disabled) return
  if (o.value !== props.modelValue) {
    emit('update:modelValue', o.value)
    emit('change', o.value)
  }
  hide()
}
function move(step) {
  const n = opts.value.length
  for (let i = 1; i <= n; i++) {
    const next = (active.value + step * i + n) % n
    if (!opts.value[next].disabled) { active.value = next; break }
  }
  list.value?.children[active.value]?.scrollIntoView({ block: 'nearest' })
}
function onKey(e) {
  if (!open.value) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); show() }
    return
  }
  if (e.key === 'ArrowDown') { e.preventDefault(); move(1) }
  else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1) }
  else if (e.key === 'Home') { e.preventDefault(); active.value = -1; move(1) }
  else if (e.key === 'End') { e.preventDefault(); active.value = 0; move(-1) }
  else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (opts.value[active.value]) choose(opts.value[active.value]) }
  else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); hide() }
  else if (e.key === 'Tab') hide(false)
  else if (e.key.length === 1) {
    const i = opts.value.findIndex((o, k) => k > active.value && o.label.toLowerCase().startsWith(e.key.toLowerCase()))
    const j = i >= 0 ? i : opts.value.findIndex((o) => o.label.toLowerCase().startsWith(e.key.toLowerCase()))
    if (j >= 0) { active.value = j; list.value?.children[j]?.scrollIntoView({ block: 'nearest' }) }
  }
}
const outside = (e) => { if (!btn.value?.contains(e.target) && !list.value?.contains(e.target)) hide(false) }
const close = (e) => { if (!(e.target instanceof Node && list.value?.contains(e.target))) hide(false) }  // no resize o alvo é a janela, que não é Node
watch(open, (v) => {
  const method = v ? 'addEventListener' : 'removeEventListener'
  document[method]('pointerdown', outside, true)
  window[method]('scroll', close, true)
  window[method]('resize', close)
})
onBeforeUnmount(() => (open.value = false))
</script>

<template>
  <button
    ref="btn" v-bind="$attrs" type="button" class="sel" :class="[`sel--${size}`, { 'sel--block': block, 'sel--ghost': ghost, 'is-open': open }]" :disabled="disabled"
    role="combobox" aria-haspopup="listbox" :aria-expanded="open" :aria-controls="uid" :aria-activedescendant="open && active >= 0 ? `${uid}-${active}` : undefined"
    @click="open ? hide() : show()" @keydown="onKey"
  >
    <i v-if="current?.color" class="sel__dot" :style="{ background: current.color }" />
    <span class="sel__label" :class="{ 'is-empty': !current }">{{ current?.label ?? placeholder }}</span>
    <AppIcon name="chevron" :size="size === 'lg' ? 15 : 14" class="sel__chev" />
  </button>
  <Teleport :to="target">
    <Transition name="sel-pop"><ul v-if="open" :id="uid" ref="list" class="sel-list" role="listbox" :style="pos">
      <li
        v-for="(o, i) in opts" :id="`${uid}-${i}`" :key="String(o.value)" role="option" :aria-selected="o.value === modelValue" :aria-disabled="o.disabled || undefined"
        :class="{ 'is-active': i === active }" @pointerenter="active = i" @pointerdown.prevent @click="choose(o)"
      >
        <i v-if="o.color" class="sel__dot" :style="{ background: o.color }" />
        <span class="sel-list__label">{{ o.label }}<small v-if="o.hint">{{ o.hint }}</small></span>
        <AppIcon v-if="o.value === modelValue" name="check" :size="13" class="sel-list__check" />
      </li>
    </ul></Transition>
  </Teleport>
</template>

<style scoped>
.sel {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  max-width: 100%;
  height: 32px;
  padding: 0 0.55rem 0 0.7rem;
  border: 1px solid var(--line-strong, rgb(255 255 255 / 0.16));
  border-radius: 7px;
  background: var(--surface, #161412);
  font: inherit;
  font-size: 13px;
  color: var(--text, #f8f8f8);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}
.sel--sm { height: 28px; padding: 0 0.4rem 0 0.55rem; font-size: 12.5px; }
.sel--lg { height: 44px; padding: 0 0.75rem 0 0.9rem; border-radius: 10px; font-size: 14.5px; }
.sel--block { display: flex; width: 100%; }
.sel--ghost { border-color: transparent; background: none; }
.sel--ghost .sel__chev { opacity: 0; transition: opacity 0.15s ease, rotate 0.2s ease; }
.sel--ghost:hover .sel__chev, .sel--ghost.is-open .sel__chev, .sel--ghost:focus-visible .sel__chev { opacity: 1; }
.sel:hover:not(:disabled), .sel.is-open {
  border-color: var(--accent, #e56515);
  background: var(--surface-2, #1f1c19);
}
.sel:focus-visible { outline: 2px solid var(--accent-soft, #fba45c); outline-offset: 2px; }
.sel:disabled { opacity: 0.55; cursor: default; }
.sel__label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sel__label.is-empty { color: var(--muted, #9b958e); }
.sel__chev { flex-shrink: 0; color: var(--muted, #9b958e); transition: rotate 0.2s ease; }
.is-open .sel__chev { rotate: 180deg; }
.sel__dot { flex-shrink: 0; width: 8px; height: 8px; border-radius: 50%; }
</style>

<style>
.sel-list {
  position: fixed;
  z-index: 2000;
  width: max-content;
  max-width: min(360px, calc(100vw - 16px));
  max-height: 300px;
  margin: 0;
  padding: 5px;
  overflow-y: auto;
  border: 1px solid var(--line-strong, rgb(255 255 255 / 0.16));
  border-radius: 10px;
  background: var(--surface, #161412);
  box-shadow: 0 18px 40px rgb(0 0 0 / 0.5);
  list-style: none;
  font-family: 'Geist', 'Inter', system-ui, sans-serif;
  font-size: 13.5px;
  color: var(--text, #f8f8f8);
}
.sel-list li {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 32px;
  padding: 0.35rem 0.6rem;
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.12s ease;
}
.sel-list li.is-active { background: var(--surface-2, #24201c); }
.sel-list li[aria-selected='true'] { font-weight: 500; color: var(--text, #f8f8f8); }
.sel-list li[aria-disabled='true'] { opacity: 0.45; cursor: default; }
.sel-list__label { display: flex; flex: 1; flex-direction: column; min-width: 0; }
.sel-list__label small { font-size: 11.5px; color: var(--muted, #9b958e); }
.sel-list__check { flex-shrink: 0; color: var(--accent, #e56515); }
.sel-list .sel__dot { flex-shrink: 0; width: 8px; height: 8px; border-radius: 50%; }
.sel-pop-enter-active, .sel-pop-leave-active { transition: opacity 0.14s ease, transform 0.16s cubic-bezier(0.22, 1, 0.36, 1); }
.sel-pop-enter-from, .sel-pop-leave-to { opacity: 0; transform: translateY(-4px) scale(0.98); }
@media (prefers-reduced-motion: reduce) { .sel-pop-enter-active, .sel-pop-leave-active { transition: none; } }
</style>
