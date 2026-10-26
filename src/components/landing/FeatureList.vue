<script setup>
import FeatureShowcase from './FeatureShowcase.vue'
import { FEATURES } from './features'
</script>

<template>
  <section id="recursos" class="features" aria-label="Recursos do Novexo">
    <FeatureShowcase v-for="(f, i) in FEATURES" :key="f.id" :feature="f" :reverse="i % 2 === 1" />
  </section>
</template>

<style scoped>
.features {
  display: flex;
  flex-direction: column;
  gap: clamp(6rem, 12vw, 12rem);
  max-width: 125rem;
  margin: 0 auto;
  padding: clamp(5rem, 10vw, 9rem) clamp(1rem, 2.5vw, 3rem) 0;
}
</style>
