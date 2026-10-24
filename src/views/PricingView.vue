<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import '../assets/landing.css'
import SiteNav from '../components/landing/SiteNav.vue'
import SiteFooter from '../components/landing/SiteFooter.vue'
import GooeyButton from '../components/GooeyButton.vue'
import FlaticonIcon from '../components/FlaticonIcon.vue'
import PricingPlans from '../components/landing/PricingPlans.vue'
import { PRICING_PLANS, COMPARISON_GROUPS, annualTotal, annualSavings, formatBRL } from '../data/plans'
import { usePricingMotion } from '../composables/usePricingMotion'
import { openCustomPlan } from '../utils/customPlanEntry'

const root = ref(null)
const router = useRouter()
const yearly = ref(true)
const differencesOnly = ref(false)
const { revealAnswer } = usePricingMotion(root, yearly)
const [free, essential, business, enterprise] = PRICING_PLANS
const standardPlans = PRICING_PLANS.filter(plan => plan.month !== undefined)
const automationRatio = business.limits.automationRuns / essential.limits.automationRuns
const comparisonGroups = computed(() => COMPARISON_GROUPS.map(group => ({
  ...group,
  rows: group.rows.filter(row => !differencesOnly.value || new Set(row.values).size > 1),
})).filter(group => group.rows.length))
const comparedRows = computed(() => comparisonGroups.value.reduce((total, group) => total + group.rows.length, 0))
const destination = plan => plan.id === 'enterprise' ? undefined : '/login'
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
const questions = [
  { question: 'Qual é a diferença entre pagar mensalmente e anualmente?', answer: `No mensal, o Essencial custa ${formatBRL(essential.month)} e o Business ${formatBRL(business.month)} por membro a cada mês. No anual, os valores equivalem a ${formatBRL(essential.year)} e ${formatBRL(business.year)} por membro/mês, com cobrança dos 12 meses de uma vez: ${formatBRL(annualTotal(essential))} e ${formatBRL(annualTotal(business))} por membro. A economia anual é de ${formatBRL(annualSavings(essential))} no Essencial e ${formatBRL(annualSavings(business))} no Business.` },
  { question: 'O que posso fazer com o plano Grátis?', answer: 'Criar tarefas e listas ilimitadas, organizar seus projetos em até 3 quadros e armazenar até 100 MB de arquivos. É uma forma de começar a organizar a rotina sem pagar uma assinatura.' },
  { question: 'Quando vale passar do Essencial para o Business?', answer: 'Quando seu time precisa acompanhar metas, visualizar resultados em painéis, controlar o tempo ou definir permissões por espaço. O Business também inclui a Novexo IA e aumenta o limite mensal de automações de 100 para 10 mil.' },
  { question: 'O que significa ter 100 vezes o limite de automações?', answer: 'O Essencial inclui 100 automações por mês, enquanto o Business inclui 10 mil. A comparação é entre os limites mensais dos dois planos. Você pode usar essa capacidade para executar mais ações recorrentes nos fluxos do time.' },
  { question: 'Como descubro o preço do Enterprise?', answer: 'O Enterprise tem uma proposta personalizada. Fale com nosso time para definir o escopo e as condições do contrato anual. Ele inclui os recursos do Business, SSO e auditoria, automações ilimitadas, gerente de conta dedicado e SLA de 99,9%.', link: '/contato?assunto=comercial', label: 'Conversar sobre minha empresa' },
]

