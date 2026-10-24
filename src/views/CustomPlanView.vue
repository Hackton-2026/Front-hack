<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import '../assets/landing.css'
import GooeyButton from '../components/GooeyButton.vue'
import FlaticonIcon from '../components/FlaticonIcon.vue'
import { formatBRL } from '../data/plans'
import {
  CUSTOM_PLAN_STEPS, CUSTOM_PLAN_QUESTIONS, CUSTOM_PLAN_RESOURCES,
  createCustomPlanAnswers, isCustomAnswerValid, getCustomPlanAnswerLabel,
  getCustomPlanPreview, normalizeCustomBudget, buildCustomPlanRequest,
} from '../data/customPlan'
import { useCustomPlanMotion } from '../composables/useCustomPlanMotion'

const root = ref(null)
const form = ref(null)
const step = ref(0)
const visited = ref(0)
const reviewing = ref(false)
const budget = ref(0)
const answers = reactive(createCustomPlanAnswers())
const errors = ref({})
const prepared = ref(false)
const currentStep = computed(() => CUSTOM_PLAN_STEPS[step.value])
const completed = computed(() => CUSTOM_PLAN_QUESTIONS.filter(question => isCustomAnswerValid(question, answers[question.id])).length)
const preview = computed(() => getCustomPlanPreview(budget.value))
const previewHighlights = computed(() => preview.value.suggested.length <= 4 ? preview.value.suggested : [...preview.value.suggested.slice(0, 2), ...preview.value.suggested.slice(-2)])
const requestText = computed(() => buildCustomPlanRequest(answers, budget.value))
const emailHref = computed(() => `mailto:contato@novexo.app?subject=${encodeURIComponent('Meu plano personalizado — Novexo')}&body=${encodeURIComponent(requestText.value)}`)
useCustomPlanMotion(root, step, reviewing)

watch([answers, budget], () => { prepared.value = false }, { deep: true })

let focusFrame = 0
let downloadUrl
let previousTitle

function setBudget(event) {
  const value = normalizeCustomBudget(event.target.value)
  budget.value = value
  event.target.value = String(value)
}

function clearError(question) {
  if (isCustomAnswerValid(question, answers[question.id])) delete errors.value[question.id]
}

async function focusForm(question) {
  await nextTick()
  cancelAnimationFrame(focusFrame)
  focusFrame = requestAnimationFrame(() => {
    const target = question?.type === 'choices'
      ? document.getElementById('custom-priority-automation')
      : question ? document.getElementById(`custom-${question.id}`) : document.getElementById('custom-form-title')
    target?.focus({ preventScroll: true })
    const top = (question ? document.getElementById(`question-${question.id}`) : form.value)?.getBoundingClientRect().top
    if (top < 30 || top > window.innerHeight - 150) {
      (question ? document.getElementById(`question-${question.id}`) : form.value)?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    }
  })
}

function goToStep(index) {
  if (index > visited.value) return
  step.value = index
  reviewing.value = false
  errors.value = {}
  focusForm()
}

function submitStep() {
  const questions = step.value === CUSTOM_PLAN_STEPS.length - 1 ? CUSTOM_PLAN_QUESTIONS : currentStep.value.questions
  const invalid = questions.filter(question => !isCustomAnswerValid(question, answers[question.id]))
  errors.value = Object.fromEntries(invalid.map(question => [question.id, question.type === 'choices'
    ? 'Escolha pelo menos um recurso.' : question.type === 'email' ? 'Digite um e-mail válido.'
      : question.type === 'number' ? 'Informe um número inteiro de 1 a 1.000.' : 'Preencha esta resposta para continuar.']))
  if (invalid.length) {
    step.value = CUSTOM_PLAN_STEPS.findIndex(item => item.questions.some(question => question.id === invalid[0].id))
    focusForm(invalid[0])
    return
  }
  if (step.value < CUSTOM_PLAN_STEPS.length - 1) {
    step.value++
    visited.value = Math.max(visited.value, step.value)
  } else {
    reviewing.value = true
  }
  focusForm()
}

