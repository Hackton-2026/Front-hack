<script setup>
// Rodapé (na linha da referência): foto de fundo, headline, e-mail em pílula de vidro e colunas de links
import { ref, onMounted, onUnmounted } from 'vue'
import { gsap, prefersReducedMotion } from '../../utils/motion'
import GooeyButton from '../GooeyButton.vue'
import FlaticonIcon from '../FlaticonIcon.vue'
import footerPhoto from '../../assets/landing/footer-sunset.webp'

defineProps({ blendFromBlack: Boolean })

const COLUMNS = [
  { title: 'Produto', links: ['Como funciona', 'Casos de uso', 'Segurança', 'Preços'] },
  { title: 'Desenvolvedores', links: ['Documentação', 'Referência da API', 'Status'] },
  { title: 'Empresa', links: ['Blog', 'Sobre', 'Fale conosco'] },
]
const footerLink = (label) => label === 'Blog' ? '/blog' : label === 'Como funciona' ? '/blog/como-funciona' : label === 'Preços' ? '/#planos' : label === 'Fale conosco' ? '/#contato' : '/#topo'

const email = ref('')
const joined = ref(false)
const emailError = ref('')
function joinWaitlist() {
  // shortcut: só valida no front; ligar ao endpoint de lista de espera (tabela WaitlistEntry) quando a API existir
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { emailError.value = 'Digite um e-mail válido.'; return }
  emailError.value = ''
  joined.value = true
}

const root = ref(null)
let ctx
onMounted(() => {
  if (prefersReducedMotion()) return
  ctx = gsap.context(() => {
    // a foto aproxima devagar enquanto o rodapé entra na tela
    gsap.fromTo('.foot__photo', { scale: 1.18 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: root.value, start: 'top bottom', end: 'bottom bottom', scrub: true } })
    if (root.value.querySelector('.foot__transition')) {
      gsap.fromTo('.foot__transition', { y: 40, opacity: 0.45 }, {
        y: 0, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: root.value, start: 'top bottom', end: 'top 30%', scrub: 1 },
      })
    }
    gsap.from('.foot__head > *', { y: 30, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: root.value, start: 'top 60%', once: true } })
  }, root.value)
})
onUnmounted(() => ctx?.revert())
</script>

<template>
  <footer ref="root" class="foot" :class="{ 'foot--blend': blendFromBlack }">
    <div class="foot__bg" aria-hidden="true">
      <img :src="footerPhoto" alt="" class="foot__photo" loading="lazy" decoding="async" />
    </div>
    <div v-if="blendFromBlack" class="foot__transition" aria-hidden="true" />

    <div class="foot__head">
      <h2 class="foot__title">O Novexo ajuda times a criar rotinas que crescem com eles, em vez de serem substituídas</h2>
      <form class="foot__form" novalidate @submit.prevent="joinWaitlist">
        <label for="foot-email" class="sr-only">E-mail de trabalho</label>
        <input id="foot-email" v-model="email" type="email" placeholder="E-mail de trabalho" autocomplete="email" :disabled="joined" :aria-invalid="!!emailError" aria-describedby="foot-email-msg" />
        <GooeyButton variant="secondary" size="lg" type="submit" :disabled="joined" class="foot__submit">
          {{ joined ? 'Você está na lista' : 'Garantir acesso' }} <FlaticonIcon :name="joined ? 'check' : 'plus'" :size="16" />
        </GooeyButton>
      </form>
      <p id="foot-email-msg" class="foot__msg" aria-live="polite">{{ emailError || (joined ? 'Pronto! Avisaremos você por e-mail.' : '') }}</p>
    </div>

    <div class="foot__bottom">
      <div class="foot__cols">
        <RouterLink to="/#topo" class="foot__logo" aria-label="Novexo, início">NOVEXO</RouterLink>
        <nav v-for="c in COLUMNS" :key="c.title" class="foot__col" :aria-label="c.title">
          <h3>{{ c.title }}</h3>
          <RouterLink v-for="l in c.links" :key="l" :to="footerLink(l)">{{ l }}</RouterLink>
        </nav>
      </div>
      <p class="foot__copy">© 2026 Novexo. Todos os direitos reservados.</p>
      <p class="foot__credits">Ícones por <a href="https://www.flaticon.com/uicons" target="_blank" rel="noopener noreferrer">Flaticon</a></p>
    </div>
  </footer>
</template>

