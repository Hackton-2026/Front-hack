<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { compressImage } from '../../utils/image'
import { DB_VIEWS } from '../../utils/dbviews'
import { useWorkspace } from '../../composables/useWorkspace'
import BrandIcon from './BrandIcon.vue'

const props = defineProps({ query: { type: String, default: null }, docId: { type: String, default: '' } })
const emit = defineEmits(['insert', 'page', 'close'])
const { state } = useWorkspace()

const B = (id, label, hint, icon, then, keys = '') => ({ id, label, hint, icon, then, keys })
const url = (kind, label) => ({ step: 'url', kind, label })
const SECTIONS = [
  ['Blocos básicos', [
    B('text', 'Texto', 'Comece a escrever com texto simples', 'Aa', '%c%', 'paragrafo text'),
    B('page', 'Página', 'Cria uma subpágina dentro desta', '📄', { step: 'page' }, 'subpagina page'),
    B('todo', 'Lista de tarefas', 'Acompanhe tarefas com caixas de seleção', '☑', '- [ ] %c%', 'checklist todo to-do'),
    B('h1', 'Título 1', 'Título de seção grande', 'H1', '# %c%', 'heading'),
    B('h2', 'Título 2', 'Título de seção médio', 'H2', '## %c%', 'heading'),
    B('h3', 'Título 3', 'Título de seção pequeno', 'H3', '### %c%', 'heading'),
    B('table', 'Tabela', 'Linhas e colunas simples', '▦', '| %c%Coluna 1 | Coluna 2 | Coluna 3 |\n|---|---|---|\n|  |  |  |\n|  |  |  |', 'table grade'),
    B('bullet', 'Lista com marcadores', 'Uma lista simples', '•', '- %c%', 'bullet ul'),
    B('number', 'Lista numerada', 'Uma lista com números', '1.', '1. %c%', 'numbered ol'),
    B('toggle', 'Lista de alternância', 'Esconda e mostre o conteúdo dentro', '▸', ':::toggle %c%Título\nConteúdo escondido\n:::', 'toggle expandir'),
    B('quote', 'Citação', 'Destaque uma citação', '❝', '> %c%', 'quote'),
    B('divider', 'Divisor', 'Separe blocos com uma linha', '—', '---\n%c%', 'divider linha hr'),
    B('link', 'Link para página', 'Aponte para outra página da wiki', '↗', { step: 'doc', make: (d) => `[[${d.id}|${d.title || 'Sem título'}]]%c%` }, 'link pagina'),
    B('callout', 'Texto destacado', 'Faça o texto se destacar', '💡', ':::callout 💡\n%c%\n:::', 'callout aviso'),
  ]],
  ['Mídia', [
    B('image', 'Imagem', 'Envie do computador ou cole um link', '🖼', { step: 'image' }, 'image foto'),
    B('video', 'Vídeo', 'YouTube, Vimeo ou link de vídeo', '▶', url('video', 'Link do vídeo'), 'video youtube'),
    B('audio', 'Áudio', 'Link de um arquivo de áudio', '♪', url('audio', 'Link do áudio'), 'audio som musica'),
    B('code', 'Código', 'Trecho de código', '</>', '```js\n%c%\n```', 'code'),
    B('file', 'Arquivo', 'Link para um arquivo', '📎', url('file', 'Link do arquivo'), 'file anexo pdf'),
    B('bookmark', 'Marcador da web', 'Cartão com um link de site', '🔖', url('bookmark', 'Link do site'), 'bookmark site url'),
  ]],
  ['Base de dados', Object.entries(DB_VIEWS).map(([v, label], k) =>
    B(`db-${v}`, `Visualização de ${label.toLowerCase()}`, 'Tarefas do Novexo, sempre atualizadas', ['▦', '▥', '▤', '☰', '📅', '⇶'][k], { step: 'project', view: v }, `database base dados ${v}`))],
  ['Blocos avançados', [
    B('toc', 'Índice', 'Sumário com os títulos da página', '≣', '[toc]\n%c%', 'toc sumario'),
    B('math', 'Equação em bloco', 'Fórmula em LaTeX', '∑', '$$\n%c%\n$$', 'math latex formula equacao'),
    B('button', 'Botão', 'Cria uma tarefa com um clique', '⏺', { step: 'text' }, 'button botao'),
    B('breadcrumb', 'Navegação estrutural', 'Mostra onde esta página está', '›', '@[breadcrumb]()\n%c%', 'breadcrumb caminho'),
    B('cols2', '2 colunas', 'Lado a lado', '⫴', ':::columns\n%c%Coluna 1\n|||\nColuna 2\n:::', 'columns colunas'),
    B('cols3', '3 colunas', 'Três lado a lado', '⫴', ':::columns\n%c%Coluna 1\n|||\nColuna 2\n|||\nColuna 3\n:::', 'columns colunas'),
    B('cols4', '4 colunas', 'Quatro lado a lado', '⫴', ':::columns\n%c%Coluna 1\n|||\nColuna 2\n|||\nColuna 3\n|||\nColuna 4\n:::', 'columns colunas'),
    B('th1', 'Título 1 alternável', 'Título que esconde o que vem dentro', '▸', ':::toggle # %c%Título\nConteúdo\n:::', 'toggle heading'),
    B('th2', 'Título 2 alternável', 'Título que esconde o que vem dentro', '▸', ':::toggle ## %c%Título\nConteúdo\n:::', 'toggle heading'),
    B('th3', 'Título 3 alternável', 'Título que esconde o que vem dentro', '▸', ':::toggle ### %c%Título\nConteúdo\n:::', 'toggle heading'),
    B('sync', 'Bloco sincronizado', 'Mostra o conteúdo de outra página, sempre igual', '⟳', { step: 'doc', make: (d) => `@[sync](${d.id})\n%c%` }, 'synced sincronizado'),
  ]],
  ['Integrações', [
    B('e-drive', 'Google Drive', 'Docs, Planilhas, Apresentações ou arquivo', 'brand:googledrive', url('embed', 'Link do Google Drive'), 'google docs sheets slides planilha'),
    B('e-figma', 'Figma', 'Arquivo, design ou protótipo', 'brand:figma', url('embed', 'Link do Figma'), 'figma design'),
    B('e-gist', 'GitHub Gist', 'Trecho de código do GitHub', 'brand:github', url('embed', 'Link do Gist'), 'github gist codigo'),
    B('e-maps', 'Google Maps', 'Mapa de um endereço', 'brand:googlemaps', { step: 'map' }, 'mapa endereco local'),
    B('e-loom', 'Loom', 'Vídeo gravado no Loom', 'brand:loom', url('embed', 'Link do Loom'), 'loom video'),
    B('e-miro', 'Miro', 'Quadro do Miro', 'brand:miro', url('embed', 'Link do quadro do Miro'), 'miro quadro board'),
    B('e-pdf', 'PDF', 'Documento PDF por link', '📄', url('embed', 'Link do PDF'), 'pdf documento'),
    B('e-tweet', 'Post do X (Twitter)', 'Um post incorporado', 'brand:x', url('embed', 'Link do post'), 'twitter x tweet'),
    B('e-codepen', 'CodePen', 'Pen do CodePen', 'brand:codepen', url('embed', 'Link do CodePen'), 'codepen'),
    B('e-spotify', 'Spotify', 'Música, álbum, playlist ou podcast', 'brand:spotify', url('embed', 'Link do Spotify'), 'spotify musica podcast'),
    B('e-typeform', 'Typeform', 'Formulário do Typeform', 'brand:typeform', url('embed', 'Link do Typeform'), 'typeform formulario'),
    B('e-excalidraw', 'Excalidraw', 'Desenho do Excalidraw', 'brand:excalidraw', url('embed', 'Link do Excalidraw'), 'excalidraw desenho'),
    B('e-any', 'Incorporar link', 'Qualquer site que permita incorporar', '⧉', url('embed', 'Link do site'), 'embed incorporar iframe'),
  ]],
]

