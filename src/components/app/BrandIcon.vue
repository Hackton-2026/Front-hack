<script setup>
import { computed } from 'vue'

const BRANDS = {
  github: null, gitlab: '#FC6D26', slack: '#E01E5A', notion: null, figma: '#F24E1E', jira: '#2684FF', sentry: '#A78BFA',
  googlecalendar: '#4285F4', googlemeet: '#00AC47', googledrive: '#4285F4', googlemaps: '#34A853', discord: '#5865F2',
  loom: '#625DF5', miro: '#FFD02F', codepen: null, spotify: '#1DB954', typeform: null, excalidraw: '#6965DB', x: null,
}
const props = defineProps({ name: { type: String, required: true }, size: { type: Number, default: 16 } })
const style = computed(() => ({
  '--src': `url(https://cdn.jsdelivr.net/npm/simple-icons@13.21.0/icons/${props.name}.svg)`,
  '--c': BRANDS[props.name] || 'var(--text)',
  width: `${props.size}px`,
  height: `${props.size}px`,
}))
</script>

<template>
  <span class="brand" :style="style" aria-hidden="true" />
</template>

<style scoped>
.brand { display: inline-block; flex: none; background: var(--c); -webkit-mask: var(--src) center / contain no-repeat; mask: var(--src) center / contain no-repeat; }
</style>
