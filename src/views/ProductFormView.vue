<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ITEM } from '../config'
import { api, imageField, toFormData } from '../services/api'
import BaseInput from '../components/BaseInput.vue'
import BaseButton from '../components/BaseButton.vue'
import ImageUpload from '../components/ImageUpload.vue'

// Sem id = criar; com id (rota /editar/:id) = editar
const props = defineProps({ id: String })
const router = useRouter()

const form = reactive({ name: '', description: '', image: null })
const error = ref('')
const saving = ref(false)

if (props.id) {
  api(`/api/products/${props.id}/`)
    .then((p) => Object.assign(form, { name: p.name, description: p.description || '', image: p.image }))
    .catch((e) => (error.value = e.message))
}

async function submit() {
  error.value = ''
  saving.value = true
  try {
    await api(props.id ? `/api/products/${props.id}/` : '/api/products/', {
      method: props.id ? 'PATCH' : 'POST',
      body: toFormData({ ...form, image: imageField(form.image) }),
    })
    router.push('/meus')
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="product-form card" @submit.prevent="submit">
    <h1>{{ id ? 'Editar' : 'Novo' }} {{ ITEM.singular.toLowerCase() }}</h1>
    <div class="layout">
      <ImageUpload v-model="form.image" ratio="1" />
      <div class="stack">
        <BaseInput v-model="form.name" label="Nome" required maxlength="100" />
        <BaseInput v-model="form.description" label="Descrição" textarea />
      </div>
    </div>
    <p v-if="error" class="alert alert-error">{{ error }}</p>
    <div class="row actions">
      <BaseButton variant="ghost" @click="router.back()">Cancelar</BaseButton>
      <BaseButton type="submit" :loading="saving">Salvar</BaseButton>
    </div>
  </form>
</template>

<style scoped>
.product-form { max-width: 680px; margin-inline: auto; display: flex; flex-direction: column; gap: var(--space-4); }
.product-form h1 { margin: 0; }
.layout { display: grid; grid-template-columns: 220px 1fr; gap: var(--space-4); align-items: start; }
.actions { justify-content: flex-end; }

@media (max-width: 600px) {
  .layout { grid-template-columns: 1fr; }
  .layout > :first-child { max-width: 200px; }
}
</style>
