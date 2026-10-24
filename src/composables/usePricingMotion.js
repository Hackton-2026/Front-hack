import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { gsap, revealTitleCharacters } from '../utils/motion'

gsap.registerPlugin(ScrollTrigger, SplitText)

/** Entradas e interações da página de preços, limitadas ao seu próprio DOM. */
export function usePricingMotion(root, yearly) {
  let mounted = false
  let media
  let observer
  let refreshFrame = 0
  let priceVersion = 0
  let animatePrices = () => {}
  let animateAnswer = () => {}

  function refreshLayout() {
    if (!mounted || refreshFrame) return
    refreshFrame = requestAnimationFrame(() => {
      refreshFrame = 0
      if (mounted) ScrollTrigger.refresh()
    })
  }

  onMounted(() => {
    if (!root.value) return
    mounted = true
    media = gsap.matchMedia()
    media.add({
      desktop: '(min-width: 901px)',
      mobile: '(max-width: 900px)',
      reduced: '(prefers-reduced-motion: reduce)',
    }, context => {
      if (context.conditions.reduced) return
      const select = gsap.utils.selector(root.value)
      const title = select('.pricing-heading h1')[0]

      if (title) {
        SplitText.create(title, {
          type: 'words,chars', wordsClass: 'editorial-word', charsClass: 'editorial-char',
          autoSplit: true, aria: 'auto',
          onSplit: split => revealTitleCharacters(split.chars),
        })
      }

      const intro = gsap.timeline({ defaults: {
        autoAlpha: 0, y: 16, duration: 0.8, ease: 'power3.out',
        clearProps: 'transform,opacity,visibility',
      } })
      const lead = select('.pricing-heading__lead')
      const billing = select('.pricing-billing')
      if (lead.length) intro.from(lead, {}, 0.45)
      if (billing.length) intro.from(billing, { y: 12 }, 0.6)

      // A entrada fica no artigo; a superfície interna continua livre para o hover CSS.
      select('.price-card, [data-pricing-reveal]').forEach(element => {
        const card = element.matches('.price-card')
        if (!card && (element.closest('.price-card') || element.querySelector('.price-card, [data-pricing-reveal]'))) return
        gsap.from(element, {
          autoAlpha: 0, y: card ? 28 : 20, scale: card ? 0.985 : 1,
          duration: card ? 0.95 : 0.8, ease: 'power3.out',
          clearProps: 'transform,opacity,visibility',
          scrollTrigger: { trigger: element, start: 'top 91%', once: true },
        })
      })

      const glow = select('.pricing-enterprise__glow')[0]
      if (glow && context.conditions.desktop) {
        gsap.fromTo(glow, { y: -20, scale: 0.96 }, {
          y: 24, scale: 1.04, ease: 'none',
          scrollTrigger: {
            trigger: glow.parentElement, start: 'top bottom', end: 'bottom top', scrub: 1,
          },
        })
      }

      // context.add também rastreia os tweens criados depois de interações Vue.
      context.add('prices', () => {
        const prices = select('.pricing-price__value')
        if (!prices.length) return
        gsap.fromTo(prices, { y: 7, autoAlpha: 0.35 }, {
          y: 0, autoAlpha: 1, duration: 0.4, stagger: 0.04,
          ease: 'power2.out', overwrite: 'auto',
          clearProps: 'transform,opacity,visibility',
        })
      })
      context.add('answer', element => {
        if (!element) return
        gsap.fromTo(element, { y: 7, autoAlpha: 0 }, {
          y: 0, autoAlpha: 1, duration: 0.35, ease: 'power2.out',
          overwrite: 'auto', clearProps: 'transform,opacity,visibility',
        })
      })
      animatePrices = () => context.prices()
      animateAnswer = element => context.answer(element)

      return () => {
        animatePrices = () => {}
        animateAnswer = () => {}
      }
    }, root.value)

    observer = new ResizeObserver(refreshLayout)
    observer.observe(root.value)
    root.value.addEventListener('load', refreshLayout, true)
    document.fonts?.ready.then(refreshLayout)
    refreshLayout()
  })

  if (yearly) {
    watch(yearly, async () => {
      const version = ++priceVersion
      await nextTick()
      if (!mounted || version !== priceVersion) return
      animatePrices()
      refreshLayout()
    }, { flush: 'post' })
  }

  onBeforeUnmount(() => {
    mounted = false
    priceVersion++
    observer?.disconnect()
    cancelAnimationFrame(refreshFrame)
    root.value?.removeEventListener('load', refreshLayout, true)
    media?.revert()
  })

  return {
    revealAnswer: event => {
      const details = event.currentTarget || event.target
      if (details?.open) animateAnswer(details.querySelector('.pricing-faq__answer'))
      refreshLayout()
    },
  }
}
