<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import '../assets/landing.css'
import SiteNav from '../components/landing/SiteNav.vue'
import SiteFooter from '../components/landing/SiteFooter.vue'
import GooeyButton from '../components/GooeyButton.vue'
import EditorialArt from '../components/landing/EditorialArt.vue'
import BlogCard from '../components/landing/BlogCard.vue'
import AppReadingToc from '../components/landing/AppReadingToc.vue'
import AppBreadcrumbs from '../components/landing/AppBreadcrumbs.vue'
import FlaticonIcon from '../components/FlaticonIcon.vue'
import { BLOG_POSTS, formatPostDate } from '../data/blog'
import { usePageTitle } from '../composables/usePageTitle'

const route = useRoute()
const article = ref(null)
const post = computed(() => BLOG_POSTS.find(item => item.slug === route.params.slug))
const related = computed(() => BLOG_POSTS.filter(item => item.slug !== post.value?.slug).sort((a, b) => Number(b.category === post.value?.category) - Number(a.category === post.value?.category)).slice(0, 3))

const breadcrumbs = computed(() =>
  post.value
    ? [{ label: 'Início', to: '/' }, { label: 'Blog', to: '/blog' }, { label: post.value.category }]
    : []
)

const tocItems = computed(() =>
  (post.value?.sections || []).map((section, index) => ({
    id: `secao-${index + 1}`,
    label: `${String(index + 1).padStart(2, '0')}. ${section.title}`,
  }))
)

usePageTitle(() =>
  post.value ? `${post.value.title} | Blog Novexo` : 'Publicação não encontrada | Blog Novexo'
)
</script>

<template>
  <div id="topo" class="lp story">
    <a class="story__skip" href="#artigo">Pular para o artigo</a>
    <SiteNav />
    <main v-if="post" class="story__main">
      <AppBreadcrumbs :items="breadcrumbs" />
      <header class="story__header"><div class="story__intro"><h1>{{ post.title }}</h1><p>{{ post.excerpt }}</p><div class="story__author"><span aria-hidden="true">N</span><div><strong>Equipe Novexo</strong><time :datetime="post.date">{{ formatPostDate(post.date) }}</time></div></div></div><div class="story__cover"><EditorialArt :kind="post.art" :lines="post.coverLine" /></div></header>

      <div class="story__layout">
        <AppReadingToc
          title="Nesta leitura"
          :items="tocItems"
          :target="article"
          nav-label="Índice do artigo"
          aside-label="Navegação do artigo"
        >
          <template #footer>
            <RouterLink to="/blog" class="story__back"><FlaticonIcon name="arrow-small-left" /> Todas as publicações</RouterLink>
          </template>
        </AppReadingToc>
        <article id="artigo" ref="article" class="story__body">
          <section v-for="(section, index) in post.sections" :id="`secao-${index + 1}`" :key="section.title">
            <h2>{{ section.title }}</h2>
            <p v-for="paragraph in section.text" :key="paragraph">{{ paragraph }}</p>
            <div v-if="section.callout" class="story__callout">
              <span class="story__callout-eyebrow">{{ section.callout.eyebrow }}</span>
              <p>{{ section.callout.text }}</p>
              <a :href="section.callout.href" target="_blank" rel="noopener noreferrer" class="story__callout-link">
                {{ section.callout.label }} <FlaticonIcon name="arrow-up-right" :size="13" />
              </a>
            </div>
          </section>
          <div class="story__closing">
            <template v-if="post.cta">
              <h2>{{ post.cta.title }}</h2>
              <p>{{ post.cta.text }}</p>
              <div class="story__closing-actions">
                <GooeyButton v-if="post.cta.external" variant="primary" :href="post.cta.href" target="_blank" rel="noopener noreferrer">{{ post.cta.label }} <FlaticonIcon name="arrow-up-right" /></GooeyButton>
                <GooeyButton v-else variant="primary" :to="post.cta.to || '/blog/como-funciona'">{{ post.cta.label }} <FlaticonIcon name="arrow-up-right" /></GooeyButton>
                <GooeyButton variant="secondary" to="/login">Começar grátis no Novexo</GooeyButton>
              </div>
            </template>
            <template v-else>
              <h2>Leve uma boa ideia<br>para a sua rotina.</h2>
              <p>Conheça o Novexo e encontre um espaço para organizar seu próximo projeto.</p>
              <GooeyButton variant="primary" to="/blog/como-funciona">Veja como funciona <FlaticonIcon name="arrow-up-right" /></GooeyButton>
            </template>
          </div>
        </article>
      </div>

      <section class="story__related" aria-labelledby="related-title"><div><h2 id="related-title">A conversa continua.</h2><RouterLink to="/blog">Explorar o blog <FlaticonIcon name="arrow-up-right" /></RouterLink></div><div class="story__grid"><BlogCard v-for="item in related" :key="item.slug" :post="item" /></div></section>
    </main>
    <main v-else id="artigo" class="story__missing"><h1>Essa leitura ainda<br>não está por aqui.</h1><p>Explore o blog para encontrar outras ideias e próximos passos.</p><GooeyButton to="/blog" variant="primary">Voltar ao blog <FlaticonIcon name="arrow-up-right" /></GooeyButton></main>
    <SiteFooter blend-from-black />
  </div>
