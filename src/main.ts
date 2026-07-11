import './styles/main.css'
import { initSmoothScroll, prefersReducedMotion, isMobile, ScrollTrigger } from './modules/motion'
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

async function boot(): Promise<void> {
  document.fonts.ready.then(fitHeroTitle)
  window.addEventListener('resize', fitHeroTitle)

  const scrub = new HeroScrub(canvas, mobile)

  // The orbit scrub runs for EVERYONE — it is scroll-driven (only moves while
  // the user scrolls), so it is not autonomous motion. Reduced-motion users
  // skip the self-playing parts: smooth scroll, entrance animations,
  // count-ups, card tilt, and autoplaying background videos.
  let titleChars: HTMLElement[] = []
  let finaleChars: HTMLElement[] = []

  initVideos()

  if (reduced) {
    document.documentElement.classList.add('reduced-motion')
    setStatsFinal()
  } else {
    const lenis = initSmoothScroll()
    if (import.meta.env.DEV) {
      // QA handles for headless preview tooling (dev builds only)
      import('./modules/motion').then(({ gsap, ScrollTrigger }) => {
        ;(window as unknown as Record<string, unknown>).__pf = { gsap, ScrollTrigger, scrub, lenis }
      })
    }
    titleChars = splitChars(titleEl, titleEl.textContent ?? '')
    finaleChars = splitChars(finaleEl, finaleEl.textContent ?? '')
  }
  fitHeroTitle()

  await scrub.load((pct) => {
    pctEl.textContent = `${pct}%`
    fillEl.style.width = `${pct}%`
  })

  scrub.drawFrame(0)
  finishPreloader()
  scrub.attachScrub(heroEl)

  if (!reduced) {
    revealNow(titleChars, 0.35)
    revealOnScroll(finaleEl, finaleChars)
    initStats()
    initPillarReveals()
    initWorkCards(true)
  }

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