const plain = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const search = ref('')
const q = computed(() => plain(props.query ?? search.value).trim())
const groups = computed(() => SECTIONS.map(([name, items]) => [name, items.filter((b) => !q.value || plain(`${b.label} ${b.id} ${b.keys}`).includes(q.value))]).filter(([, items]) => items.length))
const flat = computed(() => groups.value.flatMap(([, items]) => items))
const active = ref(0)
watch(q, () => (active.value = 0))

const step = ref(null)
const value = ref('')
const err = ref('')
const box = ref(null)
const docs = computed(() => state.docs.filter((d) => !d.archived && d.id !== props.docId && (!value.value || plain(d.title).includes(plain(value.value)))))

function choose(b) {
  if (typeof b.then === 'string') return emit('insert', b.then)
  if (b.then.step === 'page') return emit('page')
  step.value = b
  value.value = ''
  err.value = ''
  nextTick(() => box.value?.querySelector('.step input')?.focus())
}
function submitUrl() {
  const u = value.value.trim()
  if (!/^https:\/\/\S+$/.test(u)) { err.value = 'Use um link que comece com https://'; return }
  emit('insert', step.value.id === 'image' ? `![](${u})\n%c%` : `@[${step.value.then.kind}](${u})\n%c%`)
}
async function upload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const small = await compressImage(file, 1000, 0.75)
  const data = await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(small) })
  emit('insert', `![${file.name.replace(/\.[^.]+$/, '').replace(/[[\]]/g, '')}](${data})\n%c%`)
}
const pickDoc = (d) => emit('insert', step.value.then.make(d))
const pickProject = (id) => emit('insert', `@[db:${step.value.then.view}](${id})\n%c%`)
function submitText() {
  const t = value.value.trim().replace(/[()]/g, '')
  if (t) emit('insert', `@[button](${t})\n%c%`)
}

