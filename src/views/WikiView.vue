<script setup>
// Wiki pessoal (o workspace é seu): coleções, subpáginas, favoritas e arquivadas, etiquetas,
// para escrever com o time existem as Páginas de cada projeto, que quem participa do projeto vê.
// (Antes havia páginas "privadas" x "do time"; agora toda página é sua e fica numa coleção.)
// editor em Markdown com visualização, sumário, histórico de versões e ações da página.
// shortcut: as páginas ainda ficam neste navegador (state.docs); passar para a API quando a Wiki tiver endpoint
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { gsap, prefersReducedMotion } from '../utils/motion'
import { esc, outline, render, toggleCheck } from '../utils/markdown'
import { dbView } from '../utils/dbviews'
import { useAuth } from '../composables/useAuth'
import { useWorkspace } from '../composables/useWorkspace'
import { useOnboarding } from '../composables/useOnboarding'
import { useUi } from '../composables/useUi'
import AppIcon from '../components/app/AppIcon.vue'
import AppSelect from '../components/app/AppSelect.vue'
import BlockMenu from '../components/app/BlockMenu.vue'

const DOC_DEFAULTS = { icon: '', collectionId: 'geral', parentId: null, archived: false, locked: false, favorite: false, fullWidth: false, labels: [], versions: [] }
const ICONS = ['', '📄', '📌', '✅', '🚀', '💡', '📚', '🧭', '🛠️', '📈', '🗓️', '🔒', '🎯', '🧪', '👋']
const TOOLBAR = [
  ['H1', '# ', ''], ['H2', '## ', ''], ['B', '**', '**'], ['I', '*', '*'], ['S', '~~', '~~'],
  ['• Lista', '- ', ''], ['☐ Tarefa', '- [ ] ', ''], ['1. Lista', '1. ', ''], ['❝', '> ', ''], ['</>', '`', '`'], ['Link', '[', '](https://)'], ['—', '\n---\n', ''],
]
const LABEL_COLORS = ['#e56515', '#fba45c', '#f2c46d', '#7fc47a', '#3b82f6', '#a855f7', '#ec4899', '#919599']

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const { state, createDoc, createTask, code, project, member, today, STATUSES, PRIORITIES } = useWorkspace()
const { complete } = useOnboarding()
const { toast, openTask } = useUi()

// Páginas e ajustes antigos ganham os campos novos
state.prefs.wiki ||= { collections: [{ id: 'geral', name: 'Minhas páginas' }], labels: [] }
const wiki = state.prefs.wiki
if (!wiki.collections.length) wiki.collections.push({ id: 'geral', name: 'Minhas páginas' })
const geral = wiki.collections.find((c) => c.id === 'geral')
if (geral?.name === 'Geral') geral.name = 'Minhas páginas'
for (const d of state.docs) for (const [k, v] of Object.entries(DOC_DEFAULTS)) if (!(k in d)) d[k] = structuredClone(v)

const activeId = ref(route.query.doc || null)
const q = ref('')
const labelFilter = ref('')
const mode = ref('edit') // edit | view
const expanded = ref(new Set())
const editor = ref(null)
const area = ref(null)
const saved = ref('')
const confirmDel = ref(false)
const newLabel = ref('')
const showVersions = ref(false)

const doc = computed(() => state.docs.find((d) => d.id === activeId.value))
const byId = (id) => state.docs.find((d) => d.id === id)
const children = (id) => state.docs.filter((d) => d.parentId === id && !d.archived)
const descendants = (id) => state.docs.filter((d) => d.parentId === id).flatMap((c) => [c, ...descendants(c.id)]) // inclui arquivadas: restaurar traz tudo de volta
const label = (id) => wiki.labels.find((l) => l.id === id)
const matches = (d) => (!q.value || `${d.title} ${d.body}`.toLowerCase().includes(q.value.toLowerCase())) && (!labelFilter.value || d.labels.includes(labelFilter.value))
const filtering = computed(() => !!(q.value || labelFilter.value))

