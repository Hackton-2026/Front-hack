import { nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { gsap, prefersReducedMotion } from '../utils/motion'

let lenis = null
const raf = (time) => lenis?.raf(time * 1000)

function ligar() {
  if (lenis || prefersReducedMotion()) return
  lenis = new Lenis({ lerp: 0.08, smoothWheel: true, wheelMultiplier: 0.9, anchors: true, allowNestedScroll: true })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(raf)
}
function desligar() {
  gsap.ticker.remove(raf)
  lenis?.destroy()
  lenis = null
}

export function useSmoothScroll() {
  const route = useRoute()
  const router = useRouter()
  watch(() => !route.meta.app, (site) => (site ? ligar() : desligar()), { immediate: true })
  router.beforeEach(() => { lenis?.stop() })
  router.afterEach(() => nextTick(() => { lenis?.start(); lenis?.resize() }))
}
