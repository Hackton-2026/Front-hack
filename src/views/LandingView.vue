<script setup>
// Landing do Novexo: só monta as seções na ordem, guarda a paleta e liga o smooth scroll
import { onMounted, onUnmounted } from 'vue'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import '../assets/landing.css'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { gsap, prefersReducedMotion } from '../utils/motion'
import SiteNav from '../components/landing/SiteNav.vue'
import HeroParallax from '../components/landing/HeroParallax.vue'
import FeatureList from '../components/landing/FeatureList.vue'
import PricingPlans from '../components/landing/PricingPlans.vue'
import ContactCta from '../components/landing/ContactCta.vue'
import SiteFooter from '../components/landing/SiteFooter.vue'

// Smooth scroll (Lenis) só na landing: o loop dele roda no ticker do GSAP para o ScrollTrigger ficar sincronizado
let lenis
const lenisRaf = (time) => lenis?.raf(time * 1000)
onMounted(() => {
  if (prefersReducedMotion()) return
  lenis = new Lenis({ lerp: 0.08, smoothWheel: true, wheelMultiplier: 0.9, anchors: true })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(lenisRaf)
})
onUnmounted(() => {
  gsap.ticker.remove(lenisRaf)
  lenis?.destroy()
})
</script>

<template>
  <div class="lp" id="topo">
    <SiteNav />
    <HeroParallax />
    <FeatureList />
    <PricingPlans />
    <ContactCta />
    <SiteFooter />
  </div>
</template>

<style scoped>
.lp {
  /* Paleta "Clockwork" das referências + preto do leonardo.ai */
  --lp-orange: #e56515;
  --footer-transition-color: var(--lp-orange);
  --lp-orange-soft: #fba45c;
  --lp-grey: #919599;
  --lp-grey-light: #cdcdcb;
  --lp-white: #f8f8f8;
  --lp-display: 'Lexend', 'Geist', system-ui, sans-serif;
  --lp-hero: 'Inter', 'Geist', system-ui, sans-serif;
  --lp-sans: 'Geist', 'Helvetica Neue', system-ui, sans-serif;
  background: #000;
  color: var(--lp-white);
  font-family: var(--lp-sans);
  overflow-x: clip;
}
:global(html:has(.lp)) { background: #000; }
:global(html:has(.lp) body) { background: #000; }
.lp ::selection { background: var(--lp-orange); color: #000; }
</style>
