<script setup>
// Visão geral do projeto (Plane): capa, ícone, nome e descrição editáveis, atalhos para as partes do projeto
// e o painel lateral com Propriedades, Atualizações (no prazo / em risco / atrasado) e Atividade.
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { gsap, prefersReducedMotion } from '../utils/motion'
import { COVERS, UPDATE_STATES, useWorkspace } from '../composables/useWorkspace'
import { useUi } from '../composables/useUi'
import { api } from '../services/api'
import AppIcon from '../components/app/AppIcon.vue'
import ProjectIcon from '../components/app/ProjectIcon.vue'
import { PROJECT_ICONS, iconClass } from '../components/app/projectIcons'
import Avatars from '../components/app/Avatars.vue'
import ProgressRing from '../components/app/ProgressRing.vue'

const props = defineProps({ id: { type: String, required: true } })
const { state, project, tasksOf, progress, updateProject, postUpdate, projectActivity, STATUSES, today } = useWorkspace()
const { ui, toast } = useUi()
const pid = computed(() => Number(props.id))
const p = computed(() => project(pid.value))

const panel = ref(true)
const tab = ref('info')
const picking = ref(false)
const feed = ref([])
const loadingFeed = ref(false)
const update = reactive({ state: 'on_track', text: '' })
const root = ref(null)
const desc = ref(null)

const tasks = computed(() => tasksOf(pid.value))
const people = computed(() => [...new Set(tasks.value.flatMap((t) => t.assignees))])
const cycles = computed(() => state.cycles.filter((c) => c.project === pid.value))
const activeCycle = computed(() => cycles.value.find((c) => c.start_date <= today() && c.end_date >= today()))
const LINKS = computed(() => [
  { icon: 'fi-rr-list-check', label: 'Itens de trabalho', n: tasks.value.length, to: '', hint: 'as tarefas do time' },
  { icon: 'fi-rr-refresh', label: 'Ciclos', n: cycles.value.length, to: '/ciclos', hint: 'sprints com começo e fim', key: 'cycles' },
  { icon: 'fi-rr-apps', label: 'Módulos', n: state.modules.filter((m) => m.project === pid.value).length, to: '/modulos', hint: 'partes do projeto', key: 'modules' },
  { icon: 'fi-rr-document', label: 'Páginas', n: state.pages.filter((x) => x.project === pid.value && !x.archived).length, to: '/paginas', hint: 'documentos e decisões', key: 'pages' },
  { icon: 'fi-rr-comment-alt', label: 'Chat', n: 'Converse', to: '/chat', hint: 'com o time e com a @novexo' },
  { icon: 'fi-rr-users-alt', label: 'Membros', n: p.value?.members?.length || 1, to: '/membros', hint: p.value?.my_permission === 'full' ? 'convide pessoas' : 'quem participa' },
].filter((l) => !l.key || state.prefs.features[l.key]))
const updates = computed(() => feed.value.filter((a) => a.details.kind === 'update'))
const stateOf = (id) => UPDATE_STATES.find((s) => s.id === id) || UPDATE_STATES[0]
const ago = (iso) => {
  const m = Math.round((Date.now() - new Date(iso)) / 60000)
  return m < 1 ? 'agora' : m < 60 ? `há ${m} min` : m < 1440 ? `há ${Math.round(m / 60)} h` : new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

// materiais de apoio: links para documentos, pastas, Figma, repositório...
const materials = ref([])
const newLink = reactive({ url: '', name: '', open: false, error: '' })
const canEdit = computed(() => ['edit', 'full'].includes(p.value?.my_permission))
const host = (url) => { try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url } }
const linksApi = (path = '', opts) => api(`/api/projects/${pid.value}/links/${path}`, opts)
const loadLinks = async () => { materials.value = await linksApi().catch(() => []) }
async function addLink() {
  const url = /^https?:\/\//i.test(newLink.url.trim()) ? newLink.url.trim() : `https://${newLink.url.trim()}`
  try {
    materials.value = await linksApi('', { method: 'POST', body: { url, name: newLink.name.trim() } })
    Object.assign(newLink, { url: '', name: '', open: false, error: '' })
  } catch (e) {
    newLink.error = e.message
  }
}
async function removeLink(l) {
  try { await linksApi(`${l.id}/`, { method: 'DELETE' }); materials.value = materials.value.filter((x) => x !== l) } catch (e) { toast(e.message) }
}

