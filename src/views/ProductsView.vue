<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ITEM } from '../config'
import { api } from '../services/api'
import { useAuth } from '../composables/useAuth'
import ProductCard from '../components/ProductCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseInput from '../components/BaseInput.vue'

// Mesma tela para "todos" (público) e "meus" (mine=true)
const props = defineProps({ mine: Boolean })
const { user } = useAuth()
const router = useRouter()

const products = ref([])
const search = ref('')
const loading = ref(true)
const error = ref('')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return products.value.filter((p) => `${p.name} ${p.description || ''}`.toLowerCase().includes(q))
})

watch(() => props.mine, async () => {
  loading.value = true
  error.value = ''
  try {
    products.value = await api(props.mine ? '/api/products/' : '/api/products/public/', { auth: props.mine })
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}, { immediate: true })

async function remove(p) {
  if (!confirm(`Excluir "${p.name}"?`)) return
  try {
    await api(`/api/products/${p.id}/`, { method: 'DELETE' })
    products.value = products.value.filter((x) => x.id !== p.id)
  } catch (e) {
    error.value = e.message
  }
}

async function chatWith(ownerId) {
  try {
    const conv = await api('/api/chat/conversations/', { method: 'POST', body: { participant_id: ownerId } })
    router.push(`/chat/${conv.id}`)
  } catch (e) {
    error.value = e.message
  }
}
</script>

<template>
  <div class="stack">
    <div class="row spread">
      <h1>{{ mine ? `Meus ${ITEM.plural.toLowerCase()}` : ITEM.plural }}</h1>
      <div class="search"><BaseInput v-model="search" type="search" :placeholder="`Buscar ${ITEM.plural.toLowerCase()}…`" /></div>
    </div>

    <p v-if="error" class="alert alert-error">{{ error }}</p>
    <p v-if="loading" class="muted">Carregando…</p>
    <div v-else-if="!filtered.length" class="empty stack">
      <p>Nenhum {{ ITEM.singular.toLowerCase() }} por aqui ainda.</p>
      <div><BaseButton v-if="user" to="/novo">Cadastrar {{ ITEM.singular.toLowerCase() }}</BaseButton></div>
    </div>

    <div v-else class="grid">
      <ProductCard v-for="p in filtered" :key="p.id" :product="p">
        <template #actions>
          <template v-if="user && p.owner_id === user.id">
            <BaseButton small variant="secondary" :to="`/editar/${p.id}`">Editar</BaseButton>
            <BaseButton small variant="danger" @click="remove(p)">Excluir</BaseButton>
          </template>
          <BaseButton v-else-if="user" small variant="secondary" @click="chatWith(p.owner_id)">Conversar</BaseButton>
        </template>
      </ProductCard>
    </div>
  </div>
</template>

<style scoped>
h1 { margin: 0; }
.search { width: min(100%, 260px); }
@media (max-width: 600px) { .search { width: 100%; } }
</style>
