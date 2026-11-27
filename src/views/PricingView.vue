<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import '../assets/landing.css'
import SiteNav from '../components/landing/SiteNav.vue'
import SiteFooter from '../components/landing/SiteFooter.vue'
import GooeyButton from '../components/GooeyButton.vue'
import FlaticonIcon from '../components/FlaticonIcon.vue'
import PricingPlans from '../components/landing/PricingPlans.vue'
import AppFaq from '../components/landing/AppFaq.vue'
import AppCheckbox from '../components/app/AppCheckbox.vue'
import { PRICING_PLANS, COMPARISON_GROUPS, annualTotal, annualSavings, formatBRL } from '../data/plans'
import { usePricingMotion } from '../composables/usePricingMotion'
import { usePageTitle } from '../composables/usePageTitle'
import { useAuth } from '../composables/useAuth'
import { openCustomPlan } from '../utils/customPlanEntry'

const root = ref(null)
const router = useRouter()
const { user } = useAuth()
const yearly = ref(true)
const differencesOnly = ref(false)
usePricingMotion(root, yearly)
const [free, essential, business, enterprise] = PRICING_PLANS
const standardPlans = PRICING_PLANS.filter(plan => plan.month !== undefined)
const automationRatio = business.limits.automationRuns / essential.limits.automationRuns
const comparisonGroups = computed(() => COMPARISON_GROUPS.map(group => ({
  ...group,
  rows: group.rows.filter(row => !differencesOnly.value || new Set(row.values).size > 1),
})).filter(group => group.rows.length))
const comparedRows = computed(() => comparisonGroups.value.reduce((total, group) => total + group.rows.length, 0))
const destination = (plan) => {
  if (plan.id === 'enterprise') return undefined
  if (user.value) {
    return plan.month ? { path: '/checkout', query: { plano: plan.id, ciclo: yearly.value ? 'anual' : 'mensal' } } : '/inicio'
  }
  return { path: '/login', query: { modo: 'cadastro' } }
}
const enterCustomPlan = () => openCustomPlan(router)

const enterpriseSteps = [
  { icon: 'comment-alt', title: 'Conte o que sua empresa precisa', text: 'Conversamos sobre o tamanho do time, os processos e os requisitos de acesso e segurança.' },
  { icon: 'document', title: 'Receba uma proposta sob medida', text: 'O escopo, os valores e as condições são definidos com sua empresa em um contrato anual.' },
  { icon: 'users-alt', title: 'Tenha um contato dedicado', text: 'Um gerente de conta acompanha a relação com sua empresa e as necessidades da operação.' },
]
const enterpriseFeatures = [
  { icon: 'lock', title: 'SSO e auditoria', text: 'Acesso corporativo e acompanhamento das atividades.' },
  { icon: 'bolt', title: 'Automações ilimitadas', text: 'Os fluxos do seu time com mais capacidade.' },
  { icon: 'headset', title: 'Gerente de conta', text: 'Uma pessoa dedicada ao relacionamento com sua empresa.' },
  { icon: 'shield-check', title: 'SLA de 99,9%', text: 'Disponibilidade prevista no acordo de serviço.' },
]
const annualSavingsCopy = [essential, business]
  .filter(plan => annualSavings(plan) > 0)
  .map(plan => `${formatBRL(annualSavings(plan))} no ${plan.name}`)
