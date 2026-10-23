<script setup>
import { ref } from 'vue'
import GooeyButton from '../GooeyButton.vue'

const yearly = ref(true)

// shortcut: planos fixos no front; quando o backend tiver planos/assinaturas, buscar de lá
const PLANS = [
  { name: 'Grátis', desc: 'Para organizar a vida e projetos pessoais.', month: 0, year: 0, cta: 'Começar grátis',
    features: ['Tarefas e listas ilimitadas', 'Até 3 quadros', '100 MB de armazenamento', 'Apps web e celular'] },
  { name: 'Essencial', desc: 'Para times pequenos que querem ritmo.', month: 29, year: 23, cta: 'Testar 14 dias',
    features: ['Tudo do Grátis', 'Quadros e calendário ilimitados', 'Comentários e menções', '5 GB por membro', '100 automações/mês'] },
  { name: 'Business', desc: 'Para times que crescem e precisam medir.', month: 59, year: 47, cta: 'Testar 14 dias', popular: true,
    features: ['Tudo do Essencial', 'Metas e painéis', 'Controle de tempo', 'Permissões por espaço', '10 mil automações/mês', 'Novexo IA incluída'] },
  { name: 'Enterprise', desc: 'Para empresas com segurança e escala.', cta: 'Falar com vendas',
    features: ['Tudo do Business', 'SSO e auditoria', 'Automações ilimitadas', 'Gerente de conta dedicado', 'SLA de 99,9%'] },
]
</script>

<template>
  <section id="planos" class="plans">
    <div class="plans__head" v-reveal.stagger>
      <h2 class="plans__title">Planos para cada fase do seu time</h2>
      <p class="plans__sub">Comece grátis. Mude de plano quando o time crescer, sem perder nada do que já foi organizado.</p>
      <div class="toggle" role="group" aria-label="Período de cobrança">
        <span class="toggle__thumb" :class="{ right: yearly }" aria-hidden="true" />
        <button type="button" :aria-pressed="!yearly" @click="yearly = false">Mensal</button>
        <button type="button" :aria-pressed="yearly" @click="yearly = true">Anual <em>−20%</em></button>
      </div>
    </div>

    <div class="plans__grid" v-reveal.stagger>
      <article v-for="p in PLANS" :key="p.name" class="plan" :class="{ popular: p.popular }">
        <span v-if="p.popular" class="plan__badge">Mais popular</span>
        <h3 class="plan__name">{{ p.name }}</h3>
        <p class="plan__desc">{{ p.desc }}</p>
        <div class="plan__price">
          <template v-if="p.month !== undefined">
            <span class="plan__cur">R$</span>
            <span class="plan__val"><Transition name="num" mode="out-in"><span :key="yearly">{{ yearly ? p.year : p.month }}</span></Transition></span>
            <span class="plan__per">{{ p.month ? 'por membro/mês' : 'para sempre' }}</span>
          </template>
          <span v-else class="plan__val custom">Sob medida</span>
        </div>
        <p class="plan__bill">{{ p.month ? (yearly ? `Cobrado anualmente: R$ ${p.year * 12}/membro` : 'Cobrado mensalmente') : p.month === 0 ? 'Sem cartão de crédito' : 'Contrato anual' }}</p>
        <GooeyButton :variant="p.popular ? 'primary' : 'secondary'" size="lg" block :href="p.month === undefined ? '#contato' : undefined" :to="p.month === undefined ? undefined : '/login'" class="plan__cta">{{ p.cta }}</GooeyButton>
        <ul class="plan__list">
          <li v-for="f in p.features" :key="f">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3 3 7-7" /></svg>{{ f }}
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>

<style scoped>
.plans { padding: clamp(5rem, 12vw, 9rem) clamp(1rem, 3vw, 2rem); }
.plans__head { display: flex; flex-direction: column; align-items: center; gap: 1.25rem; max-width: 46rem; margin: 0 auto 3.5rem; text-align: center; }
.plans__title { margin: 0; font: 900 clamp(2rem, 5vw, 3.5rem)/0.95 var(--lp-display); text-transform: uppercase; letter-spacing: -0.02em; color: var(--lp-white); text-wrap: balance; }
.plans__sub { margin: 0; max-width: 36rem; font: 500 clamp(1rem, 1.4vw, 1.25rem)/1.4 var(--lp-sans); color: rgb(248 248 248 / 0.7); text-wrap: balance; }

