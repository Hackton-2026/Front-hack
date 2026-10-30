import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { EASE, DUR, gsap, revealTitleCharacters } from '../utils/motion'

gsap.registerPlugin(ScrollTrigger, SplitText)

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
        autoAlpha: 0, y: 16, duration: DUR.slow, ease: EASE.out,
        clearProps: 'transform,opacity,visibility',
      } })
      const lead = select('.pricing-heading__lead')
      const billing = select('.pricing-billing')
      if (lead.length) intro.from(lead, {}, 0.45)
      if (billing.length) intro.from(billing, { y: 12 }, 0.6)

      select('.price-card, [data-pricing-reveal]').forEach(element => {
        const card = element.matches('.price-card')
        if (!card && (element.closest('.price-card') || element.querySelector('.price-card, [data-pricing-reveal]'))) return
        gsap.from(element, {
          autoAlpha: 0, y: card ? 28 : 20, scale: card ? 0.985 : 1,
          duration: card ? 0.95 : 0.8, ease: EASE.out,
          clearProps: 'transform,opacity,visibility',
          scrollTrigger: { trigger: element, start: 'top 91%', once: true },
        })
      })

      context.add('prices', () => {
        const prices = select('.pricing-price__value')
        if (!prices.length) return
        gsap.fromTo(prices, { y: 7, autoAlpha: 0.35 }, {
          y: 0, autoAlpha: 1, duration: DUR.fast, stagger: 0.04,
          ease: EASE.soft, overwrite: 'auto',
          clearProps: 'transform,opacity,visibility',
        })
      })
      context.add('answer', element => {
        if (!element) return
        gsap.fromTo(element, { y: 7, autoAlpha: 0 }, {
          y: 0, autoAlpha: 1, duration: DUR.fast, ease: EASE.soft,
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
