<script setup>
// Wiki: documentos do time (os "Docs" do ClickUp / "Pages" do Plane), com lista, busca e editor que salva sozinho
import { computed, nextTick, ref, watch } from 'vue'
import { gsap, prefersReducedMotion } from '../utils/motion'
import { useWorkspace } from '../composables/useWorkspace'
import { useOnboarding } from '../composables/useOnboarding'
import AppIcon from '../components/app/AppIcon.vue'

const { state, createDoc } = useWorkspace()
const { complete } = useOnboarding()
const activeId = ref(state.docs[0]?.id || null)
const q = ref('')
const editor = ref(null)
const saved = ref('')
const confirmDel = ref(false)
const doc = computed(() => state.docs.find((d) => d.id === activeId.value))
const list = computed(() => state.docs.filter((d) => !q.value || `${d.title} ${d.body}`.toLowerCase().includes(q.value.toLowerCase())))
const when = (iso) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
const words = computed(() => (doc.value?.body.trim().match(/\S+/g) || []).length)

async function open(id) {
  activeId.value = id
  confirmDel.value = false
  await nextTick()
  if (!prefersReducedMotion() && editor.value) gsap.fromTo(editor.value, { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, ease: 'power2.out' })
}
async function create() {
  const d = createDoc()
  complete('doc')
  await open(d.id)
  editor.value?.querySelector('.title')?.select()
}
let timer
function touch() {
  doc.value.updatedAt = new Date().toISOString()
  saved.value = 'Salvando…'
  clearTimeout(timer)
  timer = setTimeout(() => (saved.value = 'Salvo'), 500)
}
function del() {
  if (!confirmDel.value) { confirmDel.value = true; return }
  state.docs.splice(state.docs.indexOf(doc.value), 1)
  open(state.docs[0]?.id || null)
}
watch(activeId, () => (saved.value = ''))
</script>

<template>
  <div class="wiki">
    <aside class="list">
      <div class="list__head">
        <strong>Documentos</strong>
        <button type="button" class="icon" aria-label="Novo documento" @click="create"><AppIcon name="plus" :size="16" /></button>
      </div>
      <label class="find"><AppIcon name="search" :size="14" /><input v-model="q" placeholder="Buscar nos documentos" aria-label="Buscar nos documentos" /></label>
      <button v-for="d in list" :key="d.id" type="button" class="doc" :class="{ on: d.id === activeId }" @click="open(d.id)">
        <AppIcon name="doc" :size="15" />
        <span class="doc__t">{{ d.title || 'Sem título' }}</span>
      </button>
      <p v-if="!list.length" class="muted">Nada encontrado.</p>
    </aside>

    <article v-if="doc" ref="editor" class="editor">
      <input v-model="doc.title" class="title" placeholder="Título do documento" aria-label="Título do documento" @input="touch" />
      <p class="meta">Editado {{ when(doc.updatedAt) }} · {{ words }} palavras <span class="saved">{{ saved }}</span></p>
      <textarea v-model="doc.body" class="body" placeholder="Comece a escrever. Specs, atas, processos do time…" aria-label="Conteúdo do documento" @input="touch" />
      <button type="button" class="del" @click="del">{{ confirmDel ? 'Clique de novo para apagar' : 'Apagar documento' }}</button>
    </article>
    <div v-else class="empty">
      <p>Nenhum documento ainda.</p>
      <button type="button" class="new" @click="create">Criar o primeiro documento</button>
    </div>
  </div>
</template>

<style scoped>
.wiki { display: grid; grid-template-columns: 16rem minmax(0, 1fr); height: 100%; }
@media (max-width: 760px) { .wiki { grid-template-columns: minmax(0, 1fr); } .list { border-right: 0; border-bottom: 1px solid var(--line); } }
.list { display: flex; flex-direction: column; gap: 2px; padding: 1rem 0.75rem; border-right: 1px solid var(--line); overflow-y: auto; }
.list__head { display: flex; align-items: center; justify-content: space-between; padding: 0 0.35rem 0.5rem; }
.icon { display: grid; place-items: center; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 6px; background: none; color: var(--muted); cursor: pointer; }
.icon:hover { background: var(--surface-2); color: var(--text); }
.find { display: flex; align-items: center; gap: 0.4rem; height: 30px; margin-bottom: 0.5rem; padding: 0 0.5rem; border: 1px solid var(--line); border-radius: 6px; color: var(--muted); }
.find:focus-within { border-color: var(--accent); }
.find input { flex: 1; min-width: 0; border: 0; background: none; font: inherit; color: var(--text); outline: none; }
.doc { display: flex; align-items: center; gap: 0.5rem; padding: 0.45rem 0.5rem; border: 0; border-radius: 6px; background: none; text-align: left; color: var(--muted); cursor: pointer; }
.doc:hover { background: var(--surface-2); color: var(--text); }
.doc.on { background: var(--surface-2); color: var(--text); }
.doc__t { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.muted { padding: 0.5rem; font-size: 12.5px; color: var(--muted); }
.editor { display: flex; flex-direction: column; gap: 0.6rem; width: 100%; max-width: 46rem; margin: 0 auto; padding: 2.5rem 1.5rem; }
.title { padding: 0; border: 0; background: none; font: 700 2rem/1.2 'Geist', system-ui, sans-serif; letter-spacing: -0.02em; color: var(--text); outline: none; }
.meta { margin: 0; font-size: 12.5px; color: var(--muted); }
.saved { margin-left: 0.5rem; color: var(--accent-soft); }
.body { min-height: 50vh; padding: 0.5rem 0; border: 0; background: none; font: 400 15px/1.7 'Geist', system-ui, sans-serif; color: var(--text); resize: none; outline: none; field-sizing: content; }
.del { align-self: flex-start; padding: 0.35rem 0.7rem; border: 1px solid rgb(255 91 77 / 0.35); border-radius: 6px; background: none; font-size: 12.5px; color: #ff8a80; cursor: pointer; }
.empty { display: grid; place-content: center; gap: 0.75rem; text-align: center; color: var(--muted); }
.new { padding: 0.5rem 0.9rem; border: 1px solid var(--accent); border-radius: 6px; background: rgb(229 101 21 / 0.12); cursor: pointer; }
:is(.icon, .doc, .del, .new):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
</style>
