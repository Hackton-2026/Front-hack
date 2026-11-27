<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { api } from '../../services/api'
import { useWorkspace } from '../../composables/useWorkspace'
import { useUi } from '../../composables/useUi'
import AppIcon from './AppIcon.vue'
import AppSelect from './AppSelect.vue'

const props = defineProps({
  open: Boolean,
  project: { type: Object, default: null },
  tasks: { type: Array, default: () => [] },
  canEdit: Boolean,
})
const emit = defineEmits(['close'])

const { PRIORITIES, STATUSES } = useWorkspace()
const { toast } = useUi()
const panel = ref(null)
const tab = ref('automations')
const loading = ref(false)
const origin = typeof location !== 'undefined' ? location.origin : ''

// Automations state
const rules = ref([])
const recipes = ref([])
const prompt = ref('')
const drafting = ref(false)
const draft = ref(null)
const savingRule = ref(false)

// Public Form state
const form = ref(null)
const formDraft = reactive({ title: '', description: '', default_priority: 'normal', default_tag: 'solicitacao', is_active: true })
const savingForm = ref(false)

// Client Portal state
const portal = ref(null)
const portalDraft = reactive({ title: '', subtitle: '', is_active: true })
const savingPortal = ref(false)

const clientVisibleCount = computed(() => props.tasks.filter((t) => t.clientVisible).length)
const priorityOptions = computed(() => [
  { value: '', label: 'Sem prioridade' },
  ...PRIORITIES.map((p) => ({ value: p.id, label: p.name, color: p.color })),
])
const statusName = (k) => STATUSES.find((s) => s.id === k)?.name || k
const priorityName = (k) => PRIORITIES.find((p) => p.id === k)?.name || k

function describeTrigger(r) {
  const cfg = r.trigger_config || {}
  if (r.trigger_type === 'task_created') return cfg.priority ? `Tarefa criada com prioridade ${priorityName(cfg.priority)}` : 'Quando uma tarefa for criada'
  if (r.trigger_type === 'task_completed') return 'Quando uma tarefa for concluída'
  if (r.trigger_type === 'priority_changed') return cfg.to_priority ? `Prioridade mudar para ${priorityName(cfg.to_priority)}` : 'Quando a prioridade mudar'
  if (r.trigger_type === 'status_changed') return cfg.to_status ? `Status mudar para ${statusName(cfg.to_status)}` : 'Quando o status mudar'
  return r.trigger_type
}
function describeAction(r) {
  const cfg = r.action_config || {}
  if (r.action_type === 'notify_members') return 'Notificar membros do projeto'
  if (r.action_type === 'send_whatsapp') return 'Enviar alerta no WhatsApp'
  if (r.action_type === 'post_project_chat') return 'Anunciar no chat do projeto'
  if (r.action_type === 'add_tag') return `Adicionar etiqueta "${cfg.tag || 'automatico'}"`
  if (r.action_type === 'set_status') return `Mover para ${statusName(cfg.status || 'doing')}`
  if (r.action_type === 'set_priority') return `Definir prioridade ${priorityName(cfg.priority || 'urgent')}`
  if (r.action_type === 'assign_user') return 'Atribuir responsável'
  return r.action_type
}

function syncFormDraft(f) {
  form.value = f
  if (f) {
    Object.assign(formDraft, {
      title: f.title || '',
      description: f.description || '',
      default_priority: f.default_priority || 'normal',
      default_tag: f.default_tag || 'solicitacao',
      is_active: f.is_active !== false,
    })
  }
}
function syncPortalDraft(p) {
  portal.value = p
  if (p) {
    Object.assign(portalDraft, {
      title: p.title || '',
      subtitle: p.subtitle || '',
      is_active: p.is_active !== false,
    })
  }
}