// Árvore achatada (página + profundidade); com busca ou etiqueta vira lista simples
function tree(list, parentId = null, depth = 0) {
  if (filtering.value) return list.filter(matches).map((d) => ({ d, depth: 0 }))
  return list.filter((d) => d.parentId === parentId || (parentId === null && !list.some((p) => p.id === d.parentId)))
    .flatMap((d) => [{ d, depth }, ...(expanded.value.has(d.id) ? tree(list.filter((x) => x.parentId === d.id), d.id, depth + 1) : [])])
}
const live = computed(() => state.docs.filter((d) => !d.archived))
const sections = computed(() => [
  // página de coleção apagada (ou antiga, sem coleção) cai na primeira coleção, para nunca sumir da lista
  ...wiki.collections.map((c, i) => ({ key: c.id, name: c.name, collection: c,
    rows: tree(live.value.filter((d) => d.collectionId === c.id || (i === 0 && !wiki.collections.some((x) => x.id === d.collectionId)))) })),
  { key: 'archived', name: 'Arquivadas', rows: state.docs.filter((d) => d.archived && matches(d)).map((d) => ({ d, depth: 0 })) },
])
const favorites = computed(() => live.value.filter((d) => d.favorite))
const recents = computed(() => [...live.value].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6))
const crumbs = computed(() => {
  const out = []
  for (let p = doc.value && byId(doc.value.parentId); p; p = byId(p.parentId)) out.unshift(p)
  return out
})
// blocos que dependem do resto do site (base de dados, botão, navegação, bloco sincronizado)
function ctx(seen = new Set()) {
  return {
    docTitle: (id) => byId(id)?.title,
    embed(kind, arg) {
      if (kind.startsWith('db:')) {
        const pid = arg === 'all' ? null : Number(arg)
        const list = state.tasks.filter((t) => !t.draft && (!pid || t.projectId === pid))
        return dbView(kind.slice(3), list, pid ? project(pid)?.name || 'Projeto removido' : 'Todos os projetos', { STATUSES, PRIORITIES, code, project, member, today: today() })
      }
      if (kind === 'button') return `<button type="button" class="md-btn" data-action="task" data-title="${esc(arg)}">＋ ${esc(arg || 'Nova tarefa')}</button>`
      if (kind === 'breadcrumb') return `<nav class="md-crumbs">${[...crumbs.value, doc.value].map((d) => `<a href="?doc=${d.id}" data-doc="${d.id}">${esc(d.icon || '📄')} ${esc(d.title || 'Sem título')}</a>`).join('<span>/</span>')}</nav>`
      if (kind === 'sync') {
        const d = byId(arg)
        if (!d) return '<p class="md-empty">A página deste bloco sincronizado não existe mais.</p>'
        if (seen.has(arg)) return '<p class="md-empty">Bloco sincronizado apontando para ele mesmo.</p>'
        // as caixas de seleção são da outra página: aqui ficam só para ver
        return `<div class="md-sync"><a href="?doc=${d.id}" data-doc="${d.id}">⟳ ${esc(d.title || 'Sem título')}</a>${render(d.body, ctx(new Set([...seen, arg]))).replace(/ data-line="\d+"/g, ' disabled')}</div>`
      }
      return undefined
    },
  }
}
const html = computed(() => (doc.value ? render(doc.value.body, ctx(new Set([doc.value.id]))) : ''))
const toc = computed(() => (doc.value ? outline(doc.value.body) : []))
const words = computed(() => (doc.value?.body.trim().match(/\S+/g) || []).length)
const when = (iso) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
const hello = computed(() => {
  const h = new Date().getHours()
  return `${h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'}${user.value?.first_name ? `, ${user.value.first_name}` : ''}`
})

// ---- abrir e criar
async function open(id) {
  activeId.value = id
  confirmDel.value = false
  showVersions.value = false
  if (id) for (let p = byId(byId(id)?.parentId); p; p = byId(p.parentId)) expanded.value.add(p.id)
  router.replace({ query: id ? { doc: id } : {} })
  await nextTick()
  if (!prefersReducedMotion() && editor.value) gsap.fromTo(editor.value, { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, ease: 'power2.out' })
}
watch(() => route.query.doc, (id) => id !== activeId.value && open(id || null))
async function create(fields = {}) {
  const d = createDoc({ ...structuredClone(DOC_DEFAULTS), ...fields })
  complete('doc')
  if (d.parentId) expanded.value.add(d.parentId)
  mode.value = 'edit'
  await open(d.id)
  editor.value?.querySelector('.title')?.select()
}
const createIn = (section) => create({ collectionId: section.key })

// ---- salvar e versões (uma foto a cada 2 min de edição, até 20)
let timer
function touch() {
  const d = doc.value
  d.updatedAt = new Date().toISOString()
  if (!d.versions[0] || Date.now() - Date.parse(d.versions[0].at) > 120000) {
    d.versions.unshift({ at: d.updatedAt, title: d.title, body: d.body })
    d.versions.splice(20)
  }
  saved.value = 'Salvando…'
  clearTimeout(timer)
  timer = setTimeout(() => (saved.value = 'Salvo'), 500)
}
function restore(v) {
  const d = doc.value
  d.versions.unshift({ at: new Date().toISOString(), title: d.title, body: d.body }) // guarda o atual antes de voltar
  Object.assign(d, { title: v.title, body: v.body, updatedAt: new Date().toISOString() })
  toast('Versão restaurada.')
}

// ---- editor
function format([, before, after]) {
  const el = area.value
  if (!el || doc.value.locked) return
  const { selectionStart: a, selectionEnd: b, value } = el
  const lineStart = value.lastIndexOf('\n', a - 1) + 1
  const block = !after && !before.startsWith('\n') // prefixo de linha (título, lista, citação)
  doc.value.body = block
    ? value.slice(0, lineStart) + before + value.slice(lineStart)
    : value.slice(0, a) + before + value.slice(a, b) + after + value.slice(b)
  touch()
  nextTick(() => { el.focus(); const pos = (block ? b : b + after.length) + before.length; el.setSelectionRange(pos, pos) })
}
function onPreviewClick(e) {
  const go = e.target.closest('[data-doc]')
  if (go) { e.preventDefault(); return open(go.dataset.doc) }
  const t = e.target.closest('[data-task]')
  if (t) return openTask(state.tasks.find((x) => String(x.id) === t.dataset.task))
  const btn = e.target.closest('[data-action="task"]')
  if (btn) { createTask({ title: btn.dataset.title || 'Nova tarefa', projectId: null, assignees: [state.me] }); return toast('Tarefa criada em Rascunhos.') }
  const line = e.target.dataset?.line
  if (line === undefined || doc.value.locked) return
  doc.value.body = toggleCheck(doc.value.body, Number(line))
  touch()
}
const jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
watch(activeId, () => { saved.value = ''; menu.value = null; mode.value = doc.value?.locked ? 'view' : 'edit' })
// equações ($$ … $$): o KaTeX só carrega quando a página tem uma
watch([html, mode], async () => {
  await nextTick()
  const els = editor.value?.querySelectorAll('.md-math') || []
  if (!els.length) return
  const [{ default: katex }] = await Promise.all([import('katex'), import('katex/dist/katex.min.css')])
  els.forEach((el) => katex.render(el.dataset.tex, el, { displayMode: true, throwOnError: false }))
}, { immediate: true })

