<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [String, null], default: '' },
  placeholder: { type: String, default: 'Escolher data' },
  disabled: Boolean,
  clearable: { type: Boolean, default: true },
  size: { type: String, default: 'md' },
  block: Boolean,
})
const emit = defineEmits(['update:modelValue', 'change'])

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

const open = ref(false)
const btn = ref(null)
const pop = ref(null)
const pos = ref({})
const target = ref('body')

const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseIso(s) {
  if (!s || !/^\d{4}-\d{2}-\d{2}/.test(s)) return null
  const [y, m, d] = s.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

const initialDate = () => parseIso(props.modelValue) || new Date()
const viewYear = ref(initialDate().getFullYear())
const viewMonth = ref(initialDate().getMonth())

const formatted = computed(() => {
  const dt = parseIso(props.modelValue)
  if (!dt) return ''
  return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
})

const daysGrid = computed(() => {
  const first = new Date(viewYear.value, viewMonth.value, 1)
  const startDay = first.getDay()
  const totalDays = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) {
    const iso = `${viewYear.value}-${String(viewMonth.value + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, iso })
  }
  return cells
})

function shiftMonth(delta) {
  const d = new Date(viewYear.value, viewMonth.value + delta, 1)
  viewYear.value = d.getFullYear()
  viewMonth.value = d.getMonth()
}

function place() {
  const r = btn.value.getBoundingClientRect()
  const popH = 296
  const popW = 264
  const below = innerHeight - r.bottom > popH + 8 || r.top < popH + 8
  pos.value = {
    left: `${Math.max(8, Math.min(r.left, innerWidth - popW - 8))}px`,
    ...(below ? { top: `${r.bottom + 5}px` } : { bottom: `${innerHeight - r.top + 5}px` }),
  }
}

async function toggle() {
  if (props.disabled) return
  if (open.value) { open.value = false; return }
  const cur = initialDate()
  viewYear.value = cur.getFullYear()
  viewMonth.value = cur.getMonth()
  target.value = btn.value.closest('.app') || 'body'
  place()
  open.value = true
  await nextTick()
}

function pick(iso) {
  emit('update:modelValue', iso)
  emit('change', iso)
  open.value = false
  btn.value?.focus()
}

const outside = (e) => { if (!btn.value?.contains(e.target) && !pop.value?.contains(e.target)) open.value = false }
const onKey = (e) => { if (e.key === 'Escape') { open.value = false; btn.value?.focus() } }
watch(open, (v) => {
  const m = v ? 'addEventListener' : 'removeEventListener'
  document[m]('pointerdown', outside, true)
  document[m]('keydown', onKey)
  window[m]('resize', outside)
})
onBeforeUnmount(() => (open.value = false))
</script>

<template>
  <button
    ref="btn"
    v-bind="$attrs"
    type="button"
    class="nvx-date"
    :class="[`nvx-date--${size}`, { 'nvx-date--block': block, 'is-open': open }]"
    :disabled="disabled"
    :aria-expanded="open"
    aria-haspopup="dialog"
    @click.stop="toggle"
  >
    <AppIcon name="calendar" :size="13" class="nvx-date__ico" />
    <span class="nvx-date__val" :class="{ 'is-empty': !formatted }">{{ formatted || placeholder }}</span>
  </button>

  <Teleport :to="target">
    <Transition name="cal-pop">
      <div v-if="open" ref="pop" class="nvx-cal" role="dialog" aria-label="Escolher data" :style="pos" @click.stop>
        <div class="nvx-cal__head">
          <button type="button" class="nvx-cal__nav" aria-label="Mês anterior" @click="shiftMonth(-1)">‹</button>
          <span class="nvx-cal__month">{{ MONTHS[viewMonth] }} {{ viewYear }}</span>
          <button type="button" class="nvx-cal__nav" aria-label="Próximo mês" @click="shiftMonth(1)">›</button>
        </div>
        <div class="nvx-cal__wk">
          <span v-for="(w, i) in WEEKDAYS" :key="i">{{ w }}</span>
        </div>
        <div class="nvx-cal__grid">
          <template v-for="(cell, i) in daysGrid" :key="i">
            <span v-if="!cell" class="nvx-cal__blank" />
            <button
              v-else
              type="button"
              class="nvx-cal__day"
              :class="{ 'is-selected': cell.iso === (modelValue || '').slice(0, 10), 'is-today': cell.iso === todayIso() }"
              @click="pick(cell.iso)"
            >
              {{ cell.day }}
            </button>
          </template>
        </div>
        <div class="nvx-cal__foot">
          <button type="button" class="nvx-cal__act" @click="pick(todayIso())">Hoje</button>
          <button v-if="clearable && modelValue" type="button" class="nvx-cal__act muted" @click="pick('')">Limpar</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.nvx-date {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  max-width: 100%;
  height: 32px;
  padding: 0 0.65rem;
  border: 1px solid var(--line-strong, rgb(255 255 255 / 0.16));
  border-radius: 7px;
  background: var(--bg, #12100e);
  font: inherit;
  font-size: 13px;
  color: var(--text, #f8f8f8);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.nvx-date--sm { height: 28px; padding: 0 0.5rem; font-size: 12.5px; }
.nvx-date--block { display: flex; width: 100%; }
.nvx-date:hover:not(:disabled), .nvx-date.is-open {
  border-color: var(--accent, #e56515);
  background: var(--surface-2, #1f1c19);
}
.nvx-date:focus-visible { outline: 2px solid var(--accent-soft, #fba45c); outline-offset: 2px; }
.nvx-date:disabled { opacity: 0.55; cursor: not-allowed; }
.nvx-date__ico { flex-shrink: 0; color: var(--muted, #9b958e); }
.nvx-date__val { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: left; }
.nvx-date__val.is-empty { color: var(--muted, #9b958e); }
</style>

<style>
.nvx-cal {
  position: fixed;
  z-index: 2100;
  width: 264px;
  padding: 10px;
  border: 1px solid var(--line-strong, rgb(255 255 255 / 0.16));
  border-radius: 11px;
  background: var(--surface, #161412);
  box-shadow: 0 18px 40px rgb(0 0 0 / 0.5);
  font-family: 'Geist', 'Inter', system-ui, sans-serif;
  color: var(--text, #f8f8f8);
}
.nvx-cal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.nvx-cal__month { font-size: 13px; font-weight: 600; }
.nvx-cal__nav {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 6px;
  background: none;
  color: var(--muted, #9b958e);
  font-size: 17px;
  line-height: 1;
  cursor: pointer;
}
.nvx-cal__nav:hover { background: var(--surface-2, #24201c); color: var(--text, #f8f8f8); }
.nvx-cal__wk, .nvx-cal__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  text-align: center;
}
.nvx-cal__wk { margin-bottom: 4px; font-size: 11px; font-weight: 600; color: var(--muted, #9b958e); }
.nvx-cal__day {
  height: 30px;
  border: 0;
  border-radius: 6px;
  background: none;
  font: 500 12.5px/1 inherit;
  color: var(--text, #f8f8f8);
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease;
}
.nvx-cal__day:hover { background: var(--surface-2, #24201c); }
.nvx-cal__day.is-today { box-shadow: inset 0 0 0 1px var(--accent, #e56515); color: var(--accent-soft, #fba45c); }
.nvx-cal__day.is-selected { background: var(--accent, #e56515); color: #fff; font-weight: 600; }
.nvx-cal__foot {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid var(--line, rgb(255 255 255 / 0.1));
}
.nvx-cal__act {
  padding: 3px 6px;
  border: 0;
  border-radius: 5px;
  background: none;
  font: 500 12px/1.2 inherit;
  color: var(--accent-soft, #fba45c);
  cursor: pointer;
}
.nvx-cal__act:hover { background: var(--surface-2, #24201c); }
.nvx-cal__act.muted { color: var(--muted, #9b958e); }
.cal-pop-enter-active, .cal-pop-leave-active { transition: opacity 0.14s ease, transform 0.16s cubic-bezier(0.22, 1, 0.36, 1); }
.cal-pop-enter-from, .cal-pop-leave-to { opacity: 0; transform: translateY(-4px) scale(0.98); }
@media (prefers-reduced-motion: reduce) { .cal-pop-enter-active, .cal-pop-leave-active { transition: none; } }
</style>
