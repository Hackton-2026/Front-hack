<script setup>
// Ícone do projeto (Flaticon UIcons). Sem ícone, mostra um quadradinho na cor do projeto.
import '@flaticon/flaticon-uicons/css/regular/rounded.css'
import { computed } from 'vue'
import { iconClass } from './projectIcons'

const props = defineProps({ icon: { type: String, default: '' }, color: { type: String, default: '' }, size: { type: Number, default: 16 } })
const name = computed(() => iconClass(props.icon))
</script>

<template>
  <i v-if="name" :class="name" class="pi" :style="{ '--s': `${size}px`, color: color || undefined }" aria-hidden="true" />
  <span v-else class="pi-sq" :style="{ '--s': `${Math.round(size * 0.6)}px`, background: color }" aria-hidden="true" />
</template>

<style scoped>
.pi { display: inline-grid; place-items: center; flex-shrink: 0; width: var(--s); height: var(--s); font-size: var(--s); line-height: 1; }
.pi::before { display: block; line-height: 1; }
.pi-sq { display: inline-block; flex-shrink: 0; width: var(--s); height: var(--s); border-radius: 3px; }
</style>
