<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import '../assets/landing.css'
import SiteNav from '../components/landing/SiteNav.vue'
import SiteFooter from '../components/landing/SiteFooter.vue'
import GooeyButton from '../components/GooeyButton.vue'
import BlogCard from '../components/landing/BlogCard.vue'
import FlaticonIcon from '../components/FlaticonIcon.vue'
import { BLOG_CATEGORIES, BLOG_POSTS, filterPosts } from '../data/blog'
import sunset from '../assets/landing/footer-sunset.webp'
import { useEditorialMotion } from '../composables/useEditorialMotion'

const category = ref('Todas')
const query = ref('')
const visibleLimit = ref(6)
const filtered = computed(() => filterPosts(category.value, query.value))
const visible = computed(() => filtered.value.slice(0, visibleLimit.value))
const pageRoot = ref(null)
useEditorialMotion(pageRoot, { page: 'blog', items: visible })
watch([category, query], () => { visibleLimit.value = 6 })
function resetFilters() { category.value = 'Todas'; query.value = '' }
let previousTitle
onMounted(() => {
  previousTitle = document.title
  document.title = 'Blog Novexo | Novidades, ideias e próximos passos'
})
onUnmounted(() => { document.title = previousTitle })
</script>

<template>
  <div id="topo" class="lp news">
    <a href="#novidades" class="news__skip">Pular para as publicações</a>
    <SiteNav />
    <main ref="pageRoot" class="news__main">
      <header class="news-heading">
        <div class="news-heading__row"><h1>O trabalho evolui.<br><em>A conversa também.</em></h1></div>
      </header>

      <section class="news-feature" aria-labelledby="featured-title">
        <img :src="sunset" class="news-feature__photo" alt="" fetchpriority="high" />
        <div class="news-feature__shade" />
        <div class="news-feature__content"><h2 id="featured-title">Como funciona<br><em>o Novexo.</em></h2><p>Veja como criar um projeto, organizar tarefas e acompanhar o trabalho do seu time.</p><GooeyButton variant="primary" to="/blog/como-funciona">Veja como funciona <span aria-hidden="true"><FlaticonIcon name="arrow-up-right" /></span></GooeyButton></div>
        <div class="news-feature__bottom"><span>PLANEJE UMA VEZ. ENTREGUE SEMPRE.</span><span>UM ESPAÇO. NOVAS POSSIBILIDADES. <FlaticonIcon name="arrow-up-right" /></span></div>
      </section>

      <section id="novidades" class="news-feed" aria-labelledby="feed-title">
        <div class="news-feed__heading"><h2 id="feed-title">Últimas do Novexo<span>{{ String(BLOG_POSTS.length).padStart(2, '0') }}</span></h2><label class="news-search"><FlaticonIcon name="search" :size="16" /><span class="sr-only">Buscar publicações</span><input v-model="query" type="search" placeholder="O que você quer explorar?" /><button v-if="query" type="button" aria-label="Limpar busca" @click="query = ''"><FlaticonIcon name="cross" :size="10" /></button></label></div>
        <div class="news-filters" role="group" aria-label="Filtrar publicações por categoria"><button v-for="item in BLOG_CATEGORIES" :key="item" type="button" :aria-pressed="category === item" @click="category = item">{{ item }}<span v-if="category === item" aria-hidden="true"><FlaticonIcon name="arrow-up-right" /></span></button></div>
        <p class="sr-only" role="status">{{ filtered.length }} {{ filtered.length === 1 ? 'publicação encontrada' : 'publicações encontradas' }}. Mostrando {{ visible.length }}.</p>
        <div v-if="visible.length" class="news-grid"><BlogCard v-for="post in visible" :key="post.slug" :post="post" /></div>
        <div v-else class="news-empty"><FlaticonIcon name="search" framed :size="22" /><h3>Nenhuma ideia por aqui. Ainda.</h3><p>Tente outro termo ou explore todas as publicações.</p><button type="button" @click="resetFilters">Limpar filtros <span aria-hidden="true"><FlaticonIcon name="arrow-up-right" /></span></button></div>
        <div v-if="filtered.length" class="news-pagination"><span>Mostrando {{ String(visible.length).padStart(2, '0') }} de {{ String(filtered.length).padStart(2, '0') }} publicações</span><GooeyButton v-if="filtered.length > 6" variant="secondary" :disabled="visible.length >= filtered.length" @click="visibleLimit += 6">{{ visible.length >= filtered.length ? 'Você está em dia' : 'Carregar mais' }} <FlaticonIcon :name="visible.length >= filtered.length ? 'check' : 'plus'" :size="14" /></GooeyButton><span v-else class="news-pagination__end">Você está em dia </span></div>
      </section>

      <section class="news-next" aria-labelledby="next-title"><span class="news-kicker">DA LEITURA PARA A PRÁTICA</span><div><h2 id="next-title">Boas ideias merecem<br><em>um próximo passo.</em></h2><GooeyButton to="/login" variant="primary" size="lg">Começar no Novexo <span aria-hidden="true"><FlaticonIcon name="arrow-up-right" /></span></GooeyButton></div><p>Organize o que importa. Abra espaço para o que vem depois.</p></section>
    </main>
    <SiteFooter blend-from-black />
  </div>
