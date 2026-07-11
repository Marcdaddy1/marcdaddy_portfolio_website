import { gsap, ScrollTrigger } from './motion'

/** Split element text into per-character spans. Returns the char spans. */
export function splitChars(el: HTMLElement, text: string): HTMLElement[] {
  el.textContent = ''
  const chars: HTMLElement[] = []
  for (const ch of text) {
    const span = document.createElement('span')
    span.className = 'char' + (ch === ' ' ? ' space' : '')
    span.textContent = ch === ' ' ? ' ' : ch
    el.appendChild(span)
    chars.push(span)
  }
  return chars
}

/** Letter-by-letter track-in, played immediately (hero entry). */
export function revealNow(chars: HTMLElement[], delay = 0): void {
  gsap.from(chars, {
    yPercent: 120,
    opacity: 0,
    duration: 0.9,
    ease: 'power4.out',
    stagger: 0.045,
    delay,
  })
}

/** Letter-by-letter reveal when the element scrolls into view. */
export function revealOnScroll(el: HTMLElement, chars: HTMLElement[]): void {
  gsap.from(chars, {
    yPercent: 120,
    opacity: 0,
    duration: 0.8,
    ease: 'power4.out',
    stagger: 0.03,
    scrollTrigger: { trigger: el, start: 'top 80%', once: true },
  })
}

/** Simple fade/translate reveal for blocks. */
export function blockReveal(els: HTMLElement[] | NodeListOf<HTMLElement>, stagger = 0.15): void {
  Array.from(els).forEach((el, i) => {
    gsap.from(el, {
      y: 60,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      delay: (i % 3) * 0.02,
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    })
  })
  void stagger
}

export { ScrollTrigger }
