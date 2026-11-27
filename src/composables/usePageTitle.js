import { onMounted, onUnmounted, toValue, watch } from 'vue'

export function usePageTitle(title) {
  let previousTitle

  function apply() {
    const value = toValue(title)
    if (value) document.title = value
  }

  watch(() => toValue(title), apply)

  onMounted(() => {
    previousTitle = document.title
    apply()
  })

  onUnmounted(() => {
    if (previousTitle !== undefined) document.title = previousTitle
  })
}
