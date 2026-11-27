<script setup>
import { ref } from 'vue'
import FlaticonIcon from '../FlaticonIcon.vue'

const props = defineProps({
  items: { type: Array, required: true }, // [{ question|q, answer|a, link?, label? }]
  single: { type: Boolean, default: false },
})

const openSet = ref(new Set())
const uid = `faq-${Math.random().toString(36).slice(2, 7)}`

const qText = (item) => item.question ?? item.q ?? ''
const aText = (item) => item.answer ?? item.a ?? ''

function isOpen(i) {
  return openSet.value.has(i)
}

function toggle(i) {
  const next = new Set(openSet.value)
  if (next.has(i)) {
    next.delete(i)
  } else {
    if (props.single) next.clear()
    next.add(i)
  }
  openSet.value = next
}
</script>

<template>
  <div class="nvx-faq">
    <div
      v-for="(item, i) in items"
      :key="qText(item)"
      class="nvx-faq__item"
      :class="{ 'is-open': isOpen(i) }"
    >
      <button
        type="button"
        class="nvx-faq__btn"
        :aria-expanded="isOpen(i)"
        :aria-controls="`${uid}-panel-${i}`"
        @click="toggle(i)"
      >
        <span class="nvx-faq__q">{{ qText(item) }}</span>
        <span class="nvx-faq__icon" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
        </span>
      </button>
      <div
        :id="`${uid}-panel-${i}`"
        class="nvx-faq__body"
        role="region"
        :aria-hidden="!isOpen(i)"
      >
        <div class="nvx-faq__inner">
          <div class="nvx-faq__content">
            <p class="nvx-faq__a">{{ aText(item) }}</p>
            <RouterLink v-if="item.link" :to="item.link" class="nvx-faq__link">
              {{ item.label || 'Saiba mais' }}
              <FlaticonIcon name="arrow-up-right" :size="12" />
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nvx-faq {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--line, rgb(255 255 255 / 0.14));
}
.nvx-faq__item {
  border-bottom: 1px solid var(--line, rgb(255 255 255 / 0.14));
}
.nvx-faq__btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  width: 100%;
  padding: 1.3rem 0;
  border: 0;
  background: none;
  font: 500 clamp(0.95rem, 1.3vw, 1.0625rem)/1.5 var(--lp-sans, 'Geist', system-ui, sans-serif);
  color: var(--lp-white, var(--text, #f0eae2));
  text-align: left;
  cursor: pointer;
  transition: color 0.2s ease;
}
.nvx-faq__btn:hover {
  color: var(--lp-orange-soft, var(--accent-soft, #fba45c));
}
.nvx-faq__btn:focus-visible {
  outline: 2px solid var(--lp-orange-soft, #fba45c);
  outline-offset: 4px;
  border-radius: 6px;
}
.nvx-faq__q {
  flex: 1;
}
.nvx-faq__icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 1px solid rgb(255 255 255 / 0.14);
  color: var(--lp-orange-soft, #fba45c);
  transition: transform 0.38s cubic-bezier(0.22, 1, 0.36, 1), background 0.25s ease, border-color 0.25s ease;
}
.nvx-faq__icon svg {
  width: 14px;
  height: 14px;
}
.nvx-faq__item.is-open .nvx-faq__icon {
  transform: rotate(45deg);
  background: rgb(229 101 21 / 0.18);
  border-color: rgb(229 101 21 / 0.45);
}
.nvx-faq__body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
.nvx-faq__item.is-open .nvx-faq__body {
  grid-template-rows: 1fr;
}
.nvx-faq__inner {
  overflow: hidden;
  min-height: 0;
}
.nvx-faq__content {
  padding: 0 2.5rem 1.45rem 0;
  opacity: 0;
  transform: translateY(-8px);
  transition: opacity 0.28s ease, transform 0.38s cubic-bezier(0.22, 1, 0.36, 1);
}
.nvx-faq__item.is-open .nvx-faq__content {
  opacity: 1;
  transform: translateY(0);
  transition-delay: 0.06s;
}
.nvx-faq__a {
  margin: 0;
  font: 400 0.9125rem/1.8 var(--lp-sans, 'Geist', system-ui, sans-serif);
  color: var(--lp-grey-light, var(--muted, #b5aba0));
}
.nvx-faq__link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.95rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--lp-orange-soft, #fba45c);
  text-decoration: none;
}
.nvx-faq__link:hover {
  text-decoration: underline;
}
@media (prefers-reduced-motion: reduce) {
  .nvx-faq__body, .nvx-faq__content, .nvx-faq__icon { transition: none; }
}
</style>
