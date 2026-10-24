<script setup>
// Home (como a do Plane): saudação com data e hora, card da Novexo IA, links rápidos e recentes
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { gsap, prefersReducedMotion } from '../utils/motion'
import { useAuth } from '../composables/useAuth'
import { useWorkspace } from '../composables/useWorkspace'
import { useUi } from '../composables/useUi'
import AppIcon from '../components/app/AppIcon.vue'
import ProjectIcon from '../components/app/ProjectIcon.vue'
import Avatars from '../components/app/Avatars.vue'
import StatusBadge from '../components/app/StatusBadge.vue'
import PriorityFlag from '../components/app/PriorityFlag.vue'
import AppSelect from '../components/app/AppSelect.vue'

const router = useRouter()
const { user } = useAuth()
const { state, project, code } = useWorkspace()
const { openTask } = useUi()
const root = ref(null)
const now = ref(new Date())
let clock

const name = computed(() => [user.value?.first_name, user.value?.last_name].filter(Boolean).join(' ') || user.value?.username || '')
const hello = computed(() => { const h = now.value.getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite' })
const sky = computed(() => { const h = now.value.getHours(); return h >= 6 && h < 18 ? '☀️' : '🌙' })
const when = computed(() => {
  const d = now.value
  const wd = d.toLocaleDateString('pt-BR', { weekday: 'long' })
  return `${wd[0].toUpperCase()}${wd.slice(1).replace('-feira', '')}, ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
})
const ago = (iso) => {
  const m = Math.round((now.value - new Date(iso)) / 60000)
  if (m < 1) return 'agora mesmo'
  if (m < 60) return `há ${m} ${m === 1 ? 'minuto' : 'minutos'}`
  const h = Math.round(m / 60)
  if (h < 24) return `há ${h} ${h === 1 ? 'hora' : 'horas'}`
  const d = Math.round(h / 24)
  return `há ${d} ${d === 1 ? 'dia' : 'dias'}`
}

// ---- links rápidos (pessoais, no navegador)
const adding = ref(false)
const link = reactive({ title: '', url: '' })
const linkErr = ref('')
const isExternal = (url) => /^https?:\/\//.test(url)
function openLink(l) {
  if (isExternal(l.url)) window.open(l.url, '_blank', 'noopener')
  else router.push(l.url)
}
async function startLink() {
  adding.value = true
  linkErr.value = ''
  await nextTick()
  root.value.querySelector('.ql-form input')?.focus()
}
function saveLink() {
  let url = link.url.trim()
  if (url && !url.startsWith('/') && !isExternal(url)) url = `https://${url}`
  try { if (isExternal(url)) new URL(url) } catch { url = '' }
  if (!url) return (linkErr.value = 'Cole um endereço válido (ex.: github.com/time ou /wiki).')
  const title = link.title.trim() || (isExternal(url) ? new URL(url).hostname.replace(/^www\./, '') : url)
  state.prefs.quicklinks = [...state.prefs.quicklinks, { id: `q${Date.now().toString(36)}`, title, url, at: new Date().toISOString() }]
  Object.assign(link, { title: '', url: '' })
  adding.value = false
}
const removeLink = (l) => (state.prefs.quicklinks = state.prefs.quicklinks.filter((x) => x.id !== l.id))

// ---- recentes: o que foi aberto por último (tarefas, projetos, páginas)
const filter = ref('all')
const FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'task', label: 'Itens de trabalho' },
  { value: 'project', label: 'Projetos' },
  { value: 'page', label: 'Páginas' },
]
const recents = computed(() => {
  const list = state.prefs.recents.map((r) => {
    const [kind, raw] = r.key.split(':')
    const id = Number(raw)
    const item = kind === 'task' ? state.tasks.find((t) => t.id === id) : kind === 'project' ? project(id) : state.pages.find((p) => p.id === id)
    return item && { kind, item, at: r.at, key: r.key }
  }).filter(Boolean)
  // primeiro acesso: mostra as tarefas mexidas por último
  const base = list.length ? list : state.tasks.filter((t) => !t.draft).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6).map((t) => ({ kind: 'task', item: t, at: t.updatedAt, key: `task:${t.id}` }))
  return base.filter((r) => filter.value === 'all' || r.kind === filter.value).slice(0, 10)
})
function openRecent(r) {
  if (r.kind === 'task') openTask(r.item)
  else if (r.kind === 'project') router.push(`/projetos/${r.item.id}/visao-geral`)
  else router.push(`/projetos/${r.item.project}/paginas/${r.item.id}`)
}

