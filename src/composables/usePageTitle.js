import { onMounted, toValue, watch } from 'vue'

export const SITE_NAME = 'Novexo'

export function formatPageTitle(title) {
  const clean = String(title || '').trim()
  if (!clean || clean.toLowerCase() === SITE_NAME.toLowerCase()) return SITE_NAME
  if (/\|\s*Novexo$/i.test(clean)) return clean
  return `${clean} | ${SITE_NAME}`
}

export function usePageTitle(title) {
  function apply() {
    const value = toValue(title)
    if (value) document.title = formatPageTitle(value)
  }

  watch(() => toValue(title), apply)
  onMounted(apply)
}
