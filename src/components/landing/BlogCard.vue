<script setup>
import EditorialArt from './EditorialArt.vue'
import FlaticonIcon from '../FlaticonIcon.vue'
import { formatPostDate, postUrl } from '../../data/blog'
defineProps({ post: { type: Object, required: true } })
</script>

<template>
  <article class="blog-card" :data-flip-id="post.slug">
    <RouterLink :to="postUrl(post)" class="blog-card__link">
      <div class="blog-card__cover"><EditorialArt :kind="post.art" :lines="post.coverLine" :label="post.coverLabel" /><span class="blog-card__open" aria-hidden="true"><FlaticonIcon name="arrow-up-right" :size="14" /></span></div>
      <h3>{{ post.title }}</h3>
      <p>{{ post.excerpt }}</p>
      <time :datetime="post.date">{{ formatPostDate(post.date) }}</time>
    </RouterLink>
  </article>
</template>

<style scoped>
.blog-card { min-width: 0; }.blog-card__link { display: flex; height: 100%; flex-direction: column; text-decoration: none; color: var(--lp-white); }.blog-card__cover { position: relative; overflow: hidden; border: 1px solid #ffffff20; border-radius: 9px; background: #222; }.blog-card__cover :deep(.editorial-art) { transition: transform .65s var(--ease); }.blog-card__link:hover .blog-card__cover :deep(.editorial-art) { transform: scale(1.04); }.blog-card__open { position: absolute; display: grid; place-items: center; right: 15px; bottom: 15px; width: 30px; height: 30px; border-radius: 50%; border: 1px solid #ffffff35; background: #0009; color: #fff; font-size: 18px; transform: translateY(6px); opacity: 0; transition: transform .2s, opacity .2s; }.blog-card__link:hover .blog-card__open, .blog-card__link:focus-visible .blog-card__open { opacity: 1; transform: none; }
.blog-card h3 { margin: 21px 0 11px; color: #f1efeb; font: 500 clamp(18px, 1.7vw, 23px)/1.24 var(--lp-hero); letter-spacing: -.045em; text-wrap: balance; transition: color .2s; }.blog-card__link:hover h3 { color: var(--lp-orange-soft); }.blog-card p { margin: 0 0 24px; color: #a8a39d; font-size: 12px; line-height: 1.8; }.blog-card time { margin-top: auto; color: #a8a39d; font: 9px var(--font-mono); }
.blog-card__link:focus-visible { outline: 2px solid var(--lp-orange-soft); outline-offset: 7px; border-radius: 8px; }
@media (prefers-reduced-motion: reduce) { .blog-card__cover :deep(.editorial-art), .blog-card__open { transition: none; } }
.blog-card__open {
  width: 34px;
  height: 34px;
  border-color: rgb(251 164 92 / 0.45);
  color: #ffe0c0;
  background: linear-gradient(145deg, rgb(66 34 15 / 0.9), rgb(16 13 10 / 0.9));
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.1), 0 3px 12px rgb(0 0 0 / 0.18);
  transform: none;
  opacity: 1;
  transition: transform 250ms var(--ease), background 250ms, color 250ms;
}
.blog-card__link:hover .blog-card__open { transform: translateY(-2px); background: var(--lp-orange-soft); color: #24140b; }
@media (prefers-reduced-motion: reduce) { .blog-card__open { transition: none; } }
</style>