// ---- menu de blocos (o + e o / do Notion)
const menu = ref(null) // { query: texto depois do / (null = aberto pelo +), from: posição do /, top }
const blockMenu = ref(null)
// altura do cursor dentro do textarea (cópia invisível com o mesmo texto até o cursor)
function caretTop(el, pos) {
  const cs = getComputedStyle(el)
  const m = document.createElement('div')
  for (const p of ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'paddingTop', 'paddingLeft', 'paddingRight', 'boxSizing', 'tabSize']) m.style[p] = cs[p]
  Object.assign(m.style, { position: 'absolute', visibility: 'hidden', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', width: `${el.clientWidth}px` })
  m.textContent = el.value.slice(0, pos)
  const mark = m.appendChild(document.createElement('span'))
  mark.textContent = '\u200b'
  document.body.appendChild(m)
  const top = mark.offsetTop + mark.offsetHeight
  m.remove()
  return el.offsetTop + top - el.scrollTop + 4
}
function openMenu() {
  const el = area.value
  if (!el) return
  menu.value = { query: null, from: null, top: caretTop(el, el.selectionStart) }
}
function onType() {
  touch()
  const el = area.value
  const before = el.value.slice(el.value.lastIndexOf('\n', el.selectionStart - 1) + 1, el.selectionStart)
  const m = before.match(/(?:^|\s)\/([^\s/]{0,24})$/)
  if (m) menu.value = { query: m[1], from: el.selectionStart - m[1].length - 1, top: menu.value?.query != null ? menu.value.top : caretTop(el, el.selectionStart) }
  else if (menu.value?.query != null) menu.value = null
}
// sai do texto sem ir para o menu (ex.: o passo de colar link) fecha o menu do /
const onAreaBlur = () => setTimeout(() => { if (menu.value?.query != null && !document.activeElement?.closest('.bm')) menu.value = null })
function onAreaKey(e) {
  if (menu.value?.query != null && blockMenu.value?.key(e)) e.preventDefault()
}
// põe o bloco: linha vazia vira o bloco; senão, ele entra na linha de baixo. %c% é onde o cursor fica
function insertBlock(snippet) {
  const el = area.value
  let v = doc.value.body
  let pos = el.selectionStart
  if (menu.value?.from != null) { v = v.slice(0, menu.value.from) + v.slice(pos); pos = menu.value.from }
  const ls = v.lastIndexOf('\n', pos - 1) + 1
  let le = v.indexOf('\n', pos)
  if (le < 0) le = v.length
  const empty = !v.slice(ls, le).trim()
  const at = empty ? ls : le
  const text = (empty ? '' : '\n') + snippet
  const caret = at + text.indexOf('%c%')
  doc.value.body = v.slice(0, empty ? ls : at) + text.replace('%c%', '') + v.slice(empty ? le : at)
  menu.value = null
  touch()
  nextTick(() => { el.focus(); el.setSelectionRange(caret, caret) })
}
function newSubpage() {
  const d = createDoc({ ...JSON.parse(JSON.stringify(DOC_DEFAULTS)), parentId: doc.value.id, collectionId: doc.value.collectionId, title: 'Sem título' })
  expanded.value.add(doc.value.id)
  insertBlock(`[[${d.id}|Sem título]]%c%`)
  toast('Subpágina criada. Abra pelo link ou pela árvore ao lado.')
}

// ---- etiquetas
function addLabel() {
  const name = newLabel.value.trim()
  if (!name) return
  let l = wiki.labels.find((x) => x.name.toLowerCase() === name.toLowerCase())
  if (!l) wiki.labels.push((l = { id: `lb-${Date.now().toString(36)}`, name, color: LABEL_COLORS[wiki.labels.length % LABEL_COLORS.length] }))
  if (!doc.value.labels.includes(l.id)) doc.value.labels.push(l.id)
  newLabel.value = ''
  touch()
}
function deleteLabel(id) {
  wiki.labels.splice(wiki.labels.findIndex((l) => l.id === id), 1)
  state.docs.forEach((d) => (d.labels = d.labels.filter((x) => x !== id)))
  if (labelFilter.value === id) labelFilter.value = ''
}

// ---- coleções
function addCollection() {
  const name = prompt('Nome da coleção')?.trim()
  if (name) wiki.collections.push({ id: `col-${Date.now().toString(36)}`, name })
}
function renameCollection(c) {
  const name = prompt('Novo nome da coleção', c.name)?.trim()
  if (name) c.name = name
}
function removeCollection(c) {
  if (state.docs.some((d) => d.collectionId === c.id && !d.archived)) { toast('Mova ou arquive as páginas da coleção antes de apagar.'); return }
  wiki.collections.splice(wiki.collections.indexOf(c), 1)
}

// ---- ações da página
function duplicate() {
  const { id, versions, createdAt, updatedAt, ...rest } = JSON.parse(JSON.stringify(doc.value)) // structuredClone não aceita o proxy do Vue
  create({ ...rest, title: `${rest.title} (cópia)`, favorite: false, locked: false })
}
function setArchived(on) {
  for (const d of [doc.value, ...descendants(doc.value.id)]) d.archived = on
  if (!on && doc.value.parentId && byId(doc.value.parentId)?.archived) doc.value.parentId = null // pai continua arquivado: sobe para a raiz
  toast(on ? 'Página arquivada (com as subpáginas).' : 'Página restaurada.')
}
function remove() {
  if (!confirmDel.value) { confirmDel.value = true; return }
  const d = doc.value
  state.docs.filter((c) => c.parentId === d.id).forEach((c) => (c.parentId = d.parentId)) // subpáginas sobem um nível
  state.docs.splice(state.docs.indexOf(d), 1)
  open(null)
}
function move(collectionId) {
  for (const d of [doc.value, ...descendants(doc.value.id)]) d.collectionId = collectionId
  doc.value.parentId = null
}
async function copyLink() {
  try {
    await navigator.clipboard.writeText(`${location.origin}/wiki?doc=${doc.value.id}`)
    toast('Link copiado. Por enquanto as páginas ficam neste navegador.')
  } catch { toast('Não foi possível copiar o link.') }
}
function exportMd() {
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([`# ${doc.value.title}\n\n${doc.value.body}\n`], { type: 'text/markdown' })),
    download: `${doc.value.title.replace(/[\\/:*?"<>|]/g, '') || 'pagina'}.md`,
  })
  a.click()
  URL.revokeObjectURL(a.href)
}
const toggle = (key) => (doc.value[key] = !doc.value[key])
const toggleOpen = (id) => (expanded.value.has(id) ? expanded.value.delete(id) : expanded.value.add(id))
</script>

