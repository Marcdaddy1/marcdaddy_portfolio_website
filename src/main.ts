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

/**
 * True rendered width of the title's glyphs.
 *
 * NOT scrollWidth: the h1 is `overflow: hidden`, so its scrollWidth clamps to
 * clientWidth and can never report that the text fits with room to spare —
 * measuring that way shaved a slice off the size on every single fit. A Range
 * over the contents reports the real laid-out width in both directions, and
 * works whether the title is a bare text node or the split .word/.char spans.
 */
function titleInkWidth(): number {
  const range = document.createRange()
  range.selectNodeContents(titleEl)
  const width = range.getBoundingClientRect().width
  range.detach()
  return width
}

let lastFitWidth = -1

/**
 * Scale the one-line hero title down until it fits.
 *
 * Measured against the h1's OWN content box, never the parent's clientWidth:
 * clientWidth INCLUDES padding, and .hero-content carries up to 48px a side.
 *
 * Iterative rather than one ratio pass, because letter-spacing adds a trailing
 * advance that doesn't scale with the ratio. SAFETY keeps the last glyph off
 * the clip edge.
 *
 * Pass force=true when the width is unchanged but the metrics are not — after
 * the webfont swaps in, or after the text is split into spans.
 */
function fitHeroTitle(force = false): void {
  const available = titleEl.clientWidth
  if (available <= 0) return // not laid out yet; the observer will call back
  if (!force && available === lastFitWidth) return
  lastFitWidth = available

  titleEl.style.fontSize = '' // back to the CSS clamp value before measuring
  const target = available - 2 // px of safety
  for (let pass = 0; pass < 4; pass++) {
    const ink = titleInkWidth()
    if (ink <= target || ink <= 0) break
    const current = parseFloat(getComputedStyle(titleEl).fontSize)
    const next = Math.floor(current * (target / ink) * 100) / 100
    if (!(next > 0) || next >= current) break
    titleEl.style.fontSize = `${next}px`
  }
}

/**
 * Re-fit on ANY width change, from any cause.
 *
 * A debounced window-resize listener was not enough: between the resize and
 * the debounce the title kept the inline size computed for the OLD width, and
 * `overflow: hidden` clipped the overhang — a 1440→800 change left a 171.5px
 * title in a 726px box, which is exactly the truncated "ARAGBAY" with the last
 * letter cut off. ResizeObserver fires after layout and before paint, so the
 * clipped frame never reaches the screen, and it also covers the cases a
 * resize event misses: rotation, zoom, a scrollbar appearing, DevTools.
 */
function observeHeroTitleWidth(): void {
  if (typeof ResizeObserver === 'undefined') return
  new ResizeObserver(() => fitHeroTitle()).observe(titleEl)
}

/**
 * Fit once the display face has actually loaded.
 *
 * `document.fonts.ready` alone is not enough: it resolves when the font set is
 * idle, which can be BEFORE the browser has requested a face nothing has
 * painted yet. The fit then measures the 'Arial Narrow' fallback and lands
 * wrong when the Bebas Neue metrics swap in. Ask for the face explicitly.
 */
async function fitWhenFontsReady(): Promise<void> {
  try {
    await document.fonts.load('400 10rem "Bebas Neue"')
    await document.fonts.ready
  } catch {
    /* fall through and fit against whatever is rendering */
  }
  fitHeroTitle(true)
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
 * Give the pin something to deliver: the supporting line fades in over the
 * first fifth of the rotation, so the scroll buys information rather than
 * just spectacle. Driven by the pin's own progress — an independent
 * ScrollTrigger on the pinned element gets its start displaced by the pin
 * spacer and never plays inside the pin at all.
 */
function stageHeroCopy(progress: number): void {
  const micro = document.querySelector<HTMLElement>('.hero-micro')
  if (!micro) return
  const t = Math.min(1, Math.max(0, progress / 0.2))
  micro.style.opacity = String(t)
  micro.style.transform = `translateY(${(1 - t) * 14}px)`
}

async function boot(): Promise<void> {
  observeHeroTitleWidth()
  void fitWhenFontsReady()

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
  requestAnimationFrame(() => fitHeroTitle(true)) // re-check once the split spans have laid out

  // Release the overlay once the opening frames are decoded; the remainder of
  // the orbit streams behind a usable page. The whole sequence used to have to
  // land first, so nothing was readable for seconds on a mid-speed connection.
  await scrub.load((pct) => {
    pctEl.textContent = `${pct}%`
    fillEl.style.width = `${pct}%`
  }, READY_FRAMES)

  scrub.drawFrame(0)
  finishPreloader()
  stageHeroCopy(0) // set the start state before the first scroll event
  scrub.attachScrub(heroEl, stageHeroCopy)
  initScrollProgress()

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
