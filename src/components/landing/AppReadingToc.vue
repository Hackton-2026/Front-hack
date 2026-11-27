<script setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  title: { type: String, default: 'Neste guia' },
  items: { type: Array, required: true },
  target: { type: [Object, String], default: null },
  scrollContainer: { type: Object, default: null },
  sticky: { type: Boolean, default: true },
  stickyTop: { type: String, default: '125px' },
  offset: { type: Number, default: 180 },
  showProgress: { type: Boolean, default: true },
  compact: { type: Boolean, default: false },
  asButtons: { type: Boolean, default: false },
  navLabel: { type: String, default: 'Índice da página' },
  asideLabel: { type: String, default: 'Navegação da página' },
  tag: { type: String, default: 'aside' },
  hideFooterMobile: { type: Boolean, default: true },
})

const emit = defineEmits(['select'])

const activeId = ref(props.items[0]?.id || '')
const progress = ref(0)
let frame = 0
let boundScroller = null

function resolveTarget() {
  if (!props.target) return null
  if (typeof props.target === 'string') return document.querySelector(props.target)
  return props.target.$el || props.target
}

function resolveScroller() {
  if (!props.scrollContainer) return window
  return props.scrollContainer.$el || props.scrollContainer
}

function updateReading() {
  frame = 0
  if (!props.items.length) return

  const scroller = resolveScroller()
  const isWindow = scroller === window

  if (props.showProgress) {
    if (!isWindow && scroller) {
      const distance = scroller.scrollHeight - scroller.clientHeight
      progress.value =
        distance > 0 ? Math.max(0, Math.min(100, (scroller.scrollTop / distance) * 100)) : 0
    } else {
      const targetEl = resolveTarget()
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect()
        const distance = rect.height - window.innerHeight + 130
        progress.value = Math.max(
          0,
          Math.min(100, ((130 - rect.top) / Math.max(1, distance)) * 100)
        )
      } else {
        const doc = document.documentElement
        const distance = doc.scrollHeight - window.innerHeight
        progress.value =
          distance > 0 ? Math.max(0, Math.min(100, (window.scrollY / distance) * 100)) : 0
      }
    }
  }

  const baseTop = isWindow ? 0 : scroller.getBoundingClientRect().top
  const threshold = baseTop + props.offset
  let current = props.items[0]?.id || ''
  for (const item of props.items) {
    const el = document.getElementById(item.id)
    if (el && el.getBoundingClientRect().top <= threshold) {
      current = item.id
    }
  }
  activeId.value = current
}

function onScroll() {
  if (!frame) frame = requestAnimationFrame(updateReading)
}

function attach() {
  detach()
  boundScroller = resolveScroller()
  boundScroller?.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  nextTick(updateReading)
}

function detach() {
  boundScroller?.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  boundScroller = null
  if (frame) {
    cancelAnimationFrame(frame)
    frame = 0
  }
}

function onItemClick(item) {
  activeId.value = item.id
  emit('select', item)
}

function itemIndent(item) {
  if (!item.level || item.level <= 1) return undefined
  return `${17 + (item.level - 1) * 12}px`
}

watch(
  () => props.items,
  (list) => {
    activeId.value = list[0]?.id || ''
    nextTick(updateReading)
  },
  { deep: false }
)

watch(() => props.target, () => nextTick(updateReading))
watch(() => props.scrollContainer, () => attach())

onMounted(attach)
onUnmounted(detach)
</script>

