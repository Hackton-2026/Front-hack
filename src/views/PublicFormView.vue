<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { api } from '../services/api'
import { PRIORITIES } from '../composables/useWorkspace'
import BrandN from '../components/app/BrandN.vue'
import ProjectIcon from '../components/app/ProjectIcon.vue'
import AppSelect from '../components/app/AppSelect.vue'
import AppDateInput from '../components/app/AppDateInput.vue'
import AppIcon from '../components/app/AppIcon.vue'

const props = defineProps({ token: { type: String, required: true } })
const info = ref(null)
const error = ref('')
const loading = ref(true)
const submitting = ref(false)
const submitted = ref(null)

const form = reactive({
  title: '',
  description: '',
  priority: 'normal',
  due: '',
  requester_name: '',
  requester_email: '',
  website: '',
})

const priorityOptions = computed(() => [
  { value: '', label: 'Sem prioridade' },
  ...PRIORITIES.map((p) => ({ value: p.id, label: p.name, color: p.color })),
])

onMounted(async () => {
  try {
    const res = await api(`/api/public/forms/${encodeURIComponent(props.token)}/`, { auth: false })
    info.value = res
    form.priority = res.default_priority || 'normal'
  } catch (e) {
    error.value = e.status === 404 ? 'Este formulário não está ativo ou o link expirou.' : (e.message || 'Não foi possível carregar o formulário.')
  } finally {
    loading.value = false
  }
})

async function submit() {
  if (!form.title.trim() || submitting.value) return
  submitting.value = true
  error.value = ''
  try {
    const res = await api(`/api/public/forms/${encodeURIComponent(props.token)}/submit/`, {
      method: 'POST',
      auth: false,
      body: {
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        due: form.due || null,
        requester_name: form.requester_name.trim(),
        requester_email: form.requester_email.trim(),
        website: form.website,
      },
    })
    submitted.value = res
  } catch (e) {
    error.value = e.message || 'Não foi possível enviar a solicitação.'
  } finally {
    submitting.value = false
  }
}

function reset() {
  submitted.value = null
  Object.assign(form, { title: '', description: '', due: '', website: '' })
}
</script>

<template>
  <div class="pub">
    <header class="bar">
      <RouterLink to="/" class="brand" aria-label="Novexo">
        <BrandN :size="20" />
        <span>NOVEXO</span>
      </RouterLink>
    </header>

    <main class="wrap">
      <section class="card" aria-live="polite">
        <p v-if="loading" class="muted">Carregando formulário…</p>

        <template v-else-if="submitted">
          <span class="ok-ic"><AppIcon name="check" :size="20" /></span>
          <span class="code">{{ submitted.code }}</span>
          <h1>Solicitação enviada</h1>
          <p class="sub"><strong>{{ submitted.title }}</strong> entrou na fila de {{ info?.project_name || 'equipe' }}.</p>
          <button type="button" class="btn primary" @click="reset">Enviar outra solicitação</button>
        </template>

        <template v-else-if="info">
          <div class="head">
            <span class="proj" :style="{ '--c': info.project_color }"><ProjectIcon :icon="info.project_icon" :color="info.project_color" :size="20" /></span>
            <div>
              <span class="kicker">{{ info.project_name }}</span>
              <h1>{{ info.title }}</h1>
            </div>
          </div>
          <p v-if="info.description" class="sub">{{ info.description }}</p>

          <form class="form" @submit.prevent="submit">
            <input v-model="form.website" type="text" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true" />
            <label>
              <span>Título da solicitação *</span>
              <input v-model="form.title" type="text" maxlength="180" required placeholder="Resumo curto do que você precisa" />
            </label>
            <label>
              <span>Detalhes</span>
              <textarea v-model="form.description" rows="4" maxlength="4000" placeholder="Contexto, links, referências ou critérios importantes…" />
            </label>
            <div class="grid2">
              <label>
                <span>Prioridade</span>
                <AppSelect v-model="form.priority" :options="priorityOptions" block />
              </label>
              <label>
                <span>Prazo desejado</span>
                <AppDateInput v-model="form.due" placeholder="Opcional" block />
              </label>
            </div>
            <div class="grid2">
              <label>
                <span>Seu nome</span>
                <input v-model="form.requester_name" type="text" maxlength="100" placeholder="Como podemos te chamar?" />
              </label>
              <label>
                <span>Seu e-mail</span>
                <input v-model="form.requester_email" type="email" maxlength="150" placeholder="nome@empresa.com" />
              </label>
            </div>
            <p v-if="error" class="err" role="alert">{{ error }}</p>
            <button type="submit" class="btn primary" :disabled="submitting || !form.title.trim()">
              {{ submitting ? 'Enviando…' : 'Enviar solicitação' }}
            </button>
          </form>
        </template>

        <template v-else>
          <h1>Formulário indisponível</h1>
          <p class="sub">{{ error }}</p>
          <RouterLink to="/" class="btn">Voltar para o Novexo</RouterLink>
        </template>
      </section>
    </main>

    <footer class="foot">Formulário público via <RouterLink to="/">Novexo</RouterLink></footer>
  </div>
