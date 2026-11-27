<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'

const DEFAULT_PRESETS = [
  ['Laranja Novexo', '#e56515'],
  ['Âmbar', '#f59e0b'],
  ['Bronze', '#b7791f'],
  ['Rubi', '#ef4444'],
  ['Rosa', '#ec4899'],
  ['Fúcsia', '#d946ef'],
  ['Violeta', '#8b5cf6'],
  ['Índigo', '#6366f1'],
  ['Azul', '#3b82f6'],
  ['Turquesa', '#06b6d4'],
  ['Azul-petróleo', '#0d9488'],
  ['Esmeralda', '#10b981'],
]

const props = defineProps({
  modelValue: { type: String, default: '#e56515' },
  presets: { type: Array, default: () => DEFAULT_PRESETS },
  defaultHex: { type: String, default: '#e56515' },
  showReset: { type: Boolean, default: true },
  compact: Boolean,
})

const emit = defineEmits(['update:modelValue', 'change', 'commit'])

const open = ref(false)
const triggerBtn = ref(null)
const pop = ref(null)
const pad = ref(null)
const hueBar = ref(null)
const pos = ref({})
const target = ref('body')

const h = ref(23)
const s = ref(91)
const v = ref(90)
const hexInput = ref('#e56515')

const normalizeHex = (raw) => {
  const clean = String(raw || '').trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    return '#' + clean.split('').map((c) => c + c).join('').toLowerCase()
  }
  if (/^[0-9a-fA-F]{6}$/.test(clean)) return '#' + clean.toLowerCase()
  return null
}

function hexToHsv(hex) {
  const norm = normalizeHex(hex) || '#e56515'
  const r = parseInt(norm.slice(1, 3), 16) / 255
  const g = parseInt(norm.slice(3, 5), 16) / 255
  const b = parseInt(norm.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let hue = 0
  if (d !== 0) {
    if (max === r) hue = ((g - b) / d) % 6
    else if (max === g) hue = (b - r) / d + 2
    else hue = (r - g) / d + 4
    hue = Math.round(hue * 60)
    if (hue < 0) hue += 360
  }
  const sat = max === 0 ? 0 : Math.round((d / max) * 100)
  const val = Math.round(max * 100)
  return { h: hue, s: sat, v: val }
}

function hsvToHex(hue, sat, val) {
  const sn = sat / 100
  const vn = val / 100
  const c = vn * sn
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = vn - c
  let r = 0, g = 0, b = 0
  if (hue < 60) [r, g, b] = [c, x, 0]
  else if (hue < 120) [r, g, b] = [x, c, 0]
  else if (hue < 180) [r, g, b] = [0, c, x]
  else if (hue < 240) [r, g, b] = [0, x, c]
  else if (hue < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const toHex = (n) => Math.round((n + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

const currentHex = computed(() => normalizeHex(props.modelValue) || props.defaultHex)
const isPreset = computed(() => props.presets.some(([, hex]) => hex.toLowerCase() === currentHex.value))
const huePure = computed(() => `hsl(${h.value} 100% 50%)`)

function syncFromProp(hex) {
  const norm = normalizeHex(hex) || props.defaultHex
  hexInput.value = norm.toUpperCase()
  const next = hexToHsv(norm)
  // preserva matiz quando saturação/brilho chega a 0 para o cursor não pular
  if (next.s > 0 && next.v > 0) h.value = next.h
  s.value = next.s
  v.value = next.v
}

watch(() => props.modelValue, (val) => {
  const norm = normalizeHex(val)
  if (norm && norm !== hsvToHex(h.value, s.value, v.value)) syncFromProp(norm)
  else if (norm) hexInput.value = norm.toUpperCase()
}, { immediate: true })

function commit(hex) {
  const norm = normalizeHex(hex)
  if (!norm) return
  hexInput.value = norm.toUpperCase()
  emit('update:modelValue', norm)
  emit('change', norm)
}

function selectPreset(hex) {
  syncFromProp(hex)
  commit(hex)
  emit('commit', normalizeHex(hex))
}

function updatePadFromEvent(e) {
  if (!pad.value) return
  const r = pad.value.getBoundingClientRect()
  const nx = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))
  const ny = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height))
  s.value = Math.round(nx * 100)
  v.value = Math.round((1 - ny) * 100)
  commit(hsvToHex(h.value, s.value, v.value))
}

function updateHueFromEvent(e) {
  if (!hueBar.value) return
  const r = hueBar.value.getBoundingClientRect()
  const nx = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))
  h.value = Math.round(nx * 359)
  commit(hsvToHex(h.value, s.value, v.value))
}

function startDrag(e, updater) {
  e.preventDefault()
  const el = e.currentTarget
  el.setPointerCapture?.(e.pointerId)
  updater(e)
  const move = (ev) => updater(ev)
  const up = () => {
    el.removeEventListener('pointermove', move)
    el.removeEventListener('pointerup', up)
    el.removeEventListener('pointercancel', up)
    emit('commit', hsvToHex(h.value, s.value, v.value))
  }
  el.addEventListener('pointermove', move)
  el.addEventListener('pointerup', up)
  el.addEventListener('pointercancel', up)
}

