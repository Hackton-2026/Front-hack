<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import '../assets/landing.css'
import SiteNav from '../components/landing/SiteNav.vue'
import SiteFooter from '../components/landing/SiteFooter.vue'
import GooeyButton from '../components/GooeyButton.vue'
import FlaticonIcon from '../components/FlaticonIcon.vue'
import { useContactMotion } from '../composables/useContactMotion'

const route = useRoute()
const root = ref(null)
const tabs = [
  { id: 'suporte', label: 'Dúvidas e suporte', icon: 'comment-alt' },
  { id: 'comercial', label: 'Para sua empresa', icon: 'briefcase' },
]
const selected = ref(route.query.assunto === 'comercial' ? 'comercial' : 'suporte')
const commercial = computed(() => selected.value === 'comercial')
const fields = reactive({ name: '', email: '', company: '', size: '', message: '' })
const prepared = ref(false)
const { revealFields, revealAnswer } = useContactMotion(root)

watch(() => route.query.assunto, value => { selected.value = value === 'comercial' ? 'comercial' : 'suporte' })
watch(selected, async () => { prepared.value = false; await nextTick(); revealFields() })
watch(fields, () => { prepared.value = false })

function moveTab(event, index) {
  const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
  if (!keys.includes(event.key)) return
  event.preventDefault()
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
    : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
  selected.value = tabs[next].id
  document.getElementById(`contact-tab-${tabs[next].id}`)?.focus()
}

