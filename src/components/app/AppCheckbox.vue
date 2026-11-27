<script setup>
import { computed } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [Boolean, Array], default: false },
  value: { type: [String, Number, Boolean, Object], default: undefined },
  checked: { type: Boolean, default: undefined },
  indeterminate: Boolean,
  disabled: Boolean,
  label: { type: String, default: '' },
  size: { type: String, default: 'md' },
})
const emit = defineEmits(['update:modelValue', 'change'])

const isArrayModel = computed(() => Array.isArray(props.modelValue))
const isChecked = computed(() => {
  if (props.checked !== undefined) return props.checked
  if (isArrayModel.value) return props.modelValue.includes(props.value)
  return Boolean(props.modelValue)
})

function onToggle(e) {
  if (props.disabled) return
  const next = e.target.checked
  if (props.checked !== undefined) {
    emit('change', next)
    return
  }
  if (isArrayModel.value) {
    const arr = props.modelValue
    const updated = next
      ? (arr.includes(props.value) ? arr : [...arr, props.value])
      : arr.filter((v) => v !== props.value)
    emit('update:modelValue', updated)
    emit('change', updated)
  } else {
    emit('update:modelValue', next)
    emit('change', next)
  }
}
</script>

<template>
  <label
    class="nvx-chk"
    :class="[`nvx-chk--${size}`, { 'is-checked': isChecked, 'is-indeterminate': indeterminate, 'is-disabled': disabled }]"
  >
    <input
      v-bind="$attrs"
      type="checkbox"
      class="nvx-chk__input"
      :checked="isChecked"
      :indeterminate.prop="indeterminate"
      :disabled="disabled"
      @change="onToggle"
    />
    <span class="nvx-chk__box" aria-hidden="true">
      <svg v-if="indeterminate" viewBox="0 0 12 12" fill="none">
        <path d="M2.5 6H9.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
      <svg v-else viewBox="0 0 12 12" fill="none">
        <path class="nvx-chk__mark" d="M2.2 6.2L4.8 8.8L9.8 3.3" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>
    <span v-if="label || $slots.default" class="nvx-chk__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style scoped>
.nvx-chk {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 13px;
  line-height: 1.3;
  color: inherit;
  cursor: pointer;
  user-select: none;
}
.nvx-chk--sm { font-size: 12.5px; gap: 0.42rem; }
.nvx-chk.is-disabled { opacity: 0.5; cursor: not-allowed; }
.nvx-chk__input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: 0;
  opacity: 0;
  pointer-events: none;
}
.nvx-chk__box {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 17px;
  height: 17px;
  border: 1.5px solid var(--line-strong, rgb(255 255 255 / 0.24));
  border-radius: 5px;
  background: var(--bg, rgb(255 255 255 / 0.04));
  color: #fff;
  transition: background 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease, transform 0.12s ease;
}
.nvx-chk--sm .nvx-chk__box { width: 15px; height: 15px; border-radius: 4px; }
.nvx-chk__box svg { width: 11px; height: 11px; }
.nvx-chk--sm .nvx-chk__box svg { width: 10px; height: 10px; }
.nvx-chk__mark {
  stroke-dasharray: 16;
  stroke-dashoffset: 16;
  transition: stroke-dashoffset 0.18s cubic-bezier(0.22, 1, 0.36, 1);
}
.nvx-chk:hover:not(.is-disabled) .nvx-chk__box {
  border-color: var(--accent, #e56515);
}
.nvx-chk.is-checked .nvx-chk__box,
.nvx-chk.is-indeterminate .nvx-chk__box {
  border-color: var(--accent, #e56515);
  background: var(--accent, #e56515);
  box-shadow: 0 0 0 1px rgb(229 101 21 / 0.25);
}
.nvx-chk.is-checked .nvx-chk__mark {
  stroke-dashoffset: 0;
}
.nvx-chk:active:not(.is-disabled) .nvx-chk__box {
  transform: scale(0.92);
}
.nvx-chk__input:focus-visible + .nvx-chk__box {
  outline: 2px solid var(--accent-soft, #fba45c);
  outline-offset: 2px;
}
.nvx-chk__label { min-width: 0; }
@media (prefers-reduced-motion: reduce) {
  .nvx-chk__box, .nvx-chk__mark { transition: none; }
}
</style>
