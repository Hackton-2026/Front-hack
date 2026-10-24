<script setup>
// Favoritos: tudo o que tem estrela (projetos, visões, páginas, módulos, ciclos e tarefas) num lugar só.
// Filtra por tipo, reordena (a ordem vale para todo lugar que lista favoritos) e sugere o que você abre muito.
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { staggerIn } from '../utils/motion'
import { useWorkspace } from '../composables/useWorkspace'
import { useUi } from '../composables/useUi'
import AppIcon from '../components/app/AppIcon.vue'

const KINDS = { project: ['Projeto', 'folder'], view: ['Visão', 'layers'], page: ['Página', 'page'], module: ['Módulo', 'module'], cycle: ['Ciclo', 'cycle'], task: ['Tarefa', 'items'] }
const router = useRouter()
const { state, project, code, toggleStar, starred } = useWorkspace()
const { openTask } = useUi()
const root = ref(null)
const kind = ref('')

// "tipo:id" → o que mostrar e para onde ir; some se o item não existe mais
function resolve(key) {
  const [k, raw] = key.split(':')
  const id = Number(raw)
  const find = (list) => list.find((x) => x.id === id)
  const base = { key, kind: k, label: KINDS[k]?.[0] || k, icon: KINDS[k]?.[1] || 'star' }
  if (k === 'project') { const p = find(state.projects); return p && { ...base, title: p.name, sub: `${p.prefix || ''}`, color: p.color, go: () => router.push(`/projetos/${p.id}`) } }
  if (k === 'task') { const t = find(state.tasks); return t && { ...base, title: t.title, sub: `${code(t)} · ${project(t.projectId)?.name || 'Rascunho'}`, go: () => openTask(t) } }
  const lists = { view: ['views', 'visoes'], page: ['pages', 'paginas'], module: ['modules', 'modulos'], cycle: ['cycles', 'ciclos'] }
  if (!lists[k]) return null
  const item = find(state[lists[k][0]])
  return item && { ...base, title: item.name || item.title || 'Sem título', sub: project(item.project)?.name || '', color: project(item.project)?.color, go: () => router.push(`/projetos/${item.project}/${lists[k][1]}/${item.id}`) }
}
const all = computed(() => state.prefs.stars.map(resolve).filter(Boolean))
const counts = computed(() => Object.fromEntries(Object.keys(KINDS).map((k) => [k, all.value.filter((f) => f.kind === k).length])))
const shown = computed(() => all.value.filter((f) => !kind.value || f.kind === kind.value))
const suggestions = computed(() => state.prefs.recents.map((r) => r.key).filter((k) => !state.prefs.stars.includes(k)).map(resolve).filter(Boolean).slice(0, 4))
const unstar = (f) => { const [k, id] = f.key.split(':'); toggleStar(k, Number(id)) }
const star = (f) => { const [k, id] = f.key.split(':'); if (!starred(k, Number(id))) toggleStar(k, Number(id)) }
// mover na lista de estrelas (a ordem salva é a de prefs.stars)
function move(f, dir) {
  const stars = [...state.prefs.stars]
  const i = stars.indexOf(f.key), j = i + dir
  if (j < 0 || j >= stars.length) return
  ;[stars[i], stars[j]] = [stars[j], stars[i]]
  state.prefs.stars = stars
}
watch(kind, async () => { await nextTick(); staggerIn(root.value?.querySelectorAll('.fav')) })
onMounted(() => staggerIn(root.value?.querySelectorAll('.fav, .sug')))
</script>

