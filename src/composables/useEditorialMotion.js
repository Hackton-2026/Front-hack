import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { Flip } from 'gsap/Flip'
import { gsap, prefersReducedMotion, revealTitleCharacters } from '../utils/motion'

gsap.registerPlugin(SplitText, Flip)

export function useEditorialMotion(root, { page, items } = {}) {
  let mounted = false
  let media
  let gridMedia
  let refreshFrame = 0
  let gridVersion = 0
  let observer
  const revealedCards = new WeakSet()

  function refreshLayout() {
    if (!mounted || refreshFrame) return
    refreshFrame = requestAnimationFrame(() => {
      refreshFrame = 0
      if (mounted) ScrollTrigger.refresh()
    })
  }

  function reveal(targets, trigger, vars = {}) {
    if (!targets.length) return
    return gsap.from(targets, {
      autoAlpha: 0, y: 24, duration: 0.8, stagger: 0.075,
      ease: 'power3.out', clearProps: 'transform,opacity,visibility',
      scrollTrigger: { trigger, start: 'top 89%', once: true },
      ...vars,
    })
  }

  function animatePage(context) {
    const select = gsap.utils.selector(root.value)
    const isBlog = page === 'blog'
    const title = select(isBlog ? '.news-heading h1' : '.article-head h1')[0]

    if (title) {
      SplitText.create(title, {
        type: 'words,chars', wordsClass: 'editorial-word', charsClass: 'editorial-char',
        autoSplit: true, aria: 'auto',
        onSplit(split) {
          return revealTitleCharacters(split.chars)
        },
      })
    }

    const intro = gsap.timeline({ defaults: { duration: 0.7, ease: 'power3.out', clearProps: 'transform,opacity,visibility' } })
    if (!isBlog) intro.from(select('.breadcrumbs'), { y: 12, autoAlpha: 0 }, 0)
    const introContent = isBlog ? [] : select('.article-head__lead, .article-head__byline')
    if (introContent.length) {
      intro.from(introContent, {
        y: -30, autoAlpha: 0, duration: 0.8, ease: 'expo.out', stagger: 0.08,
      }, 1.6)
    }

    const cover = select(isBlog ? '.news-feature' : '.article-cover')[0]
    if (cover) {
      reveal([cover], cover, { y: 32, duration: 1, stagger: 0 })
      reveal(select(isBlog ? '.news-feature__content > *' : '.article-cover__words > *, .article-cover__demo'), cover, { y: 18, stagger: 0.09 })

      if (context.conditions.desktop) {
        gsap.fromTo(select(isBlog ? '.news-feature__photo' : '.article-cover__photo'),
          { scale: 1.1, yPercent: -3 },
          { scale: 1.1, yPercent: 3, ease: 'none',
            scrollTrigger: { trigger: cover, start: 'top bottom', end: 'bottom top', scrub: 0.8 },
          })
      }
    }

    if (isBlog) {
      const feed = select('.news-feed__heading')[0]
      reveal(select('.news-feed__heading > *'), feed)
      reveal(select('.news-filters > button'), select('.news-filters')[0], { y: 12, stagger: 0.045, duration: 0.55 })
      const next = select('.news-next')[0]
      reveal(select('.news-next > *'), next, { stagger: 0.12 })
    } else {
      const sidebar = select('.reading-sidebar')[0]
      reveal(select('.reading-sidebar__sticky > *'), sidebar, { x: -12, y: 0, stagger: 0.08 })
      select('.article-section').forEach(section => {
        reveal([...section.children], section, { y: 20, stagger: 0.065 })
      })
      select('.flaticon--framed').forEach(icon => {
        reveal([icon], icon.parentElement, { y: 8, scale: 0.94, duration: 0.7, stagger: 0 })
      })
      const explore = select('.explore-section')[0]
      reveal(select('.explore-section__head, .explore-card'), explore, { y: 28, stagger: 0.12 })
    }

    context.add('openAnswer', details => {
      const answer = details.querySelector('p')
      if (answer) gsap.fromTo(answer, { y: 8, autoAlpha: 0 }, {
        y: 0, autoAlpha: 1, duration: 0.35, ease: 'power2.out',
        overwrite: 'auto', clearProps: 'transform,opacity,visibility',
      })
    })
    const onToggle = event => {
      if (event.target.matches('details') && event.target.open) context.openAnswer(event.target)
    }
    root.value.addEventListener('toggle', onToggle, true)
    return () => root.value?.removeEventListener('toggle', onToggle, true)
  }

  function animateGrid(previousState) {
    gridMedia = gsap.matchMedia()
    gridMedia.add('(prefers-reduced-motion: no-preference)', context => {
      const cards = [...root.value.querySelectorAll('.news-grid > .blog-card')]
      const existing = cards.filter(card => revealedCards.has(card))
      if (previousState && existing.length) {
        Flip.from(previousState, {
          targets: existing, duration: 0.55, ease: 'power3.inOut',
          scale: true, prune: true, stagger: 0.025,
        })
      }
      previousState = null
      const fresh = cards.filter(card => !revealedCards.has(card))
      if (!fresh.length) return
      const columns = matchMedia('(min-width: 1051px)').matches ? 3 : matchMedia('(min-width: 561px)').matches ? 2 : 1
      gsap.set(fresh, { autoAlpha: 0, y: 18 })
      fresh.forEach((card, index) => {
        const offset = (index % columns) * 0.065
        const entrance = gsap.timeline({
          defaults: { ease: 'power2.out', clearProps: 'transform,opacity,visibility' },
          scrollTrigger: { trigger: card, start: 'top 88%', once: true },
          onStart: () => revealedCards.add(card),
        })
        entrance.to(card, { autoAlpha: 1, y: 0, duration: 0.85 }, offset)
          .fromTo(card.querySelector('.blog-card__cover'), { scale: 1.025 }, { scale: 1, duration: 1.05 }, offset)
          .fromTo(card.querySelectorAll('h3, p, time'),
            { autoAlpha: 0, y: 8 },
            { autoAlpha: 1, y: 0, duration: 0.65, stagger: 0.065 }, offset + 0.12)
      })
    }, root.value)
  }

  if (items) {
    watch(items, () => {
      if (!mounted) return
      const version = ++gridVersion
      gridMedia?.revert()
      const cards = [...root.value.querySelectorAll('.news-grid > .blog-card')].filter(card => revealedCards.has(card))
      const state = cards.length && !prefersReducedMotion() ? Flip.getState(cards) : null
      nextTick(() => {
        if (!mounted || version !== gridVersion) return
        animateGrid(state)
        refreshLayout()
      })
    }, { flush: 'pre' })
  }

  onMounted(() => {
    mounted = true
    media = gsap.matchMedia()
    media.add({
      desktop: '(min-width: 761px)',
      mobile: '(max-width: 760px)',
      reduced: '(prefers-reduced-motion: reduce)',
    }, context => {
      if (context.conditions.reduced) return
      return animatePage(context)
    }, root.value)
    if (items) animateGrid()
    observer = new ResizeObserver(refreshLayout)
    observer.observe(root.value)
    root.value.addEventListener('load', refreshLayout, true)
    document.fonts?.ready.then(refreshLayout)
  })

  onBeforeUnmount(() => {
    mounted = false
    gridVersion++
    observer?.disconnect()
    cancelAnimationFrame(refreshFrame)
    root.value?.removeEventListener('load', refreshLayout, true)
    gridMedia?.revert()
    media?.revert()
  })
}