</template>

<style scoped>
.news { --news-line: #ffffff26; }.news :is(a, button, input):focus-visible { outline: 2px solid var(--lp-orange-soft); outline-offset: 5px; }.news__skip { position: fixed; top: 12px; left: 20px; z-index: 100; padding: 12px 20px; background: #fff; color: #000; transform: translateY(-160%); }.news__skip:focus { transform: none; }.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.news__main { max-width: 1320px; padding: 147px 48px 0; margin-inline: auto; }.news-heading { margin-bottom: 45px; }.news-kicker { display: inline-flex; align-items: center; gap: 9px; font: 10px/1.5 var(--font-mono); color: var(--lp-orange-soft); letter-spacing: .08em; }.news-kicker i { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--lp-orange); }.news-heading__row { display: flex; align-items: flex-end; justify-content: space-between; gap: 55px; padding-top: 25px; }.news-heading h1 { margin: 0; color: #f8f5f0; font: 600 clamp(42px, 4.6vw, 62px)/1.08 var(--lp-hero); letter-spacing: -.065em; }.news-heading h1 em { color: #ddd4c9; font-family: var(--font-serif); font-weight: 400; letter-spacing: -.03em; }
.news-feature { position: relative; isolation: isolate; display: flex; flex-direction: column; justify-content: space-between; min-height: 510px; padding: 26px 35px 24px; overflow: hidden; border: 1px solid #ffffff30; border-radius: 12px; background: #6c3b22; }.news-feature__photo, .news-feature__shade { position: absolute; z-index: -2; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 70% 55%; }.news-feature__shade { z-index: -1; background: linear-gradient(90deg, #1a0d07e8 0%, #281207a3 45%, #4d261324 80%), linear-gradient(0deg, #170c09d9, transparent 30%, #a653201a 70%); }.news-feature__bottom { display: flex; justify-content: space-between; align-items: center; gap: 20px; font: 8px var(--font-mono); color: #e2c7ad; letter-spacing: .07em; }.news-feature__content { position: relative; z-index: 2; margin-block: auto; padding-block: 30px; max-width: 570px; }.news-feature h2 { margin: 18px 0; color: #fff6ec; font: 600 clamp(39px, 4.5vw, 61px)/1.05 var(--lp-hero); letter-spacing: -.06em; }.news-feature h2 em { color: #ffcc9b; font-family: var(--font-serif); font-weight: 400; letter-spacing: -.025em; }.news-feature__content > p { max-width: 355px; color: #d1bba8; font-size: 12px; line-height: 1.8; margin: 0 0 25px; }
.news-feed { padding-top: 77px; scroll-margin-top: 110px; }.news-feed__heading { display: flex; align-items: center; justify-content: space-between; gap: 25px; margin-bottom: 27px; }.news-feed h2 { display: flex; align-items: flex-start; gap: 12px; margin: 0; color: #eeeae5; font: 500 27px/1.2 var(--lp-hero); letter-spacing: -.05em; }.news-feed h2 > span { margin-top: 2px; font: 10px var(--font-mono); color: #b6a492; letter-spacing: 0; }.news-search { display: flex; align-items: center; gap: 11px; width: 280px; padding: 10px 0; border-bottom: 1px solid #ffffff3d; color: #8f8a82; }.news-search svg { flex-shrink: 0; width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.5; }.news-search input { min-width: 0; width: 100%; padding: 0; border: 0; border-radius: 0; background: transparent; font-size: 11px; color: #eeeae4; }.news-search input::placeholder { color: #a39e96; }.news-search input::-webkit-search-cancel-button { display: none; }.news-search:focus-within { border-color: rgb(248 248 248 / 0.7); }.news-search input:focus-visible { outline: none; }.news-search button { display: grid; place-items: center; width: 18px; height: 18px; padding: 0; border: 0; border-radius: 50%; background: #ffffff16; color: #d0c7bd; font-size: 15px; cursor: pointer; }
.news-filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 34px; padding-bottom: 27px; border-bottom: 1px solid var(--news-line); }.news-filters button { display: inline-flex; align-items: center; gap: 14px; padding: 9px 17px; border: 1px solid #ffffff30; border-radius: 999px; background: transparent; color: #b2aca4; font: 11px var(--lp-sans); cursor: pointer; transition: background .2s, color .2s, border-color .2s; }.news-filters button:hover { color: #fff0e1; border-color: #e56515a0; }.news-filters button[aria-pressed='true'] { color: #1e140b; background: var(--lp-orange-soft); border-color: var(--lp-orange-soft); }.news-filters button > span { font-size: 14px; line-height: .8; }.news-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); column-gap: 27px; row-gap: 48px; }.news-pagination { display: flex; justify-content: space-between; align-items: center; gap: 20px; margin-top: 46px; padding-top: 24px; border-top: 1px solid var(--news-line); }.news-pagination > span { color: #a49e95; font: 9px var(--font-mono); }.news-empty { display: flex; flex-direction: column; align-items: center; min-height: 310px; justify-content: center; text-align: center; padding: 40px 15px; border: 1px dashed #ffffff26; border-radius: 10px; }.news-empty > span { color: var(--lp-orange-soft); font-size: 35px; }.news-empty h3 { margin: 15px 0 10px; color: #eee8df; font-size: 23px; font-weight: 500; letter-spacing: -.04em; }.news-empty p { color: #a7a096; font-size: 13px; margin: 0 0 22px; }.news-empty button { padding: 9px 15px; border: 1px solid #ffffff40; border-radius: 999px; background: transparent; color: #efe4d7; font: 12px var(--lp-sans); cursor: pointer; }.news-empty button > span { margin-left: 16px; color: var(--lp-orange-soft); }
.news-next { position: relative; margin: 90px 0 70px; padding: 35px 0 0; overflow: hidden; border-top: 1px solid var(--news-line); }.news-next > div { position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; gap: 30px; margin-block: 23px; }.news-next h2 { color: #f2ebe3; font: 500 clamp(32px, 3.7vw, 48px)/1.1 var(--lp-hero); letter-spacing: -.05em; margin: 0; }.news-next em { color: var(--lp-orange-soft); font-family: var(--font-serif); font-weight: 400; letter-spacing: -.02em; }.news-next > p { position: relative; color: #a9a197; font-size: 12px; margin: 0; }
@media (max-width: 1050px) { .news__main { padding: 110px 30px 0; }.news-heading__row { gap: 30px; }.news-feature { min-height: 470px; padding-inline: 28px; }.news-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 40px 24px; }.news-feed { padding-top: 60px; } }
@media (max-width: 760px) { .news__main { padding: 95px 20px 0; }.news-heading { margin-bottom: 30px; }.news-heading__row { align-items: flex-start; flex-direction: column; gap: 20px; padding-top: 20px; }.news-heading h1 { font-size: clamp(39px, 7.7vw, 57px); }.news-feature { min-height: 465px; padding: 20px 23px; }.news-feature__content { padding-block: 32px; }.news-feature h2 { font-size: 45px; }.news-feature__bottom { font-size: 6px; }.news-feature__bottom > span:last-child { display: none; }.news-feed__heading { align-items: flex-start; flex-direction: column; gap: 22px; }.news-search { width: 100%; padding-block: 12px; }.news-filters { gap: 7px; padding-bottom: 23px; }.news-filters button { padding: 8px 13px; font-size: 10px; }.news-feed h2 { font-size: 26px; }.news-grid { gap: 36px 18px; }.news-pagination > span { font-size: 8px; }.news-next { margin: 65px 0 50px; }.news-next > div { align-items: flex-start; flex-direction: column; gap: 25px; }.news-next > p { max-width: 250px; } }
@media (max-width: 560px) { .news-grid { grid-template-columns: 1fr; row-gap: 38px; }.news-feature h2 { font-size: 42px; }.news-feature__content > p { max-width: 280px; }.news-pagination { gap: 15px; flex-wrap: wrap; }.news-feed { padding-top: 45px; } }
@media (max-width: 380px) { .news__main { padding-inline: 16px; }.news-heading h1 { font-size: 36px; }.news-feature { padding-inline: 18px; }.news-feature h2 { font-size: 36px; }.news-filters { gap: 6px; }.news-filters button { padding: 8px 11px; } }
</style>
