<script setup>
// Nav no padrão do leonardo.ai: header fixo e transparente, menu centralizado, megamenus que se cruzam (fade + sobe 20px),
// camada "glossy" com blur que aparece quando o conteúdo passa por baixo, botões gooey e menu hambúrguer no mobile
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import GooeyButton from '../GooeyButton.vue'
import AccountMenu from '../app/AccountMenu.vue'
import { useAuth } from '../../composables/useAuth'
import { MENU, ICONS, PRODUCT_LINKS } from './navData'

const { user } = useAuth() // logado: troca "Entrar" por Workspace + foto
const active = ref(null)
const scrolled = ref(false)
const mobileOpen = ref(false)
const mobileSection = ref(null)
let closeTimer
const route = useRoute()
watch(() => route.fullPath, () => { active.value = null; mobileOpen.value = false; mobileSection.value = null })

const open = (id) => {
  clearTimeout(closeTimer)
  active.value = id
}
const scheduleClose = () => {
  clearTimeout(closeTimer)
  closeTimer = setTimeout(() => (active.value = null), 140)
}
const toggle = (id) => (active.value = active.value === id ? null : id)

const onScroll = () => (scrolled.value = scrollY > 8)
const onKey = (e) => {
  if (e.key === 'Escape') {
    active.value = null
    mobileOpen.value = false
  }
}

onMounted(() => {
  onScroll()
  addEventListener('scroll', onScroll, { passive: true })
  addEventListener('keydown', onKey)
})
onUnmounted(() => {
  clearTimeout(closeTimer)
  removeEventListener('scroll', onScroll)
  removeEventListener('keydown', onKey)
  document.documentElement.style.overflow = ''
})
watch(mobileOpen, (v) => (document.documentElement.style.overflow = v ? 'hidden' : ''))
</script>