async function loadAll() {
  if (!props.project?.id) return
  loading.value = true
  try {
    const [autoRes, formRes, portalRes] = await Promise.all([
      api(`/api/projects/${props.project.id}/automations/`).catch(() => ({ rules: [], recipes: [] })),
      api(`/api/projects/${props.project.id}/form/`).catch(() => null),
      api(`/api/projects/${props.project.id}/portal/`).catch(() => null),
    ])
    rules.value = autoRes.rules || []
    recipes.value = autoRes.recipes || []
    syncFormDraft(formRes)
    syncPortalDraft(portalRes)
  } finally {
    loading.value = false
  }
}

watch(() => [props.open, props.project?.id], async ([isOpen]) => {
  if (!isOpen) return
  draft.value = null
  prompt.value = ''
  loadAll()
  await nextTick()
  panel.value?.focus({ preventScroll: true })
})

async function draftRule() {
  if (!prompt.value.trim() || drafting.value || !props.project) return
  drafting.value = true
  try {
    const res = await api(`/api/projects/${props.project.id}/automations/draft-ai/`, {
      method: 'POST',
      body: { prompt: prompt.value.trim() },
    })
    draft.value = res.draft
  } catch (e) {
    toast(e.message || 'Não foi possível gerar a regra.')
  } finally {
    drafting.value = false
  }
}

async function createRule(spec) {
  if (!props.project || savingRule.value) return
  savingRule.value = true
  try {
    const created = await api(`/api/projects/${props.project.id}/automations/`, {
      method: 'POST',
      body: {
        name: spec.name,
        trigger_type: spec.trigger_type,
        trigger_config: spec.trigger_config || {},
        action_type: spec.action_type,
        action_config: spec.action_config || {},
      },
    })
    rules.value.unshift(created)
    draft.value = null
    prompt.value = ''
    toast('Automação ativada.')
  } catch (e) {
    toast(e.message || 'Não foi possível ativar a automação.')
  } finally {
    savingRule.value = false
  }
}

async function toggleRule(r) {
  const next = !r.is_active
  r.is_active = next
  try {
    await api(`/api/projects/${props.project.id}/automations/${r.id}/`, { method: 'PATCH', body: { is_active: next } })
  } catch (e) {
    r.is_active = !next
    toast(e.message || 'Não foi possível atualizar.')
  }
}

async function deleteRule(r) {
  try {
    await api(`/api/projects/${props.project.id}/automations/${r.id}/`, { method: 'DELETE' })
    rules.value = rules.value.filter((x) => x.id !== r.id)
    toast('Automação removida.')
  } catch (e) {
    toast(e.message || 'Não foi possível remover.')
  }
}

const recipeActive = (rec) => rules.value.some((r) => r.trigger_type === rec.trigger_type && r.action_type === rec.action_type && r.name === rec.name)

async function activateForm() {
  savingForm.value = true
  try {
    const res = await api(`/api/projects/${props.project.id}/form/`, { method: 'PUT', body: {} })
    syncFormDraft(res)
    toast('Formulário público ativado.')
  } catch (e) {
    toast(e.message || 'Não foi possível ativar o formulário.')
  } finally {
    savingForm.value = false
  }
}
async function saveForm() {
  savingForm.value = true
  try {
    const res = await api(`/api/projects/${props.project.id}/form/`, { method: 'PUT', body: { ...formDraft } })
    syncFormDraft(res)
    toast('Formulário salvo.')
  } catch (e) {
    toast(e.message || 'Não foi possível salvar.')
  } finally {
    savingForm.value = false
  }
}
async function removeForm() {
  savingForm.value = true
  try {
    await api(`/api/projects/${props.project.id}/form/`, { method: 'DELETE' })
    form.value = null
    toast('Link do formulário removido.')
  } catch (e) {
    toast(e.message || 'Não foi possível remover.')
  } finally {
    savingForm.value = false
  }
}

