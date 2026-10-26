import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin)
gsap.ticker.lagSmoothing(0)

export { gsap }
export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.calm === 'on'

export function revealTitleCharacters(targets) {
  return gsap.from(targets, {
    y: 10,
    opacity: 0,
    filter: 'blur(10px)',
    duration: 1,
    ease: 'expo.out',
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
      duration: 1.2,
      ease: 'expo.out',
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
  gsap.fromTo(targets, { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4, stagger: 0.035, ease: 'power2.out', clearProps: 'transform,opacity,visibility', ...opts })
}
