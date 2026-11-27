import { onBeforeUnmount, onMounted } from 'vue'
import { SplitText } from 'gsap/SplitText'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { EASE, gsap, revealTitleCharacters } from '../utils/motion'

gsap.registerPlugin(SplitText)

export function useContactMotion(root) {
  let media
  let observer
  let frame = 0
  let mounted = false
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
        onSplit: split => revealTitleCharacters(split.chars, { duration: 0.55, stagger: 0.025, delay: 0.05 }),
      })

      gsap.timeline({ defaults: {
        autoAlpha: 0, y: 14, duration: 0.45, ease: EASE.out,
        clearProps: 'transform,opacity,visibility',
      } })
        .from(select('.contact-intro__lead'), {}, 0.16)
        .from(select('.contact-shortcut'), { stagger: 0.05 }, 0.24)
        .from(select('.contact-panel'), { y: 16, duration: 0.5 }, 0.12)

      select('[data-contact-reveal]').forEach(element => {
        gsap.from(element, {
          autoAlpha: 0, y: 14, duration: 0.45, ease: EASE.out,
          clearProps: 'transform,opacity,visibility',
          scrollTrigger: { trigger: element, start: 'top 90%', once: true },
        })
      })

      context.add('answer', element => {
        if (!element) return
        gsap.fromTo(element, { y: 6, autoAlpha: 0 }, {
          y: 0, autoAlpha: 1, duration: 0.22, ease: EASE.out,
          overwrite: 'auto', clearProps: 'transform,opacity,visibility',
        })
      })
      animateAnswer = element => context.answer(element)
      return () => { animateAnswer = () => {} }
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
    revealAnswer: event => {
      if (event.target.open) animateAnswer(event.target.querySelector('.contact-faq__answer'))
      refresh()
    },
  }
}
