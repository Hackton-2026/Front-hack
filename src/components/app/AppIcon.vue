<script setup>
import { ICON } from './icons'

defineProps({ name: { type: String, required: true }, size: { type: Number, default: 18 } })
</script>

<template>
  <svg class="app-icon" :width="size" :height="size" viewBox="0 0 24 24" aria-hidden="true"><path :d="ICON[name]" /></svg>
</template>

<style scoped>
.app-icon { flex-shrink: 0; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
</style>
