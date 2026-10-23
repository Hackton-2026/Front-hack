<script setup>
// Resposta da Novexo IA em Markdown (títulos, listas, negrito, código, citação). Usa o mesmo renderizador
// da wiki, que escapa o texto antes: HTML vindo da IA nunca vira HTML de verdade.
import { computed } from 'vue'
import { render } from '../../utils/markdown'

const props = defineProps({ text: { type: String, default: '' } })
const html = computed(() => render(props.text || ''))
</script>

<template>
  <div class="md" v-html="html" />
</template>

<style scoped>
.md { line-height: 1.55; overflow-wrap: anywhere; }
.md :deep(> :first-child) { margin-top: 0; }
.md :deep(> :last-child) { margin-bottom: 0; }
.md :deep(p) { margin: 0.45rem 0; }
.md :deep(h1), .md :deep(h2), .md :deep(h3) { margin: 0.9rem 0 0.35rem; font-family: 'Geist', system-ui, sans-serif; font-weight: 600; line-height: 1.25; color: var(--text); }
.md :deep(h1) { font-size: 1.2rem; }
.md :deep(h2) { font-size: 1.05rem; }
.md :deep(h3) { font-size: 0.95rem; }
.md :deep(ul), .md :deep(ol) { margin: 0.4rem 0; padding-left: 1.3rem; }
.md :deep(li) { margin: 0.15rem 0; }
.md :deep(li input) { display: none; }
.md :deep(strong) { color: var(--text); font-weight: 600; }
.md :deep(code) { padding: 0.05rem 0.3rem; border-radius: 4px; background: var(--surface-2); font: 12.5px/1.4 'Geist Mono', ui-monospace, monospace; }
.md :deep(pre) { margin: 0.5rem 0; padding: 0.6rem 0.75rem; overflow-x: auto; border-radius: 8px; background: var(--bg); }
.md :deep(pre code) { padding: 0; background: none; }
.md :deep(blockquote) { margin: 0.5rem 0; padding: 0.1rem 0 0.1rem 0.75rem; border-left: 3px solid var(--accent); color: var(--muted); }
.md :deep(hr) { margin: 0.8rem 0; border: 0; border-top: 1px solid var(--line); }
.md :deep(a) { color: var(--accent-soft); }
.md :deep(.md-table) { margin: 0.6rem 0; overflow-x: auto; }
.md :deep(table) { width: 100%; border-collapse: collapse; font-size: 13px; }
.md :deep(th), .md :deep(td) { padding: 0.4rem 0.6rem; border: 1px solid var(--line); text-align: left; vertical-align: top; }
.md :deep(th) { background: var(--surface-2); font-weight: 600; color: var(--text); }
</style>
