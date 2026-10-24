<script setup>
// Menu da conta (foto no canto de cima): cartão do perfil, Ajustes, Preferências e Sair. Usado no app e na barra do site,
// por isso traz cores de reserva para quando as variáveis da área logada não existem (landing).
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import AppIcon from './AppIcon.vue'

const props = defineProps({ size: { type: Number, default: 28 }, photo: { type: String, default: '' }, ring: Boolean })
const emit = defineEmits(['open'])
const { user, logout } = useAuth()
const router = useRouter()
const root = ref(null)
const open = ref(false)

const name = computed(() => user.value?.first_name || user.value?.username || 'Visitante')
const fullName = computed(() => [user.value?.first_name, user.value?.last_name].filter(Boolean).join(' ') || name.value)
const initials = computed(() => name.value.slice(0, 2).toUpperCase())
const pic = computed(() => props.photo || user.value?.avatar || '')

function toggle() {
  open.value = !open.value
  if (open.value) emit('open')
}
function signOut() {
  open.value = false
  logout()
  router.push('/login')
}
const onDoc = (e) => { if (!root.value?.contains(e.target)) open.value = false }
const onKey = (e) => { if (e.key === 'Escape') open.value = false }
onMounted(() => { document.addEventListener('click', onDoc); document.addEventListener('keydown', onKey) })
onUnmounted(() => { document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onKey) })
defineExpose({ close: () => (open.value = false) })
</script>

<template>
  <div ref="root" class="acc">
    <button type="button" class="acc__btn" :class="{ ring }" :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.4)}px` }" :aria-expanded="open" aria-haspopup="menu" :aria-label="`Conta de ${fullName}`" @click="toggle">
      <img v-if="pic" :src="pic" alt="" /><template v-else>{{ initials }}</template>
    </button>
    <div v-if="open" class="acc__menu" role="menu">
      <div class="acc__card" :style="pic ? { '--bg': `url(${pic})` } : null">
        <span class="acc__av"><img v-if="pic" :src="pic" alt="" /><template v-else>{{ initials }}</template></span>
        <strong>{{ fullName }}</strong>
        <small>{{ user?.email }}</small>
      </div>
      <RouterLink to="/ajustes?tab=profile" role="menuitem" @click="open = false"><AppIcon name="settings" :size="16" />Ajustes</RouterLink>
      <RouterLink to="/ajustes?tab=prefs" role="menuitem" @click="open = false"><AppIcon name="sliders" :size="16" />Preferências</RouterLink>
      <hr />
      <button type="button" role="menuitem" class="out" @click="signOut"><AppIcon name="logout" :size="16" />Sair</button>
    </div>
  </div>
</template>

<style scoped>
.acc { position: relative; --m-surface: var(--surface, #181614); --m-surface-2: var(--surface-2, #211f1c); --m-line: var(--line, #2e2b27); --m-line-strong: var(--line-strong, #3d3934); --m-text: var(--text, #f2efea); --m-muted: var(--muted, #a29d95); --m-accent: var(--accent, #e56515); --m-accent-soft: var(--accent-soft, #fba45c); }
.acc__btn { display: grid; place-items: center; padding: 0; overflow: hidden; border: 0; border-radius: 50%; background: linear-gradient(135deg, var(--m-accent-soft), var(--m-accent)); font-family: 'Lexend', system-ui, sans-serif; font-weight: 700; line-height: 1; color: #000; cursor: pointer; transition: box-shadow 0.25s, transform 0.25s; }
.acc__btn.ring { box-shadow: 0 0 0 2px rgb(255 255 255 / 0.18); }
.acc__btn.ring:hover { box-shadow: 0 0 0 2px var(--m-accent-soft); transform: scale(1.05); }
.acc__btn img, .acc__av img { width: 100%; height: 100%; object-fit: cover; }
.acc__btn:focus-visible { outline: 2px solid var(--m-accent-soft); outline-offset: 3px; }
.acc__menu { position: absolute; top: calc(100% + 12px); right: 0; z-index: 60; display: flex; flex-direction: column; gap: 0.15rem; width: 17.5rem; padding: 0.45rem; border: 1px solid var(--m-line-strong); border-radius: 12px; background: var(--m-surface); box-shadow: 0 20px 40px rgb(0 0 0 / 0.45); font: 400 14px/1.4 'Geist', system-ui, sans-serif; transform-origin: top right; animation: acc-in 0.18s cubic-bezier(0.2, 0.8, 0.2, 1); }
@keyframes acc-in { from { opacity: 0; transform: scale(0.96) translateY(-4px); } }
@media (prefers-reduced-motion: reduce) { .acc__menu { animation: none; } }
.acc__card { position: relative; display: flex; flex-direction: column; align-items: center; gap: 0.3rem; margin-bottom: 0.3rem; padding: 1.1rem 0.75rem 1rem; overflow: hidden; border-radius: 9px; background: color-mix(in srgb, var(--m-accent) 14%, var(--m-surface-2)); text-align: center; isolation: isolate; }
.acc__card::before { content: ''; position: absolute; inset: -20px; z-index: -1; background: var(--bg, none) center / cover; filter: blur(18px) brightness(0.45); }
.acc__av { display: grid; place-items: center; width: 52px; height: 52px; margin-bottom: 0.3rem; overflow: hidden; border: 2px solid var(--m-surface); border-radius: 50%; background: linear-gradient(135deg, var(--m-accent-soft), var(--m-accent)); font: 700 17px/1 'Lexend', system-ui, sans-serif; color: #000; }
.acc__card strong { font-size: 15px; color: var(--m-text); }
.acc__card small { max-width: 100%; overflow: hidden; font-size: 12.5px; color: var(--m-muted); text-overflow: ellipsis; white-space: nowrap; }
.acc__menu a, .acc__menu > button { display: flex; align-items: center; gap: 0.65rem; padding: 0.5rem 0.6rem; border: 0; border-radius: 7px; background: none; font: inherit; color: var(--m-text); text-align: left; text-decoration: none; cursor: pointer; }
.acc__menu a:hover, .acc__menu > button:hover { background: var(--m-surface-2); }
.acc__menu hr { width: 100%; margin: 0.2rem 0; border: 0; border-top: 1px solid var(--m-line); }
.acc__menu .out { color: #f2a07a; }
.acc__menu :is(a, button):focus-visible { outline: 2px solid var(--m-accent-soft); outline-offset: -2px; }
</style>
