<script setup>
// Formulário da Novexo IA (como o request_user_input do Codex): aparece abaixo da resposta quando a IA precisa de
// detalhes antes de agir. Opções para marcar, "Outra" para escrever, e as respostas viram a próxima mensagem.
import { computed, reactive } from 'vue'

const props = defineProps({ form: { type: Object, required: true }, disabled: Boolean })
const emit = defineEmits(['answer'])
const qs = computed(() => props.form.questions)
const picked = reactive(props.form.questions.map(() => [])) // opções marcadas por pergunta
const other = reactive(props.form.questions.map(() => '')) // "Outra" escrita por pergunta
const uid = Math.random().toString(36).slice(2, 8)

const answerOf = (i) => [...picked[i], other[i].trim()].filter(Boolean).join(', ')
const done = computed(() => qs.value.filter((_, i) => answerOf(i)).length)
const hasRecommended = computed(() => qs.value.some((q) => q.recommended))

function pick(i, opt) {
  const on = picked[i].includes(opt)
  if (qs.value[i].multiple) picked[i] = on ? picked[i].filter((o) => o !== opt) : [...picked[i], opt]
  else { picked[i] = [opt]; other[i] = '' }
}
function typed(i) {
  if (!qs.value[i].multiple && other[i].trim()) picked[i] = []
}
function send() {
  if (done.value < qs.value.length) return
  emit('answer', `Respostas (${props.form.title}):\n${qs.value.map((q, i) => `${i + 1}. ${q.question} → ${answerOf(i)}`).join('\n')}`)
}
function useRecommended() {
  qs.value.forEach((q, i) => { if (!answerOf(i) && q.recommended) picked[i] = [q.recommended] })
  send()
}
</script>

<template>
  <form class="form" :aria-label="form.title" @submit.prevent="send">
    <header>
      <strong>{{ form.title }}</strong>
      <span class="count">{{ done }}/{{ qs.length }}</span>
    </header>
    <div class="bar" aria-hidden="true"><span :style="{ transform: `scaleX(${done / qs.length})` }" /></div>

    <fieldset v-for="(q, i) in qs" :key="i" class="q" :disabled="disabled">
      <legend>{{ i + 1 }}. {{ q.question }}</legend>
      <p v-if="q.description || q.multiple" class="desc">{{ q.description || 'Pode marcar mais de uma.' }}</p>
      <label v-for="o in q.options" :key="o" class="opt">
        <input :type="q.multiple ? 'checkbox' : 'radio'" :name="`${uid}-${i}`" :checked="picked[i].includes(o)" @change="pick(i, o)" />
        <span>{{ o }}</span><small v-if="o === q.recommended">recomendado</small>
      </label>
      <label class="opt">
        <input :type="q.multiple ? 'checkbox' : 'radio'" :name="`${uid}-${i}`" :checked="!!other[i].trim()" tabindex="-1" aria-hidden="true" @change="$event.target.closest('label').querySelector('.other').focus()" />
        <input v-model="other[i]" class="other" placeholder="Outra resposta…" :aria-label="`Outra resposta: ${q.question}`" @input="typed(i)" />
      </label>
    </fieldset>

    <footer>
      <button v-if="hasRecommended" type="button" class="btn" :disabled="disabled" @click="useRecommended">Usar recomendações</button>
      <button type="submit" class="btn primary" :disabled="disabled || done < qs.length">Enviar respostas</button>
    </footer>
  </form>
</template>

<style scoped>
.form { display: flex; flex-direction: column; padding: 1.1rem 1.25rem 1rem; border: 1px solid var(--line-strong); border-radius: 12px; background: var(--surface); color: var(--text); }
header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
header strong { font: 600 15px/1.3 'Geist', system-ui, sans-serif; }
.count { padding: 0.1rem 0.45rem; border-radius: 6px; background: var(--surface-2); font: 500 11.5px/1.4 'Geist Mono', monospace; color: var(--muted); }
.bar { height: 3px; margin: 0.75rem 0 0.25rem; overflow: hidden; border-radius: 999px; background: var(--surface-2); }
.bar span { display: block; height: 100%; background: var(--text); opacity: 0.55; transform-origin: left; transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.q { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; margin: 0; padding: 1rem 0; border: 0; }
.q + .q { border-top: 1px solid var(--line); }
legend { float: left; width: 100%; margin-bottom: 0.2rem; padding: 0; font-size: 13.5px; font-weight: 600; line-height: 1.45; }
.desc { margin: 0 0 0.35rem; font-size: 12.5px; color: var(--muted); }
.opt { display: flex; align-items: center; gap: 0.6rem; min-height: 30px; font-size: 13.5px; cursor: pointer; }
.opt small { font-size: 11.5px; color: var(--muted); }
.opt input[type='radio'], .opt input[type='checkbox'] { appearance: none; box-sizing: border-box; flex: 0 0 16px; width: 16px; height: 16px; margin: 0; padding: 0; border: 1.5px solid var(--line-strong); border-radius: 50%; background: none; cursor: pointer; transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease; }
.opt input[type='checkbox'] { border-radius: 4px; }
.opt input:checked { border-color: var(--text); }
/* sem ::after (pseudo-elementos em input não são confiáveis): o ponto e o quadrado cheio vêm do fundo */
.opt input[type='radio']:checked { background: var(--text); box-shadow: inset 0 0 0 3px var(--surface); }
.opt input[type='checkbox']:checked { background: var(--text); box-shadow: inset 0 0 0 2.5px var(--surface); }
.opt:hover input:not(:checked) { border-color: var(--muted); }
.other { flex: 1; min-width: 0; height: 28px; padding: 0; border: 0; border-bottom: 1px solid transparent; border-radius: 0; box-shadow: none; background: none; font: inherit; font-size: 13.5px; color: var(--text); outline: none; }
.other::placeholder { color: var(--muted); }
.other:focus { border-bottom-color: var(--line-strong); }
footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding-top: 0.85rem; border-top: 1px solid var(--line); }
.btn { height: 32px; padding: 0 0.9rem; border: 1px solid var(--line-strong); border-radius: 6px; background: none; font-size: 13px; font-weight: 500; color: var(--text); cursor: pointer; transition: background 0.15s ease, transform 0.1s ease; }
.btn:hover:not(:disabled) { background: var(--surface-2); }
.btn.primary { border-color: var(--text); background: var(--text); color: var(--bg); }
.btn.primary:hover:not(:disabled) { opacity: 0.88; background: var(--text); }
.btn:active:not(:disabled) { transform: scale(0.98); }
.btn:disabled { opacity: 0.4; cursor: default; }
:is(.opt input, .btn):focus-visible { outline: 2px solid var(--text); outline-offset: 2px; }
</style>