<template>
  <div class="wiki">
    <aside class="list" aria-label="Páginas da wiki">
      <div class="list__head">
        <strong>Wiki</strong>
        <button type="button" class="new-page" @click="create()"><AppIcon name="plus" :size="14" /> Nova página</button>
      </div>
      <label class="find"><AppIcon name="search" :size="14" /><input v-model="q" placeholder="Buscar páginas" aria-label="Buscar páginas" /></label>
      <div v-if="wiki.labels.length" class="labels" role="group" aria-label="Filtrar por etiqueta">
        <button v-for="l in wiki.labels" :key="l.id" type="button" class="chip" :aria-pressed="labelFilter === l.id" :style="{ '--c': l.color }" @click="labelFilter = labelFilter === l.id ? '' : l.id">{{ l.name }}</button>
      </div>

      <button type="button" class="row home" :class="{ on: !doc }" @click="open(null)"><AppIcon name="home" :size="15" /> Início da wiki</button>

      <template v-if="favorites.length && !filtering">
        <span class="sec">Favoritas</span>
        <button v-for="d in favorites" :key="`f${d.id}`" type="button" class="row" :class="{ on: d.id === activeId }" @click="open(d.id)">
          <span class="ico">{{ d.icon || '📄' }}</span><span class="t">{{ d.title || 'Sem título' }}</span>
        </button>
      </template>

      <template v-for="s in sections" :key="s.key">
        <div class="sec">
          <span>{{ s.name }}</span>
          <span class="sec__actions">
            <template v-if="s.collection">
              <button type="button" class="mini" :aria-label="`Renomear ${s.name}`" title="Renomear" @click="renameCollection(s.collection)"><AppIcon name="sliders" :size="12" /></button>
              <button v-if="wiki.collections.length > 1" type="button" class="mini" :aria-label="`Apagar ${s.name}`" title="Apagar coleção" @click="removeCollection(s.collection)"><AppIcon name="close" :size="12" /></button>
            </template>
            <button v-if="s.key !== 'archived'" type="button" class="mini" :aria-label="`Nova página em ${s.name}`" title="Adicionar página" @click="createIn(s)"><AppIcon name="plus" :size="12" /></button>
          </span>
        </div>
        <div v-for="{ d, depth } in s.rows" :key="d.id" class="row" :class="{ on: d.id === activeId }" :style="{ paddingLeft: `${0.35 + depth * 0.9}rem` }">
          <button v-if="!filtering && s.key !== 'archived'" type="button" class="caret" :class="{ open: expanded.has(d.id), none: !children(d.id).length }" :aria-label="expanded.has(d.id) ? 'Recolher' : 'Expandir'" :aria-expanded="expanded.has(d.id)" @click="toggleOpen(d.id)"><AppIcon name="chevron" :size="12" /></button>
          <button type="button" class="row__open" @click="open(d.id)">
            <span class="ico">{{ d.icon || '📄' }}</span><span class="t">{{ d.title || 'Sem título' }}</span>
            <AppIcon v-if="d.locked" name="lock" :size="11" class="muted" />
          </button>
        </div>
        <p v-if="!s.rows.length" class="muted">{{ s.key === 'archived' ? 'Nada arquivado.' : 'Nenhuma página.' }}</p>
      </template>
      <button type="button" class="add-col" @click="addCollection"><AppIcon name="plus" :size="13" /> Nova coleção</button>
    </aside>

    <!-- ================= página ================= -->
    <div v-if="doc" class="page" :class="{ wide: doc.fullWidth }">
      <article ref="editor" class="editor">
        <header class="bar">
          <nav class="crumbs" aria-label="Caminho">
            <span>{{ wiki.collections.find((c) => c.id === doc.collectionId)?.name || wiki.collections[0]?.name }}</span>
            <template v-for="p in crumbs" :key="p.id"><span>/</span><button type="button" class="link" @click="open(p.id)">{{ p.title || 'Sem título' }}</button></template>
          </nav>
          <div class="bar__right">
            <span class="saved">{{ saved }}</span>
            <div class="seg" role="group" aria-label="Modo">
              <button type="button" :aria-pressed="mode === 'edit'" :disabled="doc.locked" @click="mode = 'edit'">Editar</button>
              <button type="button" :aria-pressed="mode === 'view'" @click="mode = 'view'">Visualizar</button>
            </div>
            <button type="button" class="icon" :aria-pressed="doc.favorite" :aria-label="doc.favorite ? 'Tirar dos favoritos' : 'Favoritar'" :title="doc.favorite ? 'Tirar dos favoritos' : 'Favoritar'" @click="toggle('favorite')"><AppIcon name="star" :size="15" /></button>
            <details class="menu">
              <summary class="icon" aria-label="Ações da página" title="Ações da página"><AppIcon name="more" :size="15" /></summary>
              <div class="menu__box">
                <button type="button" @click="create({ parentId: doc.id, collectionId: doc.collectionId })"><AppIcon name="plus" :size="14" /> Nova subpágina</button>
                <button type="button" @click="duplicate"><AppIcon name="doc" :size="14" /> Duplicar</button>
                <button type="button" @click="toggle('locked'); mode = doc.locked ? 'view' : mode"><AppIcon name="lock" :size="14" /> {{ doc.locked ? 'Desbloquear' : 'Bloquear edição' }}</button>
                <button type="button" @click="toggle('fullWidth')"><AppIcon name="layers" :size="14" /> {{ doc.fullWidth ? 'Largura normal' : 'Largura total' }}</button>
                <label class="menu__select">Coleção
                  <AppSelect :model-value="doc.collectionId" :options="wiki.collections.map((c) => ({ value: c.id, label: c.name }))" size="sm" aria-label="Coleção" @change="move" />
                </label>
                <button type="button" @click="copyLink"><AppIcon name="pin" :size="14" /> Copiar link</button>
                <button type="button" @click="exportMd"><AppIcon name="arrow" :size="14" /> Exportar Markdown</button>
                <button type="button" @click="showVersions = !showVersions"><AppIcon name="undo" :size="14" /> Histórico de versões</button>
                <button type="button" @click="setArchived(!doc.archived)"><AppIcon name="archive" :size="14" /> {{ doc.archived ? 'Restaurar' : 'Arquivar' }}</button>
                <button type="button" class="danger" @click="remove"><AppIcon name="trash" :size="14" /> {{ confirmDel ? 'Clique de novo para apagar' : 'Apagar página' }}</button>
              </div>
            </details>
          </div>
        </header>

        <p v-if="doc.archived" class="notice">Esta página está arquivada. <button type="button" class="link" @click="setArchived(false)">Restaurar</button></p>
        <p v-else-if="doc.locked" class="notice"><AppIcon name="lock" :size="13" /> Página bloqueada para edição.</p>

        <div class="head">
          <details class="emoji">
            <summary :class="{ empty: !doc.icon }" :aria-label="doc.icon ? 'Trocar ícone' : 'Adicionar ícone'">{{ doc.icon || '＋ ícone' }}</summary>
            <div class="emoji__box"><button v-for="e in ICONS" :key="e || 'none'" type="button" :aria-label="e || 'Sem ícone'" @click="doc.icon = e; touch(); $event.target.closest('details').open = false">{{ e || '∅' }}</button></div>
          </details>
          <input v-model="doc.title" class="title" placeholder="Sem título" aria-label="Título da página" :readonly="doc.locked" @input="touch" />
        </div>

        <div class="tags">
          <span v-for="id in doc.labels" :key="id" class="chip" :style="{ '--c': label(id)?.color }">{{ label(id)?.name }}<button v-if="!doc.locked" type="button" :aria-label="`Tirar etiqueta ${label(id)?.name}`" @click="doc.labels.splice(doc.labels.indexOf(id), 1); touch()">×</button></span>
          <form v-if="!doc.locked" class="tag-add" @submit.prevent="addLabel">
            <input v-model="newLabel" list="wiki-labels" placeholder="+ etiqueta" aria-label="Adicionar etiqueta" />
            <datalist id="wiki-labels"><option v-for="l in wiki.labels" :key="l.id" :value="l.name" /></datalist>
          </form>
        </div>
        <p class="meta">{{ words }} palavras · {{ Math.max(1, Math.round(words / 200)) }} min de leitura · criada {{ when(doc.createdAt || doc.updatedAt) }} · editada {{ when(doc.updatedAt) }}</p>

        <template v-if="mode === 'edit' && !doc.locked">
          <div class="tools" role="toolbar" aria-label="Formatação">
            <button type="button" class="add-block" title="Inserir bloco (ou digite /)" :aria-expanded="!!menu" @mousedown.prevent @click="menu ? (menu = null) : openMenu()">＋ Bloco</button>
            <button v-for="t in TOOLBAR" :key="t[0]" type="button" :title="t[0]" @mousedown.prevent @click="format(t)">{{ t[0] }}</button>
          </div>
          <div class="write">
            <textarea ref="area" v-model="doc.body" class="body" placeholder="Comece a escrever, ou digite / para escolher um bloco (título, tabela, toggle, vídeo, base de dados…)." aria-label="Conteúdo da página" @input="onType" @keydown="onAreaKey" @blur="onAreaBlur" />
            <BlockMenu v-if="menu" ref="blockMenu" :query="menu.query" :doc-id="doc.id" :style="{ top: `${menu.top}px` }" @insert="insertBlock" @page="newSubpage" @close="menu = null" />
          </div>
        </template>
        <!-- eslint-disable-next-line vue/no-v-html -- render() escapa o texto antes de montar o HTML -->
        <div v-else class="md" @click="onPreviewClick" v-html="html || '<p class=&quot;muted&quot;>Página vazia.</p>'" />

        <section v-if="children(doc.id).length" class="subs">
          <h3>Subpáginas</h3>
          <button v-for="c in children(doc.id)" :key="c.id" type="button" class="sub" @click="open(c.id)"><span>{{ c.icon || '📄' }}</span>{{ c.title || 'Sem título' }}</button>
        </section>
      </article>

      <aside class="side" aria-label="Sumário e versões">
        <template v-if="showVersions">
          <h3>Versões <button type="button" class="link" @click="showVersions = false">fechar</button></h3>
          <p v-if="!doc.versions.length" class="muted">Ainda sem versões. Elas são salvas enquanto você escreve.</p>
          <div v-for="(v, i) in doc.versions" :key="v.at + i" class="ver">
            <span>{{ when(v.at) }}</span><small class="muted">{{ (v.body.match(/\S+/g) || []).length }} palavras</small>
            <button v-if="!doc.locked" type="button" class="link" @click="restore(v)">Restaurar</button>
          </div>
        </template>
        <template v-else-if="toc.length">
          <h3>Sumário</h3>
          <button v-for="h in toc" :key="h.id + h.text" type="button" class="toc" :style="{ paddingLeft: `${(h.level - 1) * 0.75}rem` }" @click="mode = 'view'; $nextTick(() => jump(h.id))">{{ h.text }}</button>
        </template>
      </aside>
    </div>

    <!-- ================= início da wiki ================= -->
    <div v-else class="home-page">
      <h1>{{ hello }}</h1>
      <p class="muted">Sua base de conhecimento pessoal: ideias, anotações, specs e decisões. Para escrever junto com o time, use as Páginas de um projeto.</p>
      <div class="home-actions">
        <button type="button" class="new" @click="create()"><AppIcon name="plus" :size="14" /> Nova página</button>
        <RouterLink to="/notas" class="link">Suas notas rápidas</RouterLink>
      </div>
      <h3>Recentes</h3>
      <div v-if="recents.length" class="cards">
        <button v-for="d in recents" :key="d.id" type="button" class="card" @click="open(d.id)">
          <span class="card__icon">{{ d.icon || '📄' }}</span>
          <strong>{{ d.title || 'Sem título' }}</strong>
          <small class="muted">Editada {{ when(d.updatedAt) }}</small>
        </button>
      </div>
      <p v-else class="muted">Nenhuma página ainda. Crie a primeira.</p>
      <template v-if="wiki.labels.length">
        <h3>Etiquetas</h3>
        <div class="labels">
          <span v-for="l in wiki.labels" :key="l.id" class="chip" :style="{ '--c': l.color }">{{ l.name }}<button type="button" :aria-label="`Apagar etiqueta ${l.name}`" @click="deleteLabel(l.id)">×</button></span>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.wiki { display: grid; grid-template-columns: 17rem minmax(0, 1fr); height: 100%; min-height: 0; }