function onHexInput(e) {
  hexInput.value = e.target.value
  const norm = normalizeHex(e.target.value)
  if (norm) {
    const next = hexToHsv(norm)
    if (next.s > 0 && next.v > 0) h.value = next.h
    s.value = next.s
    v.value = next.v
    emit('update:modelValue', norm)
    emit('change', norm)
    emit('commit', norm)
  }
}

function onHexBlur() {
  hexInput.value = currentHex.value.toUpperCase()
}

function place() {
  if (!triggerBtn.value) return
  const r = triggerBtn.value.getBoundingClientRect()
  const popW = 256
  const popH = 268
  const below = innerHeight - r.bottom > popH + 10 || r.top < popH + 10
  pos.value = {
    left: `${Math.max(10, Math.min(r.left, innerWidth - popW - 10))}px`,
    ...(below ? { top: `${r.bottom + 8}px` } : { bottom: `${innerHeight - r.top + 8}px` }),
  }
}

async function toggle() {
  if (open.value) { open.value = false; return }
  syncFromProp(currentHex.value)
  target.value = triggerBtn.value?.closest('.app') || 'body'
  place()
  open.value = true
  await nextTick()
}

const outside = (e) => {
  if (!triggerBtn.value?.contains(e.target) && !pop.value?.contains(e.target)) open.value = false
}
const onKey = (e) => {
  if (e.key === 'Escape') { open.value = false; triggerBtn.value?.focus() }
}

watch(open, (val) => {
  const m = val ? 'addEventListener' : 'removeEventListener'
  document[m]('pointerdown', outside, true)
  document[m]('keydown', onKey)
  window[m]('resize', place)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', outside, true)
  document.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', place)
})
</script>

