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
    <PricingPlans />
    <ContactCta />
    <SiteFooter />
  </div>
</template>