const questions = [
  { question: 'Qual é a diferença entre pagar mensalmente e anualmente?', answer: `No mensal, o Essencial custa ${formatBRL(essential.month)} e o Business ${formatBRL(business.month)} por membro a cada mês. No anual, os valores equivalem a ${formatBRL(essential.year)} e ${formatBRL(business.year)} por membro/mês, com cobrança dos 12 meses de uma vez: ${formatBRL(annualTotal(essential))} e ${formatBRL(annualTotal(business))} por membro.${annualSavingsCopy.length ? ` No plano anual, você economiza ${annualSavingsCopy.join(' e ')} por membro.` : ''}` },
  { question: 'O que posso fazer com o plano Grátis?', answer: 'Criar tarefas e listas ilimitadas, organizar seus projetos em até 3 quadros e armazenar até 100 MB de arquivos. É uma forma de começar a organizar a rotina sem pagar uma assinatura.' },
  { question: 'Quando vale passar do Essencial para o Business?', answer: 'Quando seu time precisa acompanhar metas, visualizar resultados em painéis, controlar o tempo ou definir permissões por espaço. O Business também inclui a Novexo IA e aumenta o limite mensal de automações de 100 para 10 mil.' },
  { question: 'O que significa ter 100 vezes o limite de automações?', answer: 'O Essencial inclui 100 automações por mês, enquanto o Business inclui 10 mil. A comparação é entre os limites mensais dos dois planos. Você pode usar essa capacidade para executar mais ações recorrentes nos fluxos do time.' },
  { question: 'Como descubro o preço do Enterprise?', answer: 'O Enterprise tem uma proposta personalizada. Fale com nosso time para definir o escopo e as condições do contrato anual. Ele inclui os recursos do Business, SSO e auditoria, automações ilimitadas, gerente de conta dedicado e SLA de 99,9%.', link: '/contato?assunto=comercial', label: 'Conversar sobre minha empresa' },
]

usePageTitle('Planos e Preços')
</script>