let previousTitle
onMounted(() => { previousTitle = document.title; document.title = 'Preços e planos | Novexo' })
onUnmounted(() => { document.title = previousTitle })
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
          <label class="pricing-differences"><input v-model="differencesOnly" type="checkbox" /><span>Mostrar só as diferenças</span></label>
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
            <GooeyButton :to="destination(plan)" variant="secondary" :aria-label="`${plan.cta} — plano ${plan.name}`">{{ plan.cta }}<FlaticonIcon name="arrow-up-right" :size="12" /></GooeyButton>
          </article>
        </div>
      </section>

      <section id="enterprise" class="pricing-enterprise" aria-labelledby="enterprise-title">
        <div class="pricing-enterprise__intro" data-pricing-reveal>
          <div class="pricing-enterprise__label"><FlaticonIcon :name="enterprise.icon" framed :size="22" /><span>Enterprise</span></div>
          <h2 id="enterprise-title">O Novexo no tamanho<br>da sua empresa.</h2>
          <p>{{ enterprise.detail.description }}</p>
          <GooeyButton variant="primary" size="lg" @click="enterCustomPlan">Vamos montar seu plano<FlaticonIcon name="arrow-up-right" :size="15" /></GooeyButton>
        </div>
        <div class="pricing-enterprise__features"><article v-for="feature in enterpriseFeatures" :key="feature.title" data-pricing-reveal><FlaticonIcon :name="feature.icon" :size="21" /><h3>{{ feature.title }}</h3><p>{{ feature.text }}</p></article></div>
        <ol class="pricing-enterprise__steps"><li v-for="(step, index) in enterpriseSteps" :key="step.title" data-pricing-reveal><div><span>{{ String(index + 1).padStart(2, '0') }}</span><FlaticonIcon :name="step.icon" :size="18" /></div><h3>{{ step.title }}</h3><p>{{ step.text }}</p></li></ol>
      </section>

      <section class="pricing-faq" aria-labelledby="pricing-faq-title">
        <div class="pricing-faq__heading" data-pricing-reveal><h2 id="pricing-faq-title">Antes de escolher,<br>tire suas dúvidas.</h2><RouterLink to="/contato">Fale com a gente<FlaticonIcon name="arrow-up-right" :size="13" /></RouterLink></div>
        <div class="pricing-faq__list"><details v-for="item in questions" :key="item.question" data-pricing-reveal @toggle="revealAnswer"><summary><span>{{ item.question }}</span><FlaticonIcon name="plus" :size="15" /></summary><div class="pricing-faq__answer"><p>{{ item.answer }}</p><RouterLink v-if="item.link" :to="item.link">{{ item.label }}<FlaticonIcon name="arrow-up-right" :size="12" /></RouterLink></div></details></div>
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
/* a seção de planos é a mesma da landing; aqui o espaço de cima já vem do .pricing-main */
.pricing-main > .plans { padding: 0; scroll-margin-top: 115px; }
.pricing-compare-link { display: flex; align-items: center; justify-content: center; gap: 10px; width: fit-content; margin: 27px auto 0; color: #aca297; font-size: 12px; text-decoration: none; }
.pricing-compare-link:hover { color: var(--lp-orange-soft); }
.pricing-highlights { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 40px; margin: 90px 0 0; padding: 34px 0; border-block: 1px solid var(--pricing-line); }
.pricing-highlights article > .flaticon { color: #d9a36e; }
.pricing-highlights__value { display: flex; gap: 13px; align-items: baseline; min-height: 61px; padding-top: 20px; color: #f0e6dc; font: 500 43px/1 var(--lp-hero); letter-spacing: -.06em; }
.pricing-highlights__value > span { color: var(--lp-orange-soft); font-size: 28px; }
.pricing-highlights__value > .flaticon { align-self: center; color: #9e7955; }
.pricing-highlights h2 { margin: 18px 0 10px; font: 500 14px/1.4 var(--lp-sans); color: #e7ddd3; letter-spacing: -.01em; }
.pricing-highlights p { max-width: 330px; margin: 0; color: #9d958c; font-size: 12px; line-height: 1.85; }
.pricing-comparison, .pricing-details { margin-top: 95px; }
.pricing-section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 30px; margin-bottom: 32px; }
.pricing-section-head h2 { margin: 0; color: #f0e9e1; font: 500 clamp(30px, 3.5vw, 44px)/1.1 var(--lp-hero); letter-spacing: -.055em; }
.pricing-differences { display: flex; align-items: center; gap: 9px; flex-shrink: 0; padding-bottom: 4px; color: #c5b9ab; font-size: 11px; cursor: pointer; }
.pricing-differences input { width: 15px; height: 15px; margin: 0; accent-color: var(--lp-orange-soft); cursor: pointer; }
.pricing-table-hint { display: none; align-items: center; gap: 7px; color: #a59a8e; font-size: 11px; }
.pricing-table-wrap { position: relative; overflow-x: auto; border: 1px solid var(--pricing-line); border-radius: 12px; scrollbar-color: #7e5635 #15110e; }
.pricing-table { width: 100%; min-width: 780px; border-spacing: 0; table-layout: fixed; }
.pricing-table th, .pricing-table td { text-align: center; padding: 17px 13px; border-bottom: 1px solid #ffffff0e; color: #bdb1a4; font-size: 11px; font-weight: 400; }
.pricing-table tr > :first-child { width: 27%; text-align: left; padding-left: 24px; }
.pricing-table thead th { padding-block: 27px; background: #12100e; color: #f0e6dc; }
.pricing-table thead th > span { display: block; font-size: 15px; font-weight: 500; letter-spacing: -.03em; }
.pricing-table thead small { display: block; margin-top: 9px; color: #9e9285; font-size: 11px; }
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
.pricing-detail > p { margin: 0; color: #a89c90; font-size: 12px; line-height: 1.9; }
.pricing-detail ul { display: flex; flex-direction: column; gap: 13px; margin: 22px 0 26px; padding: 0; list-style: none; }
.pricing-detail li { display: flex; align-items: flex-start; gap: 9px; color: #c4b6a6; font-size: 11px; line-height: 1.7; }
.pricing-detail li .flaticon { color: #d39a61; margin-top: 4px; }
.pricing-detail > .gb { margin-top: auto; }
.pricing-detail :deep(.gb__btn) { font-size: 12px; min-height: 39px; }
.pricing-enterprise { display: grid; grid-template-columns: 1fr 1fr; gap: 45px 75px; margin-top: 100px; padding: 48px; border: 1px solid #e565154d; border-radius: 16px; background: #14100c; }
.pricing-enterprise__label { display: flex; align-items: center; gap: 14px; color: #deb892; font-size: 13px; }
.pricing-enterprise h2 { margin: 25px 0 20px; color: #f5e8dc; font: 500 clamp(32px, 3.7vw, 46px)/1.08 var(--lp-hero); letter-spacing: -.06em; }
.pricing-enterprise__intro > p { max-width: 410px; margin: 0 0 28px; color: #b8a696; font-size: 12px; line-height: 1.9; }
.pricing-enterprise__features { align-self: center; display: grid; grid-template-columns: 1fr 1fr; gap: 29px 24px; }
.pricing-enterprise__features .flaticon { margin-bottom: 14px; color: var(--lp-orange-soft); }
.pricing-enterprise__features h3 { margin: 0 0 9px; color: #e8d7c5; font: 500 13px/1.4 var(--lp-sans); }
.pricing-enterprise__features p { margin: 0; color: #a79583; font-size: 11px; line-height: 1.8; }
.pricing-enterprise__steps { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 30px; padding: 28px 0 0; margin: 0; border-top: 1px solid #d99b5b2b; list-style: none; }
.pricing-enterprise__steps li > div { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; color: #b68654; }
.pricing-enterprise__steps li > div > span { font: 11px var(--font-mono); }
.pricing-enterprise__steps h3 { color: #e5d3bf; font: 500 13px/1.5 var(--lp-sans); margin: 0 0 10px; }
.pricing-enterprise__steps p { margin: 0; color: #ae9b88; font-size: 11px; line-height: 1.85; }
.pricing-faq { display: grid; grid-template-columns: .8fr 1.2fr; gap: 70px; margin-top: 100px; padding-top: 45px; border-top: 1px solid var(--pricing-line); }
.pricing-faq h2 { margin: 0 0 23px; color: #e9dfd5; font: 500 clamp(30px, 3.2vw, 40px)/1.1 var(--lp-hero); letter-spacing: -.055em; }
.pricing-faq__heading > a, .pricing-faq__answer > a { display: inline-flex; align-items: center; gap: 9px; color: var(--lp-orange-soft); font-size: 12px; text-decoration: none; }
.pricing-faq details { border-bottom: 1px solid var(--pricing-line); }
.pricing-faq summary { display: flex; align-items: center; justify-content: space-between; gap: 18px; list-style: none; padding: 23px 0; color: #ded2c5; font-size: 13px; line-height: 1.7; cursor: pointer; }
.pricing-faq summary::-webkit-details-marker { display: none; }
.pricing-faq summary > .flaticon { color: var(--lp-orange-soft); transition: transform .25s; }
.pricing-faq details[open] summary > .flaticon { transform: rotate(45deg); }
.pricing-faq__answer { padding: 0 25px 24px 0; }
.pricing-faq__answer > p { margin: 0; color: #ab9d8f; font-size: 12px; line-height: 1.9; }
.pricing-faq__answer > a { margin-top: 17px; }
@media (max-width: 1150px) {
  .pricing-main { padding-inline: 30px; }
  .pricing-enterprise { padding: 35px; gap: 35px; }
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
  .pricing-enterprise { padding: 27px 22px; gap: 30px; }
  .pricing-enterprise h2 { font-size: 35px; }
  .pricing-enterprise__features { gap: 25px 18px; }
  .pricing-enterprise__steps { grid-template-columns: 1fr; gap: 26px; }
  .pricing-enterprise__steps li > div { margin-bottom: 12px; }
  .pricing-enterprise__steps h3 { margin-bottom: 7px; }
  .pricing-enterprise__intro :deep(.gb__btn) { padding-inline: 19px; font-size: 13px; }
  .pricing-faq { padding-top: 30px; }
}
@media (max-width: 360px) {
  .pricing-main { padding-inline: 16px; }
  .pricing-enterprise { padding-inline: 18px; }
  .pricing-enterprise h2 { font-size: 31px; }
}
@media (prefers-reduced-motion: reduce) { .pricing *, .pricing *::before, .pricing *::after { transition: none !important; } }
</style>