</template>

<style scoped>
.pub {
  --bg: #0f0e0d;
  --surface: #181614;
  --surface-2: #211f1c;
  --line: rgb(255 255 255 / 0.08);
  --line-strong: rgb(255 255 255 / 0.14);
  --text: #f2efea;
  --muted: #9e9890;
  --accent: #e56515;
  --accent-soft: #fba45c;
  --ease: cubic-bezier(0.23, 1, 0.32, 1);
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  color: var(--text);
  font: 400 15px/1.5 'Geist', system-ui, sans-serif;
}
.bar { display: flex; align-items: center; height: 60px; padding: 0 clamp(1rem, 4vw, 2.5rem); border-bottom: 1px solid var(--line); }
.brand { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--text); text-decoration: none; font: 800 1rem/1 'Lexend', 'Geist', system-ui, sans-serif; letter-spacing: -0.02em; }
.wrap { flex: 1; display: grid; place-items: center; padding: 2rem 1rem 3rem; }
.card { display: flex; flex-direction: column; gap: 1rem; width: min(100%, 34rem); padding: clamp(1.35rem, 4vw, 2rem); border: 1px solid var(--line); border-radius: 16px; background: var(--surface); }
.head { display: flex; align-items: center; gap: 0.85rem; }
.proj { display: grid; place-items: center; flex-shrink: 0; width: 42px; height: 42px; border: 1px solid var(--line-strong); border-radius: 10px; background: var(--surface-2); }
.kicker { display: block; font-size: 12px; font-weight: 500; color: var(--accent-soft); }
h1 { margin: 0.1rem 0 0; font: 650 1.45rem/1.2 'Geist', system-ui, sans-serif; letter-spacing: -0.02em; color: var(--text); }
.sub, .muted { margin: 0; font-size: 14px; color: var(--muted); line-height: 1.55; }
.sub strong { color: var(--text); }
.form { display: flex; flex-direction: column; gap: 0.9rem; margin-top: 0.25rem; }
.form label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 12.5px; font-weight: 500; color: var(--muted); }
.form input:not(.hp), .form textarea { width: 100%; padding: 0.55rem 0.75rem; border: 1px solid var(--line-strong); border-radius: 8px; background: var(--bg); font: inherit; font-size: 14px; color: var(--text); outline: none; transition: border-color 0.15s var(--ease); }
.form textarea { resize: vertical; min-height: 5.5rem; }
.form input:focus, .form textarea:focus { border-color: var(--accent); }
.grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; }
@media (max-width: 560px) { .grid2 { grid-template-columns: 1fr; } }
.hp { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.btn { display: inline-flex; align-items: center; justify-content: center; height: 42px; padding: 0 1.15rem; border: 1px solid var(--line-strong); border-radius: 9px; background: none; font: 600 14px/1 'Geist', system-ui, sans-serif; color: var(--text); text-decoration: none; cursor: pointer; transition: background 0.15s var(--ease), border-color 0.15s var(--ease), transform 0.12s var(--ease); }
.btn:hover:not(:disabled) { border-color: var(--text); background: var(--surface-2); }
.btn:active:not(:disabled) { transform: scale(0.97); }
.btn.primary { border-color: var(--accent); background: var(--accent); color: #000; }
.btn.primary:hover:not(:disabled) { background: var(--accent-soft); border-color: var(--accent-soft); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.ok-ic { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 10px; background: color-mix(in srgb, var(--accent) 18%, transparent); color: var(--accent-soft); }
.code { align-self: flex-start; padding: 0.2rem 0.5rem; border: 1px solid var(--line-strong); border-radius: 6px; background: var(--bg); font: 600 12px/1 'Geist Mono', monospace; color: var(--accent-soft); font-variant-numeric: tabular-nums; }
.err { margin: 0; padding: 0.6rem 0.75rem; border: 1px solid rgb(255 91 77 / 0.4); border-radius: 8px; background: rgb(255 91 77 / 0.08); font-size: 13px; color: #ffb4ab; }
.foot { padding: 1rem; text-align: center; font-size: 12px; color: var(--muted); }
.foot a { color: var(--text); text-decoration: none; }
.foot a:hover { color: var(--accent-soft); }
:is(.btn, .brand):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .btn:active { transform: none; } }
</style>