<template>
  <div id="topo" class="lp pricing">
    <a href="#planos" class="pricing-skip">Pular para os planos</a>
    <SiteNav />
    <main ref="root" class="pricing-main">
      <h1 class="sr-only">Preços e planos do Novexo</h1>
      <PricingPlans v-model:yearly="yearly" hero />
      <a href="#comparar" class="pricing-compare-link">Compare todos os recursos<FlaticonIcon name="arrow-small-down" :size="17" /></a>

      <section class="pricing-highlights" aria-label="As diferenças em números">
        <article data-pricing-reveal><FlaticonIcon name="apps" :size="19" /><div class="pricing-highlights__value">{{ free.limits.boards }}<FlaticonIcon name="arrow-right" :size="23" /><span>Ilimitados</span></div><h2>Mais quadros para seus projetos.</h2><p>O Grátis tem até {{ free.limits.boards }} quadros. No Essencial, você cria quantos precisar para organizar o time.</p></article>
        <article data-pricing-reveal><FlaticonIcon name="bolt" :size="19" /><div class="pricing-highlights__value">{{ automationRatio }}<span>×</span></div><h2>O limite de automações.</h2><p>São 10 mil automações por mês no Business, comparadas às 100 incluídas no Essencial.</p></article>
        <article data-pricing-reveal><FlaticonIcon name="folder" :size="19" /><div class="pricing-highlights__value">{{ essential.limits.storageMB / 1000 }}<span>GB / membro</span></div><h2>Espaço para trabalhar em equipe.</h2><p>O Essencial inclui 5 GB por membro. O Grátis oferece 100 MB de armazenamento no plano.</p></article>
      </section>

      <section id="comparar" class="pricing-comparison" aria-labelledby="comparison-title">
        <div class="pricing-section-head" data-pricing-reveal>
          <h2 id="comparison-title">Veja o que muda<br>de um plano para o outro.</h2>
          <AppCheckbox v-model="differencesOnly" class="pricing-differences" label="Mostrar só as diferenças" />
        </div>
        <p class="sr-only" role="status">Comparando {{ comparedRows }} recursos entre os quatro planos.</p>
        <p id="comparison-help" class="pricing-table-hint"><FlaticonIcon name="arrows-h" :size="15" />Deslize para comparar os quatro planos.</p>
        <div class="pricing-table-wrap" tabindex="0" role="region" aria-label="Tabela comparativa de planos" aria-describedby="comparison-help" data-pricing-reveal>
          <table class="pricing-table">
            <caption class="sr-only">Recursos incluídos nos planos Grátis, Essencial, Business e Enterprise.</caption>
            <thead><tr><th scope="col">Recursos</th><th v-for="plan in PRICING_PLANS" :key="plan.id" scope="col"><span>{{ plan.name }}</span><small>{{ plan.month === undefined ? 'Sob medida' : plan.month === 0 ? 'R$ 0' : `${formatBRL(yearly ? plan.year : plan.month)} / membro / mês` }}</small></th></tr></thead>
            <tbody v-for="group in comparisonGroups" :key="group.title">
              <tr class="pricing-table__group"><th colspan="5" scope="colgroup">{{ group.title }}</th></tr>
              <tr v-for="row in group.rows" :key="row.label"><th scope="row">{{ row.label }}</th><td v-for="(value, index) in row.values" :key="index"><template v-if="typeof value === 'boolean'"><FlaticonIcon :name="value ? 'check' : 'minus'" :size="14" :class="{ 'is-excluded': !value }" /><span class="sr-only">{{ value ? 'Incluído' : 'Não incluído' }}</span></template><template v-else>{{ value }}</template></td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="pricing-details" aria-labelledby="details-title">
        <div class="pricing-section-head" data-pricing-reveal><h2 id="details-title">Cada plano, na prática.</h2></div>
        <div class="pricing-details__grid">
          <article v-for="plan in standardPlans" :id="`detalhes-${plan.id}`" :key="plan.id" class="pricing-detail" data-pricing-reveal>
            <div class="pricing-detail__label"><FlaticonIcon :name="plan.icon" :size="18" /><h3>{{ plan.name }}</h3></div>
            <h4>{{ plan.detail.title }}</h4><p>{{ plan.detail.description }}</p>
            <ul><li v-for="bullet in plan.detail.bullets" :key="bullet"><FlaticonIcon name="check" :size="11" />{{ bullet }}</li></ul>
            <GooeyButton :to="destination(plan)" variant="secondary" :aria-label="`${plan.cta}: plano ${plan.name}`">{{ plan.cta }}<FlaticonIcon name="arrow-up-right" :size="12" /></GooeyButton>
          </article>
        </div>
      </section>

      <section id="enterprise" class="pricing-enterprise" aria-labelledby="enterprise-title">
        <div class="pricing-enterprise__intro" data-pricing-reveal>
          <h2 id="enterprise-title">O Novexo no tamanho<br><em>da sua empresa.</em></h2>
          <p>{{ enterprise.detail.description }}</p>
          <GooeyButton variant="primary" size="lg" @click="enterCustomPlan">Vamos montar seu plano<FlaticonIcon name="arrow-up-right" :size="15" /></GooeyButton>
        </div>
        <div class="pricing-enterprise__features">
          <article v-for="feature in enterpriseFeatures" :key="feature.title" data-pricing-reveal>
            <h3><FlaticonIcon :name="feature.icon" :size="15" />{{ feature.title }}</h3>
            <p>{{ feature.text }}</p>
          </article>
        </div>
        <ol class="pricing-enterprise__steps">
          <li v-for="(step, index) in enterpriseSteps" :key="step.title" data-pricing-reveal>
            <span class="pricing-enterprise__step-num">{{ String(index + 1).padStart(2, '0') }}</span>
            <h3>{{ step.title }}</h3>
            <p>{{ step.text }}</p>
          </li>
        </ol>
      </section>

      <section class="pricing-faq" aria-labelledby="pricing-faq-title">
        <div class="pricing-faq__heading" data-pricing-reveal><h2 id="pricing-faq-title">Antes de escolher,<br>tire suas dúvidas.</h2><RouterLink to="/contato">Fale com a gente<FlaticonIcon name="arrow-up-right" :size="13" /></RouterLink></div>
        <div class="pricing-faq__list" data-pricing-reveal><AppFaq :items="questions" /></div>
      </section>
    </main>
    <SiteFooter blend-from-black />
  </div>
</template>

