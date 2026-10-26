<script setup>
import '../assets/landing.css'
import SiteNav from '../components/landing/SiteNav.vue'
import HeroParallax from '../components/landing/HeroParallax.vue'
import FeatureList from '../components/landing/FeatureList.vue'
import PricingPlans from '../components/landing/PricingPlans.vue'
import ContactCta from '../components/landing/ContactCta.vue'
import SiteFooter from '../components/landing/SiteFooter.vue'
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