<style scoped>
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.foot { position: relative; isolation: isolate; display: flex; flex-direction: column; justify-content: space-between; min-height: 100vh; min-height: 100svh; padding: clamp(6rem, 14vh, 9rem) clamp(1rem, 1.6vw, 1.5rem) 1.5rem; overflow: hidden; }
.foot__bg { position: absolute; inset: 0; z-index: -1; overflow: hidden; background: #1a0d05; }
.foot__photo { width: 100%; height: 100%; object-fit: cover; object-position: 60% 45%; transform-origin: 78% 42%; }
/* Puxa a foto para a paleta: laranja nos tons quentes, a água fria um pouco mais escura,
   e o pé escurecido para as colunas de links ficarem legíveis */
.foot__bg::before, .foot__bg::after { content: ''; position: absolute; inset: 0; pointer-events: none; }
.foot__bg::before { background: linear-gradient(180deg, #e56515 0%, #fba45c 45%, #2a1306 100%); mix-blend-mode: soft-light; opacity: 0.55; }
.foot__bg::after {
  background:
    /* continua o laranja do fim da seção de contato e dissolve na foto, sem corte reto */
    linear-gradient(180deg, #e56515 0%, rgb(229 101 21 / 0.85) 6%, rgb(196 82 13 / 0.45) 16%, rgb(120 48 8 / 0.15) 26%, transparent 36%),
    radial-gradient(ellipse 70% 45% at 50% 22%, rgb(0 0 0 / 0.45), transparent 70%),
    linear-gradient(180deg, rgb(10 5 2 / 0.35) 0%, transparent 28%, rgb(10 5 2 / 0.2) 55%, rgb(10 5 2 / 0.92) 100%);
}
/* A luz aparece antes da foto, dissolvendo a borda do rodapé no fundo preto. */
.foot--blend {
  --foot-blend-height: clamp(18rem, 30vw, 26rem);
  padding-top: clamp(13rem, 23vw, 20rem);
  background: #000;
}
.foot--blend .foot__bg {
  -webkit-mask-image: linear-gradient(180deg,
    transparent 0%, rgb(0 0 0 / 0.04) 8%, rgb(0 0 0 / 0.18) 17%,
    rgb(0 0 0 / 0.5) 28%, rgb(0 0 0 / 0.85) 40%, #000 54%);
  mask-image: linear-gradient(180deg,
    transparent 0%, rgb(0 0 0 / 0.04) 8%, rgb(0 0 0 / 0.18) 17%,
    rgb(0 0 0 / 0.5) 28%, rgb(0 0 0 / 0.85) 40%, #000 54%);
}
.foot__transition {
  position: absolute;
  z-index: -1;
  inset: 0 0 auto;
  height: var(--foot-blend-height);
  pointer-events: none;
  background:
    radial-gradient(ellipse 65% 45% at 28% 75%, rgb(229 101 21 / 0.2), transparent 75%),
    radial-gradient(ellipse 55% 40% at 78% 88%, rgb(251 164 92 / 0.13), transparent 75%);
}
@media (max-width: 600px) {
  .foot--blend { padding-top: 12rem; }
  .foot__transition { height: 20rem; }
}
.foot__head { display: flex; flex-direction: column; align-items: center; gap: 2.5rem; text-align: center; }
.foot__title { margin: 0; max-width: 44rem; font: 500 clamp(1.5rem, 2.6vw, 2.25rem)/1.3 var(--lp-sans); letter-spacing: -0.01em; color: var(--lp-white); text-shadow: 0 2px 24px rgb(0 0 0 / 0.35); text-wrap: balance; }
.foot__form {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: min(100%, 37.5rem);
  padding: 0.5rem;
  border-radius: 999px;
  border: 1px solid rgb(255 255 255 / 0.35);
  background: rgb(255 255 255 / 0.12);
  backdrop-filter: blur(16px) saturate(1.3);
  -webkit-backdrop-filter: blur(16px) saturate(1.3);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.25), 0 10px 40px rgb(0 0 0 / 0.2);
}
.foot__form input { flex: 1; min-width: 0; padding: 0.9rem 1.5rem; border: 0; background: none; font: 400 1rem/1.2 var(--lp-sans); color: var(--lp-white); outline: none; }
.foot__form input::placeholder { color: rgb(248 248 248 / 0.75); }
.foot__form:focus-within { border-color: rgb(255 255 255 / 0.6); }
.foot__submit { flex-shrink: 0; }
.foot__msg { min-height: 1.2em; margin: -1.5rem 0 0; font: 400 0.875rem/1.2 var(--lp-sans); color: var(--lp-white); }
@media (max-width: 520px) {
  .foot__form { flex-direction: column; border-radius: 24px; }
  .foot__form input, .foot__submit, .foot__submit :deep(.gb__btn) { width: 100%; }
}

.foot__bottom { display: flex; flex-direction: column; gap: 1.5rem; padding-top: 4rem; }
.foot__cols { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; align-items: start; }
@media (min-width: 900px) { .foot__cols { grid-template-columns: 1fr repeat(3, minmax(10rem, 20rem)); } }
.foot__logo { grid-column: 1 / -1; font: 800 2rem/1 var(--lp-display); letter-spacing: -0.02em; color: var(--lp-white); text-decoration: none; }
@media (min-width: 900px) { .foot__logo { grid-column: auto; align-self: center; } }
.foot__col { display: flex; flex-direction: column; gap: 0.6rem; }
.foot__col h3 { margin: 0 0 0.4rem; font: 600 0.9375rem/1.2 var(--lp-sans); color: var(--lp-white); }
.foot__col a { font: 400 0.9375rem/1.3 var(--lp-sans); color: rgb(248 248 248 / 0.85); text-decoration: none; transition: color 0.2s; }
.foot__col a:hover { color: var(--lp-orange-soft); }
.foot__copy { margin: 0; padding-top: 1.5rem; border-top: 1px solid rgb(255 255 255 / 0.2); font: 400 0.8125rem/1 var(--lp-sans); color: rgb(248 248 248 / 0.8); }
.foot__credits { margin: -0.5rem 0 0; font: 400 10px/1.5 var(--lp-sans); color: rgb(248 248 248 / 0.6); }
.foot__credits a { color: inherit; text-decoration-color: rgb(248 248 248 / 0.3); }
.foot__credits a:hover { color: var(--lp-orange-soft); }
</style>
