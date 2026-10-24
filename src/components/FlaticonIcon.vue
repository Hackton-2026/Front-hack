<script setup>
import '@flaticon/flaticon-uicons/css/regular/rounded.css'

defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: null },
  framed: Boolean,
})
</script>

<template>
  <span class="flaticon" :class="[`fi-rr-${name}`, { 'flaticon--framed': framed }]" :style="size ? { fontSize: `${size}px` } : undefined" aria-hidden="true" />
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
.flaticon--framed {
  width: 2.35em;
  height: 2.35em;
  border: 1px solid rgb(229 101 21 / 0.28);
  border-radius: 0.7em;
  color: var(--lp-orange-soft, #fba45c);
  background: linear-gradient(145deg, rgb(251 164 92 / 0.14), rgb(229 101 21 / 0.025));
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.06);
}
</style>