async function activatePortal() {
  savingPortal.value = true
  try {
    const res = await api(`/api/projects/${props.project.id}/portal/`, { method: 'PUT', body: {} })
    syncPortalDraft(res)
    toast('Portal do cliente ativado.')
  } catch (e) {
    toast(e.message || 'Não foi possível ativar o portal.')
  } finally {
    savingPortal.value = false
  }
}
async function savePortal() {
  savingPortal.value = true
  try {
    const res = await api(`/api/projects/${props.project.id}/portal/`, { method: 'PUT', body: { ...portalDraft } })
    syncPortalDraft(res)
    toast('Portal salvo.')
  } catch (e) {
    toast(e.message || 'Não foi possível salvar.')
  } finally {
    savingPortal.value = false
  }
}
async function removePortal() {
  savingPortal.value = true
  try {
    await api(`/api/projects/${props.project.id}/portal/`, { method: 'DELETE' })
    portal.value = null
    toast('Link do portal removido.')
  } catch (e) {
    toast(e.message || 'Não foi possível remover.')
  } finally {
    savingPortal.value = false
  }
}

async function copyUrl(url, label) {
  try {
    await navigator.clipboard.writeText(url)
    toast(label)
  } catch {
    toast('Não deu para copiar o link.')
  }
}
</script>

