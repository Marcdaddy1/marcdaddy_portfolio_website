import { gsap, ScrollTrigger } from './motion'

const fmt = (n: number) => Math.round(n).toLocaleString('en-GB')

/* ── Scroll behaviours. All content is static in index.html; these modules
      only attach animation and playback behaviour to it. ── */

export function initStats(): void {
  const nums = document.querySelectorAll<HTMLElement>('.stat-value .num')
  nums.forEach((num) => {
    const target = Number(num.dataset.value)
    const state = { v: 0 }
    num.textContent = '0'
    gsap.to(state, {
      v: target,
      duration: 1.8,
      ease: 'power2.out',
      snap: { v: 1 },
      scrollTrigger: { trigger: num, start: 'top 85%', once: true },
      onUpdate: () => {
        num.textContent = fmt(state.v)
      },
    })
  })
}

/** Ensure the static final values are shown (reduced-motion path). */
export function setStatsFinal(): void {
  document.querySelectorAll<HTMLElement>('.stat-value .num').forEach((num) => {
    num.textContent = fmt(Number(num.dataset.value))
  })
}

export function initPillarReveals(): void {
  const rows = document.querySelectorAll<HTMLElement>('.pillar, .venture')
  rows.forEach((row, i) => {
    gsap.from(row, {
      y: 80,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      delay: (i % 4) * 0.08,
      scrollTrigger: { trigger: row, start: 'top 85%', once: true },
    })
  })
  const about = document.querySelector<HTMLElement>('.about-copy')
  if (about) {
    gsap.from(about, {
      y: 60,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: about, start: 'top 85%', once: true },
    })
  }
}

export function initWorkCards(motionAllowed: boolean): void {
  const cards = document.querySelectorAll<HTMLElement>('.work-card')
  cards.forEach((card, i) => {
    if (motionAllowed) {
      gsap.from(card, {
        y: 90,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        delay: (i % 4) * 0.1,
        scrollTrigger: { trigger: card.parentElement, start: 'top 85%', once: true },
      })
    }
    // pointer tilt only on hover-capable devices
    if (!motionAllowed || !window.matchMedia('(hover: hover)').matches) return
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width - 0.5
      const py = (e.clientY - r.top) / r.height - 0.5
      gsap.to(card, {
        rotateY: px * 8,
        rotateX: -py * 8,
        scale: 1.02,
        duration: 0.4,
        ease: 'power2.out',
        transformPerspective: 800,
      })
    })
    card.addEventListener('pointerleave', () => {
      gsap.to(card, { rotateY: 0, rotateX: 0, scale: 1, duration: 0.6, ease: 'power3.out' })
    })
  })
}

/**
 * Lazy-load background videos and play/pause on viewport enter/leave.
 * Runs for everyone, including prefers-reduced-motion — owner's call: these
 * are muted decorative brand clips, and gating them made the site look
 * broken (poster-only) on any machine with OS-level reduced motion.
 */
export function initVideos(): void {
  const videos = document.querySelectorAll<HTMLVideoElement>('video.media-bg')
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const video = entry.target as HTMLVideoElement
        if (entry.isIntersecting) {
          if (!video.src && video.dataset.src) {
            video.src = video.dataset.src
            video.load()
          }
          video.play().catch(() => {}) // autoplay may be blocked; poster covers us
        } else {
          video.pause()
        }
      }
    },
    { rootMargin: '25% 0px' }
  )
  videos.forEach((v) => io.observe(v))
}

export { ScrollTrigger }