function downloadRequest() {
  if (downloadUrl) URL.revokeObjectURL(downloadUrl)
  downloadUrl = URL.createObjectURL(new Blob([requestText.value], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = 'novexo-plano-personalizado.txt'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

onMounted(() => { previousTitle = document.title; document.title = 'Monte seu plano personalizado | Novexo' })
onUnmounted(() => {
  document.title = previousTitle
  cancelAnimationFrame(focusFrame)
  if (downloadUrl) URL.revokeObjectURL(downloadUrl)
})
</script>

<template>
  <div class="lp custom-plan">
    <a href="#custom-form" class="custom-skip">Pular para as perguntas</a>
    <header class="custom-nav"><RouterLink to="/" class="custom-logo" aria-label="Novexo, início">NOVEXO</RouterLink><RouterLink to="/precos"><FlaticonIcon name="arrow-left" :size="14" />Voltar aos planos</RouterLink></header>
    <main ref="root" class="custom-main">
      <header class="custom-heading"><h1>Monte o plano<br><span>da sua empresa.</span></h1></header>
      <div class="custom-layout">
        <form id="custom-form" ref="form" class="custom-form" novalidate @submit.prevent="submitStep">
          <nav class="custom-steps" aria-label="Etapas do formulário"><button v-for="(item, index) in CUSTOM_PLAN_STEPS" :key="item.title" type="button" :disabled="index > visited" :aria-current="step === index && !reviewing ? 'step' : undefined" @click="goToStep(index)"><span><FlaticonIcon v-if="index < step || reviewing" name="check" :size="13" /><template v-else>{{ index + 1 }}</template></span><span>{{ item.title }}</span></button></nav>
          <div class="custom-progress"><span>{{ completed }} de {{ CUSTOM_PLAN_QUESTIONS.length }} respostas</span><span v-if="reviewing">Revisão</span><span v-else>Etapa {{ step + 1 }} de 3</span></div>
          <div class="custom-progress__track" aria-hidden="true"><span :style="{ transform: `scaleX(${completed / CUSTOM_PLAN_QUESTIONS.length})` }" /></div>
          <div class="custom-form__heading"><h2 id="custom-form-title" tabindex="-1">{{ reviewing ? 'Tudo certo com seu pedido?' : currentStep.title }}</h2><p>{{ reviewing ? 'Confira as respostas e o orçamento antes de preparar a mensagem.' : currentStep.intro }}</p></div>
          <p class="sr-only" role="status">{{ reviewing ? 'Revise sua solicitação.' : `Etapa ${step + 1}: ${currentStep.title}.` }}</p>

          <dl v-if="reviewing" class="custom-review">
            <div class="custom-review__budget"><dt>Orçamento total mensal da empresa</dt><dd>{{ formatBRL(budget) }}<span> / mês</span></dd><p>{{ preview.band?.title || 'Sem faixa sugerida neste orçamento.' }}</p></div>
            <div v-for="question in CUSTOM_PLAN_QUESTIONS" :key="question.id" class="custom-review__row"><dt>{{ question.number }}. {{ question.label }}</dt><dd>{{ getCustomPlanAnswerLabel(question, answers[question.id]) }}</dd></div>
          </dl>
          <div v-else class="custom-fields">
            <div v-for="question in currentStep.questions" :id="`question-${question.id}`" :key="question.id" class="custom-question" :class="{ 'custom-question--full': ['textarea', 'choices'].includes(question.type) }">
              <fieldset v-if="question.type === 'choices'" :aria-describedby="errors[question.id] ? `error-${question.id}` : 'custom-priority-hint'" :aria-invalid="!!errors[question.id]">
                <legend>{{ question.label }}</legend>
                <p id="custom-priority-hint" class="custom-field-hint">{{ question.hint }}</p>
                <div class="custom-priorities"><label v-for="resource in CUSTOM_PLAN_RESOURCES" :key="resource.id" :class="{ 'is-selected': answers.priorities.includes(resource.id) }"><input :id="`custom-priority-${resource.id}`" v-model="answers.priorities" type="checkbox" :value="resource.id" @change="clearError(question)" /><FlaticonIcon :name="resource.icon" :size="14" /><span>{{ resource.name }}</span></label></div>
              </fieldset>
              <template v-else>
                <label :for="`custom-${question.id}`">{{ question.label }}</label>
                <div v-if="question.type === 'select'" class="custom-select"><select :id="`custom-${question.id}`" v-model="answers[question.id]" :name="question.id" required :aria-invalid="!!errors[question.id]" :aria-describedby="errors[question.id] ? `error-${question.id}` : undefined" @change="clearError(question)"><option disabled value="">Selecione uma opção</option><option v-for="option in question.options" :key="option">{{ option }}</option></select><FlaticonIcon name="angle-small-down" :size="18" /></div>
                <textarea v-else-if="question.type === 'textarea'" :id="`custom-${question.id}`" v-model.trim="answers[question.id]" :name="question.id" :placeholder="question.placeholder" :maxlength="question.max" rows="4" required :aria-invalid="!!errors[question.id]" :aria-describedby="errors[question.id] ? `error-${question.id}` : undefined" @input="clearError(question)" />
                <input v-else :id="`custom-${question.id}`" v-model.trim="answers[question.id]" :name="question.id" :type="question.type" :autocomplete="question.autocomplete" :placeholder="question.placeholder" :min="question.type === 'number' ? question.min : undefined" :max="question.type === 'number' ? question.max : undefined" :maxlength="question.type === 'number' ? undefined : question.max" :step="question.type === 'number' ? 1 : undefined" required :aria-invalid="!!errors[question.id]" :aria-describedby="errors[question.id] ? `error-${question.id}` : undefined" @input="clearError(question)" />
              </template>
              <p v-if="errors[question.id]" :id="`error-${question.id}`" class="custom-error" role="alert">{{ errors[question.id] }}</p>
            </div>
          </div>

          <div v-if="reviewing" class="custom-review__actions"><GooeyButton :href="emailHref" variant="primary" @click="prepared = true">Continuar por e-mail<FlaticonIcon name="arrow-up-right" :size="14" /></GooeyButton><button type="button" class="custom-text-button" @click="downloadRequest"><FlaticonIcon name="download" :size="14" />Baixar solicitação</button><p>O aplicativo de e-mail abre com suas respostas. Revise a mensagem e envie para nosso time.</p><p v-if="prepared" role="status" class="custom-feedback">Se o aplicativo não abriu, baixe a solicitação e envie para <a href="mailto:contato@novexo.app">contato@novexo.app</a>.</p><button type="button" class="custom-text-button" @click="goToStep(0)"><FlaticonIcon name="pencil" :size="13" />Editar respostas</button></div>
          <div v-else class="custom-form__actions"><button v-if="step > 0" type="button" class="custom-text-button" @click="goToStep(step - 1)"><FlaticonIcon name="arrow-left" :size="13" />Voltar</button><span v-else class="custom-form__required">Todas as perguntas são obrigatórias.</span><GooeyButton type="submit" variant="primary">{{ step === 2 ? 'Revisar solicitação' : 'Continuar' }}<FlaticonIcon name="arrow-right" :size="14" /></GooeyButton></div>
        </form>

        <aside class="custom-sidebar" aria-labelledby="custom-budget-title">
          <section class="custom-budget" :style="{ '--budget-progress': `${budget / 5}%` }">
            <div class="custom-budget__head"><FlaticonIcon name="settings-sliders" framed :size="20" /><h2 id="custom-budget-title">Seu orçamento mensal</h2></div>
            <p>Total por mês para a empresa.</p>
            <div class="custom-budget__amount"><output for="custom-budget-range">{{ formatBRL(budget) }}</output><span>/ mês</span></div>
            <label class="sr-only" for="custom-budget-range">Orçamento mensal da empresa, de zero a quinhentos reais</label>
            <input id="custom-budget-range" class="custom-range" type="range" min="0" max="500" step="1" :value="budget" :aria-valuetext="`${formatBRL(budget)} por mês para a empresa`" aria-describedby="custom-budget-help" @input="setBudget" />
            <div class="custom-budget__scale" aria-hidden="true"><span>R$ 0</span><span>R$ 250</span><span>R$ 500</span></div>
            <label class="custom-exact" for="custom-budget-exact"><span>Ou digite um valor</span><span><span aria-hidden="true">R$</span><input id="custom-budget-exact" type="number" min="0" max="500" step="1" inputmode="numeric" :value="budget" @input="setBudget" /></span></label>
            <p id="custom-budget-help" class="custom-budget__hint">Arraste a bolinha. A prévia aparece a partir de R$ 100.</p>
          </section>

          <Transition name="custom-preview">
            <section v-if="preview.band" class="custom-preview" aria-labelledby="custom-preview-title">
              <div class="custom-preview__heading"><span>Para {{ formatBRL(budget) }} / mês</span><h2 id="custom-preview-title">{{ preview.band.title }}</h2></div>
              <p>{{ preview.band.description }}</p>
              <ul class="custom-preview__features"><li><FlaticonIcon name="check" :size="11" />Base de colaboração do Novexo</li><li v-for="resource in previewHighlights" :key="resource.id"><FlaticonIcon name="check" :size="11" />{{ resource.name }}</li></ul>
              <details class="custom-chart" open><summary>Como o escopo evolui<FlaticonIcon name="angle-small-down" :size="17" /></summary><p>As barras ilustram a configuração sugerida. Os itens marcados são suas prioridades.</p><div v-for="resource in preview.resources" :key="resource.id" class="custom-resource" :class="{ 'is-priority': answers.priorities.includes(resource.id) }"><div><span><FlaticonIcon :name="resource.icon" :size="12" />{{ resource.name }}</span><span v-if="answers.priorities.includes(resource.id)" class="custom-resource__priority">Prioridade</span><span v-else-if="!resource.included" class="custom-resource__threshold">R$ {{ resource.from }}+</span></div><div class="custom-resource__track" role="progressbar" :aria-label="`Escopo sugerido para ${resource.name}`" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="resource.level" :aria-valuetext="resource.included ? 'Considerado nesta faixa de orçamento' : `Considerado a partir de R$ ${resource.from}`"><span :style="{ transform: `scaleX(${resource.level / 100})` }" /></div></div></details>
              <p class="custom-preview__note">Simulação de escopo. Valores, capacidade por equipe e condições são confirmados na proposta comercial.</p>
            </section>
          </Transition>
        </aside>
      </div>
    </main>
  </div>
</template>

<style scoped>
.custom-plan { min-height: 100svh; --custom-line: #ffffff24; }
.custom-nav, .custom-main { max-width: 1320px; margin-inline: auto; padding-inline: 48px; }
.custom-main { padding-bottom: 48px; }
.custom-nav { display: flex; align-items: center; justify-content: space-between; gap: 25px; padding-block: 28px; }
.custom-logo { color: #f8f8f8; font: 800 25px/1 var(--lp-display); letter-spacing: -.04em; text-decoration: none; }
.custom-nav > a:last-child { display: inline-flex; align-items: center; gap: 9px; color: #b2a69a; font-size: 12px; text-decoration: none; }
.custom-nav > a:hover { color: var(--lp-orange-soft); }
.custom-plan :is(a, button, input, textarea, select, summary):focus-visible { outline: 2px solid var(--lp-orange-soft); outline-offset: 5px; }
.custom-skip { position: fixed; z-index: 100; top: 12px; left: 20px; padding: 12px 20px; background: #fff; color: #000; transform: translateY(-170%); }
.custom-skip:focus { transform: none; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.custom-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 35px; padding: 49px 0 42px; }
.custom-heading h1 { margin: 0; color: #f5eee6; font: 600 clamp(42px, 4.7vw, 63px)/1.06 var(--lp-hero); letter-spacing: -.065em; }
.custom-heading h1 > span { color: var(--lp-orange-soft); }
.custom-layout { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, .8fr); gap: 28px; align-items: start; }
.custom-form, .custom-budget { position: relative; min-width: 0; padding: 30px; border: 1px solid var(--custom-line); border-radius: 14px; background: #0e0c0a; }
.custom-form, .custom-question { scroll-margin-top: 25px; }
.custom-steps { display: flex; justify-content: space-between; gap: 13px; }
.custom-steps button { display: flex; flex-direction: column; align-items: flex-start; gap: 11px; padding: 0; border: 0; background: none; color: #b9a997; font: 400 11px/1.4 var(--lp-sans); cursor: pointer; }
.custom-steps button > span:first-child { display: grid; place-items: center; width: 31px; height: 31px; border: 1px solid #8a735647; border-radius: 50%; color: #b29471; font-size: 11px; }
.custom-steps button[aria-current='step'] { color: #f5dec7; }
.custom-steps button[aria-current='step'] > span:first-child { background: var(--lp-orange-soft); color: #211205; border-color: var(--lp-orange-soft); }
.custom-steps button:disabled { opacity: .55; cursor: default; }
.custom-progress { display: flex; justify-content: space-between; gap: 16px; margin-top: 27px; color: #998b7c; font-size: 11px; line-height: 1.5; }
.custom-progress__track { height: 2px; margin-top: 10px; background: #ffffff12; overflow: hidden; }
.custom-progress__track > span { display: block; height: 100%; width: 100%; transform-origin: left; background: #fba45c; transition: transform .35s ease; }
.custom-form__heading { margin-block: 30px; }
.custom-form__heading h2 { color: #f1e7dc; font: 500 27px/1.2 var(--lp-hero); letter-spacing: -.05em; margin: 0 0 10px; }
.custom-form__heading h2:focus { outline: none; }
.custom-form__heading > p { margin: 0; color: #a59687; font-size: 12px; line-height: 1.7; }
.custom-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 25px 18px; }
.custom-question { min-width: 0; }
.custom-question--full { grid-column: 1 / -1; }
.custom-question label:not(.custom-priorities label), .custom-question legend { display: flex; align-items: baseline; gap: 7px; margin-bottom: 10px; color: #d4c5b5; font-size: 11px; line-height: 1.6; }
.custom-question :is(input:not([type='checkbox']), textarea, select), .custom-exact input { display: block; width: 100%; min-width: 0; min-height: 45px; padding: 12px; border: 1px solid #ffffff24; border-radius: 7px; background: #ffffff03; color: #f2e9e0; caret-color: var(--lp-orange-soft); font: 400 12px/1.5 var(--lp-sans); color-scheme: dark; transition: border-color .2s; }
.custom-question :is(input, textarea)::placeholder { color: #8d8276; opacity: 1; }
.custom-question :is(input, textarea, select):focus-visible, .custom-exact input:focus-visible { outline: none; border-color: #fba45c99; box-shadow: 0 0 0 2px #fba45c12; }
.custom-question :is(input, textarea, select)[aria-invalid='true'] { border-color: #fba45c99; }
.custom-question :is(input, textarea):is(:autofill, :-webkit-autofill) { -webkit-text-fill-color: #f2e9e0; box-shadow: inset 0 0 0 1000px #17120e; }
.custom-question textarea { resize: vertical; min-height: 110px; max-height: 240px; }
.custom-select { position: relative; }
.custom-select select { appearance: none; padding-right: 32px; }
.custom-select > .flaticon { position: absolute; right: 10px; top: 14px; pointer-events: none; color: #a18c76; }
.custom-select option { background: #17120e; color: #f2e9e0; }
.custom-select option:disabled { color: #948574; }
.custom-select option:checked { background: #3b2414; color: #fba45c; }
.custom-question fieldset { min-width: 0; margin: 0; padding: 0; border: 0; }
.custom-question legend { padding: 0; }
.custom-field-hint { margin: -4px 0 13px; color: #978877; font-size: 11px; }
.custom-priorities { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.custom-priorities label { display: flex; align-items: center; gap: 8px; padding: 12px 9px; border: 1px solid #ffffff1f; border-radius: 7px; color: #bdac9a; font-size: 11px; cursor: pointer; transition: border-color .2s, background .2s; }
.custom-priorities label.is-selected { background: #e5651512; border-color: #fba45c66; color: #f0d2b3; }
.custom-priorities input { width: 13px; height: 13px; margin: 0; accent-color: var(--lp-orange-soft); flex-shrink: 0; }
.custom-priorities .flaticon { color: #c4935f; }
.custom-error { margin: 9px 0 0; color: #fba45c; font-size: 11px; line-height: 1.6; }
.custom-form__actions { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-top: 32px; padding-top: 25px; border-top: 1px solid var(--custom-line); }
.custom-form__actions :deep(.gb__btn), .custom-review__actions :deep(.gb__btn) { font-size: 13px; min-height: 44px; }
.custom-form__required { max-width: 150px; color: #8e7e6d; font-size: 11px; line-height: 1.7; }
.custom-text-button { display: inline-flex; align-items: center; justify-content: flex-start; gap: 8px; width: fit-content; padding: 6px 0; border: 0; background: none; color: #d5ba9c; font: 400 11px/1.5 var(--lp-sans); cursor: pointer; }
.custom-text-button:hover { color: var(--lp-orange-soft); }
.custom-sidebar { position: sticky; top: 25px; min-width: 0; }
.custom-budget { padding: 26px; background: #16100b; border-color: #fba45c40; }
.custom-budget__head { display: flex; align-items: center; gap: 13px; }
.custom-budget h2 { margin: 0; color: #eedbc8; font: 500 18px/1.3 var(--lp-hero); letter-spacing: -.04em; }
.custom-budget > p { margin: 17px 0 0; color: #a79582; font-size: 11px; line-height: 1.7; }
.custom-budget__amount { display: flex; align-items: baseline; gap: 8px; margin-top: 14px; color: #f3e5d7; }
.custom-budget__amount output { font: 550 46px/1.15 var(--lp-hero); letter-spacing: -.065em; font-variant-numeric: tabular-nums; }
.custom-budget__amount > span { color: #a78f76; font-size: 12px; }
.custom-range { display: block; appearance: none; width: 100%; height: 28px; padding: 0; margin: 25px 0 0; border: 0; background: none; cursor: pointer; touch-action: pan-y; }
.custom-plan .custom-range:focus-visible { outline: none; }
.custom-range::-webkit-slider-runnable-track { height: 6px; border-radius: 999px; background: linear-gradient(to right, #fba45c 0 var(--budget-progress), #493421 var(--budget-progress) 100%); }
.custom-range::-webkit-slider-thumb { appearance: none; width: 22px; height: 22px; margin-top: -8px; border: 4px solid #fba45c; border-radius: 50%; background: #201209; }
.custom-range::-moz-range-track { height: 6px; border-radius: 999px; background: #493421; }
.custom-range::-moz-range-progress { height: 6px; border-radius: 999px; background: #fba45c; }
.custom-range::-moz-range-thumb { width: 14px; height: 14px; border: 4px solid #fba45c; border-radius: 50%; background: #201209; }
.custom-range:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 6px #fba45c44; }
.custom-range:focus-visible::-moz-range-thumb { box-shadow: 0 0 0 6px #fba45c44; }
.custom-budget__scale { display: flex; justify-content: space-between; color: #9b8269; font-size: 11px; line-height: 1.5; }
.custom-exact { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-top: 23px; }
.custom-exact > span:first-child { color: #b7a18b; font-size: 11px; }
.custom-exact > span:last-child { display: flex; align-items: center; gap: 7px; color: #d4b18e; font-size: 12px; }
.custom-exact input { max-width: 78px; min-height: 35px; padding: 7px 9px; font-size: 12px; }
.custom-budget > .custom-budget__hint { padding-top: 19px; border-top: 1px solid #b88e602b; color: #bca184; font-size: 11px; }
.custom-preview { position: relative; margin-top: 16px; padding: 25px; border: 1px solid #fba45c40; border-radius: 12px; background: #14100c; }
.custom-preview::before { content: ''; position: absolute; top: -6px; left: 33px; width: 10px; height: 10px; border: solid #fba45c40; border-width: 1px 0 0 1px; background: #14100c; transform: rotate(45deg); }
.custom-preview__heading { display: grid; gap: 12px; }
.custom-preview__heading > span { color: var(--lp-orange-soft); font-size: 11px; line-height: 1.5; }
.custom-preview h2 { color: #f0dfcc; font: 500 24px/1.15 var(--lp-hero); letter-spacing: -.045em; margin: 0; }
.custom-preview > p { color: #b09b85; font-size: 11px; line-height: 1.85; margin: 15px 0; }
.custom-preview__features { display: flex; flex-direction: column; gap: 10px; list-style: none; padding: 0; margin: 20px 0; }
.custom-preview__features li { display: flex; align-items: center; gap: 9px; color: #d5bea4; font-size: 11px; }
.custom-preview__features .flaticon { color: var(--lp-orange-soft); }
.custom-chart { border-top: 1px solid #e6ad6626; padding-top: 16px; }
.custom-chart summary { display: flex; align-items: center; justify-content: space-between; gap: 15px; list-style: none; color: #dcc4a8; font-size: 11px; cursor: pointer; }
.custom-chart summary::-webkit-details-marker { display: none; }
.custom-chart[open] summary > .flaticon { transform: rotate(180deg); }
.custom-chart > p { color: #96816b; font-size: 11px; line-height: 1.8; margin-block: 13px 20px; }
.custom-resource + .custom-resource { margin-top: 16px; }
.custom-resource > div:first-child { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 8px; }
.custom-resource > div:first-child > span:first-child { display: inline-flex; gap: 8px; align-items: center; color: #b7a28c; font-size: 11px; }
.custom-resource .flaticon { color: #a97b4a; }
.custom-resource__priority { color: var(--lp-orange-soft); font-size: 11px; }
.custom-resource__threshold { color: #85715c; font-size: 11px; }
.custom-resource__track { overflow: hidden; height: 5px; border-radius: 999px; background: #ffffff0b; }
.custom-resource__track > span { display: block; width: 100%; height: 100%; background: #fba45c; transform-origin: left; transition: transform .4s cubic-bezier(.16, 1, .3, 1); }
.custom-resource.is-priority .custom-resource__track { background: #fba45c19; }
.custom-preview > .custom-preview__note { border-top: 1px solid #e6ad6626; margin: 21px 0 0; padding-top: 15px; color: #9b8872; font-size: 11px; }
.custom-review { margin: 0; }
.custom-review__budget { margin-bottom: 25px; padding: 20px; border: 1px solid #fba45c40; border-radius: 9px; background: #e565150a; }
.custom-review__budget dt { color: #baa38a; font-size: 11px; }
.custom-review__budget dd { margin: 10px 0; color: #f0cfad; font: 500 32px/1 var(--lp-hero); letter-spacing: -.04em; }
.custom-review__budget dd > span { color: #b2916e; font-size: 13px; }
.custom-review__budget p { margin: 0; color: #bba184; font-size: 11px; }
.custom-review__row { padding: 16px 0; border-bottom: 1px solid var(--custom-line); }
.custom-review__row dt { color: #988571; font-size: 11px; line-height: 1.8; }
.custom-review__row dd { margin: 6px 0 0; color: #e1d0bd; font-size: 12px; line-height: 1.8; white-space: pre-wrap; overflow-wrap: anywhere; }
.custom-review__actions { display: flex; flex-wrap: wrap; align-items: center; gap: 15px; margin-top: 27px; }
.custom-review__actions > p { width: 100%; margin: 0; color: #a18c75; font-size: 11px; line-height: 1.8; }
.custom-review__actions a { color: var(--lp-orange-soft); }
.custom-preview-enter-active, .custom-preview-leave-active { transition: opacity .25s ease, transform .25s ease; }
.custom-preview-enter-from, .custom-preview-leave-to { opacity: 0; transform: translateY(-8px); }
@media (max-width: 1100px) {
  .custom-nav, .custom-main { padding-inline: 30px; }
  .custom-layout { gap: 20px; grid-template-columns: minmax(0, 1.1fr) minmax(0, .9fr); }
  .custom-form { padding: 25px; }
  .custom-budget, .custom-preview { padding: 23px; }
  .custom-fields { grid-template-columns: 1fr; gap: 22px; }
}
@media (max-width: 760px) {
  .custom-nav, .custom-main { padding-inline: 20px; }
  .custom-nav { padding-block: 22px; }
  .custom-logo { font-size: 22px; }
  .custom-nav > a:last-child { font-size: 11px; }
  .custom-heading { display: block; padding: 35px 0 30px; }
  .custom-heading h1 { font-size: clamp(40px, 8vw, 58px); }
  .custom-layout { display: flex; flex-direction: column; gap: 23px; }
  .custom-form, .custom-sidebar { width: 100%; }
  .custom-sidebar { position: static; order: -1; }
  .custom-budget { padding: 23px; }
  .custom-budget__amount output { font-size: 43px; }
  .custom-question :is(input:not([type='checkbox']), textarea, select), .custom-exact input { font-size: 16px; }
  .custom-preview { padding: 23px; }
}
@media (max-width: 400px) {
  .custom-nav, .custom-main { padding-inline: 16px; }
  .custom-form { padding: 22px 18px; }
  .custom-steps { gap: 9px; }
  .custom-form__actions { gap: 12px; }
  .custom-form__required { max-width: 110px; }
  .custom-form__actions :deep(.gb__btn) { padding-inline: 15px; font-size: 12px; }
  .custom-priorities label { gap: 6px; padding-inline: 7px; }
  .custom-priorities .flaticon { display: none; }
}
@media (prefers-reduced-motion: reduce) { .custom-plan *, .custom-plan *::before, .custom-plan *::after { transition: none !important; } }
</style>