function prepareEmail(event) {
  for (const input of event.currentTarget.querySelectorAll('[required]')) {
    if (!input.value.trim()) {
      input.value = ''
      input.reportValidity()
      return
    }
  }
  const subject = commercial.value ? 'Novexo para minha empresa' : 'Dúvidas e suporte — Novexo'
  const body = [
    `Nome: ${fields.name}`, `E-mail: ${fields.email}`,
    ...(commercial.value ? [`Empresa: ${fields.company}`, `Tamanho do time: ${fields.size || 'Não informado'}`] : []),
    '', fields.message,
  ].join('\n')
  // Não há endpoint de contato: o usuário revisa e envia pelo seu cliente de e-mail.
  window.location.href = `mailto:contato@novexo.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  prepared.value = true
}

const questions = [
  { question: 'Por onde começo a usar o Novexo?', answer: 'Comece criando sua conta. Depois, crie um projeto, adicione as primeiras tarefas e defina seus prazos. O guia Como funciona mostra esse caminho passo a passo.', link: '/blog/como-funciona', label: 'Ver como funciona' },
  { question: 'Posso usar o Novexo com meu time?', answer: 'Sim. Você pode organizar projetos em um espaço de trabalho e convidar as pessoas do seu time. Se quiser conversar sobre o uso na sua empresa, escolha “Para sua empresa” no formulário acima.' },
  { question: 'O que devo incluir em um pedido de suporte?', answer: 'Conte o que você estava tentando fazer e o que aconteceu. Informe também o navegador ou dispositivo que está usando. Esses detalhes ajudam a entender o problema. Não inclua senhas na mensagem.' },
  { question: 'Onde encontro os planos e preços?', answer: 'Na página de preços você pode comparar os recursos, conhecer cada plano e escolher uma opção para o seu momento.', link: '/precos', label: 'Conhecer os planos' },
]

let previousTitle
onMounted(() => { previousTitle = document.title; document.title = 'Contato | Novexo' })
onUnmounted(() => { document.title = previousTitle })
</script>

<template>
  <div id="topo" class="lp contact">
    <a class="contact-skip" href="#contact-form">Pular para o formulário</a>
    <SiteNav />
    <main ref="root" class="contact-main">
      <section class="contact-hero" aria-labelledby="contact-title">
        <div class="contact-glow" aria-hidden="true" />
        <div class="contact-intro">
          <h1 id="contact-title">Fale com<br><em>a gente.</em></h1>
          <p class="contact-intro__lead">Uma dúvida, uma ideia ou um projeto para o seu time. A conversa começa por aqui.</p>

          <div class="contact-shortcuts">
            <a class="contact-shortcut" href="mailto:contato@novexo.app">
              <FlaticonIcon name="envelope" framed :size="19" />
              <span><strong>Prefere escrever direto?</strong><span>contato@novexo.app</span></span>
              <FlaticonIcon name="arrow-up-right" :size="15" />
            </a>
            <RouterLink class="contact-shortcut" to="/blog/como-funciona">
              <FlaticonIcon name="book-alt" framed :size="19" />
              <span><strong>Está começando agora?</strong><span>Conheça o Novexo, passo a passo.</span></span>
              <FlaticonIcon name="arrow-up-right" :size="15" />
            </RouterLink>
          </div>
        </div>

        <div id="contact-form" class="contact-panel">
          <div class="contact-tabs" role="tablist" aria-label="Como podemos ajudar?">
            <button v-for="(tab, index) in tabs" :id="`contact-tab-${tab.id}`" :key="tab.id"
              type="button" role="tab" :aria-selected="selected === tab.id" aria-controls="contact-tabpanel"
              :tabindex="selected === tab.id ? 0 : -1" @click="selected = tab.id" @keydown="moveTab($event, index)">
              <FlaticonIcon :name="tab.icon" :size="16" />{{ tab.label }}
            </button>
          </div>

          <div id="contact-tabpanel" role="tabpanel" :aria-labelledby="`contact-tab-${selected}`">
            <div class="contact-panel__heading">
              <h2>{{ commercial ? 'Vamos conhecer seu time.' : 'Como podemos ajudar?' }}</h2>
              <p>{{ commercial ? 'Conte o que sua empresa precisa e vamos conversar.' : 'Conte um pouco sobre o que você precisa.' }}</p>
            </div>
            <form @submit.prevent="prepareEmail">
              <div class="contact-fields">
                <div class="contact-field">
                  <label for="contact-name">Seu nome <span aria-hidden="true">*</span></label>
                  <input id="contact-name" v-model.trim="fields.name" name="name" autocomplete="name" placeholder="Como podemos chamar você?" required maxlength="100" />
                </div>
                <div class="contact-field">
                  <label for="contact-email">{{ commercial ? 'E-mail de trabalho' : 'Seu e-mail' }} <span aria-hidden="true">*</span></label>
                  <input id="contact-email" v-model.trim="fields.email" name="email" type="email" autocomplete="email" placeholder="voce@exemplo.com" required maxlength="180" />
                </div>
                <div v-if="commercial" class="contact-field">
                  <label for="contact-company">Empresa <span aria-hidden="true">*</span></label>
                  <input id="contact-company" v-model.trim="fields.company" name="company" autocomplete="organization" placeholder="Nome da sua empresa" required maxlength="100" />
                </div>
                <div v-if="commercial" class="contact-field">
                  <label for="contact-size">Tamanho do time <span class="contact-field__optional">(opcional)</span></label>
                  <div class="contact-select">
                    <select id="contact-size" v-model="fields.size" name="size">
                      <option disabled value="">Selecione uma opção</option>
                      <option>1 a 10 pessoas</option><option>11 a 50 pessoas</option><option>51 a 200 pessoas</option><option>Mais de 200 pessoas</option>
                    </select>
                    <FlaticonIcon name="angle-small-down" :size="18" />
                  </div>
                </div>
                <div class="contact-field contact-field--full">
                  <label for="contact-message">{{ commercial ? 'O que você procura para seu time?' : 'Sua mensagem' }} <span aria-hidden="true">*</span></label>
                  <textarea id="contact-message" v-model.trim="fields.message" name="message" rows="5" required maxlength="1600" :placeholder="commercial ? 'Conte como seu time trabalha e o que gostaria de organizar.' : 'Descreva sua dúvida ou conte sua ideia.'" />
                </div>
              </div>
              <div class="contact-submit">
                <GooeyButton type="submit" variant="primary" size="lg">Continuar por e-mail <FlaticonIcon name="arrow-up-right" :size="15" /></GooeyButton>
                <p>Abre seu aplicativo de e-mail com a mensagem pronta para revisar e enviar.</p>
              </div>
              <p v-if="prepared" class="contact-feedback" role="status">Rascunho preparado. Se o aplicativo não abriu, escreva para <a href="mailto:contato@novexo.app">contato@novexo.app</a>.</p>
            </form>
          </div>
        </div>
      </section>

      <section class="contact-faq" aria-labelledby="contact-faq-title">
        <div class="contact-faq__heading" data-contact-reveal>
          <h2 id="contact-faq-title">Talvez sua resposta<br><span>esteja aqui.</span></h2>
        </div>
        <div class="contact-faq__list">
          <details v-for="(item, index) in questions" :key="item.question" data-contact-reveal @toggle="revealAnswer">
            <summary><span class="contact-faq__number" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span><span>{{ item.question }}</span><FlaticonIcon name="plus" :size="16" /></summary>
            <div class="contact-faq__answer"><p>{{ item.answer }}</p><RouterLink v-if="item.link" :to="item.link">{{ item.label }} <FlaticonIcon name="arrow-up-right" :size="12" /></RouterLink></div>
          </details>
        </div>
      </section>
    </main>
    <SiteFooter blend-from-black />
  </div>
</template>

<style scoped>
.contact { --contact-line: rgb(255 255 255 / .14); }
.contact-main { max-width: 1320px; margin-inline: auto; padding: 166px 48px 32px; }
.contact :is(a, button, input, textarea, select, summary):focus-visible { outline: 2px solid var(--lp-orange-soft); outline-offset: 5px; }
.contact-skip { position: fixed; z-index: 100; top: 12px; left: 20px; padding: 12px 20px; background: #fff; color: #000; transform: translateY(-170%); }
.contact-skip:focus { transform: none; }
.contact-hero { position: relative; isolation: isolate; display: grid; grid-template-columns: .9fr 1.1fr; gap: clamp(40px, 6vw, 90px); align-items: start; }
.contact-glow { position: absolute; z-index: -1; pointer-events: none; width: min(850px, 100vw); height: 820px; top: -180px; right: -210px; background: radial-gradient(ellipse at center, rgb(229 101 21 / .13), rgb(140 53 10 / .055) 40%, transparent 68%); }
.contact-intro { padding-top: 16px; }
.contact-intro h1 { margin: 0; color: #f8f5f0; font: 600 clamp(64px, 6.9vw, 94px)/.98 var(--lp-hero); letter-spacing: -.07em; }
.contact-intro h1 em { color: var(--lp-orange-soft); font-family: var(--font-serif); font-weight: 400; letter-spacing: -.045em; }
.contact-intro__lead { max-width: 330px; margin: 28px 0 0; color: #aaa39b; font-size: 14px; line-height: 1.85; }
.contact-shortcuts { max-width: 365px; margin-top: 64px; }
.contact-shortcut { display: flex; align-items: center; gap: 16px; padding: 22px 0; border-top: 1px solid var(--contact-line); text-decoration: none; }
.contact-shortcut > span:nth-child(2) { display: grid; gap: 5px; flex: 1; min-width: 0; }
.contact-shortcut strong { font-size: 13px; color: #e9e3db; font-weight: 500; }
.contact-shortcut > span:nth-child(2) > span { font-size: 12px; color: #9d968e; overflow-wrap: anywhere; }
.contact-shortcut > .flaticon:last-child { color: #a99b8c; transition: transform .25s, color .25s; }
.contact-shortcut:hover > .flaticon:last-child { transform: translate(3px, -3px); color: var(--lp-orange-soft); }
.contact-panel { min-width: 0; padding: 11px 30px 29px; border: 1px solid rgb(255 255 255 / .16); border-radius: 16px; background: linear-gradient(145deg, #19140f, #0c0c0c 42%, #0a0a0a); box-shadow: 0 24px 90px rgb(0 0 0 / .3), inset 0 1px rgb(255 255 255 / .035); scroll-margin-top: 100px; }
.contact-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; border-bottom: 1px solid var(--contact-line); }
.contact-tabs button { position: relative; display: flex; align-items: center; justify-content: center; gap: 9px; padding: 19px 0; border: 0; background: transparent; color: #9e978f; font: 500 12px/1.4 var(--lp-sans); cursor: pointer; transition: color .2s; }
.contact-tabs button::after { content: ''; position: absolute; inset: auto 0 -1px; height: 2px; background: var(--lp-orange-soft); transform: scaleX(0); transition: transform .3s ease; }
.contact-tabs button[aria-selected='true'] { color: var(--lp-orange-soft); }
.contact-tabs button[aria-selected='true']::after { transform: scaleX(1); }
.contact-tabs button:hover { color: #f8f5f0; }
.contact-panel__heading { margin: 29px 0 26px; }
.contact-panel__heading h2 { margin: 0 0 8px; color: #eee8e1; font: 500 24px/1.2 var(--lp-hero); letter-spacing: -.045em; }
.contact-panel__heading p { margin: 0; color: #9f978e; font-size: 12px; line-height: 1.7; }
.contact-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 22px 18px; }
.contact-field { min-width: 0; }
.contact-field--full { grid-column: 1 / -1; }
.contact-field label { display: block; margin-bottom: 9px; color: #d5cec5; font-size: 11px; }
.contact-field label > span:not(.contact-field__optional) { color: var(--lp-orange-soft); margin-left: 2px; }
.contact-field__optional { color: #989188; font-size: 10px; }
.contact-field :is(input, textarea, select) { display: block; width: 100%; min-height: 45px; padding: 12px 13px; border: 1px solid #ffffff26; border-radius: 7px; background: #ffffff03; color: #f2ece6; caret-color: var(--lp-orange-soft); font: 400 12px/1.5 var(--lp-sans); transition: border-color .2s, background .2s; }
.contact-field :is(input, textarea)::placeholder { color: #8f8880; opacity: 1; }
.contact-field :is(input, textarea, select):focus-visible { outline: none; border-color: #fba45c99; background: #ffffff06; box-shadow: 0 0 0 2px #fba45c12; }
.contact-field :is(input, textarea, select) { color-scheme: dark; }
.contact-field :is(input, textarea):is(:autofill, :-webkit-autofill) { -webkit-text-fill-color: #f2ece6; caret-color: var(--lp-orange-soft); box-shadow: inset 0 0 0 1000px #17120e; }
.contact-field :is(input, textarea):is(:autofill, :-webkit-autofill):focus { border-color: #fba45c99; box-shadow: inset 0 0 0 1000px #17120e, 0 0 0 2px #fba45c12; }
.contact-field textarea { min-height: 132px; resize: vertical; max-height: 360px; }
.contact-field select { appearance: none; padding-right: 32px; color-scheme: dark; }
.contact-field select option { background: #17120e; color: #f2ece6; }
.contact-field select option:disabled { color: #8f8880; }
.contact-field select option:checked { background: #3b2414; color: var(--lp-orange-soft); }
.contact-select { position: relative; }
.contact-select > .flaticon { position: absolute; right: 11px; top: 14px; pointer-events: none; color: #aaa095; }
.contact-submit { display: flex; flex-direction: column; align-items: flex-start; gap: 13px; margin-top: 25px; }
.contact-submit > p { max-width: 320px; margin: 0; color: #9c9389; font-size: 10px; line-height: 1.7; }
.contact-feedback { margin: 18px 0 0; padding-top: 15px; border-top: 1px solid var(--contact-line); color: #d5c4b3; font-size: 12px; line-height: 1.7; }
.contact-feedback a { color: var(--lp-orange-soft); }
.contact-faq { display: grid; grid-template-columns: .9fr 1.1fr; gap: clamp(40px, 6vw, 90px); margin-top: 115px; padding-top: 55px; border-top: 1px solid var(--contact-line); }
.contact-faq h2 { margin: 0; color: #eae4dd; font: 500 clamp(30px, 3vw, 40px)/1.12 var(--lp-hero); letter-spacing: -.055em; }
.contact-faq details { border-bottom: 1px solid var(--contact-line); }
.contact-faq summary { list-style: none; display: flex; gap: 18px; align-items: center; min-height: 78px; padding: 19px 0; color: #e3ddd5; font-size: 13px; line-height: 1.6; cursor: pointer; }
.contact-faq summary::-webkit-details-marker { display: none; }
.contact-faq__number { color: #8d7a66; font: 10px var(--font-mono); }
.contact-faq summary > span:nth-child(2) { flex: 1; }
.contact-faq summary > .flaticon { color: var(--lp-orange-soft); transition: transform .25s; }
.contact-faq details[open] summary > .flaticon { transform: rotate(45deg); }
.contact-faq__answer { padding: 0 28px 25px 34px; }
.contact-faq__answer p { margin: 0; color: #aaa198; font-size: 12px; line-height: 1.9; }
.contact-faq__answer a { display: inline-flex; gap: 10px; align-items: center; margin-top: 15px; color: var(--lp-orange-soft); font-size: 12px; text-decoration: none; }
.contact-faq__answer a:hover { text-decoration: underline; }
@media (max-width: 1050px) {
  .contact-main { padding: 130px 30px 25px; }
  .contact-hero, .contact-faq { grid-template-columns: .85fr 1.15fr; gap: 35px; }
  .contact-panel { padding-inline: 22px; }
  .contact-intro h1 { font-size: 74px; }
  .contact-shortcut { gap: 11px; }
  .contact-shortcut strong { font-size: 12px; }
  .contact-tabs { gap: 12px; }
  .contact-tabs button { gap: 6px; font-size: 11px; }
}
@media (max-width: 760px) {
  .contact-main { padding: 110px 20px 0; }
  .contact-hero, .contact-faq { grid-template-columns: 1fr; gap: 35px; }
  .contact-intro { padding-top: 5px; }
  .contact-intro h1 { font-size: clamp(64px, 12vw, 88px); }
  .contact-intro__lead { max-width: 360px; margin-top: 22px; font-size: 13px; }
  .contact-shortcuts { max-width: none; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 32px; }
  .contact-shortcut { align-items: flex-start; }
  .contact-shortcut > .flaticon:last-child { display: none; }
  .contact-shortcut > span:nth-child(2) > span { font-size: 11px; }
  .contact-glow { top: 180px; right: -200px; height: 700px; }
  .contact-panel { padding-inline: 25px; }
  .contact-tabs button { font-size: 12px; gap: 9px; }
  .contact-field :is(input, textarea, select) { font-size: 16px; }
  .contact-faq { margin-top: 75px; padding-top: 35px; gap: 18px; }
}
@media (max-width: 440px) {
  .contact-shortcuts { grid-template-columns: 1fr; gap: 0; margin-top: 28px; }
  .contact-shortcut { align-items: center; padding-block: 16px; }
  .contact-shortcut > .flaticon:last-child { display: inline-flex; }
  .contact-panel { padding-inline: 18px; }
  .contact-tabs button { font-size: 11px; gap: 7px; }
  .contact-fields { grid-template-columns: 1fr; gap: 18px; }
  .contact-panel__heading h2 { font-size: 23px; }
  .contact-submit :deep(.gb) { width: 100%; }
  .contact-faq summary { gap: 12px; }
  .contact-faq__answer { padding-left: 28px; }
}
@media (prefers-reduced-motion: reduce) {
  .contact :is(*, *::before, *::after) { transition: none !important; }
}
</style>
