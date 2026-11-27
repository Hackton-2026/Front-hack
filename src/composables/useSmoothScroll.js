import { nextTick, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { gsap, prefersReducedMotion } from '../utils/motion'

let lenis = null
const raf = (time) => lenis?.raf(time * 1000)

function ligar() {
  if (lenis || prefersReducedMotion()) return
  // anchors: false evita o Lenis sequestrar links /#secao entre rotas do Vue Router
  lenis = new Lenis({ lerp: 0.08, smoothWheel: true, wheelMultiplier: 0.9, anchors: false, allowNestedScroll: true })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(raf)
}
function desligar() {
  gsap.ticker.remove(raf)
  lenis?.destroy()
  lenis = null
  document.documentElement.classList.remove('lenis', 'lenis-smooth', 'lenis-stopped')
}
function acordar() {
  if (!lenis) return
  lenis.start()
  lenis.resize()
}

export function useSmoothScroll() {
  const route = useRoute()
  const router = useRouter()
  watch(() => !route.meta.app, (site) => (site ? ligar() : desligar()), { immediate: true })
  // Não chama stop() no beforeEach: se a navegação abortar ou falhar, o Lenis nunca mais acordava.
  // Em vez disso, zera a inércia atomicamente no afterEach e garante retomada em erros/AFK.
  const offAfter = router.afterEach(() => nextTick(() => {
    if (!lenis) return
    lenis.stop()
    lenis.start()
    lenis.resize()
  }))
  const offError = router.onError(acordar)
  const onVisible = () => { if (!document.hidden) acordar() }
  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('pageshow', acordar)
  onUnmounted(() => {
    offAfter()
    offError()
    document.removeEventListener('visibilitychange', onVisible)
    window.removeEventListener('pageshow', acordar)
    desligar()
  })
}
