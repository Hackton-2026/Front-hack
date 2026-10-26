<script setup>
import { ref, watch } from 'vue'
import { compressImage } from '../utils/image'

const model = defineModel()
const props = defineProps({
  maxSide: { type: Number, default: 1600 },
  round: Boolean,
  ratio: { type: String, default: '4 / 3' },
  label: { type: String, default: 'Clique ou arraste uma imagem' },
})

const input = ref()
const preview = ref(null)
const dragging = ref(false)
const error = ref('')

watch(model, (value, _, onCleanup) => {
  if (!(value instanceof File)) return (preview.value = value || null)
  const url = URL.createObjectURL(value)
  preview.value = url
  onCleanup(() => URL.revokeObjectURL(url))
}, { immediate: true })

async function pick(file) {
  error.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) return (error.value = 'Escolha um arquivo de imagem.')
  try {
    model.value = await compressImage(file, props.maxSide)
  } catch {
    error.value = 'Não foi possível ler essa imagem. Tente JPG, PNG ou WebP.'
  }
}

function onDrop(e) {
  dragging.value = false
  pick(e.dataTransfer.files[0])
}

function onChange(e) {
  pick(e.target.files[0])
  e.target.value = ''
}
</script>

<template>
  <div class="upload-wrap">
    <div
      class="upload"
      :class="{ round, dragging, filled: preview }"
      :style="round ? null : { aspectRatio: ratio }"
      role="button"
      tabindex="0"
      :aria-label="label"
      @click="input.click()"
      @keydown.enter.space.prevent="input.click()"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
    >
      <img v-if="preview" :src="preview" alt="Pré-visualização" />
      <span v-else class="hint">{{ label }}</span>
      <input ref="input" type="file" accept="image/*" hidden @change="onChange" />
    </div>
    <div class="row">
      <button v-if="preview" type="button" class="link" @click="input.click()">Trocar</button>
      <button v-if="preview" type="button" class="link danger" @click="model = null">Remover</button>
    </div>
    <p v-if="error" class="alert alert-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.upload-wrap { display: flex; flex-direction: column; gap: var(--space-2); align-items: flex-start; }
.upload {
  width: 100%;
  display: grid;
  place-items: center;
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-lg);
  background: var(--color-surface-2);
  overflow: hidden;
  cursor: pointer;
  transition: border-color var(--transition);
}
.upload.round { width: 112px; aspect-ratio: 1; border-radius: 50%; }
.upload.filled { border-style: solid; }
.upload:hover, .upload.dragging { border-color: var(--color-primary); }
.upload img { width: 100%; height: 100%; object-fit: cover; }
.hint { padding: var(--space-3); color: var(--color-muted); font-size: var(--font-size-sm); text-align: center; }
.link { background: none; border: 0; padding: 0; font: inherit; font-size: var(--font-size-sm); color: var(--color-primary); cursor: pointer; }
.link.danger { color: var(--color-danger); }
</style>