async function refresh() {
  if (!p.value) return
  loadLinks()
  loadingFeed.value = true
  try { feed.value = await projectActivity(pid.value) } catch { feed.value = [] } finally { loadingFeed.value = false }
}
function grow() {
  if (!desc.value) return
  desc.value.style.height = 'auto'
  desc.value.style.height = `${desc.value.scrollHeight}px`
}
async function save(fields) {
  if (await updateProject(p.value, fields)) refresh()
}
function changeCover() {
  save({ cover: (p.value.cover + 1) % COVERS.length })
  if (!prefersReducedMotion()) gsap.fromTo(root.value.querySelector('.cover'), { filter: 'brightness(1.5)' }, { filter: 'brightness(1)', duration: 0.6, ease: 'power2.out' })
}
// cor do ícone e do projeto (aparece na barra lateral, nos cards e no Kanban)
const COLORS = ['#e56515', '#fba45c', '#f2c46d', '#7fc47a', '#3fb8a5', '#4fb0c6', '#6c8cff', '#a77bf3', '#e86fa8', '#ff5b4d', '#cdcdcb', '#919599']
function pick(e) {
  picking.value = false
  save({ icon: e })
}
async function post() {
  if (!update.text.trim()) return
  const a = await postUpdate(p.value, { state: update.state, text: update.text.trim() })
  if (!a) return
  update.text = ''
  feed.value.unshift(a)
}

// painel lateral abre/fecha deslizando
async function togglePanel() {
  panel.value = !panel.value
  await nextTick()
  if (panel.value && !prefersReducedMotion()) gsap.from(root.value.querySelector('.side'), { x: 24, autoAlpha: 0, duration: 0.35, ease: 'power3.out' })
}
watch(tab, async () => {
  await nextTick()
  if (!prefersReducedMotion()) gsap.from(root.value?.querySelectorAll('.side__body > *') || [], { y: 8, autoAlpha: 0, duration: 0.3, stagger: 0.04, ease: 'power2.out' })
})
watch(p, (v) => (ui.crumb = v ? `${v.name} › Visão geral` : 'Projeto não encontrado'), { immediate: true })
watch(() => props.id, async () => { refresh(); await nextTick(); grow() })
onMounted(async () => {
  refresh()
  await nextTick()
  grow()
  if (prefersReducedMotion() || !root.value) return
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from(root.value.querySelector('.cover'), { scaleY: 0.6, transformOrigin: 'top', autoAlpha: 0, duration: 0.6 })
    .from(root.value.querySelector('.icon'), { y: 14, scale: 0.8, autoAlpha: 0, duration: 0.45 }, '-=0.3')
    .from(root.value.querySelectorAll('.doc > *:not(.icon-wrap)'), { y: 12, autoAlpha: 0, duration: 0.45, stagger: 0.06 }, '-=0.25')
    .from(root.value.querySelectorAll('.side'), { x: 20, autoAlpha: 0, duration: 0.45 }, 0.15)
})
</script>