function key(e) {
  if (step.value) { if (e.key === 'Escape') { step.value = null; return true } return false }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { active.value = (active.value + (e.key === 'ArrowDown' ? 1 : -1) + flat.value.length) % Math.max(1, flat.value.length); scrollActive(); return true }
  if (e.key === 'Enter' && flat.value[active.value]) { choose(flat.value[active.value]); return true }
  if (e.key === 'Escape') { emit('close'); return true }
  return false
}
const scrollActive = () => nextTick(() => box.value?.querySelector('.it.on')?.scrollIntoView({ block: 'nearest' }))
defineExpose({ key, empty: computed(() => !flat.value.length) })
const outside = (e) => { if (!box.value?.contains(e.target)) emit('close') }
onMounted(() => {
  if (props.query === null) box.value?.querySelector('.search')?.focus()
  setTimeout(() => document.addEventListener('mousedown', outside))
})
onUnmounted(() => document.removeEventListener('mousedown', outside))
</script>

<template>
  <div ref="box" class="bm" role="dialog" aria-label="Inserir bloco" @keydown="key($event) && $event.preventDefault()">
    <button type="button" class="x" aria-label="Fechar" title="Fechar (Esc)" @mousedown.prevent @click="emit('close')">×</button>
    <template v-if="!step">
      <input v-if="query === null" v-model="search" class="search" placeholder="Filtrar blocos…" aria-label="Filtrar blocos" />
      <div class="list" role="listbox" aria-label="Blocos">
        <template v-for="[name, items] in groups" :key="name">
          <p class="sec">{{ name }}</p>
          <button
            v-for="b in items"
            :key="b.id"
            type="button"
            role="option"
            class="it"
            :class="{ on: flat[active] === b }"
            :aria-selected="flat[active] === b"
            @mousedown.prevent
            @mouseenter="active = flat.indexOf(b)"
            @click="choose(b)"
          >
            <span class="ic"><BrandIcon v-if="b.icon.startsWith('brand:')" :name="b.icon.slice(6)" :size="18" /><template v-else>{{ b.icon }}</template></span><span class="tx"><strong>{{ b.label }}</strong><small>{{ b.hint }}</small></span>
          </button>
        </template>
        <p v-if="!flat.length" class="none">Nenhum bloco com “{{ query ?? search }}”.</p>
      </div>
    </template>

    <div v-else class="step">
      <button type="button" class="back" @click="step = null">← {{ step.label }}</button>
      <template v-if="step.then.step === 'url' || step.id === 'image'">
        <form @submit.prevent="submitUrl">
          <input v-model="value" type="url" :placeholder="step.then.label || 'Link da imagem (https://…)'" :aria-label="step.then.label || 'Link da imagem'" />
          <button type="submit" class="ok">Inserir</button>
        </form>
        <p v-if="err" class="err">{{ err }}</p>
        <label v-if="step.id === 'image'" class="up">Enviar do computador<input type="file" accept="image/*" @change="upload" /></label>
      </template>
      <template v-else-if="step.then.step === 'doc'">
        <input v-model="value" placeholder="Buscar página…" aria-label="Buscar página" />
        <div class="list">
          <button v-for="d in docs" :key="d.id" type="button" class="it" @click="pickDoc(d)"><span class="ic">{{ d.icon || '📄' }}</span><span class="tx"><strong>{{ d.title || 'Sem título' }}</strong></span></button>
          <p v-if="!docs.length" class="none">Nenhuma outra página.</p>
        </div>
      </template>
      <template v-else-if="step.then.step === 'project'">
        <p class="sec">De qual projeto?</p>
        <div class="list">
          <button type="button" class="it" @click="pickProject('all')"><span class="ic">✦</span><span class="tx"><strong>Todos os projetos</strong></span></button>
          <button v-for="p in state.projects" :key="p.id" type="button" class="it" @click="pickProject(p.id)"><span class="ic" :style="{ color: p.color }">■</span><span class="tx"><strong>{{ p.name }}</strong></span></button>
        </div>
      </template>
      <form v-else-if="step.then.step === 'map'" @submit.prevent="value.trim() && emit('insert', `@[map](${value.trim().replace(/[()]/g, '')})\n%c%`)">
        <input v-model="value" placeholder="Endereço ou nome do lugar" aria-label="Endereço do mapa" />
        <button type="submit" class="ok">Inserir</button>
      </form>
      <form v-else @submit.prevent="submitText">
        <input v-model="value" placeholder="Título da tarefa que o botão cria" aria-label="Título da tarefa do botão" />
        <button type="submit" class="ok">Inserir</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.bm { position: absolute; z-index: 30; display: flex; flex-direction: column; width: 20rem; max-height: 22rem; padding: 0.35rem; border: 1px solid var(--line-strong); border-radius: 10px; background: var(--surface); box-shadow: 0 18px 44px rgb(0 0 0 / 0.5); }
