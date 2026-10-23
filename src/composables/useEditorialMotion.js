import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { Flip } from 'gsap/Flip'
import { gsap, prefersReducedMotion } from '../utils/motion'

// Este módulo só é carregado pelas páginas editoriais.
gsap.registerPlugin(SplitText, Flip)

/** Movimento compartilhado pelo blog e pelo guia, sem alterar a rolagem nativa. */
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
        type: 'lines', mask: 'lines', linesClass: 'editorial-line',
        autoSplit: true, aria: 'auto',
        onSplit(split) {
          return gsap.timeline({ defaults: { ease: 'power4.out' } })
            .from(split.lines, { yPercent: 105, autoAlpha: 0, duration: 1.05, stagger: 0.11 }, 0.08)
        },
      })
    }

    const intro = gsap.timeline({ defaults: { duration: 0.7, ease: 'power3.out', clearProps: 'transform,opacity,visibility' } })
    intro.from(select(isBlog ? '.news-heading__top' : '.breadcrumbs, .article-head__meta'), { y: 12, autoAlpha: 0, stagger: 0.06 }, 0)
      .from(select(isBlog ? '.news-heading__row > p' : '.article-head__lead, .article-head__byline'), { y: 18, autoAlpha: 0, stagger: 0.1 }, 0.25)

    const cover = select(isBlog ? '.news-feature' : '.article-cover')[0]
    if (cover) {
      reveal([cover], cover, { y: 32, duration: 1, stagger: 0 })
      reveal(select(isBlog ? '.news-feature__content > *' : '.article-cover__words > *, .article-cover__demo'), cover, { y: 18, stagger: 0.09 })

      // A foto se move dentro da moldura, sem deslocar o conteúdo.
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
      const explore = select('.explore-section')[0]
      reveal(select('.explore-section__head, .explore-card'), explore, { y: 28, stagger: 0.12 })
    }

    // As interações também são rastreadas pelo contexto e limpas ao sair.
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
      // Só as cartas já reveladas mudam de posição; as novas têm sua entrada.
      if (previousState && existing.length) {
        Flip.from(previousState, {
          targets: existing, duration: 0.55, ease: 'power3.inOut',
          scale: true, prune: true, stagger: 0.025,
        })
      }
      previousState = null
      const fresh = cards.filter(card => !revealedCards.has(card))
      if (!fresh.length) return
      gsap.set(fresh, { autoAlpha: 0, y: 28 })
      context.add('revealCards', batch => {
        batch.forEach(card => revealedCards.add(card))
        gsap.to(batch, {
          autoAlpha: 1, y: 0, duration: 0.75, stagger: 0.07, ease: 'power3.out',
          overwrite: 'auto', clearProps: 'transform,opacity,visibility',
        })
      })
      ScrollTrigger.batch(fresh, {
        start: 'top 94%', interval: 0.07, batchMax: 3,
        once: true, onEnter: context.revealCards,
      })
    }, root.value)
  }

  if (items) {
    // Captura antes do patch Vue e mede depois que a nova grade está pronta.
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
