<script setup>
defineProps({
  variant: { type: String, default: 'primary' },
  to: { type: [String, Object], default: null },
  loading: Boolean,
  disabled: Boolean,
  block: Boolean,
  small: Boolean,
  type: { type: String, default: 'button' },
})
</script>

<template>
  <RouterLink v-if="to" :to="to" class="btn" :class="[`btn-${variant}`, { 'btn-block': block, 'btn-sm': small }]"><slot /></RouterLink>
  <button v-else :type="type" class="btn" :class="[`btn-${variant}`, { 'btn-block': block, 'btn-sm': small }]" :disabled="loading || disabled">
    <ArcLoader v-if="loading" /><slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: 0.55rem 1rem;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  text-decoration: none;
  transition: background var(--transition), border-color var(--transition), transform var(--transition);
}
.btn:active { transform: scale(0.98); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-block { width: 100%; padding-block: 0.75rem; }
.btn-sm { padding: 0.35rem 0.7rem; font-size: var(--font-size-xs); }
.btn-primary { background: var(--color-primary); color: var(--color-on-primary); }
.btn-primary:hover { background: var(--color-primary-hover); }
.btn-secondary { background: var(--color-surface); color: var(--color-heading); border-color: var(--color-border); }
.btn-secondary:hover { border-color: var(--color-border-strong); }
.btn-danger { background: transparent; color: var(--color-danger); border-color: var(--pastel-red); }
.btn-danger:hover { background: var(--pastel-red); }
.btn-ghost { background: transparent; color: var(--color-text); }
.btn-ghost:hover { background: var(--color-surface-2); }
</style>
