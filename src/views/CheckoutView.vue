<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import QRCode from 'qrcode'
import { api } from '../services/api'
import { useAuth } from '../composables/useAuth'
import { EASE, DUR, gsap, prefersReducedMotion } from '../utils/motion'
import { brandOf, brl, cardLength, cpfValid, digits, expValid, formatCard, formatCpf, formatExp, luhn } from '../utils/payment'
import { PLANS } from '../components/landing/plans'
import GooeyButton from '../components/GooeyButton.vue'
import FlaticonIcon from '../components/FlaticonIcon.vue'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()

const PAID = PLANS.filter((p) => p.month)
const planCode = ref(PAID.some((p) => p.code === route.query.plano) ? route.query.plano : 'business')
const yearly = ref(route.query.ciclo !== 'mensal')
const seats = ref(1)
const plan = computed(() => PAID.find((p) => p.code === planCode.value))
const perSeatMonth = computed(() => (yearly.value ? plan.value.year : plan.value.month) * 100)
const total = computed(() => perSeatMonth.value * seats.value * (yearly.value ? 12 : 1))
const fullYear = computed(() => plan.value.month * 100 * seats.value * 12)
const saving = computed(() => (yearly.value ? fullYear.value - total.value : 0))
watch([planCode, yearly], () => router.replace({ query: { plano: planCode.value, ciclo: yearly.value ? 'anual' : 'mensal' } }))

// sem a config não sabemos se o pagamento é de teste ou real: nada de "modo de teste" nem formulário de cartão até ela chegar
const cfg = ref({ test_mode: false, public_key: null, max_installments: 12, max_seats: 500 })
const cfgReady = ref(false)
const cfgError = ref('')
async function loadCfg() {
  cfgError.value = ''
  try {
    cfg.value = await api('/api/payments/config/', { auth: false })
    cfgReady.value = true
  } catch (e) {
    cfgError.value = `Não conseguimos carregar o pagamento: ${e.message}`
  }
}
onMounted(loadCfg)

const payer = ref({ name: [user.value?.first_name, user.value?.last_name].filter(Boolean).join(' '), email: user.value?.email || '', document: '' })
const touched = ref({})
const payerErrors = computed(() => ({
  name: payer.value.name.trim().split(/\s+/).length < 2 ? 'Digite nome e sobrenome.' : '',
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payer.value.email.trim()) ? '' : 'Digite um e-mail válido.',
  document: cpfValid(payer.value.document) ? '' : 'CPF inválido.',
}))
const payerOk = computed(() => !Object.values(payerErrors.value).some(Boolean))

