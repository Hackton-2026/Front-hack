/**
 * Reduz e converte a imagem para WebP no navegador antes do upload.
 * Uma foto de celular de 5MB vira ~200KB: upload rápido e pouco espaço no servidor.
 */
export async function compressImage(file, maxSide = 1600, quality = 0.85) {
  const bitmap = await createImageBitmap(file) // já respeita a rotação EXIF
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' })
}
