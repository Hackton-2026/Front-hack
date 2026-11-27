<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import '../assets/landing.css'
import SiteNav from '../components/landing/SiteNav.vue'
import SiteFooter from '../components/landing/SiteFooter.vue'
import GooeyButton from '../components/GooeyButton.vue'
import FlaticonIcon from '../components/FlaticonIcon.vue'
import AppFaq from '../components/landing/AppFaq.vue'
import AppSelect from '../components/app/AppSelect.vue'
import { useContactMotion } from '../composables/useContactMotion'

const route = useRoute()
const root = ref(null)
const tabs = [
  { id: 'suporte', label: 'Dúvidas e suporte' },
  { id: 'comercial', label: 'Para sua empresa' },
]
const teamSizeOptions = [
  '1 a 10 pessoas',
  '11 a 50 pessoas',
  '51 a 200 pessoas',
  'Mais de 200 pessoas',
]
const selected = ref(route.query.assunto === 'comercial' ? 'comercial' : 'suporte')
const commercial = computed(() => selected.value === 'comercial')
const fields = reactive({ name: '', email: '', company: '', size: '', message: '' })
const prepared = ref(false)
useContactMotion(root)

watch(() => route.query.assunto, value => { selected.value = value === 'comercial' ? 'comercial' : 'suporte' })
watch(selected, () => { prepared.value = false })
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
  const subject = commercial.value ? 'Novexo para minha empresa' : 'Dúvidas e suporte | Novexo'
  const body = [
    `Nome: ${fields.name}`, `E-mail: ${fields.email}`,
    ...(commercial.value ? [`Empresa: ${fields.company}`, `Tamanho do time: ${fields.size || 'Não informado'}`] : []),
    '', fields.message,
  ].join('\n')
  window.location.href = `mailto:contato@novexo.cloud?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
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
        <div class="contact-intro">
          <h1 id="contact-title">Fale com <br><em>a gente.</em></h1>
          <p class="contact-intro__lead">Tire dúvidas sobre o Novexo ou converse com a gente sobre o uso na sua empresa.</p>

          <div class="contact-shortcuts">
            <a class="contact-shortcut" href="mailto:contato@novexo.cloud">
              <FlaticonIcon name="envelope" :size="17" />
              <span><strong>Prefere escrever direto?</strong><span>contato@novexo.cloud</span></span>
              <FlaticonIcon name="arrow-up-right" :size="15" />
            </a>
            <RouterLink class="contact-shortcut" to="/blog/como-funciona">
              <FlaticonIcon name="book-alt" :size="17" />
              <span><strong>Está começando agora?</strong><span>Conheça o Novexo, passo a passo.</span></span>
              <FlaticonIcon name="arrow-up-right" :size="15" />
            </RouterLink>
          </div>
        </div>

        <div id="contact-form" class="contact-panel">
          <div class="contact-tabs" role="tablist" aria-label="Como podemos ajudar?">
            <span class="contact-tabs__thumb" :class="{ 'is-right': commercial }" aria-hidden="true" />
            <button v-for="(tab, index) in tabs" :id="`contact-tab-${tab.id}`" :key="tab.id"
              type="button" role="tab" :aria-selected="selected === tab.id" aria-controls="contact-tabpanel"
              :tabindex="selected === tab.id ? 0 : -1" @click="selected = tab.id" @keydown="moveTab($event, index)">
              {{ tab.label }}
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
                  <AppSelect id="contact-size" v-model="fields.size" :options="teamSizeOptions" placeholder="Selecione uma opção" size="lg" block />
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
              <p v-if="prepared" class="contact-feedback" role="status">Rascunho preparado. Se o aplicativo não abriu, escreva para <a href="mailto:contato@novexo.cloud">contato@novexo.cloud</a>.</p>
            </form>
          </div>
        </div>
      </section>

      <section class="contact-faq" aria-labelledby="contact-faq-title">
        <div class="contact-faq__heading" data-contact-reveal>
          <h2 id="contact-faq-title">Talvez sua resposta <br>esteja aqui.</h2>
        </div>
        <div class="contact-faq__list" data-contact-reveal>
          <AppFaq :items="questions" />
        </div>
      </section>
    </main>
    <SiteFooter blend-from-black />
  </div>
</template>

<style scoped>
.contact { --contact-line: rgb(255 255 255 / .14); }
.contact-main { max-width: 1320px; margin-inline: auto; padding: 166px 48px 32px; }
.contact :is(a, button, input, textarea, summary):focus-visible { outline: 2px solid var(--lp-orange-soft); outline-offset: 5px; }
.contact-skip { position: fixed; z-index: 100; top: 12px; left: 20px; padding: 12px 20px; background: #fff; color: #000; transform: translateY(-170%); }
.contact-skip:focus { transform: none; }
.contact-hero { display: grid; grid-template-columns: .9fr 1.1fr; gap: clamp(40px, 6vw, 90px); align-items: start; }
.contact-intro { padding-top: 16px; }
.contact-intro h1 { margin: 0; color: #f8f5f0; font: 600 clamp(64px, 6.9vw, 94px)/.98 var(--lp-hero); letter-spacing: -.07em; }
.contact-intro h1 em { color: var(--lp-orange-soft); font-family: var(--font-serif); font-weight: 400; letter-spacing: -.045em; }
.contact-intro__lead { max-width: 330px; margin: 28px 0 0; color: #aaa39b; font-size: 14px; line-height: 1.85; }
.contact-shortcuts { max-width: 365px; margin-top: 64px; }
.contact-shortcut { display: flex; align-items: center; gap: 14px; padding: 20px 0; border-top: 1px solid var(--contact-line); text-decoration: none; }
.contact-shortcut > .flaticon:first-child { color: #8c857d; transition: color 150ms ease; }
.contact-shortcut > span:nth-child(2) { display: grid; gap: 4px; flex: 1; min-width: 0; }
.contact-shortcut strong { font-size: 14px; color: #ece7e0; font-weight: 500; transition: color 150ms ease; }
.contact-shortcut > span:nth-child(2) > span { font-size: 13px; color: #968f87; overflow-wrap: anywhere; }
.contact-shortcut > .flaticon:last-child { color: #8c857d; transition: transform 180ms cubic-bezier(0.23, 1, 0.32, 1), color 150ms ease; }
@media (hover: hover) and (pointer: fine) {
  .contact-shortcut:hover > .flaticon:first-child { color: var(--lp-orange-soft); }
  .contact-shortcut:hover strong { color: #fff; }
  .contact-shortcut:hover > .flaticon:last-child { transform: translate(2px, -2px); color: var(--lp-orange-soft); }
}
.contact-panel { min-width: 0; padding: 28px 30px 30px; border: 1px solid rgb(255 255 255 / 0.09); border-radius: 12px; background: #0a0a09; scroll-margin-top: 100px; }
.contact-tabs { position: relative; display: grid; grid-template-columns: 1fr 1fr; padding: 4px; border: 1px solid rgb(255 255 255 / 0.08); border-radius: 9px; background: #131211; }
.contact-tabs__thumb { position: absolute; top: 4px; bottom: 4px; left: 4px; width: calc(50% - 4px); border-radius: 6px; background: #22201d; box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.06); transition: transform 200ms cubic-bezier(0.23, 1, 0.32, 1); }
.contact-tabs__thumb.is-right { transform: translateX(100%); }
.contact-tabs button { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; min-height: 36px; padding: 8px 12px; border: 0; border-radius: 6px; background: transparent; color: #948d85; font: 500 13px/1.3 var(--lp-sans); cursor: pointer; transition: color 160ms ease; }
.contact-tabs button[aria-selected='true'] { color: #f5f1ec; }
@media (hover: hover) and (pointer: fine) {
  .contact-tabs button:hover { color: #f5f1ec; }
}
.contact-panel__heading { margin: 28px 0 24px; }
.contact-panel__heading h2 { margin: 0 0 8px; color: #f1ede8; font: 500 24px/1.2 var(--lp-hero); letter-spacing: -.045em; }
.contact-panel__heading p { margin: 0; color: #9c958c; font-size: 13.5px; line-height: 1.65; }
.contact-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 18px; }
.contact-field { min-width: 0; }
.contact-field--full { grid-column: 1 / -1; }
.contact-field label { display: block; margin-bottom: 8px; color: #cdc6be; font-size: 12.5px; font-weight: 500; }
.contact-field label > span:not(.contact-field__optional) { color: var(--lp-orange-soft); margin-left: 2px; }
.contact-field__optional { color: #8c857d; font-size: 12px; font-weight: 400; }
.contact-field :is(input, textarea) { display: block; width: 100%; min-height: 44px; padding: 11px 13px; border: 1px solid rgb(255 255 255 / 0.12); border-radius: 8px; background: #111110; color: #f2ece6; caret-color: var(--lp-orange-soft); font: 400 14px/1.5 var(--lp-sans); transition: border-color 150ms ease, background-color 150ms ease; color-scheme: dark; }
.contact-field :deep(.sel) { min-height: 44px; height: 44px; border-radius: 8px; border-color: rgb(255 255 255 / 0.12); background: #111110; font-size: 14px; }
.contact-field :is(input, textarea)::placeholder { color: #7e7871; opacity: 1; }
.contact-field :is(input, textarea):focus-visible { outline: none; border-color: rgb(251 164 92 / 0.6); background: #151412; box-shadow: 0 0 0 2px rgb(251 164 92 / 0.08); }
.contact-field :is(input, textarea):is(:autofill, :-webkit-autofill) { -webkit-text-fill-color: #f2ece6; caret-color: var(--lp-orange-soft); box-shadow: inset 0 0 0 1000px #151412; }
.contact-field :is(input, textarea):is(:autofill, :-webkit-autofill):focus { border-color: rgb(251 164 92 / 0.6); box-shadow: inset 0 0 0 1000px #151412, 0 0 0 2px rgb(251 164 92 / 0.08); }
.contact-field textarea { min-height: 132px; resize: vertical; max-height: 360px; }
.contact-field textarea::-webkit-resizer { background: transparent; }
.contact-submit { display: flex; flex-direction: column; align-items: flex-start; gap: 13px; margin-top: 25px; }
.contact-submit > p { max-width: 38ch; margin: 0; color: #928b83; font-size: 12.5px; line-height: 1.65; }
.contact-feedback { margin: 18px 0 0; padding-top: 15px; border-top: 1px solid var(--contact-line); color: #d5c4b3; font-size: 12px; line-height: 1.7; }
.contact-feedback a { color: var(--lp-orange-soft); }
.contact-faq { display: grid; grid-template-columns: .9fr 1.1fr; gap: clamp(40px, 6vw, 90px); margin-top: 115px; padding-top: 55px; border-top: 1px solid var(--contact-line); }
.contact-faq h2 { margin: 0; color: #eae4dd; font: 500 clamp(30px, 3vw, 40px)/1.12 var(--lp-hero); letter-spacing: -.055em; }
@media (max-width: 1050px) {
  .contact-main { padding: 130px 30px 25px; }
  .contact-hero, .contact-faq { grid-template-columns: .85fr 1.15fr; gap: 35px; }
  .contact-panel { padding-inline: 22px; }
  .contact-intro h1 { font-size: 74px; }
  .contact-shortcut { gap: 11px; }
  .contact-shortcut strong { font-size: 13px; }
  .contact-tabs button { font-size: 12.5px; }
}
@media (max-width: 760px) {
  .contact-main { padding: 110px 20px 0; }
  .contact-hero, .contact-faq { grid-template-columns: 1fr; gap: 35px; }
  .contact-intro { padding-top: 5px; }
  .contact-intro h1 { font-size: clamp(64px, 12vw, 88px); }
  .contact-intro__lead { max-width: 360px; margin-top: 22px; font-size: 14px; }
  .contact-shortcuts { max-width: none; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 32px; }
  .contact-shortcut { align-items: flex-start; }
  .contact-shortcut > .flaticon:last-child { display: none; }
  .contact-shortcut > span:nth-child(2) > span { font-size: 12px; }
  .contact-panel { padding-inline: 24px; }
  .contact-tabs button { font-size: 12.5px; }
  .contact-field :is(input, textarea) { font-size: 16px; }
  .contact-faq { margin-top: 75px; padding-top: 35px; gap: 18px; }
}
@media (max-width: 440px) {
  .contact-shortcuts { grid-template-columns: 1fr; gap: 0; margin-top: 28px; }
  .contact-shortcut { align-items: center; padding-block: 16px; }
  .contact-shortcut > .flaticon:last-child { display: inline-flex; }
  .contact-panel { padding: 20px 18px 22px; }
  .contact-tabs button { font-size: 12px; }
  .contact-fields { grid-template-columns: 1fr; gap: 18px; }
  .contact-panel__heading h2 { font-size: 23px; }
  .contact-submit :deep(.gb) { width: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .contact :is(*, *::before, *::after) { transition: none !important; }
}
</style>
