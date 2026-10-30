<script setup>
import '@flaticon/flaticon-uicons/css/regular/rounded.css'
import { BRAND, FI } from './icons'

defineProps({ name: { type: String, required: true }, size: { type: Number, default: 18 } })
</script>

<template>
  <svg v-if="BRAND[name]" class="app-icon app-icon--brand" :width="size" :height="size" viewBox="0 0 24 24" aria-hidden="true"><path :d="BRAND[name]" /></svg>
  <i v-else class="app-icon" :class="`fi-rr-${FI[name] || name}`" :style="{ fontSize: `${size}px` }" aria-hidden="true" />
</template>

<style scoped>
.app-icon { display: inline-flex; flex-shrink: 0; align-items: center; justify-content: center; width: 1em; height: 1em; font-style: normal; line-height: 1; }
.app-icon::before { display: block; line-height: 1; }
.app-icon--brand { width: auto; height: auto; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
</style>
