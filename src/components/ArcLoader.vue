<script setup>
// Arco girando para tudo que demora (salvar, enviar, carregar). Herda a cor do texto, então serve em botão claro ou escuro.
// Referência: loading-ui.com/docs/components/arc
const props = defineProps({
  size: { type: [Number, String], default: '1em' },
  thickness: { type: Number, default: 2 },
})
const px = (v) => (typeof v === 'number' ? `${v}px` : v)
</script>

<template>
  <span class="arc" aria-hidden="true" :style="{ '--arc-size': px(props.size), '--arc-width': `${props.thickness}px` }" />
</template>

<style scoped>
.arc {
  display: inline-block;
  flex-shrink: 0;
  width: var(--arc-size);
  height: var(--arc-size);
  margin-right: 0.5em;
  vertical-align: -0.15em;
  border: var(--arc-width) solid color-mix(in srgb, currentColor 18%, transparent);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: arc-spin 0.8s linear infinite;
}
.arc:only-child { margin-right: 0; }
/* girar é o próprio aviso de "estou trabalhando": com menos movimento, só fica mais calmo */
@media (prefers-reduced-motion: reduce) { .arc { animation-duration: 1.6s; } }
@keyframes arc-spin { to { rotate: 360deg; } }
</style>