<template>
  <Transition name="cust">
    <div v-if="open && project" class="veil" @click.self="emit('close')" @keydown.esc="emit('close')">
      <aside ref="panel" tabindex="-1" class="drawer" role="dialog" aria-modal="true" :aria-label="`Personalizar ${project.name}`">
        <header class="head">
          <div>
            <span class="eyebrow">{{ project.name }}</span>
            <h2>Personalizar projeto</h2>
          </div>
          <button type="button" class="icon" aria-label="Fechar" @click="emit('close')"><AppIcon name="close" :size="16" /></button>
        </header>

        <div class="tabs" role="tablist">
          <button type="button" role="tab" :aria-selected="tab === 'automations'" @click="tab = 'automations'"><AppIcon name="bolt" :size="14" />Automações<span v-if="rules.length" class="cnt">{{ rules.length }}</span></button>
          <button type="button" role="tab" :aria-selected="tab === 'form'" @click="tab = 'form'"><AppIcon name="doc" :size="14" />Formulário<span v-if="form?.is_active" class="dot-on" /></button>
          <button type="button" role="tab" :aria-selected="tab === 'portal'" @click="tab = 'portal'"><AppIcon name="globe" :size="14" />Portal do cliente<span v-if="portal?.is_active" class="dot-on" /></button>
        </div>

        <div class="body">
          <p v-if="loading && !rules.length && !form && !portal" class="muted">Carregando configurações…</p>

          <!-- AUTOMATIONS TAB -->
          <template v-else-if="tab === 'automations'">
            <form v-if="canEdit" class="loop" @submit.prevent="draftRule">
              <label for="loop-prompt">Descreva a automação em português</label>
              <div class="loop__row">
                <input id="loop-prompt" v-model="prompt" type="text" placeholder="Ex.: Mandar WhatsApp quando uma tarefa ficar urgente" maxlength="400" />
                <button type="submit" class="btn primary" :disabled="drafting || !prompt.trim()">{{ drafting ? 'Gerando…' : 'Criar regra' }}</button>
              </div>
              <small class="hint">O Novexo monta gatilho e ação para você revisar antes de ativar.</small>
            </form>

            <div v-if="draft" class="preview">
              <div class="preview__head">
                <strong>Revisar automação</strong>
                <button type="button" class="x" aria-label="Descartar" @click="draft = null"><AppIcon name="close" :size="13" /></button>
              </div>
              <input v-model="draft.name" class="field" aria-label="Nome da regra" />
              <div class="flow">
                <div><small>QUANDO</small><span>{{ describeTrigger(draft) }}</span></div>
                <AppIcon name="arrow" :size="14" />
                <div><small>ENTÃO</small><span>{{ describeAction(draft) }}</span></div>
              </div>
              <div class="preview__foot">
                <button type="button" class="btn" @click="draft = null">Descartar</button>
                <button type="button" class="btn primary" :disabled="savingRule || !draft.name.trim()" @click="createRule(draft)">Ativar regra</button>
              </div>
            </div>

            <section v-if="rules.length" class="sec">
              <h3>Regras do projeto <span>{{ rules.length }}</span></h3>
              <ul class="rules">
                <li v-for="r in rules" :key="r.id" :class="{ off: !r.is_active }">
                  <div class="rule__main">
                    <strong>{{ r.name }}</strong>
                    <small>{{ describeTrigger(r) }} → {{ describeAction(r) }}</small>
                    <span class="rule__meta">{{ r.run_count || 0 }} {{ (r.run_count || 0) === 1 ? 'execução' : 'execuções' }}</span>
                  </div>
                  <div v-if="canEdit" class="rule__acts">
                    <button type="button" role="switch" class="switch" :aria-checked="r.is_active" :aria-label="`Ativar ${r.name}`" @click="toggleRule(r)"><span /></button>
                    <button type="button" class="x" :aria-label="`Apagar ${r.name}`" @click="deleteRule(r)"><AppIcon name="trash" :size="13" /></button>
                  </div>
                </li>
              </ul>
            </section>

            <section class="sec">
              <h3>Receitas prontas (1 clique)</h3>
              <ul class="recipes">
                <li v-for="rec in recipes" :key="rec.id">
                  <div>
                    <strong>{{ rec.name }}</strong>
                    <small>{{ describeTrigger(rec) }} → {{ describeAction(rec) }}</small>
                  </div>
                  <button v-if="canEdit" type="button" class="btn sm" :disabled="savingRule || recipeActive(rec)" @click="createRule(rec)">
                    {{ recipeActive(rec) ? 'Ativa' : 'Usar' }}
                  </button>
                </li>
              </ul>
            </section>
          </template>

          <!-- PUBLIC FORM TAB -->
          <template v-else-if="tab === 'form'">
            <div v-if="!form" class="empty">
              <span class="empty__ic"><AppIcon name="doc" :size="20" /></span>
              <h3>Formulário público de solicitações</h3>
              <p>Receba demandas de clientes ou de outros times por um link sem login. Cada envio vira uma tarefa pronta na fila deste projeto.</p>
              <button v-if="canEdit" type="button" class="btn primary" :disabled="savingForm" @click="activateForm">Ativar formulário público</button>
            </div>
            <template v-else>
              <div class="share-card">
                <div class="share-card__top">
                  <span class="badge" :class="{ on: formDraft.is_active }">{{ formDraft.is_active ? 'Ativo' : 'Pausado' }}</span>
                  <span class="stat">{{ form.submissions_count || 0 }} {{ (form.submissions_count || 0) === 1 ? 'envio' : 'envios' }}</span>
                </div>
                <div class="share-url">
                  <code>{{ `${origin}/f/${form.token}` }}</code>
                  <button type="button" class="btn sm" @click="copyUrl(`${origin}/f/${form.token}`, 'Link do formulário copiado.')"><AppIcon name="copy" :size="13" />Copiar</button>
                  <a :href="`/f/${form.token}`" target="_blank" rel="noopener" class="btn sm">Abrir</a>
                </div>
              </div>

              <form class="form" @submit.prevent="saveForm">
                <div class="toggle-row">
                  <span>Aceitar novos envios<small>Desligue para pausar temporariamente sem apagar o link.</small></span>
                  <button type="button" role="switch" class="switch" :aria-checked="formDraft.is_active" :disabled="!canEdit" @click="formDraft.is_active = !formDraft.is_active"><span /></button>
                </div>
                <label>Título da página <input v-model="formDraft.title" class="field" maxlength="140" :disabled="!canEdit" /></label>
                <label>Instruções para quem envia <textarea v-model="formDraft.description" class="field" rows="3" maxlength="1000" :disabled="!canEdit" /></label>
                <div class="grid2">
                  <label>Prioridade padrão <AppSelect v-model="formDraft.default_priority" :options="priorityOptions" :disabled="!canEdit" block /></label>
                  <label>Etiqueta automática <input v-model="formDraft.default_tag" class="field" maxlength="40" placeholder="solicitacao" :disabled="!canEdit" /></label>
                </div>
                <div v-if="canEdit" class="form__foot">
                  <button type="button" class="btn danger" :disabled="savingForm" @click="removeForm">Remover link</button>
                  <button type="submit" class="btn primary" :disabled="savingForm">{{ savingForm ? 'Salvando…' : 'Salvar formulário' }}</button>
                </div>
              </form>
            </template>
          </template>

          <!-- CLIENT PORTAL TAB -->
          <template v-else>
            <div v-if="!portal" class="empty">
              <span class="empty__ic"><AppIcon name="globe" :size="20" /></span>
              <h3>Portal do cliente (sem login)</h3>
              <p>Compartilhe um painel limpo mostrando o andamento ao vivo apenas das tarefas marcadas como <strong>Visível no portal do cliente</strong> — sem cobrar assento extra.</p>
              <button v-if="canEdit" type="button" class="btn primary" :disabled="savingPortal" @click="activatePortal">Ativar portal do cliente</button>
            </div>
            <template v-else>
              <div class="share-card">
                <div class="share-card__top">
                  <span class="badge" :class="{ on: portalDraft.is_active }">{{ portalDraft.is_active ? 'Ativo' : 'Pausado' }}</span>
                  <span class="stat">{{ clientVisibleCount }} {{ clientVisibleCount === 1 ? 'tarefa visível' : 'tarefas visíveis' }} · {{ portal.views_count || 0 }} acessos</span>
                </div>
                <div class="share-url">
                  <code>{{ `${origin}/portal/${portal.token}` }}</code>
                  <button type="button" class="btn sm" @click="copyUrl(`${origin}/portal/${portal.token}`, 'Link do portal copiado.')"><AppIcon name="copy" :size="13" />Copiar</button>
                  <a :href="`/portal/${portal.token}`" target="_blank" rel="noopener" class="btn sm">Abrir</a>
                </div>
                <p v-if="!clientVisibleCount" class="hint">Nenhuma tarefa marcada ainda — abra qualquer tarefa e marque <strong>Visível no portal do cliente</strong> em Propriedades.</p>
              </div>

              <form class="form" @submit.prevent="savePortal">
                <div class="toggle-row">
                  <span>Portal acessível pelo link<small>Se pausar, visitantes verão que o portal está inativo.</small></span>
                  <button type="button" role="switch" class="switch" :aria-checked="portalDraft.is_active" :disabled="!canEdit" @click="portalDraft.is_active = !portalDraft.is_active"><span /></button>
                </div>
                <label>Título exibido ao cliente <input v-model="portalDraft.title" class="field" maxlength="140" :disabled="!canEdit" /></label>
                <label>Subtítulo <textarea v-model="portalDraft.subtitle" class="field" rows="2" maxlength="300" :disabled="!canEdit" /></label>
                <div v-if="canEdit" class="form__foot">
                  <button type="button" class="btn danger" :disabled="savingPortal" @click="removePortal">Remover link</button>
                  <button type="submit" class="btn primary" :disabled="savingPortal">{{ savingPortal ? 'Salvando…' : 'Salvar portal' }}</button>
                </div>
              </form>
            </template>
          </template>
        </div>
      </aside>
    </div>
  </Transition>