<template>
  <header class="nav" :class="{ 'is-glossy': scrolled || active || mobileOpen }">
    <div class="nav__glossy" aria-hidden="true" />

    <div class="nav__bar">
      <RouterLink to="/#topo" class="nav__logo" aria-label="Novexo, início">NOVEXO</RouterLink>

      <nav class="nav__menu" aria-label="Principal" @mouseleave="scheduleClose">
        <div
          v-for="item in MENU"
          :key="item.id"
          class="nav__item"
          @mouseenter="item.columns ? open(item.id) : scheduleClose()"
        >
          <button
            v-if="item.columns"
            type="button"
            class="nav__link"
            :aria-expanded="active === item.id"
            :aria-controls="`mm-${item.id}`"
            @click="toggle(item.id)"
          >
            {{ item.label }}
            <svg
              class="nav__chev"
              :class="{ 'is-open': active === item.id }"
              viewBox="0 0 14 14"
              aria-hidden="true"
            >
              <path
                d="M2.6 5.5l4.5 4 4.5-4"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
              />
            </svg>
          </button>
          <RouterLink
            v-else
            :to="item.href?.startsWith('#') ? `/${item.href}` : item.href"
            class="nav__link"
            >{{ item.label }}</RouterLink
          >
        </div>
      </nav>

      <div class="nav__actions">
        <GooeyButton variant="secondary" to="/blog/como-funciona">Tutorial</GooeyButton>
        <template v-if="user">
          <GooeyButton variant="primary" to="/inicio">Workspace</GooeyButton>
          <AccountMenu :size="36" ring />
        </template>
        <GooeyButton v-else variant="primary" to="/login">Entrar</GooeyButton>
      </div>

      <button
        type="button"
        class="burger"
        :class="{ 'is-active': mobileOpen }"
        :aria-expanded="mobileOpen"
        aria-label="Abrir menu"
        @click="mobileOpen = !mobileOpen"
      >
        <span /><span /><span />
      </button>
    </div>

    <!-- Megamenus: todos montados, só o ativo fica visível (assim um some enquanto o outro entra) -->
    <div
      v-for="item in MENU.filter((m) => m.columns)"
      :id="`mm-${item.id}`"
      :key="item.id"
      class="mm"
      :class="{ 'is-active': active === item.id }"
      :inert="active !== item.id"
      @mouseenter="open(item.id)"
      @mouseleave="scheduleClose"
    >
      <div class="mm__panel">
        <div v-for="(col, ci) in item.columns" :key="ci" class="mm__col">
          <div v-for="(g, gi) in col" :key="gi" class="mm__group">
            <span v-if="g.group" class="mm__title">{{ g.group }}</span>
            <RouterLink
              v-for="it in g.items"
              :key="it.title"
              :to="it.to || PRODUCT_LINKS[it.title] || '/#topo'"
              class="mm__item"
              @click="active = null"
            >
              <svg class="mm__icon" viewBox="0 0 24 24" aria-hidden="true">
                <path :d="ICONS[it.icon]" />
              </svg>
              <span class="mm__text">
                <span class="roll"
                  ><span class="roll__in"
                    ><span>{{ it.title }}</span
                    ><span aria-hidden="true">{{ it.title }}</span></span
                  ></span
                >
                <span class="mm__desc">{{ it.desc }}</span>
              </span>
            </RouterLink>
            <RouterLink
              v-for="l in g.links"
              :key="l"
              :to="PRODUCT_LINKS[l] || '/#topo'"
              class="mm__plain"
              @click="active = null"
              >{{ l }}</RouterLink
            >
            <RouterLink v-if="g.more" to="/#topo" class="mm__more" @click="active = null"
              >{{ g.more }} <span aria-hidden="true">→</span></RouterLink
            >
          </div>
        </div>
        <RouterLink :to="item.feature.to || '#topo'" class="mm__feature" @click="active = null">
          <img :src="item.feature.art" alt="" class="mm__art" loading="lazy" />
          <span class="mm__feature-title">{{ item.feature.title }}</span>
          <span class="mm__feature-cta">{{ item.feature.cta }}</span>
        </RouterLink>
      </div>
    </div>

    <!-- Menu mobile -->
    <div class="mob" :class="{ 'is-open': mobileOpen }" :inert="!mobileOpen" data-lenis-prevent>
      <div class="mob__list">
        <div v-for="item in MENU" :key="item.id" class="mob__item">
          <button
            v-if="item.columns"
            type="button"
            class="mob__link"
            :aria-expanded="mobileSection === item.id"
            @click="mobileSection = mobileSection === item.id ? null : item.id"
          >
            {{ item.label }}
            <svg
              class="nav__chev"
              :class="{ 'is-open': mobileSection === item.id }"
              viewBox="0 0 14 14"
              aria-hidden="true"
            >
              <path
                d="M2.6 5.5l4.5 4 4.5-4"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
              />
            </svg>
          </button>
          <RouterLink
            v-else
            :to="item.href?.startsWith('#') ? `/${item.href}` : item.href"
            class="mob__link"
            @click="mobileOpen = false"
            >{{ item.label }}</RouterLink
          >
          <div
            v-if="item.columns"
            class="mob__sub"
            :class="{ 'is-open': mobileSection === item.id }"
          >
            <div>
              <template v-for="col in item.columns">
                <template v-for="g in col">
                  <RouterLink
                    v-for="it in g.items"
                    :key="it.title"
                    :to="it.to || PRODUCT_LINKS[it.title] || '/#topo'"
                    class="mob__subitem"
                    @click="mobileOpen = false"
                  >
                    <svg class="mm__icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path :d="ICONS[it.icon]" /></svg
                    >{{ it.title }}
                  </RouterLink>
                  <RouterLink
                    v-for="l in g.links"
                    :key="l"
                    :to="PRODUCT_LINKS[l] || '/#topo'"
                    class="mob__subitem"
                    @click="mobileOpen = false"
                    >{{ l }}</RouterLink
                  >
                </template>
              </template>
            </div>
          </div>
        </div>
      </div>
      <div class="mob__actions">
        <GooeyButton variant="secondary" size="lg" to="/blog/como-funciona" @click="mobileOpen = false">Tutorial</GooeyButton>
        <GooeyButton v-if="user" variant="primary" size="lg" to="/inicio">Workspace</GooeyButton>
        <GooeyButton v-else variant="primary" size="lg" to="/login">Entrar</GooeyButton>
      </div>
    </div>
  </header>
</template>

<style scoped>
.nav {
  position: fixed;
  inset: 0 0 auto;
  z-index: 50;
  color: var(--lp-white);
}
.nav__glossy {
  position: absolute;
  inset: 0;
  background: rgb(0 0 0 / 0.1);
  backdrop-filter: blur(12px) saturate(1.4);
  -webkit-backdrop-filter: blur(12px) saturate(1.4);
  opacity: 0;
  transition: opacity 0.5s;
  pointer-events: none;
}
.nav.is-glossy .nav__glossy {
  opacity: 1;
}

/* A barra fica acima dos megamenus (senão o painel aberto cobre os links e não dá para trocar
   de categoria), mas o espaço vazio dela deixa o mouse passar para o painel embaixo. */
