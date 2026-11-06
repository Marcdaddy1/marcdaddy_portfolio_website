import './styles/main.css'
import { gsap, initSmoothScroll, prefersReducedMotion, isMobile, ScrollTrigger } from './modules/motion'
import { HeroScrub } from './modules/hero-scrub'
import { splitChars, revealNow, revealOnScroll } from './modules/text-reveal'
import {
  initStats,
  setStatsFinal,
  initPillarReveals,
  initWorkCards,
  initVideos,
} from './modules/sections'

const preloader = document.getElementById('preloader')!
const pctEl = document.getElementById('preloader-pct')!
const fillEl = document.getElementById('preloader-fill')!
const canvas = document.getElementById('hero-canvas') as HTMLCanvasElement
const heroEl = document.getElementById('hero')!
const titleEl = document.getElementById('hero-title')!
const finaleEl = document.getElementById('finale-headline')!

const reduced = prefersReducedMotion()
const mobile = isMobile()

/** Frames needed before the page is usable; the rest stream in behind it. */
const READY_FRAMES = 24

// Scale the one-line hero title down until it fits its container width.
function fitHeroTitle(): void {
  titleEl.style.fontSize = '' // reset to CSS clamp value before measuring
  const parent = titleEl.parentElement!
  const available = parent.clientWidth
  const width = titleEl.scrollWidth
  if (width > available) {
    const current = parseFloat(getComputedStyle(titleEl).fontSize)
    titleEl.style.fontSize = `${Math.floor(current * (available / width) * 100) / 100}px`
  }
}

function finishPreloader(): void {
  pctEl.textContent = '100%'
  fillEl.style.width = '100%'
  preloader.classList.add('done')
}

/** Page-wide progress rail. The page is ~9,500px with no sense of position. */
function initScrollProgress(): void {
  const rail = document.createElement('div')
  rail.className = 'scroll-progress'
  document.body.appendChild(rail)
  gsap.to(rail, {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: {
      start: 0,
      end: () => document.documentElement.scrollHeight - window.innerHeight,
      scrub: 0.3,
      invalidateOnRefresh: true,
    },
  })
}

/**
 * Give the pin something to deliver. The orbit held one frozen screen of copy
 * for its whole 300vh; the supporting line now arrives partway through the
 * rotation so the scroll buys information, not just spectacle.
 */
function stageHeroCopy(): void {
  const micro = document.querySelector('.hero-micro')
  if (!micro) return
  gsap.from(micro, {
    opacity: 0,
    y: 16,
    ease: 'none',
    scrollTrigger: {
      trigger: heroEl,
      start: 'top top',
      end: '+=90%',
      scrub: 0.5,
    },
  })
}

async function boot(): Promise<void> {
  document.fonts.ready.then(fitHeroTitle)

  // A resize without a reload used to strand the layout: the pin spacer kept
  // its old height (one session reached 28,710px) and the hero kept a stale
  // width. Debounced so a drag-resize doesn't thrash ScrollTrigger.
  let resizeTimer = 0
  const onResize = (): void => {
    window.clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(() => {
      fitHeroTitle()
      ScrollTrigger.refresh()
    }, 200)
  }
  window.addEventListener('resize', onResize)
  window.addEventListener('orientationchange', onResize)

  const scrub = new HeroScrub(canvas, mobile)
  initVideos()

  if (reduced) {
    // Reduced motion now actually reduces: one frame instead of 2.1MB, and no
    // 300vh pin. It previously paid the full cost of both and got neither.
    document.documentElement.classList.add('reduced-motion')
    setStatsFinal()
    await scrub.loadFirstFrameOnly()
    scrub.drawFrame(0)
    fitHeroTitle()
    finishPreloader()
    return
  }

  const lenis = initSmoothScroll()
  if (import.meta.env.DEV) {
    // QA handles for headless preview tooling (dev builds only)
    import('./modules/motion').then(({ gsap: g, ScrollTrigger: st }) => {
      ;(window as unknown as Record<string, unknown>).__pf = { gsap: g, ScrollTrigger: st, scrub, lenis }
    })
  }

  const titleChars = splitChars(titleEl, titleEl.textContent ?? '')
  const finaleChars = splitChars(finaleEl, finaleEl.textContent ?? '')
  fitHeroTitle()

  // Release the overlay once the opening frames are decoded; the remainder of
  // the orbit streams behind a usable page. The whole sequence used to have to
  // land first, so nothing was readable for seconds on a mid-speed connection.
  await scrub.load((pct) => {
    pctEl.textContent = `${pct}%`
    fillEl.style.width = `${pct}%`
  }, READY_FRAMES)

  scrub.drawFrame(0)
  finishPreloader()
  scrub.attachScrub(heroEl)
  initScrollProgress()
  stageHeroCopy()

  revealNow(titleChars, 0.35)
  revealOnScroll(finaleEl, finaleChars)
  initStats()
  initPillarReveals()
  initWorkCards(true)

  // Re-measure pin positions once late-loading resources settle. window
  // 'load' may already have fired by the time frame preloading finishes,
  // so check readyState instead of only listening.
  const refresh = () => ScrollTrigger.refresh()
  document.fonts.ready.then(refresh)
  if (document.readyState === 'complete') refresh()
  else window.addEventListener('load', refresh)
}

boot().catch((err) => {
  console.error('boot failed', err)
  finishPreloader() // never trap the user behind the loader
})