// GSAP: entrada em cascata e o cursor da ilustração indo de "Perguntar" para "Construir" em loop
let tl
onMounted(() => {
  clock = setInterval(() => (now.value = new Date()), 30000)
  if (prefersReducedMotion() || !root.value) return
  const q = (s) => root.value.querySelectorAll(s)
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from(q('.hello > *'), { y: 12, opacity: 0, duration: 0.55, stagger: 0.08 })
    .from(q('.block'), { y: 16, opacity: 0, duration: 0.5, stagger: 0.09 }, '-=0.25')
    .from(q('.ql, .rec'), { y: 8, opacity: 0, duration: 0.35, stagger: 0.04 }, '-=0.3')
  tl = gsap.timeline({ repeat: -1, repeatDelay: 1.2, delay: 1 })
    .set(q('.mock__opt'), { backgroundColor: 'transparent' })
    .fromTo(q('.mock__cursor'), { x: 34, y: 34 }, { x: 0, y: 0, duration: 0.9, ease: 'power2.inOut' })
    .to(q('.mock__opt.is-build'), { backgroundColor: 'rgba(255,255,255,0.07)', duration: 0.2 })
    .to(q('.mock__cursor'), { scale: 0.85, duration: 0.1, yoyo: true, repeat: 1 })
    .to(q('.mock__check'), { y: 23, duration: 0.3, ease: 'power2.out' }, '<')
    .to(q('.mock__mode'), { text: 'Construir', duration: 0 }, '<')
    .to({}, { duration: 1.6 })
    .to(q('.mock__check'), { y: 0, duration: 0.3 })
})
onUnmounted(() => { clearInterval(clock); tl?.kill() })
</script>

