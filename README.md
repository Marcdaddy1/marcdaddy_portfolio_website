# Cinematic 3D-Scroll Portfolio

Awwwards-style personal portfolio: canvas frame-sequence hero orbit scrubbed
by scroll, GSAP ScrollTrigger + Lenis, ink-black / emerald / cream design
system, big condensed display type (Anton).

## Run

```powershell
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build to dist/
```

Deploy: **live at https://marcdaddy.vercel.app** (Vercel project `portfolio`,
team marcdaddybusiness-8725, deployment protection off). Redeploy with
`npx vercel deploy --prod --yes`. Final home will be marcdaddy.com on
Hostinger — point the domain's A/CNAME at Vercel or upload `dist/` to
Hostinger static hosting when ready.

## Status

**Complete.** Real copy is static in `index.html` (SEO: crawlers see full
content without JS) and all three Kie.ai clips
of Marcus are integrated (generated 2026-07-05: GPT Image 2 keyframes +
Seedance 2.0 clips, 1080p/8s/24fps, sources in `generation/`). Hero orbit runs
as 193 desktop / 97 mobile webp frames. To regenerate or replace a clip, see
[generation/README.md](generation/README.md).

## Swap in your content (2 steps)

1. **Copy** — edit `index.html`. Every name, stat, pillar, project, CTA,
   button and social lives there as static markup (deliberate — crawlers must
   see content without JS). Stat count-up values use `data-value` attributes.
2. **Clips** — follow `generation/README.md`: generate the three Kie.ai
   clips, then `node scripts/extract-hero-frames.mjs generation/clips/hero-orbit.mp4`
   and copy builder/closer MP4s + posters into `public/video/`.

## File structure

```
index.html                     page shell (all sections, semantic)
src/
  config.ts                    frame-set config (content is in index.html)
  main.ts                      boot: preloader → scrub → animations
  styles/main.css              design tokens, layout, grain, reduced-motion CSS
  modules/
    motion.ts                  GSAP + ScrollTrigger + Lenis wiring, media queries
    hero-scrub.ts              frame preloader (ImageBitmap) + canvas scrub + pin
    text-reveal.ts             letter-by-letter splits and reveals
    sections.ts                DOM build, stats count-up, pillars, cards, videos
scripts/
  generate-placeholder-frames.mjs   placeholder orbit (240 desktop / 120 mobile)
  generate-placeholder-videos.mjs   placeholder builder/closer MP4s (ffmpeg)
  extract-hero-frames.mjs           real clip → webp frame sequences (ffmpeg)
public/
  frames/desktop|mobile/       hero orbit frames (webp)
  video/                       builder/closer MP4s + posters
generation/                    Phase 1 Kie.ai runbook + locked prompts
assets/identity/               ← drop identity-photo.jpg here
```

## How it works

- **Hero scrub**: all frames are fetched and decoded to `ImageBitmap`s up
  front (preloader shows real %). The hero pins for 300% viewport height;
  ScrollTrigger (`scrub: 0.5`) maps progress → frame index; a single rAF loop
  repaints the canvas only when the index changes. DPR capped at 2.
- **Mobile** (<768px or coarse pointer): loads the 120-frame 720px set
  (~0.5MB total) instead of 240 desktop frames.
- **Reduced motion**: static first frame, no pin/scrub/Lenis, no entrance
  animations, grain animation off — plain scrolling document.
  Dev override: `?motion=full` / `?motion=reduced` (this dev machine has
  reduced-motion ON at OS level, so use `?motion=full` to preview the show).
- **Videos**: lazy `data-src` via IntersectionObserver, play on enter / pause
  on leave, poster images so nothing flashes empty.
- **Grain**: SVG feTurbulence data-URI, stepped CSS animation — no PNG.