</template>

<style scoped>
.veil { position: fixed; inset: 0; z-index: 72; display: flex; justify-content: flex-end; background: rgb(0 0 0 / 0.45); }
.drawer { display: flex; flex-direction: column; width: min(94vw, 34rem); height: 100%; border-left: 1px solid var(--line-strong); background: var(--surface); box-shadow: -20px 0 50px rgb(0 0 0 / 0.45); outline: none; }
.cust-enter-active, .cust-leave-active { transition: opacity 0.22s var(--ease); }
.cust-enter-active .drawer, .cust-leave-active .drawer { transition: transform 0.34s var(--ease-drawer, cubic-bezier(0.32, 0.72, 0, 1)); }
.cust-enter-from, .cust-leave-to { opacity: 0; }
.cust-enter-from .drawer, .cust-leave-to .drawer { transform: translateX(100%); }

.head { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 1rem 1.25rem; border-bottom: 1px solid var(--line); }
.eyebrow { display: block; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--accent-soft); }
h2 { margin: 0.15rem 0 0; font: 650 1.15rem/1.2 'Geist', system-ui, sans-serif; color: var(--text); }
.icon { display: grid; place-items: center; width: 32px; height: 32px; border: 0; border-radius: 7px; background: none; color: var(--muted); cursor: pointer; }
.icon:hover { background: var(--surface-2); color: var(--text); }

