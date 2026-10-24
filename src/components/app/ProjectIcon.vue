<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({ icon: { type: String, default: '' } })

// Projetos criados nas versões novas podem guardar uma classe Flaticon.
// Nesta versão, usamos um SVG de pasta para esses valores e preservamos emojis.
const isFontIcon = computed(() => /(?:^|\s)fi(?:-[\w-]+)?(?:\s|$)/.test(props.icon))
</script>

<template>
  <span class="project-icon" aria-hidden="true">
    <AppIcon v-if="isFontIcon" name="folder" class="project-icon__fallback" />
    <template v-else>{{ icon }}</template>
  </span>
</template>

<style scoped>
.project-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1em;
  height: 1em;
  flex-shrink: 0;
  line-height: 1;
  vertical-align: middle;
}
.project-icon__fallback {
  width: 1em;
  height: 1em;
}
</style>