@media (max-width: 760px) { .wiki { grid-template-columns: minmax(0, 1fr); height: auto; } .list { border-right: 0; border-bottom: 1px solid var(--line); max-height: 45vh; } .page { grid-template-columns: minmax(0, 1fr); } .side { display: none; } }
.list { display: flex; flex-direction: column; gap: 1px; min-height: 0; padding: 0.9rem 0.6rem; border-right: 1px solid var(--line); overflow-y: auto; }
.list__head { display: flex; align-items: center; justify-content: space-between; padding: 0 0.35rem 0.6rem; }
.new-page { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.3rem 0.55rem; border: 1px solid var(--line-strong); border-radius: 6px; background: none; font-size: 12.5px; color: var(--text); cursor: pointer; }
.new-page:hover { border-color: var(--accent); }
.find { display: flex; align-items: center; gap: 0.4rem; height: 30px; margin-bottom: 0.4rem; padding: 0 0.5rem; border: 1px solid var(--line); border-radius: 6px; color: var(--muted); }
.find:focus-within { border-color: var(--accent); }
.find input { flex: 1; min-width: 0; border: 0; background: none; font: inherit; color: var(--text); outline: none; }
.labels { display: flex; flex-wrap: wrap; gap: 0.3rem; padding: 0 0.2rem 0.4rem; }
.chip { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.1rem 0.5rem; border: 1px solid color-mix(in srgb, var(--c, var(--muted)) 55%, transparent); border-radius: 999px; background: color-mix(in srgb, var(--c, var(--muted)) 14%, transparent); font-size: 12px; color: var(--text); }
button.chip { cursor: pointer; }
.chip[aria-pressed='true'] { background: color-mix(in srgb, var(--c) 40%, transparent); }
.chip button { padding: 0; border: 0; background: none; color: var(--muted); cursor: pointer; }
.sec { display: flex; align-items: center; justify-content: space-between; margin-top: 0.7rem; padding: 0.2rem 0.4rem; font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); }
span.sec { display: block; }
.sec__actions { display: flex; gap: 2px; opacity: 0.6; }
.sec:hover .sec__actions, .sec__actions:focus-within { opacity: 1; }
.mini { display: grid; place-items: center; width: 20px; height: 20px; padding: 0; border: 0; border-radius: 4px; background: none; color: var(--muted); cursor: pointer; }
.mini:hover { background: var(--surface-2); color: var(--text); }
.row { display: flex; align-items: center; gap: 0.15rem; border-radius: 6px; color: var(--muted); font-size: 13px; }
button.row { gap: 0.5rem; padding: 0.4rem 0.45rem; border: 0; background: none; text-align: left; cursor: pointer; }
.row:hover, .row.on { background: var(--surface-2); color: var(--text); }
.row__open { display: flex; flex: 1; align-items: center; gap: 0.45rem; min-width: 0; padding: 0.35rem 0.3rem; border: 0; background: none; font: inherit; color: inherit; text-align: left; cursor: pointer; }
.caret { display: grid; place-items: center; width: 18px; height: 18px; padding: 0; border: 0; border-radius: 4px; background: none; color: var(--muted); cursor: pointer; transform: rotate(-90deg); transition: transform 0.15s var(--ease); }
.caret.open { transform: none; }
.caret.none { visibility: hidden; }
.ico { flex-shrink: 0; font-size: 13px; }
.t { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.muted { margin: 0; padding: 0.2rem 0.45rem; font-size: 12px; color: var(--muted); }
.add-col { display: flex; align-items: center; gap: 0.35rem; margin-top: 0.8rem; padding: 0.4rem 0.45rem; border: 0; border-radius: 6px; background: none; font-size: 12.5px; color: var(--muted); cursor: pointer; }
.add-col:hover { color: var(--text); background: var(--surface-2); }

.page { display: grid; grid-template-columns: minmax(0, 1fr) 13rem; gap: 1rem; min-height: 0; overflow-y: auto; }
.page.wide .editor { max-width: none; }
.editor { display: flex; flex-direction: column; gap: 0.6rem; width: 100%; max-width: 48rem; margin: 0 auto; padding: 1rem 1.5rem 3rem; }
.bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.6rem; padding-bottom: 0.4rem; }
.crumbs { display: flex; flex-wrap: wrap; align-items: center; gap: 0.35rem; font-size: 12.5px; color: var(--muted); }
.bar__right { display: flex; align-items: center; gap: 0.4rem; }
.saved { font-size: 12px; color: var(--accent-soft); }
.seg { display: inline-flex; padding: 2px; border: 1px solid var(--line-strong); border-radius: 7px; }
.seg button { padding: 0.2rem 0.6rem; border: 0; border-radius: 5px; background: none; font-size: 12.5px; color: var(--muted); cursor: pointer; }
.seg button[aria-pressed='true'] { background: var(--surface-2); color: var(--text); }
.seg button:disabled { opacity: 0.4; cursor: not-allowed; }
.icon { display: grid; place-items: center; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 6px; background: none; color: var(--muted); cursor: pointer; list-style: none; }
.icon::-webkit-details-marker { display: none; }
.icon:hover { background: var(--surface-2); color: var(--text); }
.icon[aria-pressed='true'] { color: #f2c46d; }
.menu { position: relative; }
.menu__box { position: absolute; right: 0; top: calc(100% + 4px); z-index: 20; display: flex; flex-direction: column; min-width: 14rem; padding: 0.3rem; border: 1px solid var(--line-strong); border-radius: 8px; background: var(--surface); box-shadow: 0 12px 32px rgb(0 0 0 / 0.35); }
.menu__box button { display: flex; align-items: center; gap: 0.5rem; padding: 0.45rem 0.5rem; border: 0; border-radius: 5px; background: none; font-size: 13px; color: var(--text); text-align: left; cursor: pointer; }
.menu__box button:hover { background: var(--surface-2); }
.menu__box .danger { color: #ff8a80; }
.menu__select { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.35rem 0.5rem; font-size: 12.5px; color: var(--muted); }
.notice { display: flex; align-items: center; gap: 0.4rem; margin: 0; padding: 0.45rem 0.7rem; border: 1px solid var(--line); border-radius: 7px; font-size: 12.5px; color: var(--muted); }
.head { display: flex; flex-direction: column; gap: 0.3rem; }
.emoji { position: relative; align-self: flex-start; }
.emoji summary { list-style: none; padding: 0.15rem 0.3rem; border-radius: 6px; font-size: 1.6rem; line-height: 1; color: var(--muted); cursor: pointer; }
.emoji summary::-webkit-details-marker { display: none; }
.emoji summary.empty { font-size: 12px; }
.emoji summary:hover { background: var(--surface-2); }
.emoji__box { position: absolute; z-index: 20; display: grid; grid-template-columns: repeat(5, 2rem); gap: 2px; padding: 0.35rem; border: 1px solid var(--line-strong); border-radius: 8px; background: var(--surface); }
.emoji__box button { height: 2rem; border: 0; border-radius: 5px; background: none; font-size: 1.1rem; color: var(--muted); cursor: pointer; }
.emoji__box button:hover { background: var(--surface-2); }
.title { width: 100%; padding: 0; border: 0; background: none; font: 700 2rem/1.2 'Geist', system-ui, sans-serif; letter-spacing: -0.02em; color: var(--text); outline: none; }
.tags { display: flex; flex-wrap: wrap; align-items: center; gap: 0.35rem; }
.tag-add input { width: 7rem; height: 24px; padding: 0 0.4rem; border: 1px dashed var(--line-strong); border-radius: 999px; background: none; font-size: 12px; color: var(--text); outline: none; }
.tag-add input:focus { border-color: var(--accent); }
.meta { margin: 0; font-size: 12px; color: var(--muted); }
.tools { position: sticky; top: 0; z-index: 5; display: flex; flex-wrap: wrap; gap: 2px; padding: 0.3rem 0; background: var(--bg); border-bottom: 1px solid var(--line); }
.tools button { min-width: 28px; height: 26px; padding: 0 0.4rem; border: 0; border-radius: 5px; background: none; font: 600 12px/1 'Geist', system-ui, sans-serif; color: var(--muted); cursor: pointer; }
.tools button:hover { background: var(--surface-2); color: var(--text); }
.write { position: relative; }
.add-block { margin-right: 0.3rem; color: var(--accent-soft) !important; }
.body { width: 100%; min-height: 50vh; padding: 0.5rem 0; border: 0; background: none; font: 400 15px/1.7 'Geist Mono', ui-monospace, monospace; color: var(--text); resize: none; outline: none; field-sizing: content; }
.md { min-height: 30vh; font-size: 15px; line-height: 1.7; color: var(--text); overflow-wrap: anywhere; }
.md :deep(h1), .md :deep(h2), .md :deep(h3) { margin: 1.2em 0 0.4em; line-height: 1.25; color: var(--text); scroll-margin-top: 1rem; }
.md :deep(h1) { font-size: 1.6rem; } .md :deep(h2) { font-size: 1.3rem; } .md :deep(h3) { font-size: 1.1rem; }
.md :deep(p) { margin: 0.4em 0; }
.md :deep(code) { padding: 0.1em 0.35em; border-radius: 4px; background: var(--surface-2); font-size: 0.9em; }
.md :deep(pre) { padding: 0.8rem 1rem; border-radius: 8px; background: var(--surface-2); overflow-x: auto; }
.md :deep(pre code) { padding: 0; background: none; }
.md :deep(blockquote) { margin: 0.6em 0; padding-left: 0.9rem; border-left: 3px solid var(--accent); color: var(--muted); }
.md :deep(.md-table) { margin: 0.6rem 0; overflow-x: auto; }
.md :deep(table) { width: 100%; border-collapse: collapse; font-size: 13px; }
.md :deep(th), .md :deep(td) { padding: 0.4rem 0.6rem; border: 1px solid var(--line); text-align: left; vertical-align: top; }
.md :deep(th) { background: var(--surface-2); font-weight: 600; color: var(--text); }
.md :deep(hr) { border: 0; border-top: 1px solid var(--line); margin: 1.2em 0; }
.md :deep(a) { color: var(--accent-soft); }
.md :deep(.md-check) { padding-left: 0.2rem; list-style: none; }
.md :deep(.md-check input) { accent-color: var(--accent); cursor: pointer; }
.subs { display: flex; flex-direction: column; gap: 0.25rem; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--line); }
.subs h3, .side h3, .home-page h3 { display: flex; justify-content: space-between; margin: 0 0 0.35rem; font-size: 12px; font-weight: 600; color: var(--muted); }
.sub { display: flex; align-items: center; gap: 0.5rem; padding: 0.45rem 0.6rem; border: 1px solid var(--line); border-radius: 7px; background: none; font-size: 13.5px; color: var(--text); text-align: left; cursor: pointer; }
.sub:hover { border-color: var(--accent); }
.side { position: sticky; top: 0; align-self: start; display: flex; flex-direction: column; gap: 0.15rem; padding: 3.2rem 1rem 1rem 0; font-size: 12.5px; }
.toc { padding: 0.25rem 0; border: 0; background: none; font-size: 12.5px; color: var(--muted); text-align: left; cursor: pointer; }
.toc:hover { color: var(--text); }
.ver { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.4rem; padding: 0.35rem 0; border-top: 1px solid var(--line); }
.link { padding: 0; border: 0; background: none; font-size: 12.5px; color: var(--accent-soft); text-decoration: none; cursor: pointer; }

.home-page { display: flex; flex-direction: column; gap: 0.75rem; width: 100%; max-width: 52rem; margin: 0 auto; padding: 2.5rem 1.5rem; overflow-y: auto; }
.home-page h1 { margin: 0; font: 650 1.6rem/1.2 'Geist', system-ui, sans-serif; letter-spacing: -0.02em; color: var(--text); }
.home-page > .muted { padding: 0; font-size: 13.5px; }
.home-actions { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
.new { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.5rem 0.9rem; border: 1px solid var(--accent); border-radius: 7px; background: color-mix(in srgb, var(--accent) 14%, transparent); font-size: 13.5px; color: var(--text); cursor: pointer; }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr)); gap: 0.6rem; margin-bottom: 1rem; }
.card { display: flex; flex-direction: column; gap: 0.3rem; padding: 0.8rem; border: 1px solid var(--line); border-radius: 9px; background: var(--surface); text-align: left; color: var(--text); cursor: pointer; }
.card:hover { border-color: var(--accent); }
.card__icon { font-size: 1.3rem; }
.card .muted { padding: 0; }
:is(.new-page, .row button, button.row, .mini, .caret, .add-col, .icon, .seg button, .menu__box button, .tools button, .chip, .sub, .toc, .link, .card, .new, .emoji summary):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
</style>
