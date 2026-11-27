<script setup>
import '@flaticon/flaticon-uicons/css/regular/rounded.css'

defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: null },
})
</script>

<template>
  <span class="flaticon" :class="`fi-rr-${name}`" :style="size ? { fontSize: `${size}px` } : undefined" aria-hidden="true" />
</template>

<style scoped>
.flaticon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1em;
  height: 1em;
  flex-shrink: 0;
  font-style: normal;
  line-height: 1;
  vertical-align: -0.12em;
}
.flaticon::before { display: block; line-height: 1; }
</style>