</template>

<style scoped>
.story :is(a, button):focus-visible { outline: 2px solid var(--lp-orange-soft); outline-offset: 5px; }.story__skip { position: fixed; top: 12px; left: 20px; z-index: 100; padding: 12px 20px; color: #000; background: #fff; transform: translateY(-160%); }.story__skip:focus { transform: none; }.story__main { max-width: 1320px; padding: 145px 48px 0; margin-inline: auto; }
.story__header { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 50px; padding-block: 50px; border-bottom: 1px solid #ffffff26; }.story__intro { min-width: 0; }.story h1 { margin: 23px 0; color: #f5f0e9; font: 500 clamp(32px, 3.5vw, 47px)/1.09 var(--lp-hero); letter-spacing: -.055em; text-wrap: balance; }.story__intro > p { margin: 0; color: #b2aaa1; font-size: 14px; line-height: 1.8; }.story__author { display: flex; align-items: center; gap: 12px; margin-top: 27px; }.story__author > span { display: grid; place-items: center; position: relative; width: 35px; height: 35px; border: 1px solid #ffffff30; border-radius: 50%; font: 800 16px var(--lp-display); }.story__author > div { display: grid; gap: 3px; font-size: 12px; }.story__author strong { font-weight: 500; color: #e9e0d5; }.story__author time { color: #a69e95; font-size: 11px; }.story__cover { min-width: 0; overflow: hidden; border: 1px solid #ffffff26; border-radius: 10px; }.story__cover :deep(.art-caption) { font-size: clamp(23px, 2.9vw, 36px); }
.story__layout { display: grid; grid-template-columns: 245px minmax(0, 720px); gap: 60px; justify-content: space-between; margin-top: 60px; }
.story__back { display: inline-flex; align-items: center; gap: 6px; color: #e1d5c7; text-decoration: none; font-size: 12px; transition: color .2s; }.story__back:hover { color: var(--lp-orange-soft); }
.story__body { min-width: 0; scroll-margin-top: 120px; }.story__body > section { scroll-margin-top: 125px; padding: 40px 0; border-bottom: 1px solid #ffffff26; }.story__body > section:first-child { padding-top: 0; }.story__body h2 { color: #eee7de; font: 500 clamp(25px, 2.6vw, 33px)/1.2 var(--lp-hero); letter-spacing: -.04em; margin: 0 0 22px; text-wrap: balance; }.story__body p { color: #b7aea3; font-size: 15px; line-height: 1.9; margin: 0 0 18px; }.story__body section p:last-child { margin-bottom: 0; }
.story__callout { margin-top: 24px; padding: 20px 22px; border: 1px solid #e5651540; border-radius: 10px; background: #140d09; }
.story__callout-eyebrow { display: block; margin-bottom: 8px; font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--lp-orange-soft); }
.story__callout p { margin: 0 0 14px !important; font-size: 14px; color: #d1c6ba; }
.story__callout-link { display: inline-flex; align-items: center; gap: 8px; color: var(--lp-orange-soft); font-size: 13px; font-weight: 500; text-decoration: none; }
.story__callout-link:hover { text-decoration: underline; }
.story__closing { margin-top: 40px; padding: 30px; border: 1px solid #e5651540; border-radius: 8px; background: #e565150b; }.story__closing h2 { font-size: 32px; }.story__closing p { font-size: 13px; }
.story__closing-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; margin-top: 18px; }
.story__related { margin-top: 85px; padding: 40px 0 75px; border-top: 1px solid #ffffff26; }.story__related > div:first-child { display: flex; align-items: center; justify-content: space-between; gap: 25px; margin-bottom: 35px; }.story__related h2 { color: #eee7df; font: 500 clamp(29px, 3vw, 39px)/1.1 var(--lp-hero); letter-spacing: -.05em; margin: 0; }.story__related > div > a { font-size: 12px; color: #c5b9ab; text-decoration: none; }.story__grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 27px; }.story__missing { max-width: 900px; min-height: 75vh; margin: auto; padding: 160px 30px 80px; }.story__missing p { color: #b6ada1; margin-bottom: 25px; }
@media (max-width: 1050px) { .story__main { padding: 110px 30px 0; }.story__header { gap: 30px; }.story__layout { grid-template-columns: 190px minmax(0, 1fr); gap: 35px; }.story__grid { gap: 20px; } }
@media (max-width: 760px) { .story__main { padding: 95px 20px 0; }.story__header { grid-template-columns: 1fr; gap: 30px; padding: 35px 0; }.story h1 { font-size: clamp(33px, 6.7vw, 46px); }.story__intro > p { font-size: 13px; }.story__cover :deep(.art-caption) { font-size: 32px; }.story__layout { grid-template-columns: 1fr; gap: 35px; margin-top: 35px; }.story__body > section { scroll-margin-top: 85px; padding-block: 30px; }.story__body p { font-size: 14px; }.story__closing { padding: 24px; }.story__closing h2 { font-size: 29px; }.story__related { margin-top: 55px; padding-block: 30px 55px; }.story__related > div:first-child { align-items: flex-start; flex-direction: column; gap: 18px; }.story__grid { grid-template-columns: 1fr; gap: 35px; }.story__grid :deep(.editorial-art) { aspect-ratio: 1.8; } }
</style>