.toggle { position: relative; display: inline-grid; grid-template-columns: 1fr 1fr; padding: 4px; border-radius: 999px; background: #161616; border: 1px solid rgb(255 255 255 / 0.08); }
.toggle button { position: relative; z-index: 1; padding: 0.6rem 1.4rem; border: 0; background: none; font: 500 0.9375rem/1 var(--lp-sans); color: rgb(248 248 248 / 0.7); cursor: pointer; transition: color 0.3s; }
.toggle button[aria-pressed='true'] { color: #000; }
.toggle button em { font-style: normal; color: var(--lp-orange); margin-left: 0.25rem; transition: color 0.3s; }
.toggle button[aria-pressed='true'] em { color: #a3420a; }
.toggle__thumb { position: absolute; top: 4px; bottom: 4px; left: 4px; width: calc(50% - 4px); border-radius: 999px; background: var(--lp-white); transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1); }
.toggle__thumb.right { transform: translateX(100%); }

.plans__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(15.5rem, 1fr)); gap: 1rem; max-width: 80rem; margin: 0 auto; }
.plan { position: relative; display: flex; flex-direction: column; padding: 2rem 1.75rem; border-radius: 12px; background: #111111; border: 1px solid rgb(255 255 255 / 0.06); transition: border-color 0.3s, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
.plan:hover { border-color: rgb(255 255 255 / 0.16); transform: translateY(-4px); }
.plan.popular { background: linear-gradient(180deg, #2a1306 0%, #111111 55%); border-color: var(--lp-orange); }
.plan__badge { position: absolute; top: -0.8rem; left: 1.75rem; padding: 0.3rem 0.8rem; border-radius: 999px; background: var(--lp-orange); font: 600 0.75rem/1 var(--lp-sans); color: #000; }
.plan__name { margin: 0 0 0.5rem; font: 800 1.5rem/1 var(--lp-display); text-transform: uppercase; color: var(--lp-white); }
.plan__desc { margin: 0 0 1.75rem; min-height: 2.6em; font: 400 0.9375rem/1.35 var(--lp-sans); color: rgb(248 248 248 / 0.55); }
.plan__price { display: flex; align-items: baseline; gap: 0.35rem; min-height: 3.5rem; color: var(--lp-white); }
.plan__cur { font: 600 1.125rem/1 var(--lp-sans); }
.plan__val { display: inline-block; overflow: hidden; font: 900 3.25rem/1 var(--lp-display); letter-spacing: -0.03em; }
.plan__val > span { display: inline-block; }
.plan__val.custom { font-size: 2.25rem; }
.plan__per { font: 400 0.875rem/1.2 var(--lp-sans); color: rgb(248 248 248 / 0.55); }
.plan__bill { margin: 0.5rem 0 1.5rem; font: 400 0.8125rem/1.3 var(--lp-sans); color: var(--lp-grey); }
.plan__cta { margin-bottom: 1.75rem; }
.plan__list { display: flex; flex-direction: column; gap: 0.7rem; margin: 0; padding: 1.5rem 0 0; list-style: none; border-top: 1px solid rgb(255 255 255 / 0.08); }
.plan__list li { display: flex; align-items: flex-start; gap: 0.6rem; font: 400 0.9375rem/1.35 var(--lp-sans); color: rgb(248 248 248 / 0.85); }
.plan__list svg { flex-shrink: 0; width: 16px; height: 16px; margin-top: 0.15em; fill: none; stroke: var(--lp-orange); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

.num-enter-active, .num-leave-active { transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s; }
.num-enter-from { transform: translateY(60%); opacity: 0; }
.num-leave-to { transform: translateY(-60%); opacity: 0; }
</style>