.tabs { display: flex; gap: 0.2rem; padding: 0.5rem 1.25rem 0; border-bottom: 1px solid var(--line); }
.tabs button { display: inline-flex; align-items: center; gap: 0.4rem; margin-bottom: -1px; padding: 0.55rem 0.65rem; border: 0; border-bottom: 2px solid transparent; background: none; font-size: 13px; font-weight: 500; color: var(--muted); cursor: pointer; transition: color 0.15s var(--ease), border-color 0.15s var(--ease); }
.tabs button:hover { color: var(--text); }
.tabs button[aria-selected='true'] { border-color: var(--accent); color: var(--text); }
.cnt { padding: 0.05rem 0.4rem; border-radius: 999px; background: var(--surface-2); font-size: 11px; font-variant-numeric: tabular-nums; }
.dot-on { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }

.body { flex: 1; display: flex; flex-direction: column; gap: 1.25rem; padding: 1.25rem; overflow-y: auto; }
.muted, .hint { margin: 0; font-size: 12.5px; line-height: 1.5; color: var(--muted); }
h3 { display: flex; align-items: center; gap: 0.4rem; margin: 0 0 0.6rem; font: 600 13px/1.2 'Geist', system-ui, sans-serif; color: var(--text); }
h3 span { font-weight: 400; color: var(--muted); font-variant-numeric: tabular-nums; }
.sec { display: flex; flex-direction: column; }

.loop { display: flex; flex-direction: column; gap: 0.45rem; padding: 0.9rem; border: 1px solid var(--line); border-radius: 10px; background: color-mix(in srgb, var(--bg) 55%, var(--surface)); }
.loop label { font-size: 12.5px; font-weight: 600; color: var(--text); }
.loop__row { display: flex; gap: 0.45rem; }
.loop__row input, .field { flex: 1; min-width: 0; padding: 0.5rem 0.65rem; border: 1px solid var(--line-strong); border-radius: 7px; background: var(--bg); font: inherit; font-size: 13.5px; color: var(--text); outline: none; }
.loop__row input:focus, .field:focus { border-color: var(--accent); }

.preview { display: flex; flex-direction: column; gap: 0.65rem; padding: 0.9rem; border: 1px solid color-mix(in srgb, var(--accent) 45%, var(--line)); border-radius: 10px; background: color-mix(in srgb, var(--accent) 7%, var(--bg)); }
.preview__head { display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: var(--accent-soft); }
.flow { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: 0.5rem; padding: 0.65rem; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); font-size: 12.5px; }
.flow small { display: block; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 0.15rem; }
.preview__foot { display: flex; justify-content: flex-end; gap: 0.5rem; }

