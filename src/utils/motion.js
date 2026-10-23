import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin)
// Anima pelo relógio real: se a aba travar ou ficar em segundo plano, o conteúdo aparece no tempo certo
gsap.ticker.lagSmoothing(0)

export { gsap }
export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * v-reveal            → o elemento aparece suave ao entrar na tela
 * v-reveal.stagger    → os filhos aparecem em cascata
 * v-reveal.now        → anima ao montar (sem esperar o scroll), bom para o topo da página
 * v-reveal="0.2"      → atraso em segundos
 */
export const vReveal = {
  mounted(el, { modifiers, value }) {
    if (prefersReducedMotion()) return
    el._reveal = gsap.from(modifiers.stagger ? el.children : el, {
      opacity: 0,
      y: 48,
      scale: 0.96,
      filter: 'blur(8px)',
      duration: 1.2,
      ease: 'expo.out',
      stagger: 0.12,
      clearProps: 'filter,transform', // tira blur/transform ao terminar, para não pesar no hover dos cards
      delay: Number(value) || 0,
      scrollTrigger: modifiers.now ? undefined : { trigger: el, start: 'top 88%', once: true },
    })
  },
  unmounted(el) {
    el._reveal?.scrollTrigger?.kill()
    el._reveal?.kill()
  },
}
