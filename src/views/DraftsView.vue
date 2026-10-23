<script setup>
// Rascunhos (os "Drafts" do Plane): ideias de tarefa ainda sem projeto; publicar escolhe o projeto
import { nextTick, reactive, ref } from 'vue'
import { gsap, prefersReducedMotion } from '../utils/motion'
import { useWorkspace } from '../composables/useWorkspace'
import { useUi } from '../composables/useUi'
import AppIcon from '../components/app/AppIcon.vue'

const { state, drafts, createTask, updateTask, removeTask } = useWorkspace()
const { openTask } = useUi()
const target = reactive({})
const title = ref('')
const list = ref(null)

async function add() {
  if (!title.value.trim()) return
  createTask({ title: title.value.trim(), draft: true })
  title.value = ''
  await nextTick()
  if (!prefersReducedMotion()) gsap.from(list.value.lastElementChild, { y: 8, autoAlpha: 0, duration: 0.35, ease: 'power2.out' })
}
function publish(task, el) {
  const projectId = target[task.id] || state.projects[0]?.id
  if (!projectId) return
  const go = () => updateTask(task, { draft: false, projectId })
  prefersReducedMotion() ? go() : gsap.to(el.closest('li'), { x: 30, autoAlpha: 0, duration: 0.3, ease: 'power2.in', onComplete: go })
}
</script>

<template>
  <div class="page">
    <header>
      <h1>Rascunhos</h1>
      <p>Anote a ideia agora e decida o projeto depois. Rascunhos não aparecem para o time.</p>
    </header>
    <form class="add" @submit.prevent="add">
      <AppIcon name="draft" :size="16" />
      <input v-model="title" placeholder="Escreva uma ideia de tarefa e aperte Enter" aria-label="Novo rascunho" />
    </form>
    <ul ref="list" class="list">
      <li v-for="d in drafts" :key="d.id" class="item">
        <button type="button" class="item__title" @click="openTask(d)">{{ d.title }}</button>
        <select v-model="target[d.id]" aria-label="Projeto de destino">
          <option :value="undefined" disabled>Escolher projeto</option>
          <option v-for="p in state.projects" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
        <button type="button" class="pub" @click="publish(d, $event.currentTarget)">Publicar</button>
        <button type="button" class="rm" :aria-label="`Apagar ${d.title}`" @click="removeTask(d)"><AppIcon name="close" :size="14" /></button>
      </li>
    </ul>
    <p v-if="!drafts.length" class="empty">Nenhum rascunho. Ideias que ainda não têm projeto ficam aqui.</p>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 1rem; max-width: 52rem; padding: 1.5rem; }
h1 { margin: 0 0 0.25rem; font: 650 1.5rem/1.2 'Geist', system-ui, sans-serif; letter-spacing: -0.02em; color: var(--text); }
header p { margin: 0; color: var(--muted); }
.add { display: flex; align-items: center; gap: 0.6rem; height: 42px; padding: 0 0.85rem; border: 1px solid var(--line-strong); border-radius: 8px; background: var(--surface); color: var(--muted); }
.add:focus-within { border-color: var(--accent); }
.add input { flex: 1; border: 0; background: none; font: inherit; color: var(--text); outline: none; }
.list { display: flex; flex-direction: column; margin: 0; padding: 0; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); list-style: none; overflow: hidden; }
.list:empty { display: none; }
.item { display: flex; align-items: center; gap: 0.6rem; padding: 0.55rem 0.75rem; }
.item + .item { border-top: 1px solid var(--line); }
.item__title { flex: 1; min-width: 0; padding: 0; border: 0; background: none; text-align: left; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item__title:hover { color: var(--accent-soft); }
select { height: 30px; padding: 0 0.4rem; border: 1px solid var(--line-strong); border-radius: 6px; background: var(--bg); font: inherit; font-size: 12.5px; color: var(--text); color-scheme: dark; }
.pub { height: 30px; padding: 0 0.7rem; border: 1px solid var(--accent); border-radius: 6px; background: rgb(229 101 21 / 0.12); font-size: 12.5px; font-weight: 500; cursor: pointer; }
.pub:hover { background: var(--accent); color: #000; }
.rm { display: grid; place-items: center; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 6px; background: none; color: var(--muted); cursor: pointer; }
.rm:hover { background: var(--surface-2); color: var(--text); }
.empty { color: var(--muted); }
:is(.item__title, .pub, .rm):focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
</style>
