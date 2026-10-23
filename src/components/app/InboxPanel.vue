<script setup>
// Caixa de entrada: o histórico do workspace com marcação de lido (a "Inbox" do ClickUp e do Plane)
import { computed, nextTick, ref, watch } from 'vue'
import { gsap, prefersReducedMotion } from '../../utils/motion'
import { useWorkspace } from '../../composables/useWorkspace'
import { useUi } from '../../composables/useUi'

const props = defineProps({ open: Boolean })
const emit = defineEmits(['close'])
const { state, unread } = useWorkspace()
const { openTask } = useUi()
const tab = ref('all')
const box = ref(null)
const items = computed(() => state.activity.filter((a) => tab.value === 'all' || !a.read).slice(0, 30))
const ago = (iso) => {
  const min = Math.round((Date.now() - new Date(iso)) / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min} min`
  if (min < 1440) return `${Math.round(min / 60)} h`
  return `${Math.round(min / 1440)} d`
}
function go(a) {
  a.read = true
  const task = state.tasks.find((t) => t.id === a.taskId)
  if (task) { openTask(task); emit('close') }
}
const readAll = () => state.activity.forEach((a) => (a.read = true))

watch(() => props.open, async (v) => {
  if (!v || prefersReducedMotion()) return
  await nextTick()
  gsap.fromTo(box.value, { y: -8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.25, ease: 'power3.out' })
  gsap.from(box.value.querySelectorAll('.item'), { y: 6, autoAlpha: 0, duration: 0.3, stagger: 0.03, ease: 'power2.out' })
})
</script>

<template>
  <div v-if="open" ref="box" class="inbox" role="dialog" aria-label="Caixa de entrada">
    <header>
      <strong>Caixa de entrada</strong>
      <button type="button" class="link" :disabled="!unread" @click="readAll">Marcar tudo como lido</button>
    </header>
    <div class="tabs" role="tablist">
      <button type="button" role="tab" :aria-selected="tab === 'all'" @click="tab = 'all'">Tudo</button>
      <button type="button" role="tab" :aria-selected="tab === 'unread'" @click="tab = 'unread'">Não lidas <span v-if="unread">{{ unread }}</span></button>
    </div>
    <ul>
      <li v-for="a in items" :key="a.id">
        <button type="button" class="item" :class="{ unread: !a.read }" @click="go(a)">
          <span class="text">{{ a.text }}</span>
          <time>{{ ago(a.at) }}</time>
        </button>
      </li>
      <li v-if="!items.length" class="empty">{{ tab === 'all' ? 'Nada por aqui ainda. Crie ou mova uma tarefa e o histórico aparece aqui.' : 'Tudo lido. Bom trabalho!' }}</li>
    </ul>
  </div>
</template>

<style scoped>
.inbox { position: absolute; top: 42px; right: 0; z-index: 60; display: flex; flex-direction: column; width: min(24rem, calc(100vw - 1.5rem)); max-height: 70vh; border: 1px solid var(--line-strong); border-radius: 10px; background: var(--surface); box-shadow: 0 20px 40px rgb(0 0 0 / 0.45); }
header { display: flex; align-items: center; justify-content: space-between; padding: 0.8rem 1rem 0.5rem; }
.link { border: 0; background: none; font-size: 12px; color: var(--accent-soft); cursor: pointer; }
.link:disabled { color: var(--muted); cursor: default; }
.tabs { display: flex; gap: 0.25rem; padding: 0 0.75rem 0.5rem; border-bottom: 1px solid var(--line); }
.tabs button { padding: 0.3rem 0.6rem; border: 0; border-radius: 6px; background: none; font-size: 12.5px; color: var(--muted); cursor: pointer; }
.tabs button[aria-selected='true'] { background: var(--surface-2); color: var(--text); }
.tabs span { margin-left: 0.25rem; padding: 0 0.35rem; border-radius: 999px; background: var(--accent); font-size: 11px; color: #000; }
ul { margin: 0; padding: 0.35rem; overflow-y: auto; list-style: none; }
.item { display: flex; align-items: flex-start; gap: 0.75rem; width: 100%; padding: 0.55rem 0.65rem 0.55rem 1.4rem; border: 0; border-radius: 6px; background: none; text-align: left; cursor: pointer; position: relative; }
.item:hover { background: var(--surface-2); }
.item.unread::before { content: ''; position: absolute; left: 0.55rem; top: 0.95rem; width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
.text { flex: 1; font-size: 13px; color: var(--text); }
time { flex-shrink: 0; font-size: 11.5px; color: var(--muted); }
.empty { padding: 1.25rem; text-align: center; font-size: 13px; color: var(--muted); }
:is(.link, .tabs button, .item):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
</style>