.rules, .recipes { display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none; border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
.rules li, .recipes li { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.75rem 0.85rem; background: color-mix(in srgb, var(--bg) 40%, var(--surface)); }
.rules li + li, .recipes li + li { border-top: 1px solid var(--line); }
.rules li.off { opacity: 0.55; }
.rule__main, .recipes li > div { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
.rule__main strong, .recipes strong { font-size: 13px; font-weight: 550; color: var(--text); }
.rule__main small, .recipes small { font-size: 12px; color: var(--muted); }
.rule__meta { font: 500 11px/1 'Geist Mono', monospace; color: var(--accent-soft); font-variant-numeric: tabular-nums; margin-top: 0.15rem; }
.rule__acts { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }

.empty { display: flex; flex-direction: column; align-items: flex-start; gap: 0.65rem; padding: 1.4rem; border: 1px solid var(--line); border-radius: 12px; background: color-mix(in srgb, var(--bg) 50%, var(--surface)); }
.empty__ic { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 9px; background: color-mix(in srgb, var(--accent) 14%, transparent); color: var(--accent-soft); }
.empty h3 { margin: 0; font-size: 15px; }
.empty p { margin: 0; font-size: 13px; line-height: 1.55; color: var(--muted); }

.share-card { display: flex; flex-direction: column; gap: 0.6rem; padding: 0.9rem; border: 1px solid var(--line); border-radius: 10px; background: color-mix(in srgb, var(--bg) 55%, var(--surface)); }
.share-card__top { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.badge { padding: 0.15rem 0.5rem; border-radius: 999px; background: var(--surface-2); font-size: 11.5px; font-weight: 600; color: var(--muted); }
.badge.on { background: color-mix(in srgb, var(--accent) 16%, transparent); color: var(--accent-soft); }
.stat { font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }
.share-url { display: flex; align-items: center; gap: 0.4rem; }
.share-url code { flex: 1; min-width: 0; padding: 0.45rem 0.6rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; border: 1px solid var(--line); border-radius: 7px; background: var(--bg); font: 400 12px/1.2 'Geist Mono', monospace; color: var(--text); }

.form { display: flex; flex-direction: column; gap: 0.9rem; }
.form label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 12.5px; font-weight: 500; color: var(--muted); }
.grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; }
.toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.75rem 0.85rem; border: 1px solid var(--line); border-radius: 9px; background: color-mix(in srgb, var(--bg) 45%, var(--surface)); font-size: 13px; color: var(--text); }
.toggle-row small { display: block; margin-top: 0.15rem; font-size: 11.5px; color: var(--muted); }
.form__foot { display: flex; justify-content: space-between; align-items: center; gap: 0.6rem; padding-top: 0.4rem; }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem; height: 34px; padding: 0 0.85rem; border: 1px solid var(--line-strong); border-radius: 7px; background: none; font: 500 13px/1 'Geist', system-ui, sans-serif; color: var(--text); text-decoration: none; cursor: pointer; white-space: nowrap; transition: border-color 0.15s var(--ease), background 0.15s var(--ease), transform 0.12s var(--ease); }
.btn:hover:not(:disabled) { border-color: var(--text); background: var(--surface-2); }
.btn:active:not(:disabled) { transform: scale(0.97); }
.btn.sm { height: 29px; padding: 0 0.6rem; font-size: 12px; }
.btn.primary { border-color: var(--accent); background: var(--accent); color: #000; font-weight: 600; }
.btn.primary:hover:not(:disabled) { background: var(--accent-soft); border-color: var(--accent-soft); }
.btn.danger { border-color: rgb(255 91 77 / 0.45); color: var(--danger, #ff8a80); }
.btn.danger:hover:not(:disabled) { background: rgb(255 91 77 / 0.12); border-color: var(--danger, #ff8a80); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.x { display: grid; place-items: center; width: 26px; height: 26px; padding: 0; border: 0; border-radius: 6px; background: none; color: var(--muted); cursor: pointer; }
.x:hover { background: var(--surface-2); color: var(--danger, #ff8a80); }

.switch { position: relative; flex-shrink: 0; width: 34px; height: 19px; padding: 0; border: 0; border-radius: 999px; background: var(--line-strong); cursor: pointer; transition: background 0.2s var(--ease); }
.switch span { position: absolute; top: 2px; left: 2px; width: 15px; height: 15px; border-radius: 50%; background: var(--text); transition: translate 0.22s var(--ease); }
.switch[aria-checked='true'] { background: var(--accent); }
.switch[aria-checked='true'] span { translate: 15px 0; background: #fff; }

:is(.btn, .icon, .x, .switch, .tabs button):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  .cust-enter-active, .cust-leave-active, .cust-enter-active .drawer, .cust-leave-active .drawer { transition: none; }
  .btn:active { transform: none; }
}
</style>