<template>
  <div ref="root" class="home">
    <header class="hello">
      <h1>{{ hello }}{{ name ? `, ${name}` : '' }}</h1>
      <p><span aria-hidden="true">{{ sky }}</span> <time :datetime="now.toISOString()">{{ when }}</time></p>
    </header>

    <section class="block" aria-labelledby="ai-title">
      <header class="block__head">
        <h2 id="ai-title">Pergunte à Novexo IA</h2>
        <RouterLink to="/ia" class="icon-link" aria-label="Abrir a Novexo IA em tela cheia" title="Abrir em tela cheia"><AppIcon name="arrow" :size="15" /></RouterLink>
      </header>
      <div class="ai">
        <div class="mock" aria-hidden="true">
          <span class="mock__ws"><i>✦</i>{{ state.workspaceName || 'Seu workspace' }}</span>
          <span class="mock__label">Pergunte à Novexo IA</span>
          <div class="mock__menu">
            <span class="mock__opt"><AppIcon name="search" :size="13" />Perguntar<AppIcon name="check" :size="13" class="mock__check" /></span>
            <span class="mock__opt is-build"><AppIcon name="draft" :size="13" />Construir</span>
          </div>
          <span class="mock__pill"><AppIcon name="search" :size="12" /><span class="mock__mode">Perguntar</span></span>
          <svg class="mock__cursor" viewBox="0 0 24 24" width="20" height="20"><path d="M5 3l14 8-6 1.5L10 19z" /></svg>
        </div>
        <div class="ai__text">
          <h3>A Novexo IA agora faz coisas por você.</h3>
          <p>Use o modo Construir para criar tarefas, ciclos e mais. Ative agora para a IA começar a agir no seu workspace.</p>
          <RouterLink to="/ia" class="btn primary">Ativar a Novexo IA</RouterLink>
        </div>
      </div>
    </section>

    <section class="block" aria-labelledby="ql-title">
      <header class="block__head">
        <h2 id="ql-title">Links rápidos</h2>
        <button type="button" class="btn" @click="startLink"><AppIcon name="plus" :size="14" />Adicionar link rápido</button>
      </header>
      <form v-if="adding" class="ql-form" @submit.prevent="saveLink" @keydown.esc="adding = false">
        <input v-model="link.url" placeholder="Endereço (github.com/time, /wiki…)" aria-label="Endereço do link" />
        <input v-model="link.title" placeholder="Nome (opcional)" aria-label="Nome do link" maxlength="60" />
        <button type="submit" class="btn primary">Adicionar</button>
        <button type="button" class="btn" @click="adding = false">Cancelar</button>
        <p v-if="linkErr" class="err" role="alert">{{ linkErr }}</p>
      </form>
      <div v-if="state.prefs.quicklinks.length" class="qls">
        <div v-for="l in state.prefs.quicklinks" :key="l.id" class="ql">
          <button type="button" class="ql__open" @click="openLink(l)">
            <span class="ql__icon"><AppIcon :name="isExternal(l.url) ? 'globe' : 'doc'" :size="17" /></span>
            <span class="ql__text"><strong>{{ l.title }}</strong><small>{{ ago(l.at) }}</small></span>
          </button>
          <button type="button" class="ql__x" :aria-label="`Remover ${l.title}`" @click="removeLink(l)"><AppIcon name="close" :size="13" /></button>
        </div>
      </div>
      <p v-else-if="!adding" class="muted">Guarde aqui os links que o time abre todo dia.</p>
    </section>

    <section class="block" aria-labelledby="rec-title">
      <header class="block__head">
        <h2 id="rec-title">Recentes</h2>
        <AppSelect v-model="filter" :options="FILTERS" size="sm" aria-label="Filtrar recentes" />
      </header>
      <ul class="recs">
        <li v-for="r in recents" :key="r.key" class="rec">
          <button type="button" @click="openRecent(r)">
            <template v-if="r.kind === 'task'">
              <AppIcon name="items" :size="15" class="rec__ic" /><span class="rec__code">{{ code(r.item) }}</span><strong>{{ r.item.title }}</strong>
            </template>
            <template v-else-if="r.kind === 'project'">
              <ProjectIcon class="rec__emoji" :icon="r.item.icon || 'fi-rr-folder-open'" :color="r.item.color" :size="15" /><span class="rec__code">{{ r.item.prefix }}</span><strong>{{ r.item.name }}</strong>
            </template>
            <template v-else>
              <AppIcon name="page" :size="15" class="rec__ic" /><strong>{{ r.item.title || 'Sem título' }}</strong>
            </template>
            <span class="rec__ago">{{ ago(r.at) }}</span>
          </button>
          <span class="rec__side">
            <template v-if="r.kind === 'task'"><StatusBadge :status="r.item.status" compact /><PriorityFlag :priority="r.item.priority" /></template>
            <Avatars v-else-if="r.kind === 'project'" :ids="[state.me]" :size="22" />
            <span v-else class="rec__code">{{ project(r.item.project)?.name }}</span>
          </span>
        </li>
        <li v-if="!recents.length" class="muted">Abra uma tarefa, projeto ou página e ela aparece aqui.</li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.home { display: flex; flex-direction: column; gap: 2.25rem; width: min(47rem, 100%); margin: 0 auto; padding: 2.5rem 1.25rem 4rem; }
