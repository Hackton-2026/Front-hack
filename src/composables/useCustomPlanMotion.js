import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { SplitText } from 'gsap/SplitText'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { EASE, DUR, gsap, revealTitleCharacters } from '../utils/motion'

gsap.registerPlugin(SplitText)

export function useCustomPlanMotion(root, step, reviewing) {
  let media
  let observer
  let frame = 0
  let mounted = false
  let animateStep = () => {}

  function refresh() {
    if (!mounted || frame) return
    frame = requestAnimationFrame(() => { frame = 0; if (mounted) ScrollTrigger.refresh() })
  }

  onMounted(() => {
    mounted = true
    media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', context => {
      const select = gsap.utils.selector(root.value)
      SplitText.create(select('h1')[0], {
        type: 'words,chars', wordsClass: 'editorial-word', charsClass: 'editorial-char',
        autoSplit: true, aria: 'auto', onSplit: split => revealTitleCharacters(split.chars, { duration: 0.45, stagger: 0.014, delay: 0.04 }),
      })
      gsap.from(select('.custom-form, .custom-budget'), {
        y: 14, autoAlpha: 0, duration: DUR.base, stagger: .06, delay: .08, ease: EASE.out,
        clearProps: 'transform,opacity,visibility',
      })
      context.add('step', () => {
        gsap.fromTo(select('.custom-question, .custom-review__row'), { y: 10, autoAlpha: 0 }, {
          y: 0, autoAlpha: 1, duration: DUR.base, stagger: .045, ease: EASE.soft,
          overwrite: 'auto', clearProps: 'transform,opacity,visibility',
        })
      })
      animateStep = () => context.step()
      return () => { animateStep = () => {} }
    }, root.value)
    observer = new ResizeObserver(refresh)
    observer.observe(root.value)
    document.fonts?.ready.then(refresh)
  })

  watch([step, reviewing], async () => {
    await nextTick()
    if (!mounted) return
    animateStep()
    refresh()
  })

  onBeforeUnmount(() => {
    mounted = false
    observer?.disconnect()
    cancelAnimationFrame(frame)
    media?.revert()
  })
}
