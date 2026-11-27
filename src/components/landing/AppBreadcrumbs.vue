<script setup>
defineProps({
  items: { type: Array, required: true },
  ariaLabel: { type: String, default: 'Caminho da página' },
})
</script>

<template>
  <nav class="app-breadcrumbs" :aria-label="ariaLabel">
    <template v-for="(item, index) in items" :key="item.label + index">
      <span v-if="index > 0" class="app-breadcrumbs__sep" aria-hidden="true">/</span>
      <RouterLink v-if="item.to && index < items.length - 1" :to="item.to">
        {{ item.label }}
      </RouterLink>
      <span
        v-else
        :aria-current="index === items.length - 1 ? 'page' : undefined"
        class="app-breadcrumbs__current"
      >
        {{ item.label }}
      </span>
    </template>
  </nav>
</template>

<style scoped>
.app-breadcrumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  color: #a4a19d;
  font-size: 12px;
}

.app-breadcrumbs a {
  color: inherit;
  text-decoration: none;
  transition: color 0.18s;
}

.app-breadcrumbs a:hover {
  color: var(--lp-orange-soft, #fba45c);
}

.app-breadcrumbs a:focus-visible {
  outline: 2px solid var(--lp-orange-soft, #fba45c);
  outline-offset: 4px;
}

.app-breadcrumbs__sep {
  color: #625e59;
}

.app-breadcrumbs__current {
  color: #e0deda;
}
</style>