.x { position: absolute; top: 0.35rem; right: 0.35rem; z-index: 1; display: grid; place-items: center; width: 26px; height: 26px; padding: 0; border: 0; border-radius: 6px; background: var(--surface); font-size: 18px; line-height: 1; color: var(--muted); cursor: pointer; }
.x:hover { background: var(--surface-2); color: var(--text); }
.x:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 1px; }
.search, .step input { width: 100%; height: 32px; margin-bottom: 0.25rem; padding: 0 0.6rem; border: 1px solid var(--line-strong); border-radius: 7px; background: var(--bg); font: inherit; font-size: 13px; color: var(--text); outline: none; }
.search { width: calc(100% - 2rem); }
.search:focus, .step input:focus { border-color: var(--accent); }
.list { overflow-y: auto; }
.sec { margin: 0.45rem 0.4rem 0.2rem; font-size: 11.5px; font-weight: 600; color: var(--muted); }
.it { display: flex; align-items: center; gap: 0.6rem; width: 100%; padding: 0.3rem 0.4rem; border: 0; border-radius: 6px; background: none; color: var(--text); text-align: left; cursor: pointer; }
.it.on, .it:hover { background: var(--surface-2); }
.ic { display: grid; flex: none; place-items: center; width: 34px; height: 34px; border: 1px solid var(--line); border-radius: 6px; background: var(--bg); font: 600 13px/1 'Geist', system-ui, sans-serif; color: var(--text); }
.tx { display: flex; flex-direction: column; min-width: 0; }
.tx strong { font-size: 13.5px; font-weight: 500; }
.tx small { overflow: hidden; font-size: 11.5px; color: var(--muted); text-overflow: ellipsis; white-space: nowrap; }
.none, .err { margin: 0.5rem 0.4rem; font-size: 12.5px; color: var(--muted); }
.err { color: var(--danger, #ff8a80); }
.step { display: flex; flex-direction: column; gap: 0.3rem; min-height: 0; }
.step form { display: flex; gap: 0.3rem; }
.back { align-self: flex-start; padding: 0.2rem 0.3rem; border: 0; background: none; font-size: 12.5px; color: var(--muted); cursor: pointer; }
.ok { flex: none; height: 32px; padding: 0 0.75rem; border: 0; border-radius: 7px; background: var(--accent); font: 600 12.5px/1 'Geist', system-ui, sans-serif; color: #140700; cursor: pointer; }
.up { display: grid; place-items: center; height: 34px; border: 1px dashed var(--line-strong); border-radius: 7px; font-size: 13px; color: var(--text); cursor: pointer; }
.up:hover { border-color: var(--accent); }
.up input { position: absolute; width: 1px; height: 1px; opacity: 0; }
:is(.it, .back, .ok):focus-visible, .up:focus-within { outline: 2px solid var(--accent-soft); outline-offset: 1px; }
</style>