<template>
  <div ref="root" class="pg favs">
    <div class="pg-bar">
      <h1>Favoritos <span class="count">{{ all.length }}</span></h1>
      <div class="pg-tabs" role="tablist">
        <button type="button" role="tab" :aria-selected="!kind" @click="kind = ''">Tudo<span class="n">{{ all.length }}</span></button>
        <template v-for="(v, k) in KINDS" :key="k">
          <button v-if="counts[k]" type="button" role="tab" :aria-selected="kind === k" @click="kind = k">{{ v[0] }}s<span class="n">{{ counts[k] }}</span></button>
        </template>
      </div>
    </div>

    <div v-if="!all.length" class="pg-empty">
      <span class="pg-empty__art"><AppIcon name="star" :size="36" /></span>
      <h2>Nada com estrela ainda</h2>
      <p>Clique na estrela de um projeto, visão, página, módulo ou tarefa e ele aparece aqui, para abrir em um clique.</p>
    </div>
    <ol v-else class="list">
      <li v-for="(f, i) in shown" :key="f.key" class="fav">
        <span class="ico" :style="f.color ? { '--c': f.color } : null"><AppIcon :name="f.icon" :size="15" /></span>
        <button type="button" class="main" @click="f.go()">
          <strong>{{ f.title }}</strong>
          <small>{{ f.label }}{{ f.sub ? ` · ${f.sub}` : '' }}</small>
        </button>
        <span v-if="!kind" class="order">
          <button type="button" class="pg-icon" :disabled="i === 0" :aria-label="`Subir ${f.title}`" @click="move(f, -1)">↑</button>
          <button type="button" class="pg-icon" :disabled="i === shown.length - 1" :aria-label="`Descer ${f.title}`" @click="move(f, 1)">↓</button>
        </span>
        <button type="button" class="pg-icon on" :aria-label="`Tirar ${f.title} dos favoritos`" title="Tirar dos favoritos" @click="unstar(f)"><AppIcon name="star" :size="15" /></button>
      </li>
    </ol>

    <section v-if="suggestions.length" class="sugs">
      <h2>Você abre bastante</h2>
      <div class="sug-grid">
        <div v-for="s in suggestions" :key="s.key" class="sug">
          <AppIcon :name="s.icon" :size="15" />
          <button type="button" class="main" @click="s.go()"><strong>{{ s.title }}</strong><small>{{ s.label }}</small></button>
          <button type="button" class="pg-btn" @click="star(s)"><AppIcon name="star" :size="13" />Favoritar</button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.favs { gap: 1rem; padding-bottom: 2rem; }
h1 { display: flex; align-items: center; gap: 0.5rem; }
.count { padding: 0.05rem 0.45rem; border-radius: 999px; background: var(--surface-2); font-size: 12px; font-weight: 500; color: var(--muted); }
.list { display: flex; flex-direction: column; margin: 0; padding: 0 1.25rem; list-style: none; }
.fav { display: flex; align-items: center; gap: 0.75rem; padding: 0.55rem 0.5rem; border-bottom: 1px solid var(--line); }
.fav:hover { background: var(--surface); }
.ico { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 8px; background: color-mix(in srgb, var(--c, var(--accent)) 18%, transparent); color: var(--c, var(--accent-soft)); }
.main { display: flex; flex: 1; flex-direction: column; gap: 0.1rem; min-width: 0; padding: 0; border: 0; background: none; color: var(--text); text-align: left; cursor: pointer; }
.main strong { overflow: hidden; font-size: 14px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
.main small { font-size: 12px; color: var(--muted); }
.main:hover strong { color: var(--accent-soft); }
.order { display: flex; opacity: 0; }
.fav:hover .order, .order:focus-within { opacity: 1; }
.pg-icon.on { color: #f2c46d; }
.pg-icon:disabled { opacity: 0.3; cursor: default; }
.sugs { padding: 0 1.25rem; }
.sugs h2 { margin: 0 0 0.6rem; font-size: 12.5px; font-weight: 600; color: var(--muted); }
.sug-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr)); gap: 0.6rem; }
.sug { display: flex; align-items: center; gap: 0.6rem; padding: 0.6rem 0.75rem; border: 1px dashed var(--line-strong); border-radius: 10px; color: var(--muted); }
.main:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
</style>
