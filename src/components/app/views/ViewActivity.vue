<script setup>
import { onMounted, ref } from 'vue'
import { useWorkspace } from '../../../composables/useWorkspace'

const props = defineProps({ projectId: { type: [String, Number], required: true } })
const { projectActivity } = useWorkspace()
const items = ref(null)
const error = ref('')
onMounted(async () => {
  try { items.value = await projectActivity(props.projectId) } catch (e) { error.value = e.message; items.value = [] }
})
const when = (iso) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
</script>

<template>
  <div class="feed">
    <p v-if="!items" class="muted">Carregando…</p>
    <p v-else-if="error" class="muted">{{ error }}</p>
    <p v-else-if="!items.length" class="muted">Nada aconteceu neste projeto ainda.</p>
    <ol v-else>
      <li v-for="a in items" :key="a.id"><span class="dot" /><p>{{ a.text }}</p><time>{{ when(a.at) }}</time></li>
    </ol>
  </div>
</template>

<style scoped>
.feed { max-width: 44rem; }
ol { margin: 0; padding: 0 0 0 0.5rem; list-style: none; border-left: 2px solid var(--line); }
li { position: relative; display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.25rem 0.75rem; padding: 0.55rem 0 0.55rem 1rem; }
.dot { position: absolute; left: -0.45rem; top: 0.85rem; width: 9px; height: 9px; border-radius: 50%; background: var(--accent); }
p { margin: 0; font-size: 13.5px; color: var(--text); }
time { font-size: 11.5px; color: var(--muted); }
.muted { margin: 0; padding: 1rem 0; color: var(--muted); }
</style>
