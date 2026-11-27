<script setup>
import EditorialArt from './EditorialArt.vue'
import FlaticonIcon from '../FlaticonIcon.vue'
import { formatPostDate, postUrl } from '../../data/blog'
defineProps({ post: { type: Object, required: true } })
</script>

<template>
  <article class="blog-card" :data-flip-id="post.slug">
    <RouterLink :to="postUrl(post)" class="blog-card__link">
      <div class="blog-card__cover"><EditorialArt :kind="post.art" :lines="post.coverLine" animated /><span class="blog-card__open" aria-hidden="true"><FlaticonIcon name="arrow-up-right" :size="14" /></span></div>
      <h3>{{ post.title }}</h3>
      <p>{{ post.excerpt }}</p>
      <time :datetime="post.date">{{ formatPostDate(post.date) }}</time>
    </RouterLink>
  </article>
</template>

<style scoped>
.blog-card { min-width: 0; }
.blog-card__link { display: flex; height: 100%; flex-direction: column; text-decoration: none; color: var(--lp-white); }
.blog-card__cover { position: relative; overflow: hidden; border: 1px solid rgb(255 255 255 / 0.12); border-radius: 9px; background: #141413; }
.blog-card__cover :deep(.editorial-art) { transition: transform 0.45s cubic-bezier(0.23, 1, 0.32, 1); }
.blog-card__open {
  position: absolute;
  display: grid;
  place-items: center;
  right: 14px;
  bottom: 14px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgb(255 255 255 / 0.14);
  background: rgb(10 10 10 / 0.56);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #f4f1ec;
  transition: transform 180ms cubic-bezier(0.23, 1, 0.32, 1), background-color 180ms ease, border-color 180ms ease, color 180ms ease;
}
.blog-card h3 { margin: 21px 0 11px; color: #f1efeb; font: 500 clamp(18px, 1.7vw, 23px)/1.24 var(--lp-hero); letter-spacing: -.045em; text-wrap: balance; transition: color 150ms ease; }
.blog-card p { margin: 0 0 24px; color: #a8a39d; font-size: 13px; line-height: 1.7; }
.blog-card time { margin-top: auto; color: #a8a39d; font: 11px var(--font-mono); }
.blog-card__link:focus-visible { outline: 2px solid var(--lp-orange-soft); outline-offset: 7px; border-radius: 8px; }
@media (hover: hover) and (pointer: fine) {
  .blog-card__link:hover .blog-card__cover :deep(.editorial-art) { transform: scale(1.03); }
  .blog-card__link:hover .blog-card__open { transform: translate(1px, -1px); background: #f8f8f8; border-color: #f8f8f8; color: #0a0a0a; }
  .blog-card__link:hover h3 { color: var(--lp-orange-soft); }
}
@media (prefers-reduced-motion: reduce) {
  .blog-card__cover :deep(.editorial-art), .blog-card__open { transition: none; transform: none !important; }
}
</style>
