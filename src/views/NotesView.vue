<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { gsap, prefersReducedMotion, staggerIn } from '../utils/motion'
import { useNotes } from '../composables/useOnboarding'
import { useWorkspace } from '../composables/useWorkspace'
import { useUi } from '../composables/useUi'
import AppIcon from '../components/app/AppIcon.vue'

const COLORS = ['#fba45c', '#e56515', '#cdcdcb', '#919599', '#f2c46d', '#7fc47a']
const { notes, add, remove } = useNotes()
const { state, createTask } = useWorkspace()
const { toast } = useUi()
const root = ref(null)
const q = ref('')
const color = ref('')
const tag = ref('')
const reduced = prefersReducedMotion()

const tagsOf = (n) => [...new Set((n.text.match(/#[\p{L}\p{N}_-]+/gu) || []).map((t) => t.slice(1).toLowerCase()))]
const allTags = computed(() => [...new Set(notes.value.flatMap(tagsOf))].sort())
const shown = computed(() => notes.value.filter((n) => (!q.value || n.text.toLowerCase().includes(q.value.toLowerCase())) && (!color.value || n.color === color.value) && (!tag.value || tagsOf(n).includes(tag.value))))
const pinned = computed(() => shown.value.filter((n) => n.pinned))
const others = computed(() => shown.value.filter((n) => !n.pinned))
const words = (n) => (n.text.trim().match(/\S+/g) || []).length
const when = (iso) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

async function create() {
  q.value = ''; color.value = ''; tag.value = ''
  const n = add(COLORS[notes.value.length % COLORS.length])
  await nextTick()
  const el = root.value.querySelector(`[data-note="${n.id}"]`)
  el?.querySelector('textarea')?.focus()
  if (el && !reduced) gsap.from(el, { scale: 0.85, rotation: -3, autoAlpha: 0, duration: 0.5, ease: 'back.out(1.7)' })
}
function del(id) {
  const el = root.value.querySelector(`[data-note="${id}"]`)
  if (!el || reduced) return remove(id)
  gsap.to(el, { scale: 0.85, autoAlpha: 0, duration: 0.25, ease: 'power2.in', onComplete: () => remove(id) })
}
async function pin(n, el) {
  n.pinned = !n.pinned
  await nextTick()
  if (!reduced) gsap.fromTo(root.value.querySelector(`[data-note="${n.id}"]`), { y: -10, autoAlpha: 0.4 }, { y: 0, autoAlpha: 1, duration: 0.4, ease: 'power3.out' })
}
function toDraft(n) {
  const [first, ...rest] = n.text.trim().split('\n')
  if (!first) { toast('Escreva algo na nota antes.'); return }
  createTask({ title: first.replace(/#[\p{L}\p{N}_-]+/gu, '').trim().slice(0, 200) || first.slice(0, 200), description: rest.join('\n').trim(), tags: tagsOf(n), projectId: null, assignees: [state.me] })
  toast('Virou rascunho. Está em Rascunhos.')
}
watch([q, color, tag], async () => { await nextTick(); staggerIn(root.value?.querySelectorAll('.note')) })
onMounted(() => {
  if (!reduced) gsap.from(root.value.querySelectorAll('.note'), { y: 16, rotation: () => gsap.utils.random(-3, 3), autoAlpha: 0, duration: 0.5, stagger: 0.05, ease: 'power3.out' })
})
</script>

<template>
  <div ref="root" class="pg notes">
    <div class="pg-bar">
      <h1>Notas <span class="count">{{ notes.length }}</span></h1>
      <div class="pg-bar__right">
        <label class="pg-search"><AppIcon name="search" :size="14" /><input v-model="q" placeholder="Buscar nas notas" aria-label="Buscar nas notas" /></label>
        <button type="button" class="pg-btn primary" @click="create"><AppIcon name="plus" :size="14" />Nova nota</button>
      </div>
    </div>
    <div v-if="notes.length" class="filters">
      <div class="dots" role="group" aria-label="Filtrar por cor">
        <button type="button" class="dot all" :aria-pressed="!color" aria-label="Todas as cores" @click="color = ''">Todas</button>
        <button v-for="c in COLORS" :key="c" type="button" class="dot" :style="{ background: c }" :aria-pressed="color === c" :aria-label="`Só a cor ${c}`" @click="color = color === c ? '' : c" />
      </div>
      <div v-if="allTags.length" class="tags" role="group" aria-label="Filtrar por etiqueta">
        <button v-for="t in allTags" :key="t" type="button" class="tagf" :aria-pressed="tag === t" @click="tag = tag === t ? '' : t">#{{ t }}</button>
      </div>
    </div>

    <div v-if="!notes.length" class="pg-empty">
      <span class="pg-empty__art"><AppIcon name="note" :size="36" /></span>
      <h2>Ideias rápidas, links e lembretes</h2>
      <p>Use #etiquetas para organizar, fixe as importantes no topo e transforme uma nota em rascunho de tarefa quando ela amadurecer.</p>
      <button type="button" class="pg-btn primary" @click="create"><AppIcon name="plus" :size="14" />Criar a primeira nota</button>
    </div>
    <p v-else-if="!shown.length" class="pg-muted none">Nenhuma nota com esse filtro.</p>

    <template v-for="[label, list] in [['Fixadas', pinned], ['Outras', others]]" :key="label">
      <h2 v-if="list.length && pinned.length" class="sec">{{ label }}</h2>
      <div v-if="list.length" class="grid">
        <article v-for="n in list" :key="n.id" :data-note="n.id" class="note" :class="{ pinned: n.pinned }" :style="{ '--note': n.color }">
          <button type="button" class="pin" :aria-pressed="!!n.pinned" :aria-label="n.pinned ? 'Desafixar' : 'Fixar no topo'" :title="n.pinned ? 'Desafixar' : 'Fixar no topo'" @click="pin(n)"><AppIcon name="pin" :size="14" /></button>
          <textarea v-model="n.text" placeholder="Escreva algo… use #etiqueta" aria-label="Texto da nota" />
          <div v-if="tagsOf(n).length" class="ntags"><span v-for="t in tagsOf(n)" :key="t">#{{ t }}</span></div>
          <footer>
            <span class="colors">
              <button v-for="c in COLORS" :key="c" type="button" :class="{ on: c === n.color }" :style="{ background: c }" :aria-label="`Cor ${c}`" @click="n.color = c" />
            </span>
            <small>{{ when(n.at) }} · {{ words(n) }} pal.</small>
            <button type="button" class="act" title="Virar rascunho de tarefa" aria-label="Virar rascunho de tarefa" @click="toDraft(n)"><AppIcon name="draft" :size="14" /></button>
            <button type="button" class="act del" aria-label="Apagar nota" @click="del(n.id)"><AppIcon name="close" :size="14" /></button>
          </footer>
        </article>
      </div>
    </template>
  </div>
</template>

<style scoped>
.notes { gap: 0.9rem; padding-bottom: 2rem; }
h1 { display: flex; align-items: center; gap: 0.5rem; }
.count { padding: 0.05rem 0.45rem; border-radius: 999px; background: var(--surface-2); font-size: 12px; font-weight: 500; color: var(--muted); }
.filters { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; padding: 0 1.25rem; }
.dots, .tags { display: flex; flex-wrap: wrap; align-items: center; gap: 0.35rem; }
.dot { width: 20px; height: 20px; padding: 0; border: 2px solid transparent; border-radius: 50%; cursor: pointer; }
.dot[aria-pressed='true'] { box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--text); }
.dot.all { width: auto; padding: 0 0.55rem; border: 1px solid var(--line); border-radius: 999px; background: none; font-size: 12px; color: var(--muted); }
.dot.all[aria-pressed='true'] { box-shadow: none; border-color: var(--accent); color: var(--text); }
.tagf { padding: 0.15rem 0.55rem; border: 1px solid var(--line); border-radius: 999px; background: none; font-size: 12px; color: var(--muted); cursor: pointer; }
.tagf[aria-pressed='true'] { border-color: var(--accent); color: var(--accent-soft); }
.sec { margin: 0; padding: 0 1.25rem; font-size: 12.5px; font-weight: 600; color: var(--muted); }
.none { padding: 0 1.25rem; }
.grid { columns: 15rem; column-gap: 0.9rem; padding: 0 1.25rem; }
.note { position: relative; display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 0.9rem; padding: 0.85rem 0.85rem 0.6rem; border-radius: 12px; background: color-mix(in srgb, var(--note) 16%, var(--surface)); border: 1px solid color-mix(in srgb, var(--note) 35%, transparent); break-inside: avoid; }
.note.pinned { box-shadow: inset 0 3px var(--note); }
.pin { position: absolute; top: 0.45rem; right: 0.45rem; display: grid; place-items: center; width: 26px; height: 26px; padding: 0; border: 0; border-radius: 6px; background: none; color: var(--muted); cursor: pointer; opacity: 0; }
.note:hover .pin, .pin[aria-pressed='true'], .pin:focus-visible { opacity: 1; }
.pin[aria-pressed='true'] { color: var(--note); }
textarea { min-height: 5.5rem; padding: 0 1.5rem 0 0; border: 0; background: none; font: 400 14px/1.55 'Geist', system-ui, sans-serif; color: var(--text); resize: none; outline: none; field-sizing: content; }
.ntags { display: flex; flex-wrap: wrap; gap: 0.3rem; font-size: 11.5px; color: var(--note); }
footer { display: flex; align-items: center; gap: 0.4rem; }
.colors { display: flex; gap: 3px; }
.colors button { width: 12px; height: 12px; padding: 0; border: 0; border-radius: 50%; cursor: pointer; opacity: 0.55; }
.colors button.on, .colors button:hover { opacity: 1; }
footer small { margin-left: auto; font-size: 11px; color: var(--muted); }
.act { display: grid; place-items: center; width: 24px; height: 24px; padding: 0; border: 0; border-radius: 6px; background: none; color: var(--muted); cursor: pointer; }
.act:hover { background: var(--surface-2); color: var(--text); }
.del:hover { color: #ff8a80; }
:is(.dot, .tagf, .pin, .act, .colors button):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
</style>