.nav__bar {
  position: relative;
  z-index: 80;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
}
@media (min-width: 640px) {
  .nav__bar {
    padding: 0.5rem 1.5rem;
  }
}
@media (min-width: 1100px) {
  .nav__bar {
    padding: 1.5rem 2rem;
  }
}
.nav__bar > *,
.nav__item {
  pointer-events: auto;
}
.nav__menu {
  pointer-events: none;
}

.nav__logo {
  position: relative;
  z-index: 2;
  font: 800 1.5rem/1 var(--lp-display);
  letter-spacing: -0.02em;
  color: var(--lp-white);
  text-decoration: none;
}

.nav__menu {
  position: absolute;
  left: 50%;
  translate: -50% 0;
  display: none;
  gap: 2.5rem;
}
@media (min-width: 1100px) {
  .nav__menu {
    display: flex;
  }
}

.nav__link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0;
  border: 0;
  background: none;
  font: 500 0.875rem/1.25 var(--lp-sans);
  color: var(--lp-white);
  text-decoration: none;
  cursor: pointer;
}
.nav__link:focus-visible {
  outline: 2px solid var(--lp-orange-soft);
  outline-offset: 4px;
  border-radius: 4px;
}
.nav__chev {
  width: 12px;
  height: 12px;
  margin-top: 2px;
  transition: transform 0.2s;
}
.nav__chev.is-open {
  transform: rotate(180deg);
}

