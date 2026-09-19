# CLAUDE.md — Portfolio

Personal portfolio site for Marc (AegeanPulse). Awwwards-style: a canvas
frame-sequence hero orbit scrubbed by scroll, GSAP ScrollTrigger + Lenis,
ink-black / emerald / cream palette, big condensed display type (Anton).

Deployed on Vercel. Repo: `Marcdaddy1/marcdaddy_portfolio_website`.

## Stack

Vite + TypeScript, no framework. GSAP ScrollTrigger, Lenis smooth scroll.

## Commands

```powershell
npm install
npm run dev              # http://localhost:5173
npm run build            # tsc --noEmit && vite build -> dist/
npm run preview
npm run extract-frames   # pull hero frames out of a source video
```

`npm run frames` / `npm run videos` generate placeholders — only for local work
when the real assets aren't present.

## Conventions

- The hero is a **frame sequence**, not a `<video>`. Scroll position maps to a
  frame index; keep decode cheap and preload in order or the orbit judders.
- Generated media lives in `generation/<YYYY-MM-DD-slug>/`; finals go to
  `public/`. Don't commit intermediate renders.
- `portfolio-dist.zip` in the repo root is a build artifact — don't edit it by
  hand and don't treat it as a source of truth.

## Verify before calling it done

Run `npm run build` (it type-checks), then load the page and scrub the hero
end to end — a dropped or out-of-order frame only shows under real scrolling.

## Gotcha

This machine has **reduced-motion ON**, so scroll animations render static
here. Gate fallbacks behind a mounted check and switch motion back on before
demoing.
