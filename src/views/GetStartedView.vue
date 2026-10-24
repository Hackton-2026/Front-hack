<script setup>
// "Começar": a primeira página depois do login (base: Get started do Plane, na paleta do Novexo)
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { gsap, prefersReducedMotion } from '../utils/motion'
import { useAuth } from '../composables/useAuth'
import AppIcon from '../components/app/AppIcon.vue'
import GooeyButton from '../components/GooeyButton.vue'
import OnboardingChecklist from '../components/app/OnboardingChecklist.vue'
import TeamInvite from '../components/app/TeamInvite.vue'
import IntegrationsCard from '../components/app/IntegrationsCard.vue'

const COMPARE = [
  { slug: 'clickup', name: 'ClickUp' },
  { slug: 'jira', name: 'Jira' },
  { slug: 'asana', name: 'Asana' },
  { slug: 'trello', name: 'Trello' },
  { slug: 'linear', name: 'Linear' },
]

const { user } = useAuth()
const firstName = computed(() => user.value?.first_name || user.value?.username || '')
const root = ref(null)

let ctx
onMounted(() => {
  if (prefersReducedMotion()) return
  ctx = gsap.context(() => {
    const scroller = root.value.closest('.main__scroll')
    // saudação palavra a palavra, depois subtítulo e o card do plano, que pisca a borda uma vez
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .from('.hello__word', { y: 14, autoAlpha: 0, filter: 'blur(6px)', duration: 0.6, stagger: 0.06, delay: 0.25 })
      .from('.hello__sub', { y: 10, autoAlpha: 0, duration: 0.5 }, '-=0.35')
      .from('.trial', { y: 10, autoAlpha: 0, duration: 0.5 }, '-=0.3')
      .fromTo('.trial', { boxShadow: '0 0 0 2px rgb(229 101 21 / 0.9)' }, { boxShadow: '0 0 0 2px rgb(229 101 21 / 0)', duration: 1.2, ease: 'power2.out' })
      .from('.trial__icon', { rotation: -45, scale: 0.6, duration: 0.6, ease: 'back.out(2)' }, '<-0.2')
    // seções de baixo aparecem quando entram na área visível (o scroll é o do conteúdo, não o da janela)
    gsap.utils.toArray('.reveal').forEach((el) => {
      gsap.from(el, { y: 16, autoAlpha: 0, duration: 0.6, scrollTrigger: { trigger: el, scroller, start: 'top 92%', once: true } })
    })
    gsap.from('.compare__chip', { y: 8, autoAlpha: 0, duration: 0.4, stagger: 0.05, scrollTrigger: { trigger: '.compare', scroller, start: 'top 92%', once: true } })
  }, root.value)
})
onUnmounted(() => ctx?.revert())
</script>

<template>
  <div ref="root" class="page">
    <header class="hello">
      <h1>
        <span v-for="(w, i) in `Olá${firstName ? ', ' + firstName : ''}, boas-vindas ao Novexo!`.split(' ')" :key="i" class="hello__word">{{ w }}</span>
      </h1>
      <p class="hello__sub">Aqui está tudo o que você precisa para começar a organizar o trabalho do time.</p>
    </header>

    <section class="trial" aria-labelledby="trial-title">
      <span class="trial__icon"><AppIcon name="rocket" :size="18" /></span>
      <h2 id="trial-title">Seu teste de 14 dias do Business está ativo! <span class="badge">Termina em 13 dias</span></h2>
      <p>Use metas, painéis, controle de tempo e a Novexo IA. Adicione um cartão para continuar depois do teste, ou volte para o Grátis quando quiser.</p>
      <div class="trial__btns">
        <GooeyButton variant="primary" to="/checkout?plano=business&ciclo=anual">Assinar agora</GooeyButton>
        <GooeyButton variant="secondary" to="/#planos">Ver recursos do Business</GooeyButton>
      </div>
    </section>

    <OnboardingChecklist class="reveal" />
    <TeamInvite class="reveal" />
    <IntegrationsCard class="reveal" />

    <section class="compare reveal" aria-labelledby="compare-title">
      <h2 id="compare-title">Por que times trocam para o Novexo</h2>
      <p class="sub">Compare com as ferramentas que você usa hoje e veja a diferença.</p>
      <div class="card">
        <a v-for="c in COMPARE" :key="c.slug" href="#" class="compare__chip" @click.prevent>
          <img :src="`https://cdn.simpleicons.org/${c.slug}`" alt="" width="15" height="15" loading="lazy" />
          Comparar com o {{ c.name }}
        </a>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 2.75rem; width: 100%; max-width: 50rem; margin: 0 auto; padding: 2.75rem 1.5rem 4rem; }
.hello h1 { display: flex; flex-wrap: wrap; gap: 0 0.3em; margin: 0 0 0.4rem; font: 700 clamp(1.5rem, 2.4vw, 1.875rem)/1.2 'Geist', system-ui, sans-serif; letter-spacing: -0.02em; color: var(--text); }
.hello__word { display: inline-block; }
.hello__sub { margin: 0; color: var(--muted); }

.trial { display: flex; flex-direction: column; align-items: flex-start; gap: 0.6rem; padding: 1.25rem; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
.trial__icon { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 7px; background: rgb(229 101 21 / 0.14); color: var(--accent-soft); }
.trial h2 { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; margin: 0.25rem 0 0; font: 600 1.0625rem/1.3 'Geist', system-ui, sans-serif; color: var(--text); }
.badge { padding: 0.15rem 0.45rem; border-radius: 4px; background: rgb(251 164 92 / 0.16); font-size: 12px; font-weight: 500; color: var(--accent-soft); }
.trial p { margin: 0; max-width: 60ch; color: var(--muted); }
.trial__btns { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.35rem; }

h2 { margin: 0 0 0.25rem; font: 600 1.25rem/1.2 'Geist', system-ui, sans-serif; color: var(--text); }
.sub { margin: 0 0 0.9rem; color: var(--muted); }
.card { display: flex; flex-wrap: wrap; gap: 0.6rem; padding: 1.25rem; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
.compare__chip { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.75rem; border: 1px solid var(--line-strong); border-radius: 6px; background: var(--surface-2); font-weight: 500; color: var(--text); text-decoration: none; transition: border-color 0.2s var(--ease), translate 0.2s var(--ease); }
.compare__chip:hover { border-color: var(--accent); translate: 0 -2px; }
.compare__chip:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
</style>