<style scoped>
.pricing { --pricing-line: rgb(255 255 255 / .14); }
.pricing-main { max-width: 1400px; padding: 150px 48px 40px; margin-inline: auto; }
.pricing :is(a, button, input, summary, [tabindex]):focus-visible { outline: 2px solid var(--lp-orange-soft); outline-offset: 5px; }
.pricing-skip { position: fixed; z-index: 100; top: 12px; left: 20px; padding: 12px 20px; background: #fff; color: #000; transform: translateY(-170%); }
.pricing-skip:focus { transform: none; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.pricing-comparison, .pricing-detail, .pricing-enterprise { scroll-margin-top: 115px; }
.pricing-main > .plans { padding: 0; scroll-margin-top: 115px; }
.pricing-compare-link { display: flex; align-items: center; justify-content: center; gap: 10px; width: fit-content; margin: 27px auto 0; color: #aca297; font-size: 12px; text-decoration: none; }
.pricing-compare-link:hover { color: var(--lp-orange-soft); }
.pricing-highlights { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 40px; margin: 90px 0 0; padding: 34px 0; border-block: 1px solid var(--pricing-line); }
.pricing-highlights article > .flaticon { color: #d9a36e; }
.pricing-highlights__value { display: flex; gap: 13px; align-items: baseline; min-height: 61px; padding-top: 20px; color: #f0e6dc; font: 500 43px/1 var(--lp-hero); letter-spacing: -.06em; font-variant-numeric: tabular-nums; }
.pricing-highlights__value > span { color: var(--lp-orange-soft); font-size: 28px; }
.pricing-highlights__value > .flaticon { align-self: center; color: #9e7955; }
.pricing-highlights h2 { margin: 18px 0 10px; font: 500 15px/1.4 var(--lp-sans); color: #e7ddd3; letter-spacing: -.01em; }
.pricing-highlights p { max-width: 38ch; margin: 0; color: #9d958c; font-size: 13.5px; line-height: 1.7; }
.pricing-comparison, .pricing-details { margin-top: 95px; }
.pricing-section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 30px; margin-bottom: 32px; }
.pricing-section-head h2 { margin: 0; color: #f0e9e1; font: 500 clamp(30px, 3.5vw, 44px)/1.1 var(--lp-hero); letter-spacing: -.055em; }
.pricing-differences { flex-shrink: 0; padding-bottom: 4px; color: #c5b9ab; font-size: 12px; }
.pricing-table-hint { display: none; align-items: center; gap: 7px; color: #a59a8e; font-size: 11px; }
.pricing-table-wrap { position: relative; overflow-x: auto; border: 1px solid var(--pricing-line); border-radius: 12px; scrollbar-color: #7e5635 #15110e; }
.pricing-table { width: 100%; min-width: 780px; border-spacing: 0; table-layout: fixed; }
.pricing-table th, .pricing-table td { text-align: center; padding: 17px 13px; border-bottom: 1px solid #ffffff0e; color: #bdb1a4; font-size: 11px; font-weight: 400; }
.pricing-table tr > :first-child { width: 27%; text-align: left; padding-left: 24px; }
.pricing-table thead th { padding-block: 27px; background: #12100e; color: #f0e6dc; }
.pricing-table thead th > span { display: block; font-size: 15px; font-weight: 500; letter-spacing: -.03em; }
.pricing-table thead small { display: block; margin-top: 9px; color: #9e9285; font-size: 11px; font-variant-numeric: tabular-nums; }
.pricing-table tr:not(.pricing-table__group) > :nth-child(4) { background: #e565150b; }
.pricing-table thead tr > :nth-child(4) { color: var(--lp-orange-soft); }
.pricing-table__group th { padding-block: 15px; background: #ffffff05; color: #e0c09e; font-size: 11px; font-weight: 500; }
.pricing-table td .flaticon { color: var(--lp-orange-soft); }
.pricing-table td .is-excluded { color: #5a5046; }
.pricing-table tbody:last-child tr:last-child > * { border-bottom: 0; }
.pricing-details__grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 30px; }
.pricing-detail { display: flex; flex-direction: column; min-width: 0; padding-top: 25px; border-top: 1px solid var(--pricing-line); }
.pricing-detail__label { display: flex; align-items: center; gap: 11px; color: var(--lp-orange-soft); }
.pricing-detail h3 { margin: 0; color: #eadbcb; font: 500 14px var(--lp-sans); }
.pricing-detail h4 { margin: 22px 0 14px; max-width: 280px; color: #eee4d9; font: 500 23px/1.25 var(--lp-hero); letter-spacing: -.045em; }
.pricing-detail > p { margin: 0; max-width: 42ch; color: #a89c90; font-size: 13.5px; line-height: 1.7; }
.pricing-detail ul { display: flex; flex-direction: column; gap: 11px; margin: 22px 0 26px; padding: 0; list-style: none; }
.pricing-detail li { display: flex; align-items: flex-start; gap: 9px; color: #c4b6a6; font-size: 13px; line-height: 1.55; }
.pricing-detail li .flaticon { color: #d39a61; margin-top: 4px; }
.pricing-detail > .gb { margin-top: auto; }
.pricing-detail :deep(.gb__btn) { font-size: 12.5px; min-height: 39px; }
.pricing-enterprise { display: grid; grid-template-columns: minmax(0, .95fr) minmax(0, 1.05fr); gap: 56px 76px; margin-top: 108px; padding-top: 64px; border-top: 1px solid var(--pricing-line); }
.pricing-enterprise h2 { margin: 0 0 20px; color: #f5f0ea; font: 500 clamp(34px, 3.8vw, 48px)/1.06 var(--lp-hero); letter-spacing: -.06em; }
.pricing-enterprise h2 em { color: var(--lp-orange-soft); font-family: var(--font-serif); font-weight: 400; letter-spacing: -.035em; }
.pricing-enterprise__intro > p { max-width: 44ch; margin: 0 0 32px; color: #a79f96; font-size: 14px; line-height: 1.75; }
.pricing-enterprise__features { align-self: start; display: grid; grid-template-columns: 1fr 1fr; gap: 32px 36px; }
.pricing-enterprise__features article { padding-top: 18px; border-top: 1px solid rgb(255 255 255 / 0.1); }
.pricing-enterprise__features h3 { display: flex; align-items: center; gap: 9px; margin: 0 0 8px; color: #eee8e0; font: 500 14.5px/1.35 var(--lp-sans); letter-spacing: -.01em; }
.pricing-enterprise__features h3 .flaticon { color: var(--lp-orange-soft); }
.pricing-enterprise__features p { margin: 0; color: #9c948b; font-size: 13.5px; line-height: 1.65; }
.pricing-enterprise__steps { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 36px; padding: 36px 0 0; margin: 0; border-top: 1px solid rgb(255 255 255 / 0.1); list-style: none; }
.pricing-enterprise__step-num { display: block; margin-bottom: 14px; color: var(--lp-orange-soft); font: 500 11px/1 var(--font-mono); font-variant-numeric: tabular-nums; }
.pricing-enterprise__steps h3 { color: #eee8e0; font: 500 14.5px/1.4 var(--lp-sans); letter-spacing: -.01em; margin: 0 0 8px; }
.pricing-enterprise__steps p { margin: 0; max-width: 36ch; color: #9c948b; font-size: 13px; line-height: 1.7; }
.pricing-faq { display: grid; grid-template-columns: .8fr 1.2fr; gap: 70px; margin-top: 100px; padding-top: 45px; border-top: 1px solid var(--pricing-line); }
.pricing-faq h2 { margin: 0 0 23px; color: #e9dfd5; font: 500 clamp(30px, 3.2vw, 40px)/1.1 var(--lp-hero); letter-spacing: -.055em; }
.pricing-faq__heading > a { display: inline-flex; align-items: center; gap: 9px; color: var(--lp-orange-soft); font-size: 12px; text-decoration: none; }
@media (max-width: 1150px) {
  .pricing-main { padding-inline: 30px; }
  .pricing-enterprise { gap: 40px 44px; }
}
@media (max-width: 1000px) {
  .pricing-main { padding-top: 125px; }
  .pricing-highlights { gap: 25px; margin-top: 65px; }
  .pricing-highlights__value { font-size: 37px; gap: 9px; }
  .pricing-highlights__value > span { font-size: 24px; }
  .pricing-details__grid { gap: 23px; }
  .pricing-enterprise { gap: 35px; }
}
@media (max-width: 800px) {
  .pricing-table-hint { display: flex; }
  .pricing-table tr:not(.pricing-table__group) > :first-child { position: sticky; z-index: 1; left: 0; background: #0e0c0a; box-shadow: 1px 0 #ffffff14; }
  .pricing-table thead tr > :first-child { background: #17130f; }
  .pricing-section-head { align-items: flex-start; flex-direction: column; gap: 23px; }
  .pricing-details__grid { grid-template-columns: 1fr; gap: 34px; }
  .pricing-detail { display: grid; grid-template-columns: 1fr 1fr; gap: 0 30px; }
  .pricing-detail__label, .pricing-detail h4 { grid-column: 1; }
  .pricing-detail > p { grid-column: 1; }
  .pricing-detail ul { grid-column: 2; grid-row: 2 / 5; margin-top: 20px; }
  .pricing-detail > .gb { margin-top: 23px; }
  .pricing-enterprise { grid-template-columns: 1fr; }
  .pricing-enterprise__intro > p { max-width: none; }
  .pricing-enterprise__features { gap: 27px; }
  .pricing-enterprise__steps { gap: 22px; }
  .pricing-faq { grid-template-columns: 1fr; gap: 20px; }
}
@media (max-width: 600px) {
  .pricing-main { padding: 108px 20px 15px; }
  .pricing-highlights { grid-template-columns: 1fr; gap: 30px; margin-top: 55px; padding-block: 28px; }
  .pricing-highlights article { position: relative; padding-left: 38px; }
  .pricing-highlights article > .flaticon { position: absolute; top: 7px; left: 0; }
  .pricing-highlights__value { min-height: auto; padding-top: 0; font-size: 36px; }
  .pricing-highlights__value > span { font-size: 24px; }
  .pricing-highlights h2 { margin-top: 12px; }
  .pricing-highlights p { max-width: none; }
  .pricing-comparison, .pricing-details, .pricing-enterprise, .pricing-faq { margin-top: 65px; }
  .pricing-table tr > :first-child { width: 180px; padding-left: 17px; }
  .pricing-table { min-width: 730px; }
  .pricing-table th, .pricing-table td { padding-inline: 10px; }
  .pricing-table thead th { padding-block: 23px; }
  .pricing-detail { display: flex; gap: 0; }
  .pricing-detail h4 { max-width: 290px; font-size: 25px; }
  .pricing-detail ul { margin-top: 20px; margin-bottom: 23px; }
  .pricing-detail > .gb { margin-top: 0; }
  .pricing-enterprise { padding-top: 44px; gap: 36px; }
  .pricing-enterprise h2 { font-size: 35px; }
  .pricing-enterprise__features { grid-template-columns: 1fr; gap: 22px; }
  .pricing-enterprise__steps { grid-template-columns: 1fr; gap: 26px; padding-top: 28px; }
  .pricing-enterprise__step-num { margin-bottom: 10px; }
  .pricing-enterprise__steps h3 { margin-bottom: 6px; }
  .pricing-enterprise__intro :deep(.gb__btn) { padding-inline: 19px; font-size: 13px; }
  .pricing-faq { padding-top: 30px; }
}
@media (max-width: 360px) {
  .pricing-main { padding-inline: 16px; }
  .pricing-enterprise h2 { font-size: 31px; }
}
@media (prefers-reduced-motion: reduce) { .pricing *, .pricing *::before, .pricing *::after { transition: none !important; } }
</style>
