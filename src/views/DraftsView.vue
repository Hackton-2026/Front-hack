<script setup>
// Rascunhos (os "Drafts" do Plane): tarefas pela metade, pessoais; publicar escolhe o projeto
import { reactive } from 'vue'
import { gsap, prefersReducedMotion } from '../utils/motion'
import { useWorkspace } from '../composables/useWorkspace'
import { useUi } from '../composables/useUi'
import AppIcon from '../components/app/AppIcon.vue'
import Avatars from '../components/app/Avatars.vue'
import PriorityFlag from '../components/app/PriorityFlag.vue'

const { state, drafts, project, updateTask, removeTask } = useWorkspace()
const { openTask, newTask } = useUi()
const target = reactive({})
const create = () => newTask({ asDraft: true })
const fmt = (d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

function publish(task, el) {
  const projectId = target[task.id] || task.projectId || state.projects[0]?.id
  if (!projectId) return
  const go = () => updateTask(task, { draft: false, projectId })
  prefersReducedMotion() ? go() : gsap.to(el.closest('.pg-row'), { x: 30, autoAlpha: 0, duration: 0.3, ease: 'power2.in', onComplete: go })
}
</script>

<template>
  <div class="pg">
    <div class="pg-bar">
      <h1>Rascunhos</h1>
      <div v-if="drafts.length" class="pg-bar__right">
        <button type="button" class="pg-btn primary" @click="create"><AppIcon name="plus" :size="14" />Criar rascunho</button>
      </div>
    </div>

    <div v-if="!drafts.length" class="pg-empty">
      <span class="pg-empty__art"><AppIcon name="draft" :size="36" /></span>
      <h2>Tarefas pela metade</h2>
      <p>Para testar, comece a criar uma tarefa e deixe no meio do caminho, ou crie seu primeiro rascunho abaixo. Rascunhos são só seus e não aparecem para o time.</p>
      <button type="button" class="pg-btn primary" @click="create"><AppIcon name="plus" :size="14" />Criar rascunho</button>
    </div>

    <div v-else class="pg-rows">
      <div v-for="d in drafts" :key="d.id" class="pg-row">
        <a class="pg-row__main" href="#" @click.prevent="openTask(d)"><span>{{ d.title }}</span></a>
        <div class="pg-row__side">
          <span v-if="project(d.projectId)" class="pg-pill pg-hide-sm"><i :style="{ background: project(d.projectId).color }" />{{ project(d.projectId).name }}</span>
          <PriorityFlag v-if="d.priority" :priority="d.priority" />
          <span v-if="d.due" class="pg-pill pg-hide-sm"><AppIcon name="calendar" :size="13" />{{ fmt(d.due) }}</span>
          <Avatars :ids="d.assignees" :size="22" />
          <span class="pg-muted pg-hide-sm">{{ fmt(d.createdAt) }}</span>
          <select v-model="target[d.id]" class="pg-pill" aria-label="Projeto de destino">
            <option :value="undefined">{{ project(d.projectId)?.name || 'Escolher projeto' }}</option>
            <option v-for="p in state.projects" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
          <button type="button" class="pg-btn" @click="publish(d, $event.currentTarget)">Publicar</button>
          <button type="button" class="pg-icon" :aria-label="`Apagar ${d.title}`" @click="removeTask(d)"><AppIcon name="trash" :size="15" /></button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
h1 { margin: 0; font: 600 1rem/1.2 'Geist', system-ui, sans-serif; color: var(--text); }
</style>
