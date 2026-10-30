import { onBeforeUnmount, onMounted } from 'vue'
import { SplitText } from 'gsap/SplitText'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { EASE, DUR, gsap, revealTitleCharacters } from '../utils/motion'

gsap.registerPlugin(SplitText)

export function useContactMotion(root) {
  let media
  let observer
  let frame = 0
  let mounted = false
  let animateFields = () => {}
  let animateAnswer = () => {}

  function refresh() {
    if (!mounted || frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      if (mounted) ScrollTrigger.refresh()
    })
  }

  onMounted(() => {
    mounted = true
    media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', context => {
      const select = gsap.utils.selector(root.value)
      SplitText.create(select('h1')[0], {
        type: 'words,chars', wordsClass: 'editorial-word', charsClass: 'editorial-char',
        autoSplit: true, aria: 'auto',
        onSplit: split => revealTitleCharacters(split.chars),
      })

      gsap.timeline({ defaults: {
        autoAlpha: 0, y: 20, duration: DUR.slow, ease: EASE.out,
        clearProps: 'transform,opacity,visibility',
      } })
        .from(select('.contact-intro__lead'), {}, 0.5)
        .from(select('.contact-shortcut'), { stagger: 0.1 }, 0.65)
        .from(select('.contact-panel'), { y: 30, duration: DUR.long }, 0.2)

      select('[data-contact-reveal]').forEach(element => {
        gsap.from(element, {
          autoAlpha: 0, y: 18, duration: DUR.slow, ease: EASE.out,
          clearProps: 'transform,opacity,visibility',
          scrollTrigger: { trigger: element, start: 'top 90%', once: true },
        })
      })

      context.add('fields', () => {
        gsap.fromTo(select('.contact-fields > *'), { y: 9, autoAlpha: 0 }, {
          y: 0, autoAlpha: 1, duration: DUR.fast, stagger: 0.045, ease: EASE.soft,
          overwrite: 'auto', clearProps: 'transform,opacity,visibility',
        })
      })
      context.add('answer', element => {
        gsap.fromTo(element, { y: 6, autoAlpha: 0 }, {
          y: 0, autoAlpha: 1, duration: DUR.fast, ease: EASE.soft,
          overwrite: 'auto', clearProps: 'transform,opacity,visibility',
        })
      })
      animateFields = () => context.fields()
      animateAnswer = element => context.answer(element)
      return () => { animateFields = () => {}; animateAnswer = () => {} }
    }, root.value)

    observer = new ResizeObserver(refresh)
    observer.observe(root.value)
    document.fonts?.ready.then(refresh)
  })

  onBeforeUnmount(() => {
    mounted = false
    observer?.disconnect()
    cancelAnimationFrame(frame)
    media?.revert()
  })

  return {
    revealFields: () => { animateFields(); refresh() },
    revealAnswer: event => {
      if (event.target.open) animateAnswer(event.target.querySelector('.contact-faq__answer'))
      refresh()
    },
  }
}
