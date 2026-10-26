<script setup>
defineOptions({ inheritAttrs: false })
defineProps({ label: String, textarea: Boolean })
const model = defineModel()
</script>

<template>
  <label class="field">
    <span v-if="label" class="field-label">{{ label }}</span>
    <textarea v-if="textarea" v-model="model" v-bind="$attrs" rows="4" />
    <input v-else v-model="model" v-bind="$attrs" />
  </label>
</template>

<style scoped>
.field { display: flex; flex-direction: column; gap: var(--space-1); min-width: 0; }
input, textarea { width: 100%; }
.field-label { font-size: var(--font-size-xs); font-weight: 500; color: var(--color-text); }
</style>