.nav__actions { display: none; align-items: center; gap: 0.75rem; }
/* foto do usuário logado: anel fino que acende no hover */
.nav__me { display: grid; border-radius: 50%; box-shadow: 0 0 0 2px rgb(255 255 255 / 0.18); transition: box-shadow 0.25s, transform 0.25s; }
.nav__me:hover { box-shadow: 0 0 0 2px var(--lp-orange-soft); transform: scale(1.05); }
.nav__me:focus-visible { outline: 2px solid var(--lp-orange-soft); outline-offset: 3px; }
.nav__me :deep(.avatar) { background: linear-gradient(135deg, var(--lp-orange-soft), var(--lp-orange)); color: #000; font: 700 0.8rem/1 var(--lp-display); }
@media (min-width: 640px) { .nav__actions { display: flex; } }
@media (max-width: 1099px) { .nav__actions { margin-left: auto; margin-right: 0.75rem; } }

/* ----- Megamenu ----- */
.mm {
  position: fixed;
  left: 50%;
  top: 26px;
  z-index: 60;
  padding-top: 1.5rem;
  /* centraliza no transform (e não com translate: o minificador do build apagava o translate quando havia transform) */
  transform: translate(-50%, 20px);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition:
    opacity 0.3s ease,
    transform 0.5s cubic-bezier(0.16, 1, 0.3, 1),
    visibility 0s 0.3s;
}
.mm.is-active {
  z-index: 70;
  transform: translate(-50%, 0);
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transition:
    opacity 0.35s ease,
    transform 0.5s cubic-bezier(0.16, 1, 0.3, 1),
    visibility 0s;
}
@media (max-width: 1099px) {
  .mm {
    display: none;
  }
}

.mm__panel {
  display: flex;
  flex-wrap: wrap;
  gap: 2.5rem 4rem;
  width: max-content;
  max-width: calc(100vw - 2rem); /* entre 1100 e ~1200px de tela o painel mais largo não cabia */
  padding: 2.5rem 3.5rem;
  border-radius: 12px;
  background: #111111;
  color: rgb(255 255 255 / 0.5);
  box-shadow:
    0 20px 25px -5px rgb(0 0 0 / 0.1),
    0 8px 10px -6px rgb(0 0 0 / 0.1);
}
.mm__col {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 13rem;
}
.mm__group {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.mm__title {
  font: 500 0.875rem/1 var(--lp-sans);
  color: rgb(255 255 255 / 0.5);
}

.mm__item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  color: inherit;
  text-decoration: none;
}
.mm__icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  fill: none;
  stroke: var(--lp-white);
  stroke-width: 1.8;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.mm__text {
  display: flex;
  flex-direction: column;
}
.mm__desc {
  margin-top: 0.25rem;
  font: 400 0.875rem/1.3 var(--lp-sans);
}

/* Título que "rola" pra cima no hover: duas cópias empilhadas, o wrapper sobe 100% */
.roll {
  position: relative;
  display: block;
  overflow: hidden;
  font: 400 1.0625rem/1.3 var(--lp-sans);
  color: var(--lp-white);
}
.roll__in {
  position: relative;
  display: block;
  transition: transform 0.3s;
}
.roll__in > span {
  display: block;
  white-space: nowrap;
}
.roll__in > span + span {
  position: absolute;
  top: 100%;
  left: 0;
  color: var(--lp-orange-soft);
}
.mm__item:hover .roll__in,
.mm__item:focus-visible .roll__in {
  transform: translateY(-100%);
}

.mm__plain {
  font: 400 1.0625rem/1.3 var(--lp-sans);
  color: var(--lp-white);
  text-decoration: none;
  transition: color 0.2s;
}
.mm__plain:hover {
  color: var(--lp-orange-soft);
}
.mm__more {
  margin-top: 0.5rem;
  font: 400 0.8125rem/1 var(--lp-sans);
  color: rgb(255 255 255 / 0.6);
  text-decoration: none;
}
.mm__more:hover {
  color: var(--lp-white);
}

.mm__feature {
  isolation: isolate;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.75rem;
  width: 220px;
  min-height: 300px;
  padding: 1rem;
  overflow: hidden;
  border-radius: 8px;
  color: var(--lp-white);
  text-decoration: none;
}
.mm__art { position: absolute; inset: 0; z-index: -2; width: 100%; height: 100%; object-fit: cover; transform: scale(1.45); transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.mm__feature:hover .mm__art { transform: scale(1.52); }
.mm__feature::after { content: ''; position: absolute; inset: 40% 0 0; z-index: -1; background: linear-gradient(transparent, rgb(0 0 0 / 0.9)); }
/* Passar o mouse num item apaga um pouco os outros, para destacar o que está sob o cursor */
.mm__item, .mm__plain, .mm__feature { transition: opacity 0.25s; }
.mm__panel:has(:is(.mm__item, .mm__plain, .mm__feature):is(:hover, :focus-visible)) :is(.mm__item, .mm__plain, .mm__feature):not(:hover, :focus-visible) { opacity: 0.35; }
.mm__feature-title { font: 600 1.125rem/1.2 var(--lp-sans); }
.mm__feature-cta {
  align-self: flex-start;
  padding: 0.35rem 1rem;
  border-radius: 999px;
  border: 1.5px solid rgb(255 255 255 / 0.35);
  font: 500 0.9375rem/1.3 var(--lp-sans);
  transition:
    background 0.3s,
    color 0.3s;
}
.mm__feature:hover .mm__feature-cta {
  background: var(--lp-white);
  color: #000;
}

/* ----- Hambúrguer (3 linhas → X) ----- */
.burger {
  position: relative;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}
@media (min-width: 1100px) {
  .burger {
    display: none;
  }
}
.burger span {
  position: absolute;
  width: 22px;
  height: 2px;
  border-radius: 2px;
  background: var(--lp-white);
  transition:
    transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.2s;
}
.burger span:nth-child(1) {
  transform: translateY(-7px);
}
.burger span:nth-child(3) {
  transform: translateY(7px);
}
.burger.is-active span:nth-child(1) {
  transform: rotate(45deg);
}
.burger.is-active span:nth-child(2) {
  opacity: 0;
}
.burger.is-active span:nth-child(3) {
  transform: rotate(-45deg);
}

.mob {
  position: fixed;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 5rem 1.25rem 2rem;
  overflow-y: auto;
  background: #000;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-12px);
  transition:
    opacity 0.3s,
    transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    visibility 0s 0.4s;
}
.mob.is-open {
  opacity: 1;
  visibility: visible;
  transform: none;
  transition:
    opacity 0.3s,
    transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
@media (min-width: 1100px) {
  .mob {
    display: none;
  }
}
.mob__item {
  border-bottom: 1px solid rgb(255 255 255 / 0.1);
}
.mob__link {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  border: 0;
  background: none;
  color: var(--lp-white);
  font: 800 1.5rem/1 var(--lp-display);
  text-transform: uppercase;
  text-decoration: none;
  text-align: left;
  cursor: pointer;
}
.mob__link .nav__chev {
  width: 18px;
  height: 18px;
}
.mob__sub {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.mob__sub.is-open {
  grid-template-rows: 1fr;
}
.mob__sub > div {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.mob__sub.is-open > div {
  padding-bottom: 1rem;
}
.mob__subitem {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  color: rgb(255 255 255 / 0.75);
  font: 400 1rem/1.3 var(--lp-sans);
  text-decoration: none;
}
.mob__subitem .mm__icon {
  width: 22px;
  height: 22px;
}
.mob__actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 2rem;
}

@media (prefers-reduced-motion: reduce) {
  .mm,
  .mm.is-active,
  .mob,
  .mob.is-open,
  .roll__in {
    transition: none;
  }
}
</style>
