<script setup>
import AppIcon from './AppIcon.vue'
import BrandIcon from './BrandIcon.vue'

const INTEGRATIONS = '/ajustes?tab=integrations'
const APPS = [
  { slug: 'github', name: 'GitHub' },
  { slug: 'gitlab', name: 'GitLab' },
  { slug: 'notion', name: 'Notion' },
  { slug: 'slack', name: 'Slack' },
  { slug: 'discord', name: 'Discord' },
  { slug: 'googlecalendar', name: 'Google Agenda' },
  { slug: 'figma', name: 'Figma' },
]
const LINKS = [
  { icon: 'doc', label: 'Documentação' },
  { icon: 'user', label: 'Falar com vendas' },
  { icon: 'chat', label: 'Suporte' },
  { icon: 'keyboard', label: 'Atalhos de teclado' },
]
</script>

<template>
  <div class="power">
    <section class="card apps" aria-labelledby="apps-title">
      <h2 id="apps-title">Turbine seu workspace</h2>
      <div class="chips">
        <RouterLink v-for="a in APPS" :key="a.slug" :to="INTEGRATIONS" class="chip">
          <BrandIcon :name="a.slug" :size="15" />
          Conectar {{ a.name }}
        </RouterLink>
      </div>
      <RouterLink :to="INTEGRATIONS" class="more">Ver todas as integrações <AppIcon name="arrow" :size="14" /></RouterLink>
    </section>
    <nav class="card links" aria-label="Links úteis">
      <a v-for="l in LINKS" :key="l.label" href="#" @click.prevent><AppIcon :name="l.icon" :size="16" />{{ l.label }}</a>
    </nav>
  </div>
</template>

<style scoped>
.power { display: grid; grid-template-columns: minmax(0, 1fr) 13rem; gap: 1rem; }
@media (max-width: 760px) { .power { grid-template-columns: minmax(0, 1fr); } }
.card { padding: 1.25rem; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
h2 { margin: 0 0 1rem; font: 600 1.125rem/1.2 'Geist', system-ui, sans-serif; color: var(--text); }
.chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.chip { text-decoration: none; display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.35rem 0.7rem; border: 1px solid var(--line-strong); border-radius: 6px; background: var(--surface-2); font: 500 13px/1.2 inherit; color: var(--text); cursor: pointer; transition: border-color 0.2s var(--ease), background 0.2s var(--ease); }
.chip:hover { border-color: var(--accent); }
.chip:focus-visible, .more:focus-visible, .links a:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
.more { display: inline-flex; align-items: center; gap: 0.35rem; margin-top: 1rem; font-weight: 500; color: var(--text); text-decoration: none; }
.more:hover { color: var(--accent-soft); }
.links { display: flex; flex-direction: column; gap: 0.15rem; padding: 0.75rem; }
.links a { display: flex; align-items: center; gap: 0.6rem; padding: 0.4rem 0.5rem; border-radius: 6px; color: var(--text); text-decoration: none; transition: background 0.2s var(--ease); }
.links a:hover { background: var(--surface-2); }
.links :deep(.app-icon) { color: var(--muted); }
</style>