const method = ref('pix')
const busy = ref(false)
const error = ref('')
const payment = ref(null)
const done = ref(null)
let attemptKey = null
const newKey = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`)

async function pay(kind, card) {
  touched.value = { name: true, email: true, document: true }
  if (!payerOk.value || busy.value) { if (!payerOk.value) error.value = 'Confira os dados de quem paga.'; return }
  busy.value = true
  error.value = ''
  attemptKey ||= newKey()
  try {
    const p = await api('/api/payments/checkout/', {
      method: 'POST',
      headers: { 'Idempotency-Key': attemptKey },
      body: { plan: planCode.value, interval: yearly.value ? 'year' : 'month', seats: seats.value, method: kind, payer: { ...payer.value, document: digits(payer.value.document) }, card },
    })
    attemptKey = null
    handle(p)
  } catch (e) {
    error.value = e.status === 403 ? e.message : e.status === 429 ? 'Muitas tentativas seguidas. Espere um minuto.' : e.message
    if (e.status && e.status < 500) attemptKey = null
  } finally {
    busy.value = false
  }
}
function handle(p) {
  payment.value = p
  if (p.status === 'approved') return success(p)
  if (p.status === 'rejected') { error.value = p.failure_reason || 'Pagamento recusado.'; return }
  if (p.method === 'pix' && p.status === 'pending') startPix(p)
}

const qr = ref('')
const copied = ref(false)
const left = ref(0)
const pixOffline = ref(false)
let poll, tick
async function startPix(p) {
  qr.value = p.pix_qr_base64 ? `data:image/png;base64,${p.pix_qr_base64}` : await QRCode.toDataURL(p.pix_code, { margin: 1, width: 240, color: { dark: '#000000', light: '#ffffff' } })
  stopPix()
  const end = new Date(p.expires_at).getTime()
  const step = () => { left.value = Math.max(0, Math.round((end - Date.now()) / 1000)); if (!left.value) checkPix() }
  step()
  tick = setInterval(step, 1000)
  poll = setInterval(checkPix, 3000)
}
function stopPix() { clearInterval(poll); clearInterval(tick) }
async function checkPix() {
  if (!payment.value || payment.value.status !== 'pending') return stopPix()
  try {
    const p = await api(`/api/payments/${payment.value.id}/`)
    payment.value = p
    pixOffline.value = false
    if (p.status === 'approved') { stopPix(); success(p) }
    else if (p.status !== 'pending') { stopPix(); error.value = p.status === 'expired' ? 'O Pix venceu. Gere outro para continuar.' : p.failure_reason || 'Pagamento não concluído.' }
  } catch {
    pixOffline.value = true
  }
}
async function simulate() {
  busy.value = true
  try { const p = await api(`/api/payments/${payment.value.id}/simulate/`, { method: 'POST' }); stopPix(); success(p) } catch (e) { error.value = e.message } finally { busy.value = false }
}
async function copyPix() {
  try { await navigator.clipboard.writeText(payment.value.pix_code); copied.value = true; setTimeout(() => (copied.value = false), 2000) } catch { document.getElementById('pix-code')?.select() }
}
const clock = computed(() => `${String(Math.floor(left.value / 60)).padStart(2, '0')}:${String(left.value % 60).padStart(2, '0')}`)
function resetPix() { stopPix(); payment.value = null; qr.value = ''; error.value = '' }

const card = ref({ number: '', name: '', exp: '', cvv: '', installments: 1 })
const flipped = ref(false)
const brand = computed(() => brandOf(card.value.number))
const cardErrors = computed(() => ({
  number: digits(card.value.number).length === cardLength(brand.value) && luhn(card.value.number) ? '' : 'Número de cartão inválido.',
  name: card.value.name.trim().length >= 3 ? '' : 'Nome como está no cartão.',
  exp: expValid(card.value.exp) ? '' : 'Validade inválida.',
  cvv: digits(card.value.cvv).length === brand.value.cvv ? '' : 'CVV inválido.',
}))
const cardTouched = ref({})
const installmentOptions = computed(() => Array.from({ length: yearly.value ? cfg.value.max_installments : 1 }, (_, i) => i + 1))
const shownNumber = computed(() => {
  const groups = brand.value.groups
  const d = digits(card.value.number).padEnd(cardLength(brand.value), '•')
  let i = 0
  return groups.map((g) => { const part = d.slice(i, i + g); i += g; return part }).join(' ')
})
function payCard() {
  cardTouched.value = { number: true, name: true, exp: true, cvv: true }
  if (Object.values(cardErrors.value).some(Boolean)) { error.value = 'Confira os dados do cartão.'; return }
  const d = digits(card.value.number)
  pay('card', { token: `test_${brand.value.id}_${d.slice(-4)}`, installments: card.value.installments })
}
watch(yearly, () => { if (!yearly.value) card.value.installments = 1 })

const brickBox = ref(null)
let brick
async function mountBrick() {
  if (!cfg.value.public_key || method.value !== 'card' || brick) return
  if (!window.MercadoPago) {
    await new Promise((ok, fail) => { const s = document.createElement('script'); s.src = 'https://sdk.mercadopago.com/js/v2'; s.onload = ok; s.onerror = fail; document.head.append(s) })
      .catch(() => { error.value = 'Não foi possível carregar o formulário do Mercado Pago.' })
    if (!window.MercadoPago) return
  }
  await nextTick()
  const mp = new window.MercadoPago(cfg.value.public_key, { locale: 'pt-BR' })
  brick = await mp.bricks().create('cardPayment', 'mp-card-brick', {
    initialization: { amount: total.value / 100, payer: { email: payer.value.email } },
    customization: { visual: { style: { theme: 'dark' } }, paymentMethods: { maxInstallments: yearly.value ? cfg.value.max_installments : 1 } },
    callbacks: {
      onReady: () => {},
      onError: () => { error.value = 'Erro no formulário do cartão. Recarregue a página.' },
      onSubmit: (f) => pay('card', { token: f.token, payment_method_id: f.payment_method_id, installments: f.installments, issuer_id: f.issuer_id }),
    },
  })
}
watch([method, () => cfg.value.public_key], mountBrick)
watch(total, () => { brick?.unmount?.(); brick = null; mountBrick() })

const successBox = ref(null)
const REDIRECT_MS = 4000
let leave
async function success(p) {
  done.value = p
  error.value = ''
  clearTimeout(leave)
  leave = setTimeout(goWorkspace, REDIRECT_MS)
  await nextTick()
  window.scrollTo({ top: 0 })
  if (prefersReducedMotion() || !successBox.value) return
  gsap.timeline()
    .from(successBox.value.querySelectorAll('.ok > *'), { y: 14, autoAlpha: 0, duration: DUR.base, stagger: 0.06, ease: EASE.expo })
    .fromTo(successBox.value.querySelector('.ok__tick'), { strokeDashoffset: 40 }, { strokeDashoffset: 0, duration: DUR.base, ease: EASE.soft }, 0.15)
}
const goWorkspace = () => { clearTimeout(leave); router.push('/inicio') }
const stayHere = () => clearTimeout(leave)

const root = ref(null)
onMounted(() => {
  if (prefersReducedMotion()) return
  gsap.from(root.value.querySelectorAll('.reveal'), { y: 28, autoAlpha: 0, duration: DUR.slow, ease: EASE.expo, stagger: 0.08, clearProps: 'transform' })
})
onUnmounted(() => { stopPix(); clearTimeout(leave); brick?.unmount?.() })
</script>

<template>
  <div ref="root" class="co">
    <header class="bar">
      <RouterLink to="/" class="logo" aria-label="Novexo, início">NOVEXO</RouterLink>
      <span class="secure"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 10V8a6 6 0 0 1 12 0v2 M5 10h14v11H5z M12 14v3" /></svg>Pagamento seguro</span>
      <RouterLink to="/#planos" class="back"><FlaticonIcon name="angle-small-left" :size="16" /> Voltar aos planos</RouterLink>
    </header>

    <section v-if="done" ref="successBox" class="ok-wrap" aria-live="polite">
      <div class="ok">
        <span class="ok__badge"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="ok__tick" d="M5 12.5l4.5 4.5L19 7.5" /></svg>Pagamento aprovado</span>
        <h1>Bem-vindo ao<br />{{ done.plan_name }}</h1>
        <p class="ok__sub">O plano já está ativo no seu workspace. Abrindo ele para você…</p>
        <dl class="receipt">
          <div><dt>Plano</dt><dd>{{ done.plan_name }}, {{ done.interval === 'year' ? 'anual' : 'mensal' }}</dd></div>
          <div><dt>Pessoas</dt><dd>{{ done.seats }}</dd></div>
          <div><dt>Pagamento</dt><dd>{{ done.method === 'pix' ? 'Pix' : `Cartão ${done.card_brand} final ${done.card_last4}${done.installments > 1 ? `, ${done.installments}x` : ''}` }}</dd></div>
          <div class="total"><dt>Total</dt><dd>{{ brl(done.amount_cents) }}</dd></div>
        </dl>
        <div class="ok__go">
          <span class="ok__bar" aria-hidden="true"><i :style="{ animationDuration: `${REDIRECT_MS}ms` }" /></span>
          <button type="button" class="ok__btn" @click="goWorkspace">Ir para o workspace agora</button>
          <RouterLink to="/ajustes?tab=billing" class="ok__link" @click="stayHere">Ver recibo em Ajustes</RouterLink>
        </div>
        <p v-if="done.gateway === 'test'" class="testnote">Modo de teste: nenhum valor foi cobrado de verdade.</p>
      </div>
    </section>

    <main v-else class="grid">
      <aside class="summary">
        <p class="eyebrow reveal">Seu plano</p>
        <h1 class="title reveal">Falta pouco para o seu time voar.</h1>

        <div class="pick reveal" role="radiogroup" aria-label="Plano">
          <button v-for="p in PAID" :key="p.code" type="button" role="radio" :aria-checked="planCode === p.code" @click="planCode = p.code">
            {{ p.name }}<span v-if="p.popular" class="tag">Popular</span>
          </button>
        </div>

        <article class="plan reveal" :class="{ popular: plan.popular }">
          <span v-if="plan.popular" class="plan__badge">Mais popular</span>
          <div class="plan__top">
            <div>
              <h2 class="plan__name">{{ plan.name }}</h2>
              <p class="plan__desc">{{ plan.desc }}</p>
            </div>
            <div class="toggle" role="group" aria-label="Período de cobrança">
              <span class="toggle__thumb" :class="{ right: yearly }" aria-hidden="true" />
              <button type="button" :aria-pressed="!yearly" @click="yearly = false">Mensal</button>
              <button type="button" :aria-pressed="yearly" @click="yearly = true">Anual <em>−20%</em></button>
            </div>
          </div>
          <div class="plan__price">
            <span class="plan__cur">R$</span>
            <span class="plan__val"><Transition name="num" mode="out-in"><span :key="perSeatMonth">{{ (perSeatMonth / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) }}</span></Transition></span>
            <span class="plan__per">por pessoa/mês</span>
          </div>

          <div class="seats">
            <span><strong>Pessoas no time</strong><small>Cobrado por pessoa</small></span>
            <div class="stepper">
              <button type="button" aria-label="Menos uma pessoa" :disabled="seats <= 1" @click="seats--">−</button>
              <input v-model.number="seats" type="number" min="1" :max="cfg.max_seats" aria-label="Pessoas no time" @change="seats = Math.min(cfg.max_seats, Math.max(1, Math.round(seats) || 1))" />
              <button type="button" aria-label="Mais uma pessoa" :disabled="seats >= cfg.max_seats" @click="seats++">+</button>
            </div>
          </div>

          <ul class="plan__list">
            <li v-for="f in plan.features" :key="f"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3 3 7-7" /></svg>{{ f }}</li>
          </ul>
        </article>

        <dl class="bill reveal">
          <div><dt>{{ brl(plan.month * 100) }} × {{ seats }} {{ seats === 1 ? 'pessoa' : 'pessoas' }}{{ yearly ? ' × 12 meses' : '' }}</dt><dd>{{ brl(total + saving) }}</dd></div>
          <div v-if="saving" class="save"><dt>Desconto do plano anual</dt><dd>− {{ brl(saving) }}</dd></div>
          <div class="sum"><dt>Total {{ yearly ? 'hoje (1 ano)' : 'por mês' }}</dt><dd><Transition name="num" mode="out-in"><span :key="total">{{ brl(total) }}</span></Transition></dd></div>
        </dl>
        <p class="trust reveal"><span><FlaticonIcon name="check" /> Plano ativo assim que o pagamento é aprovado</span><span><FlaticonIcon name="check" /> Recibos em Ajustes</span><span><FlaticonIcon name="check" /> Dados protegidos</span></p>
      </aside>

      <section class="pay reveal" aria-labelledby="pay-title">
        <h2 id="pay-title" class="pay__title">Pagamento</h2>
        <p v-if="cfg.test_mode" class="test">
          <strong>Modo de teste:</strong> nenhum valor é cobrado. Pix: gere e clique em “Simular pagamento”. Cartão: <code>4242 4242 4242 4242</code> aprova, <code>4000 0000 0000 0002</code> recusa.
        </p>
        <p v-if="cfgError" class="error" role="alert">{{ cfgError }} <button type="button" class="link" @click="loadCfg">Tentar de novo</button></p>
        <p v-else-if="cfg.available === false" class="error" role="alert">O pagamento está indisponível no momento. Tente mais tarde ou <RouterLink to="/contato" class="link">fale com a gente</RouterLink>.</p>

        <fieldset class="step" :disabled="!!payment && payment.status === 'pending'">
          <legend><span class="n">1</span>Quem paga</legend>
          <label class="f"><span>Nome completo</span><input v-model="payer.name" autocomplete="name" :aria-invalid="touched.name && !!payerErrors.name" @blur="touched.name = true" /><small v-if="touched.name && payerErrors.name">{{ payerErrors.name }}</small></label>
          <div class="row">
            <label class="f"><span>E-mail</span><input v-model="payer.email" type="email" autocomplete="email" :aria-invalid="touched.email && !!payerErrors.email" @blur="touched.email = true" /><small v-if="touched.email && payerErrors.email">{{ payerErrors.email }}</small></label>
            <label class="f"><span>CPF</span><input :value="payer.document" inputmode="numeric" placeholder="000.000.000-00" :aria-invalid="touched.document && !!payerErrors.document" @input="payer.document = formatCpf($event.target.value); $event.target.value = payer.document" @blur="touched.document = true" /><small v-if="touched.document && payerErrors.document">{{ payerErrors.document }}</small></label>
          </div>
        </fieldset>

        <div class="step">
          <p class="legend"><span class="n">2</span>Forma de pagamento</p>
          <div class="methods" role="tablist" aria-label="Forma de pagamento">
            <span class="methods__ink" :class="{ right: method === 'card' }" aria-hidden="true" />
            <button type="button" role="tab" :aria-selected="method === 'pix'" :disabled="!!payment && payment.status === 'pending'" @click="method = 'pix'; error = ''">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l4.5 4.5-4.5 4.5-4.5-4.5z M12 13l4.5 4.5L12 22l-4.5-4.5z M2 12l4.5-4.5L11 12l-4.5 4.5z M13 12l4.5-4.5L22 12l-4.5 4.5z" /></svg>Pix
            </button>
            <button type="button" role="tab" :aria-selected="method === 'card'" :disabled="!!payment && payment.status === 'pending'" @click="method = 'card'; error = ''">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v12H3z M3 10h18 M7 15h3" /></svg>Cartão
            </button>
          </div>

          <div v-if="method === 'pix'" class="panel">
            <template v-if="payment?.method === 'pix' && payment.status === 'pending'">
              <div class="pix">
                <div class="qr"><img :src="qr" alt="QR Code do Pix" width="200" height="200" /><span class="scan" aria-hidden="true" /></div>
                <div class="pix__side">
                  <p class="wait"><span class="dot" aria-hidden="true" />Aguardando pagamento: <strong>{{ clock }}</strong></p>
                  <p v-if="pixOffline" class="error" role="status">Sem conexão com o servidor. Se você já pagou, a gente confere assim que a conexão voltar.</p>
                  <ol class="howto"><li>Abra o app do seu banco e escolha Pix.</li><li>Escaneie o QR ou cole o código.</li><li>Confirme {{ brl(payment.amount_cents) }}. A gente reconhece na hora.</li></ol>
                  <label class="f"><span>Pix copia e cola</span>
                    <span class="copy"><input id="pix-code" :value="payment.pix_code" readonly @focus="$event.target.select()" /><button type="button" class="pg" @click="copyPix">{{ copied ? 'Copiado!' : 'Copiar' }}</button></span>
                  </label>
                  <div class="pix__actions">
                    <GooeyButton v-if="payment.gateway === 'test'" variant="primary" :disabled="busy" @click="simulate">Simular pagamento (teste)</GooeyButton>
                    <button type="button" class="link" @click="resetPix">Trocar forma de pagamento</button>
                  </div>
                </div>
              </div>
            </template>
            <template v-else>
              <ul class="perks"><li><FlaticonIcon name="bolt" /> Aprovação na hora, todos os dias</li><li><FlaticonIcon name="bolt" /> QR Code válido por 30 minutos</li><li><FlaticonIcon name="bolt" /> Sem taxas para você</li></ul>
              <GooeyButton variant="primary" size="lg" block :disabled="busy || !cfgReady || cfg.available === false" @click="pay('pix')"><ArcLoader v-if="busy" />{{ busy ? 'Gerando Pix…' : `Gerar Pix de ${brl(total)}` }}</GooeyButton>
            </template>
          </div>

          <div v-else class="panel">
            <div v-if="cfg.public_key" id="mp-card-brick" ref="brickBox" class="brick" />
            <p v-else-if="!cfg.test_mode" class="fine">{{ !cfgReady ? 'Carregando o pagamento com cartão…' : cfg.available === false ? 'O pagamento está indisponível no momento.' : 'O pagamento com cartão não está disponível agora. Use o Pix.' }}</p>
            <template v-else>
              <div class="cc" :class="{ flipped }" aria-hidden="true">
                <div class="cc__face cc__front">
                  <span class="cc__chip" /><span class="cc__brand">{{ brand.label }}</span>
                  <span class="cc__num">{{ shownNumber }}</span>
                  <span class="cc__row"><span>{{ card.name || 'NOME NO CARTÃO' }}</span><span>{{ card.exp || 'MM/AA' }}</span></span>
                </div>
                <div class="cc__face cc__back"><span class="cc__strip" /><span class="cc__cvv">{{ card.cvv || '•••' }}</span></div>
              </div>
              <form class="cardform" novalidate @submit.prevent="payCard">
                <label class="f"><span>Número do cartão</span><input :value="card.number" inputmode="numeric" autocomplete="cc-number" placeholder="0000 0000 0000 0000" :aria-invalid="cardTouched.number && !!cardErrors.number" @input="card.number = formatCard($event.target.value); $event.target.value = card.number" @blur="cardTouched.number = true" /><small v-if="cardTouched.number && cardErrors.number">{{ cardErrors.number }}</small></label>
                <label class="f"><span>Nome no cartão</span><input v-model="card.name" autocomplete="cc-name" @input="card.name = card.name.toUpperCase()" @blur="cardTouched.name = true" /><small v-if="cardTouched.name && cardErrors.name">{{ cardErrors.name }}</small></label>
                <div class="row three">
                  <label class="f"><span>Validade</span><input :value="card.exp" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/AA" @input="card.exp = formatExp($event.target.value); $event.target.value = card.exp" @blur="cardTouched.exp = true" /><small v-if="cardTouched.exp && cardErrors.exp">{{ cardErrors.exp }}</small></label>
                  <label class="f"><span>CVV</span><input :value="card.cvv" inputmode="numeric" autocomplete="cc-csc" :placeholder="brand.cvv === 4 ? '0000' : '000'" @input="card.cvv = digits($event.target.value).slice(0, brand.cvv); $event.target.value = card.cvv" @focus="flipped = true" @blur="flipped = false; cardTouched.cvv = true" /><small v-if="cardTouched.cvv && cardErrors.cvv">{{ cardErrors.cvv }}</small></label>
                  <label class="f"><span>Parcelas</span><select v-model.number="card.installments" :disabled="!yearly"><option v-for="n in installmentOptions" :key="n" :value="n">{{ n }}x de {{ brl(Math.round(total / n)) }}{{ n > 1 ? ' sem juros' : '' }}</option></select></label>
                </div>
                <GooeyButton type="submit" variant="primary" size="lg" block :disabled="busy"><ArcLoader v-if="busy" />{{ busy ? 'Processando…' : `Pagar ${brl(total)}` }}</GooeyButton>
              </form>
            </template>
          </div>

          <p v-if="error" class="error" role="alert">{{ error }}</p>
        </div>
        <p class="fine">Ao continuar, você concorda com os Termos de uso. O plano vale por {{ yearly ? '12 meses' : '1 mês' }} a partir da aprovação do pagamento.</p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.co {
  --lp-orange: #e56515;
  --lp-orange-soft: #fba45c;
  --lp-grey: #919599;
  --lp-white: #f8f8f8;
  --lp-display: 'Lexend', 'Geist', system-ui, sans-serif;
  --lp-sans: 'Geist', 'Helvetica Neue', system-ui, sans-serif;
  --card: #111111;
  --line: rgb(255 255 255 / 0.08);
  position: relative;
  isolation: isolate;
  min-height: 100vh;
  min-height: 100svh;
  overflow-x: clip;
  padding: 0 clamp(1rem, 3vw, 2.5rem) 4rem;
  background: #000;
  color: var(--lp-white);
  font-family: var(--lp-sans);
}
:global(html:has(.co)), :global(html:has(.co) body) { background: #000; }

.bar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; max-width: 76rem; margin: 0 auto; padding: 1.5rem 0; }
.logo { font: 800 1.5rem/1 var(--lp-display); letter-spacing: -0.02em; color: var(--lp-white); text-decoration: none; }
.secure { display: inline-flex; align-items: center; gap: 0.45rem; font-size: 0.875rem; color: rgb(248 248 248 / 0.7); }
.secure svg { width: 16px; height: 16px; fill: none; stroke: var(--lp-orange-soft); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.back { font-size: 0.875rem; color: rgb(248 248 248 / 0.7); text-decoration: none; }
.back:hover { color: var(--lp-white); }
@media (max-width: 640px) { .secure { display: none; } }

.grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); gap: clamp(1.5rem, 4vw, 3.5rem); max-width: 76rem; margin: 1rem auto 0; align-items: start; }
@media (max-width: 960px) { .grid { grid-template-columns: 1fr; } }

.eyebrow { margin: 0; font: 600 0.75rem/1 var(--lp-sans); letter-spacing: 0.16em; text-transform: uppercase; color: var(--lp-orange-soft); }
.title { margin: 0.75rem 0 1.5rem; color: var(--lp-white); font: 900 clamp(2rem, 4.4vw, 3.25rem)/0.95 var(--lp-display); text-transform: uppercase; letter-spacing: -0.02em; text-wrap: balance; }
.pick { display: inline-flex; gap: 0.4rem; margin-bottom: 1.25rem; padding: 4px; border: 1px solid var(--line); border-radius: 999px; background: #0b0b0b; }
.pick button { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.55rem 1.1rem; border: 0; border-radius: 999px; background: none; font: 500 0.9375rem/1 var(--lp-sans); color: rgb(248 248 248 / 0.7); cursor: pointer; transition: background 0.3s, color 0.3s; }
.pick button[aria-checked='true'] { background: var(--lp-white); color: #000; }
.tag { padding: 0.15rem 0.45rem; border-radius: 999px; background: var(--lp-orange); font-size: 0.6875rem; font-weight: 600; color: #000; }

.plan { position: relative; display: flex; flex-direction: column; padding: 1.9rem 1.75rem; border-radius: 14px; background: var(--card); border: 1px solid rgb(255 255 255 / 0.06); }
.plan.popular { background: linear-gradient(180deg, #2a1306 0%, #111111 60%); border-color: var(--lp-orange); box-shadow: 0 30px 80px -40px rgb(229 101 21 / 0.6); }
.plan__badge { position: absolute; top: -0.8rem; left: 1.75rem; padding: 0.3rem 0.8rem; border-radius: 999px; background: var(--lp-orange); font: 600 0.75rem/1 var(--lp-sans); color: #000; }
.plan__top { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.plan__name { margin: 0 0 0.4rem; color: var(--lp-white); font: 800 1.6rem/1 var(--lp-display); text-transform: uppercase; }
.plan__desc { margin: 0; max-width: 18rem; font-size: 0.9375rem; line-height: 1.35; color: rgb(248 248 248 / 0.55); }
.plan__price { display: flex; align-items: baseline; gap: 0.35rem; margin: 1.5rem 0 1.25rem; }
.plan__cur { font: 600 1.125rem/1 var(--lp-sans); }
.plan__val { display: inline-block; overflow: hidden; font: 900 3.5rem/1 var(--lp-display); letter-spacing: -0.03em; }
.plan__val > span { display: inline-block; }
.plan__per { font-size: 0.875rem; color: rgb(248 248 248 / 0.55); }
.toggle { position: relative; display: inline-grid; grid-template-columns: 1fr 1fr; padding: 4px; border-radius: 999px; background: #161616; border: 1px solid var(--line); }
.toggle button { position: relative; z-index: 1; padding: 0.5rem 1rem; border: 0; background: none; font: 500 0.875rem/1 var(--lp-sans); color: rgb(248 248 248 / 0.7); cursor: pointer; transition: color 0.3s; white-space: nowrap; }
.toggle button[aria-pressed='true'] { color: #000; }
.toggle button em { margin-left: 0.25rem; font-style: normal; color: var(--lp-orange); }
.toggle button[aria-pressed='true'] em { color: #a3420a; }
.toggle__thumb { position: absolute; top: 4px; bottom: 4px; left: 4px; width: calc(50% - 4px); border-radius: 999px; background: var(--lp-white); transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1); }
.toggle__thumb.right { transform: translateX(100%); }
.seats { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 0; border-top: 1px solid var(--line); }
.seats strong { display: block; font-weight: 600; }
.seats small { color: var(--lp-grey); }
.stepper { display: flex; align-items: center; border: 1px solid rgb(255 255 255 / 0.14); border-radius: 999px; overflow: hidden; }
.stepper button { width: 38px; height: 38px; border: 0; background: none; font-size: 1.2rem; color: var(--lp-white); cursor: pointer; }
.stepper button:hover:not(:disabled) { background: rgb(255 255 255 / 0.08); }
.stepper button:disabled { opacity: 0.35; cursor: default; }
.stepper input { width: 3.2rem; border: 0; background: none; font: 700 1rem/1 var(--lp-display); text-align: center; color: var(--lp-white); -moz-appearance: textfield; }
.stepper input::-webkit-inner-spin-button, .stepper input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.plan__list { display: grid; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); gap: 0.6rem 1rem; margin: 0; padding: 1.25rem 0 0; list-style: none; border-top: 1px solid var(--line); }
.plan__list li { display: flex; gap: 0.55rem; font-size: 0.9375rem; color: rgb(248 248 248 / 0.85); }
.plan__list svg { flex-shrink: 0; width: 16px; height: 16px; margin-top: 0.15em; fill: none; stroke: var(--lp-orange); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.bill { display: flex; flex-direction: column; gap: 0.55rem; margin: 1.5rem 0 0; padding: 0 0.25rem; }
.bill div { display: flex; justify-content: space-between; gap: 1rem; font-size: 0.9375rem; color: rgb(248 248 248 / 0.7); }
.bill dt, .bill dd { margin: 0; }
.bill .save dd { color: #7fc47a; }
.bill .sum { margin-top: 0.4rem; padding-top: 0.9rem; border-top: 1px solid var(--line); color: var(--lp-white); }
.bill .sum dt { font-weight: 600; }
.bill .sum dd { overflow: hidden; font: 900 1.75rem/1 var(--lp-display); letter-spacing: -0.02em; }
.bill .sum dd span { display: inline-block; }
.trust { display: flex; flex-wrap: wrap; gap: 0.4rem 1.2rem; margin: 1.25rem 0 0; padding: 0 0.25rem; font-size: 0.8125rem; color: var(--lp-grey); }
.trust .flaticon { color: var(--lp-orange); }

.pay { position: relative; padding: clamp(1.25rem, 3vw, 2rem); border: 1px solid var(--line); border-radius: 18px; background: #111111; }
.pay__title { margin: 0 0 1rem; color: var(--lp-white); font: 800 1.35rem/1 var(--lp-display); text-transform: uppercase; }
.test { margin: 0 0 1.25rem; padding: 0.75rem 0.9rem; border: 1px dashed rgb(251 164 92 / 0.5); border-radius: 10px; background: rgb(229 101 21 / 0.08); font-size: 0.8125rem; line-height: 1.5; color: rgb(248 248 248 / 0.8); }
.test strong { color: var(--lp-orange-soft); }
.test code { padding: 0 0.25rem; border-radius: 4px; background: rgb(255 255 255 / 0.08); font: 0.78rem/1.4 'Geist Mono', ui-monospace, monospace; white-space: nowrap; }
.step { display: flex; flex-direction: column; gap: 0.85rem; margin: 0 0 1.4rem; padding: 0; border: 0; min-width: 0; }
.step legend, .legend { display: flex; align-items: center; gap: 0.55rem; margin: 0 0 0.85rem; padding: 0; font-weight: 600; }
.n { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: var(--lp-orange); font: 700 0.75rem/1 var(--lp-display); color: #000; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.row.three { grid-template-columns: 1fr 0.8fr 1.3fr; }
@media (max-width: 520px) { .row, .row.three { grid-template-columns: 1fr; } }
.f { display: flex; flex-direction: column; gap: 0.35rem; min-width: 0; }
.f > span { font-size: 0.8125rem; color: rgb(248 248 248 / 0.65); }
.f input, .f select { width: 100%; height: 44px; padding: 0 0.85rem; border: 1px solid rgb(255 255 255 / 0.12); border-radius: 10px; background: #0b0b0b; font: 500 0.9375rem/1 var(--lp-sans); color: var(--lp-white); outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
.f input:focus, .f select:focus { border-color: var(--lp-orange); box-shadow: 0 0 0 3px rgb(229 101 21 / 0.2); }
.f input[aria-invalid='true'] { border-color: #ff5b4d; }
.f small { font-size: 0.75rem; color: #ff8a7f; }
.f select:disabled { opacity: 0.6; }

.methods { position: relative; display: grid; grid-template-columns: 1fr 1fr; padding: 4px; border: 1px solid var(--line); border-radius: 12px; background: #0b0b0b; }
.methods button { position: relative; z-index: 1; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; height: 44px; border: 0; background: none; font: 600 0.9375rem/1 var(--lp-sans); color: rgb(248 248 248 / 0.65); cursor: pointer; transition: color 0.3s; }
.methods button[aria-selected='true'] { color: #000; }
.methods button:disabled { cursor: default; }
.methods svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linejoin: round; stroke-linecap: round; }
.methods__ink { position: absolute; top: 4px; bottom: 4px; left: 4px; width: calc(50% - 4px); border-radius: 9px; background: linear-gradient(135deg, var(--lp-orange-soft), var(--lp-orange)); transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1); }
.methods__ink.right { transform: translateX(100%); }
.panel { display: flex; flex-direction: column; gap: 1rem; padding-top: 0.5rem; }
.perks { display: grid; gap: 0.5rem; margin: 0.25rem 0 0.25rem; padding: 0; list-style: none; color: rgb(248 248 248 / 0.8); }
.perks .flaticon { color: var(--lp-orange); }

.pix { display: grid; grid-template-columns: auto 1fr; gap: 1.25rem; align-items: start; }
@media (max-width: 560px) { .pix { grid-template-columns: 1fr; justify-items: center; } }
.qr { position: relative; padding: 10px; border-radius: 14px; background: #fff; box-shadow: 0 0 0 1px rgb(229 101 21 / 0.4), 0 20px 50px -20px rgb(229 101 21 / 0.6); overflow: hidden; }
.qr img { display: block; width: 200px; height: 200px; image-rendering: pixelated; }
.scan { position: absolute; left: 0; right: 0; top: 0; height: 3px; background: linear-gradient(90deg, transparent, var(--lp-orange), transparent); box-shadow: 0 0 12px var(--lp-orange); animation: scan 2.4s ease-in-out infinite; }
@keyframes scan { 0%, 100% { transform: translateY(8px); } 50% { transform: translateY(212px); } }
.pix__side { display: flex; flex-direction: column; gap: 0.75rem; min-width: 0; width: 100%; }
.wait { display: flex; align-items: center; gap: 0.5rem; margin: 0; color: rgb(248 248 248 / 0.8); }
.wait strong { font-variant-numeric: tabular-nums; color: var(--lp-white); }
.dot { width: 9px; height: 9px; border-radius: 50%; background: var(--lp-orange); animation: pulse 1.4s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgb(229 101 21 / 0.6); } 50% { box-shadow: 0 0 0 8px rgb(229 101 21 / 0); } }
.howto { display: grid; gap: 0.3rem; margin: 0; padding-left: 1.1rem; font-size: 0.875rem; color: rgb(248 248 248 / 0.7); }
.copy { display: flex; gap: 0.4rem; }
.copy input { flex: 1; min-width: 0; font: 0.78rem/1 'Geist Mono', ui-monospace, monospace !important; }
.pg { height: 44px; padding: 0 1rem; border: 1px solid rgb(255 255 255 / 0.16); border-radius: 10px; background: #161616; font: 600 0.875rem/1 var(--lp-sans); color: var(--lp-white); cursor: pointer; white-space: nowrap; }
.pg:hover { border-color: var(--lp-orange); }
.pix__actions { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; }
.link { border: 0; background: none; font: 500 0.875rem/1 var(--lp-sans); color: rgb(248 248 248 / 0.6); text-decoration: underline; cursor: pointer; }

.cc { position: relative; width: min(100%, 340px); aspect-ratio: 1.586; margin: 0.25rem auto 0.5rem; perspective: 1000px; }
.cc__face { position: absolute; inset: 0; display: flex; flex-direction: column; padding: 1.1rem 1.25rem; border-radius: 16px; backface-visibility: hidden; transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1); background: radial-gradient(120% 140% at 10% 0%, #fba45c 0%, #e56515 35%, #5a1d05 75%, #1a0d05 100%); box-shadow: 0 30px 60px -30px rgb(229 101 21 / 0.7), inset 0 1px 0 rgb(255 255 255 / 0.25); color: #fff; overflow: hidden; }
.cc__face::after { content: ''; position: absolute; inset: 0; background: linear-gradient(115deg, transparent 30%, rgb(255 255 255 / 0.18) 45%, transparent 60%); }
.cc__back { transform: rotateY(180deg); padding: 1.6rem 0 0; }
.cc.flipped .cc__front { transform: rotateY(-180deg); }
.cc.flipped .cc__back { transform: rotateY(0); }
.cc__chip { width: 42px; height: 32px; border-radius: 7px; background: linear-gradient(135deg, #f6d38b, #b98b2e); }
.cc__brand { position: absolute; top: 1.1rem; right: 1.25rem; font: 800 1rem/1 var(--lp-display); text-transform: uppercase; letter-spacing: 0.04em; }
.cc__num { margin-top: auto; font: 600 clamp(1rem, 4.2vw, 1.3rem)/1 'Geist Mono', ui-monospace, monospace; letter-spacing: 0.08em; text-shadow: 0 2px 6px rgb(0 0 0 / 0.35); }
.cc__row { display: flex; justify-content: space-between; gap: 1rem; margin-top: 0.9rem; font: 500 0.75rem/1 var(--lp-sans); letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.9; }
.cc__row span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cc__strip { display: block; height: 42px; background: #111; }
.cc__cvv { align-self: flex-end; margin: 1rem 1.25rem 0 auto; padding: 0.35rem 0.7rem; border-radius: 4px; background: #fff; font: 600 0.9rem/1 'Geist Mono', ui-monospace, monospace; color: #000; }
.cardform { display: flex; flex-direction: column; gap: 0.85rem; }
.brick { min-height: 300px; }

.error { margin: 0; padding: 0.75rem 0.9rem; border: 1px solid rgb(255 91 77 / 0.45); border-radius: 10px; background: rgb(255 91 77 / 0.1); font-size: 0.875rem; color: #ffb4ab; }
.fine { margin: 0; font-size: 0.75rem; line-height: 1.5; color: var(--lp-grey); }

.ok-wrap { display: grid; place-items: center; min-height: calc(100vh - 160px); padding: 2rem 0 4rem; }
.ok { display: flex; flex-direction: column; align-items: flex-start; gap: 1.25rem; width: min(100%, 30rem); padding: clamp(1.5rem, 4vw, 2.25rem); border: 1px solid var(--line); border-radius: 18px; background: #111111; }
.ok__badge { display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.35rem 0.75rem 0.35rem 0.5rem; border: 1px solid var(--line); border-radius: 999px; font-size: 0.8125rem; font-weight: 500; color: var(--lp-white); }
.ok__badge svg { width: 18px; height: 18px; padding: 2px; border-radius: 50%; background: var(--lp-orange); fill: none; stroke: #000; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.ok__tick { stroke-dasharray: 40; }
.ok h1 { margin: 0; color: var(--lp-white); font: 900 clamp(2rem, 6vw, 3rem)/0.95 var(--lp-display); text-transform: uppercase; letter-spacing: -0.03em; }
.ok__sub { margin: 0; color: rgb(248 248 248 / 0.65); line-height: 1.5; }
.receipt { display: flex; flex-direction: column; width: 100%; margin: 0; border-top: 1px solid var(--line); }
.receipt > div { display: flex; justify-content: space-between; gap: 1rem; padding: 0.7rem 0; border-bottom: 1px solid var(--line); font-size: 0.9375rem; }
.receipt dt { color: rgb(248 248 248 / 0.6); }
.receipt dd { margin: 0; color: var(--lp-white); font-weight: 500; text-align: right; }
.receipt .total { border-bottom: 0; padding-top: 0.9rem; }
.receipt .total dd { font: 900 1.5rem/1 var(--lp-display); }
.ok__go { display: flex; flex-direction: column; gap: 0.75rem; width: 100%; }
.ok__bar { display: block; height: 3px; overflow: hidden; border-radius: 999px; background: var(--line); }
.ok__bar i { display: block; height: 100%; background: var(--lp-white); transform-origin: left; animation: ok-go linear forwards; }
@keyframes ok-go { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.ok__btn { height: 48px; border: 0; border-radius: 999px; background: var(--lp-white); font: 600 0.9375rem/1 var(--lp-sans); color: #000; cursor: pointer; transition: transform 0.15s ease; }
.ok__btn:hover { transform: translateY(-1px); }
.ok__btn:active { transform: scale(0.98); }
.ok__link { align-self: center; font-size: 0.875rem; color: rgb(248 248 248 / 0.7); }
.ok__link:hover { color: var(--lp-white); }
:is(.ok__btn, .ok__link):focus-visible { outline: 2px solid var(--lp-orange-soft); outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) { .ok__bar i { animation: none; transform: scaleX(1); } }
.testnote { margin: 0; font-size: 0.75rem; color: var(--lp-grey); }

.num-enter-active, .num-leave-active { transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s; }
.num-enter-from { transform: translateY(60%); opacity: 0; }
.num-leave-to { transform: translateY(-60%); opacity: 0; }
:is(button, a, input, select):focus-visible { outline: 2px solid var(--lp-orange-soft); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .scan, .dot { animation: none; } .cc__face, .toggle__thumb, .methods__ink { transition: none; } }
</style>
