<script setup>
// Busca e comandos (Ctrl K), na linha do "Search your workspace" do Plane e do Ctrl K do ClickUp
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { gsap, prefersReducedMotion } from '../../utils/motion'
import { useWorkspace } from '../../composables/useWorkspace'
import { useUi } from '../../composables/useUi'
import AppIcon from './AppIcon.vue'
import StatusBadge from './StatusBadge.vue'

const PAGES = [
  { label: 'Início', to: '/inicio', icon: 'home' },
  { label: 'Seu trabalho', to: '/meu-trabalho', icon: 'mine' },
  { label: 'Projetos', to: '/projetos', icon: 'folder' },
  { label: 'Rascunhos', to: '/rascunhos', icon: 'draft' },
  { label: 'Notas', to: '/notas', icon: 'note' },
  { label: 'Wiki', to: '/wiki', icon: 'wiki' },
  { label: 'Novexo IA', to: '/ia', icon: 'ai' },
  { label: 'Ajustes', to: '/ajustes', icon: 'settings' },
  { label: 'Começar', to: '/comecar', icon: 'rocket' },
]

const router = useRouter()
const { state, code } = useWorkspace()
const { ui, openTask, newTask } = useUi()
const q = ref('')
const index = ref(0)
const box = ref(null)
const input = ref(null)

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const results = computed(() => {
  const term = norm(q.value.trim())
  const has = (s) => !term || norm(s).includes(term)
  return [
    ...[{ label: 'Criar tarefa', icon: 'plus', run: () => newTask() }].filter((a) => has(a.label)).map((a) => ({ ...a, group: 'Ações' })),
    ...PAGES.filter((p) => has(p.label)).map((p) => ({ ...p, group: 'Páginas', run: () => router.push(p.to) })),
    ...state.projects.filter((p) => has(p.name)).map((p) => ({ label: p.name, icon: 'folder', color: p.color, group: 'Projetos', run: () => router.push(`/projetos/${p.id}`) })),
    ...(term ? state.tasks.filter((t) => has(`${t.title} ${code(t)}`)).slice(0, 8).map((t) => ({ label: t.title, meta: t.draft ? 'Rascunho' : code(t), status: t.status, group: 'Tarefas', run: () => openTask(t) })) : []),
  ]
})
watch(q, () => (index.value = 0))

function pick(r = results.value[index.value]) {
  if (!r) return
  ui.palette = false
  r.run()
}
function onKey(e) {
  if (e.key === 'ArrowDown') { e.preventDefault(); index.value = (index.value + 1) % Math.max(results.value.length, 1) }
  if (e.key === 'ArrowUp') { e.preventDefault(); index.value = (index.value - 1 + results.value.length) % Math.max(results.value.length, 1) }
  if (e.key === 'Enter') { e.preventDefault(); pick() }
  if (e.key === 'Escape') ui.palette = false
}
watch(() => ui.palette, async (open) => {
  if (!open) return
  q.value = ''
  await nextTick()
  input.value?.focus()
  if (!prefersReducedMotion()) gsap.fromTo(box.value, { scale: 0.96, y: -8, autoAlpha: 0 }, { scale: 1, y: 0, autoAlpha: 1, duration: 0.25, ease: 'power3.out' })
})
watch(index, async () => { await nextTick(); box.value?.querySelector('.is-on')?.scrollIntoView({ block: 'nearest' }) })
</script>

<template>
  <div v-if="ui.palette" class="veil" @click.self="ui.palette = false">
    <div ref="box" class="palette" role="dialog" aria-modal="true" aria-label="Buscar no workspace">
      <label class="field">
        <AppIcon name="search" :size="17" />
        <input ref="input" v-model="q" placeholder="Buscar tarefas, projetos e páginas, ou digite um comando" aria-label="Buscar" @keydown="onKey" />
        <kbd>Esc</kbd>
      </label>
      <ul class="list" role="listbox">
        <template v-for="(r, i) in results" :key="r.group + r.label + i">
          <li v-if="i === 0 || results[i - 1].group !== r.group" class="group" role="presentation">{{ r.group }}</li>
          <li class="item" :class="{ 'is-on': i === index }" role="option" :aria-selected="i === index" @mousemove="index = i" @click="pick(r)">
            <StatusBadge v-if="r.status" :status="r.status" compact />
            <span v-else-if="r.color" class="pdot" :style="{ background: r.color }" />
            <AppIcon v-else :name="r.icon" :size="16" />
            <span class="item__label">{{ r.label }}</span>
            <span v-if="r.meta" class="item__meta">{{ r.meta }}</span>
          </li>
        </template>
        <li v-if="!results.length" class="empty">Nada encontrado para “{{ q }}”.</li>
      </ul>
      <footer class="foot"><span><kbd>↑</kbd><kbd>↓</kbd> navegar</span><span><kbd>Enter</kbd> abrir</span></footer>
    </div>
  </div>
</template>

<style scoped>
.veil { position: fixed; inset: 0; z-index: 80; display: flex; justify-content: center; align-items: flex-start; padding: 12vh 1rem 1rem; background: rgb(0 0 0 / 0.5); }
.palette { display: flex; flex-direction: column; width: min(100%, 40rem); max-height: 70vh; overflow: hidden; border: 1px solid var(--line-strong); border-radius: 12px; background: var(--surface); box-shadow: 0 30px 60px rgb(0 0 0 / 0.5); }
.field { display: flex; align-items: center; gap: 0.6rem; padding: 0 1rem; height: 52px; border-bottom: 1px solid var(--line); color: var(--muted); }
.field input { flex: 1; border: 0; background: none; font: 400 15px/1 inherit; color: var(--text); outline: none; }
kbd { padding: 0.1rem 0.35rem; border: 1px solid var(--line-strong); border-radius: 4px; font: 500 11px/1.3 'Geist Mono', monospace; color: var(--muted); }
.list { flex: 1; margin: 0; padding: 0.4rem; overflow-y: auto; list-style: none; }
.group { padding: 0.6rem 0.6rem 0.3rem; font-size: 11.5px; font-weight: 500; color: var(--muted); }
.item { display: flex; align-items: center; gap: 0.6rem; padding: 0.5rem 0.6rem; border-radius: 6px; cursor: pointer; color: var(--text); }
.item.is-on { background: var(--surface-2); }
.item :deep(.app-icon) { color: var(--muted); }
.item__label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item__meta { font: 500 11.5px/1 'Geist Mono', monospace; color: var(--muted); }
.pdot { width: 10px; height: 10px; border-radius: 3px; }
.empty { padding: 1.5rem; text-align: center; color: var(--muted); }
.foot { display: flex; gap: 1rem; padding: 0.5rem 1rem; border-top: 1px solid var(--line); font-size: 12px; color: var(--muted); }
.foot kbd { margin-right: 0.2rem; }
</style>
