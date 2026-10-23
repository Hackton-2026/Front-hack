<script setup>
// Confirmação antes de excluir um projeto de vez (só o dono), com a opção de só arquivar.
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkspace } from '../../composables/useWorkspace'
import { useUi } from '../../composables/useUi'
import AppModal from './AppModal.vue'

const props = defineProps({ project: { type: Object, default: null } })
const emit = defineEmits(['close'])
const router = useRouter()
const { state, archiveProject } = useWorkspace()
const { toast } = useUi()
const busy = ref(false)
const count = computed(() => state.tasks.filter((t) => t.projectId === props.project?.id && !t.draft).length)

async function remove(hard) {
  const p = props.project
  busy.value = true
  const ok = await archiveProject(p, hard)
  busy.value = false
  if (!ok) return
  emit('close')
  toast(hard ? `${p.name} foi excluído.` : `${p.name} foi para Arquivados.`)
  if (router.currentRoute.value.path.startsWith(`/projetos/${p.id}`)) router.push('/projetos')
}
</script>

<template>
  <AppModal :open="!!project" :title="`Excluir “${project?.name}”?`" @close="emit('close')" @submit="remove(true)">
    <p class="warn">
      Tem certeza? Isso apaga <b>de vez</b> o projeto, {{ count === 1 ? '1 tarefa' : `${count} tarefas` }}, os ciclos, módulos, páginas e o chat.
      Quem participa perde o acesso. <b>Não dá para desfazer.</b>
    </p>
    <p class="hint">Se só quer tirar da frente, arquive: ele vai para Arquivados e pode voltar depois.</p>
    <template #footer>
      <button type="button" class="btn" :disabled="busy" @click="emit('close')">Cancelar</button>
      <button type="button" class="btn" :disabled="busy" @click="remove(false)">Arquivar</button>
      <button type="submit" class="btn danger" :disabled="busy">Excluir projeto</button>
    </template>
  </AppModal>
</template>

<style scoped>
.warn { margin: 0; }
.warn b { color: #ff8a7a; }
.hint { margin: 0; font-size: 13px; color: var(--muted); }
</style>