.hello { text-align: center; }
h1 { margin: 0; font: 650 clamp(1.4rem, 2.2vw, 1.65rem)/1.25 'Geist', system-ui, sans-serif; letter-spacing: -0.02em; color: var(--text); }
.hello p { margin: 0.25rem 0 0; font-size: 1rem; color: var(--muted); }
.block { display: flex; flex-direction: column; gap: 0.85rem; }
.block__head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
h2 { margin: 0; font: 600 15px/1.3 'Geist', system-ui, sans-serif; color: #d6d1c9; }
.icon-link { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 6px; color: var(--muted); }
.icon-link:hover { background: var(--surface-2); color: var(--text); }
.btn { display: inline-flex; align-items: center; gap: 0.4rem; height: 32px; padding: 0 0.8rem; border: 1px solid var(--line-strong); border-radius: 7px; background: var(--surface); font-size: 13.5px; font-weight: 500; color: var(--text); text-decoration: none; white-space: nowrap; cursor: pointer; transition: border-color 0.2s var(--ease), background 0.2s var(--ease); }
.btn:hover { border-color: var(--accent); }
.btn.primary { border-color: var(--accent); background: var(--accent); color: #140700; }
.btn.primary:hover { background: var(--accent-soft); }

/* card da IA */
.ai { display: grid; grid-template-columns: minmax(0, 17rem) 1fr; align-items: center; gap: 2rem; padding: 1.1rem; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); }
.mock { position: relative; display: flex; flex-direction: column; gap: 0.4rem; height: 8.5rem; padding: 0.9rem 1rem 0.9rem 3rem; overflow: hidden; border-radius: 8px; background: linear-gradient(160deg, #1f1c19, #141210); font-size: 11.5px; color: var(--muted); }
.mock__ws { align-self: flex-start; display: inline-flex; gap: 0.3rem; padding: 0.15rem 0.45rem; border: 1px solid var(--line-strong); border-radius: 5px; color: var(--text); }
.mock__ws i { font-style: normal; color: var(--accent-soft); }
.mock__label { opacity: 0.6; }
.mock__menu { position: relative; display: flex; flex-direction: column; width: 8.5rem; padding: 0.25rem; margin-top: -0.6rem; border: 1px solid var(--line-strong); border-radius: 7px; background: var(--surface-2); box-shadow: 0 10px 22px rgb(0 0 0 / 0.45); }
.mock__opt { display: flex; align-items: center; gap: 0.35rem; height: 23px; padding: 0 0.4rem; border-radius: 5px; color: var(--text); }
.mock__check { position: absolute; right: 0.55rem; top: 0.45rem; color: var(--accent-soft); }
.mock__pill { align-self: flex-start; display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.15rem 0.45rem; border: 1px solid var(--line-strong); border-radius: 5px; color: var(--text); }
.mock__cursor { position: absolute; left: 8.7rem; top: 4.55rem; fill: #fff; stroke: #000; stroke-width: 1.2; filter: drop-shadow(0 2px 3px rgb(0 0 0 / 0.5)); }
.ai__text h3 { margin: 0 0 0.45rem; font: 600 1.15rem/1.3 'Geist', system-ui, sans-serif; color: var(--text); }
.ai__text p { margin: 0 0 1rem; color: #cfc9c0; line-height: 1.55; }

/* links rápidos */
.ql-form { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.ql-form input { flex: 1 1 12rem; height: 34px; padding: 0 0.65rem; border: 1px solid var(--line-strong); border-radius: 7px; background: var(--bg); font: inherit; color: var(--text); outline: none; }
.ql-form input:focus { border-color: var(--accent); }
.err { flex-basis: 100%; margin: 0; font-size: 12.5px; color: #ff8a7a; }
.qls { display: grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); gap: 0.6rem; }
.ql { position: relative; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); transition: border-color 0.2s var(--ease), translate 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.ql:hover { border-color: var(--line-strong); translate: 0 -2px; }
.ql__open { display: flex; align-items: center; gap: 0.75rem; width: 100%; padding: 0.7rem 0.8rem; border: 0; background: none; text-align: left; cursor: pointer; }
.ql__icon { display: grid; flex-shrink: 0; place-items: center; width: 36px; height: 36px; border-radius: 8px; background: var(--surface-2); color: var(--accent-soft); }
.ql__text { display: flex; flex-direction: column; min-width: 0; }
.ql__text strong { overflow: hidden; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; color: var(--text); }
.ql__text small { font-size: 12.5px; color: var(--muted); }
.ql__x { position: absolute; top: 6px; right: 6px; display: grid; place-items: center; width: 22px; height: 22px; padding: 0; border: 0; border-radius: 5px; background: var(--surface-2); color: var(--muted); cursor: pointer; opacity: 0; transition: opacity 0.15s; }
.ql:hover .ql__x, .ql__x:focus-visible { opacity: 1; }
.ql__x:hover { color: var(--text); }

/* recentes */
.recs { display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none; }
.rec { display: flex; align-items: center; gap: 0.75rem; border-radius: 7px; transition: background 0.2s var(--ease); }
.rec:hover { background: var(--surface); }
.rec button { display: flex; flex: 1; align-items: center; gap: 0.6rem; min-width: 0; padding: 0.55rem 0.5rem; border: 0; background: none; color: var(--text); text-align: left; cursor: pointer; }
.rec strong { overflow: hidden; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
.rec__ic { flex-shrink: 0; color: var(--muted); }
.rec__emoji { width: 15px; font-size: 14px; line-height: 1; }
.rec__code { flex-shrink: 0; font: 500 12px/1 'Geist Mono', monospace; color: var(--muted); }
.rec__ago { flex-shrink: 0; font-size: 12.5px; color: var(--muted); }
.rec__side { display: flex; flex-shrink: 0; align-items: center; gap: 0.4rem; padding-right: 0.5rem; }
.muted { margin: 0; font-size: 13px; color: var(--muted); }
:is(.btn, .icon-link, .ql__open, .ql__x, .rec button):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
@media (max-width: 640px) {
  .ai { grid-template-columns: 1fr; gap: 1rem; }
  .rec__ago, .rec__side { display: none; }
}
</style>
