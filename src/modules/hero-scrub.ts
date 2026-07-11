import { gsap, ScrollTrigger } from './motion'
import { FRAMES } from '../config'

type FrameSet = typeof FRAMES.desktop

// Canvas frame-sequence scrub: frames are decoded to ImageBitmaps up front,
// scroll progress maps to a frame index, and drawing happens in a single rAF
// loop that only repaints when the index actually changes.
export class HeroScrub {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private set: FrameSet
  private frames: (ImageBitmap | HTMLImageElement)[] = []
  private targetIndex = 0
  private drawnIndex = -1
  private rafId = 0

  constructor(canvas: HTMLCanvasElement, mobile: boolean) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.set = mobile ? FRAMES.mobile : FRAMES.desktop
    this.resize()
    // ResizeObserver, not window 'resize': it also fires when the element
    // gains size without a window event (restored tab, rotation, embeds).
    const onResize = () => {
      this.resize()
      this.drawnIndex = -1 // force repaint at new size
    }
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(onResize).observe(canvas)
    } else {
      window.addEventListener('resize', onResize)
    }
  }

  private frameUrl(i: number): string {
    return `${this.set.dir}/hero_${String(i + 1).padStart(4, '0')}.webp`
  }

  /**
   * Preload all frames. NEVER rejects: each frame gets 3 attempts
   * (fetch+createImageBitmap, then <img> fallback); a frame that still fails
   * stays null and draw() substitutes the nearest loaded neighbour. One flaky
   * request must not cost the whole scrub.
   */
  async load(onProgress: (pct: number) => void): Promise<void> {
    const { count } = this.set
    this.frames = new Array(count).fill(null)
    let done = 0

    const acquire = async (i: number): Promise<void> => {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await fetch(this.frameUrl(i))
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const blob = await res.blob()
          this.frames[i] = await createImageBitmap(blob)
          return
        } catch {
          try {
            this.frames[i] = await new Promise<HTMLImageElement>((resolve, reject) => {
              const img = new Image()
              img.onload = () => resolve(img)
              img.onerror = () => reject(new Error('img decode failed'))
              img.src = this.frameUrl(i) + (attempt ? `?retry=${attempt}` : '')
            })
            return
          } catch {
            await new Promise((r) => setTimeout(r, 300 * (attempt + 1)))
          }
        }
      }
    }

    const CONCURRENCY = 12
    let next = 0
    const worker = async () => {
      while (next < count) {
        const i = next++
        await acquire(i)
        done++
        onProgress(Math.round((done / count) * 100))
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker))

    const missing = this.frames.reduce((n, f) => n + (f ? 0 : 1), 0)
    if (missing) {
      console.warn(`[hero-scrub] ${missing}/${count} frames failed to load; using nearest-frame fallback`)
    }
  }

  /** The frame at `index`, or the nearest loaded neighbour if it failed. */
  private frameAt(index: number): ImageBitmap | HTMLImageElement | null {
    const hit = this.frames[index]
    if (hit) return hit
    for (let d = 1; d < this.set.count; d++) {
      const before = this.frames[index - d]
      if (before) return before
      const after = this.frames[index + d]
      if (after) return after
    }
    return null
  }

  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = this.canvas.clientWidth * dpr
    this.canvas.height = this.canvas.clientHeight * dpr
  }

  private draw(): void {
    if (this.targetIndex === this.drawnIndex) return
    const frame = this.frameAt(this.targetIndex)
    if (!frame) return
    if (this.canvas.width === 0 || this.canvas.height === 0) {
      this.resize()
      if (this.canvas.width === 0 || this.canvas.height === 0) return // stay dirty; retry next frame
    }
    const { width: cw, height: ch } = this.canvas
    const fw = frame.width
    const fh = frame.height
    const scale = Math.max(cw / fw, ch / fh) // cover fit
    const dw = fw * scale
    const dh = fh * scale
    this.ctx.clearRect(0, 0, cw, ch)
    this.ctx.drawImage(frame, (cw - dw) / 2, (ch - dh) / 2, dw, dh)
    this.drawnIndex = this.targetIndex
    ;(window as unknown as Record<string, unknown>).__heroFrame = this.drawnIndex
  }

  drawFrame(index: number): void {
    this.targetIndex = Math.max(0, Math.min(this.set.count - 1, index))
    this.draw()
  }

  /** Pin the hero and scrub one full orbit across the pin distance. */
  attachScrub(heroEl: HTMLElement): void {
    const loop = () => {
      this.draw()
      this.rafId = requestAnimationFrame(loop)
    }
    this.rafId = requestAnimationFrame(loop)

    const state = { frame: 0 }
    gsap.to(state, {
      frame: this.set.count - 1,
      ease: 'none',
      scrollTrigger: {
        trigger: heroEl,
        start: 'top top',
        end: '+=300%',
        pin: true,
        scrub: 0.5,
        anticipatePin: 1,
      },
      onUpdate: () => {
        this.targetIndex = Math.round(state.frame) % this.set.count
      },
    })
  }

  destroy(): void {
    cancelAnimationFrame(this.rafId)
  }
}

export { ScrollTrigger }
