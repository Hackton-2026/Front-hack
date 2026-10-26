<script setup>
defineProps({ product: { type: Object, required: true } })
</script>

<template>
  <article class="product card">
    <div class="cover">
      <img v-if="product.image" :src="product.image" :alt="product.name" loading="lazy" />
      <span v-else class="placeholder">{{ product.name[0] }}</span>
    </div>
    <div class="body">
      <h3>{{ product.name }}</h3>
      <p v-if="product.description" class="muted small desc">{{ product.description }}</p>
      <p class="muted small">por {{ product.owner }} · {{ new Date(product.created_at).toLocaleDateString('pt-BR') }}</p>
      <div class="row"><slot name="actions" /></div>
    </div>
  </article>
</template>

<style scoped>
.product { padding: 0; overflow: hidden; display: flex; flex-direction: column; }
.cover { aspect-ratio: 3 / 2; background: var(--color-surface-2); display: grid; place-items: center; }
.cover img { width: 100%; height: 100%; object-fit: cover; }
.placeholder { font-size: 2rem; font-weight: 600; color: var(--color-muted); text-transform: uppercase; }
.body { padding: var(--space-3); display: flex; flex-direction: column; gap: var(--space-1); flex: 1; }
.body h3 { margin: 0; font-size: var(--font-size); }
.body .small { font-size: var(--font-size-xs); }
.body p { margin: 0; }
.desc { display: -webkit-box; -webkit-line-clamp: 3; line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.row { margin-top: auto; padding-top: var(--space-2); }
</style>
