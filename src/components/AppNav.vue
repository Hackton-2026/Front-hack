<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ITEM } from '../config'
import { useAuth } from '../composables/useAuth'
import AppLogo from './AppLogo.vue'
import UserAvatar from './UserAvatar.vue'
import BaseButton from './BaseButton.vue'

const { user, logout } = useAuth()
const open = ref(false)
const route = useRoute()
watch(() => route.fullPath, () => (open.value = false))
</script>

<template>
  <header class="nav">
    <div class="nav-inner">
      <AppLogo />
      <button class="menu-btn" :aria-expanded="open" aria-label="Menu" @click="open = !open">
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 5h14M2 13h14" stroke="currentColor" stroke-width="1.6" /></svg>
      </button>

      <nav class="links" :class="{ open }">
        <RouterLink to="/explorar">Explorar</RouterLink>
        <template v-if="user">
          <RouterLink to="/meus">Meus {{ ITEM.plural.toLowerCase() }}</RouterLink>
          <RouterLink to="/chat">Chat</RouterLink>
          <BaseButton small to="/novo">Novo {{ ITEM.singular.toLowerCase() }}</BaseButton>
          <RouterLink to="/perfil" class="me" title="Meu perfil">
            <UserAvatar :user="user" :size="28" />
          </RouterLink>
          <button class="logout" @click="logout">Sair</button>
        </template>
        <BaseButton v-else to="/login">Entrar</BaseButton>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.nav {
  position: sticky;
  top: 0;
  z-index: 10;
  background: color-mix(in srgb, var(--color-bg) 85%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--color-border);
}
.nav-inner {
  max-width: var(--container);
  min-height: var(--nav-height);
  margin: 0 auto;
  padding: 0 var(--space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}
.links { display: flex; align-items: center; gap: var(--space-4); font-size: var(--font-size-sm); }
.links > a:not(.btn), .logout { color: var(--color-muted); text-decoration: none; transition: color var(--transition); }
.links > a:not(.btn):hover, .logout:hover, .links > a.router-link-active:not(.btn) { color: var(--color-heading); }
.logout { background: none; border: 0; padding: 0; font: inherit; cursor: pointer; }
.me { display: flex; }
.menu-btn { display: none; background: none; border: 0; padding: var(--space-2); color: var(--color-heading); cursor: pointer; }

@media (max-width: 760px) {
  .menu-btn { display: block; }
  .links { display: none; width: 100%; flex-direction: column; align-items: flex-start; padding-bottom: var(--space-4); }
  .links.open { display: flex; }
}
</style>
