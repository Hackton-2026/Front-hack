import { gsap } from './motion'

export const vTutorialMotion = {
  mounted(root) {
    const media = gsap.matchMedia()
    root._tutorialMotion = media

    media.add('(prefers-reduced-motion: no-preference)', () => {
      const intro = root.querySelector('.intro')
      if (intro) {
        gsap.from(intro.children, {
          y: 34,
          autoAlpha: 0,
          filter: 'blur(6px)',
          stagger: 0.14,
          duration: 1.15,
          ease: 'power3.out',
          clearProps: 'transform,opacity,visibility,filter',
        })
      }

      root.querySelectorAll('main.guide > section').forEach((section) => {
        const number = section.querySelector('.step-number')
        const heading = section.querySelector('.step-heading > div, .image-description')
        const figure = section.querySelector('figure')
        const timeline = gsap.timeline({
          scrollTrigger: { trigger: section, start: 'top 83%', once: true },
          defaults: { ease: 'power3.out' },
        })

        timeline.fromTo(
          section,
          { '--line-progress': 0 },
          {
            '--line-progress': 1,
            duration: 1.2,
          },
          0
        )

        if (number) {
          timeline.from(
            number,
            {
              y: 24,
              autoAlpha: 0,
              filter: 'blur(4px)',
              transformOrigin: 'left bottom',
              duration: 1.15,
              clearProps: 'transform,opacity,visibility,filter',
            },
            0.05
          )
        }

        if (heading) {
          timeline.from(
            heading.children,
            {
              y: 24,
              autoAlpha: 0,
              stagger: 0.12,
              duration: 0.9,
              clearProps: 'transform,opacity,visibility',
            },
            0.2
          )
        } else if (!figure) {
          timeline.from(
            section.children,
            {
              y: 24,
              autoAlpha: 0,
              stagger: 0.1,
              duration: 0.9,
              clearProps: 'transform,opacity,visibility',
            },
            0.15
          )
        }

        if (figure) {
          timeline.from(
            figure,
            {
              y: 40,
              scale: 0.96,
              autoAlpha: 0,
              duration: 1.2,
              clearProps: 'transform,opacity,visibility',
            },
            0.22
          )
        }
      })

      const end = root.querySelector('.guide-end')
      if (end) {
        gsap.from(end.children, {
          y: 20,
          autoAlpha: 0,
          stagger: 0.15,
          duration: 0.85,
          ease: 'power3.out',
          clearProps: 'transform,opacity,visibility',
          scrollTrigger: { trigger: end, start: 'top 90%', once: true },
        })
      }

      const cleanups = []
      if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
        root.querySelectorAll('.video-placeholder').forEach((card) => {
          const move = (event) => {
            const rect = card.getBoundingClientRect()
            card.style.setProperty(
              '--pointer-x',
              `${((event.clientX - rect.left) / rect.width) * 100}%`
            )
            card.style.setProperty(
              '--pointer-y',
              `${((event.clientY - rect.top) / rect.height) * 100}%`
            )
          }
          card.addEventListener('pointermove', move)
          cleanups.push(() => {
            card.removeEventListener('pointermove', move)
            card.style.removeProperty('--pointer-x')
            card.style.removeProperty('--pointer-y')
          })
        })
      }
      return () => cleanups.forEach((cleanup) => cleanup())
    })
  },
  unmounted(root) {
    root._tutorialMotion?.revert()
    delete root._tutorialMotion
  },
}
