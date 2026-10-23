<script setup>
// Convite do time (o "Get your team on board" do Plane): quem é convidado entra como pendente.
import { nextTick, ref } from 'vue'
import { gsap, prefersReducedMotion } from '../../utils/motion'
import { useAuth } from '../../composables/useAuth'
import { useOnboarding } from '../../composables/useOnboarding'
import GooeyButton from '../GooeyButton.vue'

const { user } = useAuth()
const { complete } = useOnboarding()
const email = ref('')
const error = ref('')
const invited = ref([])
const list = ref(null)

async function invite() {
  const value = email.value.trim().toLowerCase()
  // shortcut: convite só no front; ligar à tabela Invitation quando a API existir
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { error.value = 'Digite um e-mail válido.'; return }
  if (invited.value.includes(value)) { error.value = 'Essa pessoa já foi convidada.'; return }
  error.value = ''
  invited.value.push(value)
  email.value = ''
  complete('invite')
  await nextTick()
  if (!prefersReducedMotion()) gsap.from(list.value.lastElementChild, { y: 5, scale: 0.95, autoAlpha: 0, duration: 0.35, ease: 'power3.out' })
}
</script>

<template>
  <section class="team" aria-labelledby="team-title">
    <h2 id="team-title">Traga seu time</h2>
    <p class="sub">Convide colegas para colaborar e construir junto.</p>
    <div class="card">
      <ul ref="list" class="people">
        <li class="person">
          <span class="ava">{{ (user?.first_name || user?.username || 'Você').slice(0, 2).toUpperCase() }}</span>
          <span>{{ user?.username || 'você' }}</span>
          <small>Dono</small>
        </li>
        <li v-for="m in invited" :key="m" class="person pending">
          <span class="ava">{{ m.slice(0, 2).toUpperCase() }}</span>
          <span class="person__mail">{{ m }}</span>
          <small>Pendente</small>
        </li>
      </ul>
      <form class="invite" novalidate @submit.prevent="invite">
        <label for="invite-email" class="sr-only">E-mail de quem você quer convidar</label>
        <input id="invite-email" v-model="email" type="email" placeholder="nome@empresa.com" autocomplete="off" :aria-invalid="!!error" aria-describedby="invite-msg" />
        <GooeyButton type="submit" variant="primary">Convidar</GooeyButton>
      </form>
      <p id="invite-msg" class="msg" aria-live="polite">{{ error }}</p>
    </div>
  </section>
</template>

<style scoped>
h2 { margin: 0 0 0.25rem; font: 600 1.25rem/1.2 'Geist', system-ui, sans-serif; color: var(--text); }
.sub { margin: 0 0 0.9rem; color: var(--muted); }
.card { display: flex; flex-direction: column; gap: 1rem; padding: 1.25rem; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
.people { display: flex; flex-wrap: wrap; gap: 1.25rem 2rem; margin: 0; padding: 0; list-style: none; }
.person { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; min-width: 5.5rem; font-weight: 500; }
.person small { font-size: 11.5px; font-weight: 400; color: var(--muted); }
.person__mail { max-width: 9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ava { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-soft), var(--accent)); font: 700 13px/1 'Lexend', system-ui, sans-serif; color: #000; }
.pending .ava { background: var(--surface-2); color: var(--muted); border: 1px dashed var(--line-strong); }
.invite { display: flex; gap: 0.5rem; }
.invite input { flex: 1; min-width: 0; height: 36px; padding: 0 0.75rem; border: 1px solid var(--line-strong); border-radius: 6px; background: var(--bg); font: inherit; color: var(--text); outline: none; transition: border-color 0.2s var(--ease); }
.invite input:focus { border-color: var(--accent); }
.msg { min-height: 1em; margin: -0.5rem 0 0; font-size: 12.5px; color: #ffb48a; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
</style>
