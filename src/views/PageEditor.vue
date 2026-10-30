<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { EASE, DUR, gsap, prefersReducedMotion } from '../utils/motion'
import { useWorkspace } from '../composables/useWorkspace'
import { useUi } from '../composables/useUi'
import AppIcon from '../components/app/AppIcon.vue'

const props = defineProps({ id: { type: String, required: true }, page: { type: String, required: true } })
const router = useRouter()
const { state, project, updateItem, removeItem, member, load } = useWorkspace()
const { ui, confirmAsk } = useUi()
const p = computed(() => project(Number(props.id)))
const pg = computed(() => state.pages.find((x) => x.id === Number(props.page)))
const saving = ref('')
const looking = ref(false)
const body = ref(null)
const root = ref(null)
let timer
let pending = {}

const words = computed(() => (pg.value?.body.trim() ? pg.value.body.trim().split(/\s+/).length : 0))
function grow() {
  if (!body.value) return
  body.value.style.height = 'auto'
  body.value.style.height = `${body.value.scrollHeight}px`
}
function edit(field, value) {
  pg.value[field] = value
  pending[field] = value
  saving.value = 'saving'
  clearTimeout(timer)
  timer = setTimeout(flush, 600)
  if (field === 'body') grow()
}
async function flush() {
  clearTimeout(timer)
  const fields = pending
  pending = {}
  if (!Object.keys(fields).length || !pg.value) return
  saving.value = (await updateItem('page', pg.value, fields)) ? 'saved' : ''
}
async function archive() {
  await flush()
  await updateItem('page', pg.value, { archived: !pg.value.archived })
}
async function remove() {
  const target = pg.value
  if (!(await confirmAsk(`Apagar a página "${target.title || 'Sem título'}"?`, { message: 'Não dá para desfazer.' }))) return
  router.push(`/projetos/${props.id}/paginas`)
  await removeItem('page', target)
}

watch(() => [p.value, pg.value?.title], ([proj, title]) => (ui.crumb = proj ? `${proj.name} › ${title || 'Sem título'}` : 'Projeto não encontrado'), { immediate: true })
onMounted(async () => {
  if (!pg.value) {
    looking.value = true
    await load()
    looking.value = false
  }
  await nextTick()
  grow()
  if (!pg.value?.title) root.value?.querySelector('.title')?.focus()
  if (!prefersReducedMotion() && root.value) gsap.from(root.value.querySelectorAll('.anim'), { y: 12, opacity: 0, duration: DUR.base, stagger: 0.07, ease: EASE.out })
})
onUnmounted(flush)
</script>

<template>
  <div v-if="pg" ref="root" class="ed">
    <div class="ed__bar anim">
      <span class="pg-muted">{{ pg.is_private ? 'Privada' : 'Pública' }}, {{ member(pg.owner)?.name }}, {{ words }} {{ words === 1 ? 'palavra' : 'palavras' }}</span>
      <span class="ed__state" role="status"><ArcLoader v-if="saving === 'saving'" />{{ saving === 'saving' ? 'Salvando…' : saving === 'saved' ? 'Salvo' : '' }}</span>
      <div class="ed__actions">
        <button v-if="pg.owner === state.me && !pg.archived" type="button" class="pg-btn" @click="edit('is_private', !pg.is_private)"><AppIcon :name="pg.is_private ? 'globe' : 'lock'" :size="14" />{{ pg.is_private ? 'Tornar pública' : 'Tornar privada' }}</button>
        <button type="button" class="pg-btn" @click="archive"><AppIcon :name="pg.archived ? 'undo' : 'archive'" :size="14" />{{ pg.archived ? 'Restaurar' : 'Arquivar' }}</button>
        <button v-if="pg.archived" type="button" class="pg-btn danger" @click="remove"><AppIcon name="trash" :size="14" />Apagar</button>
      </div>
    </div>
    <p v-if="pg.archived" class="ed__note anim">Esta página está arquivada. Restaure para editar.</p>
    <article class="ed__doc">
      <input class="title anim" :value="pg.title" placeholder="Página sem título" aria-label="Título da página" maxlength="200" :readonly="pg.archived" @input="edit('title', $event.target.value)" />
      <textarea ref="body" class="body anim" :value="pg.body" placeholder="Escreva aqui: objetivos, decisões, links, atas…" aria-label="Texto da página" :readonly="pg.archived" @input="edit('body', $event.target.value)" />
    </article>
  </div>
  <div v-else-if="looking" class="pg-empty" role="status"><h2>Abrindo a página…</h2></div>
  <div v-else class="pg-empty"><h2>Essa página não existe mais.</h2><RouterLink :to="`/projetos/${id}/paginas`" class="pg-btn">Ver documentos do projeto</RouterLink></div>
</template>

<style scoped>
.ed { display: flex; flex-direction: column; min-height: 100%; }
.ed__bar { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; min-height: 48px; padding: 0.4rem 1.25rem; border-bottom: 1px solid var(--line); }
.ed__state { font-size: 12.5px; color: var(--accent-soft); }
.ed__actions { display: flex; gap: 0.4rem; margin-left: auto; }
.danger { color: var(--danger, #ff8a80); }
.ed__note { margin: 1rem auto 0; padding: 0.55rem 0.9rem; border: 1px solid var(--line-strong); border-radius: 8px; background: var(--surface); font-size: 13px; color: var(--muted); }
.ed__doc { display: flex; flex-direction: column; gap: 1rem; width: min(46rem, 100%); margin: 0 auto; padding: 3rem 1.5rem 6rem; }
.title { width: 100%; padding: 0; border: 0; background: none; font: 700 2.2rem/1.15 'Geist', system-ui, sans-serif; letter-spacing: -0.025em; color: var(--text); outline: none; }
.title::placeholder, .body::placeholder { color: #5d5851; }
.body { width: 100%; min-height: 20rem; padding: 0; border: 0; background: none; font: 400 1rem/1.75 'Geist', system-ui, sans-serif; color: #dcd7cf; resize: none; outline: none; overflow: hidden; }
</style>