<template>
  <div v-if="p" ref="root" class="ov" :class="{ 'has-panel': panel }">
    <div class="main">
      <div class="cover" :style="{ background: COVERS[p.cover % COVERS.length] }">
        <div class="cover__btns">
          <button v-if="state.isAdmin" type="button" class="cover__btn" @click="changeCover"><AppIcon name="image" :size="14" />Trocar capa</button>
          <button type="button" class="cover__btn" :aria-pressed="panel" :aria-label="panel ? 'Fechar painel' : 'Abrir painel'" :title="panel ? 'Fechar painel' : 'Abrir painel'" @click="togglePanel"><AppIcon name="sidebar" :size="15" /></button>
        </div>
      </div>
      <div class="doc">
        <div class="icon-wrap">
          <button type="button" class="icon" :disabled="!state.isAdmin" :aria-expanded="picking" aria-label="Trocar ícone do projeto" @click="picking = !picking">
            <ProjectIcon :icon="p.icon" :color="p.color" :size="28" />
          </button>
          <div v-if="picking" class="emojis" role="listbox" aria-label="Ícones">
            <div class="colors" role="group" aria-label="Cor do projeto">
              <button v-for="c in COLORS" :key="c" type="button" class="sw" :style="{ background: c }" :aria-pressed="p.color === c" :aria-label="`Cor ${c}`" @click="save({ color: c })" />
            </div>
            <button v-for="e in PROJECT_ICONS" :key="e" type="button" role="option" :aria-selected="iconClass(p.icon) === e" :aria-label="e.slice(6)" @click="pick(e)"><ProjectIcon :icon="e" :color="p.color" :size="17" /></button>
            <button type="button" class="none" @click="pick('')">Sem ícone</button>
            <a class="credit" href="https://www.flaticon.com/uicons" target="_blank" rel="noopener">Uicons by Flaticon</a>
          </div>
        </div>
        <input class="name" :value="p.name" aria-label="Nome do projeto" maxlength="120" :readonly="!state.isAdmin" @change="$event.target.value.trim() && save({ name: $event.target.value.trim() })" />
        <textarea ref="desc" class="desc" :value="p.description" rows="2" :readonly="!state.isAdmin" :placeholder="state.isAdmin ? 'Conte do que se trata o projeto, os objetivos e os marcos…' : 'Sem descrição.'" aria-label="Descrição do projeto" @input="grow" @change="save({ description: $event.target.value })" />
        <h2 class="sec">O que tem neste projeto</h2>
        <div class="links">
          <RouterLink v-for="l in LINKS" :key="l.label" :to="`/projetos/${p.id}${l.to}`" class="link">
            <span class="link__icon"><i :class="l.icon" aria-hidden="true" /></span>
            <span class="link__text"><strong>{{ l.label }}</strong><small>{{ l.n }} · {{ l.hint }}</small></span>
            <i class="fi-rr-arrow-small-right link__go" aria-hidden="true" />
          </RouterLink>
        </div>
        <div class="sec-row">
          <h2 class="sec">Materiais de apoio</h2>
          <button v-if="canEdit && !newLink.open" type="button" class="add-link" @click="newLink.open = true"><AppIcon name="plus" :size="13" />Adicionar link</button>
        </div>
        <form v-if="newLink.open" class="link-form" @submit.prevent="addLink">
          <input v-model="newLink.url" type="text" placeholder="https://drive.google.com/…" aria-label="Endereço do link" required @vue:mounted="({ el }) => el.focus()" />
          <input v-model="newLink.name" type="text" maxlength="120" placeholder="Nome (opcional)" aria-label="Nome do link" />
          <button type="submit" class="pg-btn primary" :disabled="!newLink.url.trim()">Adicionar</button>
          <button type="button" class="pg-btn" @click="Object.assign(newLink, { open: false, error: '' })">Cancelar</button>
          <p v-if="newLink.error" class="link-error" role="alert">{{ newLink.error }}</p>
        </form>
        <ul v-if="materials.length" class="materials">
          <li v-for="l in materials" :key="l.id">
            <a :href="l.url" target="_blank" rel="noopener noreferrer" class="material">
              <span class="link__icon"><i class="fi-rr-link-alt" aria-hidden="true" /></span>
              <span class="link__text"><strong>{{ l.name || host(l.url) }}</strong><small>{{ host(l.url) }}<template v-if="l.created_by"> · adicionado por {{ l.created_by }}</template></small></span>
            </a>
            <button v-if="canEdit" type="button" class="rm" :aria-label="`Remover ${l.name || host(l.url)}`" title="Remover" @click="removeLink(l)"><AppIcon name="trash" :size="13" /></button>
          </li>
        </ul>
        <p v-else-if="!newLink.open" class="pg-muted">Nenhum link ainda. Guarde aqui a pasta do Drive, o Figma, o repositório ou documentos do projeto.</p>
        <template v-if="activeCycle">
          <h2 class="sec">Ciclo em andamento</h2>
          <RouterLink :to="`/projetos/${p.id}/ciclos/${activeCycle.id}`" class="cycle">
            <ProgressRing :value="tasks.filter((t) => t.cycle === activeCycle.id).length ? tasks.filter((t) => t.cycle === activeCycle.id && t.status === 'done').length / tasks.filter((t) => t.cycle === activeCycle.id).length : 0" :size="38" />
            <span><strong>{{ activeCycle.name }}</strong><small>até {{ new Date(`${activeCycle.end_date}T12:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }) }}</small></span>
          </RouterLink>
        </template>
      </div>
    </div>

    <aside v-if="panel" class="side" aria-label="Detalhes do projeto">
      <div class="side__tabs" role="tablist">
        <button type="button" role="tab" :aria-selected="tab === 'info'" aria-label="Propriedades" title="Propriedades" @click="tab = 'info'"><AppIcon name="info" :size="16" /></button>
        <button type="button" role="tab" :aria-selected="tab === 'updates'" aria-label="Atualizações" title="Atualizações" @click="tab = 'updates'"><AppIcon name="bolt" :size="16" /></button>
        <button type="button" role="tab" :aria-selected="tab === 'activity'" aria-label="Atividade" title="Atividade" @click="tab = 'activity'"><AppIcon name="pulse" :size="16" /></button>
      </div>
      <div class="side__body">
        <template v-if="tab === 'info'">
          <h3>Propriedades</h3>
          <div class="prog"><ProgressRing :value="progress(p.id)" :size="54" /><span><strong>{{ tasks.filter((t) => t.status === 'done').length }} de {{ tasks.length }}</strong> itens concluídos</span></div>
          <ul class="bars">
            <li v-for="s in STATUSES" :key="s.id">
              <span>{{ s.name }}</span><b>{{ tasks.filter((t) => t.status === s.id).length }}</b>
              <i :style="{ '--w': tasks.length ? tasks.filter((t) => t.status === s.id).length / tasks.length : 0, '--c': s.color }" />
            </li>
          </ul>
          <dl class="props">
            <dt>Prefixo</dt><dd>{{ p.prefix || '—' }}</dd>
            <dt>Pessoas</dt><dd><Avatars v-if="people.length" :ids="people" :size="22" /><span v-else>—</span></dd>
            <dt>Ciclo ativo</dt><dd>{{ activeCycle?.name || 'Nenhum' }}</dd>
            <dt>Criado em</dt><dd>{{ new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) }}</dd>
          </dl>
        </template>
        <template v-else-if="tab === 'updates'">
          <h3>Atualizações</h3>
          <form class="upd" @submit.prevent="post">
            <div class="upd__states" role="radiogroup" aria-label="Situação">
              <button v-for="s in UPDATE_STATES" :key="s.id" type="button" role="radio" :aria-checked="update.state === s.id" :style="{ '--c': s.color }" @click="update.state = s.id"><i />{{ s.name }}</button>
            </div>
            <textarea v-model="update.text" rows="3" placeholder="Como está o projeto? O que avançou, o que travou…" aria-label="Texto da atualização" />
            <button type="submit" class="pg-btn primary" :disabled="!update.text.trim()">Publicar atualização</button>
          </form>
          <p v-if="!updates.length" class="pg-muted">Nenhuma atualização ainda.</p>
          <ul class="feed">
            <li v-for="a in updates" :key="a.id" class="feed__upd"><span class="chip" :style="{ '--c': stateOf(a.details.state).color }"><i />{{ stateOf(a.details.state).name }}</span><p>{{ a.text }}</p><time>{{ ago(a.at) }}</time></li>
          </ul>
        </template>
        <template v-else>
          <h3>Atividade</h3>
          <p v-if="loadingFeed && !feed.length" class="pg-muted">Carregando…</p>
          <p v-else-if="!feed.length" class="pg-muted">Nada por aqui ainda.</p>
          <ul class="feed">
            <li v-for="a in feed" :key="a.id"><span class="feed__ic"><AppIcon :name="a.details.kind === 'update' ? 'bolt' : a.taskId ? 'items' : 'doc'" :size="13" /></span><p>{{ a.text }}</p><time>{{ ago(a.at) }}</time></li>
          </ul>
        </template>
      </div>
    </aside>
  </div>
  <div v-else class="pg-empty"><h2>Esse projeto não existe mais.</h2><RouterLink to="/projetos" class="pg-btn">Ver projetos</RouterLink></div>
</template>

<style scoped>
.ov { display: grid; grid-template-columns: 1fr; min-height: 100%; }
.ov.has-panel { grid-template-columns: minmax(0, 1fr) 22rem; }
.main { min-width: 0; }
.cover { position: relative; height: 8.5rem; }
.cover__btns { position: absolute; right: 0.9rem; top: 0.8rem; display: flex; gap: 0.4rem; }
.cover__btn { display: inline-flex; align-items: center; gap: 0.35rem; height: 28px; padding: 0 0.6rem; border: 1px solid rgb(255 255 255 / 0.12); border-radius: 6px; background: rgb(15 14 13 / 0.6); backdrop-filter: blur(8px); font-size: 12.5px; color: var(--text); cursor: pointer; }
.cover__btn:hover { background: rgb(15 14 13 / 0.85); }
.doc { display: flex; flex-direction: column; gap: 0.5rem; width: min(46rem, 100%); padding: 0 2.5rem 4rem; }
.icon-wrap { position: relative; margin-top: -1.9rem; }
.icon { display: grid; place-items: center; width: 3.6rem; height: 3.6rem; padding: 0; border: 1px solid var(--line-strong); border-radius: 12px; background: var(--surface); font-size: 1.9rem; line-height: 1; cursor: pointer; box-shadow: 0 10px 24px rgb(0 0 0 / 0.35); transition: translate 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.icon:not(:disabled):hover { translate: 0 -2px; }
.icon:disabled { cursor: default; }
.sq { width: 1.4rem; height: 1.4rem; border-radius: 6px; }
.emojis { position: absolute; top: calc(100% + 6px); left: 0; z-index: 20; display: grid; grid-template-columns: repeat(8, 2.1rem); gap: 2px; padding: 0.4rem; border: 1px solid var(--line-strong); border-radius: 10px; background: var(--surface); box-shadow: 0 18px 40px rgb(0 0 0 / 0.45); }
.emojis button { display: grid; place-items: center; width: 2.1rem; height: 2.1rem; padding: 0; border: 0; border-radius: 6px; background: none; color: var(--muted); cursor: pointer; }
.emojis button:hover, .emojis button[aria-selected='true'] { color: var(--text); }
.emojis button:hover, .emojis button[aria-selected='true'] { background: var(--surface-2); }
.emojis .credit { grid-column: 1 / -1; padding: 0.2rem 0 0; font-size: 11px; color: var(--muted); text-align: center; text-decoration: none; }
.emojis .credit:hover { color: var(--text); }
.emojis .colors { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 0.35rem; padding: 0.15rem 0.2rem 0.5rem; margin-bottom: 0.2rem; border-bottom: 1px solid var(--line); }
.emojis .sw { width: 20px; height: 20px; border-radius: 50%; }
.emojis .sw:hover { transform: scale(1.12); }
.emojis .sw[aria-pressed='true'] { box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px var(--text); }
.emojis .sw:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
.emojis .none { grid-column: 1 / -1; width: auto; height: 28px; font-size: 12.5px; color: var(--muted); }
.name { margin-top: 0.75rem; padding: 0; border: 0; background: none; font: 650 1.15rem/1.3 'Geist', system-ui, sans-serif; color: var(--muted); outline: none; }
.desc { width: 100%; padding: 0.25rem 0; border: 0; border-radius: 6px; background: none; font: 400 1.05rem/1.7 'Geist', system-ui, sans-serif; color: var(--text); resize: none; overflow: hidden; outline: none; }
.desc::placeholder { color: #5d5851; }
.name:focus-visible, .desc:focus-visible { box-shadow: 0 0 0 1px var(--line-strong); }
.sec { margin: 1.5rem 0 0.4rem; padding-top: 1.25rem; border-top: 1px solid var(--line); font: 600 1.05rem/1.3 'Geist', system-ui, sans-serif; color: var(--text); }
/* materiais de apoio */
.sec-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin: 1.5rem 0 0.4rem; padding-top: 1.25rem; border-top: 1px solid var(--line); }
.sec-row .sec { margin: 0; padding: 0; border: 0; }
.add-link { display: inline-flex; align-items: center; gap: 0.35rem; height: 28px; padding: 0 0.6rem; border: 1px solid var(--line); border-radius: 6px; background: none; font-size: 12.5px; color: var(--muted); cursor: pointer; }
.add-link:hover { border-color: var(--line-strong); color: var(--text); }
.link-form { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.6rem; }
.link-form input { flex: 1 1 12rem; min-width: 0; height: 32px; padding: 0 0.65rem; border: 1px solid var(--line); border-radius: 6px; background: var(--bg); font: inherit; font-size: 13px; color: var(--text); outline: none; }
.link-form input:focus { border-color: var(--accent); }
.link-error { flex-basis: 100%; margin: 0; font-size: 12.5px; color: #ffb4ab; }
.materials { display: flex; flex-direction: column; gap: 0.4rem; margin: 0; padding: 0; list-style: none; }
.materials li { display: flex; align-items: center; gap: 0.4rem; }
.material { display: flex; flex: 1; align-items: center; gap: 0.75rem; min-width: 0; padding: 0.55rem 0.75rem; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); color: var(--text); text-decoration: none; transition: border-color 0.2s var(--ease); }
.material:hover { border-color: var(--line-strong); }
.material .link__icon { width: 30px; height: 30px; font-size: 14px; }
.material small { font-size: 12.5px; color: var(--muted); }
.rm { display: grid; place-items: center; flex-shrink: 0; width: 30px; height: 30px; border: 0; border-radius: 6px; background: none; color: var(--muted); cursor: pointer; }
.rm:hover { background: var(--surface-2); color: var(--text); }
:is(.add-link, .material, .rm):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
.links { display: grid; grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); gap: 0.6rem; }
.link, .cycle { display: flex; align-items: center; gap: 0.75rem; padding: 0.8rem 0.9rem; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); color: var(--text); text-decoration: none; transition: border-color 0.2s var(--ease), translate 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.link:hover, .cycle:hover { border-color: var(--line-strong); translate: 0 -2px; }
.link { min-height: 4.25rem; }
.link__icon { display: grid; place-items: center; flex-shrink: 0; width: 36px; height: 36px; border-radius: 8px; background: var(--surface-2); color: var(--text); font-size: 17px; line-height: 1; }
.link__icon i::before, .link__go::before { display: block; line-height: 1; }
.link__text strong, .link__text small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } /* uma linha só: os cartões ficam todos da mesma altura */
.link__text, .cycle span { display: flex; flex-direction: column; min-width: 0; } /* só o texto: a caixa do ícone também é span */
.link small, .cycle small { font-size: 12.5px; color: var(--muted); }
.link__go { flex-shrink: 0; margin-left: auto; font-size: 16px; color: var(--muted); transition: translate 0.25s var(--ease), color 0.2s var(--ease); }
.link:hover .link__go { translate: 3px 0; color: var(--text); }
.side { position: sticky; top: 0; align-self: start; display: flex; flex-direction: column; gap: 1rem; max-height: calc(100vh - 97px); overflow-y: auto; padding: 1rem 1.1rem; border-left: 1px solid var(--line); }
.side__tabs { display: grid; grid-template-columns: repeat(3, 1fr); padding: 3px; border-radius: 8px; background: var(--surface); }
.side__tabs button { display: grid; place-items: center; height: 28px; border: 0; border-radius: 6px; background: none; color: var(--muted); cursor: pointer; }
.side__tabs button[aria-selected='true'] { background: var(--surface-2); color: var(--text); }
.side__tabs button:focus-visible, .upd__states button:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 1px; }
.side__body { display: flex; flex-direction: column; gap: 0.9rem; }
h3 { margin: 0; font: 600 1.05rem/1.3 'Geist', system-ui, sans-serif; color: var(--text); }
.prog { display: flex; align-items: center; gap: 0.8rem; font-size: 13px; color: var(--muted); }
.prog strong { color: var(--text); }
.bars { display: flex; flex-direction: column; gap: 0.55rem; margin: 0; padding: 0; list-style: none; }
.bars li { display: grid; grid-template-columns: 1fr auto; gap: 0.25rem; font-size: 13px; }
.bars b { font-weight: 600; font-variant-numeric: tabular-nums; }
.bars i { grid-column: 1 / -1; height: 4px; border-radius: 999px; background: linear-gradient(90deg, var(--c) calc(var(--w) * 100%), var(--surface-2) 0); }
.props { display: grid; grid-template-columns: 6.5rem 1fr; gap: 0.55rem 0.5rem; margin: 0; font-size: 13px; }
.props dt { color: var(--muted); }
.props dd { margin: 0; }
.upd { display: flex; flex-direction: column; gap: 0.5rem; }
.upd__states { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.upd__states button, .chip { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.25rem 0.55rem; border: 1px solid var(--line-strong); border-radius: 999px; background: none; font-size: 12.5px; color: var(--muted); cursor: pointer; }
.upd__states button[aria-checked='true'] { border-color: var(--c); color: var(--text); background: color-mix(in srgb, var(--c) 14%, transparent); }
.upd__states i, .chip i { width: 7px; height: 7px; border-radius: 50%; background: var(--c); }
.chip { cursor: default; align-self: flex-start; }
.upd textarea { width: 100%; padding: 0.55rem 0.65rem; border: 1px solid var(--line-strong); border-radius: 8px; background: var(--bg); font: inherit; color: var(--text); resize: vertical; outline: none; }
.upd textarea:focus { border-color: var(--accent); }
.upd .pg-btn { align-self: flex-end; }
.upd .pg-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.feed { display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none; }
.feed li { position: relative; display: grid; grid-template-columns: 26px 1fr; gap: 0 0.6rem; padding: 0 0 0.9rem; }
.feed li::before { content: ''; position: absolute; left: 12.5px; top: 26px; bottom: 0; width: 1px; background: var(--line); }
.feed li:last-child::before { display: none; }
.feed__ic { display: grid; place-items: center; width: 26px; height: 26px; border: 1px solid var(--line-strong); border-radius: 7px; background: var(--surface); color: var(--muted); }
.feed p { margin: 0; font-size: 13px; line-height: 1.45; }
.feed time { grid-column: 2; font-size: 11.5px; color: var(--muted); }
.feed__upd { display: flex !important; flex-direction: column; gap: 0.35rem !important; padding: 0.75rem !important; border: 1px solid var(--line); border-radius: 10px; margin-bottom: 0.5rem; }
.feed__upd::before { display: none; }
@media (max-width: 1100px) {
  .ov.has-panel { grid-template-columns: 1fr; }
  .side { position: static; max-height: none; border-top: 1px solid var(--line); border-left: 0; }
  .doc { padding: 0 1.25rem 3rem; }
}
</style>
