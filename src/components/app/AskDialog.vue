<script setup>
import { computed } from 'vue'
import { useUi } from '../../composables/useUi'
import AppModal from './AppModal.vue'

const { ui, answerAsk } = useUi()
const isPrompt = computed(() => ui.ask && ui.ask.value !== null)
const cancel = () => answerAsk(isPrompt.value ? null : false)
const ok = () => answerAsk(isPrompt.value ? ui.ask.value.trim() : true)
</script>

<template>
  <AppModal :open="!!ui.ask" :title="ui.ask?.title || ''" @close="cancel" @submit="ok">
    <p v-if="ui.ask?.message" class="msg">{{ ui.ask.message }}</p>
    <input v-if="isPrompt" v-model="ui.ask.value" :placeholder="ui.ask.placeholder" :aria-label="ui.ask.title" />
    <template #footer>
      <button type="button" class="btn" @click="cancel">Cancelar</button>
      <button type="submit" class="btn" :class="ui.ask?.danger ? 'danger' : 'primary'" :disabled="isPrompt && !ui.ask.value.trim()">{{ ui.ask?.confirmLabel }}</button>
    </template>
  </AppModal>
</template>

<style scoped>
.msg { margin: -0.35rem 0 0; font-size: 13.5px; color: var(--muted); }
</style>
