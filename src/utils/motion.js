import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin)
gsap.ticker.lagSmoothing(0)

export { gsap }
// durações do GSAP (segundos) num lugar só; cada valor antigo foi para o degrau mais perto (diferença de até 0,1 s)
export const DUR = { press: 0.2, fast: 0.35, base: 0.5, mid: 0.65, slow: 0.85, long: 1, enter: 1.2 }
// curvas do GSAP num lugar só; pop* é o pulinho de confirmação (back.out)
export const EASE = { out: 'power3.out', soft: 'power2.out', expo: 'expo.out', in: 'power2.in', inOut: 'power3.inOut', inOutSoft: 'power2.inOut', linear: 'none', popSoft: 'back.out(1.7)', pop: 'back.out(2)', popStrong: 'back.out(3)' }
export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.calm === 'on'

export function revealTitleCharacters(targets) {
  return gsap.from(targets, {
    y: 10,
    opacity: 0,
    filter: 'blur(10px)',
    duration: DUR.long,
    ease: EASE.expo,
    stagger: 0.045,
    delay: 0.15,
    clearProps: 'transform,opacity,filter',
  })
}

export const vReveal = {
  mounted(el, { modifiers, value }) {
    if (prefersReducedMotion()) return
    if (value && typeof value === 'object') {
      modifiers = { ...modifiers, now: modifiers.now || !!value.now }
      value = value.delay
    }
    el._reveal = gsap.from(modifiers.stagger ? el.children : el, {
      opacity: 0,
      y: 48,
      scale: 0.96,
      filter: 'blur(8px)',
      duration: DUR.enter,
      ease: EASE.expo,
      stagger: 0.12,
      clearProps: 'filter,transform',
      delay: Number(value) || 0,
      scrollTrigger: modifiers.now ? undefined : { trigger: el, start: 'top 88%', once: true },
    })
  },
  unmounted(el) {
    el._reveal?.scrollTrigger?.kill()
    el._reveal?.kill()
  },
}

export function staggerIn(targets, opts = {}) {
  if (prefersReducedMotion() || !targets?.length) return
  gsap.fromTo(targets, { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: DUR.fast, stagger: 0.035, ease: EASE.soft, clearProps: 'transform,opacity,visibility', ...opts })
}
