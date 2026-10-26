<script setup>
import { reactive, ref } from 'vue'
import { imageField, toFormData } from '../services/api'
import { useAuth } from '../composables/useAuth'
import BaseInput from '../components/BaseInput.vue'
import BaseButton from '../components/BaseButton.vue'
import ImageUpload from '../components/ImageUpload.vue'

const { user, updateMe } = useAuth()

const pick = (u) => ({ avatar: u.avatar, username: u.username, email: u.email, first_name: u.first_name, last_name: u.last_name, password: '' })
const form = reactive(pick(user.value))
const error = ref('')
const success = ref('')
const saving = ref(false)

async function submit() {
  error.value = success.value = ''
  saving.value = true
  try {
    await updateMe(toFormData({ ...form, avatar: imageField(form.avatar), password: form.password || undefined }))
    Object.assign(form, pick(user.value))
    success.value = 'Perfil atualizado!'
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="narrow card stack" @submit.prevent="submit">
    <h1>Meu perfil</h1>
    <ImageUpload v-model="form.avatar" round :max-side="512" label="Adicionar foto" />
    <div class="two-cols">
      <BaseInput v-model="form.first_name" label="Nome" />
      <BaseInput v-model="form.last_name" label="Sobrenome" />
    </div>
    <BaseInput v-model="form.username" label="Usuário" required />
    <BaseInput v-model="form.email" label="E-mail" type="email" />
    <BaseInput v-model="form.password" label="Nova senha (deixe vazio para manter)" type="password" autocomplete="new-password" />
    <p class="muted small">Membro desde {{ new Date(user.date_joined).toLocaleDateString('pt-BR') }}</p>
    <p v-if="error" class="alert alert-error">{{ error }}</p>
    <p v-if="success" class="alert alert-success">{{ success }}</p>
    <BaseButton type="submit" :loading="saving">Salvar</BaseButton>
  </form>
</template>
