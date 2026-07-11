import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

// ?motion=full / ?motion=reduced overrides the OS setting (dev/testing aid)
export const prefersReducedMotion = () => {
  const override = new URLSearchParams(location.search).get('motion')
  if (override === 'full') return false
  if (override === 'reduced') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export const isMobile = () =>
  window.matchMedia('(max-width: 767px)').matches ||
  window.matchMedia('(pointer: coarse)').matches

export function initSmoothScroll(): Lenis {
  const lenis = new Lenis({ lerp: 0.1 })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
  return lenis
}

export { gsap, ScrollTrigger }