<template>
  <div class="nvx-cp" :class="{ 'is-compact': compact }">
    <div class="nvx-cp__list">
      <button
        v-for="[name, hex] in presets"
        :key="hex"
        type="button"
        class="nvx-cp__sw"
        :style="{ background: hex }"
        :aria-pressed="currentHex === hex.toLowerCase()"
        :aria-label="name"
        :title="name"
        @click="selectPreset(hex)"
      />
      <button
        ref="triggerBtn"
        type="button"
        class="nvx-cp__custom"
        :class="{ 'is-active': !isPreset || open }"
        :style="!isPreset ? { '--picked': currentHex } : undefined"
        :aria-expanded="open"
        aria-haspopup="dialog"
        aria-label="Escolher cor personalizada"
        title="Escolher qualquer cor"
        @click.stop="toggle"
      >
        <span class="nvx-cp__ring" aria-hidden="true" />
        <span v-if="!isPreset" class="nvx-cp__dot" :style="{ background: currentHex }" aria-hidden="true" />
        <AppIcon v-else name="plus" :size="12" class="nvx-cp__plus" />
      </button>
    </div>

    <Teleport :to="target">
      <Transition name="cp-pop">
        <div v-if="open" ref="pop" class="nvx-cp-pop" role="dialog" aria-label="Seletor de cor personalizada" :style="pos" @click.stop>
          <div
            ref="pad"
            class="nvx-cp-pop__pad"
            :style="{ backgroundColor: huePure }"
            @pointerdown="startDrag($event, updatePadFromEvent)"
          >
            <span
              class="nvx-cp-pop__thumb"
              :style="{ left: `${s}%`, top: `${100 - v}%`, background: currentHex }"
            />
          </div>

          <div
            ref="hueBar"
            class="nvx-cp-pop__hue"
            role="slider"
            aria-label="Matiz da cor"
            :aria-valuenow="h"
            aria-valuemin="0"
            aria-valuemax="359"
            @pointerdown="startDrag($event, updateHueFromEvent)"
          >
            <span class="nvx-cp-pop__hue-thumb" :style="{ left: `${(h / 359) * 100}%`, background: huePure }" />
          </div>

          <div class="nvx-cp-pop__foot">
            <span class="nvx-cp-pop__preview" :style="{ background: currentHex }" />
            <label class="nvx-cp-pop__hex">
              <span>HEX</span>
              <input
                :value="hexInput"
                maxlength="7"
                spellcheck="false"
                aria-label="Código hexadecimal da cor"
                @input="onHexInput"
                @blur="onHexBlur"
              />
            </label>
            <button
              v-if="showReset && currentHex !== defaultHex.toLowerCase()"
              type="button"
              class="nvx-cp-pop__reset"
              title="Voltar para a cor padrão"
              @click="selectPreset(defaultHex)"
            >
              Padrão
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.nvx-cp__list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.52rem;
}
.nvx-cp__sw {
  width: 26px;
  height: 26px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.14s ease, box-shadow 0.14s ease;
}
.nvx-cp.is-compact .nvx-cp__list { gap: 0.35rem; }
.nvx-cp.is-compact .nvx-cp__sw { width: 20px; height: 20px; }
.nvx-cp.is-compact .nvx-cp__custom { width: 22px; height: 22px; }
.nvx-cp.is-compact .nvx-cp__dot { width: 14px; height: 14px; }
.nvx-cp__sw:hover { transform: scale(1.1); }
.nvx-cp__sw[aria-pressed='true'] {
  box-shadow: 0 0 0 2px var(--surface, #161412), 0 0 0 4px var(--text, #f8f8f8);
}
.nvx-cp__sw:focus-visible,
.nvx-cp__custom:focus-visible {
  outline: 2px solid var(--accent-soft, #fba45c);
  outline-offset: 2px;
}

.nvx-cp__custom {
  position: relative;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--text, #f8f8f8);
  cursor: pointer;
  transition: transform 0.14s ease;
}
.nvx-cp__custom:hover { transform: scale(1.1); }
.nvx-cp__ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(from 0deg, #ef4444, #f59e0b, #10b981, #06b6d4, #3b82f6, #8b5cf6, #ec4899, #ef4444);
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 calc(100% - 2px));
  mask: radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 calc(100% - 2px));
}
.nvx-cp__custom.is-active {
  box-shadow: 0 0 0 2px var(--surface, #161412), 0 0 0 4px var(--text, #f8f8f8);
}
.nvx-cp__dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
}
.nvx-cp__plus {
  position: relative;
  z-index: 1;
  color: var(--text, #f8f8f8);
}
</style>

<style>
.nvx-cp-pop {
  position: fixed;
  z-index: 2100;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 256px;
  padding: 12px;
  border: 1px solid var(--line-strong, rgb(255 255 255 / 0.16));
  border-radius: 12px;
  background: var(--surface, #161412);
  box-shadow: 0 18px 42px rgb(0 0 0 / 0.52);
  font-family: 'Geist', 'Inter', system-ui, sans-serif;
  color: var(--text, #f8f8f8);
  user-select: none;
}
.nvx-cp-pop__pad {
  position: relative;
  width: 100%;
  height: 148px;
  border-radius: 8px;
  background-image:
    linear-gradient(to top, #000, transparent),
    linear-gradient(to right, #fff, transparent);
  cursor: crosshair;
  touch-action: none;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.1);
}
.nvx-cp-pop__thumb {
  position: absolute;
  width: 14px;
  height: 14px;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 1px 5px rgb(0 0 0 / 0.65);
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.nvx-cp-pop__hue {
  position: relative;
  width: 100%;
  height: 12px;
  border-radius: 999px;
  background: linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%);
  cursor: ew-resize;
  touch-action: none;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.12);
}
.nvx-cp-pop__hue-thumb {
  position: absolute;
  top: 50%;
  width: 16px;
  height: 16px;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 1px 5px rgb(0 0 0 / 0.6);
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.nvx-cp-pop__foot {
  display: flex;
  align-items: center;
  gap: 8px;
}
.nvx-cp-pop__preview {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.18);
}
.nvx-cp-pop__hex {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  height: 30px;
  padding: 0 8px;
  border: 1px solid var(--line-strong, rgb(255 255 255 / 0.16));
  border-radius: 7px;
  background: var(--bg, #111);
}
.nvx-cp-pop__hex:focus-within {
  border-color: var(--accent, #e56515);
}
.nvx-cp-pop__hex span {
  font: 600 10px/1 'Geist Mono', monospace;
  color: var(--muted, #9b958e);
  letter-spacing: 0.04em;
}
.nvx-cp-pop__hex input {
  width: 100%;
  min-width: 0;
  border: 0;
  background: none;
  font: 500 12px/1 'Geist Mono', monospace;
  color: var(--text, #f8f8f8);
  outline: none;
  text-transform: uppercase;
}
.nvx-cp-pop__reset {
  flex-shrink: 0;
  height: 30px;
  padding: 0 8px;
  border: 1px solid var(--line, rgb(255 255 255 / 0.12));
  border-radius: 7px;
  background: none;
  font: 500 11.5px/1 inherit;
  color: var(--muted, #9b958e);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}
.nvx-cp-pop__reset:hover {
  border-color: var(--line-strong, rgb(255 255 255 / 0.2));
  background: var(--surface-2, #221f1c);
  color: var(--text, #f8f8f8);
}
.cp-pop-enter-active, .cp-pop-leave-active {
  transition: opacity 0.14s ease, transform 0.16s cubic-bezier(0.22, 1, 0.36, 1);
}
.cp-pop-enter-from, .cp-pop-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
@media (prefers-reduced-motion: reduce) {
  .cp-pop-enter-active, .cp-pop-leave-active { transition: none; }
}
</style>
