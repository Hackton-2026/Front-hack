<script setup>
// Lista de projetos com progresso, contagens e quem trabalha em cada um
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { gsap, prefersReducedMotion } from '../utils/motion'
import { useWorkspace } from '../composables/useWorkspace'
import { useOnboarding } from '../composables/useOnboarding'
import Avatars from '../components/app/Avatars.vue'
import GooeyButton from '../components/GooeyButton.vue'

const COLORS = ['#e56515', '#fba45c', '#919599', '#f2c46d', '#cdcdcb']
const router = useRouter()
const { state, tasksOf, progress, createProject, isOverdue } = useWorkspace()
const { complete } = useOnboarding()
const name = ref('')
const color = ref(COLORS[0])
const error = ref('')
const root = ref(null)

async function create() {
  if (!name.value.trim()) { error.value = 'Dê um nome ao projeto.'; return }
  const p = await createProject(name.value.trim(), color.value)
  if (!p) return
  complete('project')
  router.push(`/projetos/${p.id}`)
}
onMounted(() => {
  if (prefersReducedMotion()) return
  gsap.from(root.value.querySelectorAll('.card'), { y: 14, autoAlpha: 0, duration: 0.45, stagger: 0.06, ease: 'power2.out' })
  root.value.querySelectorAll('.pbar span').forEach((bar) => gsap.from(bar, { scaleX: 0, duration: 1, ease: 'expo.out', delay: 0.3 }))
})
</script>

<template>
  <div ref="root" class="page">
    <header class="head">
      <div>
        <h1>Projetos</h1>
        <p>{{ state.projects.length }} projetos no workspace {{ state.workspaceName }}.</p>
      </div>
    </header>
    <div class="grid">
      <RouterLink v-for="p in state.projects" :key="p.id" :to="`/projetos/${p.id}`" class="card">
        <div class="card__top"><span class="sq" :style="{ background: p.color }" /><strong>{{ p.name }}</strong><span class="prefix">{{ p.prefix }}</span></div>
        <div class="pbar"><span :style="{ transform: `scaleX(${progress(p.id)})` }" /></div>
        <dl class="nums">
          <div><dt>Abertas</dt><dd>{{ tasksOf(p.id).filter((t) => t.status !== 'done').length }}</dd></div>
          <div><dt>Concluídas</dt><dd>{{ tasksOf(p.id).filter((t) => t.status === 'done').length }}</dd></div>
          <div><dt>Atrasadas</dt><dd :class="{ late: tasksOf(p.id).some(isOverdue) }">{{ tasksOf(p.id).filter(isOverdue).length }}</dd></div>
        </dl>
        <Avatars :ids="[...new Set(tasksOf(p.id).flatMap((t) => t.assignees))]" />
      </RouterLink>
      <form class="card new" novalidate @submit.prevent="create">
        <strong>Novo projeto</strong>
        <input v-model="name" placeholder="Nome do projeto" aria-label="Nome do projeto" :aria-invalid="!!error" @input="error = ''" />
        <div class="colors" role="radiogroup" aria-label="Cor">
          <button v-for="c in COLORS" :key="c" type="button" role="radio" :aria-checked="color === c" :style="{ background: c }" :aria-label="`Cor ${c}`" @click="color = c" />
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <GooeyButton type="submit" variant="primary">Criar projeto</GooeyButton>
      </form>
    </div>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 1.5rem; padding: 1.5rem; }
h1 { margin: 0 0 0.25rem; font: 650 1.5rem/1.2 'Geist', system-ui, sans-serif; letter-spacing: -0.02em; color: var(--text); }
.head p { margin: 0; color: var(--muted); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr)); gap: 1rem; }
.card { display: flex; flex-direction: column; gap: 0.85rem; padding: 1.1rem; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); color: var(--text); text-decoration: none; transition: border-color 0.2s var(--ease), translate 0.25s var(--ease); }
a.card:hover { border-color: color-mix(in srgb, var(--accent) 60%, var(--line)); translate: 0 -2px; }
a.card:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
.card__top { display: flex; align-items: center; gap: 0.55rem; }
.sq { width: 12px; height: 12px; border-radius: 3px; }
.prefix { margin-left: auto; font: 500 11px/1 'Geist Mono', monospace; color: var(--muted); }
.pbar { height: 4px; overflow: hidden; border-radius: 999px; background: var(--surface-2); }
.pbar span { display: block; height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent-soft)); transform-origin: left; }
.nums { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin: 0; }
.nums dt { font-size: 11.5px; color: var(--muted); }
.nums dd { margin: 0; font: 600 1.25rem/1.2 'Geist', system-ui, sans-serif; font-variant-numeric: tabular-nums; }
.nums dd.late { color: #ff8a80; }
.new { border-style: dashed; }
.new input { height: 34px; padding: 0 0.6rem; border: 1px solid var(--line-strong); border-radius: 6px; background: var(--bg); font: inherit; color: var(--text); outline: none; }
.new input:focus { border-color: var(--accent); }
.colors { display: flex; gap: 0.4rem; }
.colors button { width: 20px; height: 20px; padding: 0; border: 2px solid transparent; border-radius: 50%; cursor: pointer; }
.colors button[aria-checked='true'] { border-color: var(--text); }
.colors button:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
.error { margin: 0; font-size: 12.5px; color: #ffb48a; }
</style>