<template>
  <component
    :is="tag"
    class="reading-toc"
    :class="{
      'is-sticky': sticky,
      'is-compact': compact,
      'hide-footer-mobile': hideFooterMobile,
    }"
    :style="sticky ? { '--toc-top': stickyTop } : undefined"
    :aria-label="tag === 'aside' ? asideLabel : undefined"
  >
    <div class="reading-toc__inner">
      <span v-if="title" class="reading-toc__title">{{ title }}</span>
      <nav class="reading-toc__nav" :aria-label="navLabel">
        <template v-for="item in items" :key="item.id">
          <button
            v-if="asButtons"
            type="button"
            class="reading-toc__item"
            :class="{ 'is-active': activeId === item.id }"
            :style="{ paddingLeft: itemIndent(item) }"
            :aria-current="activeId === item.id ? 'location' : undefined"
            @click="onItemClick(item)"
          >
            {{ item.label }}
          </button>
          <a
            v-else
            :href="`#${item.id}`"
            class="reading-toc__item"
            :class="{ 'is-active': activeId === item.id }"
            :style="{ paddingLeft: itemIndent(item) }"
            :aria-current="activeId === item.id ? 'location' : undefined"
            @click="onItemClick(item)"
          >
            {{ item.label }}
          </a>
        </template>
      </nav>
      <div
        v-if="showProgress"
        class="reading-toc__progress"
        role="progressbar"
        :aria-valuenow="Math.round(progress)"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="Progresso da leitura"
      >
        <span :style="{ width: `${progress}%` }" />
      </div>
      <div v-if="$slots.footer" class="reading-toc__footer">
        <slot name="footer" />
      </div>
    </div>
  </component>
</template>

<style scoped>
.reading-toc {
  --toc-accent: var(--lp-orange, var(--accent, #e56515));
  --toc-accent-soft: var(--lp-orange-soft, var(--accent-soft, #fba45c));
  --toc-title: var(--text, #e5e1dc);
  --toc-muted: var(--muted, #a6a29d);
  --toc-track: var(--line, #ffffff24);
  --toc-progress-bg: var(--line, #ffffff1a);
  min-width: 0;
}

.reading-toc.is-sticky .reading-toc__inner {
  position: sticky;
  top: var(--toc-top, 125px);
}

.reading-toc__title {
  display: block;
  color: var(--toc-title);
  font-size: 12px;
  font-weight: 500;
}

.reading-toc__nav {
  display: flex;
  flex-direction: column;
  margin-top: 20px;
  border-left: 1px solid var(--toc-track);
}

.reading-toc__item {
  display: block;
  width: 100%;
  padding: 10px 0 10px 17px;
  margin-left: -1px;
  border: 0;
  border-left: 2px solid transparent;
  background: none;
  font: inherit;
  font-size: 12px;
  line-height: 1.45;
  text-align: left;
  text-decoration: none;
  color: var(--toc-muted);
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
}

.reading-toc__item:hover,
.reading-toc__item.is-active {
  color: var(--toc-accent-soft);
}

.reading-toc__item.is-active {
  border-left-color: var(--toc-accent);
}

.reading-toc__item:focus-visible {
  outline: 2px solid var(--toc-accent-soft);
  outline-offset: 4px;
}

.reading-toc__progress {
  height: 2px;
  margin-top: 27px;
  overflow: hidden;
  background: var(--toc-progress-bg);
}

.reading-toc__progress > span {
  display: block;
  height: 100%;
  background: var(--toc-accent);
  transition: width 0.08s linear;
}

.reading-toc__footer {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--toc-track);
}

.reading-toc.is-compact .reading-toc__nav {
  margin-top: 12px;
}

.reading-toc.is-compact .reading-toc__item {
  padding: 6px 0 6px 13px;
  font-size: 12px;
}

.reading-toc.is-compact .reading-toc__progress {
  margin-top: 16px;
}

@media (max-width: 1050px) {
  .reading-toc:not(.is-compact) .reading-toc__item {
    font-size: 11px;
    padding-left: 12px;
  }
}

@media (max-width: 760px) {
  .reading-toc.is-sticky .reading-toc__inner {
    position: static;
  }
  .reading-toc:not(.is-compact) .reading-toc__nav {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px 14px;
    margin-top: 12px;
  }
  .reading-toc:not(.is-compact) .reading-toc__item {
    padding: 8px 0 8px 13px;
    font-size: 11px;
  }
  .reading-toc.is-sticky .reading-toc__progress,
  .reading-toc.hide-footer-mobile .reading-toc__footer {
    display: none;
  }
}

@media (max-width: 440px) {
  .reading-toc:not(.is-compact) .reading-toc__nav {
    column-gap: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .reading-toc__item,
  .reading-toc__progress > span {
    transition: none;
  }
}
</style>
