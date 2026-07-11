# Phase 1 — Kie.ai clip generation (runbook)

Blocked on two inputs, then it's a 20-minute job:

1. **Identity photo** → save as `assets/identity/identity-photo.jpg`
2. **Go-ahead to spend** on Kie.ai generation (1 image + 3 videos, plus any regens)

## Pipeline (identity-lock strategy)

1. **Canonical keyframe** (image model — Nano Banana Pro via media-gen registry):
   prompt in `prompts/01-canonical-keyframe.md`, with the identity photo as the
   image reference. Output → `generation/canonical-keyframe.png`. This is the
   visual anchor for all three clips.
2. **Three clips** (Seedance 2.0, image-to-video): each uses the canonical
   keyframe (or a derived start-frame in the right pose) as the start frame, so
   face + wardrobe stay locked. Prompts in `prompts/02–04`. The wardrobe
   sentence is IDENTICAL VERBATIM in all three — do not reword it per clip.
   Params for every clip: 1080p, 16:9, no audio, ~8s, reuse the same seed if
   the endpoint exposes one.
3. **Poll → download** each task until complete; save MP4s to
   `generation/clips/hero-orbit.mp4`, `builder.mp4`, `closer.mp4`.
   Fire sequentially, not all three blind: generate HERO ORBIT first, check
   identity consistency, then reuse its confirmed look for the other two.
   Retry failed tasks up to 2× with backoff; respect rate limits.
4. **Consistency gate**: compare face, wardrobe, and rim-light colour across
   the three clips. Any drift → regenerate that clip before integration.
   For HERO ORBIT also check the loop: last frame must ≈ first frame.

## Integration (after clips pass the gate)

```powershell
cd "projects/portfolio"
node scripts/extract-hero-frames.mjs generation/clips/hero-orbit.mp4
Copy-Item generation/clips/builder.mp4 public/video/builder.mp4
Copy-Item generation/clips/closer.mp4 public/video/closer.mp4
ffmpeg -y -i public/video/builder.mp4 -frames:v 1 -q:v 4 public/video/builder-poster.jpg
ffmpeg -y -i public/video/closer.mp4 -frames:v 1 -q:v 4 public/video/closer-poster.jpg
```

If extracted frame counts differ from 240 (desktop) / 120 (mobile), update
`FRAMES` in `src/config.ts`.

Easiest path: tell Claude Code "photo is at assets/identity/identity-photo.jpg,
run Phase 1" — the media-gen skill handles model selection, polling, and
retries against the kie.ai API.
